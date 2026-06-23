import os
import time
import uuid
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from config import UPLOAD_DIR, PROJECT_NAME
from database import Base, engine, get_db
from models import Project
from schemas import PipelineResponse, ProjectResponse
from crud import (
    create_project,
    update_project_ready,
    update_project_error,
    get_all_projects,
    get_project_by_file_id,
)
from pipeline import run_pipeline

# create DB tables on startup if they don't exist
Base.metadata.create_all(bind=engine)

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
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only JPEG, PNG, WEBP images allowed")

    # save uploaded file
    file_id   = str(uuid.uuid4())
    extension = file.filename.split(".")[-1]
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.{extension}")

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # save record to DB immediately — status: "uploaded"
    project = create_project(db, file.filename, file_id, save_path)

    # run AI pipeline
    start = time.time()
    try:
        result = run_pipeline(save_path)
        processing_ms = int((time.time() - start) * 1000)
        update_project_ready(db, file_id, len(result["layers"]), processing_ms)
    except Exception as e:
        update_project_error(db, file_id)
        raise HTTPException(500, f"Pipeline failed: {str(e)}")

    return JSONResponse({
        "project_id":           project.id,
        "file_id":              file_id,
        "filename":             file.filename,
        "image_w":              result["image_w"],
        "image_h":              result["image_h"],
        "background_base64":    result["background_base64"],
        "original_base64":      result["original_base64"],
        "layers":               result["layers"],
        "processing_time_s":    result["processing_time_s"],
    })


@app.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    """Return all past uploads — used by history page."""
    projects = get_all_projects(db)
    return [
        {
            "id":            p.id,
            "filename":      p.filename,
            "file_id":       p.file_id,
            "layer_count":   p.layer_count,
            "status":        p.status,
            "processing_ms": p.processing_ms,
            "created_at":    str(p.created_at),
        }
        for p in projects
    ]


@app.get("/projects/{file_id}")
def get_project(file_id: str, db: Session = Depends(get_db)):
    """Return one project's metadata by file_id."""
    project = get_project_by_file_id(db, file_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return {
        "id":            project.id,
        "filename":      project.filename,
        "file_id":       project.file_id,
        "layer_count":   project.layer_count,
        "status":        project.status,
        "processing_ms": project.processing_ms,
        "created_at":    str(project.created_at),
    }


@app.post("/inpaint")
async def inpaint_element(request: dict):
    """
    Accepts: {file_id, x, y, w, h}
    Returns: {inpainted_image_base64}
    Fills the specified bounding box region with AI-generated background.
    """
    import base64
    from inpaint import inpaint_region, unload_inpaint_model, create_mask_from_bbox

    file_id = request.get("file_id")
    x, y    = request.get("x", 0), request.get("y", 0)
    w, h    = request.get("w", 0), request.get("h", 0)

    if not file_id:
        raise HTTPException(400, "file_id is required")

    # find the original uploaded image
    upload_files = os.listdir(UPLOAD_DIR)
    image_path   = None
    for f in upload_files:
        if f.startswith(file_id):
            image_path = os.path.join(UPLOAD_DIR, f)
            break

    if not image_path:
        raise HTTPException(404, "Original image not found")

    try:
        mask   = create_mask_from_bbox(image_path, x, y, w, h)
        result = inpaint_region(image_path, mask)
        unload_inpaint_model()

        # save and encode result
        out_path = os.path.join("outputs", f"inpaint_{file_id}.jpg")
        result.save(out_path, quality=95)

        with open(out_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        return JSONResponse({"inpainted_image_base64": b64})

    except Exception as e:
        unload_inpaint_model()
        raise HTTPException(500, f"Inpainting failed: {str(e)}")
    

@app.get("/projects/{file_id}/layers")
async def get_project_layers(file_id: str, db: Session = Depends(get_db)):
    """Re-run pipeline on existing upload to get full layer data."""
    project = get_project_by_file_id(db, file_id)
    if not project:
        raise HTTPException(404, "Project not found")

    if not os.path.exists(project.upload_path):
        raise HTTPException(404, "Original file no longer exists")

    try:
        result = run_pipeline(project.upload_path)
        return JSONResponse({
            "project_id":        project.id,
            "file_id":           file_id,
            "filename":          project.filename,
            "image_w":           result["image_w"],
            "image_h":           result["image_h"],
            "background_base64": result["background_base64"],
            "original_base64":   result["original_base64"],
            "layers":            result["layers"],
            "processing_time_s": result["processing_time_s"],
        })
    except Exception as e:
        raise HTTPException(500, f"Pipeline failed: {str(e)}")