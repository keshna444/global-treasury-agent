import { motion } from 'framer-motion'
import { Landmark } from 'lucide-react'
import { BANK_STATEMENT_ROWS } from '../data/mockData'

const STATUS_STYLE = {
  'Matched':        'status-matched',
  'Unmatched':      'status-unmatched',
  'Underpaid':      'status-underpaid',
  'Overpaid':       'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Possible Match': 'status-possible',
}

export default function BankStatementPanel({ activeScenarioId }) {
  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Landmark className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <span className="label-text block">Bank Statement</span>
          <h3 className="text-sm font-semibold text-white">Transaction Feed</h3>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {['Date', 'Reference', 'Description', 'Amount', 'Status'].map((h) => (
                <th key={h} className="text-left py-2 px-2 text-slate-500 font-mono uppercase tracking-wider text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANK_STATEMENT_ROWS.map((row, i) => {
              const isActive = row.scenarioId === activeScenarioId
              return (
                <motion.tr
                  key={row.reference}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`border-b border-white/5 transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                      : 'hover:bg-white/3'
                  }`}
                >
                  <td className="py-2.5 px-2 font-mono text-slate-400">{row.date}</td>
                  <td className="py-2.5 px-2 font-mono text-cyan-400">{row.reference}</td>
                  <td className="py-2.5 px-2 text-slate-300 max-w-[120px] truncate">{row.description}</td>
                  <td className="py-2.5 px-2 font-mono text-white font-medium">
                    {row.currency} {row.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[row.status] ?? ''}`}>
                      {row.status}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {activeScenarioId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
        >
          <p className="text-xs text-cyan-300">
            Highlighted row corresponds to the selected scenario.
          </p>
        </motion.div>
      )}
    </div>
  )
}
