from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.inventory import InventoryService
from app.models.inventory import (
    MaterialStockCreate,
    MaterialStockUpdate,
    MaterialStockRead,
    MaterialStockReadList
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/", response_model=MaterialStockRead)
def create_material_stock(
    material_stock: MaterialStockCreate,
    db: Session = Depends(get_db)
):
    """Yeni malzeme stok kaydı oluşturur"""
    inventory_service = InventoryService(db)
    return inventory_service.create_material_stock(material_stock)


@router.get("/{material_id}", response_model=MaterialStockRead)
def get_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    """Malzeme stok bilgisini getirir"""
    inventory_service = InventoryService(db)
    return inventory_service.get_material_stock(material_id)


@router.get("/", response_model=MaterialStockReadList)
def list_material_stocks(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Malzeme stok listesini getirir"""
    inventory_service = InventoryService(db)
    items, total = inventory_service.list_material_stocks(skip, limit, search)
    return MaterialStockReadList(items=items, total=total)


@router.put("/{material_id}", response_model=MaterialStockRead)
def update_material_stock(
    material_id: str,
    material_stock: MaterialStockUpdate,
    db: Session = Depends(get_db)
):
    """Malzeme stok bilgilerini günceller"""
    inventory_service = InventoryService(db)
    return inventory_service.update_material_stock(material_id, material_stock)


@router.delete("/{material_id}")
def delete_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    """Malzeme stok kaydını siler"""
    inventory_service = InventoryService(db)
    inventory_service.delete_material_stock(material_id)
    return {"message": f"Material stock {material_id} deleted successfully"}


@router.post("/{material_id}/adjust", response_model=MaterialStockRead)
def adjust_stock(
    material_id: str,
    quantity_change: float = Query(
        ..., description="Stok değişim miktarı (pozitif artış, negatif azalış)"),
    is_reserved: bool = Query(
        False, description="True ise rezerve stok, False ise toplam stok üzerinde işlem yapar"),
    db: Session = Depends(get_db)
):
    """Stok miktarını artırır veya azaltır"""
    inventory_service = InventoryService(db)
    return inventory_service.adjust_stock(material_id, quantity_change, is_reserved)


@router.get("/low-stock/list", response_model=list[MaterialStockRead])
def get_low_stock_materials(
    threshold: float = Query(10.0, ge=0),
    db: Session = Depends(get_db)
):
    """Düşük stoklu malzemeleri getirir"""
    inventory_service = InventoryService(db)
    return inventory_service.get_low_stock_materials(threshold)
