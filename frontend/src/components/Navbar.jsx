export default function Navbar({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'dashboard',      label: 'Home' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'transactions',   label: 'Transactions' },
    { id: 'reports',        label: 'Reports' },
    { id: 'audit',          label: 'Audit Trail' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-7 h-7 bg-[#0F766E] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="3" height="6" fill="white" />
                <rect x="5.5" y="4" width="3" height="9" fill="white" />
                <rect x="10" y="1" width="3" height="12" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">
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
              className={`whitespace-nowrap text-xs px-3 py-1 rounded-lg flex-shrink-0 transition-colors font-medium ${
                currentPage === item.id
                  ? 'bg-teal-50 text-[#0F766E]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
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
