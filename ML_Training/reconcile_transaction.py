import os
import pandas as pd
from rapidfuzz import fuzz

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Ask user for CSV file
csv_file = input("Enter bank statement CSV file path: ")

df = pd.read_csv(csv_file)

print("Reconciliation dataset loaded")
print(df.head())


# -------------------------
# Convert date columns
# -------------------------

df["bank_date"] = pd.to_datetime(df["bank_date"])
df["ledger_date"] = pd.to_datetime(df["ledger_date"])


# -------------------------
# Containers for results
# -------------------------

matched = []
possible = []
unmatched = []


# -------------------------
# Reconciliation loop
# -------------------------

for i, row in df.iterrows():

    bank_desc = str(row["bank_description"])
    ledger_desc = str(row["ledger_narration"])
    bank_amt = row["bank_amount"]
    ledger_amt = row["ledger_amount"]
    bank_date = row["bank_date"]
    ledger_date = row["ledger_date"]

    # Amount must match
    if bank_amt != ledger_amt:
        unmatched.append(row)
        continue

    # Check date difference
    date_diff = abs((ledger_date - bank_date).days)

    if date_diff > 2:
        unmatched.append(row)
        continue

    # Check description similarity
    score = fuzz.ratio(bank_desc, ledger_desc)

    # Classification
    if score >= 80:
        matched.append(row)
    elif score >= 60:
        possible.append(row)
    else:
        unmatched.append(row)


# -------------------------
# Print Results
# -------------------------

print("\nReconciliation Results")

print("Matched:", len(matched))
print("Possible:", len(possible))
print("Unmatched:", len(unmatched))