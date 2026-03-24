from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.hash_chain import verify_chain

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/verify")
def verify_audit_chain(db: Session = Depends(get_db)):
    try:
        result = verify_chain(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

