from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..services.classifier import classify
from ..models.classify_feedback import ClassifyFeedback

router = APIRouter(prefix="/classify", tags=["Classify"])

class ClassifyRequest(BaseModel):
    description: str

class ClassifyResponse(BaseModel):
    category: str
    confidence: float

class FeedbackRequest(BaseModel):
    transaction_id: int
    original_category: str
    corrected_category: str

@router.post("", response_model=ClassifyResponse)
def classify_text(req: ClassifyRequest):
    try:
        result = classify(req.description)
        return ClassifyResponse(
            category=result["category"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    try:
        feedback = ClassifyFeedback(
            transaction_id=req.transaction_id,
            original_category=req.original_category,
            corrected_category=req.corrected_category
        )
        db.add(feedback)
        db.commit()
        return {"message": "Feedback recorded"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
