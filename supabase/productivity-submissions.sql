-- SCU Calculator anonymous productivity (hours-saved) submissions.
-- Apply to the Supabase project used by the app before enabling
-- POST /api/productivity-submissions. Separate from anonymous_submissions:
-- different contributor persona, different mental model, no FK between them.

create table if not exists public.productivity_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Signal columns.
  use_case text not null check (use_case in (
    'phishing_triage', 'incident_summarization', 'kql_authoring',
    'threat_intel_enrichment', 'vuln_prioritization', 'ir_guidance',
    'identity_investigation', 'device_investigation', 'other'
  )),
  team_hours_saved_per_month numeric not null check (team_hours_saved_per_month > 0),
  -- Coarse environment metadata, both optional.
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
  -- Plumbing.
  consent_version text not null,
  source text not null default 'web',
  user_agent_hash text,
  duplicate_fingerprint text not null
);

comment on table public.productivity_submissions is
  'Opt-in anonymous productivity submissions: hours saved per month per Security Copilot use case. Do not store tenant IDs, company names, domains, emails, IP addresses, raw user agents, hourly rates, or computed dollar amounts.';
comment on column public.productivity_submissions.use_case is
  'Closed-list use case the contributor reports hours saved for.';
comment on column public.productivity_submissions.team_hours_saved_per_month is
  'Self-reported team-aggregated hours saved per month for this use case.';
comment on column public.productivity_submissions.region_band is
  'Optional broad region declared in the submission dialog.';
comment on column public.productivity_submissions.paid_user_band is
  'Optional self-reported paid-user size band.';
comment on column public.productivity_submissions.user_agent_hash is
  'Optional hashed user agent for lightweight abuse controls; never store raw user agent.';
comment on column public.productivity_submissions.duplicate_fingerprint is
  'Server-derived hash for duplicate protection; never accept raw client identifiers here.';

alter table public.productivity_submissions enable row level security;

revoke all on table public.productivity_submissions from anon, authenticated;
grant select, insert, update, delete on table public.productivity_submissions to service_role;

drop policy if exists "service_role manages productivity submissions"
  on public.productivity_submissions;

create policy "service_role manages productivity submissions"
  on public.productivity_submissions
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists productivity_submissions_created_at_idx
  on public.productivity_submissions (created_at desc);

create index if not exists productivity_submissions_use_case_idx
  on public.productivity_submissions (use_case);

create index if not exists productivity_submissions_paid_user_band_idx
  on public.productivity_submissions (paid_user_band)
  where paid_user_band is not null;

create index if not exists productivity_submissions_region_band_idx
  on public.productivity_submissions (region_band)
  where region_band is not null;

create unique index if not exists productivity_submissions_duplicate_fingerprint_key
  on public.productivity_submissions (duplicate_fingerprint);
