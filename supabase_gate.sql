-- 1. IP 기반 하루 1회 무료 맛보기 사용 기록 테이블 (봇/중복 무료 호출 차단)
create table if not exists public.daily_free_usage (
  ip_hash text not null,
  app_type text not null,
  usage_date date not null default current_date,
  primary key (ip_hash, app_type, usage_date)
);

-- 2. 무료 체험 확인 또는 유료 크레딧 1회 차감 통합 RPC
create or replace function public.authorize_and_consume(
  p_email text,
  p_ip_hash text,
  p_app text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_credits integer := 0;
begin
  -- A. 이메일이 제공된 경우 유료 크레딧 우선 확인 및 1회 차감
  if p_email is not null and length(trim(p_email)) > 3 then
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

    if found then
      return jsonb_build_object('allowed', true, 'tier', 'paid', 'remainingCredits', v_credits);
    end if;
  end if;

  -- B. 유료 크레딧이 없으면 오늘 해당 IP의 무료 1회 체험 여부 확인
  if exists (
    select 1 from public.daily_free_usage
    where ip_hash = p_ip_hash and app_type = p_app and usage_date = current_date
  ) then
    return jsonb_build_object('allowed', false, 'tier', 'limit_exceeded', 'remainingCredits', 0);
  end if;

  -- C. 오늘 첫 무료 체험 허용 및 기록
  insert into public.daily_free_usage (ip_hash, app_type, usage_date)
  values (p_ip_hash, p_app, current_date);

  return jsonb_build_object('allowed', true, 'tier', 'free_preview', 'remainingCredits', 0);
end;
$$;
