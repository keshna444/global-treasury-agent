"""
FILE: backend/services/reconciliation_service.py  [MODIFIED — core engine]
RESPONSIBILITY: The reconciliation engine — everything that decides whether an
                invoice payment has been received and how well it matches.

TEAMMATE INTEGRATION:
  - backend/routes/reconciliation.py : calls reconcile_direct() (Mode A),
    reconcile_invoice() (Mode B), and reconcile_all() (Mode C).
  - backend/models/database.py       : reads Invoice and BankTransaction rows;
    writes ReconciliationResult rows.
  - backend/services/currency_service.py : used to normalise currencies and
    convert amounts to MYR before scoring.
  - Frontend                         : reconcile_direct() returns a dict whose
    keys exactly match what MatchingResult.jsx, AuditTrail.jsx, and
    ReconciliationResult.jsx read.  Do not rename keys without updating the
    corresponding .jsx component.

ARCHITECTURE — WHY DATACLASSES?
  The scoring helpers (score_pair, classify_status, etc.) are pure functions
  with no DB dependency.  They accept InvoiceData / BankTxnData dataclasses
  instead of ORM objects so they can be tested standalone without a database
  session.  The ORM-to-dataclass conversion happens in _invoice_to_data() and
  _txn_to_data() right before scoring begins.

SCORING OVERVIEW  (total 100 points):
  ┌─────────────────┬──────────────┬────────────────────────────────────────┐
  │ Signal          │ Max points   │ Why this weight?                       │
  ├─────────────────┼──────────────┼────────────────────────────────────────┤
  │ Amount match    │ 50           │ Wrong amount = almost certainly wrong   │
  │ Date match      │ 20           │ Strong signal for cross-border wires    │
  │ Reference match │ 20           │ Best uniqueness signal when present     │
  │ Customer name   │ 10           │ Weakest — bank descriptions vary a lot  │
  └─────────────────┴──────────────┴────────────────────────────────────────┘

STATUS CATEGORIES:
  Matched       — high confidence, payment confirmed
  Underpaid     — confirmed payment but amount is short (e.g. bank deducted fees)
  Overpaid      — confirmed payment but amount is excess
  Possible Match — some evidence but not enough to confirm
  Unmatched     — no credible payment found
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.models.database import Invoice, BankTransaction, ReconciliationResult
from backend.services.currency_service import to_myr, format_currency, normalize_currency


# ══════════════════════════════════════════════════════════════════════════════
# Data containers
# These are plain Python dataclasses — no database dependency.
# They let the scoring functions work with clean, typed data regardless of
# whether it came from an ORM row (DB mode) or a form POST (direct mode).
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class InvoiceData:
    """Normalised invoice fields for the scoring and text-building helpers."""
    invoice_no:    str
    customer:      str
    amount:        float          # original amount in invoice_currency (e.g. 10.00)
    currency:      str            # normalised ISO code, e.g. "USD"
    expected_myr:  float          # amount already converted to MYR (e.g. 42.50)
    reference:     Optional[str]  # payment reference, may be None
    date:          Optional[str]  # invoice date YYYY-MM-DD, may be None


@dataclass
class BankTxnData:
    """Normalised bank-transaction fields for the scoring helpers."""
    amount_myr:   float           # bank received amount in MYR
    reference:    Optional[str]   # bank's payment reference, may be None
    date:         Optional[str]   # bank value date YYYY-MM-DD, may be None
    description:  Optional[str]   # bank narration text, used for customer scoring


@dataclass
class ScoreResult:
    """
    Holds the raw score for each matching signal plus derived properties.

    Scoring weights (must sum to 100):
        amount_score    0–50   How close is the received MYR to the expected MYR?
        date_score      0–20   How close is the bank date to the invoice date?
        reference_score 0–20   How well do the payment references match?
        customer_score  0–10   Does the bank description mention the customer name?
    """
    amount_score:    int
    date_score:      int
    reference_score: int
    customer_score:  int

    @property
    def total(self) -> int:
        """Sum of all four scores (0–100).  Used as the 'confidence' percentage."""
        return self.amount_score + self.date_score + self.reference_score + self.customer_score

    @property
    def amount_match(self) -> bool:
        """True when received amount is within ~1% of expected (score ≥ 44)."""
        return self.amount_score >= 44

    @property
    def reference_match(self) -> bool:
        """True only for exact or normalised-exact reference matches (score ≥ 18).
        A 1-char typo scores 15 and is intentionally NOT treated as confirmed
        to avoid false positives on payment references."""
        return self.reference_score >= 18

    @property
    def date_match(self) -> bool:
        """True when invoice and bank dates are the same calendar day (score == 20)."""
        return self.date_score == 20

    @property
    def customer_match(self) -> bool:
        """True when ≥ 70% of customer name words appear in the bank description."""
        return self.customer_score >= 7

    def as_dict(self) -> dict:
        """Return the breakdown as a dict for JSON serialisation to the DB and frontend."""
        return {
            "amountScore":    self.amount_score,
            "dateScore":      self.date_score,
            "referenceScore": self.reference_score,
            "customerScore":  self.customer_score,
        }


# ══════════════════════════════════════════════════════════════════════════════
# String normalisation helpers (private)
# ══════════════════════════════════════════════════════════════════════════════

def _normalize_ref(ref: str) -> str:
    """Strip all non-alphanumeric characters and uppercase for reference comparison.
    'TXN-12345', 'TXN 12345', and 'TXN12345' all normalise to 'TXN12345'.
    This prevents reference formatting differences from causing false mismatches.
    """
    return re.sub(r"[^A-Z0-9]", "", ref.upper())


def _levenshtein(a: str, b: str) -> int:
    """Compute the edit distance (number of single-character edits) between two strings.
    Used by _reference_score() to detect near-miss references (e.g. one digit typo).
    Capped at 24 characters each to keep the O(n²) cost bounded.
    """
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    a, b = a[:24], b[:24]
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        curr = [i]
        for j, cb in enumerate(b, 1):
            cost = 0 if ca == cb else 1
            curr.append(min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost))
        prev = curr
    return prev[-1]


# Legal entity suffixes stripped before name comparison.
# 'Global Supplies Sdn Bhd' → 'global supplies' so the core name is compared.
_LEGAL_SUFFIXES: frozenset[str] = frozenset({
    "sdn", "bhd", "berhad",
    "ltd", "limited",
    "pte",
    "inc", "incorporated",
    "corp", "corporation",
    "llc", "llp", "plc",
    "co", "company",
    "group", "holdings",
})


def _normalize_name(name: str) -> str:
    """Prepare a company name for word-overlap comparison.
    Steps: lowercase → remove punctuation → strip legal suffix tokens from right.
    Example: 'Global Supplies Sdn Bhd' → 'global supplies'
    """
    clean = re.sub(r"[^\w\s]", " ", name.lower())
    words = clean.split()
    # Pop trailing legal-entity tokens until we hit a non-suffix word
    while words and words[-1] in _LEGAL_SUFFIXES:
        words.pop()
    return " ".join(words)


# ══════════════════════════════════════════════════════════════════════════════
# Per-field scoring functions (private)
# Each returns an integer score for its specific signal.
# ══════════════════════════════════════════════════════════════════════════════

def _amount_score(expected: float, received: float) -> int:
    """Score how closely the received MYR amount matches the expected MYR amount.

    AMOUNT SCORING TIERS (0–50 points):
    ┌───────┬──────────────┬────────┬──────────────────────────────────────────┐
    │ Tier  │ Deviation    │ Points │ Real-world meaning                       │
    ├───────┼──────────────┼────────┼──────────────────────────────────────────┤
    │  A    │ ≤ 0.1 %      │  50    │ Exact match (rounding only)              │
    │  B    │ ≤ 1.0 %      │  44    │ Tiny FX spread or rounding discrepancy   │
    │  C    │ ≤ 5.0 %      │  30    │ Small bank fee deducted                  │
    │  D    │ ≤ 10 %       │  20    │ Noticeable shortfall or premium          │
    │  E    │ ≤ 20 %       │  10    │ Significant gap, unusual                 │
    │  F    │ > 20 %       │   0    │ Completely wrong payment amount           │
    └───────┴──────────────┴────────┴──────────────────────────────────────────┘
    """
    if expected == 0:
        return 0
    diff_pct = abs(expected - received) / expected
    if diff_pct <= 0.001:  return 50
    if diff_pct <= 0.01:   return 44
    if diff_pct <= 0.05:   return 30
    if diff_pct <= 0.10:   return 20
    if diff_pct <= 0.20:   return 10
    return 0


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse a date string into a Python date object, trying common formats.
    Returns None if date_str is None or doesn't match any known format.
    Formats tried: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY.
    """
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            pass
    return None


