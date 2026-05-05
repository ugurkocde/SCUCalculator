import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import { SCU_SOURCES, SITE_URL } from "~/lib/scu/constants";
import {
  buildBreadcrumbLd,
  buildMethodologyArticleLd,
} from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title: "Methodology and sources",
  description:
    "How the SCU Calculator computes Microsoft Security Copilot cost: formulas, defaults, agent rate provenance, and the Microsoft Learn citations behind every number.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd id="ld-tech-article" data={buildMethodologyArticleLd()} />
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "Methodology", url: `${SITE_URL}/methodology` },
        ])}
      />
      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            Methodology
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            How this calculator works
          </h1>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">Core formulas</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            <li>
              <strong className="text-[color:var(--color-text)]">Included pool</strong>: for M365 E5 or E7 tenants,
              <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[color:var(--color-text)]">
                min(10000, paid_E5_users / 1000 × 400)
              </code>
              SCU per month. Capped at 10,000 SCU per month.
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Workload</strong>:{" "}
              <code className="font-mono text-xs">chat_admins × msgs_per_admin_per_workday × 22 working_days × 0.25 SCU + agent_picker contribution</code>{" "}
              (when the per-experience split isn&apos;t active).
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Billing month</strong>: 730 hours.{" "}
              <strong className="text-[color:var(--color-text)]">Billing year</strong>: 8,760 hours.
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Cost (E5 mode)</strong>:{" "}
              <code className="font-mono text-xs">max(0, monthly_consumed_SCU - included_SCU) × overage_rate</code>{" "}
              billed monthly. Overage is metered at one-decimal precision per consumed
              SCU. The hourly figure shown in the result card is purely{" "}
              <code className="font-mono text-xs">monthly ÷ 730</code> for sizing
              intuition; E5 + overage has no hourly billing.
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Cost (provisioned mode)</strong>:{" "}
              <code className="font-mono text-xs">provisioned_SCU/hr × provisioned_rate + max(0, consumed - provisioned) × overage_rate</code>.
            </li>
          </ul>
        </section>

        <section id="chat-rate" className="space-y-3 scroll-mt-16">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
            Where the 0.25 SCU/message rate comes from
          </h2>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Microsoft does not publish a per-prompt SCU rate. Their billing-math
            example shows three illustrative operations:
          </p>
          <ul className="space-y-1 pl-5 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            <li>
              <strong className="text-[color:var(--color-text)]">Heavy prompt</strong>{" "}
              (40-second execution): 3.0 SCU
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Incident summarization</strong>:
              0.5 SCU
            </li>
            <li>
              <strong className="text-[color:var(--color-text)]">Promptbook</strong>: 3.7 SCU
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Microsoft labels these as &ldquo;Example billing scenarios&rdquo; — illustrative
            for teaching the math, not benchmarks. Their FAQ says explicitly: <em>&ldquo;Because
            every prompt and workflow varies in complexity, SCU consumption isn&apos;t
            fixed.&rdquo;</em>
          </p>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            This calculator anchors the chat-message rate at{" "}
            <strong className="text-[color:var(--color-text)]">0.25 SCU per message</strong> —
            half of the documented 0.5 SCU &ldquo;incident feature&rdquo; reference. The
            reasoning: a single chat prompt is mechanically lighter than a full incident
            summarization (which processes alerts, evidence, related entities). 0.25
            sits in a defensible middle: heavier than &ldquo;trivial,&rdquo; lighter than the
            documented incident reference. Real per-message consumption varies with
            prompt complexity and entity scope; verify against your tenant&apos;s usage
            dashboard.
          </p>
        </section>

        <section id="provisioning" className="space-y-3 scroll-mt-16">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
            Why provisioning saves money over pure overage
          </h2>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Microsoft bills Security Copilot two ways. <strong className="text-[color:var(--color-text)]">Provisioned</strong>{" "}
            capacity is committed by the hour at $4 USD per SCU per hour — you pay
            <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[color:var(--color-text)]">
              N × $4 × 730
            </code>{" "}
            every month whether you use it or not. <strong className="text-[color:var(--color-text)]">Overage</strong>{" "}
            consumption (above the included pool or your committed capacity) is pay-as-you-go at $6 USD per SCU.
          </p>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Calculator default is $6/SCU because the auto-included E5 / E7 pool covers everything up to its
            cap; once exhausted, the next SCU bills as overage. To recommend provisioning, this calculator
            assumes <em>steady-state</em> usage and computes
            <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-[color:var(--color-text)]">
              N = ceil(monthly_overage_SCU / 730)
            </code>{" "}
            — the smallest integer commitment that fully absorbs your projected overage at the cheaper $4
            rate. Below ~487 SCU/month of overage, even a single committed SCU/hour is more expensive than
            pure pay-as-you-go, so no recommendation is shown.
          </p>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Real usage is rarely steady — peaks and idle periods both move the optimum. Treat the
            recommendation as a ceiling: in practice you may want to commit slightly less and let the rest
            float as overage. Verify against your tenant&apos;s usage dashboard before committing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">Agent SCU rate provenance</h2>
          <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
            Microsoft has published per-run rates only for the Conditional Access
            Optimization Agent and the Identity Risk Management Agent — both documented
            verbatim as &ldquo;On average, each agent run consumes less than one SCU&rdquo; on
            Microsoft Learn. For every other agent, Microsoft explicitly does not publish a
            per-run rate and instead points to the in-tenant Security Copilot usage
            dashboard. This calculator defaults all unpublished agents to 0.5 SCU/run,
            anchored to the incident-summarisation reference (0.5 SCU) used in Microsoft&apos;s
            billing-math example. Agent cards label each rate as either{" "}
            <span className="text-emerald-200">Microsoft</span> (documented) or{" "}
            <span className="text-amber-200">Estimate</span> (anchored to the closest
            Microsoft reference number). Earlier versions of this calculator used 1.0 SCU
            as a conservative upper bound; that produced cost estimates roughly 2× the
            consumption observed by Microsoft product teams in customer environments and
            has been corrected.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">Sources</h2>
          <ul className="space-y-3 text-sm">
            {SCU_SOURCES.map((source) => (
              <li
                key={source.id}
                className="rounded-md border border-white/10 bg-white/[0.02] p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
                  {source.publisher}
                </p>
                <Link
                  href={source.url}
                  target="_blank"
                  rel="noopener"
                  className="mt-1 block font-semibold text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
                >
                  {source.title}
                </Link>
                <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">{source.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-[color:var(--color-text-subtle)]">
          <Link
            href="/"
            className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
          >
            Back to the calculator
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
