import { createSupabaseServiceRoleClient } from "~/lib/supabase/service-role";

export const PAID_USER_BANDS = [
  "1_249",
  "250_999",
  "1000_4999",
  "5000_24999",
  "25000_plus",
] as const;
export type PaidUserBand = (typeof PAID_USER_BANDS)[number];

export const LICENSE_TIERS = [
  "e5_security",
  "m365_e3",
  "standalone",
] as const;
export type LicenseTier = (typeof LICENSE_TIERS)[number];

export interface BenchmarkCohort {
  paidUserBand: PaidUserBand | null;
  licenseTier: LicenseTier | null;
  count: number;
  medianLicensedUsers: number | null;
  medianAgentCount: number | null;
  medianMessagesPerWorkday: number | null;
  medianObservedMonthlyScu: number | null;
  medianObservedMonthlyCostUsd: number | null;
  medianComputedMonthlyUsd: number | null;
  observedVsComputedDeltaUsd: number | null;
  observedVsComputedDeltaPct: number | null;
}

export interface BenchmarkSnapshot {
  schemaVersion: "1";
  generatedAt: string;
  formulaVersion: string;
  totalSubmissions: number;
  minCohortN: number;
  overall: BenchmarkCohort | null;
  byPaidUserBand: BenchmarkCohort[];
  byLicenseTier: BenchmarkCohort[];
  byPaidUserBandAndLicenseTier: BenchmarkCohort[];
}

const MAX_ROWS = 5000;
export const MIN_COUNT_FOR_MEDIAN = 3;

interface BenchmarkRow {
  paid_user_band: string | null;
  license_tier: string;
  licensed_users: number | string;
  agent_count: number | string;
  messages_per_workday: number | string;
  observed_monthly_scu: number | string | null;
  observed_monthly_cost_usd: number | string | null;
  computed_monthly_usd: number | string;
  formula_version?: string;
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

const toFiniteNonNeg = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

export const aggregateCohort = (
  rows: BenchmarkRow[],
  paidUserBand: PaidUserBand | null,
  licenseTier: LicenseTier | null,
): BenchmarkCohort => {
  const filtered = rows.filter(
    (row) =>
      (paidUserBand === null || row.paid_user_band === paidUserBand) &&
      (licenseTier === null || row.license_tier === licenseTier),
  );

  const count = filtered.length;

  if (count < MIN_COUNT_FOR_MEDIAN) {
    return {
      paidUserBand,
      licenseTier,
      count,
      medianLicensedUsers: null,
      medianAgentCount: null,
      medianMessagesPerWorkday: null,
      medianObservedMonthlyScu: null,
      medianObservedMonthlyCostUsd: null,
      medianComputedMonthlyUsd: null,
      observedVsComputedDeltaUsd: null,
      observedVsComputedDeltaPct: null,
    };
  }

  const licensed = filtered
    .map((row) => toFiniteNonNeg(row.licensed_users))
    .filter((value): value is number => value !== null);
  const agents = filtered
    .map((row) => toFiniteNonNeg(row.agent_count))
    .filter((value): value is number => value !== null);
  const msgs = filtered
    .map((row) => toFiniteNonNeg(row.messages_per_workday))
    .filter((value): value is number => value !== null);
  const observedScu = filtered
    .map((row) => toFiniteNonNeg(row.observed_monthly_scu))
    .filter((value): value is number => value !== null);
  const observedCost = filtered
    .map((row) => toFiniteNonNeg(row.observed_monthly_cost_usd))
    .filter((value): value is number => value !== null);
  const computed = filtered
    .map((row) => toFiniteNonNeg(row.computed_monthly_usd))
    .filter((value): value is number => value !== null);

  const medObservedCost = observedCost.length > 0 ? median(observedCost) : null;
  const medComputed = median(computed);
  const deltaUsd =
    medObservedCost !== null && medComputed !== null
      ? medObservedCost - medComputed
      : null;
  const deltaPct =
    deltaUsd !== null && medComputed !== null && medComputed > 0
      ? deltaUsd / medComputed
      : null;

  return {
    paidUserBand,
    licenseTier,
    count,
    medianLicensedUsers: median(licensed),
    medianAgentCount: median(agents),
    medianMessagesPerWorkday: median(msgs),
    medianObservedMonthlyScu: observedScu.length > 0 ? median(observedScu) : null,
    medianObservedMonthlyCostUsd: medObservedCost,
    medianComputedMonthlyUsd: medComputed,
    observedVsComputedDeltaUsd: deltaUsd,
    observedVsComputedDeltaPct: deltaPct,
  };
};

const emptySnapshot = (): BenchmarkSnapshot => ({
  schemaVersion: "1",
  generatedAt: new Date().toISOString(),
  formulaVersion: "unknown",
  totalSubmissions: 0,
  minCohortN: MIN_COUNT_FOR_MEDIAN,
  overall: null,
  byPaidUserBand: [],
  byLicenseTier: [],
  byPaidUserBandAndLicenseTier: [],
});

export const buildBenchmarkSnapshot =
  async (): Promise<BenchmarkSnapshot> => {
    let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
    try {
      supabase = createSupabaseServiceRoleClient();
    } catch {
      return emptySnapshot();
    }

    const { data, error } = await supabase
      .from("anonymous_submissions")
      .select(
        "paid_user_band, license_tier, licensed_users, agent_count, messages_per_workday, observed_monthly_scu, observed_monthly_cost_usd, computed_monthly_usd, formula_version",
      )
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);

    if (error || !data) {
      return emptySnapshot();
    }

    const rows = data as BenchmarkRow[];
    const formulaVersion = rows[0]?.formula_version ?? "unknown";

    const overall = aggregateCohort(rows, null, null);
    const byPaidUserBand = PAID_USER_BANDS.map((band) =>
      aggregateCohort(rows, band, null),
    ).filter((cohort) => cohort.count >= MIN_COUNT_FOR_MEDIAN);
    const byLicenseTier = LICENSE_TIERS.map((tier) =>
      aggregateCohort(rows, null, tier),
    ).filter((cohort) => cohort.count >= MIN_COUNT_FOR_MEDIAN);
    const byPaidUserBandAndLicenseTier = PAID_USER_BANDS.flatMap((band) =>
      LICENSE_TIERS.map((tier) => aggregateCohort(rows, band, tier)),
    ).filter((cohort) => cohort.count >= MIN_COUNT_FOR_MEDIAN);

    return {
      schemaVersion: "1",
      generatedAt: new Date().toISOString(),
      formulaVersion,
      totalSubmissions: rows.length,
      minCohortN: MIN_COUNT_FOR_MEDIAN,
      overall: overall.count >= MIN_COUNT_FOR_MEDIAN ? overall : null,
      byPaidUserBand,
      byLicenseTier,
      byPaidUserBandAndLicenseTier,
    };
  };
