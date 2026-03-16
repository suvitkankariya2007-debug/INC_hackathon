# ==============================================================
# seed_acme.py
# Owner: M6 (Integration & Demo)
# Seeds 500 transactions for Acme Corp (entity_id = 1)
# Run from: Database/ folder
# Command: python seeds/seed_acme.py
# ==============================================================

import sqlite3
import random
import hashlib
from datetime import datetime, timedelta

# --- Config ---
DB_PATH = "ledger.db"   # Run from Database/ folder
ENTITY_NAME = "Acme Corp"
ENTITY_ID = 1
TOTAL_TRANSACTIONS = 500
START_DATE = datetime(2024, 9, 1)
END_DATE = datetime(2025, 2, 28)

# --- Transaction Templates ---
# (description, category, account_type, transaction_type, cash_flow_section, amount_range)
TRANSACTION_TEMPLATES = [
    # INCOME — credit
    ("Sales Revenue - Product A",       "Sales Revenue",        "income",    "credit", "operating",  (50000,  200000)),
    ("Sales Revenue - Product B",       "Sales Revenue",        "income",    "credit", "operating",  (30000,  150000)),
    ("Service Fee - Consulting",        "Service Income",       "income",    "credit", "operating",  (20000,  80000)),
    ("Export Invoice - US Client",      "Sales Revenue",        "income",    "credit", "operating",  (80000,  300000)),
    ("Maintenance Contract Renewal",    "Service Income",       "income",    "credit", "operating",  (15000,  60000)),
    ("Commission Received",             "Other Income",         "income",    "credit", "operating",  (5000,   25000)),
    ("Interest Income - FD",            "Interest Income",      "income",    "credit", "operating",  (2000,   10000)),

    # EXPENSES — debit
    ("AWS Invoice November",            "IT Expenses",          "expense",   "debit",  "operating",  (8000,   40000)),
    ("Google Workspace Subscription",   "IT Expenses",          "expense",   "debit",  "operating",  (2000,   8000)),
    ("Office Rent - Baner",             "Rent",                 "expense",   "debit",  "operating",  (45000,  90000)),
    ("Electricity Bill",                "Utilities",            "expense",   "debit",  "operating",  (3000,   12000)),
    ("Employee Salary - Engineering",   "Salaries",             "expense",   "debit",  "operating",  (80000,  250000)),
    ("Employee Salary - Sales",         "Salaries",             "expense",   "debit",  "operating",  (50000,  150000)),
    ("Travel - Client Visit Mumbai",    "Travel",               "expense",   "debit",  "operating",  (5000,   20000)),
    ("Marketing - Google Ads",          "Marketing",            "expense",   "debit",  "operating",  (10000,  50000)),
    ("Marketing - Social Media",        "Marketing",            "expense",   "debit",  "operating",  (5000,   25000)),
    ("Office Supplies",                 "Office Expenses",      "expense",   "debit",  "operating",  (1000,   5000)),
    ("Legal & Compliance Fees",         "Professional Fees",    "expense",   "debit",  "operating",  (10000,  40000)),
    ("CA Audit Fees",                   "Professional Fees",    "expense",   "debit",  "operating",  (15000,  50000)),
    ("Internet & Telecom",              "Utilities",            "expense",   "debit",  "operating",  (2000,   6000)),
    ("Software License - Tally",        "IT Expenses",          "expense",   "debit",  "operating",  (5000,   15000)),
    ("Insurance Premium",               "Insurance",            "expense",   "debit",  "operating",  (8000,   30000)),
    ("Courier & Logistics",             "Logistics",            "expense",   "debit",  "operating",  (2000,   10000)),
    ("Printing & Stationery",           "Office Expenses",      "expense",   "debit",  "operating",  (500,    3000)),
    ("Team Lunch & Entertainment",      "Entertainment",        "expense",   "debit",  "operating",  (2000,   8000)),

    # ASSETS — debit
    ("Laptop Purchase - Dell XPS",      "Fixed Assets",         "asset",     "debit",  "investing",  (60000,  120000)),
    ("Office Furniture Purchase",       "Fixed Assets",         "asset",     "debit",  "investing",  (20000,  80000)),
    ("Security Deposit - Office",       "Deposits",             "asset",     "debit",  "investing",  (50000,  200000)),
    ("Advance Payment to Vendor",       "Advance Payments",     "asset",     "debit",  "operating",  (10000,  50000)),
    ("Bank Balance Opening",            "Cash & Bank",          "asset",     "debit",  "operating",  (100000, 500000)),

    # LIABILITIES — credit
    ("GST Payable - Q3",                "Tax Payable",          "liability", "credit", "operating",  (15000,  80000)),
    ("TDS Payable",                     "Tax Payable",          "liability", "credit", "operating",  (5000,   25000)),
    ("Vendor Payment Due - Infosys",    "Accounts Payable",     "liability", "credit", "operating",  (20000,  100000)),
    ("Short Term Loan - HDFC",          "Loans Payable",        "liability", "credit", "financing",  (100000, 500000)),
    ("Salary Payable",                  "Salary Payable",       "liability", "credit", "operating",  (50000,  200000)),

    # EQUITY — credit
    ("Share Capital Contribution",      "Share Capital",        "equity",    "credit", "financing",  (500000, 2000000)),
    ("Retained Earnings Adjustment",    "Retained Earnings",    "equity",    "credit", "financing",  (50000,  200000)),
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
    print("Cleared existing Acme Corp transactions.")

    # ── 3. Seed 500 transactions ─────────────────────────────
    previous_hash = "0" * 64   # Genesis block
    block_number = 1

    # Check existing block count so we don't clash with other entities
    cursor.execute("SELECT COALESCE(MAX(block_number), 0) FROM audit_blocks")
    existing_max_block = cursor.fetchone()[0]
    block_number = existing_max_block + 1

    print(f"Seeding {TOTAL_TRANSACTIONS} transactions...")

    for i in range(TOTAL_TRANSACTIONS):
        template = random.choice(TRANSACTION_TEMPLATES)
        desc, category, account_type, tx_type, cash_flow_section, (lo, hi) = template

        amount = round(random.uniform(lo, hi), 2)
        date = random_date(START_DATE, END_DATE)
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Slightly vary description to make data realistic
        suffixes = ["", " - Oct", " - Nov", " - Dec", " - Jan", " Q3", " Q4", " #INV-" + str(random.randint(1000, 9999))]
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
            category, round(random.uniform(0.75, 0.99), 2), 0,  # ai mirrors category
            1, cash_flow_section,
            "unmatched", 0, None,
            created_at
        ))

        transaction_id = cursor.lastrowid

        # ── Audit block for every transaction ────────────────
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
    print(f"   Audit chain: {TOTAL_TRANSACTIONS} blocks created.")
    print(f"   Run seed_anomalies.py next to inject the 5 anomaly transactions.")


if __name__ == "__main__":
    seed()