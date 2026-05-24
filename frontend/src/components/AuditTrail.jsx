const toolColor = (tool) => {
  if (tool === 'Input Review')         return 'text-[#64748B]'
  if (tool === 'Data Extraction')      return 'text-[#0F766E]'
  if (tool === 'FX Conversion')        return 'text-[#2563EB]'
  if (tool === 'Transaction Matching') return 'text-[#0F172A]'
  if (tool === 'Exception Analysis')   return 'text-[#D97706]'
  if (tool === 'Final Recommendation') return 'text-[#0F766E]'
  return 'text-[#64748B]'
}

function ActionLog({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <p className="text-xs text-[#94A3B8] py-4 text-center">
        No activity recorded yet. Interact with the workspace to generate log entries.
      </p>
    )
  }
  return (
    <div className="space-y-0 font-mono text-xs overflow-y-auto max-h-64 scrollbar-thin">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
          <span className="text-[#94A3B8] flex-shrink-0 w-16">{entry.time}</span>
          <span className="text-[#CBD5E1]">—</span>
          <span className="text-[#64748B] leading-relaxed">{entry.message}</span>
        </div>
      ))}
    </div>
  )
}

function DecisionTrace({ trace, visibleCount, isRunning, result }) {
  const visible = trace.slice(0, visibleCount)

  if (visible.length === 0 && !isRunning) {
    return (
      <p className="text-xs text-[#94A3B8] py-4 text-center">
        Run a reconciliation to see the decision trace.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-0 font-mono text-xs overflow-y-auto max-h-72 scrollbar-thin">
        {visible.map((entry, i) => (
          <div
            key={entry.step}
            className="flex gap-3 py-2 border-b border-[#F1F5F9] last:border-0 slide-in"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="text-[#94A3B8] flex-shrink-0 w-5 text-right">
              {String(entry.step).padStart(2, '0')}
            </span>
            <span className={`flex-shrink-0 w-36 font-semibold ${toolColor(entry.tool)}`}>
              [{entry.tool}]
            </span>
            <span className="text-[#64748B] leading-relaxed">{entry.text}</span>
          </div>
        ))}

        {isRunning && visible.length < trace.length && (
          <div className="flex gap-3 py-2">
            <span className="text-[#94A3B8] w-5 text-right">--</span>
            <span className="text-[#CBD5E1] w-36">[Processing]</span>
            <span className="dot-pulse flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] inline-block" />
            </span>
          </div>
        )}
      </div>

      {result && !isRunning && (
        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
          <p className="label-text mb-1.5">Reconciliation Explanation</p>
          <p className="text-xs text-[#64748B] leading-relaxed">{result.explanation}</p>
        </div>
      )}
    </>
  )
}

export default function AuditTrail({ entries, trace, visibleCount, isRunning, result }) {
  const hasEntries = entries && entries.length > 0
  const showTrace  = trace && trace.length > 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label-text mb-0.5">Audit Trail</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">Reconciliation Log</h3>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-[#D97706] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            Live
          </div>
        )}
        {!isRunning && visibleCount > 0 && !hasEntries && (
          <span className="label-text">{visibleCount} entries</span>
        )}
        {hasEntries && (
          <span className="label-text">{entries.length} events</span>
        )}
      </div>

      {hasEntries && <ActionLog entries={entries} />}

      {showTrace && (
        <>
          <div className={`${hasEntries ? 'mt-4 pt-4 border-t border-[#E2E8F0]' : ''} mb-3`}>
            <p className="label-text">Agent Decision Trace</p>
          </div>
          <DecisionTrace
            trace={trace}
            visibleCount={visibleCount}
            isRunning={isRunning}
            result={result}
          />
        </>
      )}

      {!hasEntries && !showTrace && !isRunning && (
        <p className="text-xs text-[#94A3B8] py-8 text-center">
          Run a reconciliation to see the audit log.
        </p>
      )}
    </div>
  )
}
