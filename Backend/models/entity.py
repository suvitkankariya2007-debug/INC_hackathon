from sqlalchemy import Column, Integer, String, text
from database import Base

class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(String, server_default=text("datetime('now')"))
