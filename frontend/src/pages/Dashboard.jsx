import { useState, useCallback } from 'react'
import DashboardStats from '../components/DashboardStats'
import ScenarioSelector from '../components/ScenarioSelector'
import InvoicePanel from '../components/InvoicePanel'
import BankStatementTable from '../components/BankStatementTable'
import MatchingResult from '../components/MatchingResult'
import AgentWorkflow from '../components/AgentWorkflow'
import AuditTrail from '../components/AuditTrail'
import ReportSummary from '../components/ReportSummary'
import { runReconciliation, runMockReconciliation } from '../services/reconciliationApi'
import { SCENARIOS, AGENT_FLOW_STEPS } from '../data/mockData'

export default function Dashboard({ currentPage, onNavigate }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS.perfectMatch)
  const [invoiceData, setInvoiceData]           = useState({ ...SCENARIOS.perfectMatch.invoice })
  const [isRunning, setIsRunning]               = useState(false)
  const [result, setResult]                     = useState(null)
  const [completedSteps, setCompletedSteps]     = useState(0)
  const [traceVisible, setTraceVisible]         = useState(0)

  const handleSelectScenario = useCallback((scenario) => {
    setSelectedScenario(scenario)
    setInvoiceData({ ...scenario.invoice })
    setResult(null)
    setCompletedSteps(0)
    setTraceVisible(0)
  }, [])

  const handleInvoiceChange = useCallback((key, value) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRun = useCallback(async () => {
    if (!selectedScenario || isRunning) return
    setIsRunning(true)
    setResult(null)
    setCompletedSteps(0)
    setTraceVisible(0)

    const totalFlow        = AGENT_FLOW_STEPS.length
    const EXPECTED_TRACE   = 6   // backend always emits 6 decision steps

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
      if (trace >= EXPECTED_TRACE) clearInterval(traceInterval)
    }, 550)

    try {
      // Call the real backend; fall back to mock if unreachable
      const apiResult = await runReconciliation(invoiceData)
      clearInterval(flowInterval)
      clearInterval(traceInterval)
      setCompletedSteps(totalFlow)
      setTraceVisible(apiResult.decisionTrace?.length ?? EXPECTED_TRACE)
      setResult(apiResult)
    } catch (e) {
      console.error('Backend unavailable, using mock result:', e)
      clearInterval(flowInterval)
      clearInterval(traceInterval)
      setCompletedSteps(totalFlow)
      setTraceVisible(selectedScenario.result.decisionTrace.length)
      setResult(selectedScenario.result)
    } finally {
      setIsRunning(false)
    }
  }, [selectedScenario, isRunning, invoiceData])

  // Dashboard overview page
  if (currentPage === 'dashboard') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <p className="label-text mb-2">Overview</p>
          <h1 className="text-2xl font-semibold text-white mb-1">Global Treasury Agent</h1>
          <p className="text-sm text-[#666666] max-w-lg">
            Cross-border payment reconciliation for SMEs. Automatically match invoices, payment
            proofs, FX conversions, and bank statement transactions.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => onNavigate('reconciliation')} className="btn-primary">
              Start Reconciliation
            </button>
            <button onClick={() => onNavigate('transactions')} className="btn-secondary">
              View Sample Transactions
            </button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Recent reconciliations mini table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Reconciliations</h3>
            <button onClick={() => onNavigate('reconciliation')} className="btn-ghost text-xs">
              Run new →
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 label-text font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { inv: 'INV-2026-001', customer: 'ABC Trading Ltd',       amount: 'MYR 42.50',  status: 'Matched',      date: '2026-05-22' },
                { inv: 'INV-2026-002', customer: 'Global Supplies Sdn Bhd', amount: 'MYR 38.00', status: 'Needs Review', date: '2026-05-21' },
                { inv: 'INV-2026-003', customer: 'Pacific Retail Co',      amount: 'MYR 50.00',  status: 'Needs Review', date: '2026-05-20' },
                { inv: 'INV-2026-004', customer: 'Nexus Import Export',    amount: 'MYR 42.10',  status: 'Needs Review', date: '2026-05-22' },
                { inv: 'INV-2026-005', customer: 'Unknown Sender',         amount: 'MYR 80.00',  status: 'Unmatched',    date: '2026-05-22' },
              ].map((row) => (
                <tr key={row.inv} className="border-b border-[#111111] table-row-hover">
                  <td className="py-2.5 px-4 font-mono text-[#aaaaaa]">{row.inv}</td>
                  <td className="py-2.5 px-4 text-[#888888]">{row.customer}</td>
                  <td className="py-2.5 px-4 font-mono text-white">{row.amount}</td>
                  <td className="py-2.5 px-4">
                    <span className={
                      row.status === 'Matched'      ? 'status-matched'   :
                      row.status === 'Unmatched'    ? 'status-unmatched' :
                      'status-review'
                    }>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#666666]">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Transactions page
  if (currentPage === 'transactions') {
    return (
      <div className="space-y-4">
        <div>
          <p className="label-text mb-1">Transactions</p>
          <h2 className="section-title">Bank Statement Transactions</h2>
        </div>
        <BankStatementTable activeScenarioId={selectedScenario?.id} />
      </div>
    )
  }

  // Reports page
  if (currentPage === 'reports') {
    return <ReportSummary />
  }

  // Audit Trail page
  if (currentPage === 'audit') {
    return (
      <div className="space-y-4">
        <div>
          <p className="label-text mb-1">Audit Trail</p>
          <h2 className="section-title">Reconciliation Log</h2>
          <p className="text-sm text-[#555555] mt-1">
            Run a reconciliation in the Reconciliation workspace to populate the audit log.
          </p>
        </div>
        <AuditTrail
          trace={result?.decisionTrace ?? selectedScenario?.result?.decisionTrace ?? []}
          visibleCount={traceVisible}
          isRunning={isRunning}
          result={result}
        />
      </div>
    )
  }

  // Reconciliation workspace (default)
  return (
    <div className="space-y-5">
      {/* Scenario selector */}
      <ScenarioSelector
        selected={selectedScenario}
        onSelect={handleSelectScenario}
        onRun={handleRun}
        isRunning={isRunning}
      />

      {/* 3-column workspace */}
      <div className="grid lg:grid-cols-3 gap-4">
        <InvoicePanel invoiceData={invoiceData} onChange={handleInvoiceChange} />
        <BankStatementTable activeScenarioId={selectedScenario?.id} />
        <MatchingResult result={result} isRunning={isRunning} />
      </div>

      {/* Agent workflow */}
      <AgentWorkflow completedSteps={completedSteps} isRunning={isRunning} />

      {/* Audit trail */}
      <AuditTrail
        trace={result?.decisionTrace ?? selectedScenario?.result?.decisionTrace ?? []}
        visibleCount={traceVisible}
        isRunning={isRunning}
        result={result}
      />
    </div>
  )
}
