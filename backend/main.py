from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import uuid
import os
from config import UPLOAD_DIR, PROJECT_NAME

app = FastAPI(title=PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"{PROJECT_NAME} API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "project": PROJECT_NAME}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only JPEG, PNG, WEBP images allowed")

    file_id = str(uuid.uuid4())
    extension = file.filename.split(".")[-1]
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.{extension}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return JSONResponse({
        "status": "uploaded",
        "file_id": file_id,
        "filename": file.filename,
        "saved_as": save_path
    })