# app/api/v1/inventory.py
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
    StockTrendResponse
)

router = APIRouter()

# GET /api/v1/inventory/


@router.get("/", response_model=MaterialStockReadList)
async def list_material_stocks(
    skip: int = Query(0, ge=0, description="Skip first N records"),
    limit: int = Query(100, ge=1, le=1000,
                       description="Limit the number of records"),
    search: Optional[str] = Query(
        None, description="Search in material_id or description"),
    db: Session = Depends(get_db)
):
    """
    Malzeme stok listesini getirir.
    - Sayfalama için skip ve limit parametreleri kullanılabilir
    - Arama için search parametresi kullanılabilir (material_id veya description içinde arar)
    """
    inventory_service = InventoryService(db)
    items, total = inventory_service.list_material_stocks(skip, limit, search)
    return MaterialStockReadList(items=items, total=total)

# GET /api/v1/inventory/{material_id}


@router.get("/{material_id}", response_model=MaterialStockRead)
async def get_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    """
    Belirli bir malzemenin stok bilgilerini getirir.
    """
    inventory_service = InventoryService(db)
    return inventory_service.get_material_stock(material_id)

# POST /api/v1/inventory/


@router.post("/", response_model=MaterialStockRead, status_code=status.HTTP_201_CREATED)
async def create_material_stock(
    material_stock: MaterialStockCreate,
    db: Session = Depends(get_db)
):
    """
    Yeni bir malzeme stok kaydı oluşturur.
    """
    inventory_service = InventoryService(db)
    return inventory_service.create_material_stock(material_stock)

# PUT /api/v1/inventory/{material_id}


@router.put("/{material_id}", response_model=MaterialStockRead)
async def update_material_stock(
    material_id: str,
    material_stock: MaterialStockUpdate,
    db: Session = Depends(get_db)
):
    """
    Var olan bir malzeme stok kaydını günceller.
    """
    inventory_service = InventoryService(db)
    return inventory_service.update_material_stock(material_id, material_stock)

# DELETE /api/v1/inventory/{material_id}


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_stock(
    material_id: str,
    db: Session = Depends(get_db)
):
    """
    Bir malzeme stok kaydını siler.
    """
    inventory_service = InventoryService(db)
    inventory_service.delete_material_stock(material_id)

# POST /api/v1/inventory/{material_id}/adjust


@router.post("/{material_id}/adjust", response_model=MaterialStockRead)
async def adjust_stock(
    material_id: str,
    quantity_change: float = Query(
        ...,
        description="Stok değişim miktarı (pozitif: artış, negatif: azalış)"
    ),
    is_reserved: bool = Query(
        False,
        description="True: rezerve stok üzerinde işlem yapar, False: toplam stok üzerinde işlem yapar"
    ),
    db: Session = Depends(get_db)
):
    """
    Stok miktarını artırır veya azaltır.
    - quantity_change: Pozitif değer stok artışı, negatif değer stok azalışı anlamına gelir
    - is_reserved: True ise rezerve stok üzerinde, False ise toplam stok üzerinde işlem yapar
    """
    inventory_service = InventoryService(db)
    return inventory_service.adjust_stock(material_id, quantity_change, is_reserved)

# GET /api/v1/inventory/low-stock


@router.get("/low-stock/list", response_model=List[MaterialStockRead])
async def get_low_stock_materials(
    threshold: float = Query(
        10.0,
        ge=0,
        description="Düşük stok eşik değeri"
    ),
    db: Session = Depends(get_db)
):
    """
    Düşük stoklu malzemeleri listeler.
    - threshold: Bu değerin altındaki kullanılabilir stoka sahip malzemeler listelenir
    """
    inventory_service = InventoryService(db)
    return inventory_service.get_low_stock_materials(threshold)


@router.get("/{material_id}/trend", response_model=List[StockTrendResponse])
async def get_stock_trend(
    material_id: str,
    days: int = Query(30, ge=1, le=365, description="Kaç günlük trend verisi"),
    db: Session = Depends(get_db)
):
    """
    Belirli bir malzeme için stok trend verilerini getirir.
    - days: Kaç günlük veri getirileceği (varsayılan: 30, max: 365)
    """
    inventory_service = InventoryService(db)
    return inventory_service.get_stock_trend(material_id, days)