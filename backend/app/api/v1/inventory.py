from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.services.inventory import InventoryService
from app.models.inventory import (
    MaterialStockCreate,
    MaterialStockUpdate,
    MaterialStockRead,
    MaterialStockReadList,
    StockTrendResponse,
    StockHistoryResponse
)

router = APIRouter()


@router.get("/", response_model=MaterialStockReadList)
async def list_material_stocks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    items, total = inventory_service.list_material_stocks(skip, limit, search)
    return MaterialStockReadList(items=items, total=total)


@router.get("/{material_id}", response_model=MaterialStockRead)
async def get_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    return inventory_service.get_material_stock(material_id)


@router.post("/", response_model=MaterialStockRead, status_code=status.HTTP_201_CREATED)
async def create_material_stock(
    material_stock: MaterialStockCreate,
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    return inventory_service.create_material_stock(material_stock)


@router.put("/{material_id}", response_model=MaterialStockRead)
async def update_material_stock(
    material_id: str,
    material_stock: MaterialStockUpdate,
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    return inventory_service.update_material_stock(material_id, material_stock)


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    inventory_service.delete_material_stock(material_id)


@router.post("/{material_id}/adjust", response_model=MaterialStockRead)
async def adjust_stock(
    material_id: str,
    quantity_change: float = Query(...),
    is_reserved: bool = Query(False),
    notes: str = Query(""),
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    return inventory_service.adjust_stock(material_id, quantity_change, is_reserved, notes)


@router.get("/low-stock/list", response_model=List[MaterialStockRead])
async def get_low_stock_materials(
    threshold: float = Query(10.0, ge=0),
    db: Session = Depends(get_db)
):
    inventory_service = InventoryService(db)
    return inventory_service.get_low_stock_materials(threshold)


@router.get("/{material_id}/trend")
async def get_stock_trend(
    material_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    # Test verisi
    from datetime import datetime, timedelta
    test_data = []
    base_quantity = 100
    for i in range(days):
        date = datetime.now() - timedelta(days=i)
        test_data.append({
            "date": date.isoformat(),
            "quantity": base_quantity,
            "reserved": base_quantity * 0.2,
            "available": base_quantity * 0.8
        })
    return test_data


@router.get("/{material_id}/history")
async def get_stock_history(
    material_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    # Test verisi
    test_history = [
        {
            "id": "1",
            "date": datetime.now().isoformat(),
            "type": "IN",
            "quantity": 100,
            "description": "Initial stock",
            "reference": "REF001"
        }
    ]
    return test_history
