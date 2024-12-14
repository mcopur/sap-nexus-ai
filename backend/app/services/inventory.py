from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Optional, Tuple

from app.models.inventory import (
    MaterialStock,
    MaterialStockCreate,
    MaterialStockUpdate,
    MaterialStockReadList
)


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_material_stock(self, material_stock: MaterialStockCreate) -> MaterialStock:
        """Yeni malzeme stok kaydı oluşturur"""
        try:
            db_material_stock = MaterialStock(
                material_id=material_stock.material_id,
                material_description=material_stock.material_description,
                quantity=material_stock.quantity,
                reserved=material_stock.reserved
            )
            self.db.add(db_material_stock)
            self.db.commit()
            self.db.refresh(db_material_stock)
            return db_material_stock
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Material with ID {material_stock.material_id} already exists"
            )

    def get_material_stock(self, material_id: str) -> MaterialStock:
        """Malzeme stok bilgisini getirir"""
        material_stock = self.db.query(MaterialStock).filter(
            MaterialStock.material_id == material_id
        ).first()
        if not material_stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material stock with id {material_id} not found"
            )
        return material_stock

    def list_material_stocks(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[list[MaterialStock], int]:
        """Malzeme stok listesini getirir"""
        query = self.db.query(MaterialStock)

        if search:
            query = query.filter(
                MaterialStock.material_id.ilike(f"%{search}%") |
                MaterialStock.material_description.ilike(f"%{search}%")
            )

        total = query.count()
        items = query.offset(skip).limit(limit).all()

        return items, total

    def update_material_stock(
        self,
        material_id: str,
        material_stock: MaterialStockUpdate
    ) -> MaterialStock:
        """Malzeme stok bilgilerini günceller"""
        db_material_stock = self.get_material_stock(material_id)

        if material_stock.material_description is not None:
            db_material_stock.material_description = material_stock.material_description

        if material_stock.quantity is not None:
            db_material_stock.quantity = material_stock.quantity
            db_material_stock.update_available()

        if material_stock.reserved is not None:
            db_material_stock.reserved = material_stock.reserved
            db_material_stock.update_available()

        try:
            self.db.commit()
            self.db.refresh(db_material_stock)
            return db_material_stock
        except ValueError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    def delete_material_stock(self, material_id: str):
        """Malzeme stok kaydını siler"""
        material_stock = self.get_material_stock(material_id)
        self.db.delete(material_stock)
        self.db.commit()

    def adjust_stock(
        self,
        material_id: str,
        quantity_change: float,
        is_reserved: bool = False
    ) -> MaterialStock:
        """Stok miktarını artırır veya azaltır"""
        material_stock = self.get_material_stock(material_id)

        try:
            if is_reserved:
                new_reserved = material_stock.reserved + quantity_change
                if new_reserved < 0:
                    raise ValueError("Reserved quantity cannot be negative")
                material_stock.reserved = new_reserved
            else:
                new_quantity = material_stock.quantity + quantity_change
                if new_quantity < material_stock.reserved:
                    raise ValueError(
                        "Total quantity cannot be less than reserved quantity")
                material_stock.quantity = new_quantity

            material_stock.update_available()
            self.db.commit()
            self.db.refresh(material_stock)
            return material_stock

        except ValueError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    def get_low_stock_materials(self, threshold: float = 10.0) -> list[MaterialStock]:
        """Düşük stoklu malzemeleri getirir"""
        return self.db.query(MaterialStock).filter(
            MaterialStock.available <= threshold
        ).all()
