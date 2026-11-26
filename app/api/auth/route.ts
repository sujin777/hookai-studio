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

function setSessionCookie(res: NextResponse, email: string) {
  res.cookies.set(USER_COOKIE_NAME, createUserSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
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
    const { mode = 'login', email: rawEmail, password } = await req.json();

    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();
    const store = getMemoryStore();
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    let useMemory = !supabase;

    if (supabase) {
      const { data: existingAcc, error: accErr } = await supabase
        .from('customer_accounts')
        .select('email, password_hash')
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
        const password_hash = hashPassword(password);
        const { error: insErr } = await supabase
          .from('customer_accounts')
          .insert({ email, password_hash });
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
        // Ensure user_credits row exists
        await supabase
          .from('user_credits')
          .upsert({ email, interior_credits: 0, contract_credits: 0 }, { onConflict: 'email', ignoreDuplicates: true });
      } else {
        if (!existingAcc) {
          // If customer already paid via Paddle or was added by Admin, let them claim their account by setting a password!
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
          await supabase
            .from('customer_accounts')
            .insert({ email, password_hash: hashPassword(password) });
        } else if (!verifyPassword(password, existingAcc.password_hash)) {
          return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
        }
      }
    }

    if (useMemory) {
      const existingHash = store.accounts.get(email);
      if (mode === 'register') {
        if (existingHash) {
          return NextResponse.json(
            { error: 'Account already exists. Please sign in.' },
            { status: 409 }
          );
        }
        store.accounts.set(email, hashPassword(password));
        if (!store.customers.has(email)) {
          store.customers.set(email, {
            email,
            interior_credits: 0,
            contract_credits: 0,
            created_at: now,
            updated_at: now,
          });
        }
      } else {
        if (!existingHash) {
          if (store.customers.has(email)) {
            store.accounts.set(email, hashPassword(password));
          } else {
            return NextResponse.json(
              { error: 'Account not found. Please sign up first.' },
              { status: 404 }
            );
          }
        } else if (!verifyPassword(password, existingHash)) {
          return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
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
