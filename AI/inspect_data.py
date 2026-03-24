import kagglehub
import pandas as pd
import os
import glob

print("⏳ Downloading dataset...")
path = kagglehub.dataset_download("anshsahu111/laptop-specifications-and-prices-dataset")
print("✅ Downloaded to:", path)

print("\nFiles inside:")
for f in os.listdir(path):
    print(f"  {f}")

csv_files = glob.glob(f"{path}/*.csv")
print(f"\nCSV files: {csv_files}")

df = pd.read_csv(csv_files[0])

print(f"\nShape   : {df.shape}")
print(f"Columns : {df.columns.tolist()}")
print(f"\nData Types:\n{df.dtypes}")
print(f"\nNull Values:\n{df.isnull().sum()}")
print(f"\nSample Row:")
for col in df.columns:
    print(f"  [{col}] : {df[col].iloc[0]}")