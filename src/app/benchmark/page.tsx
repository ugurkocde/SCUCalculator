import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import {
  type BenchmarkCohort,
  buildBenchmarkSnapshot,
} from "~/lib/scu/benchmark-aggregator";
import { BENCHMARK_NOTES, cohortKey } from "~/lib/scu/benchmark-notes";
import { SITE_URL } from "~/lib/scu/constants";
import { buildBreadcrumbLd } from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title:
    "Community benchmark — real Security Copilot pricing observations",
  description:
    "Observed Microsoft Security Copilot SCU pricing from real tenants, anonymized into cohort medians by paid-user size and license tier. Refreshed continuously.",
  alternates: { canonical: "/benchmark" },
};

export const revalidate = 300;

const PAID_USER_BAND_LABEL: Record<string, string> = {
  "1_249": "1-249 paid users",
  "250_999": "250-999 paid users",
  "1000_4999": "1,000-4,999 paid users",
  "5000_24999": "5,000-24,999 paid users",
  "25000_plus": "25,000+ paid users",
};

const LICENSE_TIER_LABEL: Record<string, string> = {
  e5_security: "M365 E5 / E7",
  m365_e3: "M365 E3",
  standalone: "Standalone (PAYG)",
};

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatScu = (value: number | null): string =>
  value === null ? "—" : `${integerFormatter.format(value)} SCU`;

const formatUsd = (value: number | null): string =>
  value === null ? "—" : usdFormatter.format(value);

const formatCount = (value: number | null): string =>
  value === null ? "—" : integerFormatter.format(value);

const formatPct = (value: number | null): string => {
  if (value === null) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
};

const cohortLabel = (cohort: BenchmarkCohort): string => {
  if (!cohort.paidUserBand && !cohort.licenseTier) return "All submissions";
  if (cohort.paidUserBand && !cohort.licenseTier)
    return PAID_USER_BAND_LABEL[cohort.paidUserBand]!;
  if (!cohort.paidUserBand && cohort.licenseTier)
    return LICENSE_TIER_LABEL[cohort.licenseTier]!;
  return `${LICENSE_TIER_LABEL[cohort.licenseTier!]} · ${PAID_USER_BAND_LABEL[cohort.paidUserBand!]}`;
};

const CohortBlock = ({ cohort }: { cohort: BenchmarkCohort }) => {
  const note = BENCHMARK_NOTES[cohortKey(cohort.paidUserBand, cohort.licenseTier)];
  const gapClass =
    cohort.observedVsComputedDeltaPct === null
      ? "text-[color:var(--color-text-subtle)]"
      : cohort.observedVsComputedDeltaPct >= 0
        ? "text-amber-200"
        : "text-emerald-200";

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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
              <th className="pb-2 font-medium">&nbsp;</th>
              <th className="pb-2 font-medium">Observed</th>
              <th className="pb-2 font-medium">Calculator</th>
              <th className="pb-2 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            <tr>
              <td className="py-1 pr-3 font-sans text-[color:var(--color-text-muted)]">
                Median monthly SCU
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatScu(cohort.medianObservedMonthlyScu)}
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">—</td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">—</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-sans text-[color:var(--color-text-muted)]">
                Median monthly USD
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatUsd(cohort.medianObservedMonthlyCostUsd)}
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatUsd(cohort.medianComputedMonthlyUsd)}
              </td>
              <td className={`py-1 ${gapClass}`}>
                {formatPct(cohort.observedVsComputedDeltaPct)}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-sans text-[color:var(--color-text-muted)]">
                Median licensed users
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatCount(cohort.medianLicensedUsers)}
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">
                (input)
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">—</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-sans text-[color:var(--color-text-muted)]">
                Median agents
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatCount(cohort.medianAgentCount)}
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">
                (input)
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">—</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-sans text-[color:var(--color-text-muted)]">
                Median messages / workday
              </td>
              <td className="py-1 text-[color:var(--color-text)]">
                {formatCount(cohort.medianMessagesPerWorkday)}
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">
                (input)
              </td>
              <td className="py-1 text-[color:var(--color-text-subtle)]">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {note ? (
        <blockquote className="mt-4 border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.05] p-3 text-sm italic leading-relaxed text-[color:var(--color-text-muted)]">
          {note}
        </blockquote>
      ) : null}
    </section>
  );
};

