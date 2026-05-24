import { useState } from 'react'

const statusBadge = (status) => {
  if (status === 'Matched')       return 'status-matched'
  if (status === 'Unmatched')     return 'status-unmatched'
  if (['Underpaid', 'Overpaid', 'Possible Match'].includes(status)) return 'status-review'
  return 'status-neutral'
}

const emptyForm = { date: '', reference: '', description: '', amount: '', currency: 'MYR' }

export default function BankStatementTable({ rows, selectedRowId, onSelectRow, onAddRow }) {
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const handleFormChange = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleAddSubmit = () => {
    if (!form.date || !form.reference || !form.amount) {
      setFormError('Date, reference, and amount are required.')
      return
    }
    const parsed = parseFloat(form.amount)
    if (isNaN(parsed)) {
      setFormError('Amount must be a number.')
      return
    }
    onAddRow({
      id: Date.now(),
      date: form.date,
      reference: form.reference,
      description: form.description || '—',
      amount: parsed,
      currency: form.currency || 'MYR',
      status: null,
    })
    setForm(emptyForm)
    setFormError('')
    setShowForm(false)
  }

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Bank Statement</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Transactions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-text">{rows.length} entries</span>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-ghost text-xs py-1 px-2"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <div className="mb-4 p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
          <p className="label-text mb-2">Add Bank Transaction</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-text block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="input-field font-mono text-xs w-full"
              />
            </div>
            <div>
              <label className="label-text block mb-1">Reference</label>
              <input
                type="text"
                placeholder="TXN..."
                value={form.reference}
                onChange={(e) => handleFormChange('reference', e.target.value)}
                className="input-field font-mono text-xs w-full"
              />
            </div>
          </div>
          <div>
            <label className="label-text block mb-1">Description</label>
            <input
              type="text"
              placeholder="Payment description"
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              className="input-field text-xs w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-text block mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                className="input-field font-mono text-xs w-full"
              />
            </div>
            <div>
              <label className="label-text block mb-1">Currency</label>
              <input
                type="text"
                placeholder="MYR"
                value={form.currency}
                onChange={(e) => handleFormChange('currency', e.target.value)}
                className="input-field font-mono text-xs w-full"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-[#DC2626]">{formError}</p>}
          <button onClick={handleAddSubmit} className="btn-primary text-xs py-1.5 w-full">
            Add Transaction
          </button>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {['Date', 'Reference', 'Description', 'Amount', 'CCY'].map((h) => (
                <th key={h} className="text-left py-2.5 px-2 label-text font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = row.id === selectedRowId
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectRow(row)}
                  className={`border-b border-[#F1F5F9] transition-colors duration-100 cursor-pointer ${
                    isSelected ? 'table-row-selected' : 'table-row-hover'
                  }`}
                >
                  <td className="py-2.5 px-2 font-mono text-[#94A3B8] whitespace-nowrap">{row.date}</td>
                  <td className={`py-2.5 px-2 font-mono font-medium whitespace-nowrap ${isSelected ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>{row.reference}</td>
                  <td className="py-2.5 px-2 text-[#64748B] max-w-[100px] truncate">{row.description}</td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-semibold ${isSelected ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>
                        {Number(row.amount).toFixed(2)}
                      </span>
                      {row.status && (
                        <span className={statusBadge(row.status)}>{row.status}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[#94A3B8]">{row.currency}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#94A3B8]">
          {selectedRowId
            ? 'Row selected — run reconciliation to compare against invoice.'
            : 'Click a row to select a bank transaction.'}
        </p>
      </div>
    </div>
  )
}
