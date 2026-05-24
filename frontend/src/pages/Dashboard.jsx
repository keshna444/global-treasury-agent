import { useState, useCallback } from 'react'
import DashboardStats from '../components/DashboardStats'
import ScenarioSelector from '../components/ScenarioSelector'
import InvoicePanel from '../components/InvoicePanel'
import BankStatementTable from '../components/BankStatementTable'
import MatchingResult from '../components/MatchingResult'
import AgentWorkflow from '../components/AgentWorkflow'
import AuditTrail from '../components/AuditTrail'
import ReportSummary from '../components/ReportSummary'
import HomeHeader from '../components/HomeHeader'
import DataExtractionPreview from '../components/DataExtractionPreview'
import { runMockReconciliation } from '../services/reconciliationApi'
import { SCENARIOS, AGENT_FLOW_STEPS, bankTransactions as defaultBankRows } from '../data/mockData'

const ts = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

// Map from SCENARIOS invoice shape to InvoicePanel shape
const toInvoice = (inv) => ({
  invoiceNo:           inv.invoiceNo,
  customer:            inv.customer,
  invoiceAmount:       inv.invoiceAmount,
  invoiceCurrency:     inv.invoiceCurrency,
  // expectedConverted is a string like "MYR 42.50" — strip currency prefix
  expectedLocalAmount: String(inv.expectedConverted ?? '').replace(/^[A-Z]+ /, '') || String(inv.bankReceived ?? '42.50'),
  localCurrency:       inv.bankCurrency ?? 'MYR',
  invoiceDate:         inv.date ?? '',
  reference:           inv.reference,
})

const initScenario = SCENARIOS.perfectMatch

