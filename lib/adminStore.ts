import { getSupabaseAdmin } from '@/lib/creditGate';

export interface CustomerRecord {
  email: string;
  interior_credits: number;
  contract_credits: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  transaction_id: string;
  email: string;
  app_type: string;
  credits_added: number;
  created_at: string;
}

export interface AdminOverview {
  source: 'supabase' | 'memory';
  totalCustomers: number;
  totalPayments: number;
  totalInteriorCredits: number;
  totalContractCredits: number;
  todayFreeUsage: number;
  payments: PaymentRecord[];
}

// Local in-memory fallback when Supabase is not configured
const memoryCustomers = new Map<string, CustomerRecord>();
const memoryPayments: PaymentRecord[] = [];

export async function listCustomers(query?: string): Promise<{
  source: 'supabase' | 'memory';
  customers: CustomerRecord[];
}> {
  const supabase = getSupabaseAdmin();
  const q = query?.toLowerCase().trim() || '';

  if (!supabase) {
    const all = Array.from(memoryCustomers.values())
      .filter((c) => !q || c.email.includes(q))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return { source: 'memory', customers: all };
  }

  let builder = supabase
    .from('user_credits')
    .select('email, interior_credits, contract_credits, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (q) {
    builder = builder.ilike('email', `%${q}%`);
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return { source: 'supabase', customers: (data || []) as CustomerRecord[] };
}

export async function createCustomer(input: {
  email: string;
  interior_credits: number;
  contract_credits: number;
}): Promise<CustomerRecord> {
  const email = input.email.toLowerCase().trim();
  const interior_credits = Math.max(0, Math.floor(Number(input.interior_credits) || 0));
  const contract_credits = Math.max(0, Math.floor(Number(input.contract_credits) || 0));
  const now = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (memoryCustomers.has(email)) {
      throw new Error('Customer email already exists.');
    }
    const record: CustomerRecord = {
      email,
      interior_credits,
      contract_credits,
      created_at: now,
      updated_at: now,
    };
    memoryCustomers.set(email, record);
    return record;
  }

  const { data: existing } = await supabase
    .from('user_credits')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    throw new Error('Customer email already exists.');
  }

  const { data, error } = await supabase
    .from('user_credits')
    .insert({ email, interior_credits, contract_credits })
    .select('email, interior_credits, contract_credits, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data as CustomerRecord;
}

export async function updateCustomer(input: {
  email: string;
  interior_credits: number;
  contract_credits: number;
}): Promise<CustomerRecord> {
  const email = input.email.toLowerCase().trim();
  const interior_credits = Math.max(0, Math.floor(Number(input.interior_credits) || 0));
  const contract_credits = Math.max(0, Math.floor(Number(input.contract_credits) || 0));
  const now = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const existing = memoryCustomers.get(email);
    if (!existing) throw new Error('Customer not found.');
    const updated: CustomerRecord = {
      ...existing,
      interior_credits,
      contract_credits,
      updated_at: now,
    };
    memoryCustomers.set(email, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from('user_credits')
    .update({ interior_credits, contract_credits, updated_at: now })
    .eq('email', email)
    .select('email, interior_credits, contract_credits, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data as CustomerRecord;
}

export async function deleteCustomer(emailInput: string): Promise<void> {
  const email = emailInput.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (!memoryCustomers.delete(email)) {
      throw new Error('Customer not found.');
    }
    return;
  }

  const { error } = await supabase.from('user_credits').delete().eq('email', email);
  if (error) throw new Error(error.message);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const customers = Array.from(memoryCustomers.values());
    return {
      source: 'memory',
      totalCustomers: customers.length,
      totalPayments: memoryPayments.length,
      totalInteriorCredits: customers.reduce((sum, c) => sum + c.interior_credits, 0),
      totalContractCredits: customers.reduce((sum, c) => sum + c.contract_credits, 0),
      todayFreeUsage: 0,
      payments: memoryPayments,
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  const [customersRes, paymentsRes, freeUsageRes] = await Promise.all([
    supabase.from('user_credits').select('interior_credits, contract_credits'),
    supabase
      .from('paddle_transactions')
      .select('transaction_id, email, app_type, credits_added, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('daily_free_usage')
      .select('ip_hash', { count: 'exact', head: true })
      .eq('usage_date', today),
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  const customers = customersRes.data || [];
  const payments = (paymentsRes.data || []) as PaymentRecord[];

  return {
    source: 'supabase',
    totalCustomers: customers.length,
    totalPayments: payments.length,
    totalInteriorCredits: customers.reduce((sum, c) => sum + (c.interior_credits || 0), 0),
    totalContractCredits: customers.reduce((sum, c) => sum + (c.contract_credits || 0), 0),
    todayFreeUsage: freeUsageRes.count ?? 0,
    payments,
  };
}
