import requests
import zipfile
from pathlib import Path


def download_db(repo="skyagi"):
    lance_db = requests.get(
        f"https://skyagi-public.s3.us-west-1.amazonaws.com/{repo}.zip"
    )
    with open(Path(f"{repo}.zip"), "wb") as f:
        f.write(lance_db.content)

    file = zipfile.ZipFile(Path(f"{repo}.zip"))
    file.extractall(".")


download_db()
