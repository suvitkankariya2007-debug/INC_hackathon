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
                "anomaly_reason": a.anomaly_reason,
                "severity": getattr(a, "severity", None)
            }
            for a in anomalies
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expense-breakdown")
def get_expense_breakdown(entity_id: int, db: Session = Depends(get_db)):
    try:
        # Get total expenses for the entity
        query = text("""
            SELECT category, SUM(amount) as amount
            FROM transactions
            WHERE entity_id = :entity_id AND account_type = 'expense'
            GROUP BY category
        """)
        results = db.execute(query, {"entity_id": entity_id}).fetchall()
        
        total_expense = sum(r[1] for r in results)
        
        breakdown = []
        for r in results:
            category = r[0] or "Uncategorized"
            amount = r[1]
            percentage = (amount / total_expense * 100) if total_expense > 0 else 0
            breakdown.append({
                "category": category,
                "amount": amount,
                "percentage": percentage
            })
            
        return breakdown
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
              AND date >= strftime('%Y-%m-%d', 'now', '-24 months')
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