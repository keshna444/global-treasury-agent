export default function Navbar({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'dashboard',      label: 'Dashboard' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'transactions',   label: 'Transactions' },
    { id: 'reports',        label: 'Reports' },
    { id: 'audit',          label: 'Audit Trail' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="3" height="6" fill="#0a0a0a" />
                <rect x="5.5" y="4" width="3" height="9" fill="#0a0a0a" />
                <rect x="10" y="1" width="3" height="12" fill="#0a0a0a" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Global Treasury Agent
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={currentPage === item.id ? 'nav-item-active' : 'nav-item'}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('reconciliation')}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Start Reconciliation
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto scrollbar-thin">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`whitespace-nowrap text-xs px-3 py-1 rounded flex-shrink-0 transition-colors ${
                currentPage === item.id
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#666666] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
