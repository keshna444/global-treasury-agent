export default function InvoicePanel({ invoiceData, onChange }) {
  const inv = invoiceData

  const field = (label, key, type = 'text') => (
    <div key={key}>
      <label className="label-text block mb-1">{label}</label>
      <input
        type={type}
        value={inv[key] ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        className="input-field font-mono"
      />
    </div>
  )

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Column 1</p>
          <h3 className="text-sm font-semibold text-white">Invoice / Payment Proof</h3>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <div>
          <label className="label-text block mb-1">Invoice Number</label>
          <div className="input-field font-mono text-[#888888] cursor-default">{inv.invoiceNo}</div>
        </div>
        <div>
          <label className="label-text block mb-1">Customer</label>
          <div className="input-field text-[#888888] cursor-default">{inv.customer}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('Invoice Amount', 'invoiceAmount')}
          {field('Currency', 'invoiceCurrency')}
        </div>

        <div>
          <label className="label-text block mb-1">Expected Local Amount (FX)</label>
          <div className="input-field font-mono text-[#888888] cursor-default">{inv.expectedConverted}</div>
        </div>

        {field('Bank Received Amount', 'bankReceived')}
        {field('Payment Reference', 'reference')}

        <div>
          <label className="label-text block mb-1">Invoice Date</label>
          <div className="input-field font-mono text-[#888888] cursor-default">{inv.date}</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
        <p className="text-xs text-[#444444]">
          Editable fields update the reconciliation result in real time.
        </p>
      </div>
    </div>
  )
}
