from fastapi import APIRouter
router = APIRouter(prefix="/statements", tags=["Statements"])

@router.get("")
def stub():
    return {"message": "Stub for M4"}
