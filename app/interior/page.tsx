'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { PaddleBar } from '@/components/PaddleBar';
import { useLanguage } from '@/components/LanguageProvider';
import { getPaddleLocale } from '@/lib/i18n';

// SSR 원천 차단으로 Next.js 서버 렌더링 오류 방지
const Room360Viewer = dynamic(() => import('@/components/Room360Viewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] sm:h-[540px] rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-400 text-xs font-semibold">
      Loading 360° Spatial Engine...
    </div>
  ),
});

function resizeAndCompressImage(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function InteriorAppPage() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Modern Boutique Hotel');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'2d' | '360'>('360');
  const [isWatermarked, setIsWatermarked] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paywallMsg, setPaywallMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_INTERIOR || 'pri_interior_pack';

  const cameraLabel =
    locale === 'ko'
      ? '📷 카메라로 바로 찍기'
      : locale === 'ja'
      ? '📷 カメラで撮影'
      : locale === 'es'
      ? '📷 Tomar Foto'
      : locale === 'zh'
      ? '📷 相机拍照'
      : '📷 Take Photo';
  const galleryLabel =
    locale === 'ko'
      ? '🖼️ 앨범에서 사진 선택'
      : locale === 'ja'
      ? '🖼️ アルバムから選択'
      : locale === 'es'
      ? '🖼️ Elegir de Galería'
      : locale === 'zh'
      ? '🖼️ 从相册选择'
      : '🖼️ Choose Photo';

  const tab360Label =
    locale === 'ko'
      ? '360° XR 공간 보기'
      : locale === 'ja'
      ? '360° XR 空間ビュー'
      : locale === 'es'
      ? 'Vista 360° XR'
      : locale === 'zh'
      ? '360° XR 空间视角'
      : '360° XR Room View';

  const tab2dLabel =
    locale === 'ko'
      ? '2D 고화질 사진'
      : locale === 'ja'
      ? '2D 高画質写真'
      : locale === 'es'
      ? 'Foto 2D HD'
      : locale === 'zh'
      ? '2D 高清照片'
      : '2D HD Photo';

  const openPaddleCheckout = () => {
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const compressed = await resizeAndCompressImage(file);
      setPreviewSrc(compressed);
    } catch {
      setErrorMsg('Could not process selected image.');
    }
  };

  const handleTransform = async () => {
    if (!previewSrc) {
      alert(t.interiorUploadFirst);
      return;
    }
    setLoading(true);
    setPaywallMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewSrc,
          style: selectedStyle,
          userEmail: email,
          locale,
        }),
      });
      const data = await res.json();

      if (res.status === 402 || data.requirePayment) {
        setPaywallMsg(data.error);
        openPaddleCheckout();
        return;
      }

      if (data.ok) {
        setResultUrl(data.resultImageUrl);
        setIsWatermarked(Boolean(data.isWatermarked));
        setRemainingCredits(data.remainingCredits);
        setViewMode('360');
        try {
          sessionStorage.setItem('hookai_last_room_img', data.resultImageUrl);
          sessionStorage.setItem('hookai_last_room_style', selectedStyle);
        } catch {
          // ignore storage quota errors
        }
      } else {
        setErrorMsg(data.error || 'Error occurred.');
      }
    } catch {
      setErrorMsg(t.interiorNetworkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      <PaddleBar
        appName={`${t.interiorAppName} · 360° XR`}
        priceId={priceId}
        priceLabel={t.interiorPriceLabel}
        email={email}
        onEmailChange={setEmail}
        remainingCredits={remainingCredits}
        targetPath="/interior"
      />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex-1">
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-9 shadow-xs space-y-6 sm:space-y-7">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              {t.card1Tag} · 360° Walkthrough
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 mt-1">
              {t.interiorStep1Title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">{t.interiorStep1Desc}</p>

            {/* Hidden inputs for mobile camera & gallery */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-zinc-950 text-white text-xs sm:text-sm font-bold hover:bg-zinc-800 active:scale-[0.99] transition-all cursor-pointer"
              >
                {cameraLabel}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="min-h-[48px] px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-bold hover:bg-zinc-100 active:scale-[0.99] transition-all cursor-pointer"
              >
                {galleryLabel}
              </button>
            </div>

            {previewSrc && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-200 max-h-72 bg-zinc-50">
                <img
                  src={previewSrc}
                  alt="Uploaded room preview"
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              {t.interiorStep2Title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {t.interiorStyles.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`min-h-[48px] p-3.5 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedStyle === st.id
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading || !previewSrc}
            onClick={handleTransform}
            className="w-full min-h-[52px] py-4 bg-zinc-950 text-white text-sm font-bold rounded-2xl hover:bg-emerald-600 disabled:opacity-40 active:scale-[0.99] transition-all cursor-pointer"
          >
            {loading ? t.interiorTransformingBtn : t.interiorTransformBtn}
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

          {resultUrl && (
            <div className="pt-6 border-t border-zinc-100 space-y-4">
              {/* 2D 사진 / 360° XR 공간 전환 탭 바 */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-extrabold text-zinc-950">{t.interiorResultTitle}</h3>

                <div className="flex flex-wrap items-center gap-2">
                  {!isWatermarked && (
                    <a
                      href={resultUrl}
                      download="hookai-roomtransform-hd.png"
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3.5 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      {t.interiorDownloadHd}
                    </a>
                  )}

                  <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode('360')}
                      className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === '360'
                          ? 'bg-zinc-950 text-white shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {tab360Label}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('2d')}
                      className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === '2d'
                          ? 'bg-zinc-950 text-white shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {tab2dLabel}
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === '360' ? (
                <Room360Viewer
                  imageUrl={resultUrl}
                  isWatermarked={isWatermarked}
                  onUnlockClick={openPaddleCheckout}
                />
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200">
                  <img src={resultUrl} alt="Redesigned room" className="w-full object-cover" />
                  {isWatermarked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/15">
                      <span className="text-white/75 text-lg sm:text-2xl font-black tracking-widest rotate-[-18deg] select-none text-center px-4">
                        {t.interiorWatermarkText}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
