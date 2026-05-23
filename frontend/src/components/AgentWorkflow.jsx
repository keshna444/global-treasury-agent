import { AGENT_FLOW_STEPS } from '../data/mockData'

export default function AgentWorkflow({ completedSteps, isRunning }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="label-text mb-0.5">Agent Pipeline</p>
          <h3 className="text-sm font-semibold text-white">AI Reconciliation Workflow</h3>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Processing
          </div>
        )}
        {!isRunning && completedSteps === AGENT_FLOW_STEPS.length && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Complete
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-0">
        {AGENT_FLOW_STEPS.map((step, i) => {
          const isDone       = completedSteps > i
          const isProcessing = isRunning && completedSteps === i
          const isWaiting    = !isDone && !isProcessing

          return (
            <div key={step.id} className="flex sm:flex-col flex-row flex-1 items-center">
              {/* Step card */}
              <div
                className={`flex-1 sm:flex-none p-3 rounded border text-center transition-all duration-300 w-full ${
                  isDone       ? 'step-done' :
                  isProcessing ? 'step-processing' :
                  'step-waiting'
                }`}
              >
                {/* Step number */}
                <div className={`text-xs font-mono mb-1.5 ${
                  isDone       ? 'text-[#555555]' :
                  isProcessing ? 'text-amber-400' :
                  'text-[#333333]'
                }`}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Status dot */}
                <div className="flex justify-center mb-2">
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="#2a2a2a" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isProcessing ? (
                    <span className="w-4 h-4 border border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="#222222" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>

                <p className={`text-xs font-medium leading-tight ${
                  isDone       ? 'text-[#666666]' :
                  isProcessing ? 'text-amber-300' :
                  'text-[#333333]'
                }`}>
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {i < AGENT_FLOW_STEPS.length - 1 && (
                <div className={`sm:hidden mx-2 w-px h-4 ${isDone ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a]'}`} />
              )}
              {i < AGENT_FLOW_STEPS.length - 1 && (
                <div className={`hidden sm:block h-px flex-none w-3 ${isDone ? 'bg-[#2a2a2a]' : 'bg-[#1a1a1a]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Overall progress bar */}
      {(isRunning || completedSteps > 0) && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="label-text">Progress</span>
            <span className="label-text">{completedSteps} / {AGENT_FLOW_STEPS.length}</span>
          </div>
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / AGENT_FLOW_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
