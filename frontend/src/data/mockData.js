export const SCENARIOS = {
  perfectMatch: {
    id: 'perfectMatch',
    label: 'Perfect Match',
    color: 'green',
    invoice: {
      invoiceNo: 'INV-2026-001',
      customer: 'ABC Trading Ltd',
      invoiceAmount: '10.00',
      invoiceCurrency: 'USD',
      expectedConverted: 'MYR 42.50',
      bankReceived: '42.50',
      bankCurrency: 'MYR',
      reference: 'TXN12345',
      date: '2026-05-22',
    },
    result: {
      status: 'Matched',
      statusClass: 'status-matched',
      confidence: 96,
      expectedAmount: 42.50,
      receivedAmount: 42.50,
      difference: 0.00,
      currency: 'MYR',
      referenceMatch: true,
      dateMatch: true,
      amountMatch: true,
      suggestedAction: 'Mark invoice as paid and archive reconciliation record.',
      explanation:
        'The invoice amount of USD 10.00 was converted to MYR 42.50 at a rate of 4.25. The selected bank transaction received MYR 42.50 on the same date with matching reference TXN12345. All fields — amount, date, reference, and counterparty — are confirmed. This payment can be marked as reconciled.',
      scoreBreakdown: {
        amountScore: 50, dateScore: 20, referenceScore: 20, customerScore: 10,
      },
      decisionTrace: [
        { step: 1, text: 'Invoice INV-2026-001 loaded for ABC Trading Ltd', tool: 'Input Review' },
        { step: 2, text: 'Invoice fields extracted: amount USD 10.00, reference TXN12345, date 2026-05-22', tool: 'Data Extraction' },
        { step: 3, text: 'FX conversion: USD 10.00 → MYR 42.50 at rate 4.25', tool: 'FX Conversion' },
        { step: 4, text: 'Bank transaction TXN12345 located — MYR 42.50 on 2026-05-22', tool: 'Transaction Matching' },
        { step: 5, text: 'Amount match: MYR 42.50 = MYR 42.50 ✓ | Reference: TXN12345 ✓ | Date: 2026-05-22 ✓', tool: 'Transaction Matching' },
        { step: 6, text: 'No exceptions detected. Confidence score: 96%. Recommendation: Reconcile.', tool: 'Final Recommendation' },
      ],
    },
  },

  underpaid: {
    id: 'underpaid',
    label: 'Underpaid',
    color: 'amber',
    invoice: {
      invoiceNo: 'INV-2026-002',
      customer: 'Global Supplies Sdn Bhd',
      invoiceAmount: '10.00',
      invoiceCurrency: 'USD',
      expectedConverted: 'MYR 42.50',
      bankReceived: '38.00',
      bankCurrency: 'MYR',
      reference: 'TXN55512',
      date: '2026-05-21',
    },
    result: {
      status: 'Needs Review',
      statusClass: 'status-review',
      confidence: 82,
      expectedAmount: 42.50,
      receivedAmount: 38.00,
      difference: -4.50,
      currency: 'MYR',
      referenceMatch: true,
      dateMatch: true,
      amountMatch: false,
      suggestedAction: 'Request remaining balance of MYR 4.50 from customer.',
      explanation:
        'The expected amount was MYR 42.50, but the bank received MYR 38.00. The payment is short by MYR 4.50. Reference TXN55512 and date match confirm this is a payment from Global Supplies Sdn Bhd. The shortfall may be due to international wire transfer fees deducted at the originating bank. This item should be flagged for follow-up.',
      scoreBreakdown: {
        amountScore: 22, dateScore: 20, referenceScore: 20, customerScore: 10,
      },
      decisionTrace: [
        { step: 1, text: 'Invoice INV-2026-002 loaded for Global Supplies Sdn Bhd', tool: 'Input Review' },
        { step: 2, text: 'Invoice fields extracted: amount USD 10.00, reference TXN55512, date 2026-05-21', tool: 'Data Extraction' },
        { step: 3, text: 'FX conversion: USD 10.00 → MYR 42.50 at rate 4.25', tool: 'FX Conversion' },
        { step: 4, text: 'Bank transaction TXN55512 located — MYR 38.00 on 2026-05-21', tool: 'Transaction Matching' },
        { step: 5, text: 'Amount mismatch: expected MYR 42.50, received MYR 38.00 (shortfall MYR 4.50)', tool: 'Exception Analysis' },
        { step: 6, text: 'Possible cause: wire fees deducted at source. Confidence 82%. Recommendation: Flag for follow-up.', tool: 'Final Recommendation' },
      ],
    },
  },

  overpaid: {
    id: 'overpaid',
    label: 'Overpaid',
    color: 'amber',
    invoice: {
      invoiceNo: 'INV-2026-003',
      customer: 'Pacific Retail Co',
      invoiceAmount: '10.00',
      invoiceCurrency: 'USD',
      expectedConverted: 'MYR 42.50',
      bankReceived: '50.00',
      bankCurrency: 'MYR',
      reference: 'TXN77821',
      date: '2026-05-20',
    },
    result: {
      status: 'Needs Review',
      statusClass: 'status-review',
      confidence: 84,
      expectedAmount: 42.50,
      receivedAmount: 50.00,
      difference: 7.50,
      currency: 'MYR',
      referenceMatch: true,
      dateMatch: true,
      amountMatch: false,
      suggestedAction: 'Flag excess MYR 7.50 for refund or apply as credit note.',
      explanation:
        'The bank received MYR 50.00 against an expected MYR 42.50 for invoice INV-2026-003. An overpayment of MYR 7.50 was detected. Reference TXN77821 and date match confirm the payment is from Pacific Retail Co. The customer may have applied an incorrect FX rate or included an advance payment. A credit note or refund process should be initiated.',
      scoreBreakdown: {
        amountScore: 24, dateScore: 20, referenceScore: 20, customerScore: 10,
      },
      decisionTrace: [
        { step: 1, text: 'Invoice INV-2026-003 loaded for Pacific Retail Co', tool: 'Input Review' },
        { step: 2, text: 'Invoice fields extracted: amount USD 10.00, reference TXN77821, date 2026-05-20', tool: 'Data Extraction' },
        { step: 3, text: 'FX conversion: USD 10.00 → MYR 42.50 at rate 4.25', tool: 'FX Conversion' },
        { step: 4, text: 'Bank transaction TXN77821 located — MYR 50.00 on 2026-05-20', tool: 'Transaction Matching' },
        { step: 5, text: 'Overpayment detected: received MYR 50.00 vs expected MYR 42.50 (excess MYR 7.50)', tool: 'Exception Analysis' },
        { step: 6, text: 'Possible cause: incorrect FX rate applied by customer. Confidence 84%. Recommendation: Issue credit note.', tool: 'Final Recommendation' },
      ],
    },
  },

  possibleMatch: {
    id: 'possibleMatch',
    label: 'Possible Match',
    color: 'amber',
    invoice: {
      invoiceNo: 'INV-2026-004',
      customer: 'Nexus Import Export',
      invoiceAmount: '10.00',
      invoiceCurrency: 'USD',
      expectedConverted: 'MYR 42.50',
      bankReceived: '42.10',
      bankCurrency: 'MYR',
      reference: 'TXN12346',
      date: '2026-05-22',
    },
    result: {
      status: 'Needs Review',
      statusClass: 'status-review',
      confidence: 74,
      expectedAmount: 42.50,
      receivedAmount: 42.10,
      difference: -0.40,
      currency: 'MYR',
      referenceMatch: false,
      dateMatch: true,
      amountMatch: false,
      suggestedAction: 'Manually verify reference number mismatch with finance team.',
      explanation:
        'A near-match was detected for invoice INV-2026-004. The amount is close (MYR 0.40 difference within tolerance) and the date matches, but the reference number TXN12346 does not exactly match the expected TXN12345. This may indicate a typographic error in the payment reference or a separate transaction. Manual review is required to confirm.',
      scoreBreakdown: {
        amountScore: 44, dateScore: 20, referenceScore: 0, customerScore: 10,
      },
      decisionTrace: [
        { step: 1, text: 'Invoice INV-2026-004 loaded for Nexus Import Export', tool: 'Input Review' },
        { step: 2, text: 'Invoice fields extracted: amount USD 10.00, reference TXN12346, date 2026-05-22', tool: 'Data Extraction' },
        { step: 3, text: 'FX conversion: USD 10.00 → MYR 42.50 at rate 4.25', tool: 'FX Conversion' },
        { step: 4, text: 'Near-match transaction TXN12346 located — MYR 42.10 on 2026-05-22', tool: 'Transaction Matching' },
        { step: 5, text: 'Reference mismatch: expected TXN12345, found TXN12346. Amount delta: MYR 0.40.', tool: 'Exception Analysis' },
        { step: 6, text: 'Confidence 74% due to reference discrepancy. Recommendation: Escalate for manual review.', tool: 'Final Recommendation' },
      ],
    },
  },

  unmatched: {
    id: 'unmatched',
    label: 'Unmatched',
    color: 'red',
    invoice: {
      invoiceNo: 'INV-2026-005',
      customer: 'Unknown Sender',
      invoiceAmount: '10.00',
      invoiceCurrency: 'USD',
      expectedConverted: 'MYR 42.50',
      bankReceived: '80.00',
      bankCurrency: 'MYR',
      reference: 'TXN99999',
      date: '2026-05-22',
    },
    result: {
      status: 'Unmatched',
      statusClass: 'status-unmatched',
      confidence: 35,
      expectedAmount: 42.50,
      receivedAmount: 80.00,
      difference: 37.50,
      currency: 'MYR',
      referenceMatch: false,
      dateMatch: true,
      amountMatch: false,
      suggestedAction: 'Escalate to finance team. Investigate source and intent of transfer.',
      explanation:
        'No matching invoice was found for bank transaction TXN99999. The received amount MYR 80.00 does not correspond to any open invoice in the system. The reference number is unrecognised and the counterparty description does not match any known customer. This transaction cannot be reconciled automatically and requires manual investigation.',
      scoreBreakdown: {
        amountScore: 0, dateScore: 20, referenceScore: 0, customerScore: 0,
      },
      decisionTrace: [
        { step: 1, text: 'Unrecognised bank transaction TXN99999 flagged for review', tool: 'Input Review' },
        { step: 2, text: 'No matching invoice found for amount MYR 80.00 or reference TXN99999', tool: 'Data Extraction' },
        { step: 3, text: 'FX back-calculation: MYR 80.00 ≈ USD 18.82 — no open invoice at this value', tool: 'FX Conversion' },
        { step: 4, text: 'Reference TXN99999 not found in open or closed invoice records', tool: 'Transaction Matching' },
        { step: 5, text: 'Counterparty description does not match any known customer on record', tool: 'Exception Analysis' },
        { step: 6, text: 'Confidence 35%. No match possible. Recommendation: Manual investigation required.', tool: 'Final Recommendation' },
      ],
    },
  },
}

