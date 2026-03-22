import hashlib
from sqlalchemy.orm import Session
from models.audit_block import AuditBlock
from datetime import datetime

def create_block(transaction_id: int, db: Session) -> AuditBlock:
    last_block = db.query(AuditBlock).order_by(AuditBlock.block_number.desc()).first()
    
    if last_block:
        block_number = last_block.block_number + 1
        previous_hash = last_block.block_hash
    else:
        block_number = 1
        previous_hash = '0' * 64
        
    created_at_str = datetime.utcnow().isoformat()

    hash_input = f"{block_number}{transaction_id}{previous_hash}{created_at_str}"
    block_hash = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

    new_block = AuditBlock(
        block_number=block_number,
        transaction_id=transaction_id,
        previous_hash=previous_hash,
        block_hash=block_hash,
        created_at=created_at_str
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

def verify_chain(db: Session):
    blocks = db.query(AuditBlock).order_by(AuditBlock.block_number.asc()).all()
    
    expected_prev_hash = '0' * 64
    
    for block in blocks:
        if block.previous_hash != expected_prev_hash:
            return {"valid": False, "broken_at": block.id, "total_blocks": len(blocks)}
            
        hash_input = f"{block.block_number}{block.transaction_id}{block.previous_hash}{block.created_at}"
        computed_hash = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
        
        if computed_hash != block.block_hash or block.is_tampered == 1:
            return {"valid": False, "broken_at": block.id, "total_blocks": len(blocks)}
            
        expected_prev_hash = block.block_hash

    return {"valid": True, "broken_at": None, "total_blocks": len(blocks)}
