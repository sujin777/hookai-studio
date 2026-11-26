-- Base schema for ApexAI Studio (ai-micro-hub)
-- Run this first in Supabase SQL Editor, followed by supabase_gate.sql

create table if not exists public.user_credits (
  email text primary key,
  interior_credits integer not null default 0 check (interior_credits >= 0),
  contract_credits integer not null default 0 check (contract_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_accounts (
  email text primary key,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.paddle_transactions (
  transaction_id text primary key,
  email text not null,
  app_type text not null,
  credits_added integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_recovery_tokens (
  token text primary key,
  email text not null,
  target_path text not null default '/',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Idempotent credit grant called by Paddle webhook
create or replace function public.add_app_credits(
  p_email text,
  p_app text,
  p_amount integer,
  p_tx_id text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_clean_email text := lower(trim(p_email));
  v_interior integer := 0;
  v_contract integer := 0;
begin
  if exists (select 1 from public.paddle_transactions where transaction_id = p_tx_id) then
    select interior_credits, contract_credits into v_interior, v_contract
    from public.user_credits where email = v_clean_email;
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'interior_credits', coalesce(v_interior, 0),
      'contract_credits', coalesce(v_contract, 0)
    );
  end if;

  insert into public.paddle_transactions (transaction_id, email, app_type, credits_added)
  values (p_tx_id, v_clean_email, p_app, p_amount);

  insert into public.user_credits (email, interior_credits, contract_credits)
  values (
    v_clean_email,
    case when p_app = 'interior' then p_amount else 0 end,
    case when p_app = 'contract' then p_amount else 0 end
  )
  on conflict (email) do update set
    interior_credits = public.user_credits.interior_credits + (case when p_app = 'interior' then p_amount else 0 end),
    contract_credits = public.user_credits.contract_credits + (case when p_app = 'contract' then p_amount else 0 end),
    updated_at = now()
  returning interior_credits, contract_credits into v_interior, v_contract;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'interior_credits', v_interior,
    'contract_credits', v_contract
  );
end;
$$;

-- Direct paid credit consumption helper
create or replace function public.consume_app_credit(
  p_email text,
  p_app text
) returns integer
language plpgsql
security definer
as $$
declare
  v_credits integer := -1;
begin
  if p_app = 'interior' then
    update public.user_credits
    set interior_credits = interior_credits - 1, updated_at = now()
    where email = lower(trim(p_email)) and interior_credits > 0
    returning interior_credits into v_credits;
  elsif p_app = 'contract' then
    update public.user_credits
    set contract_credits = contract_credits - 1, updated_at = now()
    where email = lower(trim(p_email)) and contract_credits > 0
    returning contract_credits into v_credits;
  end if;

  return coalesce(v_credits, -1);
end;
$$;
