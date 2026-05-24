import { Globe, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              Global <span className="text-cyan-400">Treasury</span> Agent
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>Frontend prototype — mock data only</span>
            <span className="hidden sm:block">·</span>
            <span>No real API keys used</span>
            <span className="hidden sm:block">·</span>
            <a
              href="https://github.com/keshna444/global-treasury-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>

          <div className="text-xs text-slate-600">
            Built with React + Vite + Tailwind CSS
          </div>
        </div>
      </div>
    </footer>
  )
}
