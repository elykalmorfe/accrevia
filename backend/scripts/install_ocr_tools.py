"""Install Windows OCR tools without starting any application services."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import urllib.request
import zipfile


def main():
    if os.name != "nt":
        raise SystemExit("On Linux/macOS, install Tesseract and Poppler through your OS package manager.")
    backend = Path(__file__).resolve().parents[1]
    tesseract = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Tesseract-OCR" / "tesseract.exe"
    if not tesseract.is_file() and not shutil.which("tesseract"):
        subprocess.run(["winget", "install", "--id", "UB-Mannheim.TesseractOCR", "--exact", "--source", "winget", "--silent", "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity"], check=True)
    root = backend / "tools" / "poppler"
    if next(root.glob("*/Library/bin/pdftoppm.exe"), None):
        print("Poppler is already installed.")
        return
    root.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request("https://api.github.com/repos/oschwartz10612/poppler-windows/releases/latest", headers={"User-Agent": "Accrevia-setup"})
    with urllib.request.urlopen(request, timeout=30) as response:
        release = json.load(response)
    asset = next(item for item in release["assets"] if item["name"].startswith("Release-") and item["name"].endswith(".zip"))
    archive = root / asset["name"]
    urllib.request.urlretrieve(asset["browser_download_url"], archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    if asset.get("digest") and asset["digest"] != "sha256:" + digest:
        raise RuntimeError("Poppler download checksum mismatch.")
    with zipfile.ZipFile(archive) as source:
        for member in source.infolist():
            path = PurePosixPath(member.filename)
            destination = root.joinpath(*path.parts).resolve()
            if path.is_absolute() or ".." in path.parts or "\\" in member.filename or root.resolve() not in destination.parents:
                raise RuntimeError("Unsafe archive path.")
            if member.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with source.open(member) as incoming, destination.open("wb") as output:
                    shutil.copyfileobj(incoming, output)
    print("Installed Poppler", release["tag_name"], "SHA256", digest)
    print("Restart the backend to discover the installed OCR tools.")


if __name__ == "__main__":
    main()
