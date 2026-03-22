from fastapi import FastAPI
from database import engine, Base
from services.classifier import init_classifier

from routers import entities, transactions, classify, audit, reconcile, analytics, statements

Base.metadata.create_all(bind=engine)

init_classifier()

app = FastAPI(title="LedgerAI Backend")

app.include_router(entities.router)
app.include_router(transactions.router)
app.include_router(classify.router)
app.include_router(audit.router)
app.include_router(reconcile.router)
app.include_router(analytics.router)
app.include_router(statements.router)
