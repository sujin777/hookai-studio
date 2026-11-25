export type Locale = 'en' | 'ko' | 'ja' | 'es' | 'zh';

export const SUPPORTED_LOCALES: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'EN · English' },
  { code: 'ko', label: 'KO · 한국어' },
  { code: 'ja', label: 'JA · 日本語' },
  { code: 'es', label: 'ES · Español' },
  { code: 'zh', label: 'ZH · 中文' },
];

export function detectLocale(input?: string | null): Locale {
  if (!input) return 'en';
  const lower = input.toLowerCase();
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('zh')) return 'zh';
  return 'en';
}

export function getPaddleLocale(locale: Locale): string {
  switch (locale) {
    case 'ko':
      return 'ko';
    case 'ja':
      return 'ja';
    case 'es':
      return 'es';
    case 'zh':
      return 'zh-Hans';
    default:
      return 'en';
  }
}

export function getAiLanguageName(locale: Locale): string {
  switch (locale) {
    case 'ko':
      return 'Korean';
    case 'ja':
      return 'Japanese';
    case 'es':
      return 'Spanish';
    case 'zh':
      return 'Simplified Chinese';
    default:
      return 'English';
  }
}

export interface TranslationDict {
  brandName: string;
  brandBadge: string;
  navInterior: string;
  navContract: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  card1Tag: string;
  card1Price: string;
  card1Title: string;
  card1Desc: string;
  card1Free: string;
  card1Cta: string;
  card2Tag: string;
  card2Price: string;
  card2Title: string;
  card2Desc: string;
  card2Free: string;
  card2Cta: string;
  footerText: string;
  // PaddleBar
  backToHub: string;
  proCreditsActive: string;
  restorePurchase: string;
  unlockProPack: string;
  enterPurchaseEmail: string;
  sendRestoreLink: string;
  checking: string;
  checkingAccountMsg: string;
  restoreSuccessFallback: string;
  restoreFailed: string;
  networkErrorRecover: string;
  paddleNotConfigured: string;
  paddleLoading: string;
  // Interior
  interiorAppName: string;
  interiorPriceLabel: string;
  interiorStep1Title: string;
  interiorStep1Desc: string;
  interiorStep2Title: string;
  interiorTransformBtn: string;
  interiorTransformingBtn: string;
  interiorUploadFirst: string;
  interiorResultTitle: string;
  interiorFreePreviewBadge: string;
  interiorDownloadHd: string;
  interiorWatermarkText: string;
  interiorNetworkError: string;
  interiorStyles: Array<{ id: string; label: string }>;
  // Contract
  contractAppName: string;
  contractPriceLabel: string;
  contractTitle: string;
  contractLoadSample: string;
  contractSampleText: string;
  contractPlaceholder: string;
  contractScanBtn: string;
  contractScanningBtn: string;
  contractPasteFirst: string;
  contractRiskScoreLabel: string;
  contractRiskBadge: string;
  contractSafeCounterLabel: string;
  contractLockedBanner: string;
  contractUnlockAll: string;
  contractNetworkError: string;
}

