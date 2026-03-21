from sqlalchemy import Column, Integer, String, ForeignKey, text
from ..database import Base

class AuditBlock(Base):
    __tablename__ = "audit_blocks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    block_number = Column(Integer, nullable=False, unique=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    previous_hash = Column(String, nullable=False)
    block_hash = Column(String, nullable=False)
    is_tampered = Column(Integer, default=0)
    created_at = Column(String, server_default=text("datetime('now')"))
