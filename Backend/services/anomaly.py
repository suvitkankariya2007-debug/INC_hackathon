from sqlalchemy.orm import Session
from ..models.transaction import Transaction
import numpy as np
from datetime import datetime

def detect_anomalies(entity_id: int, db: Session):
    transactions = db.query(Transaction).filter(Transaction.entity_id == entity_id).all()
    if not transactions:
        return []

    anomalous_txs = []

    categories = {}
    for tx in transactions:
        categories.setdefault(tx.category, []).append(tx.amount)

    cat_stats = {}
    for cat, amounts in categories.items():
        if len(amounts) > 1:
            cat_stats[cat] = (np.mean(amounts), np.std(amounts))

    from collections import defaultdict
    by_amt = defaultdict(list)
    for tx in transactions:
        by_amt[tx.amount].append(tx)

    for tx in transactions:
        reason = None
        
        if tx.category in cat_stats:
            mean, std = cat_stats[tx.category]
            if tx.amount > mean + 3 * std:
                reason = "Amount > mean + 3*stddev"

        if not reason:
             same_amt_txs = by_amt[tx.amount]
             for other in same_amt_txs:
                 if other.id != tx.id:
                     try:
                         d1 = datetime.fromisoformat(tx.date)
                         d2 = datetime.fromisoformat(other.date)
                         if abs((d1 - d2).days) <= 1:
                             reason = "Duplicate detected"
                             break
                     except ValueError:
                         pass
        
        if not reason:
            if tx.account_type == "income" and tx.transaction_type == "debit":
                reason = "Income account with debit transaction"
        
        if reason:
            tx.is_anomaly = 1
            tx.anomaly_reason = reason
            anomalous_txs.append(tx)

    if anomalous_txs:
        db.commit()
        for tx in anomalous_txs:
            db.refresh(tx)

    return anomalous_txs
