import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '@/lib/adminStore';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorized();
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const data = await listCustomers(q);
    return NextResponse.json({ ok: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load customers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorized();
  try {
    const { email, interior_credits = 0, contract_credits = 0 } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    const customer = await createCustomer({
      email,
      interior_credits: Number(interior_credits),
      contract_credits: Number(contract_credits),
    });
    return NextResponse.json({ ok: true, customer }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create customer';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorized();
  try {
    const { email, interior_credits = 0, contract_credits = 0 } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    const customer = await updateCustomer({
      email,
      interior_credits: Number(interior_credits),
      contract_credits: Number(contract_credits),
    });
    return NextResponse.json({ ok: true, customer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update customer';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauthorized();
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    await deleteCustomer(email);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete customer';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
