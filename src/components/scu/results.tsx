import { type ReactNode } from "react";

import { AnimatedNumber } from "~/components/scu/animated-number";
import { type CalculatorOutput } from "~/lib/scu/types";

interface CalculatorResultsProps {
  output: CalculatorOutput;
  fxWarning: string | null;
  title?: string;
  actions?: ReactNode;
  trace?: ReactNode;
}

const formatCurrency = (value: number, currency: string, max = 0): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: max,
  }).format(value);

const formatScu = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export const CalculatorResults = ({
  output,
  fxWarning,
  title = "Projected monthly cost",
  actions,
  trace,
}: CalculatorResultsProps) => {
  const showConverted = output.currencyTotals.currency !== "USD";
  const hasOverageRisk = output.billableOverageScuMonthly > 0;
  const currency = output.currencyTotals.currency;
  const monthly = showConverted
    ? output.currencyTotals.monthly
    : output.monthlyUsd;
  const hourly = showConverted ? output.currencyTotals.hourly : output.hourlyUsd;
  const annual = showConverted ? output.currencyTotals.annual : output.annualUsd;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] shadow-[0_1px_0_oklch(1_0_0_/_0.04)_inset,0_24px_60px_-24px_oklch(0_0_0_/_0.6)]"
      aria-label={title}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent opacity-50"
      />

      <div className="flex flex-col gap-1.5 px-6 pt-5">
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            hasOverageRisk
              ? "border-amber-300/30 bg-amber-300/5 text-amber-200"
              : "border-emerald-300/30 bg-emerald-300/5 text-emerald-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasOverageRisk ? "bg-amber-300" : "bg-emerald-300"
            }`}
          />
          {hasOverageRisk ? "Overage active" : "Within included pool"}
        </span>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[color:var(--color-text-subtle)]">
          Projected monthly cost
        </p>
      </div>

      <div className="px-6 pb-2 pt-2">
        <p
          className="min-w-0 break-words font-semibold tabular-nums tracking-tight text-[color:var(--color-text)] text-[clamp(2.5rem,8vw,4.25rem)]"
          aria-live="polite"
        >
          <AnimatedNumber
            value={monthly}
            format={(v) => formatCurrency(v, currency)}
          />
        </p>
        <p className="mt-1.5 text-xs text-[color:var(--color-text-muted)]">
          <span className="font-mono">{formatCurrency(hourly, currency, 2)}</span>{" "}
          per hour · 730h month
          {showConverted
            ? ` · USD ${formatCurrency(output.monthlyUsd, "USD", 2)}`
            : ""}
        </p>
        {!hasOverageRisk ? (
          <p className="mt-2 text-xs text-emerald-200/80">
            Fully covered by the included E5 / E7 pool. Add agents or analysts to model overage.
          </p>
        ) : null}
        {output.provisionedRecommendation.worthProvisioning ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.05] px-3 py-2 text-xs text-[color:var(--color-text)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5 text-[color:var(--color-accent-fg)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2 4 12h6l-1 6 9-10h-6l1-6Z" />
            </svg>
            <span>
              Save{" "}
              <span className="font-mono tabular-nums text-[color:var(--color-accent-fg)]">
                {formatCurrency(
                  showConverted
                    ? output.provisionedRecommendation.monthlySavingsUsd *
                        output.currencyTotals.fxRate
                    : output.provisionedRecommendation.monthlySavingsUsd,
                  currency,
                )}
              </span>{" "}
              / month by provisioning{" "}
              <span className="font-mono tabular-nums">
                {output.provisionedRecommendation.provisionedScuPerHour} SCU/hour
              </span>{" "}
              at $4 instead of paying $6 overage.{" "}
              <a
                href="/methodology#provisioning"
                className="text-[color:var(--color-text-muted)] underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
              >
                why
              </a>
            </span>
          </p>
        ) : null}
        {trace ? <div className="mt-3">{trace}</div> : null}
      </div>

      <dl className="grid grid-cols-3 divide-x divide-[color:var(--color-hairline)] border-t border-[color:var(--color-hairline)]">
        <div className="min-w-0 px-4 py-4">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
            Annual
          </dt>
          <dd className="mt-1 break-words font-mono text-[15px] tabular-nums text-[color:var(--color-text)]">
            {formatCurrency(annual, currency)}
          </dd>
          <p className="mt-0.5 text-[10px] text-[color:var(--color-text-subtle)]">
            monthly × 12
          </p>
        </div>
        <div className="min-w-0 px-4 py-4">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
            Pool
          </dt>
          <dd className="mt-1 break-words font-mono text-[15px] tabular-nums text-[color:var(--color-text)]">
            {formatScu(output.includedScuMonthly)}
            <span className="ml-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-text-subtle)]">
              {" "}
              SCU
            </span>
          </dd>
          <p className="mt-0.5 text-[10px] text-[color:var(--color-text-subtle)]">
            {output.includedScuMonthly > 0 ? "from M365 E5" : "no inclusion"}
          </p>
        </div>
        <div className="min-w-0 px-4 py-4">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
            Overage
          </dt>
          <dd className="mt-1 break-words font-mono text-[15px] tabular-nums text-[color:var(--color-text)]">
            {formatScu(output.billableOverageScuMonthly)}
            <span className="ml-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-text-subtle)]">
              {" "}
              SCU
            </span>
          </dd>
          <p className="mt-0.5 text-[10px] text-[color:var(--color-text-subtle)]">
            billed at ${output.billableOverageScuMonthly > 0 ? "6" : "0"}/SCU
          </p>
        </div>
      </dl>

      {fxWarning ? (
        <p className="mx-6 mb-4 mt-4 rounded-md border border-amber-400/30 bg-amber-300/[0.04] p-3 text-xs text-amber-100">
          {fxWarning}
        </p>
      ) : null}

      <p className="border-t border-[color:var(--color-hairline)] px-6 py-3 text-[11px] text-[color:var(--color-text-subtle)]">
        Planning estimate. Verify at{" "}
        <a
          href="https://securitycopilot.microsoft.com/usage-monitoring"
          target="_blank"
          rel="noopener"
          className="text-[color:var(--color-text-muted)] underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
        >
          securitycopilot.microsoft.com/usage-monitoring
        </a>
        .
      </p>

      {actions ? (
        <div className="border-t border-[color:var(--color-hairline)] bg-white/[0.015] px-6 py-3">
          {actions}
        </div>
      ) : null}
    </section>
  );
};
