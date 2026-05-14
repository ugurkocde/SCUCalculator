"use client";

import { useCallback, useEffect, useState } from "react";

import { AnonymousSubmissionDialog } from "~/components/scu/anonymous-submission-dialog";
import { type CalculatorInput } from "~/lib/scu/types";

type PaidUserBand =
  | "1_249"
  | "250_999"
  | "1000_4999"
  | "5000_24999"
  | "25000_plus";

const PAID_USER_BAND_LABEL: Record<PaidUserBand, string> = {
  "1_249": "1-249 paid users",
  "250_999": "250-999 paid users",
  "1000_4999": "1,000-4,999 paid users",
  "5000_24999": "5,000-24,999 paid users",
  "25000_plus": "25,000+ paid users",
};

const deriveBand = (e5PaidUserLicenses: number): PaidUserBand | null => {
  if (!Number.isFinite(e5PaidUserLicenses) || e5PaidUserLicenses < 1) {
    return null;
  }
  if (e5PaidUserLicenses < 250) return "1_249";
  if (e5PaidUserLicenses < 1000) return "250_999";
  if (e5PaidUserLicenses < 5000) return "1000_4999";
  if (e5PaidUserLicenses < 25000) return "5000_24999";
  return "25000_plus";
};

interface BenchmarkResponse {
  ok: boolean;
  paidUserBand: PaidUserBand | null;
  count: number;
  medianScu?: number | null;
  medianCostUsd?: number | null;
}

interface CommunityBenchmarkProps {
  input: CalculatorInput;
}

const scuFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatScu = (value: number | null | undefined): string =>
  value == null ? "—" : `${scuFormatter.format(value)} SCU`;

const formatUsd = (value: number | null | undefined): string =>
  value == null ? "—" : usdFormatter.format(value);

export const CommunityBenchmark = ({ input }: CommunityBenchmarkProps) => {
  const band = deriveBand(input.e5PaidUserLicenses);
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const url = band
      ? `/api/benchmark?paidUserBand=${encodeURIComponent(band)}`
      : "/api/benchmark";

    setLoadFailed(false);
    setData(null);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Benchmark request failed.");
        }
        const json = (await response.json()) as BenchmarkResponse;
        setData(json);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setLoadFailed(true);
      });

    return () => {
      controller.abort();
    };
  }, [band, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const cohortLabel = band
    ? `Orgs with ${PAID_USER_BAND_LABEL[band]}`
    : "All anonymous submissions";

  const hasNumbers =
    data !== null && data.ok && data.count >= 3 && data.medianScu != null;

  return (
    <section
      className="mt-4 rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5"
      aria-label="Community benchmark"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-subtle)]">
            Community benchmark
          </p>
          <p className="mt-1 text-sm font-medium text-[color:var(--color-text)]">
            {cohortLabel}
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
            Aggregated from anonymous submissions. No tenant identifiers are
            stored.
          </p>
        </div>
        <AnonymousSubmissionDialog
          input={input}
          buttonLabel="Share your SCU usage"
          buttonClassName="rounded-md border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/[0.12] px-3 py-2 text-xs font-semibold text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent)]/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
          onSubmitted={refresh}
        />
      </div>

      <div className="mt-4">
        {data === null && !loadFailed ? (
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Loading benchmark&hellip;
          </p>
        ) : loadFailed ? (
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Benchmark is temporarily unavailable.
          </p>
        ) : !hasNumbers ? (
          <p className="text-xs text-[color:var(--color-text-muted)]">
            Not enough submissions in this cohort yet &mdash; be the first to
            share your number.
          </p>
        ) : (
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
                Median SCU/mo
              </dt>
              <dd className="mt-1 font-mono text-base tabular-nums text-[color:var(--color-text)]">
                {formatScu(data?.medianScu)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
                Median cost
              </dt>
              <dd className="mt-1 font-mono text-base tabular-nums text-[color:var(--color-text)]">
                {data?.medianCostUsd == null
                  ? "—"
                  : `${formatUsd(data.medianCostUsd)} / mo`}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
                Submissions
              </dt>
              <dd className="mt-1 font-mono text-base tabular-nums text-[color:var(--color-text)]">
                {data?.count ?? 0}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
};
