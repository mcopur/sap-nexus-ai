from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Dict, Optional, Tuple, List

from app.models.inventory import (
    MaterialStock,
    MaterialStockCreate,
    MaterialStockUpdate
)
from app.repositories.inventory import InventoryRepository


class InventoryService:
    def __init__(self, db: Session):
        self.repository = InventoryRepository(db)

    def create_material_stock(self, material_stock: MaterialStockCreate) -> MaterialStock:
        """Yeni malzeme stok kaydı oluşturur"""
        try:
            db_material_stock = MaterialStock(
                material_id=material_stock.material_id,
                material_description=material_stock.material_description,
                quantity=material_stock.quantity,
                reserved=material_stock.reserved
            )
            return self.repository.create(db_material_stock)
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Material with ID {material_stock.material_id} already exists"
            )

    def get_material_stock(self, material_id: str) -> MaterialStock:
        """Malzeme stok bilgisini getirir"""
        material_stock = self.repository.get_by_material_id(material_id)
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
    ) -> Tuple[List[MaterialStock], int]:
        """Malzeme stok listesini getirir"""
        return self.repository.list_stocks(skip, limit, search)

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
            try:
                db_material_stock.reserved = material_stock.reserved
                db_material_stock.update_available()
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

        return self.repository.update(db_material_stock)

    def delete_material_stock(self, material_id: str) -> None:
        """Malzeme stok kaydını siler"""
        material_stock = self.get_material_stock(material_id)
        self.repository.delete(material_stock)

    def get_low_stock_materials(self, threshold: float = 10.0) -> List[MaterialStock]:
        """Düşük stoklu malzemeleri getirir"""
        return self.repository.get_low_stock_materials(threshold)

    def adjust_stock(
        self,
        material_id: str,
        quantity_change: float,
        is_reserved: bool = False,
        notes: Optional[str] = None
    ) -> MaterialStock:
        """Stok miktarını artırır veya azaltır"""
        material_stock = self.get_material_stock(material_id)

        try:
            if is_reserved:
                previous_quantity = material_stock.reserved
                new_reserved = previous_quantity + quantity_change
                if new_reserved < 0:
                    raise ValueError("Reserved quantity cannot be negative")
                material_stock.reserved = new_reserved
            else:
                previous_quantity = material_stock.quantity
                new_quantity = previous_quantity + quantity_change
                if new_quantity < material_stock.reserved:
                    raise ValueError(
                        "Total quantity cannot be less than reserved quantity")
                material_stock.quantity = new_quantity

            material_stock.update_available()
            updated_stock = self.repository.update(material_stock)

            # Stok hareketi kaydı oluştur
            self.repository.create_stock_history(
                material_id=material_id,
                quantity_change=quantity_change,
                is_reserved=is_reserved,
                previous_quantity=previous_quantity,
                new_quantity=new_reserved if is_reserved else new_quantity,
                notes=notes
            )

            return updated_stock

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    def get_stock_trend(self, material_id: str, days: int) -> List[Dict]:
        """Stok trend verilerini getirir"""
        # Başlangıç tarihini hesapla
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Stok hareketlerini getir
        stock_movements = self.repository.get_stock_history(
            material_id=material_id,
            start_date=start_date,
            end_date=end_date
        )

        # Günlük değişimleri hesapla
        daily_stocks = {}
        current_stock = self.get_material_stock(material_id)

        # Her gün için veri oluştur
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            daily_stocks[date_str] = {
                'date': current_date.isoformat(),
                'quantity': current_stock.quantity,
                'reserved': current_stock.reserved,
                'available': current_stock.available
            }
            current_date += timedelta(days=1)

        # Değişimleri uygula
        for movement in stock_movements:
            date_str = movement.created_at.strftime('%Y-%m-%d')
            if date_str in daily_stocks:
                if movement.is_reserved:
                    daily_stocks[date_str]['reserved'] = movement.new_quantity
                    daily_stocks[date_str]['available'] = (
                        daily_stocks[date_str]['quantity'] -
                        movement.new_quantity
                    )
                else:
                    daily_stocks[date_str]['quantity'] = movement.new_quantity
                    daily_stocks[date_str]['available'] = (
                        movement.new_quantity -
                        daily_stocks[date_str]['reserved']
                    )

        # Listeye çevir ve sırala
        trend_data = list(daily_stocks.values())
        trend_data.sort(key=lambda x: x['date'])

        return trend_data
