from typing import List
from app.schemas.inventory import InventoryLevel, InventoryAlert
from app.repositories.inventory import InventoryRepository
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db

api_router = APIRouter()


@api_router.get("/inventory/levels", response_model=List[InventoryLevel])
async def get_inventory_levels(db: Session = Depends(get_db)):
    repo = InventoryRepository(db)
    stocks = repo.get_all_stocks()
    return stocks


@api_router.get("/inventory/alerts", response_model=List[InventoryAlert])
async def get_inventory_alerts():
    # TODO: implement
    return []
