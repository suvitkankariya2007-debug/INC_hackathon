from sqlalchemy import Column, Integer, String, Float, ForeignKey, text
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String)
    account_type = Column(String)
    category = Column(String, nullable=False)
    ai_category = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_overridden = Column(Integer, default=0)
    cash_impact = Column(Integer, default=1)
    cash_flow_section = Column(String, nullable=True)
    reconcile_status = Column(String, default='unmatched')
    is_anomaly = Column(Integer, default=0)
    anomaly_reason = Column(String, nullable=True)
    created_at = Column(String, server_default=text("datetime('now')"))
