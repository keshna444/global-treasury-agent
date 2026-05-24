import { DASHBOARD_STATS } from '../data/mockData'

export default function DashboardStats() {
  const dotColor = (label) => {
    if (label === 'Matched Payments') return 'bg-[#16A34A]'
    if (label === 'Needs Review')     return 'bg-[#D97706]'
    if (label === 'Unmatched')        return 'bg-[#DC2626]'
    return 'bg-[#CBD5E1]'
  }

  const valueColor = (label) => {
    if (label === 'Matched Payments') return 'text-[#16A34A]'
    if (label === 'Needs Review')     return 'text-[#D97706]'
    if (label === 'Unmatched')        return 'text-[#DC2626]'
    return 'text-[#0F172A]'
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {DASHBOARD_STATS.map((stat) => (
        <div key={stat.label} className="card p-4">
          <div className="flex items-start justify-between mb-3">
            <span className="label-text">{stat.label}</span>
            <span className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${dotColor(stat.label)}`} />
          </div>
          <p className={`text-2xl font-bold tabular-nums ${valueColor(stat.label)}`}>{stat.value}</p>
          <p className="text-xs text-[#94A3B8] mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  )
}
