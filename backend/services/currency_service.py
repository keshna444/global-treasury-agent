"""
FILE: backend/services/currency_service.py  [MODIFIED]
RESPONSIBILITY: Currency normalisation and MYR conversion for the reconciliation
                engine.  All monetary comparisons in this project happen in MYR,
                so every foreign amount is converted here before scoring.

TEAMMATE INTEGRATION:
  - backend/services/reconciliation_service.py : calls to_myr() and normalize_currency()
    to convert invoice and bank amounts before comparing them.
  - backend/routes/invoice.py : calls to_myr() when storing an invoice so that
    expected_myr is pre-computed and saved with the row.
  - No frontend integration — this module is pure Python with no HTTP layer.

FIXED EXCHANGE RATES (demo project — not live rates):
    1 USD = 4.25 MYR
    1 EUR = 5.00 MYR
    1 SGD = 3.20 MYR
    1 MYR = 1.00 MYR  (base currency, no conversion needed)

To support a new currency: add its ISO code and MYR rate to EXCHANGE_RATES,
then add common aliases to _ALIASES below.
"""

from __future__ import annotations


# ── Exchange rate table ───────────────────────────────────────────────────────
# Maps ISO 4217 currency code → how many MYR one unit of that currency equals.
# Example: 1 USD buys 4.25 MYR, so EXCHANGE_RATES["USD"] = 4.25

EXCHANGE_RATES: dict[str, float] = {
    "USD": 4.25,
    "EUR": 5.00,
    "SGD": 3.20,
    "MYR": 1.00,   # base currency; conversion is a no-op
}


# ── Currency alias table ──────────────────────────────────────────────────────
# Real-world spreadsheets and bank exports use many spellings for the same
# currency.  This table maps every known variant → canonical ISO 4217 code.
# normalize_currency() does an upper-case lookup here before any conversion.

_ALIASES: dict[str, str] = {
    # US Dollar variants
    "US DOLLAR": "USD", "US DOLLARS": "USD", "U.S. DOLLAR": "USD",
    "DOLLAR": "USD", "DOLLARS": "USD", "USD": "USD", "US$": "USD", "$": "USD",
    # Euro variants
    "EURO": "EUR", "EUROS": "EUR", "EUR": "EUR", "€": "EUR",
    # Singapore Dollar variants
    "SINGAPORE DOLLAR": "SGD", "SG DOLLAR": "SGD", "SGD": "SGD", "S$": "SGD",
    # Malaysian Ringgit variants
    "MALAYSIAN RINGGIT": "MYR", "RINGGIT": "MYR", "MYR": "MYR",
    "RM": "MYR", "RINGGIT MALAYSIA": "MYR",
}


# ── Public helpers ────────────────────────────────────────────────────────────

def normalize_currency(code: str) -> str:
    """Convert any currency spelling to its canonical ISO 4217 code.

    Input : any string — lowercase, mixed-case, symbols, or full names
            e.g. "usd", "US Dollar", "RM", "euro", "€"
    Output: uppercase ISO code — "USD", "MYR", "EUR", or "SGD"
    Raises: ValueError if the input isn't in _ALIASES

    Called by: to_myr(), get_rate(), convert(), and reconciliation_service.py
    """
    key = code.strip().upper()   # normalise before lookup
    if key in _ALIASES:
        return _ALIASES[key]
    raise ValueError(
        f"Unrecognised currency '{code}'. "
        f"Supported codes: {', '.join(sorted(EXCHANGE_RATES))}."
    )


def get_rate(currency: str) -> float:
    """Return the MYR exchange rate for a currency (1 unit of currency → N MYR).

    Input : any currency string accepted by normalize_currency()
    Output: float — e.g. 4.25 for USD, 5.00 for EUR
    """
    code = normalize_currency(currency)
    return EXCHANGE_RATES[code]


def to_myr(amount: float, currency: str) -> float:
    """Convert an amount in any supported currency to MYR.

    Input : amount (float), currency (any alias string)
    Output: MYR equivalent rounded to 2 decimal places

    Example: to_myr(10, "USD") → 42.50   (10 × 4.25)
             to_myr(10, "MYR") → 10.00   (no-op, rate = 1.0)

    Called by: upload routes (to pre-compute expected_myr) and
               reconciliation_service.py (to normalise bank amounts).
    """
    return round(amount * get_rate(currency), 2)


def convert(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert between any two supported currencies using MYR as the bridge.

    MYR is the intermediate step:  from_currency → MYR → to_currency
    This avoids needing a direct exchange rate for every currency pair.

    Example: convert(10, "USD", "EUR")
             = 10 × 4.25 (USD→MYR) / 5.00 (MYR→EUR)
             = 8.50

    Input : amount (float), from_currency and to_currency (any alias string)
    Output: converted amount rounded to 2 decimal places
    """
    from_code = normalize_currency(from_currency)
    to_code   = normalize_currency(to_currency)

    if from_code == to_code:
        return round(amount, 2)   # same currency — no conversion needed

    # Step 1: convert the source amount to MYR
    amount_myr = amount * EXCHANGE_RATES[from_code]
    # Step 2: convert MYR to the target currency (divide by target's MYR rate)
    return round(amount_myr / EXCHANGE_RATES[to_code], 2)


def format_currency(amount: float, currency: str = "MYR") -> str:
    """Return a display string like 'USD 10.00' or 'MYR 42.50'.

    Used by reconciliation_service.py when building explanation text and the
    decision trace that appears in the frontend's AuditTrail.jsx.
    """
    code = normalize_currency(currency)
    return f"{code} {amount:.2f}"


def format_myr(amount: float) -> str:
    """Convenience wrapper that always returns a MYR-formatted string.
    Example: format_myr(42.5) → 'MYR 42.50'
    """
    return f"MYR {amount:.2f}"
