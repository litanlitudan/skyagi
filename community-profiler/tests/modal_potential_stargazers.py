import os
import lancedb
import requests
import zipfile
import pandas as pd

from pathlib import Path
from typing import List
from sentence_transformers import SentenceTransformer
from github import Github
from github.NamedUser import NamedUser
from tqdm import tqdm
from modal import Secret, Stub, SharedVolume, Image, web_endpoint

CACHE_DIR = "/cache"

image = Image.debian_slim().pip_install(
    "lancedb", "pandas", "tqdm", "PyGithub", "sentence-transformers"
)
volume = SharedVolume()
stub = Stub(
    name="community-potential-stargazer",
    image=image,
    secrets=[Secret.from_name("skyagi")],
)


def download_db(repo: str):
    lance_db = requests.get(
        f"https://skyagi-public.s3.us-west-1.amazonaws.com/{repo}.zip"
    )
    with open(Path(CACHE_DIR, f"{repo}.zip"), "wb") as f:
        f.write(lance_db.content)

    file = zipfile.ZipFile(Path(CACHE_DIR, f"{repo}.zip"))
    file.extractall(CACHE_DIR)


def find_relevant_repos(query: str, db_path: Path):
    model = SentenceTransformer("paraphrase-albert-small-v2")
    query_embedding = model.encode([query])[0]

    db = lancedb.connect(db_path)
    tbl = db.open_table("related_repos")
    relevant_repos = tbl.search(query_embedding).to_df()
    relevant_repos = relevant_repos.groupby(
        ["full_name", "created_at", "description", "stargazers_count"], as_index=False
    )["starred_by"].count()
    relevant_repos = relevant_repos.sort_values(
        by=["stargazers_count"], ascending=False
    )
    return relevant_repos


def get_stargazers(repo_fullname: str, github_token: str) -> List[NamedUser]:
    try:
        stargazers = Github(github_token).get_repo(repo_fullname).get_stargazers()
        return stargazers
    except Exception:
        print(f"[Error] failed to get stargazers of repo {repo_fullname}")
        return []


def aggregate_stargazers(repos: List[str], github_token: str) -> List[NamedUser]:
    stargazers = {}
    for repo in tqdm(repos):
        repo_stargazers = get_stargazers(repo, github_token)
        for stargazer in repo_stargazers:
            if stargazer.login not in stargazers:
                stargazers[stargazer.login] = stargazer
    return list(stargazers.values())


def diff_stargazers(
    existed_stargazers: List[NamedUser], relevant_stargazers: List[NamedUser]
) -> List[NamedUser]:
    diffed_stargazers = []
    existed_stargazers = {
        stargazer.login: stargazer for stargazer in existed_stargazers
    }
    for stargazer in tqdm(relevant_stargazers):
        if stargazer.login not in existed_stargazers:
            diffed_stargazers.append(stargazer)
    return diffed_stargazers


def users_to_df(users: List[NamedUser]) -> pd.DataFrame:
    data = []
    for user in users:
        data.append(
            {
                "login": user.login,
                "name": user.name,
                "email": user.email,
                "twitter_username": user.twitter_username,
                "bio": user.bio,
                "website": user.blog,
                "company": user.company,
                "followers": user.followers,
                "following": user.following,
                "location": user.location,
            }
        )
    df = pd.DataFrame(data)
    return df


def get_potential_stargazers(
    owner: str, repo: str, query: str, db_path: Path, github_token: str
) -> List[NamedUser]:
    repo_stargazers = get_stargazers(f"{owner}/{repo}", github_token)

    relevant_repos = list(find_relevant_repos(query, db_path)["full_name"])
    relevant_stargazers = aggregate_stargazers(relevant_repos, github_token)

    potential_stargazers = diff_stargazers(repo_stargazers, relevant_stargazers)
    return potential_stargazers


@stub.function(shared_volumes={CACHE_DIR: volume})
@web_endpoint(method="GET")
def web(owner: str, repo: str, query: str):
    # download db if not exist
    db_path = Path(CACHE_DIR, f"{repo}.lancedb")
    if not os.path.exists(db_path):
        print("DB not exist, downloading")
        download_db(repo)
    # get potential stargazers
    potential_stargazers = get_potential_stargazers(
        owner, repo, query, db_path, os.getenv("GITHUB_ACCESS_TOKEN")
    )
    df = users_to_df(potential_stargazers)
    return df.to_json()


@stub.function(shared_volumes={CACHE_DIR: volume})
def cli(owner: str, repo: str, query: str):
    # download db if not exist
    db_path = Path(CACHE_DIR, f"{repo}.lancedb")
    if not os.path.exists(db_path):
        print("DB not exist, downloading")
        download_db(repo)
    # get potential stargazers
    potential_stargazers = get_potential_stargazers(
        owner, repo, query, db_path, os.getenv("GITHUB_ACCESS_TOKEN")
    )
    df = users_to_df(potential_stargazers)
    print(df)
