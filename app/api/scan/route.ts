import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { checkAndConsumeAccess, releaseLocalFreeUsage } from '@/lib/creditGate';
import { detectLocale, getAiLanguageName, getApiMessages } from '@/lib/i18n';
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
    const {
      contractText = '',
      fileBase64 = '',
      fileMimeType = '',
      userEmail,
      locale: bodyLocale,
    } = body;
    locale = detectLocale(bodyLocale || req.headers.get('accept-language'));
    const msg = getApiMessages(locale);
    const targetLang = getAiLanguageName(locale);

    const hasText = typeof contractText === 'string' && contractText.trim().length >= 20;
    const hasFile = typeof fileBase64 === 'string' && fileBase64.length > 50 && Boolean(fileMimeType);

    if (!hasText && !hasFile) {
      return NextResponse.json({ error: msg.contractTooShort }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_gemini')) {
      return NextResponse.json({ error: msg.geminiMissing }, { status: 500 });
    }

    const access = await checkAndConsumeAccess(req, 'contract', userEmail);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: msg.contractLimit,
          requirePayment: true,
        },
        { status: 402 }
      );
    }
    consumedFreePreview = access.tier === 'free_preview';

    const instruction = `Analyze the following contract and identify the top 3 toxic or unfair clauses. Write the summary, clause titles, plain-language risk explanations, and copy-paste safe counter-clauses naturally in ${targetLang} (keep severity enum values strictly HIGH, MEDIUM, or LOW).`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (hasFile) {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({ inlineData: { mimeType: fileMimeType, data: cleanBase64 } });
    }
    parts.push({
      text: hasText
        ? `${instruction}\n\n[Contract Text]\n${contractText.slice(0, 12000)}`
        : instruction,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.INTEGER, description: '0 to 100 risk score' },
            summary: { type: Type.STRING },
            clauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                  explanation: { type: Type.STRING },
                  safe_counter_clause: { type: Type.STRING },
                },
                required: ['title', 'severity', 'explanation', 'safe_counter_clause'],
              },
            },
          },
          required: ['risk_score', 'summary', 'clauses'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini model.');
    }

    const parsed = JSON.parse(response.text);

    // 무료 맛보기 모드일 경우 1번 조항만 공개하고 2·3번 조항은 유료 잠금 처리
    const isFree = access.tier === 'free_preview';
    const clauses = Array.isArray(parsed.clauses) ? parsed.clauses : [];
    const visibleClauses = isFree ? clauses.slice(0, 1) : clauses;

    return NextResponse.json({
      ok: true,
      tier: access.tier,
      remainingCredits: access.remainingCredits,
      lockedCount: isFree ? Math.max(0, clauses.length - 1) : 0,
      risk_score: parsed.risk_score,
      summary: parsed.summary,
      clauses: visibleClauses,
    });
  } catch (err: unknown) {
    if (consumedFreePreview) {
      releaseLocalFreeUsage(req, 'contract');
    }
    const parsed = parseGeminiError(err, locale);
    return NextResponse.json({ error: parsed.message }, { status: parsed.status });
  }
}
