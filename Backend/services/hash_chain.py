import hashlib
from sqlalchemy.orm import Session
from ..models.audit_block import AuditBlock
from datetime import datetime

def create_block(transaction_id: int, db: Session) -> AuditBlock:
    last_block = db.query(AuditBlock).order_by(AuditBlock.block_number.desc()).first()
    
    if last_block:
        block_number = last_block.block_number + 1
        previous_hash = last_block.block_hash
    else:
        block_number = 1
        previous_hash = '0' * 64
        
    created_at_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

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
