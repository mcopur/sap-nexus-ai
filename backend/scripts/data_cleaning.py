import pandas as pd
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import joblib
import gc

# Logger ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Dosya yolları
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
PREPARED_DATA_DIR = OUTPUT_DIR / "prepared_data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PREPARED_DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_excel_files():
    """
    Excel dosyalarını yükler.
    """
    file_paths = {
        "ORDERS": DATA_DIR / "ORDERS.XLSX",
        "DELIVERY": DATA_DIR / "DELIVERY.XLSX",
        "STOCK": DATA_DIR / "STOCK.xlsx",
        "OPEN_ORDERS": DATA_DIR / "OPEN_ORDERS.XLSX",
        "MATERIAL_LIST": DATA_DIR / "MATERIAL_LIST.xlsx",
    }

    dataframes = {}
    for name, path in file_paths.items():
        try:
            logger.info(f"Loading {name} from {path}")
            df = pd.read_excel(path)
            dataframes[name] = df
            logger.info(f"Successfully loaded {name} with {len(df)} rows")
        except Exception as e:
            logger.error(f"Error loading {name}: {e}")
    return dataframes


def clean_and_standardize_dataframes(dataframes):
    """
    Sütun isimlerini normalize eder ve veriyi temizler.
    """
    for name, df in dataframes.items():
        logger.info(f"Cleaning {name}")

        # Sütun isimlerini büyük harfe çevirip boşlukları temizle
        df.columns = df.columns.str.upper().str.strip()

        # Boş değerleri kontrol et ve logla
        null_counts = df.isnull().sum()
        if null_counts.any():
            logger.warning(
                f"Null values in {name}:\n{null_counts[null_counts > 0]}")

        # Standardizasyon
        if "MATERIAL_NUMBER" in df.columns:
            df.rename(columns={"MATERIAL_NUMBER": "MATERIAL"}, inplace=True)
        if "ORDER_NUMBER" in df.columns:
            df.rename(columns={"ORDER_NUMBER": "ORDER_ID"}, inplace=True)

        if "STOCK_QUANTITY" in df.columns:
            df["STOCK_QUANTITY"] = pd.to_numeric(
                df["STOCK_QUANTITY"], errors="coerce")
            initial_count = len(df)
            df.dropna(subset=["STOCK_QUANTITY"], inplace=True)
            dropped_count = initial_count - len(df)
            if dropped_count > 0:
                logger.info(
                    f"Dropped {dropped_count} rows with invalid STOCK_QUANTITY in {name}")

        dataframes[name] = df
        logger.info(f"Cleaned {name}. Shape: {df.shape}")

    return dataframes


def combine_dataframes(dataframes):
    """
    Dataframe'leri birleştirir
    """
    logger.info("Combining dataframes...")
    try:
        # ORDERS ve STOCK birleştirme
        combined_df = dataframes["ORDERS"].merge(
            dataframes["STOCK"],
            on="MATERIAL",
            how="left"
        )
        logger.info(f"Combined ORDERS and STOCK. Shape: {combined_df.shape}")

        # DELIVERY verisini ekleme
        combined_df = combined_df.merge(
            dataframes["DELIVERY"],
            left_on="ORDER_ID",
            right_on="ORDER",
            how="left"
        )
        logger.info(f"Added DELIVERY data. Final shape: {combined_df.shape}")

        return combined_df

    except Exception as e:
        logger.error(f"Error during merging: {e}")
        raise


