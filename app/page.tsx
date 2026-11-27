'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { Locale } from '@/lib/i18n';

const LANDING_COPY: Record<
  Locale,
  {
    badge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSub: string;
    navRoom: string;
    navSign: string;
    roomTag: string;
    roomPrice: string;
    roomTitle: string;
    roomDesc: string;
    roomMeta: string;
    roomCta: string;
    roomMockSub: string;
    roomMockBadge: string;
    signTag: string;
    signPrice: string;
    signTitle: string;
    signDesc: string;
    signMeta: string;
    signCta: string;
    signMockSub: string;
    signMockBadge: string;
    trustNote: string;
    terms: string;
    privacy: string;
    refund: string;
  }
> = {
  en: {
    badge: 'No Account Required · Instant AI Results in 3s',
    heroTitle1: 'Two Focused AI Tools.',
    heroTitle2: 'Zero Monthly Subscriptions.',
    heroSub:
      'Redesign any room or audit risky contracts in 3 seconds. Try once free every day, and unlock pro packs only when you need them.',
    navRoom: 'RoomTransform',
    navSign: 'ClauseGuard',
    roomTag: 'SPATIAL INTERIOR AI',
    roomPrice: '$10.90 / 10 HD Renders',
    roomTitle: 'RoomTransform 3s AI',
    roomDesc:
      'Upload a photo of your room. Keep exact window placement and dimensions while transforming furniture and lighting into boutique styles.',
    roomMeta: '1 Free Daily Preview',
    roomCta: 'Open Studio',
    roomMockSub: 'Window & Room Geometry Locked',
    roomMockBadge: '4 Styles',
    signTag: 'CONTRACT RISK AI',
    signPrice: '$14.90 / 5 Full Audits',
    signTitle: 'ClauseGuard 3s Scanner',
    signDesc:
      'Paste freelance agreements, leases, or NDAs to detect hidden liability traps, get a 0–100 risk score, and copy safe counter-clauses.',
    signMeta: '1 Free Daily Audit',
    signCta: 'Scan Contract',
    signMockSub: '3 Toxic Clauses & Safe Redlines',
    signMockBadge: 'HIGH RISK',
    trustNote: 'Secure global checkout & tax handling powered by Paddle.',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
  },
  ko: {
    badge: '회원가입 없이 바로 실행 · 3초 만에 결과 확인',
    heroTitle1: '3초 만에 끝내는 두 가지 AI.',
    heroTitle2: '구독료 부담은 제로.',
    heroSub:
      '방 사진 인테리어 변환부터 계약서 독소조항 분석까지. 매일 1회 무료로 먼저 경험하고, 필요한 만큼만 크레딧을 충전하세요.',
    navRoom: '인테리어 AI',
    navSign: '계약서 스캐너',
    roomTag: '공간 인테리어 AI',
    roomPrice: '$10.90 / 10회 고화질 렌더링',
    roomTitle: 'RoomTransform 3초 AI',
    roomDesc:
      '방 사진 한 장만 올리면 창문 위치와 방 크기는 그대로 유지한 채 부티크 호텔·미니멀 우드·북유럽 스타일로 3초 만에 재구성합니다.',
    roomMeta: '매일 1회 무료 미리보기',
    roomCta: '시뮬레이터 시작',
    roomMockSub: '창문 위치 · 방 비율 자동 고정',
    roomMockBadge: '4가지 스타일',
    signTag: '계약서·약관 리스크 AI',
    signPrice: '$14.90 / 5회 정밀 스캔',
    signTitle: 'ClauseGuard 3초 스캐너',
    signDesc:
      '프리랜서 계약서, 임대차 약관, NDA를 붙여넣으면 핵심 독소조항과 위험도 점수(0~100), 바로 복사해 쓰는 안전 수정 특약을 제시합니다.',
    signMeta: '매일 1회 핵심 조항 무료 공개',
    signCta: '스캐너 시작',
    signMockSub: '독소조항 3건 · 안전 특약 제안',
    signMockBadge: '고위험 감지',
    trustNote: '전 세계 카드 · Apple Pay · PayPal 안전 결제 (Paddle 공식 정산)',
    terms: '이용약관',
    privacy: '개인정보처리방침',
    refund: '환불정책',
  },
  ja: {
    badge: '登録不要 · 3秒で即座にAI結果を生成',
    heroTitle1: '3秒で完結する2つのAI。',
    heroTitle2: '月額サブスクは不要。',
    heroSub:
      '部屋の模様替えから契約書のリスク診断まで3秒で完了。毎日1回無料でお試しいただき、必要な分だけクレジットをご購入ください。',
    navRoom: 'インテリアAI',
    navSign: '契約書スキャナー',
    roomTag: '空間インテリアAI',
    roomPrice: '$10.90 / 10回 HD生成',
    roomTitle: 'RoomTransform 3秒AI',
    roomDesc:
      '部屋の写真をアップロードするだけ。窓の位置と部屋の広さを保ったまま、ブティックホテルや北欧スタイルに3秒で変換します。',
    roomMeta: '毎日1回無料プレビュー',
    roomCta: 'スタジオを開く',
    roomMockSub: '窓の位置・部屋比率を固定',
    roomMockBadge: '4スタイル',
    signTag: '契約書リスクAI',
    signPrice: '$14.90 / 5回精密診断',
    signTitle: 'ClauseGuard 3秒スキャナー',
    signDesc:
      '業務委託契約や賃貸契約、NDAを貼り付けると、不利な条項とリスクスコア(0〜100)、そのまま使える安全な修正案を提示します。',
    signMeta: '毎日1回 最重要条項を無料公開',
    signCta: '契約書をスキャン',
    signMockSub: '3件の危険条項・修正案を検出',
    signMockBadge: '高リスク',
    trustNote: 'Paddleによる安全なグローバル決済・税務処理',
    terms: '利用規約',
    privacy: 'プライバシーポリシー',
    refund: '返金ポリシー',
  },
  es: {
    badge: 'Sin registro · Resultados IA en 3 segundos',
    heroTitle1: 'Dos herramientas IA precisas.',
    heroTitle2: 'Cero suscripciones mensuales.',
    heroSub:
      'Rediseña espacios o detecta cláusulas abusivas en 3 segundos. Prueba gratis cada día y paga solo por los créditos que necesites.',
    navRoom: 'Interiores IA',
    navSign: 'Escáner Legal',
    roomTag: 'DISEÑO DE INTERIORES IA',
    roomPrice: '$10.90 / 10 Renders HD',
    roomTitle: 'RoomTransform 3s AI',
    roomDesc:
      'Sube una foto de tu habitación. Conserva ventanas y proporciones exactas mientras transformas muebles e iluminación en segundos.',
    roomMeta: '1 Vista previa gratis al día',
    roomCta: 'Iniciar Estudio',
    roomMockSub: 'Ventanas y dimensiones bloqueadas',
    roomMockBadge: '4 Estilos',
    signTag: 'ANÁLISIS DE CONTRATOS IA',
    signPrice: '$14.90 / 5 Auditorías',
    signTitle: 'ClauseGuard 3s Scanner',
    signDesc:
      'Pega contratos freelance, alquileres o NDA para detectar riesgos ocultos, puntuación de peligro (0–100) y cláusulas seguras.',
    signMeta: '1 Auditoría básica gratis al día',
    signCta: 'Escanear Contrato',
    signMockSub: '3 Cláusulas tóxicas y correcciones',
    signMockBadge: 'ALTO RIESGO',
    trustNote: 'Pagos globales seguros gestionados por Paddle.',
    terms: 'Términos de Servicio',
    privacy: 'Privacidad',
    refund: 'Política de Reembolso',
  },
  zh: {
    badge: '无需注册 · 3秒即时生成 AI 结果',
    heroTitle1: '两款专注的 3 秒 AI 工具。',
    heroTitle2: '零月度订阅负担。',
    heroSub:
      '3秒完成房间改造或合同风险审查。每天免费体验一次，仅在需要时按需购买专业积分。',
    navRoom: '室内设计 AI',
    navSign: '合同扫描器',
    roomTag: '空间室内设计 AI',
    roomPrice: '$10.90 / 10 次高清渲染',
    roomTitle: 'RoomTransform 3秒 AI',
    roomDesc:
      '上传房间照片，精准保留窗户位置与空间比例，3秒切换精品酒店、原木极简或北欧风格。',
    roomMeta: '每日 1 次免费预览',
    roomCta: '打开工作室',
    roomMockSub: '自动锁定窗户位置与空间比例',
    roomMockBadge: '4 种风格',
    signTag: '合同风险审查 AI',
    signPrice: '$14.90 / 5 次完整审查',
    signTitle: 'ClauseGuard 3秒扫描器',
    signDesc:
      '粘贴自由职业合同、租约或保密协议，即刻识别霸王条款、生成 0–100 风险评分并提供安全替代条款。',
    signMeta: '每日 1 次核心条款免费查看',
    signCta: '扫描合同',
    signMockSub: '3 项高危条款及安全修改建议',
    signMockBadge: '高风险',
    trustNote: '由 Paddle 提供全球安全收款与税务合规支持。',
    terms: '服务条款',
    privacy: '隐私政策',
    refund: '退款政策',
  },
};