export default async function BenchmarkPage() {
  const snapshot = await buildBenchmarkSnapshot();
  const hasAnyCohort =
    snapshot.totalSubmissions > 0 &&
    (snapshot.overall !== null ||
      snapshot.byPaidUserBand.length > 0 ||
      snapshot.byLicenseTier.length > 0 ||
      snapshot.byPaidUserBandAndLicenseTier.length > 0);

  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "Community benchmark", url: `${SITE_URL}/benchmark` },
        ])}
      />

      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            Community benchmark
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            Real-world Security Copilot pricing
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--color-text-muted)]">
            Observed Microsoft Security Copilot pricing from anonymous tenant
            submissions, grouped by paid-user size and license tier. Refreshed
            continuously. Treat as community signal, not a controlled
            benchmark — sample sizes vary, and small cohorts are hidden.
          </p>
          <p className="text-sm text-[color:var(--color-text-subtle)]">
            Want to contribute your numbers?{" "}
            <Link href="/" className="underline">
              Use the calculator
            </Link>{" "}
            and click <em>Share your SCU usage</em>. No tenant identifiers, IP
            address, or raw user agent are stored. Machine-readable export:{" "}
            <a href="/benchmark.json" className="underline">
              /benchmark.json
            </a>
            .
          </p>
        </header>

        {!hasAnyCohort ? (
          <p className="rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] p-4 text-sm text-[color:var(--color-text-muted)]">
            Not enough submissions yet. Be the first to{" "}
            <Link href="/" className="underline">
              share your numbers
            </Link>{" "}
            — once at least {snapshot.minCohortN} tenants in a cohort have
            contributed, their median appears here.
          </p>
        ) : (
          <>
            <p className="text-xs text-[color:var(--color-text-subtle)]">
              Based on {snapshot.totalSubmissions}{" "}
              {snapshot.totalSubmissions === 1 ? "submission" : "submissions"}.
              Cohorts with fewer than {snapshot.minCohortN} submissions are
              hidden to protect anonymity. Gaps compare median observed cost to
              the SCU Calculator&apos;s recomputed estimate at submission time.
            </p>

            {snapshot.overall ? (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                  Overall
                </h2>
                <CohortBlock cohort={snapshot.overall} />
              </section>
            ) : null}

            {snapshot.byPaidUserBand.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                  By tenant size
                </h2>
                <div className="space-y-4">
                  {snapshot.byPaidUserBand.map((cohort) => (
                    <CohortBlock key={cohort.paidUserBand} cohort={cohort} />
                  ))}
                </div>
              </section>
            ) : null}

            {snapshot.byLicenseTier.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                  By license tier
                </h2>
                <div className="space-y-4">
                  {snapshot.byLicenseTier.map((cohort) => (
                    <CohortBlock key={cohort.licenseTier} cohort={cohort} />
                  ))}
                </div>
              </section>
            ) : null}

            {snapshot.byPaidUserBandAndLicenseTier.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                  By license tier · tenant size
                </h2>
                <div className="space-y-4">
                  {snapshot.byPaidUserBandAndLicenseTier.map((cohort) => (
                    <CohortBlock
                      key={`${cohort.licenseTier}-${cohort.paidUserBand}`}
                      cohort={cohort}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <footer className="border-t border-[color:var(--color-hairline)] pt-4 text-xs text-[color:var(--color-text-subtle)]">
          Snapshot generated {new Date(snapshot.generatedAt).toLocaleString()}.
          Formula version: <code className="font-mono">{snapshot.formulaVersion}</code>.
        </footer>
      </article>
    </main>
  );
}
