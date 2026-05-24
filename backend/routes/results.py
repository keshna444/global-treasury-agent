"""GET /results — return all reconciliation results in frontend-compatible shape."""

import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.database import ReconciliationResult, Invoice, get_db
from backend.schemas.schemas import ReconciliationResultOut, ReconciliationResultsResponse

router = APIRouter()


def _format_result(result: ReconciliationResult, db: Session) -> dict:
    """Serialize a ReconciliationResult ORM row to the shape ReconciliationResultOut expects.

    invoice_no and customer are resolved from the Invoice relationship here because
    they are not columns on ReconciliationResult itself.
    JSON text columns (score_breakdown, decision_trace) are parsed to dicts/lists.
    """
    invoice = result.invoice or db.get(Invoice, result.invoice_id)

    return {
        "id":             result.id,
        "invoice_no":     invoice.invoice_no if invoice else None,
        "customer":       invoice.customer   if invoice else None,
        "status":         result.status,
        "confidence":     result.confidence,
        "expectedAmount": result.expected_amount,
        "receivedAmount": result.received_amount,
        "difference":     result.difference,
        "currency":       "MYR",
        "amountMatch":    result.amount_match,
        "dateMatch":      result.date_match,
        "referenceMatch": result.reference_match,
        "customerMatch":  result.customer_match,
        "scoreBreakdown": json.loads(result.score_breakdown or "{}"),
        "explanation":    result.explanation,
        "suggestedAction": result.suggested_action,
        "decisionTrace":  json.loads(result.decision_trace or "[]"),
        "created_at":     result.created_at.isoformat() if result.created_at else None,
    }


@router.get("/results", response_model=ReconciliationResultsResponse)
def get_results(db: Session = Depends(get_db)):
    """Return all reconciliation results, newest first."""
    results = (
        db.query(ReconciliationResult)
        .order_by(ReconciliationResult.created_at.desc())
        .all()
    )
    return ReconciliationResultsResponse(
        count=len(results),
        results=[ReconciliationResultOut(**_format_result(r, db)) for r in results],
    )
