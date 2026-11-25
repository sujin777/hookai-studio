import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkAndConsumeAccess, releaseLocalFreeUsage } from '@/lib/creditGate';
import { detectLocale, getApiMessages } from '@/lib/i18n';
import { parseGeminiError } from '@/lib/geminiError';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { timeout: 90000 },
});

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  let consumedFreePreview = false;
  let locale = detectLocale(req.headers.get('accept-language'));

  try {
    const body = await req.json();
    const { imageBase64, style = 'Modern Boutique Hotel', userEmail, locale: bodyLocale } = body;
    locale = detectLocale(bodyLocale || req.headers.get('accept-language'));
    const msg = getApiMessages(locale);

    if (!imageBase64) {
      return NextResponse.json({ error: msg.imageRequired }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_gemini')) {
      return NextResponse.json({ error: msg.geminiMissing }, { status: 500 });
    }

    // 1. 무료 1회 또는 유료 크레딧 차감 검사
    const access = await checkAndConsumeAccess(req, 'interior', userEmail);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: msg.interiorLimit,
          requirePayment: true,
        },
        { status: 402 }
      );
    }
    consumedFreePreview = access.tier === 'free_preview';

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 2. 창문 위치·방 크기 보존 실사 인테리어 합성 (gemini-3.1-flash-image, 16:9 파노라마)
    const prompt = `
Redesign this exact room into a "${style}" interior style.
[Strict Structural Rules]
1. Keep the exact window position, window frame size, ceiling height, and room proportions unchanged.
2. Replace old clutter with clean, well-proportioned furniture suited for the room size.
3. Photorealistic architectural photography, soft natural daylight coming through the existing window, no text or watermarks.
4. Wide-angle panoramic interior view, seamless horizontal composition suitable for a 360-degree room viewer.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: prompt },
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '16:9' },
      },
    });

    const imgPart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imgPart?.inlineData?.data) {
      throw new Error('Failed to generate redesigned room image.');
    }

    return NextResponse.json({
      ok: true,
      tier: access.tier,
      remainingCredits: access.remainingCredits,
      isWatermarked: access.tier === 'free_preview',
      resultImageUrl: `data:image/png;base64,${imgPart.inlineData.data}`,
      layoutNote: msg.layoutNote,
    });
  } catch (err: unknown) {
    if (consumedFreePreview) {
      releaseLocalFreeUsage(req, 'interior');
    }
    const parsed = parseGeminiError(err, locale);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status });
  }
}