def _date_score(date1: Optional[str], date2: Optional[str]) -> int:
    """Score how close the invoice date and bank value date are.

    DATE SCORING TIERS (0–20 points):
    ┌───────┬──────────┬────────┬──────────────────────────────────────────────┐
    │ Delta │ Days     │ Points │ Real-world meaning                           │
    ├───────┼──────────┼────────┼──────────────────────────────────────────────┤
    │   0   │ same day │  20    │ Perfect — invoice and payment same day       │
    │   1   │ 1 day    │  15    │ Next-day value dating (common in SWIFT wires)│
    │  2–3  │ 2-3 days │  10    │ Settlement lag (normal for cross-border)     │
    │  > 3  │ > 3 days │   0    │ Too far apart — not a reliable signal        │
    └───────┴──────────┴────────┴──────────────────────────────────────────────┘
    Returns 0 if either date is missing or cannot be parsed.
    """
    d1 = _parse_date(date1)
    d2 = _parse_date(date2)
    if d1 is None or d2 is None:
        return 0
    delta = abs((d1 - d2).days)
    if delta == 0:  return 20
    if delta == 1:  return 15
    if delta <= 3:  return 10
    return 0


def _reference_score(ref1: Optional[str], ref2: Optional[str]) -> int:
    """Score similarity between two payment references.

    REFERENCE SCORING TIERS (0–20 points):
    ┌──────┬─────────────────────────────────────────┬────────┐
    │ Tier │ Condition                               │ Points │
    ├──────┼─────────────────────────────────────────┼────────┤
    │  1   │ Exact match (case-insensitive)          │  20    │
    │  2   │ Normalised exact (strip dashes/spaces)  │  18    │
    │  3   │ Edit distance 1 on normalised strings   │  15    │ ← 1 typo
    │  4   │ Edit distance 2 on normalised strings   │  10    │ ← 2 chars diff
    │  5   │ Prefix match (one is prefix of other)   │   8    │ ← partial ref
    │  6   │ No useful match                         │   0    │
    └──────┴─────────────────────────────────────────┴────────┘
    Returns 0 if either reference is None/empty.

    NOTE: Only tiers 1 and 2 (score ≥ 18) set reference_match = True in ScoreResult.
    A 1-char typo (tier 3, score 15) stays at "Possible Match" to avoid false
    positives — e.g. TXN-12345 ≠ TXN-12346 even with only one digit different.
    """
    if not ref1 or not ref2:
        return 0

    # Tier 1: exact case-insensitive match
    if ref1.strip().upper() == ref2.strip().upper():
        return 20

    n1 = _normalize_ref(ref1)
    n2 = _normalize_ref(ref2)
    if not n1 or not n2:
        return 0

    # Tier 2: normalised exact (handles "TXN-12345" vs "TXN12345")
    if n1 == n2:
        return 18

    # Tiers 3–4: edit distance (only meaningful when strings are similar length)
    if abs(len(n1) - len(n2)) <= 2:
        dist = _levenshtein(n1, n2)
        if dist == 1:  return 15
        if dist == 2:  return 10

    # Tier 5: prefix match (e.g. "TXN-12" found in "TXN-12345")
    if n1.startswith(n2) or n2.startswith(n1):
        return 8

    return 0


