'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { getPaddleLocale } from '@/lib/i18n';

declare global {
  interface Window {
    Paddle?: {
      Environment?: { set: (env: 'sandbox' | 'production') => void };
      Initialize: (opts: {
        token: string;
        eventCallback?: (event: { name?: string; data?: { customer?: { email?: string } } }) => void;
      }) => void;
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email: string };
          settings?: { displayMode?: string; theme?: string; locale?: string };
        }) => void;
      };
    };
  }
}

interface PaddleBarProps {
  appName: string;
  priceId: string;
  priceLabel: string;
  email: string;
  onEmailChange: (email: string) => void;
  remainingCredits: number | null;
  targetPath: string;
  onCreditsUpdated?: (credits: number) => void;
}

export function PaddleBar({
  appName,
  priceId,
  priceLabel,
  email,
  onEmailChange,
  remainingCredits,
  targetPath,
}: PaddleBarProps) {
  const { locale, t } = useLanguage();
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState('');
  const [recovering, setRecovering] = useState(false);

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
  const isPaddleConfigured =
    Boolean(clientToken) && !clientToken.includes('your_paddle');

  const openCheckout = () => {
    if (!isPaddleConfigured) {
      alert(t.paddleNotConfigured);
      return;
    }
    if (!window.Paddle) {
      alert(t.paddleLoading);
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email && email.includes('@') ? { email } : undefined,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: getPaddleLocale(locale),
      },
    });
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecovering(true);
    setRecoverMsg(t.checkingAccountMsg);
    try {
      const res = await fetch('/api/credits/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, targetPath }),
      });
      const data = await res.json();
      setRecoverMsg(
        data.ok
          ? data.message || t.restoreSuccessFallback
          : data.error || t.restoreFailed
      );
    } catch {
      setRecoverMsg(t.networkErrorRecover);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <>
      {isPaddleConfigured && (
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          onLoad={() => {
            if (
              process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' ||
              clientToken.startsWith('test_')
            ) {
              window.Paddle?.Environment?.set('sandbox');
            }
            window.Paddle?.Initialize({
              token: clientToken,
              eventCallback: (event) => {
                if (event.name === 'checkout.completed') {
                  const customerEmail = event.data?.customer?.email;
                  if (customerEmail) {
                    onEmailChange(customerEmail);
                  }
                }
              },
            });
          }}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-950 transition-colors"
            >
              <span className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center font-black text-[11px]">
                H
              </span>
              <span className="hidden sm:inline">{t.backToHub}</span>
            </Link>
            <span className="text-zinc-200">/</span>
            <span className="font-bold text-sm text-zinc-950 tracking-tight">{appName}</span>
            {remainingCredits !== null && remainingCredits > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full">
                {remainingCredits} {t.proCreditsActive}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setRecoverOpen(!recoverOpen)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {t.restorePurchase}
            </button>
            <button
              type="button"
              onClick={openCheckout}
              className="text-xs font-bold bg-zinc-950 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              {t.unlockProPack} ({priceLabel})
            </button>
          </div>
        </div>

        {recoverOpen && (
          <form
            onSubmit={handleRecover}
            className="bg-zinc-50/95 border-t border-zinc-200/80 px-6 py-3"
          >
            <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-sm">
              <span className="text-xs font-medium text-zinc-600">{t.enterPurchaseEmail}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <button
                type="submit"
                disabled={recovering}
                className="px-3.5 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                {recovering ? t.checking : t.sendRestoreLink}
              </button>
              {recoverMsg && (
                <span className="text-xs font-semibold text-indigo-600">{recoverMsg}</span>
              )}
            </div>
          </form>
        )}
      </header>
    </>
  );
}
