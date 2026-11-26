import {
  getMemoryStore,
  getSupabaseAdmin,
  isMissingTableError,
  MemoryCustomer,
  MemoryPayment,
} from '@/lib/creditGate';

export type CustomerRecord = MemoryCustomer;
export type PaymentRecord = MemoryPayment;

export interface AdminOverview {
  source: 'supabase' | 'memory';
  warning?: string;
  totalCustomers: number;
  totalPayments: number;
  totalInteriorCredits: number;
  totalContractCredits: number;
  todayFreeUsage: number;
  payments: PaymentRecord[];
}

export async function listCustomers(query?: string): Promise<{
  source: 'supabase' | 'memory';
  customers: CustomerRecord[];
}> {
  const supabase = getSupabaseAdmin();
  const q = query?.toLowerCase().trim() || '';
  const store = getMemoryStore();

  if (!supabase) {
    const all = Array.from(store.customers.values())
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
  if (error) {
    if (isMissingTableError(error.message)) {
      const all = Array.from(store.customers.values())
        .filter((c) => !q || c.email.includes(q))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return { source: 'memory', customers: all };
    }
    throw new Error(error.message);
  }
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
  const store = getMemoryStore();

  const createInMemory = () => {
    if (store.customers.has(email)) {
      throw new Error('Customer email already exists.');
    }
    const record: CustomerRecord = {
      email,
      interior_credits,
      contract_credits,
      created_at: now,
      updated_at: now,
    };
    store.customers.set(email, record);
    return record;
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return createInMemory();

  const { data: existing, error: findErr } = await supabase
    .from('user_credits')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (findErr && isMissingTableError(findErr.message)) {
    return createInMemory();
  }

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
  const store = getMemoryStore();

  const updateInMemory = () => {
    const existing = store.customers.get(email);
    if (!existing) throw new Error('Customer not found.');
    const updated: CustomerRecord = {
      ...existing,
      interior_credits,
      contract_credits,
      updated_at: now,
    };
    store.customers.set(email, updated);
    return updated;
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return updateInMemory();

  const { data, error } = await supabase
    .from('user_credits')
    .update({ interior_credits, contract_credits, updated_at: now })
    .eq('email', email)
    .select('email, interior_credits, contract_credits, created_at, updated_at')
    .single();

  if (error) {
    if (isMissingTableError(error.message)) return updateInMemory();
    throw new Error(error.message);
  }
  return data as CustomerRecord;
}

export async function deleteCustomer(emailInput: string): Promise<void> {
  const email = emailInput.toLowerCase().trim();
  const store = getMemoryStore();

  const deleteInMemory = () => {
    if (!store.customers.delete(email)) {
      throw new Error('Customer not found.');
    }
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    deleteInMemory();
    return;
  }

  const { error } = await supabase.from('user_credits').delete().eq('email', email);
  if (error) {
    if (isMissingTableError(error.message)) {
      deleteInMemory();
      return;
    }
    throw new Error(error.message);
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const store = getMemoryStore();
  const memoryOverview = (warning?: string): AdminOverview => {
    const customers = Array.from(store.customers.values());
    return {
      source: 'memory',
      warning,
      totalCustomers: customers.length,
      totalPayments: store.payments.length,
      totalInteriorCredits: customers.reduce((sum, c) => sum + c.interior_credits, 0),
      totalContractCredits: customers.reduce((sum, c) => sum + c.contract_credits, 0),
      todayFreeUsage: store.dailyFreeUsage.size,
      payments: store.payments,
    };
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return memoryOverview();

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

  if (customersRes.error || paymentsRes.error) {
    const errMsg = customersRes.error?.message || paymentsRes.error?.message || '';
    if (isMissingTableError(errMsg)) {
      return memoryOverview(
        'Supabase 연결은 되었으나 테이블이 아직 없습니다. Supabase SQL Editor에서 supabase_schema.sql과 supabase_gate.sql을 실행해 주세요.'
      );
    }
    throw new Error(errMsg);
  }

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
