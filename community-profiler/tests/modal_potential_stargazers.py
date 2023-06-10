import requests
import zipfile
from pathlib import Path
from modal import Secret, Stub, Image, web_endpoint

image = Image.debian_slim().pip_install(
    "lancedb", "pandas", "tqdm", "PyGithub", "sentence-transformers"
)

stub = Stub(
    name="community-potential-stargazer",
    image=image,
    secrets=[Secret.from_name("skyagi")],
)


def download_db(repo: str):
    lance_db = requests.get(
        f"https://skyagi-public.s3.us-west-1.amazonaws.com/{repo}.zip"
    )
    with open(Path(f"{repo}.zip"), "wb") as f:
        f.write(lance_db.content)

    file = zipfile.ZipFile(Path(f"{repo}.zip"))
    file.extractall(".")


download_db("skyagi")
