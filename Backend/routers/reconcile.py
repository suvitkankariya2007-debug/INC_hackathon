from fastapi import APIRouter
router = APIRouter(prefix="/reconcile", tags=["Reconcile"])

@router.post("")
def stub():
    return {"message": "Stub for M5"}

@router.get("/report")
def get_report():
    return {"message": "Not yet implemented — M5 scope"}
