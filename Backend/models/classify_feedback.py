from sqlalchemy import Column, Integer, String, ForeignKey, text
from database import Base

class ClassifyFeedback(Base):
    __tablename__ = "classify_feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    original_category = Column(String, nullable=False)
    corrected_category = Column(String, nullable=False)
    created_at = Column(String, server_default=text("datetime('now')"))

