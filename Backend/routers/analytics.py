from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from services.anomaly import run_anomaly_detection

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

@router.get("/monthly-trend")
def monthly_trend(entity_id: int, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT strftime('%Y-%m', date) as month, account_type, SUM(amount) as total
            FROM transactions
            WHERE entity_id = :entity_id
              AND account_type IN ('income', 'expense')
              AND date >= strftime('%Y-%m-%d', 'now', '-12 months')
            GROUP BY strftime('%Y-%m', date), account_type
            ORDER BY month ASC
        """)
        results = db.execute(query, {"entity_id": entity_id}).fetchall()
        
        trends = {}
        for r in results:
            month = r[0]
            acc_type = r[1]
            total = r[2]
            
            if month not in trends:
                trends[month] = {"month": month, "revenue": 0.0, "expenses": 0.0}
                
            if acc_type == "income":
                trends[month]["revenue"] += total
            else:
                trends[month]["expenses"] += total

        return list(trends.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

