from fastapi import APIRouter
from app.api.v1.inventory import router as inventory_router
from app.api.v1.forecast import router as forecast_router
api_router = APIRouter()


# Inventory Router
api_router.include_router(
    inventory_router, prefix="/inventory", tags=["inventory"]
)

# Forecast Router
api_router.include_router(
    forecast_router, prefix="/forecast", tags=["forecast"]
)
