# Global Treasury Agent — API Reference

Base URL: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

## Backend startup

### Prerequisites

- Python 3.11+
- pip

### First-time setup

```bash
cd global-treasury-agent

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Start the server

```bash
# From the repo root (not from inside backend/)
uvicorn backend.main:app --reload --port 8000
```

The `--reload` flag restarts the server automatically when you edit a Python file.  
The database file (`backend/treasury.db`) is created on first startup.

### Verify it's running

```bash
curl http://localhost:8000/health
# {"status":"healthy"}
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/upload-invoice` | Upload invoice file (CSV / XLSX / PDF / image) |
| POST | `/upload-bank-statement` | Upload bank statement (CSV / XLSX / PDF / image) |
| GET | `/invoices` | List all stored invoices |
| GET | `/bank-transactions` | List all stored bank transactions |
| POST | `/reconcile` | Reconcile — three modes (see below) |
| GET | `/results` | List all reconciliation results |

---

## curl examples

### Health check

```bash
curl http://localhost:8000/health
```

---

### Upload files

**Invoice — CSV**
```bash
curl -X POST http://localhost:8000/upload-invoice \
  -F "file=@samples/invoices/invoices.csv"
```

**Invoice — XLSX**
```bash
curl -X POST http://localhost:8000/upload-invoice \
  -F "file=@samples/invoices/invoices.xlsx"
```

**Invoice — PDF (placeholder: file saved, no rows extracted)**
```bash
curl -X POST http://localhost:8000/upload-invoice \
  -F "file=@/path/to/invoice.pdf"
# Response: {"message":"PDF invoice parsing requires OCR (coming soon)...","records_stored":0,"records":[]}
```

**Invoice — image (placeholder)**
```bash
curl -X POST http://localhost:8000/upload-invoice \
  -F "file=@/path/to/scan.jpg"
```

**Bank statement — CSV**
```bash
curl -X POST http://localhost:8000/upload-bank-statement \
  -F "file=@samples/bank_statements/bank_statement.csv"
```

**Bank statement — XLSX**
```bash
curl -X POST http://localhost:8000/upload-bank-statement \
  -F "file=@samples/bank_statements/bank_statement.xlsx"
```

**Bank statement — image (placeholder)**
```bash
curl -X POST http://localhost:8000/upload-bank-statement \
  -F "file=@/path/to/scan.png"
```

---

### Reconcile — Mode A: inline (real-time, from frontend form)

All five demo scenarios:

**Perfect match** — USD 10 → MYR 42.50, exact reference and date
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-001",
    "customer":        "ABC Trading Ltd",
    "invoiceAmount":   10.00,
    "invoiceCurrency": "USD",
    "bankReceived":    42.50,
    "bankCurrency":    "MYR",
    "reference":       "TXN-12345",
    "date":            "2026-05-22"
  }'
# Expected: status=Matched, confidence=100
```

**Underpaid** — received MYR 38.00 instead of 42.50
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-002",
    "customer":        "Global Supplies Sdn Bhd",
    "invoiceAmount":   10.00,
    "invoiceCurrency": "USD",
    "bankReceived":    38.00,
    "bankCurrency":    "MYR",
    "reference":       "TXN-12346",
    "date":            "2026-05-21"
  }'
# Expected: status=Underpaid, confidence=60
```

**Overpaid** — received MYR 50.00 instead of 42.50
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-003",
    "customer":        "Pacific Retail Co",
    "invoiceAmount":   10.00,
    "invoiceCurrency": "USD",
    "bankReceived":    50.00,
    "bankCurrency":    "MYR",
    "reference":       "TXN-12347",
    "date":            "2026-05-20"
  }'
# Expected: status=Overpaid, confidence=60
```

**Possible match** — close amount, no reference
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-004",
    "customer":        "Nexus Import Export",
    "invoiceAmount":   10.00,
    "invoiceCurrency": "USD",
    "bankReceived":    42.10,
    "bankCurrency":    "MYR",
    "date":            "2026-05-22"
  }'
# Expected: status=Possible Match, confidence=74
```

**Unmatched** — 88 % deviation, no reference
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-005",
    "customer":        "Unknown Sender",
    "invoiceAmount":   10.00,
    "invoiceCurrency": "USD",
    "bankReceived":    80.00,
    "bankCurrency":    "MYR"
  }'
# Expected: status=Unmatched, confidence=0
```

**EUR invoice**
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-006",
    "customer":        "Euro Imports GmbH",
    "invoiceAmount":   8.00,
    "invoiceCurrency": "EUR",
    "bankReceived":    40.00,
    "bankCurrency":    "MYR",
    "reference":       "TXN-12348",
    "date":            "2026-05-23"
  }'
# Expected: expectedAmount=40.00 (8 * 5.00), status=Matched
```

**SGD invoice**
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo":       "INV-2026-007",
    "customer":        "Singapore Tech Pte Ltd",
    "invoiceAmount":   15.00,
    "invoiceCurrency": "SGD",
    "bankReceived":    48.00,
    "bankCurrency":    "MYR",
    "reference":       "TXN-12349",
    "date":            "2026-05-23"
  }'
# Expected: expectedAmount=48.00 (15 * 3.20), status=Matched
```