def _customer_score(customer: str, description: Optional[str]) -> int:
    """Score how much of the customer name appears in the bank description.

    STRATEGY:
      1. Normalise both strings: lowercase, strip punctuation, remove legal suffixes.
         'ABC Trading Ltd' → 'abc trading'
      2. Count how many customer words (length ≥ 2) appear in the bank description.
      3. Map the match ratio to a 0–10 score.

    CUSTOMER SCORING TIERS (0–10 points):
    ┌──────────────┬────────┬───────────────────────────────────────┐
    │ Word overlap │ Points │ Example                               │
    ├──────────────┼────────┼───────────────────────────────────────┤
    │ 100 %        │  10    │ "abc trading" fully in description    │
    │ ≥ 70 %       │   7    │ Most words present                    │
    │ ≥ 40 %       │   4    │ Some words present                    │
    │ < 40 %       │   0    │ Very little overlap                   │
    └──────────────┴────────┴───────────────────────────────────────┘
    Returns 0 if either input is empty/None.
    """
    if not customer or not description:
        return 0

    norm_cust = _normalize_name(customer)
    norm_desc = re.sub(r"[^\w\s]", " ", description.lower())

    # Only consider words of ≥ 2 chars (avoids noise from single letters)
    words = [w for w in norm_cust.split() if len(w) >= 2]
    if not words:
        return 0

    matches = sum(1 for w in words if w in norm_desc)
    ratio   = matches / len(words)

    if ratio >= 1.0:   return 10
    if ratio >= 0.70:  return 7
    if ratio >= 0.40:  return 4
    return 0


