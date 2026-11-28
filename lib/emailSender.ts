import nodemailer from 'nodemailer';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(params: {
  toEmail: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { toEmail, subject, html } = params;

  // 1. Try SMTP (Gmail / Naver / Custom SMTP) first if configured
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
  if (smtpUser && smtpPass && !smtpPass.includes('your_')) {
    const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM?.trim() || `"HookAI Studio" <${smtpUser}>`,
        to: toEmail,
        subject,
        html,
      });
      return { sent: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SMTP send failed';
      if (msg.includes('534-5.7.9') || msg.includes('Application-specific password required')) {
        return {
          sent: false,
          error:
            'Gmail 일반 비밀번호가 아니라 16자리 "앱 비밀번호"가 필요합니다. https://myaccount.google.com/apppasswords 에서 생성 후 .env.local의 SMTP_PASS에 입력해 주세요.',
        };
      }
      return { sent: false, error: `SMTP 발송 실패: ${msg}` };
    }
  }

  // 2. Fallback to Resend API if configured
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || 'HookAI Studio <onboarding@resend.dev>';

  if (resendKey && !resendKey.includes('your_resend')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromEmail, to: [toEmail], subject, html }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { sent: false, error: `Resend 발송 실패: ${errText}` };
      }
      return { sent: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resend send failed';
      return { sent: false, error: msg };
    }
  }

  return {
    sent: false,
    error:
      '이메일 발송 설정이 필요합니다. .env.local에 SMTP_USER / SMTP_PASS (또는 RESEND_API_KEY)를 설정해 주세요.',
  };
}

export async function sendVerificationEmail(
  toEmail: string,
  verifyUrl: string
): Promise<{ sent: boolean; error?: string }> {
  const subject = '[HookAI Studio] Activate your account / 이메일 인증 안내';
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:16px;">
      <h2 style="margin:0 0 12px;color:#09090b;">HookAI Studio</h2>
      <p style="color:#52525b;font-size:14px;line-height:1.6;">
        Click the button below to verify your email address and activate your account.<br/>
        아래 버튼을 클릭해 본인 이메일 인증을 완료해 주세요.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;margin:18px 0;padding:12px 24px;background:#09090b;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">
        Activate Account / 이메일 인증하기
      </a>
      <p style="color:#a1a1aa;font-size:12px;">If you did not request this, you can safely ignore this email. (Expires in 24h)</p>
    </div>
  `;

  return sendEmail({ toEmail, subject, html });
}

export async function sendBoardReplyNotificationEmail(params: {
  toEmail: string;
  postTitle: string;
  replyText: string;
  boardUrl: string;
}): Promise<{ sent: boolean; error?: string }> {
  const safeTitle = escapeHtml(params.postTitle);
  const safeReply = escapeHtml(params.replyText).replace(/\r?\n/g, '<br/>');
  const subject = `[HookAI Studio] 문의하신 게시글에 관리자 답변이 등록되었습니다: ${params.postTitle}`;
  const html = `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:16px;background:#ffffff;">
      <h2 style="margin:0 0 8px;color:#09090b;font-size:18px;">HookAI Studio 게시판 답변 알림</h2>
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 16px;">
        등록하신 게시글 <strong>"${safeTitle}"</strong>에 관리자의 답변이 등록되었습니다.
      </p>
      <div style="padding:16px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:14px;line-height:1.6;">
        <div style="font-weight:bold;margin-bottom:6px;font-size:12px;color:#047857;">관리자 답변</div>
        <div>${safeReply}</div>
      </div>
      <a href="${params.boardUrl}" style="display:inline-block;margin:20px 0 8px;padding:11px 22px;background:#09090b;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:13px;">
        게시판에서 확인하기
      </a>
      <p style="color:#a1a1aa;font-size:11px;margin:12px 0 0;">
        본 메일은 HookAI Studio 게시판 답변 등록 시 자동 발송됩니다.
      </p>
    </div>
  `;

  return sendEmail({ toEmail: params.toEmail, subject, html });
}
