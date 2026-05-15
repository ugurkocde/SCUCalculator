import {
  PRODUCTIVITY_PAID_USER_BANDS,
  type ProductivityPaidUserBand,
  USE_CASES,
  type UseCase,
} from "~/lib/scu/productivity-schema";
import { createSupabaseServiceRoleClient } from "~/lib/supabase/service-role";

export interface ValueCohort {
  useCase: UseCase | null;
  paidUserBand: ProductivityPaidUserBand | null;
  count: number;
  medianTeamHoursSavedPerMonth: number | null;
}

export interface ValueSnapshot {
  schemaVersion: "1";
  generatedAt: string;
  totalSubmissions: number;
  minCohortN: number;
  overall: ValueCohort | null;
  byUseCase: ValueCohort[];
  byUseCaseAndPaidUserBand: ValueCohort[];
}

const MAX_ROWS = 5000;
export const MIN_COUNT_FOR_MEDIAN = 3;

export interface ValueRow {
  use_case: string;
  team_hours_saved_per_month: number | string;
  paid_user_band: string | null;
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

const toFinitePositive = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const aggregateValueCohort = (
  rows: ValueRow[],
  useCase: UseCase | null,
  paidUserBand: ProductivityPaidUserBand | null,
): ValueCohort => {
  const filtered = rows.filter(
    (row) =>
      (useCase === null || row.use_case === useCase) &&
      (paidUserBand === null || row.paid_user_band === paidUserBand),
  );

  const count = filtered.length;

  if (count < MIN_COUNT_FOR_MEDIAN) {
    return {
      useCase,
      paidUserBand,
      count,
      medianTeamHoursSavedPerMonth: null,
    };
  }

  const hours = filtered
    .map((row) => toFinitePositive(row.team_hours_saved_per_month))
    .filter((value): value is number => value !== null);

  return {
    useCase,
    paidUserBand,
    count,
    medianTeamHoursSavedPerMonth: hours.length > 0 ? median(hours) : null,
  };
};

const emptySnapshot = (): ValueSnapshot => ({
  schemaVersion: "1",
  generatedAt: new Date().toISOString(),
  totalSubmissions: 0,
  minCohortN: MIN_COUNT_FOR_MEDIAN,
  overall: null,
  byUseCase: [],
  byUseCaseAndPaidUserBand: [],
});

export const buildValueSnapshot = async (): Promise<ValueSnapshot> => {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return emptySnapshot();
  }

  const { data, error } = await supabase
    .from("productivity_submissions")
    .select("use_case, team_hours_saved_per_month, paid_user_band")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error || !data) {
    return emptySnapshot();
  }

  const rows = data as ValueRow[];

  const hasPublishableMedian = (cohort: ValueCohort): boolean =>
    cohort.count >= MIN_COUNT_FOR_MEDIAN &&
    cohort.medianTeamHoursSavedPerMonth !== null;

  const overall = aggregateValueCohort(rows, null, null);
  const byUseCase = USE_CASES.map((useCase) =>
    aggregateValueCohort(rows, useCase, null),
  ).filter(hasPublishableMedian);
  const byUseCaseAndPaidUserBand = USE_CASES.flatMap((useCase) =>
    PRODUCTIVITY_PAID_USER_BANDS.map((band) =>
      aggregateValueCohort(rows, useCase, band),
    ),
  ).filter(hasPublishableMedian);

  return {
    schemaVersion: "1",
    generatedAt: new Date().toISOString(),
    totalSubmissions: rows.length,
    minCohortN: MIN_COUNT_FOR_MEDIAN,
    overall: hasPublishableMedian(overall) ? overall : null,
    byUseCase,
    byUseCaseAndPaidUserBand,
  };
};
