# Global Treasury Agent

An AI-powered payment reconciliation tool for SMEs managing cross-border transactions. Upload invoices and bank statements, then let the engine automatically match payments, detect discrepancies, and explain its decisions — with confidence scores and step-by-step audit trails.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Requirements](#2-system-requirements)
3. [Dependencies](#3-dependencies)
4. [Installation](#4-installation)
5. [Environment Setup](#5-environment-setup)
6. [How to Run Locally](#6-how-to-run-locally)
7. [Project Structure](#7-project-structure)
8. [How the System Works](#8-how-the-system-works)
9. [API Endpoints](#9-api-endpoints)
10. [Sample Files](#10-sample-files)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Overview

Global Treasury Agent helps accountants reconcile international payments without manual spreadsheet work.

**Core workflow:**
1. Upload an invoice file (CSV or Excel) — stores invoices in a local database
2. Upload a bank statement file (CSV or Excel) — stores received transactions
3. Run reconciliation — the AI engine matches invoices to bank transactions, converts currencies, scores confidence, and explains each decision
4. Review results — see match status, confidence score, amount differences, and a 6-step decision trace

**Reconciliation outcomes:**

| Status | Meaning |
|---|---|
| Matched | Invoice amount equals bank received (after FX) |
| Underpaid | Bank received less than expected |
| Overpaid | Bank received more than expected |
| Possible Match | Close but not exact — review recommended |
| Unmatched | No viable bank transaction found |

**Supported currencies:** USD, EUR, SGD, MYR (fixed exchange rates — see [How the System Works](#8-how-the-system-works))

---

## 2. System Requirements

| Software | Minimum Version | How to check |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |

**Operating system:** macOS, Linux, or Windows (WSL recommended on Windows).

**Database:** No installation needed. The project uses SQLite — a file-based database that is created automatically when you first start the backend (`backend/treasury.db`).

---

## 3. Dependencies

### Backend (Python)

| Package | Purpose |
|---|---|
| `fastapi` | Web framework for the REST API |
| `uvicorn` | ASGI server that runs FastAPI |
| `sqlalchemy` | ORM for reading/writing the SQLite database |
| `pydantic` | Request/response data validation |
| `python-multipart` | File upload support |
| `pandas` | CSV and Excel file parsing |
| `openpyxl` | Required by pandas to read `.xlsx` files |
| `aiofiles` | Async file saving for uploads |

### Frontend (Node.js)

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `vite` | Frontend dev server and build tool |
| `tailwindcss` | Utility-first CSS styling |
| `framer-motion` | Animations for the agent workflow |
| `lucide-react` | Icon library |

---

## 4. Installation

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd global-treasury-agent
```

### Step 2 — Set up the Python backend

Create and activate a virtual environment (keeps dependencies isolated):

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt)
python -m venv venv
venv\Scripts\activate

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

You should see all packages install without errors. If you see `ERROR: Could not find a version...`, check that you are using Python 3.11 or newer.

### Step 3 — Set up the frontend

```bash
cd frontend
npm install
cd ..
```

This installs all Node packages listed in `frontend/package.json`. It creates a `frontend/node_modules/` folder — this is normal and expected.

---

## 5. Environment Setup

**No `.env` file is required.** All configuration is hardcoded for local development:

| Setting | Value | Location |
|---|---|---|
| Database file | `backend/treasury.db` | `backend/models/database.py` |
| Backend port | `8000` | start command |
| Frontend port | `5173` | Vite default |
| API base URL | `http://localhost:8000` | `frontend/src/services/reconciliationApi.js` |
| FX rates | USD=4.25, EUR=5.00, SGD=3.20, MYR=1.00 | `backend/services/currency_service.py` |

The SQLite database file (`backend/treasury.db`) is created automatically the first time you start the backend server. You do not need to run any database setup commands.

---

## 6. How to Run Locally

You need **two terminal windows open at the same time** — one for the backend, one for the frontend.

### Terminal 1 — Start the backend

Run this from the **repo root** (the folder that contains `backend/` and `frontend/`):

```bash
uvicorn backend.main:app --reload --port 8000
```

Expected output:
```
INFO:     Will watch for changes in these directories: ['/path/to/global-treasury-agent']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

> **Important:** Always run this command from the repo root, not from inside the `backend/` folder. The database path is relative to your working directory.

### Terminal 2 — Start the frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

### Open the app

Go to **http://localhost:5173** in your browser.

The dashboard loads immediately with sample data. When the backend is running, it switches to live data automatically.

### Verify everything is working

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

---

## 7. Project Structure

```
global-treasury-agent/
│
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # Entry point — registers all routes and middleware
│   ├── requirements.txt            # Python dependencies
│   ├── treasury.db                 # SQLite database (auto-created on first run)
│   │
│   ├── models/
│   │   └── database.py             # SQLAlchemy ORM models (Invoice, BankTransaction, ReconciliationResult)
│   │
│   ├── schemas/
│   │   └── schemas.py              # Pydantic schemas for request/response validation
│   │
│   ├── routes/
│   │   ├── invoice.py              # POST /upload-invoice, GET /invoices
│   │   ├── bank_statement.py       # POST /upload-bank-statement, GET /bank-transactions
│   │   ├── reconciliation.py       # POST /reconcile (core endpoint)
│   │   └── results.py              # GET /results
│   │
│   ├── services/
│   │   ├── reconciliation_service.py  # Matching logic, confidence scoring, status classification
│   │   └── currency_service.py        # FX conversion (USD/EUR/SGD → MYR)
│   │
│   ├── utils/
│   │   └── parser.py               # CSV/Excel file parsing with pandas
│   │
│   └── uploads/                    # Saved copies of uploaded files (auto-created)
│
├── frontend/                       # React + Vite frontend
│   ├── package.json                # Node dependencies and scripts
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   │
│   └── src/
│       ├── main.jsx                # React app entry point
│       ├── App.jsx                 # Root component with routing
│       ├── pages/
│       │   └── Dashboard.jsx       # Main reconciliation workspace
│       ├── components/             # UI components (InvoicePanel, MatchingResult, etc.)
│       ├── services/
│       │   └── reconciliationApi.js  # fetch() calls to the backend API
│       └── data/
│           └── mockData.js         # Fallback data used when backend is unreachable
│
├── samples/                        # Example files you can upload to test the system
│   ├── invoices/
│   │   ├── invoices.csv
│   │   └── invoices.xlsx
│   └── bank_statements/
│       ├── bank_statement.csv
│       └── bank_statement.xlsx
│
├── STARTUP_GUIDE.md                # Detailed guide with curl examples and troubleshooting
└── README.md                       # This file
```

---

## 8. How the System Works

### Currency conversion

All amounts are normalised to MYR before comparison. Fixed exchange rates:

| Currency | Rate (1 unit → MYR) |
|---|---|
| USD | 4.25 |
| EUR | 5.00 |
| SGD | 3.20 |
| MYR | 1.00 |

Example: An invoice for USD 10.00 expects MYR 42.50 in the bank.

### Confidence scoring

The engine scores each invoice-transaction pair out of 100 points:

| Signal | Max points | How it's scored |
|---|---|---|
| Amount match | 50 | Exact = 50, within 1% = 45, within 5% = 35, within 10% = 20, within 20% = 5, off = 0 |
| Date match | 20 | Same day = 20, within 3 days = 15, within 7 days = 10, within 30 days = 5, off = 0 |
| Reference match | 20 | Exact = 20, fuzzy match by edit distance = 15/10/5/2, no match = 0 |
| Customer match | 10 | Normalised name match (ignores "Ltd", "Sdn Bhd", etc.) |

### Three reconciliation modes

The `POST /reconcile` endpoint supports three calling modes detected from the request body:

- **Mode A — Direct (dashboard form):** Send invoice fields directly. Stateless — no database reads or writes. Used by the live demo.
- **Mode B — ID-based:** Send `invoice_id` (and optionally `bank_transaction_id`). Reads from DB, writes result to DB.
- **Mode C — Bulk:** Send empty `{}`. Reconciles every invoice that has no result yet.

---

## 9. API Endpoints

All endpoints are available at `http://localhost:8000`. Interactive docs: **http://localhost:8000/docs**

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check — returns `{"status":"healthy"}` |
| POST | `/upload-invoice` | Upload a CSV or Excel invoice file |
| GET | `/invoices` | List all stored invoices |
| POST | `/upload-bank-statement` | Upload a CSV or Excel bank statement |
| GET | `/bank-transactions` | List all stored bank transactions |
| POST | `/reconcile` | Run reconciliation (Mode A, B, or C) |
| GET | `/results` | List all reconciliation results |

### Quick test — run a reconciliation with curl

```bash
curl -s -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNo": "INV-2026-001",
    "customer": "ABC Trading Ltd",
    "invoiceAmount": 10.00,
    "invoiceCurrency": "USD",
    "bankReceived": 42.50,
    "bankCurrency": "MYR"
  }' | python3 -m json.tool
```

Expected: `"status": "Matched"`, `"confidence": 100`

---

## 10. Sample Files

The `samples/` folder contains ready-to-upload test files.

### Invoice CSV format

```
Invoice No,Customer,Amount,Currency,Reference,Date
INV-2026-001,ABC Trading Ltd,10.0,USD,TXN-12345,2026-05-22
INV-2026-002,Global Supplies Sdn Bhd,10.0,USD,TXN-12346,2026-05-21
```

**Required columns:** `Invoice No`, `Customer`, `Amount`, `Currency`
**Optional columns:** `Reference`, `Date`

The parser accepts many column name variations — `Inv No`, `Invoice Number`, `Amt`, `Curr`, etc. — so you don't need to reformat your existing files.

### Bank statement CSV format

```
Date,Reference,Description,Amount,Currency
2026-05-22,TXN-12345,Payment from ABC Trading,42.50,MYR
```

**Required columns:** `Amount`
**Optional columns:** `Date`, `Reference`, `Description`, `Currency` (defaults to MYR if omitted)

### Supported file types

| Format | Invoices | Bank Statements |
|---|---|---|
| `.csv` | Parsed | Parsed |
| `.xlsx` / `.xls` | Parsed | Parsed |
| `.pdf` | Saved (OCR coming soon) | Saved (OCR coming soon) |
| `.png`, `.jpg` etc. | Saved (OCR coming soon) | Saved (OCR coming soon) |

PDF and image uploads return HTTP 200 with `records_stored: 0` — the file is saved but no rows are extracted yet.

---

## 11. Troubleshooting

### `ModuleNotFoundError: No module named 'backend'`

You are running uvicorn from inside the `backend/` folder. Move up one level:

```bash
cd ..   # go back to the repo root
uvicorn backend.main:app --reload --port 8000
```

### `[Errno 48] Address already in use` (port 8000)

Another process is already using port 8000. Find and stop it:

```bash
lsof -ti :8000 | xargs kill
```

Then restart the server.

### Frontend shows "mock data" instead of live data

The frontend falls back to mock data when the backend is unreachable. Check:

1. Is the backend running? (`curl http://localhost:8000/health`)
2. Did you start it on port 8000? (not 8001 or another port)
3. Any errors in the backend terminal?

### `pip install` fails with `ERROR: Could not find a version`

You may be using Python 2 or an old Python 3. Check:

```bash
python3 --version   # must be 3.11 or newer
```

If you have multiple Python versions, use `python3.11` or `python3.12` explicitly when creating the venv.

### `npm install` fails with `ERESOLVE`

Try:

```bash
npm install --legacy-peer-deps
```

### Uploaded CSV gives `missing required columns` error

Check that your file has the right column headers. The parser accepts many variations but requires at least:
- Invoices: a column for invoice number, customer name, amount, and currency
- Bank statements: a column for amount

Upload the files in `samples/` first to confirm the system is working, then compare your file's column names.

### `treasury.db` not found error

The database is created automatically when the server starts. If you see this error, the server likely failed to start. Check the backend terminal output for Python errors.

### Changes to `.py` files are not reflected

Make sure you started the server with `--reload`. If you did not, stop the server (`Ctrl+C`) and restart with the full command:

```bash
uvicorn backend.main:app --reload --port 8000
```
