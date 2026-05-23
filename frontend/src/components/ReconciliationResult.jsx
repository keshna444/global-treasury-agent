import { motion } from 'framer-motion'
import { CheckCircle2, TrendingDown, TrendingUp, HelpCircle, XCircle, MessageSquare, ArrowRight, Bot } from 'lucide-react'

const STATUS_CONFIG = {
  'Matched':        { icon: CheckCircle2, color: 'green',  label: 'Matched',        glow: 'glow-border-green' },
  'Underpaid':      { icon: TrendingDown, color: 'amber',  label: 'Underpaid',      glow: 'glow-border-amber' },
  'Overpaid':       { icon: TrendingUp,   color: 'blue',   label: 'Overpaid',       glow: '' },
  'Possible Match': { icon: HelpCircle,   color: 'purple', label: 'Possible Match', glow: 'glow-border-purple' },
  'Unmatched':      { icon: XCircle,      color: 'red',    label: 'Unmatched',      glow: 'glow-border-red' },
}

const COLOR_MAP = {
  green:  { text: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40',  badge: 'status-matched' },
  amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  badge: 'status-underpaid' },
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/40', badge: 'status-possible' },
  red:    { text: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    badge: 'status-unmatched' },
}

function MatchBadge({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${value ? 'text-green-400 bg-green-500/15' : 'text-red-400 bg-red-500/15'}`}>
        {value ? '✓ Match' : '✗ Mismatch'}
      </span>
    </div>
  )
}

export default function ReconciliationResult({ result, isRunning }) {
  if (!result && !isRunning) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Select a scenario and run reconciliation</p>
          <p className="text-xs text-slate-600 mt-1">Results will appear here</p>
        </div>
      </div>
    )
  }

  if (isRunning && !result) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Agent is processing...</p>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG['Unmatched']
  const c = COLOR_MAP[cfg.color]
  const Icon = cfg.icon
  const diff = result.difference
  const diffStr = diff === 0 ? `${result.currency} 0.00` : diff > 0 ? `+${result.currency} ${diff.toFixed(2)}` : `-${result.currency} ${Math.abs(diff).toFixed(2)}`

  return (
    <motion.div
      key={result.status}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card border ${c.border} ${cfg.glow} p-6`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <div>
            <span className="label-text block">Reconciliation Result</span>
            <h3 className={`text-xl font-bold ${c.text}`}>{result.status}</h3>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${c.badge}`}>
          {result.confidence}% confidence
        </span>
      </div>

      {/* Amount comparison */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Expected</div>
          <div className="text-base font-bold text-white font-mono">{result.currency} {result.expectedAmount.toFixed(2)}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Received</div>
          <div className="text-base font-bold text-white font-mono">{result.currency} {result.receivedAmount.toFixed(2)}</div>
        </div>
        <div className={`glass-card p-3 text-center border ${c.border}`}>
          <div className="text-xs text-slate-500 mb-1">Difference</div>
          <div className={`text-base font-bold font-mono ${c.text}`}>{diffStr}</div>
        </div>
      </div>

      {/* Match checks */}
      <div className="mb-5">
        <MatchBadge label="Reference Number" value={result.referenceMatch} />
        <MatchBadge label="Payment Date"     value={result.dateMatch} />
        <MatchBadge label="Customer Name"    value={result.customerMatch} />
      </div>

      {/* AI Explanation */}
      <div className={`rounded-xl p-4 ${c.bg} border ${c.border} mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className={`w-4 h-4 ${c.text}`} />
          <span className={`text-xs font-semibold ${c.text}`}>AI Agent Explanation</span>
          <span className="ml-auto text-xs text-slate-500 font-mono">Chutes LLM + Morpheus</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Next action */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <ArrowRight className={`w-4 h-4 ${c.text} mt-0.5 flex-shrink-0`} />
        <div>
          <span className="text-xs font-semibold text-slate-300">Recommended Next Action</span>
          <p className="text-sm text-slate-400 mt-0.5">{result.nextAction}</p>
        </div>
      </div>
    </motion.div>
  )
}