---

### Reconcile — Mode B: DB-backed (after uploading files)

**By invoice ID + bank transaction ID**
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": 1, "bank_transaction_id": 1}'
```

**By invoice ID only** (no matched bank transaction)
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": 1}'
```

**Bulk reconcile all stored invoices**
```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### Query stored data

```bash
# All invoices
curl http://localhost:8000/invoices

# All bank transactions
curl http://localhost:8000/bank-transactions

# All reconciliation results
curl http://localhost:8000/results
```

---

## Response shapes

### POST /upload-invoice and POST /upload-bank-statement

```json
{
  "message": "Stored 7 invoice(s).",
  "records_stored": 7,
  "records": [
    {
      "id": 1,
      "invoice_no": "INV-2026-001",
      "customer": "ABC Trading Ltd",
      "invoice_amount": 10.0,
      "invoice_currency": "USD",
      "expected_myr": 42.5,
      "reference": "TXN-12345",
      "invoice_date": "2026-05-22"
    }
  ]
}
```

PDF / image upload (placeholder, HTTP 200):
```json
{
  "message": "PDF invoice parsing requires OCR (coming soon). The file has been saved for future processing. Please also upload a CSV or Excel copy to extract records now.",
  "records_stored": 0,
  "records": []
}
```

### POST /reconcile (Mode A)

```json
{
  "status": "Matched",
  "confidence": 100,
  "expectedAmount": 42.5,
  "receivedAmount": 42.5,
  "difference": 0.0,
  "currency": "MYR",
  "referenceMatch": true,
  "dateMatch": true,
  "amountMatch": true,
  "customerMatch": true,
  "suggestedAction": "Mark invoice as paid and archive reconciliation record.",
  "explanation": "The invoice amount of USD 10.00 was converted to MYR 42.50...",
  "scoreBreakdown": {
    "amountScore": 50,
    "dateScore": 20,
    "referenceScore": 20,
    "customerScore": 10
  },
  "decisionTrace": [
    { "step": 1, "tool": "Input Review",        "text": "Invoice INV-2026-001 loaded for ABC Trading Ltd" },
    { "step": 2, "tool": "Data Extraction",      "text": "Invoice fields extracted: amount USD 10.00, reference TXN-12345, date 2026-05-22" },
    { "step": 3, "tool": "FX Conversion",        "text": "FX conversion: USD 10.00 → MYR 42.50 at rate 4.25" },
    { "step": 4, "tool": "Transaction Matching", "text": "Bank transaction TXN-12345 located — MYR 42.50 on 2026-05-22" },
    { "step": 5, "tool": "Transaction Matching", "text": "Amount match: MYR 42.50 = MYR 42.50 ✓ | Reference: TXN-12345 ✓ | Date: 2026-05-22 ✓" },
    { "step": 6, "tool": "Final Recommendation", "text": "No exceptions detected. Confidence score: 100%. Recommendation: Mark invoice as paid..." }
  ]
}
```

---

## FX rates (fixed for this demo)

| Currency | Rate (→ MYR) |
|----------|-------------|
| USD | 4.25 |
| EUR | 5.00 |
| SGD | 3.20 |
| MYR | 1.00 |

## Confidence scoring weights

| Signal | Max points |
|--------|-----------|
| Amount match | 50 |
| Date match | 20 |
| Reference match | 20 |
| Customer match | 10 |
| **Total** | **100** |

## Status categories

| Status | Condition |
|--------|-----------|
| Matched | ≤ 0.1 % deviation OR (≤ 1 % AND reference confirmed) |
| Underpaid | Reference confirmed, received < expected by 1–30 % |
| Overpaid | Reference confirmed, received > expected by 1–30 % |
| Possible Match | Confidence ≥ 45 but no reference confirmation |
| Unmatched | Confidence < 45 |

---

## Sample files

```
samples/
  invoices/
    invoices.csv    — 7 invoices (USD, EUR, SGD; all 5 demo scenarios + 2 FX variants)
    invoices.xlsx   — same data in Excel format
  bank_statements/
    bank_statement.csv   — 7 matching bank transactions
    bank_statement.xlsx  — same data in Excel format
```

Column names accepted (case-insensitive):

**Invoice file columns**

| Canonical | Also accepted |
|-----------|--------------|
| `Invoice No` | `invoice_no`, `Invoice Number`, `Inv No` |
| `Customer` | `Customer Name`, `Client` |
| `Amount` | `invoice_amount`, `Invoice Amount`, `Amt` |
| `Currency` | `invoice_currency`, `Invoice Currency`, `Curr` |
| `Reference` | `Ref`, `Payment Reference`, `Transaction ID`, `TxnID` |
| `Date` | `invoice_date`, `Invoice Date` |

**Bank statement columns**

| Canonical | Also accepted |
|-----------|--------------|
| `Date` | `Transaction Date`, `Txn Date` |
| `Reference` | `Ref`, `Transaction ID`, `TxnID` |
| `Description` | `Desc`, `Narration`, `Details`, `Particulars` |
| `Amount` | `Amt`, `Credit`, `Credit Amount` |
| `Currency` | `Curr` |
