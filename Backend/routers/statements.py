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
        equity = 0.0
        
        for tx in txs:
            if tx.account_type == 'asset':
                assets += tx.amount if tx.transaction_type == 'debit' else -tx.amount
            elif tx.account_type == 'liability':
                liabilities += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            elif tx.account_type == 'equity':
                equity += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            elif tx.account_type == 'income':
                # Retained earnings part of equity
                equity += tx.amount if tx.transaction_type == 'credit' else -tx.amount
            elif tx.account_type == 'expense':
                equity -= tx.amount if tx.transaction_type == 'debit' else -tx.amount
        
        return {
            "entity_id": entity_id,
            "as_of": date or datetime.now().strftime("%Y-%m-%d"),
            "assets": round(assets, 2),
            "liabilities": round(liabilities, 2),
            "equity": round(equity, 2),
            "total_l_e": round(liabilities + equity, 2),
            "is_balanced": abs(assets - (liabilities + equity)) < 0.01
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
        
        operating = 0.0
        investing = 0.0
        financing = 0.0
        
        for tx in txs:
            val = tx.amount if tx.transaction_type == 'credit' else -tx.amount
            if tx.cash_flow_section == 'operating':
                operating += val
            elif tx.cash_flow_section == 'investing':
                investing += val
            elif tx.cash_flow_section == 'financing':
                financing += val
        
        return {
            "operating": round(operating, 2),
            "investing": round(investing, 2),
            "financing": round(financing, 2),
            "net_cash_flow": round(operating + investing + financing, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

