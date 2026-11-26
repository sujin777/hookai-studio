'use client';

import React, { useEffect, useState } from 'react';
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
          customData?: { email?: string };
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
  onCreditsUpdated,
}: PaddleBarProps) {
  const { locale, t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  const isContract = targetPath.includes('/contract');

  const syncSession = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.loggedIn && data.email) {
        setLoggedInEmail(data.email);
        onEmailChange(data.email);
        const credits = isContract ? data.contract_credits : data.interior_credits;
        onCreditsUpdated?.(credits ?? 0);
      }
    } catch {
      // ignore session check errors
    }
  };

  useEffect(() => {
    syncSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPath]);

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
    const activeEmail = loggedInEmail || email;
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: activeEmail && activeEmail.includes('@') ? { email: activeEmail } : undefined,
      customData: activeEmail && activeEmail.includes('@') ? { email: activeEmail } : undefined,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: getPaddleLocale(locale),
      },
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMsg('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: authMode,
          email: authEmail,
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLoggedInEmail(data.email);
        onEmailChange(data.email);
        const credits = isContract ? data.contract_credits : data.interior_credits;
        onCreditsUpdated?.(credits ?? 0);
        setAuthOpen(false);
        setAuthPassword('');
      } else {
        setAuthMsg(data.error || 'Authentication failed.');
      }
    } catch {
      setAuthMsg('Network error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setLoggedInEmail('');
    onEmailChange('');
    onCreditsUpdated?.(0);
  };

  const authBtnLabel = locale === 'ko' ? '로그인 / 가입' : locale === 'ja' ? 'ログイン / 登録' : locale === 'es' ? 'Acceder / Registro' : locale === 'zh' ? '登录 / 注册' : 'Sign In / Join';
  const loginTabLabel = locale === 'ko' ? '로그인' : 'Sign In';
  const registerTabLabel = locale === 'ko' ? '간단 가입' : 'Quick Sign Up';
  const logoutLabel = locale === 'ko' ? '로그아웃' : 'Sign Out';

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
                  // Poll session/credits for up to 6s so webhook credits reflect immediately
                  let attempts = 0;
                  const timer = setInterval(async () => {
                    attempts += 1;
                    await syncSession();
                    if (attempts >= 5) clearInterval(timer);
                  }, 1200);
                } else if (event.name === 'checkout.error') {
                  console.error('[Paddle Checkout Error]', JSON.stringify(event));
                }
              },
            });
          }}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
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
            <span className="font-bold text-xs sm:text-sm text-zinc-950 tracking-tight">{appName}</span>
            {remainingCredits !== null && (remainingCredits > 0 || loggedInEmail) && (
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                  remainingCredits > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {remainingCredits} {t.proCreditsActive}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector />
            {loggedInEmail ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs">
                <span className="font-semibold text-zinc-800 max-w-[140px] truncate">
                  {loggedInEmail}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-zinc-900 font-bold cursor-pointer"
                >
                  {logoutLabel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(!authOpen)}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {authBtnLabel}
              </button>
            )}
            <button
              type="button"
              onClick={openCheckout}
              className="text-xs font-bold bg-zinc-950 text-white px-3.5 py-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
            >
              {t.unlockProPack} ({priceLabel})
            </button>
          </div>
        </div>

        {authOpen && !loggedInEmail && (
          <div className="bg-zinc-50/95 border-t border-zinc-200/80 px-4 sm:px-6 py-3.5">
            <form
              onSubmit={handleAuthSubmit}
              className="max-w-5xl mx-auto flex flex-wrap items-center gap-2.5 text-xs"
            >
              <div className="inline-flex rounded-lg bg-zinc-200/80 p-0.5 font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  {loginTabLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  {registerTabLabel}
                </button>
              </div>

              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 w-48 sm:w-56 focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={4}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={locale === 'ko' ? '비밀번호 (4자 이상)' : 'Password (4+ chars)'}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 w-40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="px-4 py-1.5 bg-zinc-950 text-white font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition cursor-pointer"
              >
                {authLoading ? '...' : authMode === 'login' ? loginTabLabel : registerTabLabel}
              </button>
              {authMsg && <span className="font-semibold text-rose-600">{authMsg}</span>}
            </form>
          </div>
        )}
      </header>
    </>
  );
}
