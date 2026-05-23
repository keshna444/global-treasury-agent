import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, CheckCircle2, Loader2 } from 'lucide-react'

const TOOL_COLORS = {
  'Data Extraction Tool':   'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  'Currency Conversion Tool': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'Reconciliation Engine':  'text-green-400 bg-green-500/10 border-green-500/30',
  'Chutes Inference':       'text-purple-400 bg-purple-500/10 border-purple-500/30',
  'Morpheus Orchestrator':  'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Bittensor Infrastructure': 'text-blue-300 bg-blue-500/10 border-blue-500/30',
}

export default function AgentDecisionTrace({ trace, visibleCount, isRunning }) {
  const hasContent = trace && trace.length > 0

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <span className="label-text block">Explainability</span>
          <h3 className="text-base font-bold text-white">Agent Decision Trace</h3>
        </div>
        {isRunning && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
            <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-300 font-mono">Live</span>
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div className="bg-black/40 rounded-xl border border-white/8 overflow-hidden">
        {/* Terminal header bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border-b border-white/8">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs font-mono text-slate-500">morpheus-agent — decision-trace.log</span>
        </div>

        <div className="p-4 space-y-2 min-h-[200px] max-h-[320px] overflow-y-auto scrollbar-thin">
          {!hasContent && (
            <p className="text-xs font-mono text-slate-600 italic">
              {'>'} Waiting for reconciliation run...
            </p>
          )}

          <AnimatePresence>
            {hasContent &&
              trace.slice(0, visibleCount).map((item, i) => {
                const toolClass = TOOL_COLORS[item.tool] ?? 'text-slate-400 bg-white/5 border-white/20'
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <span className="font-mono text-slate-600 text-xs w-5 flex-shrink-0 mt-0.5">
                      {String(item.step).padStart(2, '0')}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-200 leading-relaxed">{item.text}</p>
                      <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-xs border font-mono ${toolClass}`}>
                        {item.tool}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
          </AnimatePresence>

          {isRunning && visibleCount < (trace?.length ?? 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <span className="font-mono text-slate-600 text-xs w-5">
                {String((visibleCount ?? 0) + 1).padStart(2, '0')}
              </span>
              <span className="text-xs font-mono text-cyan-400">
                {'>'} Processing
                <span className="dot-pulse inline-flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                  <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                  <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block" />
                </span>
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
