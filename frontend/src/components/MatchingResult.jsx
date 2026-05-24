const CheckRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
    <span className="text-xs text-[#64748B]">{label}</span>
    <span className={`text-xs font-semibold ${value ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
      {value ? '✓ Match' : '✗ Mismatch'}
    </span>
  </div>
)

export default function MatchingResult({ result, isRunning }) {
  if (isRunning) {
    return (
      <div className="card p-4 h-full flex flex-col">
        <div className="mb-4">
          <p className="label-text mb-0.5">Reconciliation Result</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Analysis</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="dot-pulse flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] inline-block" />
            <span className="w-2 h-2 rounded-full bg-[#0F766E] inline-block" />
            <span className="w-2 h-2 rounded-full bg-[#0F766E] inline-block" />
          </div>
          <p className="text-xs text-[#64748B]">Running reconciliation...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="card p-4 h-full flex flex-col">
        <div className="mb-4">
          <p className="label-text mb-0.5">Reconciliation Result</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Analysis</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[#94A3B8] text-center px-4">
            Select a scenario and click Run Reconciliation to see results.
          </p>
        </div>
      </div>
    )
  }

  const isMatched   = result.status === 'Matched'
  const isUnmatched = result.status === 'Unmatched'
  const statusClass = isMatched ? 'status-matched' : isUnmatched ? 'status-unmatched' : 'status-review'
  const diffSign    = result.difference > 0 ? '+' : ''
  const diffColor   = result.difference === 0 ? 'text-[#16A34A]' : result.difference > 0 ? 'text-[#D97706]' : 'text-[#DC2626]'
  const currency    = result.currency || 'MYR'

  return (
    <div className="card p-4 h-full flex flex-col fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Reconciliation Result</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Analysis</h3>
        </div>
        <span className={statusClass}>{result.status}</span>
      </div>

      {/* Confidence score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-text">Confidence Score</span>
          <span className="text-sm font-mono font-bold text-[#0F172A]">{result.confidence}%</span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              result.confidence >= 90 ? 'bg-[#16A34A]'
              : result.confidence >= 70 ? 'bg-[#D97706]'
              : 'bg-[#DC2626]'
            }`}
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0]">
          <p className="label-text mb-1">Expected</p>
          <p className="text-sm font-mono font-bold text-[#0F172A]">
            {currency} {result.expectedAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0]">
          <p className="label-text mb-1">Received</p>
          <p className="text-sm font-mono font-bold text-[#0F172A]">
            {currency} {result.receivedAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* FX Rate */}
      {result.fxRate && (
        <div className="flex items-center justify-between px-3 py-2 mb-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
          <span className="text-xs text-[#64748B]">FX Rate (transaction date {result.fxDate})</span>
          <span className="text-xs font-mono font-semibold text-[#2563EB]">
            1 {result.fxFrom} = {result.fxRate} {result.fxTo}
          </span>
        </div>
      )}

      {/* Difference */}
      <div className="flex items-center justify-between py-2 mb-3 border-t border-b border-[#E2E8F0]">
        <span className="text-xs text-[#64748B]">Difference</span>
        <span className={`text-sm font-mono font-bold ${diffColor}`}>
          {diffSign}{result.difference.toFixed(2)} {currency}
        </span>
      </div>

      {/* Verification checks */}
      <div className="mb-4">
        <p className="label-text mb-2">Verification Checks</p>
        <div className="bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
          <CheckRow label="Reference Match"  value={result.referenceMatch} />
          <CheckRow label="Date Match"       value={result.dateMatch} />
          <CheckRow label="Amount Match"     value={result.amountMatch} />
          <CheckRow label="Customer Match"   value={result.customerMatch} />
        </div>
      </div>

      {/* Discrepancy Summary — only for non-matched or review cases */}
      {!isMatched && (
        <div className="mb-4">
          <p className="label-text mb-2">Discrepancy Summary</p>
          <div className="bg-red-50 rounded-lg border border-red-200 p-2.5 space-y-1.5">
            {result.difference !== 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#DC2626]">Amount discrepancy</span>
                <span className="font-mono text-[#DC2626] font-semibold">
                  {diffSign}{result.difference.toFixed(2)} {currency}
                </span>
              </div>
            )}
            {!result.referenceMatch && (
              <div className="flex justify-between text-xs">
                <span className="text-[#DC2626]">Reference mismatch</span>
                <span className="text-[#DC2626]">✗ No match</span>
              </div>
            )}
            {!result.customerMatch && (
              <div className="flex justify-between text-xs">
                <span className="text-[#DC2626]">Customer not verified</span>
                <span className="text-[#DC2626]">✗ Unknown</span>
              </div>
            )}
            {!result.amountMatch && result.difference === 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#DC2626]">Amount flagged</span>
                <span className="text-[#DC2626]">✗ Review needed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {result.explanation && (
        <div className="mb-4">
          <p className="label-text mb-1.5">Explanation</p>
          <p className="text-xs text-[#64748B] leading-relaxed">{result.explanation}</p>
        </div>
      )}

      {/* Bank Fee Check */}
      {result.bankFeeNote && (
        <div className="mb-4 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-[#D97706] mb-0.5">Bank Fee Check</p>
          <p className="text-xs text-[#64748B]">{result.bankFeeNote}</p>
        </div>
      )}

      {/* Suggested action */}
      <div className="mt-auto pt-3 border-t border-[#E2E8F0]">
        <p className="label-text mb-1.5">Suggested Action</p>
        <p className="text-xs text-[#64748B] leading-relaxed">
          {result.suggestedAction}
        </p>
      </div>

      {/* Reconciliation report generated */}
      <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
        <span className="text-xs text-[#0F766E] font-medium">Reconciliation report generated</span>
      </div>
    </div>
  )
}