export const TRANSLATIONS: Record<Locale, TranslationDict> = {
  en: {
    brandName: 'HookAI Studio',
    brandBadge: '3s AI Micro-Hub',
    navInterior: 'RoomTransform',
    navContract: 'ClauseGuard',
    heroEyebrow: '1 Free Daily Preview per IP · Instant Pro Packs',
    heroTitle: 'Two 3-Second AI Utilities. Zero Subscription Bloat.',
    heroSubtitle:
      'Try each tool free once a day per IP, or unlock pay-as-you-go Pro Credits via Paddle overlay checkout.',
    card1Tag: '#1 Priority · Interior AI',
    card1Price: '$10.90 / 10 Renders',
    card1Title: 'RoomTransform 3s AI',
    card1Desc:
      'Upload any room photo and restyle it into Boutique Hotel, Minimalist Wood, Scandinavian, or Industrial Loft while preserving your exact window placement and room proportions.',
    card1Free: 'Free: 1 Watermarked Preview / Day',
    card1Cta: 'Launch Simulator →',
    card2Tag: '#2 Priority · Legal AI',
    card2Price: '$14.90 / 5 Audits',
    card2Title: 'ClauseGuard 3s Scanner',
    card2Desc:
      'Paste any freelance contract, lease, or NDA to detect the top toxic clauses, get a 0–100 risk score, and copy-paste safe counter-clauses immediately.',
    card2Free: 'Free: Top 1 Risky Clause / Day',
    card2Cta: 'Launch Scanner →',
    footerText:
      'HookAI Studio · Protected by IP-hashed daily free gate & Supabase atomic credit consumption',
    backToHub: '← HookAI Studio',
    proCreditsActive: 'Pro Credits Active',
    restorePurchase: 'Restore Purchase',
    unlockProPack: 'Unlock Pro Pack',
    enterPurchaseEmail: 'Enter purchase email:',
    sendRestoreLink: 'Send Restore Link',
    checking: 'Checking...',
    checkingAccountMsg: 'Checking account & sending restore link...',
    restoreSuccessFallback: 'Check your inbox! Click the link to restore credits.',
    restoreFailed: 'Failed to send link.',
    networkErrorRecover: 'Network error while checking purchase.',
    paddleNotConfigured:
      'Paddle client token is not configured yet. Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in .env.local to enable live/sandbox checkout.',
    paddleLoading: 'Payment module is loading. Please try again in 2 seconds.',
    interiorAppName: 'RoomTransform 3s AI',
    interiorPriceLabel: '$10.90 / 10 Renders',
    interiorStep1Title: '1. Upload Your Room Photo',
    interiorStep1Desc: 'We preserve your exact window position and room dimensions.',
    interiorStep2Title: '2. Choose Interior Style',
    interiorTransformBtn: '3. Transform Room Now',
    interiorTransformingBtn: 'Redesigning Room (3~5s)...',
    interiorUploadFirst: 'Please upload a room photo first.',
    interiorResultTitle: 'Redesigned Result',
    interiorFreePreviewBadge: 'Free Preview Mode — Unlock HD Pack to remove watermark',
    interiorDownloadHd: 'Download HD Image',
    interiorWatermarkText: 'PREVIEW · HOOKAI STUDIO',
    interiorNetworkError: 'Network error while transforming room.',
    interiorStyles: [
      { id: 'Modern Boutique Hotel', label: 'Modern Boutique Hotel' },
      { id: 'Warm Minimalist Wood', label: 'Warm Minimalist Wood' },
      { id: 'Scandinavian Cozy Studio', label: 'Scandinavian Cozy Studio' },
      { id: 'Industrial Loft', label: 'Industrial Loft' },
    ],
    contractAppName: 'ClauseGuard 3s Scanner',
    contractPriceLabel: '$14.90 / 5 Audits',
    contractTitle: 'Paste Contract or Clause',
    contractLoadSample: 'Load Risky Sample Clause',
    contractSampleText:
      '14. INTELLECTUAL PROPERTY & LIABILITY: Contractor hereby assigns all pre-existing and future worldwide intellectual property rights to Client without additional compensation. Contractor shall indemnify Client for any indirect, consequential, or punitive damages up to 500% of total fees paid, and Client may terminate this agreement at any time without notice or payment for work in progress.',
    contractPlaceholder: 'Paste freelance agreement, lease terms, or NDA clauses here...',
    contractScanBtn: 'Scan Toxic Clauses Now',
    contractScanningBtn: 'Scanning for Hidden Traps (3s)...',
    contractPasteFirst: 'Please paste your contract clauses first.',
    contractRiskScoreLabel: 'OVERALL CONTRACT RISK SCORE',
    contractRiskBadge: 'RISK',
    contractSafeCounterLabel: 'Safe Counter-Clause:',
    contractLockedBanner: 'more toxic clauses & redlines detected',
    contractUnlockAll: 'Unlock All ($14.90)',
    contractNetworkError: 'Network error while scanning contract.',
  },
  ko: {
    brandName: 'HookAI Studio',
    brandBadge: '3초 AI 마이크로 허브',
    navInterior: '인테리어 변환',
    navContract: '계약서 스캐너',
    heroEyebrow: 'IP당 하루 1회 무료 맛보기 · 필요한 만큼만 결제',
    heroTitle: '3초 만에 끝내는 두 가지 AI 도구. 구독료 부담 제로.',
    heroSubtitle:
      'IP당 하루 1회 무료로 체험하고, 필요할 때만 Paddle 오버레이 결제로 프로 크레딧을 충전하세요.',
    card1Tag: '1순위 · 인테리어 AI',
    card1Price: '$10.90 / 10회 렌더링',
    card1Title: 'RoomTransform 3초 AI',
    card1Desc:
      '방 사진을 올리면 창문 위치와 방 크기는 그대로 유지한 채 부티크 호텔, 미니멀 우드, 북유럽, 인더스트리얼 스타일로 3초 만에 재구성합니다.',
    card1Free: '무료: 하루 1회 워터마크 미리보기',
    card1Cta: '시뮬레이터 시작 →',
    card2Tag: '2순위 · 법률/계약 AI',
    card2Price: '$14.90 / 5회 정밀 스캔',
    card2Title: 'ClauseGuard 3초 스캐너',
    card2Desc:
      '프리랜서 계약서, 임대차 약관, NDA를 붙여넣으면 핵심 독소조항과 위험도 점수(0~100), 바로 복사해 쓸 수 있는 안전 수정 특약을 제시합니다.',
    card2Free: '무료: 하루 1회 핵심 조항 1건 공개',
    card2Cta: '스캐너 시작 →',
    footerText: 'HookAI Studio · IP 해시 일일 무료 제한 및 Supabase 원자적 크레딧 차감 적용',
    backToHub: '← HookAI Studio',
    proCreditsActive: '프로 크레딧 보유',
    restorePurchase: '구매 내역 복구',
    unlockProPack: '프로 팩 잠금 해제',
    enterPurchaseEmail: '결제한 이메일 입력:',
    sendRestoreLink: '복구 링크 받기',
    checking: '확인 중...',
    checkingAccountMsg: '계정 확인 및 복구 링크 전송 중...',
    restoreSuccessFallback: '이메일함을 확인하세요! 링크를 클릭하면 크레딧이 복구됩니다.',
    restoreFailed: '복구 링크 전송에 실패했습니다.',
    networkErrorRecover: '구매 내역 확인 중 네트워크 오류가 발생했습니다.',
    paddleNotConfigured:
      'Paddle 클라이언트 토큰이 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_PADDLE_CLIENT_TOKEN을 입력해 주세요.',
    paddleLoading: '결제 모듈을 불러오는 중입니다. 2초 후 다시 시도해 주세요.',
    interiorAppName: 'RoomTransform 3초 AI',
    interiorPriceLabel: '$10.90 / 10회',
    interiorStep1Title: '1. 방 사진 업로드',
    interiorStep1Desc: '기존 창문 위치와 방 비율을 그대로 보존하여 인테리어를 바꿉니다.',
    interiorStep2Title: '2. 인테리어 스타일 선택',
    interiorTransformBtn: '3. 지금 바로 방 변환하기',
    interiorTransformingBtn: 'AI가 인테리어를 재구성 중입니다 (3~5초)...',
    interiorUploadFirst: '먼저 방 사진을 업로드해 주세요.',
    interiorResultTitle: '변환 결과',
    interiorFreePreviewBadge: '무료 맛보기 모드 — 워터마크 제거는 HD 팩을 잠금 해제하세요',
    interiorDownloadHd: '고화질 원본 다운로드',
    interiorWatermarkText: '미리보기 · HOOKAI STUDIO',
    interiorNetworkError: '방 변환 중 네트워크 오류가 발생했습니다.',
    interiorStyles: [
      { id: 'Modern Boutique Hotel', label: '모던 부티크 호텔' },
      { id: 'Warm Minimalist Wood', label: '웜 미니멀 우드' },
      { id: 'Scandinavian Cozy Studio', label: '북유럽 코지 스튜디오' },
      { id: 'Industrial Loft', label: '인더스트리얼 로프트' },
    ],
    contractAppName: 'ClauseGuard 3초 스캐너',
    contractPriceLabel: '$14.90 / 5회',
    contractTitle: '계약서 또는 조항 붙여넣기',
    contractLoadSample: '위험 샘플 조항 불러오기',
    contractSampleText:
      '제14조(지식재산권 및 손해배상): 수급인은 기존 및 향후 전 세계에서 발생하는 모든 지식재산권을 추가 보상 없이 발주자에게 양도한다. 수급인은 간접·결과적·징벌적 손해에 대해 총 대금의 500%까지 배상하며, 발주자는 진행 중인 작업에 대한 대가 지급이나 사전 통지 없이 언제든지 본 계약을 해지할 수 있다.',
    contractPlaceholder: '프리랜서 계약서, 임대차 특약, 비밀유지계약(NDA) 문구를 붙여넣으세요...',
    contractScanBtn: '독소조항 3초 스캔하기',
    contractScanningBtn: '숨겨진 독소조항 분석 중 (3초)...',
    contractPasteFirst: '먼저 계약서 조항을 붙여넣어 주세요.',
    contractRiskScoreLabel: '계약서 종합 위험도 점수',
    contractRiskBadge: '위험',
    contractSafeCounterLabel: '안전한 수정 특약:',
    contractLockedBanner: '개의 추가 독소조항 및 수정안이 감지되었습니다',
    contractUnlockAll: '전체 잠금 해제 ($14.90)',
    contractNetworkError: '계약서 스캔 중 네트워크 오류가 발생했습니다.',
  },
  ja: {
    brandName: 'HookAI Studio',
    brandBadge: '3秒AIマイクロハブ',
    navInterior: 'インテリア変換',
    navContract: '契約書スキャナー',
    heroEyebrow: 'IPあたり1日1回無料プレビュー · 必要な分だけ購入',
    heroTitle: '3秒で完結する2つのAIツール。サブスク不要。',
    heroSubtitle:
      'IPごとに毎日1回無料でお試しいただけます。高画質・全文解析が必要な時はPaddle決済でプロクレジットを追加できます。',
    card1Tag: '第1位 · インテリアAI',
    card1Price: '$10.90 / 10回生成',
    card1Title: 'RoomTransform 3秒AI',
    card1Desc:
      '部屋の写真をアップロードするだけで、窓の位置や部屋の広さを保ったままブティックホテルや北欧風など4つのスタイルに3秒で模様替えします。',
    card1Free: '無料: 1日1回透かし入りプレビュー',
    card1Cta: 'シミュレーターを開く →',
    card2Tag: '第2位 · 法務・契約AI',
    card2Price: '$14.90 / 5回診断',
    card2Title: 'ClauseGuard 3秒スキャナー',
    card2Desc:
      '業務委託契約書や賃貸借契約、NDAを貼り付けると、不利な条項・リスクスコア(0〜100)・そのまま使える安全な修正案を即座に提示します。',
    card2Free: '無料: 1日1回 最重要条項1件を表示',
    card2Cta: 'スキャナーを開く →',
    footerText: 'HookAI Studio · IPハッシュ日次制限＆Supabaseクレジット管理で保護',
    backToHub: '← HookAI Studio',
    proCreditsActive: 'プロクレジット残高',
    restorePurchase: '購入を復元',
    unlockProPack: 'プロパック解除',
    enterPurchaseEmail: '購入時のメールアドレス:',
    sendRestoreLink: '復元リンクを送信',
    checking: '確認中...',
    checkingAccountMsg: 'アカウント確認・復元リンク送信中...',
    restoreSuccessFallback: '受信トレイをご確認ください。リンクをクリックすると復元されます。',
    restoreFailed: 'リンク送信に失敗しました。',
    networkErrorRecover: '購入履歴の確認中に通信エラーが発生しました。',
    paddleNotConfigured:
      'Paddleクライアントトークンが未設定です。.env.localにNEXT_PUBLIC_PADDLE_CLIENT_TOKENを設定してください。',
    paddleLoading: '決済モジュールを読み込み中です。2秒後にもう一度お試しください。',
    interiorAppName: 'RoomTransform 3秒AI',
    interiorPriceLabel: '$10.90 / 10回',
    interiorStep1Title: '1. 部屋の写真をアップロード',
    interiorStep1Desc: '既存の窓の位置と部屋の比率を正確に維持します。',
    interiorStep2Title: '2. インテリアスタイルを選択',
    interiorTransformBtn: '3. 今すぐ部屋を変換する',
    interiorTransformingBtn: '部屋を再デザイン中 (3〜5秒)...',
    interiorUploadFirst: '先に部屋の写真をアップロードしてください。',
    interiorResultTitle: '変換結果',
    interiorFreePreviewBadge: '無料プレビュー — 透かし解除にはHDパックをご購入ください',
    interiorDownloadHd: '高画質画像をダウンロード',
    interiorWatermarkText: 'プレビュー · HOOKAI STUDIO',
    interiorNetworkError: '部屋の変換中に通信エラーが発生しました。',
    interiorStyles: [
      { id: 'Modern Boutique Hotel', label: 'モダン・ブティックホテル' },
      { id: 'Warm Minimalist Wood', label: 'ウォーム・ミニマルウッド' },
      { id: 'Scandinavian Cozy Studio', label: '北欧コージースタジオ' },
      { id: 'Industrial Loft', label: 'インダストリアルロフト' },
    ],
    contractAppName: 'ClauseGuard 3秒スキャナー',
    contractPriceLabel: '$14.90 / 5回',
    contractTitle: '契約書または条項を貼り付け',
    contractLoadSample: '危険なサンプル条項を読み込む',
    contractSampleText:
      '第14条（知的財産権および損害賠償）：受託者は、既存および将来の全世界における一切の知的財産権を追加報酬なく委託者に譲渡する。受託者は間接損害・懲罰的損害を含め報酬総額の500%まで賠償責任を負い、委託者は事前通知および仕掛品への支払いなくいつでも本契約を解除できる。',
    contractPlaceholder: '業務委託契約、賃貸契約、NDAの条文をここに貼り付けてください...',
    contractScanBtn: '不利な条項を今すぐスキャン',
    contractScanningBtn: 'リスク条項を解析中 (3秒)...',
    contractPasteFirst: '先に契約書の条文を貼り付けてください。',
    contractRiskScoreLabel: '契約書総合リスクスコア',
    contractRiskBadge: 'リスク',
    contractSafeCounterLabel: '安全な修正条項案:',
    contractLockedBanner: '件の追加リスク条項と修正案が検出されました',
    contractUnlockAll: 'すべて解除 ($14.90)',
    contractNetworkError: '契約書スキャン中に通信エラーが発生しました。',
  },
  es: {
    brandName: 'HookAI Studio',
    brandBadge: 'Micro-Hub IA en 3s',
    navInterior: 'RoomTransform',
    navContract: 'ClauseGuard',
    heroEyebrow: '1 Vista Previa Gratis al Día por IP · Packs Pro al Instante',
    heroTitle: 'Dos Utilidades IA de 3 Segundos. Cero Suscripciones.',
    heroSubtitle:
      'Prueba cada herramienta gratis una vez al día por IP o desbloquea créditos Pro bajo demanda con Paddle.',
    card1Tag: '#1 Prioridad · IA de Interiores',
    card1Price: '$10.90 / 10 Diseños',
    card1Title: 'RoomTransform 3s IA',
    card1Desc:
      'Sube cualquier foto de tu habitación y rediséñala en estilo Hotel Boutique, Minimalista, Escandinavo o Loft Industrial conservando tus ventanas y dimensiones.',
    card1Free: 'Gratis: 1 Vista con Marca de Agua / Día',
    card1Cta: 'Abrir Simulador →',
    card2Tag: '#2 Prioridad · IA Legal',
    card2Price: '$14.90 / 5 Auditorías',
    card2Title: 'ClauseGuard Escáner 3s',
    card2Desc:
      'Pega contratos freelance, alquileres o NDA para detectar cláusulas abusivas, obtener una puntuación de riesgo (0–100) y copiar contracláusulas seguras.',
    card2Free: 'Gratis: 1 Cláusula Crítica / Día',
    card2Cta: 'Abrir Escáner →',
    footerText:
      'HookAI Studio · Protegido por límite diario por IP y consumo atómico en Supabase',
    backToHub: '← HookAI Studio',
    proCreditsActive: 'Créditos Pro Activos',
    restorePurchase: 'Restaurar Compra',
    unlockProPack: 'Desbloquear Pack Pro',
    enterPurchaseEmail: 'Ingresa tu correo de compra:',
    sendRestoreLink: 'Enviar Enlace',
    checking: 'Verificando...',
    checkingAccountMsg: 'Verificando cuenta y enviando enlace...',
    restoreSuccessFallback: '¡Revisa tu correo! Haz clic en el enlace para restaurar créditos.',
    restoreFailed: 'No se pudo enviar el enlace.',
    networkErrorRecover: 'Error de red al verificar la compra.',
    paddleNotConfigured:
      'El token de Paddle aún no está configurado. Agrega NEXT_PUBLIC_PADDLE_CLIENT_TOKEN en .env.local.',
    paddleLoading: 'El módulo de pago se está cargando. Inténtalo en 2 segundos.',
    interiorAppName: 'RoomTransform 3s IA',
    interiorPriceLabel: '$10.90 / 10 Diseños',
    interiorStep1Title: '1. Sube la Foto de tu Habitación',
    interiorStep1Desc: 'Conservamos exactamente la posición de tus ventanas y proporciones.',
    interiorStep2Title: '2. Elige el Estilo Interior',
    interiorTransformBtn: '3. Transformar Habitación Ahora',
    interiorTransformingBtn: 'Rediseñando habitación (3~5s)...',
    interiorUploadFirst: 'Por favor sube primero una foto de la habitación.',
    interiorResultTitle: 'Resultado Rediseñado',
    interiorFreePreviewBadge: 'Modo Vista Previa — Desbloquea el Pack HD para quitar la marca',
    interiorDownloadHd: 'Descargar Imagen HD',
    interiorWatermarkText: 'VISTA PREVIA · HOOKAI STUDIO',
    interiorNetworkError: 'Error de red al transformar la habitación.',
    interiorStyles: [
      { id: 'Modern Boutique Hotel', label: 'Hotel Boutique Moderno' },
      { id: 'Warm Minimalist Wood', label: 'Madera Minimalista Cálida' },
      { id: 'Scandinavian Cozy Studio', label: 'Estudio Escandinavo' },
      { id: 'Industrial Loft', label: 'Loft Industrial' },
    ],
    contractAppName: 'ClauseGuard Escáner 3s',
    contractPriceLabel: '$14.90 / 5 Auditorías',
    contractTitle: 'Pega el Contrato o Cláusula',
    contractLoadSample: 'Cargar Cláusula de Riesgo',
    contractSampleText:
      '14. PROPIEDAD INTELECTUAL Y RESPONSABILIDAD: El Contratista cede todos los derechos de propiedad intelectual pasados y futuros al Cliente sin compensación adicional. El Contratista indemnizará al Cliente por daños indirectos o punitivos hasta el 500% de los honorarios pagados, y el Cliente podrá rescindir este acuerdo en cualquier momento sin aviso ni pago por trabajo en curso.',
    contractPlaceholder: 'Pega aquí tu contrato freelance, arrendamiento o cláusulas NDA...',
    contractScanBtn: 'Escanear Cláusulas Abusivas',
    contractScanningBtn: 'Analizando riesgos ocultos (3s)...',
    contractPasteFirst: 'Por favor pega primero el texto del contrato.',
    contractRiskScoreLabel: 'PUNTUACIÓN GENERAL DE RIESGO',
    contractRiskBadge: 'RIESGO',
    contractSafeCounterLabel: 'Contracláusula Segura:',
    contractLockedBanner: 'cláusulas abusivas y correcciones adicionales detectadas',
    contractUnlockAll: 'Desbloquear Todo ($14.90)',
    contractNetworkError: 'Error de red al escanear el contrato.',
  },
  zh: {
    brandName: 'HookAI Studio',
    brandBadge: '3秒 AI 微工具中心',
    navInterior: '室内设计改造',
    navContract: '合同风险扫描',
    heroEyebrow: '每个 IP 每日免费体验 1 次 · 按需购买专业积分',
    heroTitle: '两款 3 秒 AI 实用工具，告别繁琐订阅。',
    heroSubtitle:
      '每个 IP 每天可免费体验一次，需要高清原图或完整报告时可通过 Paddle 弹窗按需购买积分。',
    card1Tag: '第 1 顺位 · 室内设计 AI',
    card1Price: '$10.90 / 10 次生成',
    card1Title: 'RoomTransform 3秒 AI',
    card1Desc:
      '上传任意房间照片，在严格保留窗户位置与房间比例的前提下，3 秒重塑为精品酒店、原木极简、北欧风或工业风。',
    card1Free: '免费：每日 1 次带水印预览',
    card1Cta: '启动模拟器 →',
    card2Tag: '第 2 顺位 · 合同法务 AI',
    card2Price: '$14.90 / 5 次审查',
    card2Title: 'ClauseGuard 3秒扫描器',
    card2Desc:
      '粘贴自由职业合同、租约或保密协议，即刻识别霸王条款、生成 0–100 风险评分并提供可直接复制的安全替代条款。',
    card2Free: '免费：每日展示 1 条核心高危条款',
    card2Cta: '启动扫描器 →',
    footerText: 'HookAI Studio · 基于 IP 哈希每日限额与 Supabase 原子扣费保护',
    backToHub: '← HookAI Studio',
    proCreditsActive: '专业积分可用',
    restorePurchase: '找回购买记录',
    unlockProPack: '解锁专业包',
    enterPurchaseEmail: '输入购买邮箱:',
    sendRestoreLink: '发送恢复链接',
    checking: '查询中...',
    checkingAccountMsg: '正在核对账户并发送恢复链接...',
    restoreSuccessFallback: '请查收邮件！点击链接即可恢复您的积分。',
    restoreFailed: '发送链接失败。',
    networkErrorRecover: '查询购买记录时发生网络错误。',
    paddleNotConfigured:
      '尚未配置 Paddle 客户端令牌。请在 .env.local 中添加 NEXT_PUBLIC_PADDLE_CLIENT_TOKEN。',
    paddleLoading: '支付模块正在加载，请 2 秒后重试。',
    interiorAppName: 'RoomTransform 3秒 AI',
    interiorPriceLabel: '$10.90 / 10 次',
    interiorStep1Title: '1. 上传房间照片',
    interiorStep1Desc: '我们将严格保留您原有的窗户位置与房间尺寸比例。',
    interiorStep2Title: '2. 选择室内设计风格',
    interiorTransformBtn: '3. 立即转换房间风格',
    interiorTransformingBtn: '正在重绘房间设计 (3~5秒)...',
    interiorUploadFirst: '请先上传一张房间照片。',
    interiorResultTitle: '设计效果图',
    interiorFreePreviewBadge: '免费预览模式 — 购买高清包即可去除水印',
    interiorDownloadHd: '下载高清原图',
    interiorWatermarkText: '预览 · HOOKAI STUDIO',
    interiorNetworkError: '转换房间时发生网络错误。',
    interiorStyles: [
      { id: 'Modern Boutique Hotel', label: '现代精品酒店' },
      { id: 'Warm Minimalist Wood', label: '温暖极简原木' },
      { id: 'Scandinavian Cozy Studio', label: '北欧温馨工作室' },
      { id: 'Industrial Loft', label: '工业风 Loft' },
    ],
    contractAppName: 'ClauseGuard 3秒扫描器',
    contractPriceLabel: '$14.90 / 5 次',
    contractTitle: '粘贴合同或条款文本',
    contractLoadSample: '加载高风险示例条款',
    contractSampleText:
      '第14条 知识产权与赔偿责任：承包方特此将全球范围内所有现有及未来的知识产权无偿转让给客户，且不另行支付报酬。承包方应就任何间接、附带或惩罚性损害向客户作出最高达已付总费用 500% 的赔偿，且客户可随时终止本协议，无需提前通知或支付进行中工作的报酬。',
    contractPlaceholder: '在此粘贴自由职业协议、租赁条款或保密协议内容...',
    contractScanBtn: '立即扫描霸王条款',
    contractScanningBtn: '正在深度扫描隐藏陷阱 (3秒)...',
    contractPasteFirst: '请先粘贴合同条款内容。',
    contractRiskScoreLabel: '合同综合风险评分',
    contractRiskBadge: '风险',
    contractSafeCounterLabel: '安全替代条款：',
    contractLockedBanner: '条额外高危条款及修改建议已隐藏',
    contractUnlockAll: '解锁全部 ($14.90)',
    contractNetworkError: '扫描合同时发生网络错误。',
  },
};

