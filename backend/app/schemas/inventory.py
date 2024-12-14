from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryLevel(BaseModel):
    id: int
    material_id: str
    quantity: float
    reserved: float
    available: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # SQLAlchemy modelini Pydantic modele çevirmek için


class InventoryAlert(BaseModel):
    material_id: str
    alert_type: str
    threshold: int
    current_level: int
    created_at: datetime
