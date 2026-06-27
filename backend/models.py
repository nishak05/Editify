from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id             = Column(Integer, primary_key=True, index=True)
    filename       = Column(String, nullable=False)
    file_id        = Column(String, unique=True, index=True, nullable=False)
    upload_path    = Column(String, nullable=False)
    layer_count    = Column(Integer, default=0)
    status         = Column(String, default="uploaded")
    processing_ms  = Column(Integer, default=0)
    saved_state    = Column(Text, nullable=True)
    thumbnail_b64  = Column(Text, nullable=True)
    created_at     = Column(DateTime, server_default=func.now())
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())