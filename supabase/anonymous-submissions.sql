-- SCU Calculator anonymous benchmark submissions.
-- Apply to the Supabase project used by the app before enabling POST /api/submissions.

create table if not exists public.anonymous_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  formula_version text not null,
  -- Signal-bearing calculator inputs.
  licensed_users integer not null check (licensed_users >= 0),
  license_tier text not null check (
    license_tier in ('e5_security', 'm365_e3', 'standalone')
  ),
  agent_count integer not null check (agent_count >= 0),
  messages_per_workday integer not null check (messages_per_workday >= 0),
  -- Observed values reported by the user.
  observed_monthly_scu numeric check (
    observed_monthly_scu is null or observed_monthly_scu >= 0
  ),
  observed_monthly_cost_usd numeric check (
    observed_monthly_cost_usd is null or observed_monthly_cost_usd >= 0
  ),
  -- Coarse environment metadata.
  region_band text check (
    region_band is null or region_band in (
      'north_america', 'europe', 'asia_pacific',
      'latin_america', 'middle_east_africa', 'global_multi_region'
    )
  ),
  paid_user_band text check (
    paid_user_band is null or paid_user_band in (
      '1_249', '250_999', '1000_4999', '5000_24999', '25000_plus'
    )
  ),
  -- Server-recomputed projected cost (single number, not the full output).
  computed_monthly_usd numeric not null check (computed_monthly_usd >= 0),
  -- Plumbing.
  consent_version text not null,
  source text not null default 'web',
  user_agent_hash text,
  duplicate_fingerprint text not null
);

comment on table public.anonymous_submissions is
  'Opt-in anonymous SCU Calculator benchmark submissions. Do not store tenant IDs, company names, domains, emails, IP addresses, or raw user agents.';
comment on column public.anonymous_submissions.licensed_users is
  'Paid Microsoft 365 E5 / E7 / equivalent licensed user count, from the calculator input.';
comment on column public.anonymous_submissions.license_tier is
  'License profile chosen in the calculator: e5_security, m365_e3, or standalone.';
comment on column public.anonymous_submissions.agent_count is
  'Number of Security Copilot agents configured in the calculator.';
comment on column public.anonymous_submissions.messages_per_workday is
  'Average chat messages per analyst per workday from the calculator.';
comment on column public.anonymous_submissions.region_band is
  'Optional broad region declared in the submission dialog.';
comment on column public.anonymous_submissions.paid_user_band is
  'Server-derived size band based on licensed_users.';
comment on column public.anonymous_submissions.computed_monthly_usd is
  'Server-recomputed projected monthly USD cost at submission time.';
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

create index if not exists anonymous_submissions_paid_user_band_idx
  on public.anonymous_submissions (paid_user_band)
  where paid_user_band is not null;

create index if not exists anonymous_submissions_license_tier_idx
  on public.anonymous_submissions (license_tier);

create unique index if not exists anonymous_submissions_duplicate_fingerprint_key
  on public.anonymous_submissions (duplicate_fingerprint);
