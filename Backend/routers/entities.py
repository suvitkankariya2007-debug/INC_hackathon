from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models.entity import Entity

router = APIRouter(prefix="/entities", tags=["Entities"])

class EntityCreate(BaseModel):
    name: str

class EntityUpdate(BaseModel):
    name: str

class EntityResponse(BaseModel):
    id: int
    name: str
    created_at: str

    class Config:
        from_attributes = True

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

@router.get("", response_model=List[EntityResponse])
def list_entities(db: Session = Depends(get_db)):
    try:
        return db.query(Entity).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=EntityResponse)
def get_entity(id: int, db: Session = Depends(get_db)):
    try:
        entity = db.query(Entity).filter(Entity.id == id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        return entity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=EntityResponse)
def update_entity(id: int, update_data: EntityUpdate, db: Session = Depends(get_db)):
    try:
        entity = db.query(Entity).filter(Entity.id == id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        entity.name = update_data.name
        db.commit()
        db.refresh(entity)
        return entity
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

@router.delete("/{id}", status_code=200)
def delete_entity(id: int, db: Session = Depends(get_db)):
    try:
        entity = db.query(Entity).filter(Entity.id == id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        db.delete(entity)
        db.commit()
        return {"detail": "Deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
