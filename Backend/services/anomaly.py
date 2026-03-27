from sqlalchemy.orm import Session
from models.transaction import Transaction
import numpy as np
from datetime import datetime
from collections import defaultdict

from services.utils import parse_date_flexible
from datetime import datetime, timedelta

def compute_severity(reason: str, sigma: float = None) -> dict:
    score = 0
    if sigma is not None:
        sigma_pts = min(int((sigma / 6.0) * 60), 60)
        score += sigma_pts
    reason_lower = reason.lower()
    if "duplicate" in reason_lower:
        score += 25
    if "negative revenue" in reason_lower:
        score += 15
    score = min(score, 100)
    if score >= 75:
        label = "critical"
    elif score >= 50:
        label = "high"
    elif score >= 25:
        label = "medium"
    else:
        label = "low"
    return {"score": score, "label": label}


def run_single_transaction_anomaly_check(tx: Transaction, db: Session):
    """A lightweight version of anomaly detection for a single transaction."""
    try:
        # Rule 1: Category Mean (Requires context of others)
        # We'll skip complex category mean in real-time for now to keep it fast, 
        # or just fetch recent stats.
        
        # Rule 2: Duplicate check (Very important for real-time)
        tx_date = parse_date_flexible(tx.date)
        duplicates = db.query(Transaction).filter(
            Transaction.entity_id == tx.entity_id,
            Transaction.amount == tx.amount,
            Transaction.id != tx.id
        ).all()
        
        for other in duplicates:
            try:
                other_date = parse_date_flexible(other.date)
                if abs((tx_date - other_date).days) <= 1:
                    tx.is_anomaly = 1
                    tx.anomaly_reason = "Duplicate transaction detected (Real-time)"
                    db.commit()
                    return True
            except ValueError:
                continue

        # Rule 3: Business Logic (Income as Debit)
        if tx.account_type == "income" and tx.transaction_type == "debit":
            tx.is_anomaly = 1
            tx.anomaly_reason = "Negative revenue entry"
            db.commit()
            return True
            
        return False
    except Exception:
        return False

def run_anomaly_detection(entity_id: int, db: Session):
    # Performance Optimization: Only check transactions from the last 90 days
    ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    
    transactions = db.query(Transaction).filter(
        Transaction.entity_id == entity_id,
        Transaction.date >= ninety_days_ago
    ).all()
    
    if not transactions:
        return []

    anomalous_txs = []

    # Rule 1
    categories = defaultdict(list)
    for tx in transactions:
        categories[tx.category].append(tx.amount)

    cat_stats = {}
    for cat, amounts in categories.items():
        if len(amounts) > 1:
            cat_stats[cat] = (np.mean(amounts), np.std(amounts))

    # Rule 2 setup
    by_amt = defaultdict(list)
    for tx in transactions:
        by_amt[tx.amount].append(tx)

    for tx in transactions:
        reason = None
        sigma = None
        
        # Rule 1
        if tx.category in cat_stats:
            mean, std = cat_stats[tx.category]
            if std > 0 and tx.amount > mean + 3 * std:
                sigma = (tx.amount - mean) / std
                reason = f"{round(sigma, 1)} sigma above category mean"

        # Rule 2
        if not reason:
             same_amt_txs = by_amt[tx.amount]
             for other in same_amt_txs:
                 if other.id != tx.id and tx.entity_id == other.entity_id:
                     try:
                         # assume ISO format 'YYYY-MM-DD'
                         d1 = datetime.strptime(tx.date, "%Y-%m-%d")
                         d2 = datetime.strptime(other.date, "%Y-%m-%d")
                         if abs((d1 - d2).days) <= 1:
                             reason = "Duplicate transaction detected"
                             break
                     except ValueError:
                         pass
        
        # Rule 3
        if not reason:
            if tx.account_type == "income" and tx.transaction_type == "debit":
                reason = "Negative revenue entry"
        
        if reason:
            tx.is_anomaly = 1
            tx.anomaly_reason = reason
            # Attach dynamic attribute for severity
            tx.severity = compute_severity(reason, sigma)
            # Use dictionary representation as requested for the final anomaly object
            anomalous_txs.append(tx)

    if anomalous_txs:
        db.commit()

    return anomalous_txs

