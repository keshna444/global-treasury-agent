"""
FILE: backend/models/database.py  [MODIFIED]
RESPONSIBILITY: Defines the SQLite database schema using SQLAlchemy ORM models.
                Every table that gets created in treasury.db is declared here.

TEAMMATE INTEGRATION:
  - backend/routes/*         : all route files import Invoice, BankTransaction,
                               ReconciliationResult, and get_db from this file.
  - backend/services/reconciliation_service.py : imports the ORM models to
                               read invoices/transactions and persist results.
  - backend/schemas/schemas.py : Pydantic schemas mirror these models for
                               request/response validation.

DATABASE FILE: backend/treasury.db  (SQLite, auto-created on first run)
  Tables: invoices | bank_transactions | reconciliation_results

WORKFLOW:
  1. Accountant uploads invoice CSV  → rows inserted into `invoices`
  2. Accountant uploads bank CSV     → rows inserted into `bank_transactions`
  3. POST /reconcile runs the engine → result stored in `reconciliation_results`
                                       linking invoice_id ↔ bank_transaction_id
"""

from sqlalchemy import (
    create_engine, Column, Integer, Float, String,
    Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime


# Path is relative to where you run uvicorn (repo root).
DATABASE_URL = "sqlite:///./backend/treasury.db"

# check_same_thread=False is required for SQLite when used with FastAPI's async
# request handling — SQLite normally blocks cross-thread access, but SQLAlchemy
# manages session safety, so this is safe here.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# SessionLocal is a factory: call SessionLocal() to get a DB session object.
# autocommit=False means changes only save when you explicitly call db.commit().
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class all ORM models inherit from.
# SQLAlchemy uses it to discover and create tables.
Base = declarative_base()


# ── Table: invoices ───────────────────────────────────────────────────────────
# Stores one row per invoice uploaded by the accountant.
# Populated by POST /upload-invoice (backend/routes/invoice.py).

class Invoice(Base):
    __tablename__ = "invoices"

    id               = Column(Integer, primary_key=True, index=True)
    invoice_no       = Column(String,  unique=True, index=True, nullable=False)  # e.g. "INV-2026-001"
    customer         = Column(String,  nullable=False)                           # company name
    invoice_amount   = Column(Float,   nullable=False)   # amount in original currency (e.g. 10.00 USD)
    invoice_currency = Column(String,  nullable=False)   # ISO code: USD / EUR / SGD / MYR
    expected_myr     = Column(Float,   nullable=False)   # pre-computed MYR equivalent (amount × rate)
    reference        = Column(String)                    # payment reference, e.g. "TXN-12345" (nullable)
    invoice_date     = Column(String)                    # ISO format YYYY-MM-DD (nullable)
    source_filename  = Column(String)                    # name of the uploaded CSV/Excel file
    created_at       = Column(DateTime, default=datetime.utcnow)

    # One invoice can have many reconciliation attempts (e.g. re-runs).
    # This lets you do: invoice.results  to get all ReconciliationResult rows.
    results = relationship("ReconciliationResult", back_populates="invoice")


# ── Table: bank_transactions ──────────────────────────────────────────────────
# Stores one row per transaction line from an uploaded bank statement.
# Populated by POST /upload-bank-statement (backend/routes/bank_statement.py).

class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id              = Column(Integer, primary_key=True, index=True)
    date            = Column(String)              # YYYY-MM-DD (nullable — some banks omit it)
    reference       = Column(String, index=True)  # indexed for fast reference lookups
    description     = Column(String)             # free-text description from the bank
    amount          = Column(Float, nullable=False)  # always stored in MYR
    currency        = Column(String, default="MYR")
    source_filename = Column(String)
    created_at      = Column(DateTime, default=datetime.utcnow)

    results = relationship("ReconciliationResult", back_populates="bank_transaction")


# ── Table: reconciliation_results ─────────────────────────────────────────────
# Stores the output of each reconciliation run.
# Written by backend/services/reconciliation_service.py.
# Read by GET /results (backend/routes/results.py) and displayed in the frontend.

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id                  = Column(Integer, primary_key=True, index=True)

    # Foreign keys link this result back to the source invoice and bank row.
    # bank_transaction_id is nullable — a result can exist even when no bank
    # transaction could be matched (status = Unmatched).
    invoice_id          = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    bank_transaction_id = Column(Integer, ForeignKey("bank_transactions.id"), nullable=True)

    # ── Reconciliation outcome ────────────────────────────────────────────────
    status          = Column(String,  nullable=False)  # Matched / Underpaid / Overpaid / Possible Match / Unmatched
    confidence      = Column(Integer, nullable=False)  # 0–100 (sum of per-field scores)
    expected_amount = Column(Float,   nullable=False)  # invoice amount in MYR
    received_amount = Column(Float)                    # bank amount in MYR (nullable if no match)
    difference      = Column(Float)                    # received − expected (negative = underpaid)

    # ── Per-field match flags (True/False for each signal) ───────────────────
    amount_match    = Column(Boolean, default=False)
    date_match      = Column(Boolean, default=False)
    reference_match = Column(Boolean, default=False)
    customer_match  = Column(Boolean, default=False)

    # ── Detailed breakdown stored as JSON strings ────────────────────────────
    # These are serialised to JSON text in the DB and parsed back to dicts by
    # _format_result() in backend/routes/results.py before sending to the frontend.
    score_breakdown = Column(Text)  # e.g. '{"amountScore":50,"dateScore":20,...}'
    explanation     = Column(Text)  # human-readable paragraph for the audit trail
    suggested_action = Column(Text) # one-sentence next step for the accountant
    decision_trace  = Column(Text)  # JSON list of 6 step-by-step reasoning entries

    created_at = Column(DateTime, default=datetime.utcnow)

    # ORM relationships — lets you access result.invoice and result.bank_transaction
    invoice          = relationship("Invoice",         back_populates="results")
    bank_transaction = relationship("BankTransaction", back_populates="results")


# ── Helpers ───────────────────────────────────────────────────────────────────

def create_tables():
    """Create all tables defined above if they don't already exist.
    Called once at server startup (see backend/main.py → on_startup).
    Safe to call on a database that already has data — it only adds missing tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that provides a database session to route handlers.

    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
            invoices = db.query(Invoice).all()

    The 'finally' block guarantees the session is closed even if the route
    raises an exception, preventing connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
