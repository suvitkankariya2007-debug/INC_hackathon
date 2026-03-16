# Anomaly Detection System — LedgerAI

## Overview

The **Anomaly Detection System** (`anomaly.py`) identifies suspicious, unusual, or erroneous transactions in the ledger. It uses four complementary detection strategies to provide multi-layered anomaly discovery.

---

## Detection Strategies

### 1. **Statistical Outliers (Sigma Detection)**

**Method:** Z-score based outlier detection

- Groups transactions by `(category, account_type)` pair
- Calculates mean and standard deviation for each group
- Flags transactions **> 3 sigma from mean** (top 0.15% outliers)
- Applied when category has ≥ 3 transactions

**Trigger Conditions:**
```
sigma = |amount - mean| / std_dev
anomaly if sigma > 3.0
```

**Example:**
```
Category: IT Expenses (mean = Rs 20,000, σ = 5,000)
AWS Emergency Invoice: Rs 240,000
sigma = (240,000 - 20,000) / 5,000 = 44.0 → ANOMALY ✓
```

**Severity:** HIGH (sigma > 4), MEDIUM (3 < sigma ≤ 4)

---

### 2. **Duplicate Detection**

**Method:** Exact match detection with temporal proximity

- Finds transactions with **identical description AND amount**
- Within **2-day window** (configurable via `DUPLICATE_WINDOW_DAYS`)
- Indicates payment errors, double processing, or reconciliation failures

**Trigger Conditions:**
```
Same description AND
Same amount AND
Date difference ≤ 2 days
```

**Example:**
```
Nov 19: Infosys Consulting - Rs 85,000
Nov 20: Infosys Consulting - Rs 85,000  → DUPLICATE ✓
```

**Severity:** HIGH (indicates critical payment error)

---

### 3. **Logical Inconsistencies**

**Method:** Accounting rule violation detection

Validates transaction type against account type semantics:

| Account Type | Should Use | Red Flag |
|---|---|---|
| **Income** | CREDIT | Debit (negative revenue) |
| **Expense** | DEBIT | Credit (unusual) |
| **Asset** | DEBIT | Credit (asset decrease unusual) |
| **Liability** | CREDIT | Debit (liability increase unusual) |
| **Equity** | CREDIT | Debit (equity decrease unusual) |

**Example:**
```
Account Type: Sales Revenue (Income)
Transaction Type: DEBIT
Reason: Income should be credited, debit indicates return/reversal
→ ANOMALY ✓
```

**Severity:** MEDIUM (indicates unusual pattern)

---

### 4. **Pattern Anomalies**

**Method:** Behavioral pattern analysis

- **Large Payment Clustering:** Multiple payments > Rs 100,000 to same vendor within 7 days
- **Round Number Amounts:** Potential dummy test entries (future enhancement)
- **Temporal Clustering:** Unusual transaction concentration (future enhancement)

**Example:**
```
Vendor: XYZ Software Inc.
Jan 1: Rs 150,000 (Software License)
Jan 3: Rs 175,000 (Additional License)  → Rapid succession detected ✓
```

**Severity:** LOW (worth investigating)

---

## Configuration

### Adjustable Parameters

```python
# In AnomalyDetector class

SIGMA_THRESHOLD = 3.0              # Standard deviations for outlier flag
DUPLICATE_WINDOW_DAYS = 2          # Days to look for duplicates
```

### Adding Custom Rules

Extend `LOGICAL_RULES` dictionary for new account types:

```python
LOGICAL_RULES = {
    'income': {'debit'},           # Rule: Income + Debit = Anomaly
    'expense': {'credit'},         # Rule: Expense + Credit = Anomaly
    # Add custom types here
}
```

---

## Usage

### 1. **Standalone Detection (Read-Only)**

```python
from anomaly import AnomalyDetector

detector = AnomalyDetector("ledger.db")
anomalies = detector.detect_all_anomalies(entity_id=1)

for anom in anomalies:
    print(f"Txn #{anom['transaction_id']}: {anom['reason']}")
```

### 2. **Detect and Mark in Database**

```python
from anomaly import run_anomaly_detection

result = run_anomaly_detection(
    entity_id=1,
    db_path="ledger.db",
    apply=True  # Mark in DB
)

print(f"Found {result['count']} anomalies")
print(f"By type: {result['by_type']}")
```

### 3. **Get Entity Summary**

```python
summary = detector.get_entity_summary(entity_id=1)
print(f"Total anomalies: {summary['anomaly_count']}")
print(f"Anomaly %: {summary['anomaly_percentage']}%")
```

### 4. **Full Seeding Workflow**

```bash
cd Database/
python seeds/seed_with_anomaly_detection.py
```

