-- ============================================================
-- LedgerAI Database Schema
-- Owner: M1 (Backend Architect)
-- FREEZE AFTER DAY 3 — DO NOT EDIT AFTER THAT
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. ENTITIES
-- Supports Multi-Entity Lite (Acme Corp, Smith and Sons, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS entities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. TRANSACTIONS
-- Core ledger table. Double-entry enforced at API layer.
-- account_type drives Balance Sheet / P&L grouping.
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id           INTEGER NOT NULL REFERENCES entities(id),

    -- Core fields
    date                TEXT    NOT NULL,               -- ISO 8601: YYYY-MM-DD
    description         TEXT    NOT NULL,
    amount              REAL    NOT NULL,                -- Always positive; type signals direction
    transaction_type    TEXT    NOT NULL                 -- 'debit' | 'credit'
                            CHECK(transaction_type IN ('debit', 'credit')),

    -- Accounting classification
    account_type        TEXT    NOT NULL                 -- 'asset' | 'liability' | 'equity' | 'income' | 'expense'
                            CHECK(account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    category            TEXT    NOT NULL,                -- e.g. 'IT Expenses', 'Sales Revenue'

    -- AI classification fields
    ai_category         TEXT,                            -- Category suggested by ML model
    ai_confidence       REAL,                            -- Confidence score 0.0 – 1.0
    ai_overridden       INTEGER NOT NULL DEFAULT 0,      -- 1 if user manually changed category

    -- Cash flow classification (for Cash Flow Summary page)
    cash_impact         INTEGER NOT NULL DEFAULT 1,      -- 1 = affects cash, 0 = non-cash
    cash_flow_section   TEXT                             -- 'operating' | 'investing' | 'financing' | NULL
                            CHECK(cash_flow_section IN ('operating', 'investing', 'financing', NULL)),

    -- Reconciliation status
    reconcile_status    TEXT    NOT NULL DEFAULT 'unmatched'
                            CHECK(reconcile_status IN ('matched', 'possible', 'unmatched')),

    -- Anomaly flag (set by anomaly detection logic in M2)
    is_anomaly          INTEGER NOT NULL DEFAULT 0,      -- 1 if flagged
    anomaly_reason      TEXT,                            -- e.g. '3.2 sigma above mean'

    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_entity   ON transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_account  ON transactions(account_type);

-- ============================================================
-- 3. AUDIT BLOCKS
-- SHA-256 hash chain for tamper detection.
-- One block per transaction, chained via previous_hash.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_blocks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number    INTEGER NOT NULL UNIQUE,
    transaction_id  INTEGER NOT NULL REFERENCES transactions(id),
    previous_hash   TEXT    NOT NULL,                   -- Hash of block (n-1); genesis block uses '0'*64
    block_hash      TEXT    NOT NULL,                   -- SHA-256 of (block_number + transaction_id + previous_hash + timestamp)
    is_tampered     INTEGER NOT NULL DEFAULT 0,         -- Set to 1 by /audit/simulate-tamper
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_block_number ON audit_blocks(block_number);
CREATE INDEX IF NOT EXISTS idx_audit_transaction  ON audit_blocks(transaction_id);

-- ============================================================
-- 4. CLASSIFY FEEDBACK
-- Stores user overrides for AI category corrections.
-- Used by M2 to retrain / improve future predictions.
-- ============================================================
CREATE TABLE IF NOT EXISTS classify_feedback (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id      INTEGER NOT NULL REFERENCES transactions(id),
    original_category   TEXT    NOT NULL,               -- What the AI predicted
    corrected_category  TEXT    NOT NULL,               -- What the user chose
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 5. BANK RECONCILIATION ROWS
-- Parsed rows from uploaded bank statement CSVs.
-- Matched against transactions table by M5's reconciler.
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_rows (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id       INTEGER NOT NULL REFERENCES entities(id),
    date            TEXT    NOT NULL,                   -- ISO 8601 from bank CSV
    description     TEXT    NOT NULL,                   -- Raw bank description string
    amount          REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'unmatched'
                        CHECK(status IN ('matched', 'possible', 'unmatched')),
    matched_tx_id   INTEGER REFERENCES transactions(id),-- NULL until matched
    uploaded_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bank_rows_entity ON bank_rows(entity_id);
CREATE INDEX IF NOT EXISTS idx_bank_rows_status ON bank_rows(status);