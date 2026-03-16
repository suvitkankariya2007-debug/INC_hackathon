# ==============================================================
# seed_smith.py
# Owner: M6 (Integration & Demo)
# Seeds 150 transactions for Smith and Sons (entity_id = 2)
# Run from: Database/ folder
# Command: python seeds/seed_smith.py
# ==============================================================

import sqlite3
import random
import hashlib
from datetime import datetime, timedelta

# --- Config ---
DB_PATH = "ledger.db"
ENTITY_NAME = "Smith and Sons"
TOTAL_TRANSACTIONS = 150
START_DATE = datetime(2024, 9, 1)
END_DATE = datetime(2025, 2, 28)

# --- Transaction Templates ---
# Smith and Sons is a smaller CA / accounting firm — different flavor from Acme Corp
# (description, category, account_type, transaction_type, cash_flow_section, amount_range)
TRANSACTION_TEMPLATES = [
    # INCOME — credit
    ("Audit Fee - Client Mehta Traders",        "Audit Fees",           "income",    "credit", "operating",  (25000,  80000)),
    ("Tax Filing Fee - Individual Client",      "Tax Consultancy",      "income",    "credit", "operating",  (5000,   20000)),
    ("GST Consultancy Fee",                     "Tax Consultancy",      "income",    "credit", "operating",  (8000,   30000)),
    ("Bookkeeping Service - Monthly",           "Service Income",       "income",    "credit", "operating",  (10000,  40000)),
    ("Payroll Processing Fee",                  "Service Income",       "income",    "credit", "operating",  (5000,   15000)),
    ("Financial Advisory Fee",                  "Advisory Income",      "income",    "credit", "operating",  (15000,  60000)),
    ("ROC Filing Fee Recovered",                "Service Income",       "income",    "credit", "operating",  (3000,   10000)),
    ("Interest Income - Savings Account",       "Interest Income",      "income",    "credit", "operating",  (1000,   5000)),

    # EXPENSES — debit
    ("Office Rent - Shivaji Nagar",             "Rent",                 "expense",   "debit",  "operating",  (20000,  50000)),
    ("Staff Salary - Junior Accountant",        "Salaries",             "expense",   "debit",  "operating",  (25000,  60000)),
    ("Staff Salary - Senior CA",                "Salaries",             "expense",   "debit",  "operating",  (60000,  120000)),
    ("Tally Prime License Renewal",             "IT Expenses",          "expense",   "debit",  "operating",  (5000,   18000)),
    ("Electricity Bill - Office",               "Utilities",            "expense",   "debit",  "operating",  (2000,   6000)),
    ("Internet - Airtel Broadband",             "Utilities",            "expense",   "debit",  "operating",  (1000,   3000)),
    ("Printing - Tax Returns",                  "Office Expenses",      "expense",   "debit",  "operating",  (500,    3000)),
    ("Bar Council Membership Fee",              "Professional Fees",    "expense",   "debit",  "operating",  (5000,   15000)),
    ("ICAI Subscription",                       "Professional Fees",    "expense",   "debit",  "operating",  (3000,   8000)),
    ("Travel - Client Site Visit",              "Travel",               "expense",   "debit",  "operating",  (2000,   10000)),
    ("Office Supplies - Stationery",            "Office Expenses",      "expense",   "debit",  "operating",  (500,    2500)),
    ("Tea & Refreshments - Office",             "Entertainment",        "expense",   "debit",  "operating",  (500,    2000)),
    ("Courier - Document Delivery",             "Logistics",            "expense",   "debit",  "operating",  (300,    2000)),
    ("Professional Indemnity Insurance",        "Insurance",            "expense",   "debit",  "operating",  (8000,   25000)),
    ("Software - Adobe Acrobat",                "IT Expenses",          "expense",   "debit",  "operating",  (2000,   6000)),

    # ASSETS — debit
    ("Laptop Purchase - HP EliteBook",          "Fixed Assets",         "asset",     "debit",  "investing",  (45000,  90000)),
    ("Office Renovation Deposit",               "Deposits",             "asset",     "debit",  "investing",  (30000,  100000)),
    ("Advance to Staff - Festival",             "Advance Payments",     "asset",     "debit",  "operating",  (5000,   20000)),
    ("Bank Balance Opening",                    "Cash & Bank",          "asset",     "debit",  "operating",  (50000,  300000)),

    # LIABILITIES — credit
    ("GST Payable",                             "Tax Payable",          "liability", "credit", "operating",  (5000,   30000)),
    ("TDS Payable - Salaries",                  "Tax Payable",          "liability", "credit", "operating",  (3000,   15000)),
    ("Accounts Payable - Vendor",               "Accounts Payable",     "liability", "credit", "operating",  (5000,   30000)),

    # EQUITY — credit
    ("Partner Capital - Mr. Smith",             "Partner Capital",      "equity",    "credit", "financing",  (200000, 800000)),
    ("Partner Capital - Mr. Rajan",             "Partner Capital",      "equity",    "credit", "financing",  (200000, 800000)),
]


