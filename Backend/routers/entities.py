from fastapi import APIRouter
router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("")
def stub():
    return {"message": "Stub for M5"}
