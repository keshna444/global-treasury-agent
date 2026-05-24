const stepToolColor = (tool) => {
  if (tool === 'Input Review')        return 'text-[#888888]'
  if (tool === 'Data Extraction')     return 'text-[#aaaaaa]'
  if (tool === 'FX Conversion')       return 'text-[#cccccc]'
  if (tool === 'Transaction Matching') return 'text-white'
  if (tool === 'Exception Analysis')  return 'text-amber-400'
  if (tool === 'Final Recommendation') return 'text-white'
  return 'text-[#888888]'
}

export default function AuditTrail({ trace, visibleCount, isRunning, result }) {
  const visibleTrace = trace.slice(0, visibleCount)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Audit Trail</p>
          <h3 className="text-sm font-semibold text-white">Reconciliation Log</h3>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Live
          </div>
        )}
        {!isRunning && visibleCount > 0 && (
          <span className="label-text">{visibleCount} entries</span>
        )}
      </div>

      {visibleTrace.length === 0 && !isRunning && (
        <div className="py-8 text-center">
          <p className="text-xs text-[#444444]">Run a reconciliation to see the audit log.</p>
        </div>
      )}

      {(visibleTrace.length > 0 || isRunning) && (
        <div className="space-y-0 font-mono text-xs scrollbar-thin overflow-y-auto max-h-72">
          {visibleTrace.map((entry, i) => (
            <div
              key={entry.step}
              className="flex gap-3 py-2 border-b border-[#141414] last:border-0 slide-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-[#333333] flex-shrink-0 w-5 text-right">{String(entry.step).padStart(2, '0')}</span>
              <span className={`flex-shrink-0 ${stepToolColor(entry.tool)} w-36`}>
                [{entry.tool}]
              </span>
              <span className="text-[#888888] leading-relaxed">{entry.text}</span>
            </div>
          ))}

          {isRunning && visibleTrace.length < trace.length && (
            <div className="flex gap-3 py-2">
              <span className="text-[#333333] w-5 text-right">--</span>
              <span className="text-[#555555] w-36">[Processing]</span>
              <span className="dot-pulse flex gap-1 items-center">
                <span className="w-1 h-1 rounded-full bg-[#555555] inline-block" />
                <span className="w-1 h-1 rounded-full bg-[#555555] inline-block" />
                <span className="w-1 h-1 rounded-full bg-[#555555] inline-block" />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Explanation panel */}
      {result && !isRunning && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <p className="label-text mb-2">Reconciliation Explanation</p>
          <p className="text-xs text-[#888888] leading-relaxed">{result.explanation}</p>
        </div>
      )}
    </div>
  )
}
