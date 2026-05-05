import Image from "next/image";

interface FlowStepProps {
  index: number;
  title: string;
  hint: string;
  iconColor: string;
  children: React.ReactNode;
}

const FlowStep = ({ index, title, hint, iconColor, children }: FlowStepProps) => (
  <div className="relative flex flex-col items-center gap-3 rounded-xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)]/60 p-4 text-center sm:p-5">
    <span
      className="absolute -top-2.5 left-3 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] font-mono text-[10px] font-semibold text-[color:var(--color-text-muted)]"
      aria-hidden="true"
    >
      {index}
    </span>
    <div
      className="flex h-14 w-14 items-center justify-center"
      style={{ color: iconColor }}
      aria-hidden="true"
    >
      {children}
    </div>
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]">
        {title}
      </p>
      <p className="text-[11px] leading-snug text-[color:var(--color-text-subtle)]">
        {hint}
      </p>
    </div>
  </div>
);

const Arrow = ({ accent = false }: { accent?: boolean }) => (
  <div
    className="hidden items-center justify-center md:flex"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 60 16"
      className={`h-4 w-12 ${accent ? "text-amber-300/70" : "text-[color:var(--color-accent)]/60"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 8 H50" strokeDasharray="3 3" className="scu-flow-arrow" />
      <path d="M46 3 L52 8 L46 13" />
    </svg>
  </div>
);

const LicenseIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
    <rect x="4" y="6" width="24" height="20" rx="2.5" />
    <path d="M9 12h14M9 16h10M9 20h7" />
  </svg>
);

const PoolIcon = () => (
  <svg viewBox="0 0 32 32" className="h-10 w-10">
    <defs>
      <clipPath id="pool-clip">
        <rect x="6" y="6" width="20" height="22" rx="2.5" />
      </clipPath>
    </defs>
    <rect
      x="6"
      y="6"
      width="20"
      height="22"
      rx="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <rect
      x="6"
      y="10"
      width="20"
      height="18"
      fill="currentColor"
      opacity="0.25"
      clipPath="url(#pool-clip)"
      className="scu-flow-pool-fill"
    />
    <path d="M6 10 H26" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="2 2" />
  </svg>
);

const AgentIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
    <circle cx="16" cy="13" r="4" />
    <path d="M7 26c1.5-4 5-6 9-6s7.5 2 9 6" />
    <circle cx="16" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

const OverageIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
    <circle cx="16" cy="16" r="10" />
    <path d="M19 12c-1-1.5-2.5-2-4-2-2.2 0-3.5 1.2-3.5 2.7 0 4 7 2.5 7 6.6 0 1.7-1.5 2.7-3.5 2.7-1.5 0-3-.5-4-2" />
    <path d="M16 7v3M16 22v3" />
  </svg>
);

export const ScuFlowDiagram = () => {
  const accent = "var(--color-accent-fg)";
  const amber = "var(--color-text-muted)";

  return (
    <section
      className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-6 sm:p-8"
      aria-labelledby="scu-flow-heading"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
          How it works
        </p>
        <h2
          id="scu-flow-heading"
          className="text-xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-2xl"
        >
          The SCU lifecycle in one picture
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <FlowStep
          index={1}
          title="Your licence"
          hint="M365 E5 / E7 auto-fills a free pool every month"
          iconColor={accent}
        >
          <LicenseIcon />
        </FlowStep>

        <Arrow />

        <FlowStep
          index={2}
          title="Included pool"
          hint="e.g. 400 SCU/month, resets on the 1st, doesn't roll over"
          iconColor={accent}
        >
          <PoolIcon />
        </FlowStep>

        <Arrow />

        <FlowStep
          index={3}
          title="Agents drink"
          hint="each agent run, prompt or promptbook draws SCUs from the pool"
          iconColor={accent}
        >
          <AgentIcon />
        </FlowStep>

        <Arrow accent />

        <FlowStep
          index={4}
          title="Overage if empty"
          hint="$6 per consumed SCU — only when the pool is dry"
          iconColor={amber}
        >
          <OverageIcon />
        </FlowStep>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end">
        <p className="max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-muted)]">
          Think of SCUs like a prepaid bucket. Your M365 E5 / E7 licence refills
          the bucket on the first of each month. Every time an agent runs (e.g.
          someone reports a phishing email and the Phishing Triage Agent
          investigates), it scoops a small amount of SCU from the bucket —
          typically around 0.5 SCU per run. Whatever you don&apos;t use
          disappears at month-end. Once the bucket is empty, additional usage
          bills as overage at $6 per consumed SCU. You only ever pay for runs
          that actually happen.
        </p>

        <figure className="relative flex flex-col gap-3 rounded-xl border border-[color:var(--color-hairline)] bg-white/[0.02] p-4 pl-5 sm:pl-16 md:ml-auto md:max-w-sm">
          <span
            aria-hidden="true"
            className="absolute -left-2 top-3 font-serif text-4xl leading-none text-[color:var(--color-accent)]/40 sm:-left-1"
          >
            “
          </span>
          <blockquote className="text-[13px] italic leading-relaxed text-[color:var(--color-text-muted)] sm:pr-2">
            Most triage agents I&apos;ve seen in real tenants run well below 0.5
            SCU. It&apos;s a fair upper bound for planning — actual usage
            depends on the entities each run touches.
          </blockquote>
          <figcaption className="flex items-center gap-2 pt-1 text-xs text-[color:var(--color-text-subtle)]">
            <Image
              src="/ugur-koc.jpg"
              alt="Ugur Koc"
              width={64}
              height={64}
              className="h-8 w-8 rounded-full border border-[color:var(--color-hairline)] object-cover"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-semibold text-[color:var(--color-text)]">
                Ugur Koc
              </span>
              <a
                href="https://www.linkedin.com/in/ugurkocde/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-[10px] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)]"
              >
                LinkedIn
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="currentColor"
                >
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
                </svg>
              </a>
            </span>
          </figcaption>
        </figure>
      </div>

      <style>{`
        @keyframes scu-pool-cycle {
          0%   { transform: translateY(0%); }
          45%  { transform: translateY(70%); }
          55%  { transform: translateY(70%); }
          60%  { transform: translateY(0%); }
          100% { transform: translateY(0%); }
        }
        @keyframes scu-arrow-march {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -12; }
        }
        .scu-flow-pool-fill {
          transform-origin: top;
          animation: scu-pool-cycle 6s ease-in-out infinite;
        }
        .scu-flow-arrow {
          animation: scu-arrow-march 1.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .scu-flow-pool-fill,
          .scu-flow-arrow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};
