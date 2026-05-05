import { type Metadata } from "next";

import { CalculatorShell } from "~/components/scu/calculator-shell";
import { HomeFaq } from "~/components/scu/home-faq";
import { JsonLd } from "~/components/scu/json-ld";
import { BUILD_DATE, SITE_URL } from "~/lib/scu/constants";
import { FAQ_ENTRIES } from "~/lib/scu/faq";
import {
  buildBreadcrumbLd,
  buildFaqLd,
  buildSoftwareApplicationLd,
} from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title: "Microsoft Security Copilot SCU Calculator — Free Pricing Estimator",
  description:
    "Estimate Microsoft Security Copilot SCU cost in under 60 seconds. Includes the M365 E5 and E7 auto-inclusion formula and per-agent SCU consumption. No Azure login required.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    title: "Microsoft Security Copilot SCU Calculator",
    description:
      "Free SCU cost estimator with the official E5 and E7 inclusion formula and Microsoft Security Store agent catalogue.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SCU Calculator" }],
  },
};

const formatBuildDate = (raw: string): string => {
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return raw;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd id="ld-software" data={buildSoftwareApplicationLd()} />
      <JsonLd id="ld-faq" data={buildFaqLd(FAQ_ENTRIES)} />
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
        ])}
      />

      <div className="mx-auto w-full max-w-6xl space-y-10">
        <CalculatorShell />

        <section
          aria-label="What you need to know"
          className="mx-auto max-w-3xl space-y-5 border-t border-white/5 pt-10 text-[15px] leading-relaxed text-[color:var(--color-text-muted)]"
        >
          <p>
            <strong className="text-[color:var(--color-text)]">Security Compute Units</strong> meter
            Microsoft Security Copilot consumption. Microsoft does not publish per-operation
            SCU rates. Their billing-math examples illustrate with a hypothetical prompt at
            3 SCU, an incident summary at 0.5 SCU, and a promptbook at 3.7 SCU — these are
            teaching scenarios, not benchmarks. Real consumption depends on prompt
            complexity and is only visible in your tenant&apos;s usage dashboard.
          </p>
          <p>
            Microsoft auto-includes a free SCU pool with paid Microsoft 365 E5 and E7
            using the formula{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[color:var(--color-text)]">
              min(10000, paid_E5_users / 1000 × 400)
            </code>{" "}
            SCU per month, capped at 10,000. Consumption beyond that bills at $6 USD per
            SCU. E3 is not part of the inclusion as of May 2026 — see the{" "}
            <a
              href="https://learn.microsoft.com/copilot/security/security-copilot-inclusion"
              target="_blank"
              rel="noopener"
              className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
            >
              Microsoft Learn inclusion FAQ
            </a>
            .
          </p>
          <p>
            Microsoft has only published per-run rates for the Conditional Access
            Optimization and Identity Risk Management agents (less than 1 SCU per run on
            average). For everything else this calculator uses 1 SCU per run as a
            conservative upper bound — verify against your tenant&apos;s usage dashboard.
          </p>
        </section>

        <HomeFaq />

        <p className="text-center text-xs text-[color:var(--color-text-subtle)]">
          Sourced from Microsoft Learn · Last updated{" "}
          <time dateTime={BUILD_DATE} className="text-[color:var(--color-text-muted)]">
            {formatBuildDate(BUILD_DATE)}
          </time>
        </p>
      </div>
    </main>
  );
}
