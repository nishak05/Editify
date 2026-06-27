from sqlalchemy.orm import Session
from models import Project


def create_project(db: Session, filename: str, file_id: str, upload_path: str) -> Project:
    """Save a new upload record to DB immediately when file arrives."""
    project = Project(
        filename    = filename,
        file_id     = file_id,
        upload_path = upload_path,
        status      = "uploaded",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project_ready(db: Session, file_id: str, layer_count: int, processing_ms: int) -> Project:
    """Mark project as ready after pipeline completes successfully."""
    project = db.query(Project).filter(Project.file_id == file_id).first()
    if project:
        project.status       = "ready"
        project.layer_count  = layer_count
        project.processing_ms = processing_ms
        db.commit()
        db.refresh(project)
    return project


def update_project_error(db: Session, file_id: str) -> Project:
    """Mark project as failed if pipeline throws an error."""
    project = db.query(Project).filter(Project.file_id == file_id).first()
    if project:
        project.status = "error"
        db.commit()
    return project


def get_all_projects(db: Session) -> list:
    """Return all projects ordered by newest first."""
    return db.query(Project).order_by(Project.created_at.desc()).all()


def get_project_by_file_id(db: Session, file_id: str) -> Project:
    """Fetch one project by its file_id."""
    return db.query(Project).filter(Project.file_id == file_id).first()

def save_project_state(db, file_id: str, saved_state: str, thumbnail_b64: str, layer_count: int):
    project = db.query(Project).filter(Project.file_id == file_id).first()
    if not project:
        return None
    project.saved_state   = saved_state
    project.thumbnail_b64 = thumbnail_b64
    project.layer_count   = layer_count
    db.commit()
    db.refresh(project)
    return project


def get_saved_state(db, file_id: str):
    project = db.query(Project).filter(Project.file_id == file_id).first()
    if not project:
        return None
    return {
        "has_saved_state": project.saved_state is not None,
        "saved_state":     project.saved_state,
        "thumbnail_b64":   project.thumbnail_b64,
        "filename":        project.filename,
        "file_id":         project.file_id,
        "layer_count":     project.layer_count,
    }