from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import csv
import io
from datetime import datetime, timedelta
from typing import List, Optional
import rapidfuzz
from database import get_db
from models.bank_row import BankRow
from models.transaction import Transaction

router = APIRouter(prefix="/reconcile", tags=["Reconcile"])

def parse_date_flexible(date_str: str) -> datetime:
    """Try multiple date formats so CSV and DB dates always parse correctly."""
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: {date_str}")

@router.post("/upload")
def upload_bank_statement(
    entity_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        db.query(BankRow).filter(BankRow.entity_id == entity_id).delete(synchronize_session=False)
        db.commit()
        content = file.file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        
        inserted = 0
        for row_data in reader:
            # Normalize date to YYYY-MM-DD before storing
            parsed_date = parse_date_flexible(row_data["date"])
            normalized_date = parsed_date.strftime("%Y-%m-%d")
            
            bank_row = BankRow(
                entity_id=entity_id,
                date=normalized_date,
                description=row_data["description"],
                amount=round(float(row_data["amount"]), 2),
                status='unmatched'
            )
            db.add(bank_row)
            inserted += 1
            
        db.commit()
        return {"message": "Bank statement uploaded", "inserted": inserted}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/report")
def get_reconciliation_report(entity_id: int, db: Session = Depends(get_db)):
    try:
        bank_rows = db.query(BankRow).filter(BankRow.entity_id == entity_id).all()
        transactions = db.query(Transaction).filter(Transaction.entity_id == entity_id).all()
        
        matched = []
        possible = []
        unmatched = []
        
        for br in bank_rows:
            if br.status == 'matched' and br.matched_tx_id:
                tx = next((t for t in transactions if t.id == br.matched_tx_id), None)
                br_data = {
                    "id": br.id,
                    "date": br.date,
                    "description": br.description,
                    "amount": br.amount,
                    "match": {
                        "id": tx.id,
                        "date": tx.date,
                        "description": tx.description,
                        "score": 100
                    } if tx else None
                }
                matched.append(br_data)
                continue
                    
            best_match = None
            best_score = 0
            
            # Find candidate transactions by amount (with float tolerance)
            candidates = [tx for tx in transactions if abs(tx.amount - br.amount) < 0.01]
            
            for tx in candidates:
                # 1. Date similarity - both now normalized to YYYY-MM-DD
                try:
                    d1 = parse_date_flexible(br.date)
                    d2 = parse_date_flexible(tx.date)
                    days_diff = abs((d1 - d2).days)
                except ValueError:
                    days_diff = 999

                # Skip if date too far apart
                if days_diff > 2:
                    continue

                # 2. Description similarity using partial_ratio
                desc_score = rapidfuzz.fuzz.partial_ratio(
                    br.description.lower(), tx.description.lower()
                )
                
                # Scoring
                score = desc_score
                if days_diff == 0:
                    score += 50
                elif days_diff <= 2:
                    score += 20
                
                if score > best_score:
                    best_score = score
                    best_match = tx
            
            br_data = {
                "id": br.id,
                "date": br.date,
                "description": br.description,
                "amount": br.amount,
                "match": {
                    "id": best_match.id,
                    "date": best_match.date,
                    "description": best_match.description,
                    "score": best_score
                } if best_match else None
            }
            
            if best_match and best_score >= 85:
                matched.append(br_data)
                br.status = 'matched'
                br.matched_tx_id = best_match.id
            elif best_match and best_score >= 60:
                possible.append(br_data)
                br.status = 'possible'
            else:
                unmatched.append(br_data)
                br.status = 'unmatched'
                 
        db.commit()
        return {
            "matched": matched,
            "possible": possible,
            "unmatched": unmatched,
            "summary": {
                "matched_count": len(matched),
                "possible_count": len(possible),
                "unmatched_count": len(unmatched)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm/{bank_row_id}")
def confirm_reconciliation(bank_row_id: int, transaction_id: int, db: Session = Depends(get_db)):
    try:
        br = db.query(BankRow).filter(BankRow.id == bank_row_id).first()
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        
        if not br or not tx:
            raise HTTPException(status_code=404, detail="Bank row or Transaction not found")
             
        br.status = 'matched'
        br.matched_tx_id = tx.id
        tx.reconcile_status = 'matched'
        
        db.commit()
        return {"message": "Reconciliation confirmed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))