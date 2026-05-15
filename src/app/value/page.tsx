import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import { ValueResults } from "~/components/scu/value-results";
import { SITE_URL } from "~/lib/scu/constants";
import { buildBreadcrumbLd } from "~/lib/scu/structured-data";
import { buildValueSnapshot } from "~/lib/scu/value-aggregator";

export const metadata: Metadata = {
  title:
    "Community value — hours saved by Security Copilot use case",
  description:
    "Anonymous, decision-maker-reported hours saved per month by Security Copilot use case. Adjust the hourly rate on the page to see a dollar value in your own terms.",
  alternates: { canonical: "/value" },
};

export const revalidate = 300;

export default async function ValuePage() {
  const snapshot = await buildValueSnapshot();

  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "Community value", url: `${SITE_URL}/value` },
        ])}
      />

      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            Community value
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            What teams get back from Security Copilot
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--color-text-muted)]">
            Anonymous, decision-maker-reported hours saved per month by use
            case. The community signal is hours. The dollar figure is computed
            live from the hourly rate you set below — your number, your call.
          </p>
          <p className="text-sm text-[color:var(--color-text-subtle)]">
            Looking for the cost side?{" "}
            <Link href="/benchmark" className="underline">
              Community benchmark
            </Link>
            . Machine-readable export:{" "}
            <a href="/value.json" className="underline">
              /value.json
            </a>
            .
          </p>
        </header>

        <ValueResults snapshot={snapshot} />

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
                Self-reported.
              </strong>{" "}
              Hours are decision-maker-reported team aggregates, not measured
              from logs. Treat as directional, not precise.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Selection bias.
              </strong>{" "}
              Teams who feel they get value are more likely to contribute. Read
              the medians as &ldquo;what successful adopters report&rdquo;, not
              &ldquo;what an average tenant will see.&rdquo;
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Rate is illustrative.
              </strong>{" "}
              The dollar figure is hours × your rate. We don&apos;t store rates
              or compute a vendor-imposed dollar figure. Loaded labor costs
              vary 2–3x by region and seniority — use a number your team
              recognizes.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                Cohorts under {snapshot.minCohortN} are hidden.
              </strong>{" "}
              We don&apos;t publish a median until at least {snapshot.minCohortN}{" "}
              teams have contributed to a use case.
            </li>
            <li>
              <strong className="font-semibold text-[color:var(--color-text)]">
                No tenant identifiers.
              </strong>{" "}
              No email, tenant ID, company name, domain, free-text notes, IP
              address, hourly rate, or raw user agent is stored. Contributions
              are coarse-banded by region and license size if the contributor
              opts in.
            </li>
          </ul>
        </section>

        <footer className="border-t border-[color:var(--color-hairline)] pt-4 text-xs text-[color:var(--color-text-subtle)]">
          Snapshot generated {new Date(snapshot.generatedAt).toLocaleString()}.
          Schema version: <code className="font-mono">{snapshot.schemaVersion}</code>.
        </footer>
      </article>
    </main>
  );
}
