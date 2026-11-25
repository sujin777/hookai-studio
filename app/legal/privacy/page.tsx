import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-zinc-950 hover:text-zinc-600">
            ← HookAI Studio
          </Link>
          <span className="text-xs font-medium text-zinc-400">Privacy Policy</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-sm text-zinc-600 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-zinc-400">Effective Date: November 2026 · HookAI Studio</p>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">1. Data We Process</h2>
          <p>
            Uploaded room photos and pasted contract clauses are processed solely to generate your
            requested AI output and are not sold to third parties.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">2. Payment &amp; Billing Data</h2>
          <p>
            All payment card, Apple Pay, and PayPal transactions are processed securely by Paddle,
            our Merchant of Record. HookAI Studio only stores your purchase email and credit
            balance.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-900">3. Rate-Limiting Identifiers</h2>
          <p>
            To enforce complimentary daily previews, we store a one-way cryptographic hash of
            request IP addresses per calendar day.
          </p>
        </section>
      </main>
    </div>
  );
}