export default function Dashboard({ currentPage, onNavigate }) {
  // Reconciliation core state
  const [selectedScenario, setSelectedScenario] = useState(initScenario)
  const [invoiceData, setInvoiceData]           = useState(toInvoice(initScenario.invoice))
  const [isRunning, setIsRunning]               = useState(false)
  const [result, setResult]                     = useState(null)
  const [completedSteps, setCompletedSteps]     = useState(0)
  const [traceVisible, setTraceVisible]         = useState(0)

  // Notification banner for failed reconciliation
  const [notification, setNotification] = useState(null)

  // Bank statement state (rows + selected row)
  const [bankRows, setBankRows]                   = useState(defaultBankRows)
  const [selectedBankRowId, setSelectedBankRowId] = useState(defaultBankRows[0]?.id ?? null)

  // Timestamped audit log for user actions
  const [auditLog, setAuditLog] = useState([
    { time: ts(), message: `Invoice ${initScenario.invoice.invoiceNo} loaded` },
    { time: ts(), message: `Bank transaction ${defaultBankRows[0]?.reference} selected` },
  ])

  const addAudit = useCallback((message) => {
    setAuditLog((prev) => [...prev, { time: ts(), message }])
  }, [])

  // Scenario selection — auto-selects the matching bank row
  const handleSelectScenario = useCallback((scenario) => {
    setSelectedScenario(scenario)
    setInvoiceData(toInvoice(scenario.invoice))
    setResult(null)
    setCompletedSteps(0)
    setTraceVisible(0)
    setNotification(null)
    const matchRow = bankRows.find((r) => r.scenarioId === scenario.id)
    if (matchRow) setSelectedBankRowId(matchRow.id)
    addAudit(`Scenario "${scenario.label}" selected — invoice ${scenario.invoice.invoiceNo} loaded`)
    if (matchRow) addAudit(`Bank transaction ${matchRow.reference} auto-selected`)
  }, [bankRows, addAudit])

  const handleInvoiceChange = useCallback((key, value) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectBankRow = useCallback((row) => {
    setSelectedBankRowId(row.id)
    addAudit(`Bank transaction ${row.reference} selected (${row.currency} ${Number(row.amount).toFixed(2)})`)
  }, [addAudit])

  const handleAddBankRow = useCallback((row) => {
    setBankRows((prev) => [...prev, row])
    setSelectedBankRowId(row.id)
    addAudit(`New bank transaction ${row.reference} added and selected`)
  }, [addAudit])

  // Called by DataExtractionPreview when user clicks "Load Extracted Data"
  const handleExtractedDataLoaded = useCallback((data) => {
    const inv = data.invoice
    setInvoiceData({
      invoiceNo:           inv.invoiceNo,
      customer:            inv.customer,
      invoiceAmount:       String(inv.invoiceAmount),
      invoiceCurrency:     inv.invoiceCurrency,
      expectedLocalAmount: String(inv.expectedLocalAmount),
      localCurrency:       inv.localCurrency,
      invoiceDate:         inv.invoiceDate,
      reference:           inv.reference,
    })
    const newRows = data.bankTransactions.map((txn, i) => ({
      id:          txn.id ?? Date.now() + i,
      date:        txn.date,
      reference:   txn.reference,
      description: txn.description,
      amount:      txn.amount,
      currency:    txn.currency,
      status:      null,
      scenarioId:  null,
    }))
    setBankRows(newRows)
    setSelectedBankRowId(newRows[0]?.id ?? null)
    setResult(null)
    setCompletedSteps(0)
    setTraceVisible(0)
    addAudit(`Extracted data loaded — Invoice ${inv.invoiceNo}, ${newRows.length} bank transactions`)
    if (newRows[0]) addAudit(`Bank transaction ${newRows[0].reference} auto-selected`)
  }, [addAudit])

  // Run reconciliation with step animation
  const handleRun = useCallback(async () => {
    if (!selectedScenario || isRunning) return
    setIsRunning(true)
    setResult(null)
    setCompletedSteps(0)
    setTraceVisible(0)

    addAudit('Reconciliation started')
    addAudit('FX conversion checked')

    const totalFlow  = AGENT_FLOW_STEPS.length
    const totalTrace = selectedScenario.result.decisionTrace.length

    let flow = 0
    const flowInterval = setInterval(() => {
      flow++
      setCompletedSteps(flow)
      if (flow >= totalFlow) clearInterval(flowInterval)
    }, 500)

    let trace = 0
    const traceInterval = setInterval(() => {
      trace++
      setTraceVisible(trace)
      if (trace >= totalTrace) clearInterval(traceInterval)
    }, 550)

    try {
      await runMockReconciliation(selectedScenario.id)
      clearInterval(flowInterval)
      clearInterval(traceInterval)
      setCompletedSteps(totalFlow)
      setTraceVisible(totalTrace)
      setResult(selectedScenario.result)
      if (['Unmatched', 'Needs Review'].includes(selectedScenario.result.status)) {
        setNotification({
          level: selectedScenario.result.status === 'Unmatched' ? 'error' : 'warning',
          message: selectedScenario.result.suggestedAction,
        })
      } else {
        setNotification(null)
      }
      addAudit('Amount compared')
      addAudit('Reference verified')
      addAudit(
        `Final status: ${selectedScenario.result.status} — confidence ${selectedScenario.result.confidence}%`
      )
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunning(false)
    }
  }, [selectedScenario, isRunning, addAudit])

  // ═══════════════════════════════════════════════
  // HOME PAGE
  // ═══════════════════════════════════════════════
  if (currentPage === 'dashboard') {
    return (
      <div className="space-y-8">
        <HomeHeader onNavigate={onNavigate} />

        <DashboardStats />

        {/* Total value card */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="label-text mb-0.5">Total Value Processed</p>
            <p className="text-2xl font-semibold text-white font-mono tabular-nums">MYR 18,420.50</p>
          </div>
          <span className="label-text">This period</span>
        </div>

        {/* Data extraction preview */}
        <DataExtractionPreview
          onDataLoaded={(data) => {
            handleExtractedDataLoaded(data)
            onNavigate('reconciliation')
          }}
        />

        {/* Recent reconciliations */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Reconciliations</h3>
            <button onClick={() => onNavigate('reconciliation')} className="btn-ghost text-xs">
              Run new →
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 label-text font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { inv: 'INV-2026-001', customer: 'ABC Trading Ltd',         amount: 'MYR 42.50', status: 'Matched',      date: '2026-05-22' },
                  { inv: 'INV-2026-002', customer: 'Global Supplies Sdn Bhd', amount: 'MYR 38.00', status: 'Needs Review',  date: '2026-05-21' },
                  { inv: 'INV-2026-003', customer: 'Pacific Retail Co',        amount: 'MYR 50.00', status: 'Needs Review',  date: '2026-05-20' },
                  { inv: 'INV-2026-004', customer: 'Nexus Import Export',      amount: 'MYR 42.10', status: 'Needs Review',  date: '2026-05-22' },
                  { inv: 'INV-2026-005', customer: 'Unknown Sender',           amount: 'MYR 80.00', status: 'Unmatched',    date: '2026-05-22' },
                ].map((row) => (
                  <tr key={row.inv} className="border-b border-[#111111] table-row-hover">
                    <td className="py-2.5 px-4 font-mono text-[#aaaaaa] whitespace-nowrap">{row.inv}</td>
                    <td className="py-2.5 px-4 text-[#888888] whitespace-nowrap">{row.customer}</td>
                    <td className="py-2.5 px-4 font-mono text-white whitespace-nowrap">{row.amount}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={
                        row.status === 'Matched'   ? 'status-matched'   :
                        row.status === 'Unmatched' ? 'status-unmatched' :
                        'status-review'
                      }>{row.status}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#666666] whitespace-nowrap">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // TRANSACTIONS PAGE
  // ═══════════════════════════════════════════════
  if (currentPage === 'transactions') {
    return (
      <div className="space-y-4">
        <div>
          <p className="label-text mb-1">Transactions</p>
          <h2 className="section-title">Bank Statement Transactions</h2>
        </div>
        <BankStatementTable
          rows={bankRows}
          selectedRowId={selectedBankRowId}
          onSelectRow={handleSelectBankRow}
          onAddRow={handleAddBankRow}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // REPORTS PAGE
  // ═══════════════════════════════════════════════
  if (currentPage === 'reports') {
    return <ReportSummary />
  }

  // ═══════════════════════════════════════════════
  // AUDIT TRAIL PAGE
  // ═══════════════════════════════════════════════
  if (currentPage === 'audit') {
    return (
      <div className="space-y-4">
        <div>
          <p className="label-text mb-1">Audit Trail</p>
          <h2 className="section-title">Reconciliation Log</h2>
          <p className="text-sm text-[#555555] mt-1">
            All user actions and reconciliation decisions are recorded below.
          </p>
        </div>
        <AuditTrail
          entries={auditLog}
          trace={selectedScenario?.result?.decisionTrace ?? []}
          visibleCount={traceVisible}
          isRunning={isRunning}
          result={result}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // RECONCILIATION WORKSPACE (default)
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-5">
      <div>
        <p className="label-text mb-1">Reconciliation</p>
        <h2 className="section-title">Reconciliation Workspace</h2>
      </div>

      {notification && (
        <div className={`fade-in flex items-start gap-3 px-4 py-3 rounded-xl border ${
          notification.level === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <span className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 animate-pulse ${
            notification.level === 'error' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
          }`} />
          <div className="flex-1">
            <p className={`text-xs font-semibold ${
              notification.level === 'error' ? 'text-[#DC2626]' : 'text-[#D97706]'
            }`}>
              {notification.level === 'error'
                ? 'Unmatched Transaction — Action Required'
                : 'Reconciliation Alert — Review Required'}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[#94A3B8] hover:text-[#64748B] text-xs ml-2 leading-none"
          >✕</button>
        </div>
      )}

      <ScenarioSelector
        selected={selectedScenario}
        onSelect={handleSelectScenario}
        onRun={handleRun}
        isRunning={isRunning}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <InvoicePanel invoiceData={invoiceData} onChange={handleInvoiceChange} />
        <BankStatementTable
          rows={bankRows}
          selectedRowId={selectedBankRowId}
          onSelectRow={handleSelectBankRow}
          onAddRow={handleAddBankRow}
        />
        <MatchingResult result={result} isRunning={isRunning} />
      </div>

      <AgentWorkflow completedSteps={completedSteps} isRunning={isRunning} />

      <AuditTrail
        trace={selectedScenario?.result?.decisionTrace ?? []}
        visibleCount={traceVisible}
        isRunning={isRunning}
        result={result}
      />
    </div>
  )
}
