import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  getMemoryStore,
  getSupabaseAdmin,
  getUserCreditBalance,
  isMissingTableError,
} from '@/lib/creditGate';
import {
  createUserSessionToken,
  getUserSessionEmail,
  hashPassword,
  USER_COOKIE_NAME,
  verifyPassword,
} from '@/lib/userAuth';
import { sendVerificationEmail } from '@/lib/emailSender';

function setSessionCookie(res: NextResponse, email: string) {
  res.cookies.set(USER_COOKIE_NAME, createUserSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

function buildVerifyUrl(req: NextRequest, token: string): string {
  const base =
    req.nextUrl.origin ||
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ||
    'http://localhost:3000';
  return `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function GET(req: NextRequest) {
  const email = getUserSessionEmail(req);
  if (!email) {
    return NextResponse.json({
      loggedIn: false,
      email: '',
      interior_credits: 0,
      contract_credits: 0,
    });
  }

  const balance = await getUserCreditBalance(email);
  return NextResponse.json({
    loggedIn: true,
    email,
    interior_credits: balance?.interior_credits ?? 0,
    contract_credits: balance?.contract_credits ?? 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { mode = 'login', email: rawEmail, password, confirmPassword } = await req.json();

    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();
    const store = getMemoryStore();
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    let useMemory = !supabase;

    // Handle resend activation email
    if (mode === 'resend') {
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      if (supabase) {
        const { error: updErr } = await supabase
          .from('customer_accounts')
          .update({ verification_token: token, verification_expires_at: expiresAtIso })
          .eq('email', email);
        if (updErr && isMissingTableError(updErr.message)) {
          useMemory = true;
        } else if (updErr) {
          return NextResponse.json({ error: updErr.message }, { status: 500 });
        }
      }

      if (useMemory) {
        const acc = store.accounts.get(email);
        if (!acc) {
          return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
        }
        acc.verificationToken = token;
        acc.verificationExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      }

      const verifyUrl = buildVerifyUrl(req, token);
      const emailRes = await sendVerificationEmail(email, verifyUrl);
      if (!emailRes.sent) {
        return NextResponse.json(
          { error: emailRes.error || '이메일 발송에 실패했습니다.' },
          { status: 503 }
        );
      }
      return NextResponse.json({
        ok: true,
        requiresVerification: true,
        emailSent: true,
      });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    if (mode === 'register' && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. / 비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    if (supabase) {
      const { data: existingAcc, error: accErr } = await supabase
        .from('customer_accounts')
        .select('email, password_hash, is_verified')
        .eq('email', email)
        .maybeSingle();

      if (accErr && isMissingTableError(accErr.message)) {
        useMemory = true;
      } else if (accErr) {
        return NextResponse.json({ error: accErr.message }, { status: 500 });
      } else if (mode === 'register') {
        if (existingAcc) {
          return NextResponse.json(
            { error: 'Account already exists. Please sign in.' },
            { status: 409 }
          );
        }
        const token = crypto.randomBytes(24).toString('hex');
        const expiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const password_hash = hashPassword(password);

        const { error: insErr } = await supabase.from('customer_accounts').insert({
          email,
          password_hash,
          is_verified: false,
          verification_token: token,
          verification_expires_at: expiresAtIso,
        });
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }

        await supabase
          .from('user_credits')
          .upsert(
            { email, interior_credits: 0, contract_credits: 0 },
            { onConflict: 'email', ignoreDuplicates: true }
          );

        const verifyUrl = buildVerifyUrl(req, token);
        const emailRes = await sendVerificationEmail(email, verifyUrl);
        if (!emailRes.sent) {
          store.accounts.delete(email);
          return NextResponse.json(
            { error: emailRes.error || '이메일 발송에 실패했습니다.' },
            { status: 503 }
          );
        }
        return NextResponse.json({
          ok: true,
          requiresVerification: true,
          emailSent: true,
        });
      } else {
        if (!existingAcc) {
          // Existing paid/admin-created customer claiming account on first login
          const { data: creditRow } = await supabase
            .from('user_credits')
            .select('email')
            .eq('email', email)
            .maybeSingle();

          if (!creditRow) {
            return NextResponse.json(
              { error: 'Account not found. Please sign up first.' },
              { status: 404 }
            );
          }
          await supabase.from('customer_accounts').insert({
            email,
            password_hash: hashPassword(password),
            is_verified: true,
          });
        } else {
          if (!verifyPassword(password, existingAcc.password_hash)) {
            return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
          }
          if (existingAcc.is_verified === false) {
            return NextResponse.json(
              {
                error: '이메일 인증이 필요합니다. 메일함의 활성화 링크를 클릭해 주세요.',
                requiresVerification: true,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    if (useMemory) {
      const existingAcc = store.accounts.get(email);
      if (mode === 'register') {
        if (existingAcc) {
          return NextResponse.json(
            { error: 'Account already exists. Please sign in.' },
            { status: 409 }
          );
        }
        const token = crypto.randomBytes(24).toString('hex');
        store.accounts.set(email, {
          passwordHash: hashPassword(password),
          isVerified: false,
          verificationToken: token,
          verificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });
        if (!store.customers.has(email)) {
          store.customers.set(email, {
            email,
            interior_credits: 0,
            contract_credits: 0,
            created_at: now,
            updated_at: now,
          });
        }
        const verifyUrl = buildVerifyUrl(req, token);
        const emailRes = await sendVerificationEmail(email, verifyUrl);
        if (!emailRes.sent) {
          store.accounts.delete(email);
          return NextResponse.json(
            { error: emailRes.error || '이메일 발송에 실패했습니다.' },
            { status: 503 }
          );
        }
        return NextResponse.json({
          ok: true,
          requiresVerification: true,
          emailSent: true,
        });
      } else {
        if (!existingAcc) {
          if (store.customers.has(email)) {
            store.accounts.set(email, {
              passwordHash: hashPassword(password),
              isVerified: true,
            });
          } else {
            return NextResponse.json(
              { error: 'Account not found. Please sign up first.' },
              { status: 404 }
            );
          }
        } else {
          if (!verifyPassword(password, existingAcc.passwordHash)) {
            return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
          }
          if (!existingAcc.isVerified) {
            return NextResponse.json(
              {
                error: '이메일 인증이 필요합니다. 메일함의 활성화 링크를 클릭해 주세요.',
                requiresVerification: true,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    const balance = await getUserCreditBalance(email);
    const res = NextResponse.json({
      ok: true,
      loggedIn: true,
      email,
      interior_credits: balance?.interior_credits ?? 0,
      contract_credits: balance?.contract_credits ?? 0,
    });
    setSessionCookie(res, email);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE_NAME);
  return res;
}
