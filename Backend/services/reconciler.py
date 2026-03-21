from typing import List
from sqlalchemy.orm import Session
from rapidfuzz import fuzz
from ..models.transaction import Transaction
from ..models.bank_row import BankRow
from datetime import datetime

def process_bank_rows(entity_id: int, rows: List[dict], db: Session):
    bank_rows = []
    for r in rows:
        br = BankRow(
            entity_id=entity_id,
            date=r['date'],
            description=r['description'],
            amount=float(r['amount']),
            status='unmatched'
        )
        db.add(br)
        bank_rows.append(br)
    db.commit()
    for br in bank_rows:
        db.refresh(br)

    transactions = db.query(Transaction).filter(
        Transaction.entity_id == entity_id,
        Transaction.reconcile_status != 'matched'
    ).all()

    matched_list = []
    possible_list = []
    unmatched_list = []

    for br in bank_rows:
        best_match = None
        best_score = 0

        try:
            br_date = datetime.fromisoformat(br.date)
        except ValueError:
            br_date = None

        for tx in transactions:
            if tx.reconcile_status == 'matched':
                continue
            
            if abs(tx.amount - br.amount) > 0.001:
                continue

            if br_date:
                try:
                    tx_date = datetime.fromisoformat(tx.date)
                    if abs((tx_date - br_date).days) > 2:
                        continue
                except ValueError:
                    continue
            
            score = fuzz.partial_ratio(br.description.lower(), tx.description.lower())
            
            if score > best_score:
                best_score = score
                best_match = tx
        
        if best_match and best_score >= 80:
            br.status = 'matched'
            br.matched_tx_id = best_match.id
            best_match.reconcile_status = 'matched'
            matched_list.append({
                "bank_row_id": br.id, "transaction_id": best_match.id,
                "amount": br.amount, "date": br.date, "description": br.description
            })
        elif best_match and best_score >= 60:
            br.status = 'possible'
            best_match.reconcile_status = 'possible'
            possible_list.append({
                "bank_row_id": br.id, "transaction_id": best_match.id,
                "amount": br.amount, "date": br.date, "description": br.description,
                "similarity_score": best_score
            })
        else:
            br.status = 'unmatched'
            unmatched_list.append({
                "bank_row_id": br.id,
                "amount": br.amount, "date": br.date, "description": br.description
            })

    db.commit()

    return {
        "matched": matched_list,
        "possible": possible_list,
        "unmatched": unmatched_list
    }
