from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from services.anomaly import run_anomaly_detection
from models.transaction import Transaction
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/anomalies")
def get_anomalies(entity_id: int, db: Session = Depends(get_db)):
    try:
        anomalies = run_anomaly_detection(entity_id, db)
        return [
            {
                "id": a.id,
                "date": a.date,
                "description": a.description,
                "amount": a.amount,
                "category": a.category,
                "anomaly_reason": a.anomaly_reason
            }
            for a in anomalies
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from sqlalchemy import extract, func

@router.get("/monthly-trend")
def monthly_trend(entity_id: int, db: Session = Depends(get_db)):
    try:
        # Use SQLAlchemy expressions for database portability
        # We group by Year and Month
        year_field = extract('year', Transaction.date)
        month_field = extract('month', Transaction.date)
        
        results = db.query(
            func.max(func.strftime('%Y-%m', Transaction.date)).label('month_str'),
            Transaction.account_type,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.entity_id == entity_id,
            Transaction.account_type.in_(['income', 'expense']),
            Transaction.date >= (datetime.now() - timedelta(days=730)).strftime("%Y-%m-%d") # 24 months
        ).group_by(
            func.strftime('%Y-%m', Transaction.date),
            Transaction.account_type
        ).order_by('month_str').all()
        
        trends = {}
        for month_str, acc_type, total in results:
            if month_str not in trends:
                trends[month_str] = {"month": month_str, "revenue": 0.0, "expenses": 0.0}
                
            if acc_type == "income":
                trends[month_str]["revenue"] += float(total)
            else:
                trends[month_str]["expenses"] += float(total)

        return list(trends.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

