import modal
import requests


image = modal.Image.debian_slim().pip_install("lancedb", "pandas", "numpy")
stub = modal.Stub(
    name="community-profiler",
    image=image,
    secrets=[modal.Secret.from_name("skyagi")],
)
volume = modal.SharedVolume().persist("community-lancedb-vol")


def download_lance_datasets(url: str):
    pass


@stub.function()
def square(x):
    print("This code is running on a remote worker!")
    return x**2