def random_date(start: datetime, end: datetime) -> str:
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")


def compute_block_hash(block_number: int, transaction_id: int, previous_hash: str, created_at: str) -> str:
    raw = f"{block_number}{transaction_id}{previous_hash}{created_at}"
    return hashlib.sha256(raw.encode()).hexdigest()


def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ── 1. Insert or get entity ──────────────────────────────
    cursor.execute("SELECT id FROM entities WHERE name = ?", (ENTITY_NAME,))
    row = cursor.fetchone()
    if row:
        entity_id = row[0]
        print(f"Entity '{ENTITY_NAME}' already exists with id={entity_id}. Skipping insert.")
    else:
        cursor.execute(
            "INSERT INTO entities (name) VALUES (?)",
            (ENTITY_NAME,)
        )
        entity_id = cursor.lastrowid
        print(f"Created entity '{ENTITY_NAME}' with id={entity_id}")

    # ── 2. Clear existing transactions for this entity ───────
    cursor.execute("DELETE FROM audit_blocks WHERE transaction_id IN "
                   "(SELECT id FROM transactions WHERE entity_id = ?)", (entity_id,))
    cursor.execute("DELETE FROM transactions WHERE entity_id = ?", (entity_id,))
    print("Cleared existing Smith and Sons transactions.")

    # ── 3. Pick up block number after Acme Corp's chain ──────
    cursor.execute("SELECT COALESCE(MAX(block_number), 0) FROM audit_blocks")
    existing_max_block = cursor.fetchone()[0]
    block_number = existing_max_block + 1

    # ── 4. Get last block hash to continue the chain ─────────
    cursor.execute("SELECT block_hash FROM audit_blocks ORDER BY block_number DESC LIMIT 1")
    last_hash_row = cursor.fetchone()
    previous_hash = last_hash_row[0] if last_hash_row else "0" * 64

    print(f"Seeding {TOTAL_TRANSACTIONS} transactions (starting at block {block_number})...")

    for i in range(TOTAL_TRANSACTIONS):
        template = random.choice(TRANSACTION_TEMPLATES)
        desc, category, account_type, tx_type, cash_flow_section, (lo, hi) = template

        amount = round(random.uniform(lo, hi), 2)
        date = random_date(START_DATE, END_DATE)
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        suffixes = ["", " - Oct", " - Nov", " - Dec", " - Jan", " Q3", " Q4",
                    " #INV-" + str(random.randint(1000, 9999))]
        description = desc + random.choice(suffixes)

        cursor.execute("""
            INSERT INTO transactions (
                entity_id, date, description, amount, transaction_type,
                account_type, category,
                ai_category, ai_confidence, ai_overridden,
                cash_impact, cash_flow_section,
                reconcile_status, is_anomaly, anomaly_reason,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entity_id, date, description, amount, tx_type,
            account_type, category,
            category, round(random.uniform(0.75, 0.99), 2), 0,
            1, cash_flow_section,
            "unmatched", 0, None,
            created_at
        ))

        transaction_id = cursor.lastrowid

        # ── Audit block ───────────────────────────────────────
        block_hash = compute_block_hash(block_number, transaction_id, previous_hash, created_at)
        cursor.execute("""
            INSERT INTO audit_blocks (
                block_number, transaction_id, previous_hash, block_hash, is_tampered, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (block_number, transaction_id, previous_hash, block_hash, 0, created_at))

        previous_hash = block_hash
        block_number += 1

    conn.commit()
    conn.close()

    print(f"\n✅ Done! Seeded {TOTAL_TRANSACTIONS} transactions for '{ENTITY_NAME}'.")
    print(f"   Audit chain continues seamlessly from Acme Corp's blocks.")
    print(f"   Run seed_anomalies.py next.")


if __name__ == "__main__":
    seed()