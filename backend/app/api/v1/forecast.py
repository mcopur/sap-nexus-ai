import pandas as pd
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import joblib
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from fastapi import APIRouter, HTTPException, BackgroundTasks
import gc
from typing import Dict, Any

# Logger ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PREPARED_DATA_DIR = BASE_DIR / "output" / "prepared_data"
MODEL_DIR = BASE_DIR / "output" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def get_latest_prepared_data():
    """
    En son hazırlanmış veri setini bulur
    """
    prepared_files = list(PREPARED_DATA_DIR.glob("prepared_data_*.pkl"))
    if not prepared_files:
        raise FileNotFoundError("No prepared data files found")
    return max(prepared_files, key=lambda x: x.stat().st_mtime)


def train_prophet_model(train_df: pd.DataFrame, material_id: str, validation_df: pd.DataFrame = None) -> Dict[str, Any]:
    """
    Prophet modelini eğitir ve değerlendirir
    """
    try:
        logger.info(f"Training model for material {material_id}")

        # Veri kontrolü
        if len(train_df) < 30:
            raise ValueError(
                f"Insufficient data points for material {material_id}")

        if train_df["y"].std() <= 0.0:
            logger.warning(
                f"Material {material_id} has zero variance. Adding minimal noise to proceed.")
            train_df["y"] += np.random.normal(0, 0.001, size=len(train_df))

        # Model parametreleri
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.1,
            seasonality_prior_scale=10.0,
            seasonality_mode='multiplicative',
            changepoint_range=0.95,
            interval_width=0.95,
            growth='linear'
        )

        model.add_country_holidays(country_name='TR')

        # Model eğitimi
        model.fit(train_df)

        # Cross-validation
        df_cv = cross_validation(
            model,
            initial='180 days',
            period='30 days',
            horizon='90 days',
            parallel="processes"
        )

        df_p = performance_metrics(df_cv)

        # Tahmin sonuçları
        future = model.make_future_dataframe(periods=90, freq='W')
        forecast = model.predict(future)

        # Align validation data with forecast
        val_metrics = None
        if validation_df is not None:
            logger.info("Aligning validation data with forecast...")
            aligned_val_df = validation_df[validation_df['ds'].isin(
                forecast['ds'])]

            if aligned_val_df.empty:
                raise ValueError(
                    f"Validation data for material {material_id} does not align with forecast dates.")

            val_forecast = forecast[forecast['ds'].isin(aligned_val_df['ds'])]
            val_metrics = {
                "rmse": float(np.sqrt(mean_squared_error(aligned_val_df["y"], val_forecast["yhat"]))),
                "mae": float(mean_absolute_error(aligned_val_df["y"], val_forecast["yhat"])),
                "r2": float(r2_score(aligned_val_df["y"], val_forecast["yhat"]))
            }

        forecast_std = forecast["yhat"].std()
        if forecast_std < 0.01:
            logger.warning(
                f"Low forecast variance for material {material_id}: {forecast_std}")

        model_path = MODEL_DIR / \
            f"{material_id}_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        with open(model_path, "wb") as f:
            joblib.dump(model, f)

        return {
            "material_id": material_id,
            "model_path": str(model_path),
            "metrics": {
                "rmse": float(df_p["rmse"].mean()),
                "mae": float(df_p["mae"].mean()),
                "mape": float(df_p["mape"].mean()) if "mape" in df_p.columns else None,
                "coverage": float(df_p["coverage"].mean())
            },
            "validation_metrics": val_metrics,
            "forecast": forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].to_dict(orient="records"),
            "cross_validation_metrics": df_p.to_dict(orient="records"),
            "training_size": len(train_df)
        }

    except Exception as e:
        logger.error(
            f"Error in model training for material {material_id}: {e}")
        raise
    finally:
        gc.collect()


@router.post("/train-model")
async def train_model_endpoint(background_tasks: BackgroundTasks):
    try:
        data_file = get_latest_prepared_data()
        prepared_data = joblib.load(data_file)

        logger.info(f"Total materials in prepared data: {len(prepared_data)}")

        best_material = None
        max_data_points = 0

        for material_id, data in prepared_data.items():
            count = data["stats"]["count"]
            std = data["stats"]["std"]

            logger.info(
                f"Evaluating material {material_id}: count={count}, std={std}")

            if count >= 5:  # Allow materials with fewer data points
                if std <= 0.0:
                    logger.warning(
                        f"Material {material_id} has zero variance but is being considered.")
                if count > max_data_points:
                    best_material = material_id
                    max_data_points = count

        if not best_material:
            logger.error("No suitable material found in the prepared data")
            raise HTTPException(
                status_code=404,
                detail=f"No suitable material found. Total materials: {len(prepared_data)}"
            )

        logger.info(
            f"Selected material {best_material} with {max_data_points} data points")

        material_data = prepared_data[best_material]["data"]

        train_size = int(len(material_data) * 0.8)
        train_df = material_data.iloc[:train_size]
        val_df = material_data.iloc[train_size:]

        result = train_prophet_model(train_df, best_material, val_df)

        return {
            "message": f"Model trained successfully for material: {best_material}",
            "statistics": prepared_data[best_material]["stats"],
            **result
        }

    except Exception as e:
        logger.error(f"Error during model training: {e}")
        raise HTTPException(status_code=500, detail=str(e))
