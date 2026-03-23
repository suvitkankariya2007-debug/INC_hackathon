from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.entity import Entity

router = APIRouter(prefix="/entities", tags=["Entities"])

class EntityCreate(BaseModel):
    name: str

class EntityResponse(BaseModel):
    id: int
    name: str
    created_at: str

@router.get("", response_model=list[EntityResponse])
def get_entities(db: Session = Depends(get_db)):
    try:
        entities = db.query(Entity).all()
        return entities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=EntityResponse, status_code=201)
def create_entity(entity: EntityCreate, db: Session = Depends(get_db)):
    try:
        db_entity = Entity(name=entity.name)
        db.add(db_entity)
        db.commit()
        db.refresh(db_entity)
        return db_entity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
