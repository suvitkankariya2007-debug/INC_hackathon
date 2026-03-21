from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from ..database import get_db
from ..models.transaction import Transaction

router = APIRouter(prefix="/statements", tags=["Statements"])

@router.get("/profit-loss")
def profit_loss(entity_id: int, start_date: str, end_date: str, db: Session = Depends(get_db)):
    try:
        base_query = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.entity_id == entity_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).group_by(Transaction.category)

        inc_rows = base_query.filter(Transaction.account_type == "income").all()
        exp_rows = base_query.filter(Transaction.account_type == "expense").all()

        income = [{"category": r.category, "total": r.total} for r in inc_rows]
        expenses = [{"category": r.category, "total": r.total} for r in exp_rows]

        total_income = sum(i["total"] for i in income)
        total_expenses = sum(e["total"] for e in expenses)

        return {
            "period": {"start": start_date, "end": end_date},
            "income": income,
            "expenses": expenses,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_profit": total_income - total_expenses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance-sheet")
def balance_sheet(entity_id: int, start_date: str, end_date: str, db: Session = Depends(get_db)):
    try:
        base_query = db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.entity_id == entity_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).group_by(Transaction.category)

        assets = base_query.filter(Transaction.account_type == "asset").all()
        liab = base_query.filter(Transaction.account_type == "liability").all()
        equity = base_query.filter(Transaction.account_type == "equity").all()
        
        assets_res = [{"category": r.category, "total": r.total} for r in assets]
        liab_res = [{"category": r.category, "total": r.total} for r in liab]
        equity_res = [{"category": r.category, "total": r.total} for r in equity]

        total_assets = sum(a["total"] for a in assets_res)
        total_liabilities = sum(l["total"] for l in liab_res)
        total_equity = sum(e["total"] for e in equity_res)

        return {
            "assets": assets_res,
            "liabilities": liab_res,
            "equity": equity_res,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_equity": total_equity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cash-flow")
def cash_flow(entity_id: int, start_date: str, end_date: str, db: Session = Depends(get_db)):
    try:
        flows = db.query(
            Transaction.cash_flow_section,
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.entity_id == entity_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date,
            Transaction.cash_impact == 1,
            Transaction.cash_flow_section.isnot(None)
        ).group_by(Transaction.cash_flow_section, Transaction.transaction_type).all()

        sections = {
            "operating": {"inflow": 0.0, "outflow": 0.0, "net": 0.0},
            "investing": {"inflow": 0.0, "outflow": 0.0, "net": 0.0},
            "financing": {"inflow": 0.0, "outflow": 0.0, "net": 0.0}
        }

        for r in flows:
            sec = r.cash_flow_section
            if sec not in sections:
                continue
            if r.transaction_type == "credit":
                sections[sec]["inflow"] += r.total
            else:
                sections[sec]["outflow"] += r.total

        net_cash = 0.0
        for sec, data in sections.items():
            data["net"] = data["inflow"] - data["outflow"]
            net_cash += data["net"]

        return {
            "operating": sections["operating"],
            "investing": sections["investing"],
            "financing": sections["financing"],
            "net_cash_change": net_cash
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
