import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { getAdminOverview } from '@/lib/adminStore';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const overview = await getAdminOverview();
    return NextResponse.json({ ok: true, ...overview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load payments overview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
