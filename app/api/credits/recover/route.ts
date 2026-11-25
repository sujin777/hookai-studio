import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserCreditBalance } from '@/lib/creditGate';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || '';
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  const balance = await getUserCreditBalance(email);
  return NextResponse.json({
    ok: true,
    email: email.toLowerCase().trim(),
    interior_credits: balance?.interior_credits ?? 0,
    contract_credits: balance?.contract_credits ?? 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, targetPath = '/' } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid purchase email.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json({
        ok: true,
        message: 'Supabase not configured; email saved for session.',
        interior_credits: 0,
        contract_credits: 0,
      });
    }

    const balance = await getUserCreditBalance(cleanEmail);
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from('credit_recovery_tokens').insert({
      token,
      email: cleanEmail,
      target_path: targetPath,
      expires_at: expiresAt,
    });

    const total = (balance?.interior_credits ?? 0) + (balance?.contract_credits ?? 0);

    return NextResponse.json({
      ok: true,
      interior_credits: balance?.interior_credits ?? 0,
      contract_credits: balance?.contract_credits ?? 0,
      message:
        total > 0
          ? `Found ${balance?.interior_credits ?? 0} Interior & ${balance?.contract_credits ?? 0} Contract credits for ${cleanEmail}.`
          : 'Restore request recorded. Check your inbox if you have a previous purchase.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Recovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
