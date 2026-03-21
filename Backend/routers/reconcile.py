from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import csv
import io
from ..database import get_db
from ..services.reconciler import process_bank_rows

router = APIRouter(prefix="/reconcile", tags=["Reconcile"])

@router.post("/upload")
def upload_bank_statement(entity_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = file.file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        
        rows = []
        for r in reader:
            rows.append({
                "date": r["date"],
                "description": r["description"],
                "amount": float(r["amount"])
            })
            
        result = process_bank_rows(entity_id, rows, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
