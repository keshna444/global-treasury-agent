import { BANK_STATEMENT_ROWS } from '../data/mockData'

const rowStatusClass = (status) => {
  if (status === 'Matched')                         return 'text-green-400'
  if (status === 'Unmatched')                       return 'text-red-400'
  if (status === 'Underpaid' || status === 'Overpaid' || status === 'Possible Match') return 'text-amber-400'
  return 'text-[#888888]'
}

const dotClass = (status) => {
  if (status === 'Matched')      return 'bg-green-400'
  if (status === 'Unmatched')    return 'bg-red-400'
  return 'bg-amber-400'
}

export default function BankStatementTable({ activeScenarioId, onSelectRow }) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Column 2</p>
          <h3 className="text-sm font-semibold text-white">Bank Statement</h3>
        </div>
        <span className="label-text">{BANK_STATEMENT_ROWS.length} entries</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              {['Date', 'Reference', 'Description', 'Amount (MYR)'].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-2 label-text font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANK_STATEMENT_ROWS.map((row) => {
              const isActive = row.scenarioId === activeScenarioId
              return (
                <tr
                  key={row.reference}
                  onClick={() => onSelectRow?.(row)}
                  className={`border-b border-[#141414] transition-colors duration-100 cursor-pointer ${
                    isActive
                      ? 'table-row-selected'
                      : 'table-row-hover'
                  }`}
                >
                  <td className="py-2.5 px-2 font-mono text-[#666666]">{row.date}</td>
                  <td className="py-2.5 px-2 font-mono text-white">{row.reference}</td>
                  <td className="py-2.5 px-2 text-[#aaaaaa] max-w-[120px] truncate">{row.description}</td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{row.amount.toFixed(2)}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass(row.status)}`} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
        <p className="text-xs text-[#444444]">
          Click a row to select a bank transaction. Highlighted row is the active match.
        </p>
      </div>
    </div>
  )
}
