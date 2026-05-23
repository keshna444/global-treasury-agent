import { motion } from 'framer-motion'
import { Zap, Bot, Shield, GitMerge } from 'lucide-react'
import { IMPACT_METRICS } from '../data/mockData'

const ICONS = { Zap, Bot, Shield, GitMerge }

const GRADIENTS = [
  'from-cyan-400 to-blue-500',
  'from-purple-400 to-pink-500',
  'from-green-400 to-emerald-500',
  'from-amber-400 to-orange-500',
]

export default function ImpactMetrics() {
  return (
    <section id="impact" className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="label-text">Business Value</span>
          <h2 className="section-title mt-1">Real Impact for SMEs</h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto mt-2">
            By automating cross-border payment matching, SMEs can reduce manual finance work,
            improve cash-flow visibility, and maintain a clearer audit trail for international transactions.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {IMPACT_METRICS.map((metric, i) => {
            const Icon = ICONS[metric.icon]
            const grad = GRADIENTS[i % GRADIENTS.length]
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6 text-center group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
                <div className={`text-4xl font-extrabold bg-gradient-to-r ${grad} bg-clip-text text-transparent mb-1`}>
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{metric.label}</div>
                <div className="text-xs text-slate-500">{metric.description}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Problem vs Solution comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-red-500/20">
            <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs">✗</span>
              Without Global Treasury Agent
            </h3>
            <ul className="space-y-2">
              {[
                'Finance team manually checks every invoice vs bank record',
                'FX conversion done on spreadsheets — error-prone',
                'No audit trail — hard to dispute or review decisions',
                '2–4 hours per reconciliation cycle',
                'Mismatches discovered late, cash flow blocked',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-6 border-green-500/20">
            <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
              With Global Treasury Agent
            </h3>
            <ul className="space-y-2">
              {[
                'Morpheus AI agent handles matching end-to-end automatically',
                'FX conversion built into the pipeline — always accurate',
                'Complete decision trace via Bittensor for full auditability',
                'Results in under 3 seconds per transaction',
                'Immediate alerts and recommended actions for exceptions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
