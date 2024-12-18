import pandas as pd
from pathlib import Path

# Dosya Yolu Tanımları
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"


def load_excel_files(file_paths):
    """
    Excel dosyalarını yükler.
    """
    dataframes = {}
    for name, path in file_paths.items():
        try:
            df = pd.read_excel(path)
            dataframes[name] = df
        except Exception as e:
            print(f"Error loading {name}: {e}")
    return dataframes


def clean_and_standardize_dataframes(dataframes):
    """
    Sütun isimlerini normalize eder, boş verileri temizler
    ve sütun isimlerini birleştirme için eşitler.
    """
    for name, df in dataframes.items():
        # Sütun isimlerini büyük harfe çevirip boşlukları temizle
        df.columns = df.columns.str.upper().str.strip()
        df.dropna(inplace=True)

        # ORDERS ve OPEN_ORDERS'taki 'MATERIAL_NUMBER' sütununu 'MATERIAL' olarak yeniden adlandır
        if "MATERIAL_NUMBER" in df.columns:
            df.rename(columns={"MATERIAL_NUMBER": "MATERIAL"}, inplace=True)

        # ORDER_NUMBER'ı ORDER_ID olarak standardize et
        if "ORDER_NUMBER" in df.columns:
            df.rename(columns={"ORDER_NUMBER": "ORDER_ID"}, inplace=True)

        dataframes[name] = df
    return dataframes


def combine_dataframes(dataframes):
    """
    ORDERS, STOCK ve DELIVERY verilerini birleştirir.
    """
    # ORDERS ve STOCK birleştirme
    combined_df = dataframes["ORDERS"].merge(
        dataframes["STOCK"], on="MATERIAL", how="left"
    )
    # DELIVERY verisini ekleme
    combined_df = combined_df.merge(
        dataframes["DELIVERY"], left_on="ORDER_ID", right_on="ORDER", how="left"
    )
    return combined_df


if __name__ == "__main__":
    # Dosya Yolları
    file_paths = {
        "ORDERS": DATA_DIR / "ORDERS.XLSX",
        "DELIVERY": DATA_DIR / "DELIVERY.XLSX",
        "STOCK": DATA_DIR / "STOCK.xlsx",
        "OPEN_ORDERS": DATA_DIR / "OPEN_ORDERS.XLSX",
        "MATERIAL_LIST": DATA_DIR / "MATERIAL_LIST.xlsx",
    }

    # Veri Yükleme
    print("Loading and cleaning data...")
    dataframes = load_excel_files(file_paths)
    clean_dfs = clean_and_standardize_dataframes(dataframes)

    # Birleştirme
    print("Combining dataframes...")
    try:
        combined_df = combine_dataframes(clean_dfs)

        # Büyük veriyi CSV formatında kaydetme
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_file = OUTPUT_DIR / "cleaned_data.csv"
        combined_df.to_csv(output_file, index=False)

        print(
            f"Data cleaning completed successfully. File saved to '{output_file}'.")
    except KeyError as e:
        print(f"Error during merging: {e}. Please check column names.")
