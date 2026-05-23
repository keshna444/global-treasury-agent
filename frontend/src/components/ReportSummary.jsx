import { useState } from 'react'
import { REPORT_STATS } from '../data/mockData'

export default function ReportSummary() {
  const [toast, setToast] = useState(false)

  const handleExport = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-text mb-0.5">Reports</p>
          <h2 className="section-title">Reconciliation Summary</h2>
        </div>
        <div className="relative">
          <button onClick={handleExport} className="btn-secondary">
            Export Reconciliation Report
          </button>
          {toast && (
            <div className="absolute right-0 top-10 fade-in whitespace-nowrap">
              <div className="card px-4 py-2.5 border-[#2a2a2a]">
                <p className="text-xs text-[#aaaaaa]">Mock report generated for demo.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="label-text mb-2">Reconciled Today</p>
          <p className="text-2xl font-semibold text-white tabular-nums">{REPORT_STATS.reconciledToday}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-green-400">Completed</span>
          </div>
        </div>

        <div className="card p-4">
          <p className="label-text mb-2">Pending Review</p>
          <p className="text-2xl font-semibold text-white tabular-nums">{REPORT_STATS.pendingReview}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-400">Action required</span>
          </div>
        </div>

        <div className="card p-4">
          <p className="label-text mb-2">Unmatched Payments</p>
          <p className="text-2xl font-semibold text-white tabular-nums">{REPORT_STATS.unmatched}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs text-red-400">Investigation needed</span>
          </div>
        </div>

        <div className="card p-4">
          <p className="label-text mb-2">Total Value Processed</p>
          <p className="text-lg font-semibold text-white font-mono tabular-nums">{REPORT_STATS.totalValue}</p>
          <p className="text-xs text-[#555555] mt-1.5">This period</p>
        </div>
      </div>

      {/* Period breakdown table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-white">Period Breakdown</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              {['Period', 'Invoices', 'Matched', 'Review', 'Unmatched', 'Value (MYR)'].map((h) => (
                <th key={h} className="text-left py-2.5 px-4 label-text font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { period: 'May 2026',   invoices: 128, matched: 96, review: 18, unmatched: 14, value: '18,420.50' },
              { period: 'Apr 2026',   invoices: 112, matched: 89, review: 14, unmatched: 9,  value: '15,210.00' },
              { period: 'Mar 2026',   invoices: 98,  matched: 81, review: 11, unmatched: 6,  value: '12,875.00' },
            ].map((row) => (
              <tr key={row.period} className="border-b border-[#111111] table-row-hover">
                <td className="py-2.5 px-4 text-[#aaaaaa]">{row.period}</td>
                <td className="py-2.5 px-4 text-[#888888] tabular-nums">{row.invoices}</td>
                <td className="py-2.5 px-4 text-green-400 tabular-nums">{row.matched}</td>
                <td className="py-2.5 px-4 text-amber-400 tabular-nums">{row.review}</td>
                <td className="py-2.5 px-4 text-red-400 tabular-nums">{row.unmatched}</td>
                <td className="py-2.5 px-4 font-mono text-white tabular-nums">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
