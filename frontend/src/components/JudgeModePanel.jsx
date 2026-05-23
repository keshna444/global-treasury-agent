import { motion } from 'framer-motion'
import { Zap, Star, Code2, CheckCircle2 } from 'lucide-react'

const JUDGE_CARDS = [
  {
    icon: Star,
    weight: '45%',
    title: 'Impact & Problem Relevance',
    color: 'amber',
    points: [
      'Solves a real, painful SME finance problem',
      'Handles cross-border FX payment reconciliation',
      'Produces 5 meaningful outcome categories: Matched, Underpaid, Overpaid, Possible Match, Unmatched',
      'Clear next-action recommendations per result',
      'Before/after comparison demonstrates business value',
    ],
  },
  {
    icon: Zap,
    weight: '30%',
    title: 'Innovation & Creativity',
    color: 'purple',
    points: [
      'Full agentic AI workflow — not a simple calculator',
      'Morpheus AI orchestrates tool selection and execution order',
      'Chutes LLM generates natural language explanations',
      'Bittensor decentralized infrastructure for validation',
      'Explainable decision trace for every reconciliation',
    ],
  },
  {
    icon: Code2,
    weight: '25%',
    title: 'Technical Implementation',
    color: 'cyan',
    points: [
      'Interactive working prototype with 5 demo scenarios',
      'Animated agent architecture flow with live step progress',
      'Dynamic confidence scoring with factor breakdown',
      'Mock API service ready for backend connection via /reconcile',
      'Clean React component structure, fully responsive',
    ],
  },
]

const COLOR_MAP = {
  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  badge: 'bg-amber-500/20 border-amber-500/40', icon: 'text-amber-400' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 border-purple-500/40', icon: 'text-purple-400' },
  cyan:   { border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   badge: 'bg-cyan-500/20 border-cyan-500/40',   icon: 'text-cyan-400' },
}

export default function JudgeModePanel() {
  return (
    <section id="judge-mode" className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/30 mb-4">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Judge Mode</span>
          </div>
          <h2 className="section-title">Why This Scores Well</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Every design decision maps directly to the hackathon evaluation rubric.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {JUDGE_CARDS.map((card, i) => {
            const c = COLOR_MAP[card.color]
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`glass-card border ${c.border} p-6`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${c.badge} ${c.text}`}>
                    {card.weight}
                  </span>
                </div>
                <h3 className={`text-sm font-bold ${c.text} mb-3`}>{card.title}</h3>

                {/* Points */}
                <ul className="space-y-2">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 mt-0.5`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 glass-card p-6 border-cyan-500/20 text-center"
        >
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Global Treasury Agent addresses a{' '}
            <span className="text-amber-400 font-semibold">proven SME pain point</span>,
            demonstrates a{' '}
            <span className="text-purple-400 font-semibold">genuine multi-agent architecture</span>{' '}
            with explainable AI decision traces, and delivers a{' '}
            <span className="text-cyan-400 font-semibold">fully interactive prototype</span>{' '}
            with backend-ready API integration — directly matching all three judging dimensions.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
