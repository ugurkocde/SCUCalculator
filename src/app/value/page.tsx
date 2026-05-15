import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import { ValueResults } from "~/components/scu/value-results";
import { SITE_URL } from "~/lib/scu/constants";
import { buildBreadcrumbLd } from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title:
    "Security Copilot agent value — hours saved and net monthly value per agent",
  description:
    "Per-agent ROI for every Microsoft Security Copilot first-party agent: SCU cost, hours saved per run, and net monthly value at your team's hourly rate. Sourced from Microsoft Learn and conservative analyst-handling-time anchors.",
  alternates: { canonical: "/value" },
};

export default function ValuePage() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "Agent value", url: `${SITE_URL}/value` },
        ])}
      />

      <article className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            Agent value
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            What each Security Copilot agent is worth
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--color-text-muted)]">
            Per-agent ROI computed from Microsoft&apos;s published SCU rates,
            conservative analyst-time-saved estimates, and your hourly rate.
            Every input is transparent and adjustable — your numbers, your call.
          </p>
          <p className="text-sm text-[color:var(--color-text-subtle)]">
            Looking for the tenant-level cost?{" "}
            <Link href="/" className="underline">
              Use the calculator
            </Link>
            . Real-world cost benchmarks:{" "}
            <Link href="/benchmark" className="underline">
              /benchmark
            </Link>
            . Machine-readable export:{" "}
            <a href="/value.json" className="underline">
              /value.json
            </a>
            .
          </p>
        </header>

        <ValueResults />

        <section
          aria-label="Methodology"
          className="space-y-3 rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5 text-sm leading-relaxed text-[color:var(--color-text-muted)]"
        >
          <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
            Methodology &amp; honesty notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                SCU per run.
              </strong>{" "}
              Where Microsoft publishes a range (e.g. &ldquo;less than one
              SCU&rdquo;), we anchor to the midpoint and label it{" "}
              <em>Microsoft (range)</em>. Where Microsoft does not publish at
              all, we anchor to the incident-summarisation reference (0.5 SCU)
              from their official billing-math example and label it{" "}
              <em>estimate</em>. Every agent card shows the provenance under
              &ldquo;Source notes.&rdquo;
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Hours saved per run.
              </strong>{" "}
              Microsoft does not currently publish per-agent time-saved figures.
              Defaults are conservative estimates anchored to independent
              analyst-handling-time research (SANS, Ponemon, IBM X-Force). They
              tend to <em>under</em>state value rather than overstate it. Each
              card shows the reasoning; adjust the value to match your team.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Cost = SCU/run × runs × $6.
              </strong>{" "}
              Uses Microsoft&apos;s published $6/SCU overage rate. Does
              <em>not</em> subtract the included E5/E7 SCU pool — that&apos;s a
              tenant-level offset belonging on the{" "}
              <Link
                href="/"
                className="underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
              >
                calculator
              </Link>
              . Per-agent cost shown here is the on-the-meter rate.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Savings = hours saved × your rate.
              </strong>{" "}
              The rate defaults to $100/hr and is editable above. Loaded labor
              costs vary 2–3x by region and seniority — use a number your team
              recognises.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                What &ldquo;savings&rdquo; means.
              </strong>{" "}
              Hours given back to your team are productivity, not always a
              direct P&amp;L line. Some hours get reallocated to higher-value
              work (productivity gain), some avoid headcount growth (real cost
              avoidance), some enable headcount reduction (direct savings). The
              dollar figure here is the labour value of the time, computed at
              your rate — interpret it in your own staffing context.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Nothing about your inputs leaves your browser.
              </strong>{" "}
              All overrides (include toggles, runs/month, hours saved/run,
              hourly rate) live in <code className="font-mono">localStorage</code>.
              No tenant identifier, telemetry, or analytics on your numbers.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Planning aid, not a guarantee.
              </strong>{" "}
              Verify per-run consumption against your tenant&apos;s usage
              dashboard at{" "}
              <a
                href="https://securitycopilot.microsoft.com/usage-monitoring"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
              >
                securitycopilot.microsoft.com/usage-monitoring
              </a>{" "}
              and calibrate the hours-saved estimates against your team&apos;s
              actual handling-time deltas.
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}
