export default function InvoicePanel({ invoiceData, onChange }) {
  const inv = invoiceData

  const editableField = (label, key, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label-text block mb-1">{label}</label>
      <input
        type={type}
        value={inv[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(key, e.target.value)}
        className="input-field font-mono"
      />
    </div>
  )

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Invoice / Payment Proof</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Invoice Details</h3>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {/* Read-only fields */}
        <div>
          <label className="label-text block mb-1">Invoice Number</label>
          <div className="input-field font-mono text-[#64748B] cursor-default select-all bg-[#F8FAFC]">{inv.invoiceNo}</div>
        </div>
        <div>
          <label className="label-text block mb-1">Customer</label>
          <div className="input-field text-[#64748B] cursor-default bg-[#F8FAFC]">{inv.customer}</div>
        </div>

        {/* Editable: invoice amount + currency */}
        <div className="grid grid-cols-2 gap-3">
          {editableField('Invoice Amount', 'invoiceAmount', 'number', '0.00')}
          {editableField('Currency', 'invoiceCurrency', 'text', 'USD')}
        </div>

        {/* Editable: expected local amount + local currency */}
        <div className="grid grid-cols-2 gap-3">
          {editableField('Expected Local Amount', 'expectedLocalAmount', 'number', '0.00')}
          {editableField('Local Currency', 'localCurrency', 'text', 'MYR')}
        </div>

        {/* Editable: date and reference */}
        {editableField('Invoice Date', 'invoiceDate', 'date')}
        {editableField('Payment Reference', 'reference', 'text', 'TXN...')}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#94A3B8]">
          Editable fields update in real time. Select a bank row, then run reconciliation.
        </p>
      </div>
    </div>
  )
}
