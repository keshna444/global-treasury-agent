import { SCENARIO_LIST } from '../data/mockData'

const scenarioDot = (color) => {
  if (color === 'green') return 'bg-green-400'
  if (color === 'red')   return 'bg-red-400'
  return 'bg-amber-400'
}

export default function ScenarioSelector({ selected, onSelect, onRun, isRunning }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <p className="label-text mb-1">Scenario</p>
          <h2 className="text-base font-semibold text-white">Select Reconciliation Scenario</h2>
        </div>
        <button
          onClick={onRun}
          disabled={!selected || isRunning}
          className="btn-primary flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <span className="inline-block w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            'Run Reconciliation'
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIO_LIST.map((scenario) => {
          const isSelected = selected?.id === scenario.id
          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm border transition-colors duration-150 ${
                isSelected
                  ? 'bg-[#1a1a1a] border-[#3a3a3a] text-white'
                  : 'bg-transparent border-[#1e1e1e] text-[#888888] hover:border-[#2a2a2a] hover:text-[#cccccc]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${scenarioDot(scenario.color)}`} />
              {scenario.label}
              {isSelected && (
                <span className="label-text normal-case tracking-normal text-[10px] ml-1">
                  {scenario.result.confidence}%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
