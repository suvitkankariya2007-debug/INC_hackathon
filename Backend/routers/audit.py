from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models.audit_block import AuditBlock
from ..models.transaction import Transaction
import hashlib

router = APIRouter(prefix="/audit", tags=["Audit"])

class SimulateTamperRequest(BaseModel):
    audit_id: int

@router.get("")
def list_audit_blocks(entity_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(AuditBlock).join(Transaction, AuditBlock.transaction_id == Transaction.id)
        if entity_id is not None:
            query = query.filter(Transaction.entity_id == entity_id)
        return query.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify")
def verify_chain(db: Session = Depends(get_db)):
    try:
        blocks = db.query(AuditBlock).order_by(AuditBlock.block_number.asc()).all()
        valid = True
        broken_at = None
        
        expected_prev_hash = '0' * 64
        
        for block in blocks:
            if block.previous_hash != expected_prev_hash:
                valid = False
                broken_at = block.block_number
                break
                
            hash_input = f"{block.block_number}{block.transaction_id}{block.previous_hash}{block.created_at}"
            computed_hash = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
            
            if computed_hash != block.block_hash or block.is_tampered == 1:
                valid = False
                broken_at = block.block_number
                break
                
            expected_prev_hash = block.block_hash

        return {
            "valid": valid,
            "broken_at": broken_at,
            "total_blocks": len(blocks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate-tamper")
def simulate_tamper(req: SimulateTamperRequest, db: Session = Depends(get_db)):
    try:
        block = db.query(AuditBlock).filter(AuditBlock.id == req.audit_id).first()
        if not block:
            raise HTTPException(status_code=404, detail="Audit block not found")
            
        block.block_hash = 'TAMPERED_' + block.block_hash[:56]
        block.is_tampered = 1
        db.commit()
        return {"message": "Block tampered", "audit_id": block.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
