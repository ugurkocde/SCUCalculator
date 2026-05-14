-- SCU Calculator anonymous benchmark submissions.
-- Apply to the Supabase project used by the app before enabling POST /api/submissions.

create table if not exists public.anonymous_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  formula_version text not null,
  calculator_input jsonb not null,
  computed_output jsonb not null,
  observed_monthly_scu numeric check (
    observed_monthly_scu is null
    or observed_monthly_scu >= 0
  ),
  observed_monthly_cost_usd numeric check (
    observed_monthly_cost_usd is null
    or observed_monthly_cost_usd >= 0
  ),
  environment jsonb not null default '{}'::jsonb,
  consent_version text not null,
  source text not null default 'web',
  user_agent_hash text,
  duplicate_fingerprint text not null
);

comment on table public.anonymous_submissions is
  'Opt-in anonymous SCU Calculator benchmark submissions. Do not store tenant IDs, company names, domains, emails, IP addresses, or raw user agents.';
comment on column public.anonymous_submissions.calculator_input is
  'Calculator input snapshot submitted by the client and validated by the API route.';
comment on column public.anonymous_submissions.computed_output is
  'Server-recomputed calculator output at submission time.';
comment on column public.anonymous_submissions.environment is
  'Coarse environment metadata only, such as region band, industry category, paid-user band, active-admin band, products used, and agent categories.';
comment on column public.anonymous_submissions.user_agent_hash is
  'Optional hashed user agent for lightweight abuse controls; never store raw user agent.';
comment on column public.anonymous_submissions.duplicate_fingerprint is
  'Server-derived hash for duplicate protection; never accept raw client identifiers here.';

alter table public.anonymous_submissions enable row level security;

revoke all on table public.anonymous_submissions from anon, authenticated;
grant select, insert, update, delete on table public.anonymous_submissions to service_role;

drop policy if exists "service_role manages anonymous submissions"
  on public.anonymous_submissions;

create policy "service_role manages anonymous submissions"
  on public.anonymous_submissions
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists anonymous_submissions_created_at_idx
  on public.anonymous_submissions (created_at desc);

create index if not exists anonymous_submissions_formula_version_idx
  on public.anonymous_submissions (formula_version);

create index if not exists anonymous_submissions_environment_gin_idx
  on public.anonymous_submissions using gin (environment);

create index if not exists anonymous_submissions_calculator_input_gin_idx
  on public.anonymous_submissions using gin (calculator_input);

create unique index if not exists anonymous_submissions_duplicate_fingerprint_key
  on public.anonymous_submissions (duplicate_fingerprint);
