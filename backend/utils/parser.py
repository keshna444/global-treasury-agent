"""
FILE: backend/utils/parser.py  [MODIFIED — NEW FILE created for this project]
RESPONSIBILITY: Parse uploaded invoice and bank statement files (CSV / Excel /
                PDF / image) into clean Python dicts that the upload routes can
                insert into the database.

TEAMMATE INTEGRATION:
  - backend/routes/invoice.py       : calls parse_invoice_file()
  - backend/routes/bank_statement.py: calls parse_bank_statement_file()
  - No frontend integration — this is a pure data-processing layer.

SUPPORTED FORMATS:
  CSV (.csv)          — parsed with pandas read_csv (UTF-8, falls back to latin-1)
  Excel (.xlsx/.xls)  — parsed with pandas read_excel (requires openpyxl)
  PDF (.pdf)          — placeholder: file saved for future OCR, zero rows returned
  Images (png/jpg/…)  — same placeholder behaviour as PDF

COLUMN FLEXIBILITY:
  Real-world spreadsheets rarely use the exact column names we need.
  INVOICE_COLUMN_MAP and BANK_COLUMN_MAP map common variations to our canonical
  field names so teammates can upload files without reformatting them first.

ADDING A NEW CURRENCY ALIAS OR COLUMN NAME:
  Just add an entry to the relevant dict at the top of this file.
"""

from __future__ import annotations

import io
import os
import pandas as pd
from typing import Any


# ── Custom exception ──────────────────────────────────────────────────────────

class FormatNotSupported(Exception):
    """Raised when a file format is recognised but cannot be parsed yet (PDF/images).

    This is different from ValueError (bad data inside a valid file).
    The upload route catches FormatNotSupported and returns HTTP 200 with
    records_stored=0 and an explanation message — the file is saved for future
    OCR processing.  ValueError results in HTTP 400 (bad request).

    Attributes:
        ext (str): the file extension that triggered this, e.g. ".pdf"
    """
    def __init__(self, message: str, ext: str) -> None:
        super().__init__(message)
        self.ext = ext


# ── Column name alias maps ────────────────────────────────────────────────────
# Key  : lowercased, stripped column name as it appears in the uploaded file
# Value: the canonical field name our code uses internally
#
# Example: an Excel file might have "Invoice Number" or "Inv No" — both map
# to "invoice_no" so the rest of the code only needs to handle one name.

INVOICE_COLUMN_MAP: dict[str, str] = {
    # invoice_no
    "invoiceno":      "invoice_no",
    "invoice_no":     "invoice_no",
    "invoice no":     "invoice_no",
    "invoice number": "invoice_no",
    "invoicenumber":  "invoice_no",
    "inv_no":         "invoice_no",
    "inv no":         "invoice_no",
    # customer
    "customer":       "customer",
    "customername":   "customer",
    "customer name":  "customer",
    "client":         "customer",
    # invoice_amount
    "invoiceamount":  "invoice_amount",
    "invoice_amount": "invoice_amount",
    "invoice amount": "invoice_amount",
    "amount":         "invoice_amount",
    "amt":            "invoice_amount",
    # invoice_currency
    "invoicecurrency":   "invoice_currency",
    "invoice_currency":  "invoice_currency",
    "invoice currency":  "invoice_currency",
    "currency":          "invoice_currency",
    "curr":              "invoice_currency",
    # reference
    "reference":         "reference",
    "ref":               "reference",
    "payment_reference": "reference",
    "payment reference": "reference",
    "txn":               "reference",
    "txnid":             "reference",
    "transaction_id":    "reference",
    "transaction id":    "reference",
    # invoice_date
    "invoicedate":  "invoice_date",
    "invoice_date": "invoice_date",
    "invoice date": "invoice_date",
    "date":         "invoice_date",
}

BANK_COLUMN_MAP: dict[str, str] = {
    # date
    "date":             "date",
    "transaction_date": "date",
    "transaction date": "date",
    "txn_date":         "date",
    "txn date":         "date",
    # reference
    "reference":       "reference",
    "ref":             "reference",
    "transaction_id":  "reference",
    "transaction id":  "reference",
    "txnid":           "reference",
    "txn":             "reference",
    # description
    "description": "description",
    "desc":        "description",
    "narration":   "description",
    "details":     "description",
    "particulars": "description",
    # amount
    "amount":        "amount",
    "amt":           "amount",
    "credit":        "amount",     # some bank exports label credits separately
    "credit_amount": "amount",
    # currency
    "currency": "currency",
    "curr":     "currency",
}


# ── Private helpers ───────────────────────────────────────────────────────────

def _normalise_columns(df: pd.DataFrame, column_map: dict[str, str]) -> pd.DataFrame:
    """Rename DataFrame columns to canonical names using the alias map.
    Matching is case-insensitive and strips leading/trailing whitespace."""
    rename: dict[str, str] = {}
    for col in df.columns:
        key = str(col).strip().lower()
        if key in column_map:
            rename[col] = column_map[key]
    return df.rename(columns=rename)


def _safe_str(val: Any) -> str | None:
    """Convert a cell value to a clean string, or None if it's empty/NaN.

    Pandas represents blank cells as float('nan').  Without this helper,
    str(nan) returns the literal string "nan" — which would be stored in the
    DB and break reference matching.  This function catches that case.

    Also treats "n/a", "none", "-", and blank strings as None.
    """
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    s = str(val).strip()
    # Treat these common placeholder values as "no data"
    return None if s.lower() in ("", "nan", "none", "n/a", "na", "-") else s