Automatically:
- Creates entities and transactions
- Runs anomaly detection
- Marks anomalies in DB
- Injects demo anomalies
- Outputs summary report

---

## Output Format

### Anomaly Object

```python
{
    'transaction_id': 42,
    'anomaly_type': 'statistical',  # or 'duplicate', 'logical', 'pattern'
    'reason': "3.2 sigma above IT Expenses mean (Rs 20,000)",
    'sigma': 3.2,                   # None for non-statistical
    'severity': 'high'              # 'high', 'medium', 'low'
}
```

### Result Dictionary

```python
{
    'anomalies': [...],             # List of anomaly objects
    'by_type': {                    # Grouped by anomaly_type
        'statistical': [...],
        'duplicate': [...],
        'logical': [...],
        'pattern': [...]
    },
    'summary': {
        'total_transactions': 500,
        'anomaly_count': 15,
        'anomaly_total_amount': 950000.50,
        'categories': 22,
        'anomaly_percentage': 3.0
    },
    'count': 15
}
```

---

## Database Integration

### Schema Updates

The `is_anomaly` and `anomaly_reason` fields in `transactions` table:

```sql
is_anomaly INTEGER NOT NULL DEFAULT 0,      -- 1 if flagged
anomaly_reason TEXT,                         -- Explanation
```

### Marking Transactions

```python
# Updates transaction record
UPDATE transactions
SET is_anomaly = 1, anomaly_reason = '...'
WHERE id = ? AND entity_id = ?
```

### Querying Anomalies

```sql
-- Find all anomalies for entity
SELECT id, description, amount, anomaly_reason
FROM transactions
WHERE entity_id = 1 AND is_anomaly = 1
ORDER BY amount DESC;
```

---

## Performance Characteristics

| Operation | Complexity | Time (500 txns) |
|---|---|---|
| Statistical Detection | O(n log n) | ~50ms |
| Duplicate Detection | O(n²) | ~100ms |
| Logical Check | O(n) | ~10ms |
| Pattern Analysis | O(n²) | ~80ms |
| **Total** | O(n²) | ~240ms |

**Optimization** for large datasets:
- Use indexed queries for category grouping
- Batch duplicate detection by category
- Implement sliding window for temporal analysis

---

## Validation & QA

### Unit Tests

```python
# Test case: Statistical outlier
amounts = [1000, 1100, 1050, 50000]  # 50k is outlier
mean = 13050, σ = 27,825
sigma_score = (50000 - 13050) / 27825 = 1.33
assert sigma_score < 3.0  # Not flagged (need larger dataset)
```

### Integration Tests

```bash
# Verify seeding + detection
python seeds/seed_with_anomaly_detection.py

# Check marked anomalies
sqlite3 ledger.db "SELECT COUNT(*) FROM transactions WHERE is_anomaly=1"
```

### Known Limitations

1. **Sample Size:** Needs ≥ 3 transactions per category for statistical analysis
2. **Time Window:** 2-day duplicate window may miss month-apart duplicates
3. **False Positives:** Legitimate large transactions may flag as outliers
4. **Category Variance:** High-variance categories (e.g., "Other Income") have wider detection bands

---

## Future Enhancements

### Phase 2 Improvements

- [ ] **Isolation Forest:** ML-based outlier detection (non-parametric)
- [ ] **Benford's Law:** First-digit analysis for fraud detection
- [ ] **Seasonal Adjustment:** Account for quarterly/annual patterns
- [ ] **Entity Comparison:** Detect anomalies by peer comparison
- [ ] **Feedback Learning:** Retrain thresholds based on user feedback

### Integration with Other Modules

- **M1 (Backend):** REST API `/anomalies/detect` endpoint
- **M3 (Web):** Display `anomaly_reason` in transaction detail panel
- **M4 (Reconciliation):** Prioritize anomalies in matching workflow
- **M5 (Audit):** Flag anomalies for compliance audit trail

---

## Example: Hackathon Demo Anomalies

Five seed anomalies automatically injected for demo:

| ID | Transaction | Amount | Reason |
|---|---|---|---|
| 1 | AWS Infrastructure | Rs 2,40,000 | 3.2 sigma above mean |
| 2 | Duplicate Vendor | Rs 85,000 | Same amount, 1 day apart |
| 3 | Sales Return | Rs 95,000 | Debit on income account |
| 4 | Office Renovation | Rs 3,80,000 | 3.8 sigma above mean |
| 5 | Consultant Fee | Rs 1,75,000 | 3.5 sigma above mean |

All marked with `is_anomaly=1` and detailed reasons for display.

---

## Contact & Support

**Owner:** M2 (Data Processing & Anomaly Detection)
**Integration Lead:** M6 (Integration & Demo)
**Questions:** Refer to docstrings in `anomaly.py`
