import { AGENT_FLOW_STEPS } from '../data/mockData'

export default function AgentWorkflow({ completedSteps, isRunning }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="label-text mb-0.5">Agent Pipeline</p>
          <h3 className="text-sm font-semibold text-[#0F172A]">AI Reconciliation Workflow</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Tool-based reasoning pipeline</p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-[#D97706] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            Processing
          </div>
        )}
        {!isRunning && completedSteps === AGENT_FLOW_STEPS.length && (
          <div className="flex items-center gap-2 text-xs text-[#16A34A] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
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
                className={`flex-1 sm:flex-none p-3 rounded-lg border text-center transition-all duration-300 w-full ${
                  isDone       ? 'step-done' :
                  isProcessing ? 'step-processing' :
                  'step-waiting'
                }`}
              >
                {/* Step number */}
                <div className={`text-xs font-mono mb-1.5 ${
                  isDone       ? 'text-[#16A34A]' :
                  isProcessing ? 'text-[#D97706]' :
                  'text-[#CBD5E1]'
                }`}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Status icon */}
                <div className="flex justify-center mb-2">
                  {isDone ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="1.5" />
                      <path d="M6 9l2.5 2.5 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isProcessing ? (
                    <span className="w-4 h-4 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>

                <p className={`text-xs font-medium leading-tight ${
                  isDone       ? 'text-[#16A34A]' :
                  isProcessing ? 'text-[#D97706]' :
                  'text-[#94A3B8]'
                }`}>
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {i < AGENT_FLOW_STEPS.length - 1 && (
                <div className={`sm:hidden mx-2 w-px h-4 ${isDone ? 'bg-[#BBF7D0]' : 'bg-[#E2E8F0]'}`} />
              )}
              {i < AGENT_FLOW_STEPS.length - 1 && (
                <div className={`hidden sm:block h-px flex-none w-3 ${isDone ? 'bg-[#BBF7D0]' : 'bg-[#E2E8F0]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Overall progress bar */}
      {(isRunning || completedSteps > 0) && (
        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="label-text">Progress</span>
            <span className="label-text">{completedSteps} / {AGENT_FLOW_STEPS.length}</span>
          </div>
          <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F766E] rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / AGENT_FLOW_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
