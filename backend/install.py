import subprocess
import sys

required = [
    "fastapi",
    "uvicorn",
    "aksharamukha",
    "opencv-python",
    "pytesseract",
    "numpy",
    "httpx",
    "python-dotenv"
]

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

for pkg in required:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"Installing missing package: {pkg}")
        install(pkg)
