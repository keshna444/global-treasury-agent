import { DASHBOARD_STATS } from '../data/mockData'

export default function DashboardStats() {
  const dotColor = (label) => {
    if (label === 'Matched Payments') return 'bg-green-400'
    if (label === 'Needs Review') return 'bg-amber-400'
    if (label === 'Unmatched') return 'bg-red-400'
    return 'bg-[#444444]'
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {DASHBOARD_STATS.map((stat) => (
        <div key={stat.label} className="card p-4">
          <div className="flex items-start justify-between mb-3">
            <span className="label-text">{stat.label}</span>
            <span className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${dotColor(stat.label)}`} />
          </div>
          <p className="text-2xl font-semibold text-white tabular-nums">{stat.value}</p>
          <p className="text-xs text-[#555555] mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  )
}