def _safe_float(val: Any, field: str, row_idx: int) -> float:
    """Parse a cell value as a float, raising a clear error on failure.

    Strips commas so values like "1,234.56" parse correctly.

    Input : val       — raw cell value from pandas
            field     — field name for the error message (e.g. "invoice_amount")
            row_idx   — 1-based row number for the error message
    Output: float
    Raises: ValueError with a human-readable message if parsing fails
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        raise ValueError(f"Row {row_idx}: '{field}' is missing or empty.")
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        raise ValueError(f"Row {row_idx}: '{field}' value '{val}' is not a number.")


def _read_tabular(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV or Excel file bytes into a pandas DataFrame.

    CSV files are tried with UTF-8 first, then latin-1 as fallback.
    Latin-1 is common in files exported from legacy accounting software (e.g.
    files that contain accented characters in customer names).

    Input : file_bytes — raw bytes from the uploaded file
            filename   — used only to determine the file extension
    Raises: ValueError for unsupported extensions
    """
    ext = os.path.splitext(filename)[1].lower()
    buf = io.BytesIO(file_bytes)

    if ext == ".csv":
        try:
            return pd.read_csv(buf, encoding="utf-8", skip_blank_lines=True)
        except UnicodeDecodeError:
            # Retry with latin-1 for files from legacy systems
            buf.seek(0)
            return pd.read_csv(buf, encoding="latin-1", skip_blank_lines=True)

    if ext in (".xlsx", ".xls"):
        return pd.read_excel(buf)   # openpyxl handles .xlsx; xlrd handles .xls

    raise ValueError(f"Unsupported file extension: '{ext}'")


# Extensions that we accept (save the file) but cannot yet parse (no OCR).
_PLACEHOLDER_EXTS = frozenset(
    {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".tiff", ".bmp"}
)


# ── Public parsers ────────────────────────────────────────────────────────────

def parse_invoice_file(file_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    """Parse an invoice file and return a list of row dicts ready for DB insertion.

    Each returned dict has these keys:
      Required: invoice_no (str), customer (str), invoice_amount (float),
                invoice_currency (str, uppercase ISO code)
      Optional: reference (str | None), invoice_date (str | None)

    The upload route (backend/routes/invoice.py) iterates the returned list and
    creates one Invoice ORM row per dict.

    Raises:
        FormatNotSupported — PDF or image: file is already saved by caller;
                             route returns 200 with records_stored=0.
        ValueError         — wrong/missing column names, or bad data in a row.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext in _PLACEHOLDER_EXTS:
        raise FormatNotSupported(
            f"{ext.lstrip('.').upper()} invoice parsing requires OCR (coming soon). "
            "The file has been saved for future processing. "
            "Please also upload a CSV or Excel copy to extract records now.",
            ext=ext,
        )

    df = _read_tabular(file_bytes, filename)
    df = _normalise_columns(df, INVOICE_COLUMN_MAP)
    df = df.dropna(how="all")   # silently discard fully blank rows

    # Fail early if the file is missing a required column
    required = {"invoice_no", "customer", "invoice_amount", "invoice_currency"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"Invoice file is missing required columns: {sorted(missing)}. "
            f"Found columns: {list(df.columns)}"
        )

    records: list[dict[str, Any]] = []
    for idx, (_, row) in enumerate(df.iterrows(), start=1):
        invoice_no = _safe_str(row.get("invoice_no"))
        customer   = _safe_str(row.get("customer"))
        currency   = _safe_str(row.get("invoice_currency"))

        if not invoice_no:
            raise ValueError(f"Row {idx}: 'invoice_no' is blank.")
        if not customer:
            raise ValueError(f"Row {idx}: 'customer' is blank.")
        if not currency:
            raise ValueError(f"Row {idx}: 'invoice_currency' is blank.")

        records.append({
            "invoice_no":       invoice_no,
            "customer":         customer,
            "invoice_amount":   _safe_float(row.get("invoice_amount"), "invoice_amount", idx),
            "invoice_currency": currency.upper(),   # always store as uppercase ISO code
            "reference":        _safe_str(row.get("reference")),
            "invoice_date":     _safe_str(row.get("invoice_date")),
        })

    return records


def parse_bank_statement_file(file_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    """Parse a bank statement file and return a list of row dicts for DB insertion.

    Each returned dict has these keys:
      Required: amount (float)
      Optional: date (str | None), reference (str | None),
                description (str | None), currency (str, defaults to "MYR")

    The upload route (backend/routes/bank_statement.py) iterates this list and
    creates one BankTransaction ORM row per dict.

    Raises:
        FormatNotSupported — PDF or image (same behaviour as invoice parser)
        ValueError         — missing 'amount' column or unparseable data
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext in _PLACEHOLDER_EXTS:
        raise FormatNotSupported(
            f"{ext.lstrip('.').upper()} bank statement parsing requires OCR (coming soon). "
            "The file has been saved for future processing. "
            "Please also upload a CSV or Excel copy to extract records now.",
            ext=ext,
        )

    df = _read_tabular(file_bytes, filename)
    df = _normalise_columns(df, BANK_COLUMN_MAP)
    df = df.dropna(how="all")

    if "amount" not in df.columns:
        raise ValueError(
            f"Bank statement must have an 'amount' column. "
            f"Found columns: {list(df.columns)}"
        )

    records: list[dict[str, Any]] = []
    for idx, (_, row) in enumerate(df.iterrows(), start=1):
        # Default currency to MYR — most Malaysian bank exports omit this column
        currency = _safe_str(row.get("currency")) or "MYR"
        records.append({
            "date":        _safe_str(row.get("date")),
            "reference":   _safe_str(row.get("reference")),
            "description": _safe_str(row.get("description")),
            "amount":      _safe_float(row.get("amount"), "amount", idx),
            "currency":    currency.upper(),
        })

    return records
