'use client';

import React, { useState } from 'react';
import { PaddleBar } from '@/components/PaddleBar';
import { useLanguage } from '@/components/LanguageProvider';
import { getPaddleLocale } from '@/lib/i18n';

interface ClauseItem {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  safe_counter_clause: string;
}

interface ScanReport {
  risk_score: number;
  summary: string;
  clauses: ClauseItem[];
  lockedCount: number;
  remainingCredits: number;
}

export default function ContractAppPage() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [report, setReport] = useState<ScanReport | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paywallMsg, setPaywallMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_CONTRACT || 'pri_contract_pack';

  const pasteLabel = locale === 'ko' ? '📋 클립보드 붙여넣기' : locale === 'ja' ? '📋 貼り付け' : locale === 'es' ? '📋 Pegar' : locale === 'zh' ? '📋 粘贴剪贴板' : '📋 Paste';
  const copyLabel = locale === 'ko' ? '복사' : locale === 'ja' ? 'コピー' : locale === 'es' ? 'Copiar' : locale === 'zh' ? '复制' : 'Copy';
  const copiedLabel = locale === 'ko' ? '복사됨 ✓' : locale === 'ja' ? '完了 ✓' : locale === 'es' ? 'Copiado ✓' : locale === 'zh' ? '已复制 ✓' : 'Copied ✓';

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      alert('Please paste directly into the text box.');
    }
  };

  const handleCopyClause = async (clauseText: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(clauseText);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleScan = async () => {
    if (text.trim().length < 20) {
      alert(t.contractPasteFirst);
      return;
    }
    setLoading(true);
    setPaywallMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: text, userEmail: email, locale }),
      });
      const data = await res.json();

      if (res.status === 402 || data.requirePayment) {
        setPaywallMsg(data.error);
        window.Paddle?.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: email && email.includes('@') ? { email } : undefined,
          settings: { displayMode: 'overlay', theme: 'light', locale: getPaddleLocale(locale) },
        });
        return;
      }

      if (data.ok) {
        setReport(data);
        setRemainingCredits(data.remainingCredits);
      } else {
        setErrorMsg(data.error || 'Error scanning contract.');
      }
    } catch {
      setErrorMsg(t.contractNetworkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      <PaddleBar
        appName={t.contractAppName}
        priceId={priceId}
        priceLabel={t.contractPriceLabel}
        email={email}
        onEmailChange={setEmail}
        remainingCredits={remainingCredits}
        onCreditsUpdated={setRemainingCredits}
        targetPath="/contract"
      />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex-1">
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-9 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex flex-wrap justify-between items-end gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {t.card2Tag}
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 mt-1">
                {t.contractTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="min-h-[38px] text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              >
                {pasteLabel}
              </button>
              <button
                type="button"
                onClick={() => setText(t.contractSampleText)}
                className="min-h-[38px] text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors cursor-pointer shrink-0"
              >
                {t.contractLoadSample}
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.contractPlaceholder}
            className="w-full p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
          />

          <button
            type="button"
            disabled={loading}
            onClick={handleScan}
            className="w-full min-h-[52px] py-4 bg-zinc-950 text-white text-sm font-bold rounded-2xl hover:bg-indigo-600 disabled:opacity-40 active:scale-[0.99] transition-all cursor-pointer"
          >
            {loading ? t.contractScanningBtn : t.contractScanBtn}
          </button>

          {paywallMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-sm text-amber-900 font-semibold">
              {paywallMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-sm text-rose-800 font-semibold">
              {errorMsg}
            </div>
          )}

          {report && (
            <div className="pt-6 border-t border-zinc-100 space-y-4">
              <div className="flex items-center justify-between gap-4 bg-zinc-950 text-white p-5 rounded-2xl">
                <div>
                  <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                    {t.contractRiskScoreLabel}
                  </div>
                  <div className="text-sm text-zinc-200 mt-1 leading-relaxed">{report.summary}</div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 shrink-0">
                  {report.risk_score}/100
                </div>
              </div>

              {report.clauses.map((c, idx) => (
                <div key={idx} className="border border-zinc-200/90 rounded-2xl p-4 sm:p-5 bg-zinc-50/60 space-y-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-zinc-950">
                      #{idx + 1} {c.title}
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 shrink-0">
                      {c.severity} {t.contractRiskBadge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{c.explanation}</p>
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 text-xs text-emerald-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-bold">{t.contractSafeCounterLabel}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopyClause(c.safe_counter_clause, idx)}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer shrink-0"
                      >
                        {copiedIdx === idx ? copiedLabel : copyLabel}
                      </button>
                    </div>
                    <span>{c.safe_counter_clause}</span>
                  </div>
                </div>
              ))}

              {report.lockedCount > 0 && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                  <span className="text-sm font-bold text-indigo-950">
                    +{report.lockedCount} {t.contractLockedBanner}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      window.Paddle?.Checkout.open({
                        items: [{ priceId, quantity: 1 }],
                        customer: email && email.includes('@') ? { email } : undefined,
                        settings: {
                          displayMode: 'overlay',
                          theme: 'light',
                          locale: getPaddleLocale(locale),
                        },
                      })
                    }
                    className="min-h-[42px] px-4 py-2 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors cursor-pointer shrink-0"
                  >
                    {t.contractUnlockAll}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
