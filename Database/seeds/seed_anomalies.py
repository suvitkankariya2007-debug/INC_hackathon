# ==============================================================
# seed_anomalies.py
# Owner: M6 (Integration & Demo)
# Injects exactly 5 anomaly transactions into Acme Corp
# These are the ones that appear in the dashboard alert panel
# Run from: Database/ folder
# Command: python seeds/seed_anomalies.py
# MUST run AFTER seed_acme.py and seed_smith.py
# ==============================================================

import sqlite3
import hashlib
from datetime import datetime

# --- Config ---
DB_PATH = "ledger.db"
ENTITY_NAME = "Acme Corp"

# --- Exactly 5 Anomalies ---
# (description, category, account_type, transaction_type, amount, date, anomaly_reason)
ANOMALIES = [
    (
        "AWS Infrastructure - Emergency Scale Up",
        "IT Expenses",
        "expense",
        "debit",
        240000.00,          # ~3.2 sigma above mean for IT Expenses
        "2024-11-15",
        "3.2 sigma above account mean"
    ),
    (
        "Duplicate Vendor Payment - Infosys Nov",
        "Accounts Payable",
        "liability",
        "credit",
        85000.00,           # Same amount as another entry +-1 day
        "2024-11-20",
        "Duplicate entry detected"
    ),
    (
        "Sales Return - Reversed Revenue",
        "Sales Revenue",
        "income",
        "debit",            # Debit on an income account = negative revenue flag
        95000.00,
        "2024-12-03",
        "Negative revenue entry"
    ),
    (
        "Office Renovation - Emergency Repair",
        "Fixed Assets",
        "asset",
        "debit",
        380000.00,          # Far above normal asset purchase range
        "2025-01-10",
        "3.8 sigma above account mean"
    ),
    (
        "Consultant Fee - Unverified Vendor",
        "Professional Fees",
        "expense",
        "debit",
        175000.00,          # Well above normal professional fee range
        "2025-01-28",
        "3.5 sigma above account mean"
    ),
]


def compute_block_hash(block_number: int, transaction_id: int, previous_hash: str, created_at: str) -> str:
    raw = f"{block_number}{transaction_id}{previous_hash}{created_at}"
    return hashlib.sha256(raw.encode()).hexdigest()


def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ── 1. Get Acme Corp entity id ───────────────────────────
    cursor.execute("SELECT id FROM entities WHERE name = ?", (ENTITY_NAME,))
    row = cursor.fetchone()
    if not row:
        print(f"❌ Entity '{ENTITY_NAME}' not found. Run seed_acme.py first.")
        conn.close()
        return
    entity_id = row[0]
    print(f"Found entity '{ENTITY_NAME}' with id={entity_id}")

    # ── 2. Remove any previously seeded anomalies ────────────
    cursor.execute("""
        DELETE FROM audit_blocks WHERE transaction_id IN (
            SELECT id FROM transactions
            WHERE entity_id = ? AND is_anomaly = 1
        )
    """, (entity_id,))
    cursor.execute("""
        DELETE FROM transactions
        WHERE entity_id = ? AND is_anomaly = 1
    """, (entity_id,))
    print("Cleared previously seeded anomalies.")

    # ── 3. Pick up block number and last hash ─────────────────
    cursor.execute("SELECT COALESCE(MAX(block_number), 0) FROM audit_blocks")
    block_number = cursor.fetchone()[0] + 1

    cursor.execute("SELECT block_hash FROM audit_blocks ORDER BY block_number DESC LIMIT 1")
    last_hash_row = cursor.fetchone()
    previous_hash = last_hash_row[0] if last_hash_row else "0" * 64

    print(f"Injecting 5 anomalies (starting at block {block_number})...")

    # ── 4. Insert each anomaly ────────────────────────────────
    for i, (desc, category, account_type, tx_type, amount, date, reason) in enumerate(ANOMALIES, 1):
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
            entity_id, date, desc, amount, tx_type,
            account_type, category,
            category, round(0.91, 2), 0,
            1, "operating",
            "unmatched", 1, reason,
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

        print(f"   [{i}/5] ✅ {desc[:45]:<45} | Rs {amount:>10,.2f} | {reason}")

    conn.commit()
    conn.close()

    print(f"""
✅ All 5 anomalies injected successfully.

Demo panel will show:
  🔴 Rs 2,40,000  — AWS Infrastructure Emergency       (3.2 sigma above mean)
  🔴 Rs 85,000    — Duplicate Vendor Payment Infosys    (Duplicate entry)
  🔴 Rs 95,000    — Sales Return Reversed Revenue       (Negative revenue)
  🔴 Rs 3,80,000  — Office Renovation Emergency         (3.8 sigma above mean)
  🔴 Rs 1,75,000  — Consultant Fee Unverified Vendor    (3.5 sigma above mean)

Your database is fully seeded and demo-ready.
    """)


if __name__ == "__main__":
    seed()