def prepare_and_save_data(combined_df: pd.DataFrame):
    try:
        logger.info("Starting data preparation process...")

        # Gerekli sütunları seç
        df = combined_df[["MATERIAL_x", "STOCK_QUANTITY"]].rename(
            columns={"MATERIAL_x": "MATERIAL"}
        )
        df = df.dropna()

        logger.info(f"Initial unique materials: {df['MATERIAL'].nunique()}")

        # Temel istatistikleri logla
        logger.info("STOCK_QUANTITY statistics before cleaning:")
        logger.info(f"Mean: {df['STOCK_QUANTITY'].mean()}")
        logger.info(f"Std: {df['STOCK_QUANTITY'].std()}")
        logger.info(f"Min: {df['STOCK_QUANTITY'].min()}")
        logger.info(f"Max: {df['STOCK_QUANTITY'].max()}")

        # Aykırı değerleri temizle
        Q1 = df["STOCK_QUANTITY"].quantile(0.25)
        Q3 = df["STOCK_QUANTITY"].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR

        df = df[(df["STOCK_QUANTITY"] >= lower_bound) &
                (df["STOCK_QUANTITY"] <= upper_bound)]

        # Her materyal için veri noktalarını logla
        material_counts = df["MATERIAL"].value_counts()
        logger.info(f"Material counts after filtering:\n{material_counts}")

        # Veri sayısını azaltan limitleri gevşet
        valid_materials = material_counts[material_counts >= 5].index
        df = df[df["MATERIAL"].isin(valid_materials)]

        logger.info(f"Remaining unique materials: {len(valid_materials)}")

        # İstatistikler
        stats = df.groupby("MATERIAL")["STOCK_QUANTITY"].agg([
            "count",
            "mean",
            "std",
            "min",
            "max",
            "var"
        ]).reset_index()

        logger.info(f"Statistics for materials:\n{stats.head()}")

        # Varyans filtresini gevşet
        min_variance = stats["var"].quantile(0.05)  # Threshold lowered
        stats = stats[stats["var"] > min_variance]

        logger.info(f"Materials with sufficient variance: {len(stats)}")

        if stats.empty:
            logger.warning(
                "No materials meet the variance threshold. Relaxing filters...")
            stats = df.groupby("MATERIAL")["STOCK_QUANTITY"].agg([
                "count", "mean", "std", "min", "max", "var"
            ]).reset_index()

        logger.info(f"Filtered data shape: {df.shape}")

        # Hazırlanmış veriyi oluştur
        prepared_data = {}
        for idx, row in stats.iterrows():
            material_id = row["MATERIAL"]
            material_df = df[df["MATERIAL"] == material_id].copy()

            material_df["ds"] = pd.date_range(
                start="2024-01-01",
                periods=len(material_df),
                freq="W"
            )
            material_df["y"] = material_df["STOCK_QUANTITY"]

            prepared_data[material_id] = {
                "data": material_df[["ds", "y"]].sort_values("ds"),
                "stats": row.to_dict()
            }

        logger.info(f"Prepared data for {len(prepared_data)} materials")

        # Verileri kaydet
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # CSV kaydet
        output_file = OUTPUT_DIR / "cleaned_data.csv"
        combined_df.to_csv(output_file, index=False)
        logger.info(f"Saved cleaned data to: {output_file}")

        # Hazırlanmış veriyi kaydet
        prepared_file = PREPARED_DATA_DIR / f"prepared_data_{timestamp}.pkl"
        joblib.dump(prepared_data, prepared_file)
        logger.info(f"Saved prepared data to: {prepared_file}")

        # İstatistikleri kaydet
        stats_file = PREPARED_DATA_DIR / f"data_statistics_{timestamp}.csv"
        stats.to_csv(stats_file)
        logger.info(f"Saved statistics to: {stats_file}")

        logger.info(f"Data preparation completed. Files saved:")
        logger.info(f"- Cleaned data: {output_file}")
        logger.info(f"- Prepared data: {prepared_file}")
        logger.info(f"- Statistics: {stats_file}")

        return output_file, prepared_file, stats_file

    except Exception as e:
        logger.error(f"Error in data preparation: {e}")
        raise


if __name__ == "__main__":
    try:
        # Excel dosyalarını yükle ve birleştir
        logger.info("Starting data processing...")
        dataframes = load_excel_files()
        clean_dfs = clean_and_standardize_dataframes(dataframes)
        combined_df = combine_dataframes(clean_dfs)

        # Veriyi hazırla ve kaydet
        output_file, prepared_file, stats_file = prepare_and_save_data(
            combined_df)
        logger.info("Data processing completed successfully")

    except Exception as e:
        logger.error(f"Failed to process data: {e}")
    finally:
        gc.collect()
