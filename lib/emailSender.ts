export async function sendVerificationEmail(
  toEmail: string,
  verifyUrl: string
): Promise<{ sent: boolean; previewUrl?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || 'HookAI Studio <onboarding@resend.dev>';

  if (!apiKey || apiKey.includes('your_resend')) {
    console.info(`[HookAI Auth] Email verification link for ${toEmail}: ${verifyUrl}`);
    return { sent: false, previewUrl: verifyUrl };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: '[HookAI Studio] Activate your account / 이메일 인증 안내',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 12px;">HookAI Studio</h2>
            <p style="color:#52525b;font-size:14px;line-height:1.6;">
              Click the button below to verify your email address and activate your account.<br/>
              아래 버튼을 클릭해 이메일 인증을 완료해 주세요.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;margin:18px 0;padding:12px 24px;background:#09090b;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">
              Activate Account / 이메일 인증하기
            </a>
            <p style="color:#a1a1aa;font-size:12px;">This link expires in 24 hours.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.warn('[HookAI Auth] Resend failed:', await res.text());
      return { sent: false, previewUrl: verifyUrl };
    }

    return { sent: true };
  } catch (err) {
    console.warn('[HookAI Auth] Email send error:', err);
    return { sent: false, previewUrl: verifyUrl };
  }
}
