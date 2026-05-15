import { z } from "zod";

import { createSupabaseServiceRoleClient } from "~/lib/supabase/service-role";

export const runtime = "nodejs";

const PAID_USER_BANDS = [
  "1_249",
  "250_999",
  "1000_4999",
  "5000_24999",
  "25000_plus",
] as const;

const paidUserBandSchema = z.enum(PAID_USER_BANDS);

const MIN_COUNT_FOR_MEDIAN = 3;
const MAX_ROWS = 1000;

const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
};

interface BenchmarkRow {
  observed_monthly_scu: number | string | null;
  observed_monthly_cost_usd: number | string | null;
}

const toFiniteNonNegative = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const rawBand = url.searchParams.get("paidUserBand");

  let paidUserBand: (typeof PAID_USER_BANDS)[number] | null = null;
  if (rawBand !== null && rawBand !== "") {
    const parsed = paidUserBandSchema.safeParse(rawBand);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid paidUserBand." },
        { status: 400 },
      );
    }
    paidUserBand = parsed.data;
  }

  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return Response.json(
      { ok: false, error: "Submission service is not configured." },
      { status: 500 },
    );
  }

  let query = supabase
    .from("anonymous_submissions")
    .select("observed_monthly_scu, observed_monthly_cost_usd");

  if (paidUserBand) {
    query = query.eq("paid_user_band", paidUserBand);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (error) {
    return Response.json(
      { ok: false, error: "Benchmark query failed." },
      { status: 502 },
    );
  }

  const rows = (data ?? []) as BenchmarkRow[];
  const count = rows.length;

  if (count < MIN_COUNT_FOR_MEDIAN) {
    return Response.json({
      ok: true,
      paidUserBand,
      count,
    });
  }

  const scuValues = rows
    .map((row) => toFiniteNonNegative(row.observed_monthly_scu))
    .filter((value): value is number => value !== null);

  const costValues = rows
    .map((row) => toFiniteNonNegative(row.observed_monthly_cost_usd))
    .filter((value): value is number => value !== null);

  return Response.json({
    ok: true,
    paidUserBand,
    count,
    medianScu: median(scuValues),
    medianCostUsd: costValues.length > 0 ? median(costValues) : null,
  });
};
