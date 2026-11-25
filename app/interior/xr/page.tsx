'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PaddleBar } from '@/components/PaddleBar';
import { useLanguage } from '@/components/LanguageProvider';
import { getPaddleLocale } from '@/lib/i18n';

// SSR 원천 차단
const InteriorXrStage = dynamic(() => import('@/components/InteriorXrStage'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] sm:h-[560px] rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-400 text-sm font-semibold">
      Initializing 3D Spatial Engine...
    </div>
  ),
});

export default function InteriorXrPage() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [roomImage, setRoomImage] = useState<string>('');
  const [styleName, setStyleName] = useState<string>('Modern Boutique Hotel');

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_INTERIOR || 'pri_interior_pack';

  useEffect(() => {
    const savedImg = sessionStorage.getItem('hookai_last_room_img');
    const savedStyle = sessionStorage.getItem('hookai_last_room_style');
    if (savedImg) setRoomImage(savedImg);
    if (savedStyle) setStyleName(savedStyle);
  }, []);

  const triggerPaddleCheckout = () => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    if (!clientToken || clientToken.includes('your_paddle')) {
      alert(t.paddleNotConfigured);
      return;
    }
    window.Paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email && email.includes('@') ? { email } : undefined,
      settings: { displayMode: 'overlay', theme: 'light', locale: getPaddleLocale(locale) },
    });
  };

  const titleText =
    locale === 'ko'
      ? '3D 공간 워크스루 쇼룸'
      : locale === 'ja'
      ? '3D空間ウォークスルー'
      : locale === 'es'
      ? 'Recorrido Espacial 3D'
      : locale === 'zh'
      ? '3D 空间沉浸式展厅'
      : '3D Spatial Room Walkthrough';

  const backLabel =
    locale === 'ko' ? '← 2D 스튜디오로 돌아가기' : '← Back to 2D Studio';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col">
      <PaddleBar
        appName="RoomTransform XR"
        priceId={priceId}
        priceLabel="$10.90 / 10 Renders + VR"
        email={email}
        onEmailChange={setEmail}
        remainingCredits={remainingCredits}
        targetPath="/interior/xr"
      />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              WebXR · Meta Quest · Mobile Ready
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">
              {titleText}
            </h1>
          </div>

          <Link
            href="/interior"
            className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
          >
            {backLabel}
          </Link>
        </div>

        {/* 3D / XR 캔버스 */}
        <InteriorXrStage
          imageUrl={roomImage}
          styleName={styleName}
          hasProCredits={remainingCredits > 0}
          onRequireUpgrade={triggerPaddleCheckout}
        />

        {!roomImage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
            <span>
              {locale === 'ko'
                ? '팁: 먼저 RoomTransform 2D 스튜디오에서 방을 변환하면, 그 결과가 이 3D 공간 정면에 자동 투사됩니다.'
                : 'Tip: Generate a room makeover in RoomTransform 2D Studio first to project your own room inside this 3D space.'}
            </span>
            <Link href="/interior" className="font-bold underline shrink-0">
              {locale === 'ko' ? '방 사진 업로드 →' : 'Upload Room Photo →'}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
