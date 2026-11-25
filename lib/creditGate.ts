import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AppType = 'interior' | 'contract';

export interface AccessDecision {
  allowed: boolean;
  tier: 'paid' | 'free_preview' | 'limit_exceeded';
  remainingCredits: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isConfigured(val?: string): val is string {
  return Boolean(val && !val.includes('your-') && !val.includes('your_'));
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isConfigured(supabaseUrl) || !isConfigured(supabaseServiceKey)) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Local in-memory fallback when Supabase env vars are not yet configured
const localDailyFreeUsage = new Map<string, string>();

export function releaseLocalFreeUsage(req: NextRequest, appType: AppType): void {
  const ipHash = extractIpHash(req);
  localDailyFreeUsage.delete(`${ipHash}:${appType}`);
}

export function extractIpHash(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const rawIp = forwarded.split(',')[0].trim();
  return crypto
    .createHash('sha256')
    .update(`${rawIp}:${process.env.PADDLE_WEBHOOK_SECRET || 'salt'}`)
    .digest('hex');
}

export async function checkAndConsumeAccess(
  req: NextRequest,
  appType: AppType,
  userEmail?: string
): Promise<AccessDecision> {
  const ipHash = extractIpHash(req);
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${ipHash}:${appType}`;
    if (localDailyFreeUsage.get(key) === today) {
      return { allowed: false, tier: 'limit_exceeded', remainingCredits: 0 };
    }
    localDailyFreeUsage.set(key, today);
    return { allowed: true, tier: 'free_preview', remainingCredits: 0 };
  }

  const { data, error } = await supabaseAdmin.rpc('authorize_and_consume', {
    p_email: userEmail || '',
    p_ip_hash: ipHash,
    p_app: appType,
  });

  if (error || !data) {
    // DB 일시 오류 시 서비스 중단 방지를 위해 무료 맛보기 1회 폴백
    return { allowed: true, tier: 'free_preview', remainingCredits: 0 };
  }

  return data as AccessDecision;
}

export async function getUserCreditBalance(
  email: string
): Promise<{ interior_credits: number; contract_credits: number } | null> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin || !email.trim()) return null;

  const { data, error } = await supabaseAdmin
    .from('user_credits')
    .select('interior_credits, contract_credits')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
