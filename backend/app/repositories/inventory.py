from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Tuple, Optional
from app.models.inventory import MaterialStock, StockHistory


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_material_id(self, material_id: str) -> Optional[MaterialStock]:
        """Malzeme ID'sine göre stok kaydı getirir"""
        return self.db.query(MaterialStock).filter(
            MaterialStock.material_id == material_id
        ).first()

    def list_stocks(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[List[MaterialStock], int]:
        """Stok listesi ve toplam kayıt sayısını getirir"""
        query = self.db.query(MaterialStock)

        if search:
            query = query.filter(
                or_(
                    MaterialStock.material_id.ilike(f"%{search}%"),
                    MaterialStock.material_description.ilike(f"%{search}%")
                )
            )

        total = query.count()
        items = query.offset(skip).limit(limit).all()

        return items, total

    def create(self, material_stock: MaterialStock) -> MaterialStock:
        """Yeni stok kaydı oluşturur"""
        self.db.add(material_stock)
        self.db.commit()
        self.db.refresh(material_stock)
        return material_stock

    def update(self, material_stock: MaterialStock) -> MaterialStock:
        """Stok kaydını günceller"""
        self.db.commit()
        self.db.refresh(material_stock)
        return material_stock

    def delete(self, material_stock: MaterialStock) -> None:
        """Stok kaydını siler"""
        self.db.delete(material_stock)
        self.db.commit()

    def get_low_stock_materials(self, threshold: float) -> List[MaterialStock]:
        """Düşük stoklu malzemeleri getirir"""
        return self.db.query(MaterialStock).filter(
            MaterialStock.available <= threshold
        ).all()

    def create_stock_history(
        self,
        material_id: str,
        quantity_change: float,
        is_reserved: bool,
        previous_quantity: float,
        new_quantity: float,
        notes: Optional[str] = None
    ) -> StockHistory:
        """Stok hareketi kaydı oluşturur"""
        history = StockHistory(
            material_id=material_id,
            quantity_change=quantity_change,
            is_reserved=is_reserved,
            previous_quantity=previous_quantity,
            new_quantity=new_quantity,
            notes=notes
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        return history

    def get_stock_history(
        self,
        material_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[StockHistory]:
        """Belirli bir tarih aralığındaki stok hareketlerini getirir"""
        return self.db.query(StockHistory).filter(
            StockHistory.material_id == material_id,
            StockHistory.created_at >= start_date,
            StockHistory.created_at <= end_date
        ).order_by(StockHistory.created_at.asc()).all()