# ══════════════════════════════════════════════════════════════════════════════
# Core scoring — public, pure, reusable
# ══════════════════════════════════════════════════════════════════════════════

def score_pair(inv: InvoiceData, txn: BankTxnData) -> ScoreResult:
    """Score one invoice ↔ bank-transaction pair across all four signals.

    Input : InvoiceData and BankTxnData (both normalised, amounts in MYR)
    Output: ScoreResult with per-field integer scores and derived match flags

    This function is pure — no DB access, no side effects.  Safe to call in a
    loop across many candidates to find the best match.
    """
    return ScoreResult(
        amount_score    = _amount_score(inv.expected_myr, txn.amount_myr),
        date_score      = _date_score(inv.date, txn.date),
        reference_score = _reference_score(inv.reference, txn.reference),
        customer_score  = _customer_score(inv.customer, txn.description),
    )


# ══════════════════════════════════════════════════════════════════════════════
# Status classification — public, pure
# ══════════════════════════════════════════════════════════════════════════════

def classify_status(
    score:    ScoreResult,
    expected: float,
    received: Optional[float],
) -> str:
    """Map a score + amount pair to one of five reconciliation status categories.

    CLASSIFICATION RULES (checked in priority order):
    ┌─────────────────┬──────────────────────────────────────────────────────┐
    │ Status          │ Condition                                            │
    ├─────────────────┼──────────────────────────────────────────────────────┤
    │ Matched         │ deviation ≤ 1% AND reference confirmed (score ≥ 18)  │
    │                 │  OR deviation ≤ 0.1% AND total score ≥ 80           │
    │ Underpaid       │ reference confirmed AND deviation ≤ 30% AND short    │
    │ Overpaid        │ reference confirmed AND deviation ≤ 30% AND excess   │
    │ Possible Match  │ total score ≥ 45 (some evidence but not confirmed)   │
    │ Unmatched       │ total score < 45 (no credible match found)           │
    └─────────────────┴──────────────────────────────────────────────────────┘

    WHY reference_match requires score ≥ 18 (not ≥ 15):
      A 1-char typo in the reference (e.g. TXN-12345 vs TXN-12346) scores 15
      and should NOT trigger Underpaid/Overpaid — that would be a false positive.
      Score ≥ 18 means either exact or normalised-exact match only.

    Input : ScoreResult, expected MYR amount, received MYR amount (or None)
    Output: one of the five status strings
    """
    if received is None:
        return "Unmatched"

    diff     = received - expected
    diff_pct = abs(diff) / expected if expected != 0 else 1.0

    # Matched: amount is close AND reference is confirmed
    if diff_pct <= 0.01 and score.reference_match:
        return "Matched"

    # Matched: perfectly exact amount with very high overall score (even without ref)
    if diff_pct <= 0.001 and score.total >= 80:
        return "Matched"

    # Directional mismatches — only when reference confirms the payment identity
    if score.reference_match and diff_pct <= 0.30:
        if diff < -0.01:   # received is more than 1 cent short
            return "Underpaid"
        if diff > 0.01:    # received is more than 1 cent over
            return "Overpaid"

    # Possible Match: some evidence but not enough for full confirmation
    if score.total >= 45:
        return "Possible Match"

    return "Unmatched"


# ══════════════════════════════════════════════════════════════════════════════
# Text generation — public, pure
# These build the human-readable content shown in AuditTrail.jsx.
# ══════════════════════════════════════════════════════════════════════════════

