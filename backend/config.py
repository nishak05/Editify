import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_NAME = os.getenv("PROJECT_NAME", "poster-editor")
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR  = os.path.join(BACKEND_DIR, os.getenv("UPLOAD_DIR", "uploads"))
OUTPUT_DIR  = os.path.join(BACKEND_DIR, os.getenv("OUTPUT_DIR", "outputs"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 20))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)