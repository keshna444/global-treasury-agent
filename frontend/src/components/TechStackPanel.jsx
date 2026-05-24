import { motion } from 'framer-motion'
import { Layers, Code2, Info } from 'lucide-react'
import { TECH_STACK } from '../data/mockData'

const CATEGORY_COLORS = [
  { border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400' },
  { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  { border: 'border-green-500/30',  bg: 'bg-green-500/10',  text: 'text-green-400' },
  { border: 'border-amber-500/30',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
  { border: 'border-pink-500/30',   bg: 'bg-pink-500/10',   text: 'text-pink-400' },
]

export default function TechStackPanel() {
  return (
    <section id="tech-stack" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="label-text">Built With</span>
          <h2 className="section-title mt-1">Technology Stack</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {TECH_STACK.map((item, i) => {
            const c = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`glass-card p-4 border ${c.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded ${c.bg} flex items-center justify-center`}>
                    <Layers className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <span className={`text-xs font-semibold ${c.text} uppercase tracking-wide`}>
                    {item.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.items.map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded bg-white/5 text-xs text-slate-300 border border-white/8">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Architecture note */}
        <div className="glass-card p-5 border-cyan-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Backend Integration Ready</p>
              <p className="text-sm text-slate-400">
                This frontend uses mock data for the prototype and is ready to connect to a backend{' '}
                <code className="font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded text-xs">/reconcile</code>{' '}
                endpoint. Replace <code className="font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded text-xs">runMockReconciliation</code>{' '}
                in <code className="font-mono text-slate-300 text-xs">services/reconciliationApi.js</code> with{' '}
                <code className="font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded text-xs">runReconciliationWithBackend</code> to go live.
              </p>
            </div>
          </div>
        </div>

        {/* Code snippet preview */}
        <div className="mt-4 glass-card overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border-b border-white/8">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-mono text-slate-500">services/reconciliationApi.js — backend hook</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto scrollbar-thin leading-relaxed">
{`// Future backend integration:
// export async function runReconciliationWithBackend(payload) {
//   const response = await fetch("http://localhost:8000/reconcile", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   return response.json();
// }`}
          </pre>
        </div>
      </div>
    </section>
  )
}