export const SCENARIO_LIST = Object.values(SCENARIOS)

export const BANK_STATEMENT_ROWS = [
  { date: '2026-05-22', reference: 'TXN12345', description: 'ABC Trading payment', amount: 42.50, currency: 'MYR', status: 'Matched', scenarioId: 'perfectMatch' },
  { date: '2026-05-22', reference: 'TXN99999', description: 'XYZ payment', amount: 80.00, currency: 'MYR', status: 'Unmatched', scenarioId: 'unmatched' },
  { date: '2026-05-21', reference: 'TXN55512', description: 'Partial payment — Global Supplies', amount: 38.00, currency: 'MYR', status: 'Underpaid', scenarioId: 'underpaid' },
  { date: '2026-05-20', reference: 'TXN77821', description: 'Pacific Retail Co transfer', amount: 50.00, currency: 'MYR', status: 'Overpaid', scenarioId: 'overpaid' },
  { date: '2026-05-22', reference: 'TXN12346', description: 'Nexus Import Export wire', amount: 42.10, currency: 'MYR', status: 'Possible Match', scenarioId: 'possibleMatch' },
]

export const AGENT_FLOW_STEPS = [
  { id: 'input',      label: 'Input Review',          description: 'Validate invoice and payment data' },
  { id: 'extract',    label: 'Data Extraction',        description: 'Parse invoice fields and bank records' },
  { id: 'fx',         label: 'FX Conversion',          description: 'Convert amounts using current exchange rates' },
  { id: 'match',      label: 'Transaction Matching',   description: 'Match invoice to bank statement entries' },
  { id: 'exception',  label: 'Exception Analysis',     description: 'Identify discrepancies and edge cases' },
  { id: 'result',     label: 'Final Recommendation',   description: 'Generate reconciliation outcome and action' },
]

export const DASHBOARD_STATS = [
  { label: 'Total Invoices',    value: '128', sub: 'This period' },
  { label: 'Matched Payments',  value: '96',  sub: '75% match rate' },
  { label: 'Needs Review',      value: '18',  sub: 'Pending action' },
  { label: 'Unmatched',         value: '14',  sub: 'Requires investigation' },
]

export const REPORT_STATS = {
  reconciledToday: 24,
  pendingReview: 7,
  unmatched: 3,
  totalValue: 'MYR 18,420.50',
}
