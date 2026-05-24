import { SCENARIOS, extractedSampleData } from '../data/mockData'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Existing reconciliation runner (kept for backward compatibility)
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

// Returns mock extracted data — replace with real extraction API call later
export async function getMockExtractedData() {
  await delay(800)
  return extractedSampleData
}

// Validates the shape of data extraction output before loading into the workspace
export function validateExtractedData(data) {
  const missingFields = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, missingFields: ['entire payload'], message: 'No data provided.' }
  }

  if (!data.invoice) {
    missingFields.push('invoice')
  } else {
    const inv = data.invoice
    if (!inv.invoiceNo)                                 missingFields.push('invoice.invoiceNo')
    if (typeof inv.invoiceAmount !== 'number')          missingFields.push('invoice.invoiceAmount')
    if (!inv.invoiceCurrency)                           missingFields.push('invoice.invoiceCurrency')
    if (typeof inv.expectedLocalAmount !== 'number')    missingFields.push('invoice.expectedLocalAmount')
    if (!inv.localCurrency)                             missingFields.push('invoice.localCurrency')
    if (!inv.invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(inv.invoiceDate)) missingFields.push('invoice.invoiceDate')
    if (!inv.reference)                                 missingFields.push('invoice.reference')
  }

  if (!Array.isArray(data.bankTransactions) || data.bankTransactions.length === 0) {
    missingFields.push('bankTransactions')
  } else {
    data.bankTransactions.forEach((txn, i) => {
      if (typeof txn.amount !== 'number')                               missingFields.push(`bankTransactions[${i}].amount`)
      if (!txn.date || !/^\d{4}-\d{2}-\d{2}$/.test(txn.date))         missingFields.push(`bankTransactions[${i}].date`)
      if (!txn.currency)                                                missingFields.push(`bankTransactions[${i}].currency`)
      if (!txn.reference)                                               missingFields.push(`bankTransactions[${i}].reference`)
    })
  }

  const isValid = missingFields.length === 0
  return {
    isValid,
    missingFields,
    message: isValid
      ? 'Data extraction output is ready for reconciliation.'
      : `Validation failed. Missing: ${missingFields.join(', ')}`,
  }
}

export async function runReconciliationWithBackend(payload) {
  const { invoice, selectedTransaction } = payload

  const body = {
    invoiceNo:       invoice.invoiceNo,
    customer:        invoice.customer,
    invoiceAmount:   parseFloat(invoice.invoiceAmount),
    invoiceCurrency: invoice.invoiceCurrency,
    bankReceived:    parseFloat(selectedTransaction.amount),
    bankCurrency:    selectedTransaction.currency || 'MYR',
    reference:       selectedTransaction.reference || invoice.reference || null,
    date:            selectedTransaction.date || null,
  }

  const response = await fetch('http://localhost:8000/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `Server error ${response.status}`)
  }

  return response.json()
}
