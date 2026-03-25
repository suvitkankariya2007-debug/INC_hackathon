from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.transaction import Transaction
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/statements", tags=["Statements"])

@router.get("/balance-sheet")
def get_balance_sheet(entity_id: int, date: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Transaction).filter(Transaction.entity_id == entity_id)
        if date:
            query = query.filter(Transaction.date <= date)
        
        txs = query.all()
        
        assets = 0.0
        liabilities = 0.0
        equity_base = 0.0  # Original capital/equity transactions
        income = 0.0
        expenses = 0.0
        
        for tx in txs:
            # 1. Calculate traditional BS categories
            if tx.account_type == 'asset':
                assets += tx.amount if tx.transaction_type == 'debit' else -tx.amount
            elif tx.account_type == 'liability':
                liabilities += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            elif tx.account_type == 'equity':
                equity_base += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            
            # 2. Calculate P&L components for "Net Profit"
            elif tx.account_type == 'income':
                income += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            elif tx.account_type == 'expense':
                expenses += tx.amount if tx.transaction_type == 'debit' else -tx.amount
        
        # Total Equity = Stated Equity + Net Profit (Revenue - Expenses)
        net_profit = income - expenses
        total_equity = equity_base + net_profit
        
        return {
            "entity_id": entity_id,
            "as_of": date or datetime.now().strftime("%Y-%m-%d"),
            "assets": round(assets, 2),
            "liabilities": round(liabilities, 2),
            "equity": round(total_equity, 2),
            "total_l_e": round(liabilities + total_equity, 2),
            "is_balanced": abs(assets - (liabilities + total_equity)) < 0.01
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profit-loss")
def get_profit_loss(entity_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Transaction).filter(Transaction.entity_id == entity_id)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
            
        txs = query.all()
        
        income = 0.0
        expenses = 0.0
        category_breakdown = {}
        
        for tx in txs:
            if tx.account_type == 'income':
                val = tx.amount if tx.transaction_type == 'credit' else -tx.amount
                income += val
            elif tx.account_type == 'expense':
                val = tx.amount if tx.transaction_type == 'debit' else -tx.amount
                expenses += val
                
                cat = tx.category or "Uncategorized"
                category_breakdown[cat] = category_breakdown.get(cat, 0.0) + val
                
        return {
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "net_profit": round(income - expenses, 2),
            "expenses_by_category": {k: round(v, 2) for k, v in category_breakdown.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cash-flow")
def get_cash_flow(entity_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Transaction).filter(Transaction.entity_id == entity_id, Transaction.cash_impact == 1)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
            
        txs = query.all()
        
        # Initialize the structure the Frontend expects
        result = {
            "operating": {"total": 0.0, "items": []},
            "investing": {"total": 0.0, "items": []},
            "financing": {"total": 0.0, "items": []}
        }
        
        for tx in txs:
            val = tx.amount if tx.transaction_type == 'credit' else -tx.amount
            section = tx.cash_flow_section # e.g., 'operating'
            
            if section in result:
                result[section]["total"] += val
                result[section]["items"].append({
                    "description": tx.description,
                    "amount": val,
                    "category": tx.category
                })
        
        # Round the totals for clean UI display
        for section in result:
            result[section]["total"] = round(result[section]["total"], 2)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

