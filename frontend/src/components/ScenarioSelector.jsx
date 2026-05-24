import { SCENARIO_LIST } from '../data/mockData'

const scenarioDot = (color) => {
  if (color === 'green') return 'bg-[#16A34A]'
  if (color === 'red')   return 'bg-[#DC2626]'
  return 'bg-[#D97706]'
}

const scenarioTextColor = (color) => {
  if (color === 'green') return 'text-[#16A34A]'
  if (color === 'red')   return 'text-[#DC2626]'
  return 'text-[#D97706]'
}

export default function ScenarioSelector({ selected, onSelect, onRun, isRunning }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <p className="label-text mb-1">Scenario</p>
          <h2 className="text-base font-semibold text-[#0F172A]">Select Reconciliation Scenario</h2>
        </div>
        <button
          onClick={onRun}
          disabled={!selected || isRunning}
          className="btn-primary flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all duration-150 ${
                isSelected
                  ? 'bg-teal-50 border-[#0F766E] text-[#0F172A] shadow-sm'
                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scenarioDot(scenario.color)}`} />
              <span className={isSelected ? 'font-semibold' : 'font-medium'}>{scenario.label}</span>
              {isSelected && (
                <span className={`text-[10px] font-bold ml-1 ${scenarioTextColor(scenario.color)}`}>
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
