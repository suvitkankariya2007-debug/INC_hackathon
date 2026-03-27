# 🧾 LedgerAI — Intelligent Accounting Platform
**LedgerAI** is an AI-powered accounting and financial management platform built for small-to-medium businesses. It automates transaction classification, detects anomalies, reconciles bank statements, and generates key financial reports — all from a single dashboard.
> Built for the **INC Hackathon 2026**
---
## 📌 Overview
Managing finances manually is error-prone and time-consuming. LedgerAI solves this by combining a **2-tier AI classification engine** (Local ML + GPT-4o fallback), **statistical anomaly detection**, **bank reconciliation**, and **financial statement generation** into one cohesive platform.
### Key Highlights
- 🤖 **AI Auto-Classification** — Every transaction is automatically categorized using TF-IDF + Logistic Regression, with GPT-4o-mini as a fallback for low-confidence cases
- 🔍 **Anomaly Detection** — Flags statistical outliers (3σ), duplicate entries, and business logic violations
- 🔗 **Bank Reconciliation** — Upload bank statements and auto-match against internal records using a 3-signal algorithm (amount, date, description similarity)
- 📊 **Financial Reports** — Auto-generated Profit & Loss, Balance Sheet, and Cash Flow statements (IAS 7 compliant)
- 🔒 **Audit Trail** — Blockchain-style hash chain ensures every transaction is tamper-evident
- 💬 **Human-in-the-Loop Feedback** — Users can correct AI classifications, and the system learns from corrections
---
## 🏗️ Architecture
```
INC_hackathon/
├── Backend/               # FastAPI REST API server
│   ├── main.py            # App entry point, CORS, router registration
│   ├── config.py          # App settings (DB path, model paths, thresholds)
│   ├── database.py        # SQLAlchemy engine & session factory
│   ├── models/            # SQLAlchemy ORM models
│   │   ├── transaction.py # Core transaction model
│   │   ├── entity.py      # Business entity (firm/company)
│   │   ├── bank_row.py    # Uploaded bank statement rows
│   │   ├── audit_block.py # Hash-chain audit blocks
│   │   └── classify_feedback.py  # AI correction records
│   ├── routers/           # API route handlers
│   │   ├── transactions.py    # CRUD + CSV upload
│   │   ├── classify.py        # AI classification endpoints
│   │   ├── analytics.py       # Anomalies & monthly trends
│   │   ├── reconcile.py       # Bank statement reconciliation
│   │   ├── statements.py      # Financial statements (P&L, Balance Sheet, Cash Flow)
│   │   ├── entities.py        # Entity management
│   │   └── audit.py           # Audit trail viewer
│   ├── services/          # Business logic layer
│   │   ├── classifier.py  # 2-tier AI classification engine
│   │   ├── anomaly.py     # 3-rule anomaly detection
│   │   ├── hash_chain.py  # SHA-256 hash chain for audit
│   │   └── utils.py       # Shared utilities
│   └── ml/                # Trained ML model files
│       ├── model.pkl           # Logistic Regression model
│       └── tfidf_vectorizer.pkl # TF-IDF vectorizer
│
├── Frontend/              # React + TypeScript SPA
│   └── src/
│       ├── pages/         # Application pages
│       │   ├── Dashboard.tsx       # Overview with stats & charts
│       │   ├── Transactions.tsx    # Transaction list, filters, CSV upload
│       │   ├── Classify.tsx        # AI classification playground
│       │   ├── Anomalies.tsx       # Anomaly detection results
│       │   ├── Reconciliation.tsx  # Bank reconciliation workflow
│       │   ├── ProfitLoss.tsx      # Profit & Loss statement
│       │   ├── BalanceSheet.tsx    # Balance Sheet
│       │   ├── CashFlow.tsx        # Cash Flow statement
│       │   ├── Audit.tsx           # Blockchain audit trail viewer
│       │   ├── Entities.tsx        # Entity management
│       │   └── Login.tsx           # Authentication page
│       ├── components/    # Reusable UI components
│       ├── services/      # API client (Axios)
│       ├── context/       # React Context for global state
│       └── types/         # TypeScript interfaces
│
├── Database/              # SQLite database & seed scripts
├── ML_Training/           # Model training notebooks & scripts
├── Testing/               # Test CSV files and test scripts
└── HOW_IT_WORKS.md        # Technical deep-dive documentation
```
---
## ⚙️ Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Recharts |
| **Backend** | Python, FastAPI, Uvicorn |
| **Database** | SQLite + SQLAlchemy ORM |
| **AI/ML** | Scikit-learn (TF-IDF + Logistic Regression), OpenAI GPT-4o-mini |
| **Reconciliation** | RapidFuzz (    fuzzy string matching) |
| **Audit** | SHA-256 hash chain (blockchain-style) |
---
## 🚀 Getting Started
### Prerequisites
- Python 3.10+
- Node.js 18+
- npm
### 1. Clone the Repository
```bash
git clone <repo-url>
cd INC_hackathon
```
### 2. Backend Setup
```bash
cd Backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the project root (optional, for GPT fallback):
```env
OPENAI_API_KEY=sk-your-key-here
```
Start the backend server:
```bash
python -m uvicorn main:app --reload --port 8000
```
The API will be available at `http://127.0.0.1:8000` and the Swagger docs at `http://127.0.0.1:8000/docs`.
### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.
---
## 🧠 Core Features
### 1. AI Transaction Classification
Every transaction description is auto-classified into one of 15 accounting categories:
| Categories |
|-----------|
| Salary, Rent, Utilities, IT Expense, Office Supplies, Travel, Meals, Marketing, Professional Services, Insurance, Taxes, Equipment, Subscriptions, Maintenance, Miscellaneous |
**How it works:**
- **Tier 1 — Local ML:** TF-IDF vectorizer transforms the description text, then a Logistic Regression model predicts the category with a confidence score
- **Tier 2 — GPT Fallback:** If the ML model's confidence is below 60%, the system calls OpenAI GPT-4o-mini for a more accurate classification
- **Feedback Loop:** When users correct a category, the correction is stored in the `classify_feedback` table for future model retraining
### 2. Anomaly Detection
Three detection rules run on transactions from the last 90 days:
| Rule | What It Detects | Threshold |
|------|----------------|-----------|
| **Statistical Outlier** | Abnormally high amounts for a category | Amount > mean + 3σ |
| **Duplicate Detection** | Same amount within 1 day | Same amount, ≤1 day apart |
| **Business Logic** | Invalid accounting entries | Income recorded as debit |
### 3. Bank Reconciliation
Upload a bank statement CSV and the engine auto-matches entries using a **3-signal scoring algorithm**:
1. **Amount Match** — Must be within ₹0.01
2. **Date Proximity** — Within 2 days (+50 points for exact match, +20 for ≤2 days)
3. **Description Similarity** — Fuzzy string matching via RapidFuzz
| Score | Status | Action |
|-------|--------|--------|
| ≥ 85 | ✅ Matched | Auto-confirmed |
| 60–84 | ⚠️ Possible | Needs human review |
| < 60 | ❌ Unmatched | No match found |
### 4. Financial Statements
| Statement | What It Shows |
|-----------|--------------|
| **Profit & Loss** | Revenue vs expenses breakdown by category |
| **Balance Sheet** | Assets, liabilities, and equity snapshot |
| **Cash Flow** | IAS 7 compliant: Operating, Investing, Financing sections |
### 5. Audit Trail (Hash Chain)
Every transaction generates a SHA-256 hash block linked to the previous block, creating a tamper-evident audit chain. If any block's hash doesn't match the chain, the system flags it as potentially tampered.
---
## 📡 API Reference
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/entities` | GET/POST | Manage business entities |
| `/transactions` | GET/POST | List & create transactions |
| `/transactions/{id}` | GET/PUT/DELETE | Single transaction operations |
| `/transactions/upload-csv` | POST | Bulk upload via CSV |
| `/classify` | POST | Classify a description using AI |
| `/classify/feedback` | POST | Submit category correction |
| `/analytics/anomalies` | GET | Run anomaly detection |
| `/analytics/monthly-trend` | GET | Monthly revenue/expense data |
| `/reconcile/upload` | POST | Upload bank statement |
| `/reconcile/report` | GET | Run reconciliation & get results |
| `/reconcile/confirm/{id}` | POST | Confirm a possible match |
| `/statements/profit-loss` | GET | Profit & Loss statement |
| `/statements/balance-sheet` | GET | Balance Sheet |
| `/statements/cash-flow` | GET | Cash Flow statement |
| `/audit/trail` | GET | View hash chain audit trail |
---
## 📂 CSV Format
### Transaction Upload CSV
```csv
date,description,amount,transaction_type,account_type,cash_flow_section
2025-03-01,Monthly office rent,45000,debit,expense,operating
2025-03-05,Client project payment,120000,credit,income,operating
2025-03-10,New laptop purchase,85000,debit,asset,investing
```
| Column | Required | Values |
|--------|----------|--------|
| `date` | ✅ | YYYY-MM-DD |
| `description` | ✅ | Free text |
| `amount` | ✅ | Numeric |
| `transaction_type` | ✅ | `credit` or `debit` |
| `account_type` | ✅ | `asset`, `liability`, `equity`, `income`, `expense` |
| `cash_flow_section` | ❌ | `operating`, `investing`, `financing` |
### Bank Statement CSV
```csv
date,description,amount
2025-03-01,Rent Payment,45000
2025-03-05,TRF from ABC Corp,120000
```
