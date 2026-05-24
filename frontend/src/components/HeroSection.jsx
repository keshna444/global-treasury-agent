import { motion } from 'framer-motion'
import { ArrowRight, Globe, Shield, Zap, GitMerge, Bot, TrendingUp } from 'lucide-react'

const BADGES = [
  { label: 'Morpheus AI', color: 'purple' },
  { label: 'Chutes', color: 'cyan' },
  { label: 'Bittensor', color: 'blue' },
  { label: 'FX Matching', color: 'green' },
  { label: 'SME Finance', color: 'amber' },
  { label: 'Agentic AI', color: 'pink' },
]

const BADGE_COLORS = {
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  green: 'bg-green-500/15 text-green-300 border-green-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  pink: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
}

const STATS = [
  { icon: Zap, value: '< 3s', label: 'per reconciliation' },
  { icon: Shield, value: '95%', label: 'traceability' },
  { icon: TrendingUp, value: '80%', label: 'time saved' },
]

export default function HeroSection({ onRunDemo }) {
  return (
    <section className="relative min-h-screen hero-bg grid-bg flex items-center pt-16 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pre-badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
              Hackathon Demo — Frontend Prototype
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
          >
            <span className="text-white">Global</span>{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Treasury
            </span>
            <br />
            <span className="text-white">Agent</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-slate-300 font-medium mb-4"
          >
            Agentic AI for cross-border payment reconciliation
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            An AI-powered treasury assistant that helps SMEs match invoices, foreign payments,
            bank transactions, and FX conversions in seconds — reducing manual reconciliation
            from hours to a single click.
          </motion.p>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {BADGES.map((badge) => (
              <span
                key={badge.label}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${BADGE_COLORS[badge.color]}`}
              >
                {badge.label}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <button
              onClick={onRunDemo}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              Run Demo Reconciliation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#agent-flow"
              className="flex items-center gap-2 px-6 py-4 rounded-xl border border-white/15 text-slate-300 font-medium text-base hover:border-cyan-400/40 hover:text-cyan-400 transition-all duration-300"
            >
              <Bot className="w-4 h-4" />
              View Agent Architecture
            </a>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xs text-slate-500 font-mono"
          >
            Frontend prototype using mock data. Backend-ready through{' '}
            <code className="text-cyan-600">/reconcile</code> API.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050d1a] to-transparent pointer-events-none" />
    </section>
  )
}