def build_explanation(
    inv:      InvoiceData,
    txn:      Optional[BankTxnData],
    status:   str,
    score:    ScoreResult,
    expected: float,
    received: Optional[float],
) -> str:
    """Generate a multi-sentence explanation of the reconciliation outcome.

    Input : all the data needed to describe what happened
    Output: string shown in MatchingResult.jsx / AuditTrail.jsx as the explanation

    FRONTEND INTEGRATION: this string is displayed verbatim in the UI.
    Keep sentences concise — they appear in a fixed-height panel.
    """
    orig_str = format_currency(inv.amount, inv.currency)
    exp_str  = format_currency(expected, "MYR")
    rate     = expected / inv.amount if inv.amount else 1.0

    if txn is None or received is None:
        return (
            f"No bank transaction could be matched to invoice {inv.invoice_no}. "
            "The invoice remains unreconciled. Manual investigation is required."
        )

    rcv_str  = format_currency(received, "MYR")
    diff     = round(received - expected, 2)
    diff_str = format_currency(abs(diff), "MYR")

    if status == "Matched":
        return (
            f"The invoice amount of {orig_str} was converted to {exp_str} "
            f"at a rate of {rate:.2f}. "
            f"The bank received {exp_str} on the same date with matching "
            f"reference {txn.reference}. "
            "All fields — amount, date, reference, and counterparty — are confirmed. "
            "This payment can be marked as reconciled."
        )

    if status == "Underpaid":
        return (
            f"The expected amount was {exp_str}, but the bank received {rcv_str}. "
            f"The payment is short by {diff_str}. "
            f"Reference {txn.reference} and date match confirm this is a payment "
            f"from {inv.customer}. "
            "The shortfall may be due to international wire-transfer fees deducted "
            "at the originating bank. This item should be flagged for follow-up."
        )

    if status == "Overpaid":
        return (
            f"The bank received {rcv_str} against an expected {exp_str} "
            f"for invoice {inv.invoice_no}. "
            f"An overpayment of {diff_str} was detected. "
            f"Reference {txn.reference} and date match confirm the payment is from "
            f"{inv.customer}. "
            "The customer may have applied an incorrect FX rate or included an advance "
            "payment. A credit note or refund process should be initiated."
        )

    if status == "Possible Match":
        issues: list[str] = []
        if not score.reference_match:
            exp_ref = inv.reference or "N/A"
            got_ref = txn.reference or "N/A"
            if exp_ref != got_ref:
                issues.append(f"reference mismatch (expected {exp_ref}, found {got_ref})")
            else:
                issues.append("reference near-miss (possible typo)")
        if not score.amount_match:
            issues.append(f"amount delta {diff_str}")
        if not score.date_match:
            issues.append("date mismatch")
        issues_str = "; ".join(issues) if issues else "minor discrepancies"
        return (
            f"A near-match was detected for invoice {inv.invoice_no}. "
            f"Issues found: {issues_str}. "
            "Manual review is required to confirm."
        )

    # Unmatched
    ref = txn.reference or "N/A"
    return (
        f"No matching invoice was found for bank reference {ref}. "
        f"The received amount {rcv_str} does not correspond to any open invoice. "
        "This transaction cannot be reconciled automatically and requires "
        "manual investigation."
    )


def build_suggested_action(status: str, difference: Optional[float]) -> str:
    """Return a one-sentence action item for the finance team.
    Shown in MatchingResult.jsx as the recommended next step.
    """
    if status == "Matched":
        return "Mark invoice as paid and archive reconciliation record."
    if status == "Underpaid" and difference is not None:
        return f"Request remaining balance of MYR {abs(difference):.2f} from customer."
    if status == "Overpaid" and difference is not None:
        return f"Flag excess MYR {abs(difference):.2f} for refund or apply as credit note."
    if status == "Possible Match":
        return "Manually verify discrepancies with the finance team."
    return "Escalate to finance team. Investigate source and intent of transfer."


