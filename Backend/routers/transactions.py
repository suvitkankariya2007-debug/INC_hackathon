from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
import csv
import io
from database import get_db
from models.transaction import Transaction
from models.classify_feedback import ClassifyFeedback
from services.classifier import classify
from services.hash_chain import create_block

router = APIRouter(prefix="/transactions", tags=["Transactions"])

class TransactionCreate(BaseModel):
    entity_id: int
    date: str
    description: str
    amount: float
    transaction_type: str
    account_type: str
    cash_flow_section: Optional[str] = None
    category: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    entity_id: int
    date: str
    description: str
    amount: float
    transaction_type: str
    account_type: str
    cash_flow_section: Optional[str] = None
    category: Optional[str] = None
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_overridden: Optional[int] = 0
    reconcile_status: Optional[str] = 'unmatched'
    is_anomaly: Optional[int] = 0

    class Config:
        from_attributes = True

@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    try:
        cls_result = classify(tx.description)
        ai_category = cls_result.get("category")
        ai_confidence = cls_result.get("confidence")

        final_category = tx.category if tx.category else ai_category
        ai_overridden = 1 if tx.category and tx.category != ai_category else 0

        db_tx = Transaction(
            entity_id=tx.entity_id,
            date=tx.date,
            description=tx.description,
            amount=tx.amount,
            transaction_type=tx.transaction_type,
            account_type=tx.account_type,
            cash_flow_section=tx.cash_flow_section,
            category=final_category,
            ai_category=ai_category,
            ai_confidence=ai_confidence,
            ai_overridden=ai_overridden,
            cash_impact=1 if tx.cash_flow_section else 0
        )
        db.add(db_tx)
        db.commit()
        db.refresh(db_tx)

        if ai_overridden:
            feedback = ClassifyFeedback(
                transaction_id=db_tx.id,
                original_category=ai_category,
                corrected_category=final_category
            )
            db.add(feedback)
            db.commit()

        create_block(db_tx.id, db)

        return TransactionResponse.model_validate(db_tx)
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

@router.get("")
def list_transactions(
    entity_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    account_type: Optional[str] = None,
    reconcile_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Transaction).filter(Transaction.entity_id == entity_id)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        if category:
            query = query.filter(Transaction.category == category)
        if account_type:
            query = query.filter(Transaction.account_type == account_type)
        if reconcile_status:
            query = query.filter(Transaction.reconcile_status == reconcile_status)
        return query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
def get_transaction(id: int, db: Session = Depends(get_db)):
    try:
        tx = db.query(Transaction).filter(Transaction.id == id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Not found")
        return tx
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
def update_transaction(id: int, update_data: Dict, db: Session = Depends(get_db)):
    try:
        tx = db.query(Transaction).filter(Transaction.id == id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Not found")
        
        if 'category' in update_data and tx.category != update_data['category']:
            feedback = ClassifyFeedback(
                transaction_id=tx.id,
                original_category=tx.category,
                corrected_category=update_data['category']
            )
            db.add(feedback)
            tx.ai_overridden = 1
        
        for key, value in update_data.items():
            setattr(tx, key, value)
            
        db.commit()
        db.refresh(tx)
        return tx
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

@router.delete("/{id}")
def delete_transaction(id: int, db: Session = Depends(get_db)):
    try:
        tx = db.query(Transaction).filter(Transaction.id == id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Not found")
        db.delete(tx)
        db.commit()
        return {"message": "Deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-csv")
def upload_csv(file: UploadFile = File(...), entity_id: int = Form(...), db: Session = Depends(get_db)):
    try:
        raw_content = file.file.read()
        try:
            content = raw_content.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                content = raw_content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=422, detail="Invalid file encoding. Please use UTF-8.")
        
        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames:
             raise HTTPException(status_code=422, detail="CSV file is empty or invalid.")

        # Header normalization and mapping
        def normalize(s): return s.lower().strip().replace(" ", "_").replace("-", "_")
        
        mapping = {normalize(h): h for h in reader.fieldnames}
        
        # Required normalized keys
        required = ["date", "description", "amount", "transaction_type", "account_type"]
        missing = [r for r in required if r not in mapping]
        if missing:
            raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")

        inserted = 0
        failed = 0
        errors = []

        for row_num, row_data in enumerate(reader, start=1):
            try:
                date_raw = row_data.get(mapping["date"])
                desc = row_data.get(mapping["description"], "")
                amount_raw = row_data.get(mapping["amount"])
                ttype = row_data.get(mapping["transaction_type"])
                atype = row_data.get(mapping["account_type"])

                cash_flow_section = row_data.get(mapping.get("cash_flow_section", ""), None)
                if not cash_flow_section or cash_flow_section.strip() == "":
                    cash_flow_section = None
                else:
                    cash_flow_section = cash_flow_section.strip().lower()
                    if cash_flow_section not in ('operating', 'investing', 'financing'):
                        cash_flow_section = None

                reconcile_status = row_data.get(mapping.get("reconcile_status", ""), "unmatched") or "unmatched"

                cls_result = classify(desc)
                ai_category = cls_result.get("category")
                ai_confidence = cls_result.get("confidence")

                tx = Transaction(
                    entity_id=entity_id,  # Always use form param, NEVER CSV column
                    date=date_raw,
                    description=desc,
                    amount=float(amount_raw),
                    transaction_type=ttype,
                    account_type=atype,
                    cash_flow_section=cash_flow_section,
                    category=ai_category,
                    ai_category=ai_category,
                    ai_confidence=ai_confidence,
                    reconcile_status=reconcile_status,
                    cash_impact=1 if cash_flow_section else 0
                )
                db.add(tx)
                db.commit()
                db.refresh(tx)
                create_block(tx.id, db)
                inserted += 1
            except Exception as row_e:
                db.rollback()
                failed += 1
                errors.append({"row": row_num, "reason": str(row_e)})

        return {"inserted": inserted, "failed": failed, "errors": errors}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
