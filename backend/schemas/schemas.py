"""
FILE: backend/schemas/schemas.py  [MODIFIED]
RESPONSIBILITY: Pydantic data models that define the exact shape of API request
                bodies and response payloads.  FastAPI uses these automatically
                for input validation and JSON serialisation.

TEAMMATE INTEGRATION:
  - backend/routes/*  : each route imports the schemas it needs for
                        request parsing (input) and response_model (output).
  - Frontend          : response shapes here must match what the React components
                        read.  Key contract: DirectReconcileResult must match the
                        fields read in MatchingResult.jsx and AuditTrail.jsx.
  - backend/models/database.py : the ORM models are the source of truth for
                        what's stored in the DB; schemas here are the API layer
                        on top.  model_config = {"from_attributes": True} lets
                        Pydantic read directly from SQLAlchemy ORM objects.

NOTE: InvoiceCreate and BankTransactionCreate were intentionally removed —
      upload routes build ORM objects directly from the parser output dict,
      so those schemas were dead code.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Invoice response schema ───────────────────────────────────────────────────
# Used as response_model for GET /invoices and embedded in UploadResponse.records
# when an invoice is successfully stored.

class InvoiceOut(BaseModel):
    id:               int
    invoice_no:       str
    customer:         str
    invoice_amount:   float           # original currency amount
    invoice_currency: str             # ISO code: USD / EUR / SGD / MYR
    expected_myr:     float           # pre-computed MYR value stored at upload time
    reference:        Optional[str]   # payment reference, may be None
    invoice_date:     Optional[str]   # YYYY-MM-DD or None
    source_filename:  Optional[str]
    created_at:       datetime

    # from_attributes=True allows Pydantic to read fields from a SQLAlchemy ORM
    # object (e.g. InvoiceOut.model_validate(invoice_orm_row)) instead of a dict.
    model_config = {"from_attributes": True}


# ── Bank transaction response schema ──────────────────────────────────────────
# Used as response_model for GET /bank-transactions and in UploadResponse.records.

class BankTransactionOut(BaseModel):
    id:              int
    date:            Optional[str]    # YYYY-MM-DD or None
    reference:       Optional[str]
    description:     Optional[str]    # free-text bank narration
    amount:          float            # always in MYR
    currency:        str
    source_filename: Optional[str]
    created_at:      datetime

    model_config = {"from_attributes": True}


# ── Confidence score breakdown ────────────────────────────────────────────────
# Sub-object nested inside DirectReconcileResult and ReconciliationResultOut.
# The frontend reads these four fields to render the score bar in MatchingResult.jsx.

class ScoreBreakdown(BaseModel):
    amountScore:    int   # 0–50  : how close the received MYR is to expected
    dateScore:      int   # 0–20  : how close invoice date is to bank date
    referenceScore: int   # 0–20  : how well payment references match
    customerScore:  int   # 0–10  : how much the customer name appears in bank description
                          # Total 0–100; see reconciliation_service.py for scoring logic


# ── Generic upload response ───────────────────────────────────────────────────
# Returned by both POST /upload-invoice and POST /upload-bank-statement.
# 'records' is List[dict] because the two endpoints return different record shapes
# (InvoiceOut vs BankTransactionOut); keeping it generic avoids two separate schemas.

class UploadResponse(BaseModel):
    message:        str        # human-readable summary, e.g. "Stored 7 invoice(s)."
    records_stored: int        # count of rows actually written to the database
    records:        List[dict] # the stored rows (InvoiceOut or BankTransactionOut shape)


# ── Reconcile request ─────────────────────────────────────────────────────────
# Single schema for POST /reconcile, which supports two different calling modes
# detected at runtime by reconciliation.py.
#
# MODE A — Direct / real-time (used by the React frontend):
#   The Dashboard sends the invoice form values directly.  No prior file upload
#   needed.  The response comes back in ~1 second and drives the live UI.
#   Fields: invoiceNo, customer, invoiceAmount, invoiceCurrency, bankReceived,
#           bankCurrency, reference, date
#
# MODE B — DB-backed (for batch processing after uploading files):
#   Reconcile a previously uploaded invoice by its database ID.
#   Empty body → bulk-reconcile all invoices that have no result yet.
#   Fields: invoice_id, bank_transaction_id

class ReconcileRequest(BaseModel):
    # Mode A — camelCase matches the invoiceData object shape in Dashboard.jsx
    invoiceNo:       Optional[str]   = None
    customer:        Optional[str]   = None
    invoiceAmount:   Optional[float] = None
    invoiceCurrency: Optional[str]   = None  # "USD", "EUR", "SGD", or "MYR"
    bankReceived:    Optional[float] = None  # amount the bank actually received
    bankCurrency:    Optional[str]   = "MYR" # almost always MYR for this project
    reference:       Optional[str]   = None  # payment reference from the form
    date:            Optional[str]   = None  # YYYY-MM-DD

    # Mode B
    invoice_id:          Optional[int] = None
    bank_transaction_id: Optional[int] = None


# ── Direct reconcile result ───────────────────────────────────────────────────
# Shape returned by POST /reconcile in Mode A (inline/real-time call).
# FRONTEND CONTRACT: every field here is read by one or more React components:
#   status, confidence, amountMatch, referenceMatch  → MatchingResult.jsx
#   decisionTrace                                    → AuditTrail.jsx
#   suggestedAction, explanation                     → MatchingResult.jsx / ReconciliationResult.jsx
#   scoreBreakdown                                   → MatchingResult.jsx score bars

class DirectReconcileResult(BaseModel):
    status:          str            # Matched / Underpaid / Overpaid / Possible Match / Unmatched
    confidence:      int            # 0–100
    expectedAmount:  float          # invoice amount converted to MYR
    receivedAmount:  float          # bank received amount in MYR
    difference:      float          # receivedAmount − expectedAmount (negative = short)
    currency:        str            # always "MYR" for this project
    referenceMatch:  bool
    dateMatch:       bool
    amountMatch:     bool
    customerMatch:   bool
    suggestedAction: str            # e.g. "Mark invoice as paid and archive..."
    explanation:     str            # multi-sentence human-readable analysis
    scoreBreakdown:  ScoreBreakdown
    decisionTrace:   List[dict]     # 6-step reasoning list: [{step, tool, text}, ...]


# ── DB-backed result item ─────────────────────────────────────────────────────
# Shape for each item in the GET /results response.
# invoice_no and customer come from the related Invoice row (resolved in
# _format_result() in backend/routes/results.py — they are not columns on
# ReconciliationResult itself).

class ReconciliationResultOut(BaseModel):
    id:              int
    invoice_no:      Optional[str]
    customer:        Optional[str]
    status:          str
    confidence:      int
    expectedAmount:  float
    receivedAmount:  Optional[float]
    difference:      Optional[float]
    currency:        str
    amountMatch:     bool
    dateMatch:       bool
    referenceMatch:  bool
    customerMatch:   bool
    scoreBreakdown:  ScoreBreakdown
    explanation:     str
    suggestedAction: str
    decisionTrace:   List[dict]
    created_at:      Optional[str]


# ── Paginated results wrapper ─────────────────────────────────────────────────
# The outer envelope returned by GET /results.
# Provides a count alongside the list so the frontend doesn't need to measure
# the array length itself.

class ReconciliationResultsResponse(BaseModel):
    count:   int
    results: List[ReconciliationResultOut]
