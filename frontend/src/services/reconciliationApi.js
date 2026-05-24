import { SCENARIOS } from '../data/mockData'

const API_BASE = 'http://localhost:8000'

// ── Real backend call ─────────────────────────────────────────────────────────

/**
 * POST /reconcile with the inline invoice + bank data from the Dashboard form.
 * Returns a result object in the same shape as the mock scenario results,
 * with all fields read by MatchingResult.jsx, AuditTrail.jsx, and
 * ReconciliationResult.jsx.
 */
export async function runReconciliation(invoiceData) {
  const response = await fetch(`${API_BASE}/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceNo:       invoiceData.invoiceNo,
      customer:        invoiceData.customer,
      invoiceAmount:   parseFloat(invoiceData.invoiceAmount),
      invoiceCurrency: invoiceData.invoiceCurrency,
      bankReceived:    parseFloat(invoiceData.bankReceived),
      bankCurrency:    invoiceData.bankCurrency || 'MYR',
      reference:       invoiceData.reference   || null,
      date:            invoiceData.date         || null,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${response.status}`)
  }

  return response.json()
}

// ── Mock fallback (used when backend is unreachable) ──────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runMockReconciliation(scenarioId, onStepComplete) {
  const scenario = SCENARIOS[scenarioId]
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`)

  const steps = scenario.result.decisionTrace

  for (let i = 0; i < steps.length; i++) {
    await delay(400 + Math.random() * 200)
    if (onStepComplete) onStepComplete(i + 1, steps[i])
  }

  await delay(300)
  return scenario.result
}
