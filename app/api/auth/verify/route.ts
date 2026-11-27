import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStore, getSupabaseAdmin, isMissingTableError } from '@/lib/creditGate';
import { createUserSessionToken, USER_COOKIE_NAME } from '@/lib/userAuth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() || '';
  const redirectTarget = new URL('/interior', req.url);

  if (!token) {
    redirectTarget.searchParams.set('verify_error', 'missing_token');
    return NextResponse.redirect(redirectTarget);
  }

  const store = getMemoryStore();
  const supabase = getSupabaseAdmin();
  let verifiedEmail: string | null = null;
  let useMemory = !supabase;

  if (supabase) {
    const { data, error } = await supabase
      .from('customer_accounts')
      .select('email, verification_expires_at')
      .eq('verification_token', token)
      .maybeSingle();

    if (error && isMissingTableError(error.message)) {
      useMemory = true;
    } else if (!error && data) {
      const expiresAt = data.verification_expires_at
        ? new Date(data.verification_expires_at).getTime()
        : 0;
      if (expiresAt && Date.now() > expiresAt) {
        redirectTarget.searchParams.set('verify_error', 'expired');
        return NextResponse.redirect(redirectTarget);
      }
      await supabase
        .from('customer_accounts')
        .update({
          is_verified: true,
          verification_token: null,
          verification_expires_at: null,
        })
        .eq('email', data.email);
      verifiedEmail = data.email;
    }
  }

  if (useMemory) {
    for (const [email, acc] of store.accounts.entries()) {
      if (acc.verificationToken === token) {
        if (acc.verificationExpiresAt && Date.now() > acc.verificationExpiresAt) {
          redirectTarget.searchParams.set('verify_error', 'expired');
          return NextResponse.redirect(redirectTarget);
        }
        acc.isVerified = true;
        acc.verificationToken = undefined;
        acc.verificationExpiresAt = undefined;
        verifiedEmail = email;
        break;
      }
    }
  }

  if (!verifiedEmail) {
    redirectTarget.searchParams.set('verify_error', 'invalid_token');
    return NextResponse.redirect(redirectTarget);
  }

  redirectTarget.searchParams.set('verified', '1');
  const res = NextResponse.redirect(redirectTarget);
  res.cookies.set(USER_COOKIE_NAME, createUserSessionToken(verifiedEmail), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
