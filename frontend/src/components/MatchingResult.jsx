const CheckMark = ({ value }) => (
  <span className={value ? 'text-green-400' : 'text-red-400'}>
    {value ? '✓' : '✗'}
  </span>
)

const VerifyRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#141414] last:border-0">
    <span className="text-xs text-[#666666]">{label}</span>
    <CheckMark value={value} />
  </div>
)

export default function MatchingResult({ result, isRunning }) {
  if (isRunning) {
    return (
      <div className="card p-4 h-full flex flex-col">
        <div className="mb-4">
          <p className="label-text mb-0.5">Column 3</p>
          <h3 className="text-sm font-semibold text-white">Reconciliation Result</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="dot-pulse flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          </div>
          <p className="text-xs text-[#555555]">Running reconciliation agent...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="card p-4 h-full flex flex-col">
        <div className="mb-4">
          <p className="label-text mb-0.5">Column 3</p>
          <h3 className="text-sm font-semibold text-white">Reconciliation Result</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[#444444] text-center px-4">
            Select a scenario and run reconciliation to see the result.
          </p>
        </div>
      </div>
    )
  }

  const isMatched   = result.status === 'Matched'
  const isUnmatched = result.status === 'Unmatched'
  const statusClass = isMatched ? 'status-matched' : isUnmatched ? 'status-unmatched' : 'status-review'
  const diffSign    = result.difference > 0 ? '+' : ''
  const diffColor   = result.difference === 0 ? 'text-green-400' : 'text-amber-400'

  return (
    <div className="card p-4 h-full flex flex-col fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Column 3</p>
          <h3 className="text-sm font-semibold text-white">Reconciliation Result</h3>
        </div>
        <span className={statusClass}>{result.status}</span>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-text">Confidence</span>
          <span className="text-sm font-mono font-semibold text-white">{result.confidence}%</span>
        </div>
        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              result.confidence >= 90 ? 'bg-green-500'
              : result.confidence >= 70 ? 'bg-amber-500'
              : 'bg-red-500'
            }`}
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#0d0d0d] rounded p-2.5">
          <p className="label-text mb-1">Expected</p>
          <p className="text-sm font-mono font-semibold text-white">
            {result.currency} {result.expectedAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#0d0d0d] rounded p-2.5">
          <p className="label-text mb-1">Received</p>
          <p className="text-sm font-mono font-semibold text-white">
            {result.currency} {result.receivedAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Difference */}
      <div className="flex items-center justify-between py-2 mb-3 border-t border-b border-[#1a1a1a]">
        <span className="text-xs text-[#666666]">Difference</span>
        <span className={`text-sm font-mono font-semibold ${diffColor}`}>
          {diffSign}{result.difference.toFixed(2)} {result.currency}
        </span>
      </div>

      {/* Verification checks */}
      <div className="mb-4">
        <p className="label-text mb-2">Verification</p>
        <div className="bg-[#0d0d0d] rounded p-2">
          <VerifyRow label="Reference match" value={result.referenceMatch} />
          <VerifyRow label="Date match"      value={result.dateMatch} />
          <VerifyRow label="Amount match"    value={result.amountMatch} />
        </div>
      </div>

      {/* Suggested action */}
      <div className="mt-auto">
        <p className="label-text mb-1.5">Suggested Action</p>
        <p className="text-xs text-[#aaaaaa] leading-relaxed">{result.suggestedAction}</p>
      </div>
    </div>
  )
}
