from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    """One row per uploaded poster."""
    __tablename__ = "projects"

    id              = Column(Integer, primary_key=True, index=True)
    filename        = Column(String, nullable=False)
    file_id         = Column(String, unique=True, nullable=False)
    upload_path     = Column(String, nullable=False)
    layer_count     = Column(Integer, default=0)
    status          = Column(String, default="uploaded")
    processing_ms   = Column(Integer, default=0)
    created_at      = Column(DateTime, server_default=func.now())

    # status values:
    # "uploaded"   — file saved, pipeline not yet run
    # "processing" — pipeline running
    # "ready"      — pipeline complete, layers available
    # "error"      — pipeline failed