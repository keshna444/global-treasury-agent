import { useState } from 'react'
import { getMockExtractedData, validateExtractedData } from '../services/reconciliationApi'

export default function DataExtractionPreview({ onDataLoaded }) {
  const [loading, setLoading]       = useState(false)
  const [loaded, setLoaded]         = useState(false)
  const [validation, setValidation] = useState(null)

  const handleLoad = async () => {
    setLoading(true)
    try {
      const data = await getMockExtractedData()
      const result = validateExtractedData(data)
      setValidation(result)
      if (result.isValid) {
        onDataLoaded(data)
        setLoaded(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">OCR / Data Extraction</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">OCR / Data Extraction Preview</h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            Accepts structured output from the OCR and data extraction pipeline.
          </p>
        </div>
        {loaded && (
          <span className="status-matched text-xs">Loaded</span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="label-text mb-1.5">Invoices Detected</p>
          <p className="text-xl font-bold text-[#0F172A] tabular-nums">1</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">INV-2026-001</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="label-text mb-1.5">Bank Transactions</p>
          <p className="text-xl font-bold text-[#0F172A] tabular-nums">3</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Ready to match</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="label-text mb-1.5">Data Quality</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <p className="text-sm font-semibold text-[#16A34A]">Clean</p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">All fields present</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="label-text mb-1.5">Missing Fields</p>
          <p className="text-xl font-bold text-[#0F172A] tabular-nums">0</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">No issues found</p>
        </div>
      </div>

      {/* Data contract preview */}
      <div className="bg-slate-50 rounded-lg border border-[#E2E8F0] p-3 mb-4 font-mono text-xs text-[#64748B] overflow-x-auto scrollbar-thin">
        <p className="text-[#94A3B8] mb-1">// Extraction output contract</p>
        <p><span className="text-[#64748B]">invoice.invoiceNo</span>      <span className="text-[#0F766E] font-semibold">→ INV-2026-001</span></p>
        <p><span className="text-[#64748B]">invoice.invoiceAmount</span>  <span className="text-[#0F766E] font-semibold">→ USD 10.00</span></p>
        <p><span className="text-[#64748B]">invoice.expectedLocal</span>  <span className="text-[#0F766E] font-semibold">→ MYR 42.50</span></p>
        <p><span className="text-[#64748B]">bankTransactions</span>       <span className="text-[#0F766E] font-semibold">→ 3 records</span></p>
      </div>

      {validation && !validation.isValid && (
        <div className="mb-3 px-3 py-2 rounded-lg border border-red-200 bg-red-50">
          <p className="text-xs text-[#DC2626]">{validation.message}</p>
        </div>
      )}

      {loaded && validation?.isValid && (
        <div className="mb-3 px-3 py-2 rounded-lg border border-green-200 bg-green-50">
          <p className="text-xs text-[#16A34A]">
            Extracted data loaded into reconciliation workspace.
          </p>
        </div>
      )}

      <button
        onClick={handleLoad}
        disabled={loading || loaded}
        className={`btn-secondary text-xs ${loaded ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border border-[#0F766E] border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : loaded ? 'Data Loaded' : 'Load Extracted Data'}
      </button>
    </div>
  )
}
