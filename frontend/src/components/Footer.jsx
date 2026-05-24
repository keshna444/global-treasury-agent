export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="7" width="3" height="6" fill="#0a0a0a" />
              <rect x="5.5" y="4" width="3" height="9" fill="#0a0a0a" />
              <rect x="10" y="1" width="3" height="12" fill="#0a0a0a" />
            </svg>
          </div>
          <span className="text-xs text-[#444444] font-medium">Global Treasury Agent</span>
        </div>
        <p className="text-xs text-[#333333] font-mono">
          Cross-border payment reconciliation for SMEs
        </p>
        <p className="text-xs text-[#2a2a2a] font-mono">
          Frontend Prototype · 2026
        </p>
      </div>
    </footer>
  )
}
