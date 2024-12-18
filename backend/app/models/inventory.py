from sqlalchemy import Column, Integer, String, DateTime, Float, func, ForeignKey, Boolean
from sqlalchemy.orm import validates, relationship
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.db.base import Base


class MaterialStock(Base):
    __tablename__ = "material_stocks"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(String, unique=True, index=True)
    material_description = Column(String, nullable=True)
    quantity = Column(Float)
    reserved = Column(Float, default=0)
    available = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.update_available()

    def update_available(self):
        """Kullanılabilir stok miktarını günceller"""
        self.available = self.quantity - self.reserved

    @validates('reserved')
    def validate_reserved(self, key, value):
        """Reserved miktarının quantity'den büyük olmamasını sağlar."""
        if value > self.quantity:
            raise ValueError(
                "Reserved quantity cannot be greater than total quantity")
        return value


class MaterialStockBase(BaseModel):
    material_id: str
    material_description: Optional[str] = None
    quantity: float = Field(ge=0)
    reserved: float = Field(ge=0, default=0)

    class Config:
        from_attributes = True


class MaterialStockCreate(MaterialStockBase):
    pass


class MaterialStockUpdate(BaseModel):
    material_description: Optional[str] = None
    quantity: Optional[float] = Field(ge=0, default=None)
    reserved: Optional[float] = Field(ge=0, default=None)

    class Config:
        from_attributes = True


class MaterialStockRead(MaterialStockBase):
    id: int
    available: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MaterialStockReadList(BaseModel):
    items: list[MaterialStockRead]
    total: int


class StockTrendResponse(BaseModel):
    date: datetime
    quantity: float
    reserved: float
    available: float


class StockHistory(Base):
    __tablename__ = "stock_history"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(String, ForeignKey(
        "material_stocks.material_id"), index=True)
    quantity_change = Column(Float)
    is_reserved = Column(Boolean, default=False)
    previous_quantity = Column(Float)
    new_quantity = Column(Float)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("MaterialStock", backref="history")


class StockHistoryResponse(BaseModel):
    id: int
    material_id: str
    quantity_change: float
    is_reserved: bool
    previous_quantity: float
    new_quantity: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
