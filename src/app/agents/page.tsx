import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import { SITE_URL } from "~/lib/scu/constants";
import {
  buildAgentItemListLd,
  buildBreadcrumbLd,
} from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title: "Security Copilot agent SCU consumption reference",
  description:
    "Reference table of Microsoft Security Copilot agents with estimated SCU per run, source provenance, and links to Microsoft Learn documentation.",
  alternates: { canonical: "/agents" },
};

export default function AgentsPage() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd id="ld-agents" data={buildAgentItemListLd()} />
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "Agents", url: `${SITE_URL}/agents` },
        ])}
      />
      <article className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            Agents
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            Microsoft Security Copilot agents and SCU consumption
          </h1>
          <p className="max-w-2xl text-sm text-[color:var(--color-text-muted)]">
            Microsoft has published per-run SCU rates for two agents only. Every other rate on this
            page is a conservative upper bound drawn from Microsoft billing reference examples.
            Verify actual consumption in the Security Copilot usage dashboard at{" "}
            <a
              href="https://securitycopilot.microsoft.com/usage-monitoring"
              target="_blank"
              rel="noopener"
              className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2"
            >
              securitycopilot.microsoft.com/usage-monitoring
            </a>
            .
          </p>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-[color:var(--color-text-subtle)]">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Agent
                </th>
                <th scope="col" className="px-4 py-3">
                  Product
                </th>
                <th scope="col" className="px-4 py-3">
                  SCU/run
                </th>
                <th scope="col" className="px-4 py-3">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {SECURITY_COPILOT_AGENTS.map((agent) => (
                <tr key={agent.id} id={agent.id}>
                  <td className="px-4 py-3 align-top">
                    <a
                      href={agent.docsUrl}
                      target="_blank"
                      rel="noopener"
                      className="font-semibold text-[color:var(--color-text)] underline decoration-slate-600 underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
                    >
                      {agent.name}
                    </a>
                    <p className="mt-1 text-xs text-[color:var(--color-text-subtle)]">{agent.description}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-[color:var(--color-text-muted)]">{agent.product}</td>
                  <td className="px-4 py-3 align-top font-mono tabular-nums text-[color:var(--color-text)]">
                    {agent.scuPerRun}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={
                        agent.source === "microsoft"
                          ? "rounded-full bg-emerald-300/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
                          : "rounded-full bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                      }
                    >
                      {agent.source === "microsoft" ? "Microsoft" : "Estimate"}
                    </span>
                    <p className="mt-1 text-[11px] leading-snug text-[color:var(--color-text-subtle)]">
                      {agent.sourceNote}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
