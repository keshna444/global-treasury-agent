import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Brain, Scan, ArrowLeftRight, GitCompare,
  MessageSquare, Network, LayoutDashboard, CheckCircle2, Loader2, Clock
} from 'lucide-react'
import { AGENT_FLOW_STEPS } from '../data/mockData'

const ICON_MAP = {
  FileText, Brain, Scan, ArrowLeftRight, GitCompare,
  MessageSquare, Network, LayoutDashboard,
}

const COLOR_MAP = {
  cyan:   { border: 'border-cyan-500/40',   bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   glow: 'glow-border-cyan' },
  purple: { border: 'border-purple-500/40', bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'glow-border-purple' },
  blue:   { border: 'border-blue-500/40',   bg: 'bg-blue-500/15',   text: 'text-blue-400',   glow: '' },
  green:  { border: 'border-green-500/40',  bg: 'bg-green-500/15',  text: 'text-green-400',  glow: 'glow-border-green' },
}

function StepCard({ step, status, index, completedAt }) {
  const Icon = ICON_MAP[step.icon]
  const c = COLOR_MAP[step.color]
  const isProcessing = status === 'processing'
  const isCompleted = status === 'completed'
  const isWaiting = status === 'waiting'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative p-4 rounded-xl border transition-all duration-500 ${
        isCompleted
          ? `${c.border} ${c.bg} ${c.glow}`
          : isProcessing
          ? 'border-white/30 bg-white/8 shadow-lg'
          : 'border-white/8 bg-white/3'
      }`}
    >
      {/* Connector line (not for last item) */}
      {index < AGENT_FLOW_STEPS.length - 1 && (
        <div className="hidden lg:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full h-6 w-px bg-gradient-to-b from-white/20 to-transparent" />
      )}

      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCompleted ? c.bg : isProcessing ? 'bg-white/10' : 'bg-white/5'
        }`}>
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : isCompleted ? (
            <Icon className={`w-4 h-4 ${c.text}`} />
          ) : (
            <Icon className="w-4 h-4 text-slate-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${
              isCompleted ? c.text : isProcessing ? 'text-white' : 'text-slate-500'
            }`}>
              {step.label}
            </span>
            {isProcessing && (
              <span className="flex gap-0.5 dot-pulse">
                <span className="w-1 h-1 rounded-full bg-white/70" />
                <span className="w-1 h-1 rounded-full bg-white/70" />
                <span className="w-1 h-1 rounded-full bg-white/70" />
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${
            isCompleted ? 'text-slate-400' : isProcessing ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {step.description}
          </p>
        </div>

        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 className={`w-4 h-4 ${c.text}`} />
          ) : isProcessing ? (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-mono">
              Running
            </span>
          ) : (
            <Clock className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function AgentArchitectureFlow({ isRunning, completedSteps, currentStep }) {
  const getStatus = (index) => {
    if (completedSteps > index) return 'completed'
    if (isRunning && completedSteps === index) return 'processing'
    return 'waiting'
  }

  return (
    <section id="agent-flow" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="label-text">Powered By</span>
          <h2 className="section-title mt-1">Agentic Architecture Flow</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            The Morpheus agent orchestrates each tool in sequence — from data extraction
            through FX conversion, matching, and LLM explanation.
          </p>
        </div>

        {/* Flow grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Background connector */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 pointer-events-none" />

          {AGENT_FLOW_STEPS.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              status={getStatus(i)}
            />
          ))}
        </div>

        {/* Progress bar */}
        {(isRunning || completedSteps > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">Agent Progress</span>
              <span className="text-xs font-mono text-cyan-400">
                {completedSteps} / {AGENT_FLOW_STEPS.length} steps
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedSteps / AGENT_FLOW_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Architecture legend */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Morpheus AI', desc: 'Agent Orchestration', color: 'purple' },
            { label: 'Chutes', desc: 'LLM Inference Layer', color: 'cyan' },
            { label: 'Bittensor', desc: 'Decentralized AI', color: 'blue' },
            { label: 'Matching Engine', desc: 'Reconciliation Core', color: 'green' },
          ].map(({ label, desc, color }) => {
            const c = COLOR_MAP[color]
            return (
              <div key={label} className={`p-3 rounded-lg border ${c.border} ${c.bg}`}>
                <div className={`text-xs font-semibold ${c.text}`}>{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
