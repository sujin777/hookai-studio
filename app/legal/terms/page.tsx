import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-zinc-950 hover:text-zinc-600">
            ← HookAI Studio
          </Link>
          <span className="text-xs font-medium text-zinc-400">Terms of Service</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-zinc-600 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-zinc-400">Effective Date: November 2026 · HookAI Studio</p>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">1. Service Description</h2>
          <p>
            HookAI Studio provides on-demand AI micro-utilities including RoomTransform 3s AI
            (spatial interior redesign) and ClauseGuard 3s Scanner (automated contract clause
            risk analysis).
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">2. Credits &amp; Fair Usage</h2>
          <p>
            Each visitor receives one complimentary daily preview per tool. Purchased Pro Credit
            packs are non-expiring and tied to the checkout email address provided at purchase.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">3. Disclaimer</h2>
          <p>
            ClauseGuard provides automated informational summaries and does not constitute formal
            legal representation. Consult a qualified attorney before signing binding agreements.
          </p>
        </section>
      </main>
    </div>
  );
}
