"""
FILE: backend/routes/bank_statement.py  [MODIFIED]
RESPONSIBILITY: Handle bank statement file uploads and transaction listing.

ENDPOINTS:
  POST /upload-bank-statement  — accept a file, parse it, store rows in DB
  GET  /bank-transactions      — return all stored bank transactions

TEAMMATE INTEGRATION:
  - Frontend: an Upload page would POST a bank CSV/Excel here.
  - backend/utils/parser.py        : parse_bank_statement_file() does parsing.
  - backend/models/database.py     : BankTransaction ORM model + get_db.
  - backend/schemas/schemas.py     : BankTransactionOut and UploadResponse.
  - backend/routes/reconciliation.py : after uploading, POST /reconcile (Mode B)
                                       matches these transactions against invoices.

NOTE: Bank transactions do not enforce uniqueness (unlike invoices which require
a unique invoice_no).  The same bank statement can be re-uploaded safely — it
will create duplicate rows.  Add a unique constraint to the ORM model if needed.
"""

import os
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List

from backend.models.database import BankTransaction, get_db
from backend.schemas.schemas import BankTransactionOut, UploadResponse
from backend.utils.parser import FormatNotSupported, parse_bank_statement_file

router = APIRouter()

UPLOAD_DIR = "backend/uploads"


def _ensure_upload_dir() -> None:
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_file(file_bytes: bytes, prefix: str, filename: str) -> None:
    _ensure_upload_dir()
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_DIR, f"{prefix}_{safe_name}")
    with open(path, "wb") as fh:
        fh.write(file_bytes)


@router.post("/upload-bank-statement", response_model=UploadResponse)
async def upload_bank_statement(
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db),
):
    """Accept a bank statement file and store all rows in the database.

    Request body: multipart/form-data with a 'file' field.
    Accepted file types: .csv, .xlsx, .xls, .pdf (placeholder), .png/.jpg (placeholder)

    Response (UploadResponse):
        message        — e.g. "Stored 7 bank transaction(s)."
        records_stored — count of rows written
        records        — list of stored rows (BankTransactionOut shape)

    All amounts are stored in MYR.  If the uploaded file has a 'currency' column
    with a value other than MYR, the amount is stored as-is — conversion is the
    responsibility of the reconciliation engine, not the upload step.
    """
    file_bytes = await file.read()
    filename   = file.filename or "upload"

    # Save first for audit trail
    _save_file(file_bytes, "bank", filename)

    try:
        rows = parse_bank_statement_file(file_bytes, filename)
    except FormatNotSupported as exc:
        return UploadResponse(message=str(exc), records_stored=0, records=[])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    stored: list[dict] = []
    for row in rows:
        txn = BankTransaction(
            date            = row.get("date"),
            reference       = row.get("reference"),
            description     = row.get("description"),
            amount          = row["amount"],
            currency        = row.get("currency", "MYR"),
            source_filename = filename,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)
        # Serialise via schema to match GET /bank-transactions response shape
        stored.append(BankTransactionOut.model_validate(txn).model_dump())

    return UploadResponse(
        message=f"Stored {len(stored)} bank transaction(s).",
        records_stored=len(stored),
        records=stored,
    )


@router.get("/bank-transactions", response_model=List[BankTransactionOut])
def list_bank_transactions(db: Session = Depends(get_db)):
    """Return all stored bank transactions as a JSON array.
    Displayed in the frontend's BankStatementTable.jsx component.
    """
    return db.query(BankTransaction).all()
