import Link from "next/link";

import { FAQ_ENTRIES } from "~/lib/scu/faq";

export const HomeFaq = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-3xl scroll-mt-16 space-y-4 border-t border-white/5 pt-10"
    >
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="text-2xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-3xl"
        >
          Frequently asked questions
        </h2>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Short answers below — see{" "}
          <Link
            href="/faq"
            className="text-[color:var(--color-accent-fg)] underline decoration-[color:var(--color-accent)]/40 underline-offset-2 hover:text-[color:var(--color-text)]"
          >
            /faq
          </Link>{" "}
          for the long form.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)]">
        {FAQ_ENTRIES.map((entry, index) => (
          <details
            key={entry.id}
            id={entry.id}
            className={`group scroll-mt-16 [&_summary::-webkit-details-marker]:hidden ${
              index > 0 ? "border-t border-[color:var(--color-hairline)]" : ""
            }`}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-[color:var(--color-text)] hover:text-[color:var(--color-accent-fg)]">
              <span>{entry.question}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0 transform text-[color:var(--color-text-subtle)] transition group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 8 4 4 4-4" />
              </svg>
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};
