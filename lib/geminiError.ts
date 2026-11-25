import { Locale } from '@/lib/i18n';

export function parseGeminiError(
  err: unknown,
  locale: Locale
): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();

  if (
    lower.includes('prepayment credits are depleted') ||
    lower.includes('"code":402')
  ) {
    switch (locale) {
      case 'ko':
        return {
          status: 503,
          message:
            'Gemini API 선불 크레딧이 모두 소진되었습니다. Google AI Studio (https://ai.studio/projects)에서 크레딧을 충전하거나 새 GEMINI_API_KEY를 .env.local에 입력해 주세요.',
        };
      case 'ja':
        return {
          status: 503,
          message:
            'Gemini APIのクレジットが不足しています。Google AI Studio (https://ai.studio/projects) で残高を確認するか、新しい GEMINI_API_KEY を .env.local に設定してください。',
        };
      case 'es':
        return {
          status: 503,
          message:
            'Los créditos prepagos de Gemini API se han agotado. Recarga en Google AI Studio (https://ai.studio/projects) o configura una nueva GEMINI_API_KEY en .env.local.',
        };
      case 'zh':
        return {
          status: 503,
          message:
            'Gemini API 预付额度已用尽。请前往 Google AI Studio (https://ai.studio/projects) 充值，或在 .env.local 中更换新的 GEMINI_API_KEY。',
        };
      default:
        return {
          status: 503,
          message:
            'Gemini API prepayment credits are depleted. Please top up at https://ai.studio/projects or set a funded GEMINI_API_KEY in .env.local.',
        };
    }
  }

  if (lower.includes('free_tier') && lower.includes('limit: 0')) {
    switch (locale) {
      case 'ko':
        return {
          status: 402,
          message:
            '현재 GEMINI_API_KEY는 무료 티어(Free Tier)여서 이미지 생성 모델(gemini-3.1-flash-image) 할당량이 0입니다. /contract(계약서 스캐너)는 바로 작동하며, /interior 이미지 생성은 Google AI Studio (https://ai.studio/projects)에서 결제(Pay-as-you-go)를 연결해야 합니다.',
        };
      case 'ja':
        return {
          status: 402,
          message:
            '現在の GEMINI_API_KEY は無料枠(Free Tier)のため画像生成モデルの上限が0です。/contract はすぐ利用でき、/interior の画像生成には Google AI Studio での課金設定が必要です。',
        };
      case 'es':
        return {
          status: 402,
          message:
            'Tu GEMINI_API_KEY está en el nivel gratuito (límite 0 para generación de imágenes). /contract funciona gratis; para /interior habilita facturación en Google AI Studio.',
        };
      case 'zh':
        return {
          status: 402,
          message:
            '当前 GEMINI_API_KEY 为免费版（图像生成配额为 0）。/contract 可直接使用，/interior 图像生成需在 Google AI Studio 绑定计费。',
        };
      default:
        return {
          status: 402,
          message:
            'Your GEMINI_API_KEY is on the Free Tier, which has a 0 quota for image generation (gemini-3.1-flash-image). /contract works now; enable billing in Google AI Studio for /interior.',
        };
    }
  }

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        locale === 'ko'
          ? '요청이 일시적으로 많습니다. 잠시 후 다시 시도해 주세요.'
          : 'AI service is temporarily rate-limited. Please try again shortly.',
    };
  }

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return {
      status: 503,
      message:
        locale === 'ko'
          ? '현재 Gemini AI 서버 트래픽이 일시적으로 몰려 있습니다. 5~10초 후 다시 시도해 주세요.'
          : 'Gemini AI is experiencing temporary high demand. Please retry in a few seconds.',
    };
  }

  return {
    status: 500,
    message: raw || 'AI processing failed.',
  };
}
