from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class LayerSchema(BaseModel):
    id:         int
    type:       str
    label:      Optional[str] = None
    text:       Optional[str] = None
    x:          int
    y:          int
    w:          int
    h:          int
    confidence: float
    base64:     Optional[str] = None


class ProjectCreate(BaseModel):
    filename:   str
    file_id:    str
    upload_path: str


class ProjectResponse(BaseModel):
    id:           int
    filename:     str
    file_id:      str
    layer_count:  int
    status:       str
    processing_ms: int
    created_at:   datetime

    class Config:
        from_attributes = True


class PipelineResponse(BaseModel):
    project_id:       int
    file_id:          str
    image_w:          int
    image_h:          int
    image_base64:     str
    processing_time_s: float
    layers:           List[LayerSchema]