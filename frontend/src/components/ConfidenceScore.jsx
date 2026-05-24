import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

const SCORE_FACTORS = [
  { key: 'amountScore',    label: 'Amount Match',      maxLabel: '50 pts', max: 50 },
  { key: 'dateScore',      label: 'Date Match',         maxLabel: '20 pts', max: 20 },
  { key: 'referenceScore', label: 'Reference Match',    maxLabel: '20 pts', max: 20 },
  { key: 'customerScore',  label: 'Customer Name Match', maxLabel: '10 pts', max: 10 },
]

function getColor(pct) {
  if (pct >= 90) return { bar: 'from-green-400 to-emerald-500', text: 'text-green-400', ring: 'stroke-green-400' }
  if (pct >= 75) return { bar: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', ring: 'stroke-cyan-400' }
  if (pct >= 60) return { bar: 'from-amber-400 to-orange-500', text: 'text-amber-400', ring: 'stroke-amber-400' }
  return { bar: 'from-red-400 to-rose-500', text: 'text-red-400', ring: 'stroke-red-400' }
}

function CircularProgress({ value }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const c = getColor(value)

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-2xl font-extrabold ${c.text}`}
        >
          {value}%
        </motion.span>
        <span className="text-xs text-slate-500">confidence</span>
      </div>
    </div>
  )
}

export default function ConfidenceScore({ result }) {
  if (!result) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="label-text block">Scoring</span>
            <h3 className="text-sm font-bold text-white">Confidence Score</h3>
          </div>
        </div>
        <p className="text-sm text-slate-500 text-center py-8">Run a scenario to see confidence scoring</p>
      </div>
    )
  }

  const { confidence, scoreBreakdown } = result
  const c = getColor(confidence)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Target className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <span className="label-text block">Scoring</span>
          <h3 className="text-sm font-bold text-white">Confidence Score</h3>
        </div>
      </div>

      <CircularProgress value={confidence} />

      <div className="mt-5 space-y-3">
        {SCORE_FACTORS.map(({ key, label, maxLabel, max }) => {
          const score = scoreBreakdown?.[key] ?? 0
          const pct = (score / max) * 100
          const fc = getColor(pct)
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{label}</span>
                <span className={`text-xs font-mono font-semibold ${fc.text}`}>
                  {score} / {max}
                </span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r ${fc.bar}`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
