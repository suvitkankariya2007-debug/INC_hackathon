from sqlalchemy import Column, Integer, String, Float, ForeignKey, text
from ..database import Base

class BankRow(Base):
    __tablename__ = "bank_rows"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default='unmatched')
    matched_tx_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    uploaded_at = Column(String, server_default=text("datetime('now')"))