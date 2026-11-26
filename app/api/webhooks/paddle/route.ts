import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStore, getSupabaseAdmin, isMissingTableError } from '@/lib/creditGate';

function verifyPaddleSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((part) => {
      const [k, v] = part.trim().split('=');
      return [k, v];
    })
  );

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}:${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.PADDLE_WEBHOOK_SECRET || '';
    const signature = req.headers.get('paddle-signature');

    if (secret && !secret.includes('your_webhook') && !verifyPaddleSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid Paddle webhook signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event_type !== 'transaction.completed') {
      return NextResponse.json({ ok: true, ignored: event.event_type });
    }

    const txId: string = event.data?.id || '';
    const email: string = event.data?.customer?.email || event.data?.custom_data?.email || '';
    const items: Array<{ price?: { id?: string } }> = event.data?.items || [];
    const priceId = items[0]?.price?.id || '';

    if (!txId || !email) {
      return NextResponse.json({ error: 'Missing transaction id or customer email.' }, { status: 400 });
    }

    let appType: 'interior' | 'contract' | null = null;
    let credits = 0;

    if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_INTERIOR) {
      appType = 'interior';
      credits = 10;
    } else if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_CONTRACT) {
      appType = 'contract';
      credits = 5;
    }

    if (!appType) {
      return NextResponse.json({ ok: true, ignored: 'Unknown price_id' });
    }

    const creditMemoryFallback = () => {
      const store = getMemoryStore();
      const cleanEmail = email.toLowerCase().trim();
      if (store.payments.some((p) => p.transaction_id === txId)) {
        return { ok: true, duplicate: true };
      }
      const now = new Date().toISOString();
      store.payments.unshift({
        transaction_id: txId,
        email: cleanEmail,
        app_type: appType!,
        credits_added: credits,
        created_at: now,
      });
      const existing = store.customers.get(cleanEmail) || {
        email: cleanEmail,
        interior_credits: 0,
        contract_credits: 0,
        created_at: now,
        updated_at: now,
      };
      if (appType === 'interior') existing.interior_credits += credits;
      else existing.contract_credits += credits;
      existing.updated_at = now;
      store.customers.set(cleanEmail, existing);
      return { ok: true, result: existing };
    };

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(creditMemoryFallback());
    }

    const { data, error } = await supabaseAdmin.rpc('add_app_credits', {
      p_email: email,
      p_app: appType,
      p_amount: credits,
      p_tx_id: txId,
    });

    if (error) {
      if (isMissingTableError(error.message)) {
        return NextResponse.json(creditMemoryFallback());
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
