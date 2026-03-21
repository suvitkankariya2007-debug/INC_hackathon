from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from ..database import get_db
from ..models.transaction import Transaction
from ..services.anomaly import detect_anomalies

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/kpis")
def get_kpis(entity_id: int, db: Session = Depends(get_db)):
    try:
        income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.entity_id == entity_id,
            Transaction.account_type == "income"
        ).scalar() or 0.0

        expense = db.query(func.sum(Transaction.amount)).filter(
            Transaction.entity_id == entity_id,
            Transaction.account_type == "expense"
        ).scalar() or 0.0

        credits = db.query(func.sum(Transaction.amount)).filter(
            Transaction.entity_id == entity_id,
            Transaction.cash_impact == 1,
            Transaction.transaction_type == "credit"
        ).scalar() or 0.0

        debits = db.query(func.sum(Transaction.amount)).filter(
            Transaction.entity_id == entity_id,
            Transaction.cash_impact == 1,
            Transaction.transaction_type == "debit"
        ).scalar() or 0.0

        net_profit = income - expense
        cash_balance = credits - debits

        return {
            "total_revenue": income,
            "total_expenses": expense,
            "net_profit": net_profit,
            "cash_balance": cash_balance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/category-breakdown")
def category_breakdown(entity_id: int, db: Session = Depends(get_db)):
    try:
        results = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.id).label("transaction_count")
        ).filter(Transaction.entity_id == entity_id).group_by(Transaction.category).all()

        return [
            {
                "category": r.category,
                "total_amount": r.total_amount,
                "transaction_count": r.transaction_count
            }
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/monthly-trend")
def monthly_trend(entity_id: int, db: Session = Depends(get_db)):
    try:
        results = db.query(
            func.substr(Transaction.date, 1, 7).label("month"),
            Transaction.account_type,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.entity_id == entity_id,
            Transaction.account_type.in_(["income", "expense"])
        ).group_by("month", Transaction.account_type).order_by("month").all()

        trends = {}
        for r in results:
            month = r.month
            if month not in trends:
                trends[month] = {"month": month, "revenue": 0.0, "expenses": 0.0}
            if r.account_type == "income":
                trends[month]["revenue"] += r.total
            else:
                trends[month]["expenses"] += r.total

        return list(trends.values())[-12:]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/anomalies")
def get_anomalies(entity_id: int, db: Session = Depends(get_db)):
    try:
        anomalies = detect_anomalies(entity_id, db)
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
