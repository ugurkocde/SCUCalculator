import { type Metadata } from "next";
import Link from "next/link";

import { CalculatorShell } from "~/components/scu/calculator-shell";
import { HomeFaq } from "~/components/scu/home-faq";
import { JsonLd } from "~/components/scu/json-ld";
import { SITE_URL } from "~/lib/scu/constants";
import { FAQ_ENTRIES } from "~/lib/scu/faq";
import {
  buildBreadcrumbLd,
  buildFaqLd,
  buildSoftwareApplicationLd,
} from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  // Homepage title intentionally bypasses the layout template ("%s | SCU Calculator")
  // because the brand is already in the title. Kept under 60 chars so Google does
  // not truncate the SERP listing.
  title: "Security Copilot SCU Calculator — Free Cost Estimator",
  description:
    "Free Microsoft Security Copilot pricing calculator. Estimate monthly SCU cost with the official E5 and E7 inclusion formula and per-agent consumption rates.",
  alternates: { canonical: "/" },
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

      <h1 className="sr-only">
        Microsoft Security Copilot SCU Calculator — free monthly cost estimator
      </h1>
      <section className="sr-only" aria-label="About this calculator">
        <p>
          Use this tool to calculate Microsoft Security Copilot SCU cost in
          under 60 seconds. The SCU Calculator is a free pricing tool built
          and maintained by Ugur Koc, a Microsoft MVP. It estimates monthly
          Security Compute Unit (SCU) cost using formulas published by
          Microsoft.
        </p>
        <p>
          A Security Compute Unit (SCU) is the metering unit Microsoft uses to
          bill Security Copilot consumption. Microsoft auto-includes a free SCU
          pool for paid Microsoft 365 E5 and E7 tenants at 0.4 SCU per paid
          license per month, capped at 10,000 SCU/month — the cap is reached
          at 25,000 paid licenses. The pool resets on the first of each month
          and does not roll over. Consumption beyond the included pool bills
          as overage at $6 USD per SCU. Provisioned capacity is committed by
          the hour at $4 USD per SCU per hour. Microsoft 365 E3 is not part
          of the inclusion.
        </p>
        <p>
          The calculator accepts three primary inputs: license profile (E5, E7,
          or pay-as-you-go), chat administrator workload (number of admins,
          messages per workday across 22 working days), and selected Security
          Copilot agents from the published catalogue with documented or
          estimated SCU per run.
        </p>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-10">
        <p className="text-center text-sm text-[color:var(--color-text-muted)]">
          New to Security Copilot?{" "}
          <Link
            href="/value"
            className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
          >
            See what teams report they save
          </Link>{" "}
          before you calculate the cost.
        </p>
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
            complexity and is only visible in your tenant&apos;s usage dashboard. See our{" "}
            <Link
              href="/methodology"
              className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
            >
              full methodology
            </Link>{" "}
            for the sourcing behind every number.
          </p>
          <p>
            Microsoft auto-includes a free SCU pool with paid Microsoft 365 E5 and E7 at{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[color:var(--color-text)]">
              0.4 SCU × paid_E5_users
            </code>{" "}
            per month, capped at 10,000 SCU — the cap is hit at 25,000 paid licenses.
            (Microsoft&apos;s docs phrase the same rate as &ldquo;400 SCU per 1,000
            paid licenses.&rdquo;) The pool resets on the 1st of each month and unused
            SCUs do not roll over. Consumption beyond the pool bills as overage at
            $6 USD per SCU, billed at one-decimal precision. E3 is not part of the
            inclusion — see the{" "}
            <Link
              href="/faq"
              className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
            >
              detailed FAQ
            </Link>{" "}
            or the{" "}
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
            average). For everything else, see the{" "}
            <Link
              href="/agents"
              className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
            >
              per-agent SCU table
            </Link>{" "}
            — verify against your tenant&apos;s usage dashboard.
          </p>
        </section>

        <HomeFaq />

        <p className="text-center text-xs text-[color:var(--color-text-subtle)]">
          Sourced from Microsoft Learn
        </p>
      </div>
    </main>
  );
}
