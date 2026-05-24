"""
FILE: backend/routes/invoice.py  [MODIFIED]
RESPONSIBILITY: Handle invoice file uploads and invoice listing.

ENDPOINTS:
  POST /upload-invoice       — accept a file, parse it, store rows in DB
  GET  /invoices             — return all stored invoices

TEAMMATE INTEGRATION:
  - Frontend: the Upload page (if implemented) would POST to /upload-invoice
    with a multipart/form-data request containing the file.
  - backend/utils/parser.py       : parse_invoice_file() does the actual parsing.
  - backend/services/currency_service.py : to_myr() pre-computes the MYR value.
  - backend/models/database.py    : Invoice ORM model + get_db session.
  - backend/schemas/schemas.py    : InvoiceOut and UploadResponse define the
                                    JSON shape returned to the caller.

UPLOAD WORKFLOW:
  1. Read file bytes from the request.
  2. Save raw file to backend/uploads/ (audit trail, future OCR).
  3. Parse bytes → list of row dicts (via parser.py).
  4. If format is PDF/image → return 200 with records_stored=0 + message.
  5. For each row: compute expected_myr, insert Invoice row, skip duplicates.
  6. Return UploadResponse summarising what was stored.
"""

import os
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from backend.models.database import Invoice, get_db
from backend.schemas.schemas import InvoiceOut, UploadResponse
from backend.services.currency_service import to_myr
from backend.utils.parser import FormatNotSupported, parse_invoice_file

router = APIRouter()

UPLOAD_DIR = "backend/uploads"


def _ensure_upload_dir() -> None:
    """Create the uploads directory if it doesn't exist yet."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_file(file_bytes: bytes, prefix: str, filename: str) -> None:
    """Persist raw file bytes to backend/uploads/ for audit/OCR purposes.
    Prefix keeps invoice and bank files visually separate in the directory.
    """
    _ensure_upload_dir()
    safe_name = os.path.basename(filename)          # strip any path components
    path = os.path.join(UPLOAD_DIR, f"{prefix}_{safe_name}")
    with open(path, "wb") as fh:
        fh.write(file_bytes)


@router.post("/upload-invoice", response_model=UploadResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Accept an invoice file and store all parseable rows in the database.

    Request body: multipart/form-data with a 'file' field.
    Accepted file types: .csv, .xlsx, .xls, .pdf (placeholder), .png/.jpg (placeholder)

    Response (UploadResponse):
        message        — human-readable summary
        records_stored — number of rows written to DB (0 for PDF/image)
        records        — list of stored Invoice objects (InvoiceOut shape)

    PDF / image behaviour: the file is saved but returns records_stored=0 with
    an explanation that OCR is not yet implemented.  HTTP status is still 200.

    Duplicate handling: if an invoice_no already exists in the DB the row is
    skipped (not an error) and reported in the 'message' field.
    """
    file_bytes = await file.read()
    filename   = file.filename or "upload"

    # Save first — even PDFs are preserved for future processing
    _save_file(file_bytes, "invoice", filename)

    try:
        rows = parse_invoice_file(file_bytes, filename)
    except FormatNotSupported as exc:
        # PDF / image — file saved, no rows extracted, but not an error
        return UploadResponse(message=str(exc), records_stored=0, records=[])
    except ValueError as exc:
        # Bad data inside the file (wrong columns, non-numeric amount, etc.)
        raise HTTPException(status_code=400, detail=str(exc))

    stored:  list[dict] = []
    skipped: list[str]  = []

    for row in rows:
        # Pre-compute the MYR equivalent and store it with the invoice.
        # This avoids re-computing it every time reconciliation runs.
        try:
            expected_myr = to_myr(row["invoice_amount"], row["invoice_currency"])
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        invoice = Invoice(
            invoice_no       = row["invoice_no"],
            customer         = row["customer"],
            invoice_amount   = row["invoice_amount"],
            invoice_currency = row["invoice_currency"],
            expected_myr     = expected_myr,
            reference        = row.get("reference"),
            invoice_date     = row.get("invoice_date"),
            source_filename  = filename,
        )
        try:
            db.add(invoice)
            db.commit()
            db.refresh(invoice)
            # Serialise via InvoiceOut to guarantee a consistent response shape
            stored.append(InvoiceOut.model_validate(invoice).model_dump())
        except IntegrityError:
            # invoice_no is UNIQUE — silently skip duplicates
            db.rollback()
            skipped.append(row["invoice_no"])

    msg = f"Stored {len(stored)} invoice(s)."
    if skipped:
        msg += f" Skipped {len(skipped)} duplicate(s): {', '.join(skipped)}."

    return UploadResponse(message=msg, records_stored=len(stored), records=stored)


@router.get("/invoices", response_model=List[InvoiceOut])
def get_invoices(db: Session = Depends(get_db)):
    """Return all stored invoices as a JSON array.
    Primarily used for debugging and for the frontend's transaction-listing views.
    response_model=List[InvoiceOut] handles ORM-to-JSON serialisation automatically.
    """
    return db.query(Invoice).all()
