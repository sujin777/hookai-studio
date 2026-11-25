import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-zinc-950 hover:text-zinc-600">
            ← HookAI Studio
          </Link>
          <span className="text-xs font-medium text-zinc-400">Refund Policy</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-zinc-600 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Refund Policy</h1>
        <p className="text-xs text-zinc-400">Effective Date: November 2026 · HookAI Studio</p>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">1. Unused Credit Packs</h2>
          <p>
            If you have not consumed any credits from your purchased Pro Pack, you may request a
            full refund within 14 days of purchase via Paddle or our support contact.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">2. Technical Failures</h2>
          <p>
            If a credit was deducted due to an API outage or corrupted output, we will restore the
            affected credit or issue a pro-rata refund promptly.
          </p>
        </section>
      </main>
    </div>
  );
}