def build_trace(
    inv:      InvoiceData,
    txn:      Optional[BankTxnData],
    expected: float,
    received: Optional[float],
    status:   str,
    score:    ScoreResult,
) -> list[dict]:
    """Build the 6-step decision trace displayed in AuditTrail.jsx.

    Each entry: { "step": int, "tool": str, "text": str }
    The "tool" names must match the TOOL_COLORS mapping in AuditTrail.jsx
    so the coloured labels render correctly.

    FRONTEND INTEGRATION: AuditTrail.jsx animates these entries one by one
    using the visibleCount prop from Dashboard.jsx.
    """
    rate  = expected / inv.amount if inv.amount else 1.0
    trace = []

    # Step 1 — what invoice is being processed
    trace.append({
        "step": 1,
        "tool": "Input Review",
        "text": f"Invoice {inv.invoice_no} loaded for {inv.customer}",
    })

    # Step 2 — what data was extracted from the invoice
    trace.append({
        "step": 2,
        "tool": "Data Extraction",
        "text": (
            f"Invoice fields extracted: amount {inv.currency} {inv.amount:.2f}, "
            f"reference {inv.reference or 'N/A'}, "
            f"date {inv.date or 'N/A'}"
        ),
    })

    # Step 3 — show the currency conversion calculation
    trace.append({
        "step": 3,
        "tool": "FX Conversion",
        "text": (
            f"FX conversion: {inv.currency} {inv.amount:.2f} "
            f"→ MYR {expected:.2f} at rate {rate:.2f}"
        ),
    })

    # Step 4 — whether a bank transaction was found
    if txn is None or received is None:
        trace.append({
            "step": 4,
            "tool": "Transaction Matching",
            "text": "No matching bank transaction found in the database.",
        })
        trace.append({
            "step": 5,
            "tool": "Final Recommendation",
            "text": (
                f"Confidence {score.total}%. "
                "No match possible. Manual investigation required."
            ),
        })
        return trace   # only 5 steps when no transaction found

    trace.append({
        "step": 4,
        "tool": "Transaction Matching",
        "text": (
            f"Bank transaction {txn.reference or 'N/A'} located — "
            f"MYR {received:.2f} on {txn.date or 'N/A'}"
        ),
    })

    # Step 5 — highlight any exceptions, or confirm all signals matched
    if score.amount_match and score.reference_match and score.date_match:
        trace.append({
            "step": 5,
            "tool": "Transaction Matching",
            "text": (
                f"Amount match: MYR {expected:.2f} = MYR {received:.2f} ✓ | "
                f"Reference: {txn.reference} ✓ | Date: {txn.date} ✓"
            ),
        })
    else:
        # Build a list of specific discrepancies for the audit log
        issues: list[str] = []
        diff = round(received - expected, 2)
        if not score.amount_match:
            sign = "excess" if diff > 0 else "shortfall"
            issues.append(
                f"Amount mismatch: expected MYR {expected:.2f}, "
                f"received MYR {received:.2f} ({sign} MYR {abs(diff):.2f})"
            )
        if not score.reference_match:
            issues.append(
                f"Reference near-miss: expected {inv.reference}, "
                f"found {txn.reference} (score {score.reference_score}/20)"
            )
        if not score.date_match:
            issues.append(f"Date gap: invoice {inv.date}, bank {txn.date}")
        trace.append({
            "step": 5,
            "tool": "Exception Analysis",
            "text": " | ".join(issues) if issues else "Minor discrepancies detected.",
        })

    # Step 6 — final verdict and recommended action
    trace.append({
        "step": 6,
        "tool": "Final Recommendation",
        "text": (
            f"{'No exceptions detected. ' if status == 'Matched' else ''}"
            f"Confidence score: {score.total}%. "
            f"Recommendation: {build_suggested_action(status, None)}"
        ),
    })
    return trace


# ══════════════════════════════════════════════════════════════════════════════
# ORM ↔ dataclass converters (private)
# Translate SQLAlchemy ORM rows into the engine's clean dataclasses.
# ══════════════════════════════════════════════════════════════════════════════

def _invoice_to_data(inv: Invoice) -> InvoiceData:
    """Convert an ORM Invoice row to InvoiceData for the scoring engine."""
    return InvoiceData(
        invoice_no   = inv.invoice_no,
        customer     = inv.customer,
        amount       = inv.invoice_amount,
        currency     = normalize_currency(inv.invoice_currency),
        expected_myr = inv.expected_myr,   # pre-computed at upload time
        reference    = inv.reference,
        date         = inv.invoice_date,
    )


def _txn_to_data(txn: BankTransaction) -> BankTxnData:
    """Convert an ORM BankTransaction row to BankTxnData for the scoring engine."""
    return BankTxnData(
        amount_myr  = txn.amount,       # bank amounts are stored in MYR
        reference   = txn.reference,
        date        = txn.date,
        description = txn.description,  # used by _customer_score()
    )


# ══════════════════════════════════════════════════════════════════════════════
# DB-backed reconciliation  (Mode B and Mode C)
# ══════════════════════════════════════════════════════════════════════════════

