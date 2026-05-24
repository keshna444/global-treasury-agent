export default function HomeHeader({ onNavigate }) {
  return (
    <div className="py-10 border-b border-[#E2E8F0]">
      <p className="label-text mb-3">Cross-border Payment Reconciliation</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mb-3 leading-snug">
        Global Treasury Agent
      </h1>
      <p className="text-base text-[#64748B] max-w-xl mb-2 font-medium">
        Cross-border payment reconciliation for SMEs.
      </p>
      <p className="text-sm text-[#94A3B8] max-w-2xl mb-8 leading-relaxed">
        Automatically match invoices, payment proofs, FX conversions, and bank statement
        transactions in one clean workflow. Identify matched, underpaid, overpaid, and
        unmatched payments with confidence scoring and suggested actions.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onNavigate('reconciliation')}
          className="btn-primary"
        >
          Start Reconciliation
        </button>
        <button
          onClick={() => onNavigate('transactions')}
          className="btn-secondary"
        >
          View Sample Transactions
        </button>
      </div>
    </div>
  )
}