export function getApiMessages(locale: Locale) {
  switch (locale) {
    case 'ko':
      return {
        imageRequired: '방 이미지를 업로드해 주세요.',
        geminiMissing: '.env.local에 GEMINI_API_KEY가 설정되지 않았습니다.',
        interiorLimit: '일일 무료 체험 횟수를 초과했습니다. HD 팩($10.90 / 10회)을 잠금 해제하세요.',
        layoutNote: '창문 위치와 방 비율이 그대로 보존되었습니다.',
        contractTooShort: '최소 20자 이상의 계약서 텍스트를 입력해 주세요.',
        contractLimit: '일일 무료 스캔 횟수를 초과했습니다. ClauseGuard 프로 팩($14.90 / 5회)을 잠금 해제하세요.',
      };
    case 'ja':
      return {
        imageRequired: '部屋の画像をアップロードしてください。',
        geminiMissing: '.env.localにGEMINI_API_KEYが設定されていません。',
        interiorLimit: '本日の無料プレビュー上限に達しました。HDパック($10.90 / 10回)をご購入ください。',
        layoutNote: '窓の位置と部屋の比率がそのまま保持されました。',
        contractTooShort: '20文字以上の契約書テキストを貼り付けてください。',
        contractLimit: '本日の無料診断上限に達しました。ClauseGuardプロパック($14.90 / 5回)をご購入ください。',
      };
    case 'es':
      return {
        imageRequired: 'Se requiere una foto de la habitación.',
        geminiMissing: 'GEMINI_API_KEY no está configurada en .env.local.',
        interiorLimit: 'Límite diario gratuito alcanzado. Desbloquea el Pack HD ($10.90 / 10 diseños).',
        layoutNote: 'Ubicación de ventanas y proporciones conservadas.',
        contractTooShort: 'Pega al menos 20 caracteres del texto del contrato.',
        contractLimit: 'Límite diario gratuito alcanzado. Desbloquea ClauseGuard Pro ($14.90 / 5 auditorías).',
      };
    case 'zh':
      return {
        imageRequired: '请上传房间照片。',
        geminiMissing: '.env.local 中尚未配置 GEMINI_API_KEY。',
        interiorLimit: '今日免费预览次数已用完，请解锁高清包 ($10.90 / 10次)。',
        layoutNote: '已完整保留窗户位置与房间比例。',
        contractTooShort: '请粘贴至少 20 个字符的合同文本。',
        contractLimit: '今日免费审查次数已用完，请解锁专业包 ($14.90 / 5次)。',
      };
    default:
      return {
        imageRequired: 'Room image is required.',
        geminiMissing: 'GEMINI_API_KEY is not configured in .env.local.',
        interiorLimit: 'Daily free preview limit reached. Unlock the HD Pack ($10.90) for 10 full renders.',
        layoutNote: 'Window placement and room proportions preserved.',
        contractTooShort: 'Please paste at least 20 characters of contract text.',
        contractLimit: 'Daily free audit limit reached. Unlock ClauseGuard Pro Pack ($14.90) for 5 full contract audits.',
      };
  }
}
