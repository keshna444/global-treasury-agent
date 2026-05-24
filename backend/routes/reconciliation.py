"""
FILE: backend/routes/reconciliation.py  [MODIFIED]
RESPONSIBILITY: POST /reconcile — the core endpoint that triggers the AI
                reconciliation engine.  Supports three calling modes detected
                at runtime from the request body.

TEAMMATE INTEGRATION:
  - Frontend → Mode A: Dashboard.jsx calls POST /reconcile with the inline form
    values from InvoicePanel.jsx.  The response drives MatchingResult.jsx,
    AuditTrail.jsx, and the AgentWorkflow animation.
    See: frontend/src/services/reconciliationApi.js → runReconciliation()
  - Database → Mode B/C: reads Invoice and BankTransaction rows, writes
    ReconciliationResult rows via reconciliation_service.py.
  - backend/services/reconciliation_service.py: all matching logic lives there.
  - backend/routes/results.py: _format_result() is shared for Mode B/C responses.

THREE MODES:
  Mode A — Direct (real-time frontend use):
    Body has invoiceNo + invoiceAmount + invoiceCurrency + bankReceived.
    Runs reconcile_direct() — no DB reads or writes.
    Returns a DirectReconcileResult dict immediately.
    This is the path used for the live demo in the dashboard.

  Mode B — ID-based (DB-backed, after uploading files):
    Body has invoice_id (and optionally bank_transaction_id).
    Reads from DB, runs reconcile_invoice(), writes result to DB.
    Returns { message, results: [ReconciliationResultOut] }.

  Mode C — Bulk (reconcile everything):
    Empty body {}.
    Runs reconcile_all() — reconciles every invoice with no existing result.
    Returns { message, results: [...] }.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import Invoice, BankTransaction, get_db
from backend.schemas.schemas import ReconcileRequest
from backend.services.reconciliation_service import (
    reconcile_invoice,
    reconcile_all,
    reconcile_direct,
)
from backend.routes.results import _format_result

router = APIRouter()


@router.post("/reconcile")
def reconcile(
    request: ReconcileRequest = ReconcileRequest(),
    db: Session = Depends(get_db),
):
    """Run payment reconciliation in one of three modes.

    FRONTEND USAGE (Mode A):
        POST /reconcile
        Content-Type: application/json
        Body: {
            "invoiceNo":       "INV-2026-001",
            "customer":        "ABC Trading Ltd",
            "invoiceAmount":   10.00,
            "invoiceCurrency": "USD",
            "bankReceived":    42.50,
            "bankCurrency":    "MYR",
            "reference":       "TXN-12345",   // optional
            "date":            "2026-05-22"   // optional
        }

    RESPONSE (Mode A) — DirectReconcileResult shape:
        {
            "status":          "Matched",
            "confidence":      100,
            "expectedAmount":  42.50,
            "receivedAmount":  42.50,
            "difference":      0.0,
            "currency":        "MYR",
            "referenceMatch":  true,
            "dateMatch":       true,
            "amountMatch":     true,
            "customerMatch":   true,
            "suggestedAction": "Mark invoice as paid...",
            "explanation":     "...",
            "scoreBreakdown":  { "amountScore": 50, ... },
            "decisionTrace":   [ { "step": 1, "tool": "...", "text": "..." }, ... ]
        }
    """

    # ── Mode A: inline data from the frontend form ────────────────────────────
    # Detected when the four core invoice fields are present in the request body.
    if (
        request.invoiceNo is not None
        and request.invoiceAmount is not None
        and request.invoiceCurrency is not None
        and request.bankReceived is not None
    ):
        # reconcile_direct() is stateless — it does not touch the database.
        # It normalises currencies, scores the pair, and returns the full result
        # dict that the frontend components expect.
        try:
            result = reconcile_direct(
                invoice_no       = request.invoiceNo,
                customer         = request.customer or "",
                invoice_amount   = request.invoiceAmount,
                invoice_currency = request.invoiceCurrency,
                bank_received    = request.bankReceived,
                bank_currency    = request.bankCurrency or "MYR",
                reference        = request.reference,
                date             = request.date,
            )
        except ValueError as exc:
            # normalize_currency() raises ValueError for unrecognised currency codes
            raise HTTPException(status_code=422, detail=str(exc))
        # Return the dict directly — its shape already matches DirectReconcileResult
        return result

    # ── Mode B: reconcile a specific previously-uploaded invoice ─────────────
    if request.invoice_id is not None:
        invoice = db.get(Invoice, request.invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail=f"Invoice {request.invoice_id} not found.")

        bank_txn = None
        if request.bank_transaction_id is not None:
            bank_txn = db.get(BankTransaction, request.bank_transaction_id)
            if not bank_txn:
                raise HTTPException(
                    status_code=404,
                    detail=f"Bank transaction {request.bank_transaction_id} not found.",
                )

        # reconcile_invoice() finds the best-matching bank transaction (if bank_txn
        # is None it searches all transactions), scores the pair, and persists the result.
        result = reconcile_invoice(db, invoice, bank_txn)
        return {
            "message": "Reconciliation complete.",
            "results": [_format_result(result, db)],
        }

    # ── Mode C: bulk-reconcile all pending invoices ───────────────────────────
    # reconcile_all() queries every invoice that has no ReconciliationResult yet
    # and runs reconcile_invoice() for each one.
    results = reconcile_all(db)

    if not results:
        return {
            "message": "No pending invoices to reconcile. Upload invoices first.",
            "results": [],
        }

    return {
        "message": f"Reconciled {len(results)} invoice(s).",
        "results": [_format_result(r, db) for r in results],
    }
