'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Locale,
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  TranslationDict,
  detectLocale,
} from '@/lib/i18n';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: TRANSLATIONS.en,
});

const STORAGE_KEY = 'hookai_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && (saved === 'en' || saved === 'ko' || saved === 'ja' || saved === 'es' || saved === 'zh')) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      return;
    }
    const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const detected = detectLocale(browserLang);
    setLocaleState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: TRANSLATIONS[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] font-semibold shrink-0"
    >
      {SUPPORTED_LOCALES.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLocale(item.code)}
          className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
            locale === item.code
              ? 'bg-white text-zinc-950 shadow-2xs'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          {item.shortLabel}
        </button>
      ))}
    </div>
  );
}
