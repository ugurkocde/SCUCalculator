"use client";

import { useEffect, useMemo, useState } from "react";

import { ProductivitySubmissionDialog } from "~/components/scu/productivity-submission-dialog";
import {
  USE_CASE_LABEL,
  type UseCase,
} from "~/lib/scu/productivity-schema";
import type { ValueCohort, ValueSnapshot } from "~/lib/scu/value-aggregator";

const RATE_STORAGE_KEY = "scucalc:value:hourlyRate";
const DEFAULT_HOURLY_RATE = 100;
const MIN_HOURLY_RATE = 1;
const MAX_HOURLY_RATE = 1000;

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatHours = (value: number | null): string =>
  value === null ? "—" : `${integerFormatter.format(value)} h/mo`;

const formatUsd = (value: number | null): string =>
  value === null ? "—" : `${usdFormatter.format(value)} / mo`;

const clampRate = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_HOURLY_RATE;
  if (value < MIN_HOURLY_RATE) return MIN_HOURLY_RATE;
  if (value > MAX_HOURLY_RATE) return MAX_HOURLY_RATE;
  return value;
};

const cohortLabel = (cohort: ValueCohort): string => {
  if (cohort.useCase === null) return "All use cases";
  return USE_CASE_LABEL[cohort.useCase];
};

const CohortBlock = ({
  cohort,
  hourlyRate,
}: {
  cohort: ValueCohort;
  hourlyRate: number | null;
}) => {
  const hours = cohort.medianTeamHoursSavedPerMonth;
  const dollars = hours !== null && hourlyRate !== null ? hours * hourlyRate : null;

  return (
    <section className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[color:var(--color-text)]">
          {cohortLabel(cohort)}
        </h3>
        <span className="font-mono text-xs text-[color:var(--color-text-subtle)]">
          N = {cohort.count}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Median hours saved
          </dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-[color:var(--color-text)]">
            {formatHours(hours)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Derived value
          </dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-[color:var(--color-text)]">
            {formatUsd(dollars)}
          </dd>
        </div>
      </dl>
    </section>
  );
};

interface ValueResultsProps {
  snapshot: ValueSnapshot;
}

export const ValueResults = ({ snapshot }: ValueResultsProps) => {
  const [rateInputRaw, setRateInputRaw] = useState<string>(
    String(DEFAULT_HOURLY_RATE),
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RATE_STORAGE_KEY);
      if (stored === null) return;
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed >= MIN_HOURLY_RATE) {
        setRateInputRaw(String(clampRate(parsed)));
      }
    } catch {
      // localStorage may be unavailable in some browsers.
    }
  }, []);

  const hourlyRate = useMemo<number | null>(() => {
    if (rateInputRaw.trim() === "") return null;
    const parsed = Number(rateInputRaw);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < MIN_HOURLY_RATE) return MIN_HOURLY_RATE;
    if (parsed > MAX_HOURLY_RATE) return MAX_HOURLY_RATE;
    return parsed;
  }, [rateInputRaw]);

  useEffect(() => {
    if (hourlyRate === null) return;
    try {
      window.localStorage.setItem(RATE_STORAGE_KEY, String(hourlyRate));
    } catch {
      // localStorage may be unavailable.
    }
  }, [hourlyRate]);

  const orderedByUseCase = useMemo(() => {
    const sorted = [...snapshot.byUseCase].sort((a, b) => {
      const aHours = a.medianTeamHoursSavedPerMonth ?? 0;
      const bHours = b.medianTeamHoursSavedPerMonth ?? 0;
      return bHours - aHours;
    });
    return sorted;
  }, [snapshot.byUseCase]);

  const hasAnyCohort =
    snapshot.totalSubmissions > 0 &&
    (snapshot.overall !== null || snapshot.byUseCase.length > 0);

  return (
    <>
      <section
        aria-label="Hourly rate"
        className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5"
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            Your team&apos;s loaded hourly rate (USD)
          </span>
          <input
            type="number"
            min={MIN_HOURLY_RATE}
            max={MAX_HOURLY_RATE}
            step="1"
            inputMode="decimal"
            value={rateInputRaw}
            onChange={(event) => {
              setRateInputRaw(event.target.value);
            }}
            onBlur={() => {
              if (hourlyRate === null) {
                setRateInputRaw(String(DEFAULT_HOURLY_RATE));
              } else {
                setRateInputRaw(String(hourlyRate));
              }
            }}
            className="mt-1 w-full max-w-[14rem] rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-3 py-2 text-base font-mono tabular-nums text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
            aria-describedby="value-rate-hint"
          />
        </label>
        <p
          id="value-rate-hint"
          className="mt-2 text-xs leading-5 text-[color:var(--color-text-muted)]"
        >
          Illustrative — adjust to your team&apos;s rate. Used only on this page
          to derive dollar figures from community-reported hours. Stored in your
          browser, never sent to the server. Default ${DEFAULT_HOURLY_RATE}/hr.
        </p>
      </section>

      <section
        aria-label="Reported value by use case"
        className="space-y-4"
      >
        {!hasAnyCohort ? (
          <div className="rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] p-4 text-sm text-[color:var(--color-text-muted)]">
            <p>
              Not enough contributions yet — be the first to share what your
              team gets back. Once at least {snapshot.minCohortN} teams in a use
              case have contributed, the median appears here.
            </p>
            <div className="mt-4">
              <ProductivitySubmissionDialog
                buttonClassName="rounded-md border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/[0.12] px-3 py-2 text-xs font-semibold text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent)]/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
              />
            </div>
          </div>
        ) : (
          <>
            {snapshot.overall ? (
              <CohortBlock cohort={snapshot.overall} hourlyRate={hourlyRate} />
            ) : null}

            {orderedByUseCase.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                  By use case
                </h2>
                <div className="space-y-4">
                  {orderedByUseCase.map((cohort) => (
                    <CohortBlock
                      key={cohort.useCase ?? "overall"}
                      cohort={cohort}
                      hourlyRate={hourlyRate}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <ProductivitySubmissionDialog
                buttonClassName="rounded-md border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/[0.12] px-3 py-2 text-xs font-semibold text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent)]/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
              />
            </div>
          </>
        )}
      </section>
    </>
  );
};
