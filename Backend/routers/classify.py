from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.classifier import classify

router = APIRouter(prefix="/classify", tags=["Classify"])

class ClassifyRequest(BaseModel):
    description: str

class ClassifyResponse(BaseModel):
    category: str
    confidence: float

@router.post("", response_model=ClassifyResponse)
def classify_text(req: ClassifyRequest):
    try:
        result = classify(req.description)
        return ClassifyResponse(
            category=result["ai_category"],
            confidence=result["ai_confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
