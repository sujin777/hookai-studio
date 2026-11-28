import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getUserSessionEmail } from '@/lib/userAuth';

export type AppType = 'interior' | 'contract';

export interface AccessDecision {
  allowed: boolean;
  tier: 'paid' | 'free_preview' | 'limit_exceeded';
  remainingCredits: number;
}

export interface MemoryCustomer {
  email: string;
  interior_credits: number;
  contract_credits: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryPayment {
  transaction_id: string;
  email: string;
  app_type: string;
  credits_added: number;
  created_at: string;
}

export interface MemoryAccount {
  passwordHash: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpiresAt?: number;
}

interface SharedMemoryStore {
  dailyFreeUsage: Map<string, string>;
  customers: Map<string, MemoryCustomer>;
  accounts: Map<string, MemoryAccount>;
  payments: MemoryPayment[];
}

const globalForStore = globalThis as unknown as { __hookaiStore?: SharedMemoryStore };

export function getMemoryStore(): SharedMemoryStore {
  if (!globalForStore.__hookaiStore) {
    globalForStore.__hookaiStore = {
      dailyFreeUsage: new Map<string, string>(),
      customers: new Map<string, MemoryCustomer>(),
      accounts: new Map<string, MemoryAccount>(),
      payments: [],
    };
  }
  return globalForStore.__hookaiStore;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isConfigured(val?: string): val is string {
  return Boolean(val && !val.includes('your-') && !val.includes('your_'));
}

export function isMissingTableError(message?: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  if (lower.includes('column ') && lower.includes('does not exist')) {
    return false;
  }
  return (
    lower.includes('schema cache') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isConfigured(supabaseUrl) || !isConfigured(supabaseServiceKey)) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export function extractIpHash(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const rawIp = forwarded.split(',')[0].trim();
  return crypto
    .createHash('sha256')
    .update(`${rawIp}:${process.env.PADDLE_WEBHOOK_SECRET || 'salt'}`)
    .digest('hex');
}

export function releaseLocalFreeUsage(req: NextRequest, appType: AppType): void {
  const ipHash = extractIpHash(req);
  getMemoryStore().dailyFreeUsage.delete(`${ipHash}:${appType}`);
}

function checkLocalMemoryAccess(
  ipHash: string,
  appType: AppType,
  effectiveEmail: string
): AccessDecision {
  const store = getMemoryStore();

  // 1. 유료 크레딧 우선 확인 (이메일이 있을 때)
  if (effectiveEmail && effectiveEmail.includes('@')) {
    const cust = store.customers.get(effectiveEmail);
    if (cust) {
      if (appType === 'interior' && cust.interior_credits > 0) {
        cust.interior_credits -= 1;
        cust.updated_at = new Date().toISOString();
        return { allowed: true, tier: 'paid', remainingCredits: cust.interior_credits };
      }
      if (appType === 'contract' && cust.contract_credits > 0) {
        cust.contract_credits -= 1;
        cust.updated_at = new Date().toISOString();
        return { allowed: true, tier: 'paid', remainingCredits: cust.contract_credits };
      }
    }
  }

  // 2. 유료 크레딧이 없으면 오늘 해당 IP의 무료 1회 체험 확인
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ipHash}:${appType}`;
  if (store.dailyFreeUsage.get(key) === today) {
    return { allowed: false, tier: 'limit_exceeded', remainingCredits: 0 };
  }
  store.dailyFreeUsage.set(key, today);
  return { allowed: true, tier: 'free_preview', remainingCredits: 0 };
}

export async function checkAndConsumeAccess(
  req: NextRequest,
  appType: AppType,
  userEmail?: string
): Promise<AccessDecision> {
  const ipHash = extractIpHash(req);
  const sessionEmail = getUserSessionEmail(req);
  const effectiveEmail = (userEmail || sessionEmail || '').toLowerCase().trim();
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return checkLocalMemoryAccess(ipHash, appType, effectiveEmail);
  }

  const { data, error } = await supabaseAdmin.rpc('authorize_and_consume', {
    p_email: effectiveEmail,
    p_ip_hash: ipHash,
    p_app: appType,
  });

  if (error || !data) {
    if (error && isMissingTableError(error.message)) {
      return checkLocalMemoryAccess(ipHash, appType, effectiveEmail);
    }
    return { allowed: true, tier: 'free_preview', remainingCredits: 0 };
  }

  return data as AccessDecision;
}

export async function getUserCreditBalance(
  email: string
): Promise<{ interior_credits: number; contract_credits: number } | null> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return null;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    const cust = getMemoryStore().customers.get(cleanEmail);
    return cust
      ? { interior_credits: cust.interior_credits, contract_credits: cust.contract_credits }
      : { interior_credits: 0, contract_credits: 0 };
  }

  const { data, error } = await supabaseAdmin
    .from('user_credits')
    .select('interior_credits, contract_credits')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      const cust = getMemoryStore().customers.get(cleanEmail);
      return cust
        ? { interior_credits: cust.interior_credits, contract_credits: cust.contract_credits }
        : { interior_credits: 0, contract_credits: 0 };
    }
    return null;
  }

  return data ?? { interior_credits: 0, contract_credits: 0 };
}