def reconcile_invoice(
    db:       Session,
    invoice:  Invoice,
    bank_txn: Optional[BankTransaction] = None,
) -> ReconciliationResult:
    """Match a single invoice against bank transactions and persist the result.

    Input:
        db        — SQLAlchemy session (injected by FastAPI Depends)
        invoice   — the Invoice ORM row to reconcile
        bank_txn  — if provided, score only this transaction; if None, search all
                    bank transactions and pick the highest-scoring candidate

    Output: a ReconciliationResult ORM row (already committed to the DB)

    MATCHING STRATEGY when bank_txn is None:
      Score the invoice against every BankTransaction in the DB.
      Select the one with the highest total score as the best candidate.
      If no transactions exist the result is Unmatched.
    """
    inv_data = _invoice_to_data(invoice)
    expected = inv_data.expected_myr

    if bank_txn is not None:
        # Caller specified a transaction — score only that one
        candidates = [(bank_txn, score_pair(inv_data, _txn_to_data(bank_txn)))]
    else:
        # Auto-search: score all transactions and pick the best
        all_txns   = db.query(BankTransaction).all()
        candidates = [(t, score_pair(inv_data, _txn_to_data(t))) for t in all_txns]

    best_txn:   Optional[BankTransaction] = None
    best_score: ScoreResult = ScoreResult(0, 0, 0, 0)

    if candidates:
        # Pick the transaction with the highest total score
        best_txn, best_score = max(candidates, key=lambda x: x[1].total)

    received   = best_txn.amount if best_txn else None
    difference = round(received - expected, 2) if received is not None else None
    status     = classify_status(best_score, expected, received)

    txn_data         = _txn_to_data(best_txn) if best_txn else None
    explanation      = build_explanation(inv_data, txn_data, status, best_score, expected, received)
    suggested_action = build_suggested_action(status, difference)
    decision_trace   = build_trace(inv_data, txn_data, expected, received, status, best_score)

    result = ReconciliationResult(
        invoice_id          = invoice.id,
        bank_transaction_id = best_txn.id if best_txn else None,
        status              = status,
        confidence          = best_score.total,
        expected_amount     = expected,
        received_amount     = received,
        difference          = difference,
        amount_match        = best_score.amount_match,
        date_match          = best_score.date_match,
        reference_match     = best_score.reference_match,
        customer_match      = best_score.customer_match,
        # Store complex objects as JSON strings — SQLite has no native JSON column
        score_breakdown     = json.dumps(best_score.as_dict()),
        explanation         = explanation,
        suggested_action    = suggested_action,
        decision_trace      = json.dumps(decision_trace),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def reconcile_all(db: Session) -> list[ReconciliationResult]:
    """Reconcile every invoice that does not yet have a ReconciliationResult.

    Input : db — SQLAlchemy session
    Output: list of newly created ReconciliationResult rows

    Called by POST /reconcile with an empty body (Mode C).
    Invoices that already have a result are skipped — re-reconcile them
    individually via Mode B if needed.
    """
    # Collect invoice IDs that already have at least one result
    reconciled_ids = {
        r.invoice_id
        for r in db.query(ReconciliationResult.invoice_id).all()
    }
    pending = db.query(Invoice).filter(Invoice.id.notin_(reconciled_ids)).all()
    return [reconcile_invoice(db, inv) for inv in pending]


# ══════════════════════════════════════════════════════════════════════════════
# Stateless direct reconciliation  (Mode A — no DB required)
# ══════════════════════════════════════════════════════════════════════════════

def _direct_classify(expected: float, bank_received: float) -> str:
    """Amount-deviation-only status classifier used in direct (frontend) mode.

    WHY THIS IS SEPARATE FROM classify_status():
      In direct mode the frontend provides both the invoice reference AND the
      bank reference as a single value, so we can't detect a reference mismatch
      the way the DB mode can (which compares invoice.reference to txn.reference).
      Therefore status is derived purely from the amount deviation percentage.

    DIRECT MODE CLASSIFICATION RULES:
    ┌───────────────────┬─────────────────────────────────────────────────────┐
    │ Deviation         │ Status                                              │
    ├───────────────────┼─────────────────────────────────────────────────────┤
    │ ≤ 0.1 %           │ Matched       (exact)                               │
    │ ≤ 5 %             │ Possible Match (small rounding / spread)            │
    │ > 50 %            │ Unmatched     (completely wrong payment)            │
    │ 5–50 %, short     │ Underpaid                                           │
    │ 5–50 %, over      │ Overpaid                                            │
    └───────────────────┴─────────────────────────────────────────────────────┘
    """
    if expected == 0:
        return "Unmatched"
    diff_pct = abs(expected - bank_received) / expected
    diff     = bank_received - expected

    if diff_pct <= 0.001:  return "Matched"
    if diff_pct <= 0.05:   return "Possible Match"
    if diff_pct > 0.50:    return "Unmatched"
    return "Underpaid" if diff < 0 else "Overpaid"


def reconcile_direct(
    invoice_no:       str,
    customer:         str,
    invoice_amount:   float,
    invoice_currency: str,
    bank_received:    float,
    bank_currency:    str = "MYR",
    reference:        Optional[str] = None,
    date:             Optional[str] = None,
) -> dict:
    """Reconcile an invoice against a single bank amount without touching the DB.

    This is the function called for every real-time reconciliation from the
    React dashboard (Mode A).  It's stateless — nothing is read from or written
    to the database.

    Input:
        invoice_no, customer, invoice_amount, invoice_currency — from InvoicePanel.jsx
        bank_received, bank_currency                           — from InvoicePanel.jsx
        reference, date                                        — optional, from form

    Output: dict matching DirectReconcileResult schema — consumed directly by
        MatchingResult.jsx, AuditTrail.jsx in the frontend.

    CURRENCY HANDLING:
      Both invoice_currency and bank_currency are normalised via normalize_currency()
      so the form accepts "usd", "US Dollar", "RM", etc. in either field.
      The invoice amount is converted to MYR using the fixed rate table.

    SCORING IN DIRECT MODE:
      Because both the reference and date come from the same form (the invoice side),
      we can't compare them against an independent bank source.  Instead we give
      full credit for reference (20 pts) if a reference was provided, and full
      credit for date (20 pts) if a date was provided.  Only the amount deviation
      reflects real uncertainty.

      For Unmatched results the reference and customer scores are zeroed so the
      confidence number accurately reflects the match quality.
    """
    # Normalise both currency inputs to canonical ISO codes
    norm_inv_currency  = normalize_currency(invoice_currency)
    norm_bank_currency = normalize_currency(bank_currency)   # currently unused but validated

    # Convert the invoice amount to MYR — this is what we compare bank_received against
    expected = to_myr(invoice_amount, norm_inv_currency)

    # In direct mode: give full credit for signals that are present in the form,
    # since we're comparing one form submission against itself.
    a_score = _amount_score(expected, bank_received)  # only real uncertainty
    d_score = 20 if date else 0                        # full credit if date provided
    r_score = 20 if reference else 0                   # full credit if reference provided
    c_score = 10 if customer else 0                    # full credit if customer provided

    status = _direct_classify(expected, bank_received)

    # For Unmatched: suppress reference and customer scores so confidence = amount
    # score only, reflecting that no credible payment was found.
    if status == "Unmatched":
        r_score = 0
        c_score = 0

    score = ScoreResult(
        amount_score    = a_score,
        date_score      = d_score,
        reference_score = r_score,
        customer_score  = c_score,
    )

    # Build data containers (same structures used by DB-backed path)
    inv_data = InvoiceData(
        invoice_no   = invoice_no,
        customer     = customer,
        amount       = invoice_amount,
        currency     = norm_inv_currency,
        expected_myr = expected,
        reference    = reference,
        date         = date,
    )
    txn_data = BankTxnData(
        amount_myr  = bank_received,
        reference   = reference,   # same reference — form has only one reference field
        date        = date,
        description = None,        # no bank narration available in direct mode
    )

    difference       = round(bank_received - expected, 2)
    explanation      = build_explanation(inv_data, txn_data, status, score, expected, bank_received)
    suggested_action = build_suggested_action(status, difference)
    decision_trace   = build_trace(inv_data, txn_data, expected, bank_received, status, score)

    # Return a plain dict — shape matches DirectReconcileResult in schemas.py
    # and is read directly by the frontend React components.
    return {
        "status":          status,
        "confidence":      score.total,
        "expectedAmount":  expected,
        "receivedAmount":  bank_received,
        "difference":      difference,
        "currency":        "MYR",
        "referenceMatch":  score.reference_match,
        "dateMatch":       score.date_match,
        "amountMatch":     score.amount_match,
        "customerMatch":   score.customer_match,
        "suggestedAction": suggested_action,
        "explanation":     explanation,
        "scoreBreakdown":  score.as_dict(),
        "decisionTrace":   decision_trace,
    }