export default function HookAIHomePage() {
  const { locale } = useLanguage();
  const t = LANDING_COPY[locale];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      {/* Subtle Top Ambient Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-zinc-200/50 via-transparent to-transparent" />

      {/* Minimal Glass Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              H
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-950">
              HookAI <span className="font-medium text-zinc-400">Studio</span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-500">
              <Link
                href="/interior"
                suppressHydrationWarning
                className="hover:text-zinc-950 transition-colors"
              >
                {t.navRoom}
              </Link>
              <Link
                href="/contract"
                suppressHydrationWarning
                className="hover:text-zinc-950 transition-colors"
              >
                {t.navSign}
              </Link>
            </nav>

            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 pt-16 pb-20">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/80 shadow-2xs text-xs font-semibold text-zinc-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 leading-[1.15] mb-5 break-keep">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 leading-relaxed break-keep">
            {locale === 'ko' ? (
              <>
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xl sm:text-2xl tracking-tight">
                  방 사진 인테리어
                </span>{' '}
                변환부터{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xl sm:text-2xl tracking-tight">
                  계약서
                </span>{' '}
                독소조항 분석까지.
                <br className="hidden sm:inline" /> 매일 1회 무료로 먼저 경험하고, 필요한 만큼만 크레딧을 충전하세요.
              </>
            ) : locale === 'ja' ? (
              <>
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xl sm:text-2xl tracking-tight">
                  部屋の模様替え
                </span>{' '}
                から{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xl sm:text-2xl tracking-tight">
                  契約書リスク診断
                </span>{' '}
                まで3秒で完了。毎日1回無料でお試しいただけます。
              </>
            ) : locale === 'es' ? (
              <>
                Desde{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xl sm:text-2xl tracking-tight">
                  Diseño de Interiores
                </span>{' '}
                hasta{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xl sm:text-2xl tracking-tight">
                  Contratos Legales
                </span>{' '}
                en 3 segundos. Prueba gratis cada día.
              </>
            ) : locale === 'zh' ? (
              <>
                3秒完成{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xl sm:text-2xl tracking-tight">
                  房间室内改造
                </span>{' '}
                与{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xl sm:text-2xl tracking-tight">
                  合同风险审查
                </span>
                。每天免费体验一次，按需购买积分。
              </>
            ) : (
              <>
                From{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xl sm:text-2xl tracking-tight">
                  Room Interior AI
                </span>{' '}
                to{' '}
                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-black text-xl sm:text-2xl tracking-tight">
                  Contract Risk Scan
                </span>{' '}
                in 3 seconds. Try once free every day.
              </>
            )}
          </p>
        </section>

        {/* Two Bento Product Cards */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Card 1: RoomTransform 3s AI */}
          <Link
            href="/interior"
            suppressHydrationWarning
            className="group relative bg-white rounded-3xl border border-zinc-200/90 p-7 shadow-xs hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Visual Preview Mockup */}
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-zinc-100 border border-emerald-100/80 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-emerald-100 flex items-center justify-center text-lg">
                    🛋️
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-700 tracking-wide">
                      BEFORE → AFTER · 3.2s
                    </div>
                    <div className="text-xs font-medium text-zinc-600">
                      {t.roomMockSub}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-zinc-700 border border-zinc-200/60 shrink-0">
                  {t.roomMockBadge}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">
                  {t.roomTag}
                </span>
                <span className="text-xs font-semibold text-zinc-400">{t.roomPrice}</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 mb-3 group-hover:text-emerald-700 transition-colors">
                {t.roomTitle}
              </h2>

              <p className="text-sm text-zinc-500 leading-relaxed mb-8 break-keep">
                {t.roomDesc}
              </p>
            </div>

            <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{t.roomMeta}</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold group-hover:bg-emerald-600 transition-colors">
                {t.roomCta}
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </div>
          </Link>

          {/* Card 2: ClauseGuard 3s Scanner */}
          <Link
            href="/contract"
            suppressHydrationWarning
            className="group relative bg-white rounded-3xl border border-zinc-200/90 p-7 shadow-xs hover:shadow-xl hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Visual Preview Mockup */}
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50/60 to-zinc-100 border border-indigo-100/80 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-indigo-100 flex items-center justify-center text-lg">
                    🛡️
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-700 tracking-wide">
                      RISK SCORE · 84 / 100
                    </div>
                    <div className="text-xs font-medium text-zinc-600">
                      {t.signMockSub}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[11px] font-bold text-rose-600 border border-rose-200/60 shrink-0">
                  {t.signMockBadge}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600">
                  {t.signTag}
                </span>
                <span className="text-xs font-semibold text-zinc-400">{t.signPrice}</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 mb-3 group-hover:text-indigo-700 transition-colors">
                {t.signTitle}
              </h2>

              <p className="text-sm text-zinc-500 leading-relaxed mb-8 break-keep">
                {t.signDesc}
              </p>
            </div>

            <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{t.signMeta}</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold group-hover:bg-indigo-600 transition-colors">
                {t.signCta}
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </div>
          </Link>
        </section>
      </main>

      {/* Clean Footer with Mandatory Paddle Legal Links */}
      <footer className="border-t border-zinc-200/80 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="font-semibold text-zinc-700">© {new Date().getFullYear()} HookAI Studio</span>
            <span className="hidden sm:inline">·</span>
            <span>{t.trustNote}</span>
          </div>

          <div className="flex items-center gap-5 font-medium text-zinc-500">
            <Link href="/legal/terms" className="hover:text-zinc-900 transition-colors">
              {t.terms}
            </Link>
            <Link href="/legal/privacy" className="hover:text-zinc-900 transition-colors">
              {t.privacy}
            </Link>
            <Link href="/legal/refund" className="hover:text-zinc-900 transition-colors">
              {t.refund}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
