from sqlalchemy.orm import Session
from app.models.inventory import MaterialStock


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_stocks(self):
        return self.db.query(MaterialStock).all()

    def get_stock_by_material_id(self, material_id: str):
        return self.db.query(MaterialStock).filter(MaterialStock.material_id == material_id).first()

    def create_stock(self, material_id: str, quantity: float):
        stock = MaterialStock(material_id=material_id, quantity=quantity)
        self.db.add(stock)
        self.db.commit()
        self.db.refresh(stock)
        return stock
