from sqlalchemy.orm import Session
from models.transaction import Transaction
import numpy as np
from datetime import datetime
from collections import defaultdict

def run_anomaly_detection(entity_id: int, db: Session):
    transactions = db.query(Transaction).filter(Transaction.entity_id == entity_id).all()
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
        
        # Rule 1
        if tx.category in cat_stats:
            mean, std = cat_stats[tx.category]
            if std > 0 and tx.amount > mean + 3 * std:
                sigmas = (tx.amount - mean) / std
                reason = f"{round(sigmas, 1)} sigma above category mean"

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
            anomalous_txs.append(tx)

    if anomalous_txs:
        db.commit()

    return anomalous_txs
