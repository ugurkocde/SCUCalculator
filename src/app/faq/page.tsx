import { type Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "~/components/scu/json-ld";
import { SITE_URL } from "~/lib/scu/constants";
import { FAQ_ENTRIES } from "~/lib/scu/faq";
import { buildBreadcrumbLd, buildFaqLd } from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  title: "Security Copilot SCU pricing FAQ",
  description:
    "Answers to the most common questions about Microsoft Security Copilot SCU pricing, E5 and E7 inclusion, and per-agent consumption.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-[color:var(--color-text)] lg:pb-16 lg:pt-12">
      <JsonLd id="ld-faq" data={buildFaqLd(FAQ_ENTRIES)} />
      <JsonLd
        id="ld-breadcrumb"
        data={buildBreadcrumbLd([
          { name: "SCU Calculator", url: `${SITE_URL}/` },
          { name: "FAQ", url: `${SITE_URL}/faq` },
        ])}
      />
      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
            FAQ
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            Security Copilot SCU pricing — frequently asked questions
          </h1>
        </header>

        <dl className="space-y-6">
          {FAQ_ENTRIES.map((entry) => (
            <div
              key={entry.id}
              id={entry.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <dt className="text-lg font-semibold text-[color:var(--color-text)]">{entry.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-muted)]">{entry.answer}</dd>
            </div>
          ))}
        </dl>

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
