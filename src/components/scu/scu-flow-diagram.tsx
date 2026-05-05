"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type FlowTone = "default" | "warning";

interface FlowStepProps {
  index: number;
  title: string;
  hint: string;
  tone?: FlowTone;
  chip?: string;
  children: React.ReactNode;
}

const FlowStep = ({
  index,
  title,
  hint,
  tone = "default",
  chip,
  children,
}: FlowStepProps) => {
  const isWarning = tone === "warning";

  return (
    <li
      className={`scu-flow-step relative flex flex-col items-center gap-3 rounded-xl border p-4 text-center sm:p-5 ${
        isWarning
          ? "border-[color:var(--color-warning-edge)] bg-[color:var(--color-warning-soft)]"
          : "border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)]/60"
      }`}
      style={{ "--step-index": index } as React.CSSProperties}
    >
      <span
        className={`absolute -top-2.5 left-3 inline-flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[11px] font-semibold ${
          isWarning
            ? "border-[color:var(--color-warning-edge)] bg-[color:var(--color-warning)] text-[color:var(--color-bg-base)]"
            : "border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] text-[color:var(--color-text)]"
        }`}
        aria-hidden="true"
      >
        {index}
      </span>
      <div
        className={`relative flex h-12 w-12 items-center justify-center ${
          isWarning ? "scu-flow-icon-warning" : ""
        }`}
        style={{
          color: isWarning
            ? "var(--color-warning-fg)"
            : "var(--color-accent-fg)",
        }}
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold leading-tight text-[color:var(--color-text)]">
          {title}
        </p>
        <p className="text-[11px] leading-snug text-[color:var(--color-text-subtle)]">
          {hint}
        </p>
        {chip && (
          <span
            className={`mt-1 inline-flex self-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${
              isWarning
                ? "border-[color:var(--color-warning-edge)] bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning-fg)]"
                : "border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] text-[color:var(--color-text-muted)]"
            }`}
          >
            {chip}
          </span>
        )}
      </div>
    </li>
  );
};

const Arrow = ({
  accent = false,
  withDroplets = false,
}: {
  accent?: boolean;
  withDroplets?: boolean;
}) => (
  <div
    className="flex items-center justify-center self-center"
    aria-hidden="true"
  >
    {/* Desktop: horizontal arrow */}
    <svg
      viewBox="0 0 60 16"
      className={`hidden h-4 w-12 md:block ${
        accent
          ? "text-[color:var(--color-warning-edge)]"
          : "text-[color:var(--color-accent)]/60"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 8 H50" strokeDasharray="3 3" className="scu-flow-arrow" />
      <path d="M46 3 L52 8 L46 13" />
      {withDroplets && (
        <>
          <circle
            cx="0"
            cy="0"
            r="1.4"
            fill="currentColor"
            className="scu-flow-droplet"
            style={{ animationDelay: "0s" }}
          />
          <circle
            cx="0"
            cy="0"
            r="1.1"
            fill="currentColor"
            className="scu-flow-droplet"
            style={{ animationDelay: "0.9s" }}
          />
        </>
      )}
    </svg>
    {/* Mobile: vertical chevron */}
    <svg
      viewBox="0 0 16 24"
      className={`h-5 w-4 md:hidden ${
        accent
          ? "text-[color:var(--color-warning-edge)]"
          : "text-[color:var(--color-accent)]/60"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2 V16" strokeDasharray="3 3" className="scu-flow-arrow-v" />
      <path d="M3 12 L8 18 L13 12" />
    </svg>
  </div>
);

const LicenseIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-9 w-9"
  >
    <rect x="4" y="6" width="24" height="20" rx="2.5" />
    <path d="M9 12h14M9 16h10M9 20h7" />
  </svg>
);

const PoolIcon = () => (
  <svg viewBox="0 0 32 32" className="h-9 w-9">
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
      y="6"
      width="20"
      height="22"
      fill="currentColor"
      opacity="0.28"
      clipPath="url(#pool-clip)"
      className="scu-flow-pool-fill"
    />
    <path
      d="M6 10 H26"
      stroke="currentColor"
      strokeOpacity="0.4"
      strokeDasharray="2 2"
    />
  </svg>
);

const AgentIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-9 w-9"
  >
    <circle cx="16" cy="13" r="4" />
    <path d="M7 26c1.5-4 5-6 9-6s7.5 2 9 6" />
    <circle cx="16" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

const OverageIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-9 w-9"
  >
    <circle cx="16" cy="16" r="10" />
    <path d="M19 12c-1-1.5-2.5-2-4-2-2.2 0-3.5 1.2-3.5 2.7 0 4 7 2.5 7 6.6 0 1.7-1.5 2.7-3.5 2.7-1.5 0-3-.5-4-2" />
    <path d="M16 7v3M16 22v3" />
  </svg>
);

export const ScuFlowDiagram = () => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      data-revealed={revealed ? "true" : "false"}
      className="scu-flow-section rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-6 sm:p-8"
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
          Why your bill won&apos;t surprise you
        </h2>
      </div>

      <ol className="mt-6 grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <FlowStep
          index={1}
          title="Your licence"
          hint="M365 E5 / E7 auto-fills a fresh pool every month"
        >
          <LicenseIcon />
        </FlowStep>

        <Arrow />

        <FlowStep
          index={2}
          title="Included pool"
          hint="e.g. 400 SCU/month, resets on the 1st, doesn't roll over"
        >
          <PoolIcon />
        </FlowStep>

        <Arrow withDroplets />

        <FlowStep
          index={3}
          title="Agents drink"
          hint="each agent run, prompt or promptbook draws SCUs from the pool"
        >
          <AgentIcon />
        </FlowStep>

        <Arrow accent />

        <FlowStep
          index={4}
          title="Only then: overage"
          hint="$6 per consumed SCU — only when the pool is dry"
          tone="warning"
          chip="$6 / SCU"
        >
          <OverageIcon />
        </FlowStep>
      </ol>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:gap-8">
        <p className="text-sm leading-relaxed text-[color:var(--color-text-muted)]">
          Think of SCUs like a prepaid bucket. Your M365 E5 / E7 licence refills
          the bucket on the first of each month. Every time an agent runs (e.g.
          someone reports a phishing email and the Phishing Triage Agent
          investigates), it scoops a small amount of SCU from the bucket —
          typically around 0.5 SCU per run. Whatever you don&apos;t use
          disappears at month-end. Once the bucket is empty, additional usage
          bills as overage at $6 per consumed SCU. You only ever pay for runs
          that actually happen.
        </p>

        <figure className="flex items-start gap-3 border-l border-[color:var(--color-hairline)] pl-3 md:self-start">
          <Image
            src="/ugur-koc.jpg"
            alt="Ugur Koc"
            width={48}
            height={48}
            className="h-6 w-6 flex-none rounded-full border border-[color:var(--color-hairline)] object-cover"
          />
          <div className="flex flex-col gap-0.5">
            <blockquote className="text-[13px] italic leading-relaxed text-[color:var(--color-text-muted)]">
              Most triage agents I&apos;ve seen in real tenants run well below
              0.5 SCU. Treat it as a planning upper bound — actuals depend on
              the entities each run touches.
            </blockquote>
            <figcaption className="flex items-center gap-1.5 text-[11px] text-[color:var(--color-text-subtle)]">
              <span className="font-semibold text-[color:var(--color-text)]">
                Ugur Koc
              </span>
              <span aria-hidden="true">·</span>
              <a
                href="https://www.linkedin.com/in/ugurkocde/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 rounded text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)]"
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
            </figcaption>
          </div>
        </figure>
      </div>

      <style>{`
        @keyframes scu-pool-cycle {
          0%   { clip-path: inset(100% 0 0 0); }
          30%  { clip-path: inset(0% 0 0 0); }
          55%  { clip-path: inset(0% 0 0 0); }
          85%  { clip-path: inset(80% 0 0 0); }
          90%  { clip-path: inset(0% 0 0 0); }
          100% { clip-path: inset(0% 0 0 0); }
        }
        .scu-flow-pool-fill {
          animation: scu-pool-cycle 8s ease-in-out infinite;
        }

        @keyframes scu-arrow-march {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -12; }
        }
        .scu-flow-arrow,
        .scu-flow-arrow-v {
          animation: scu-arrow-march 1.2s linear infinite;
        }

        @keyframes scu-droplet {
          0%   { transform: translate(2px, 8px) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(48px, 8px) scale(0.6); opacity: 0; }
        }
        .scu-flow-droplet {
          animation: scu-droplet 1.8s linear infinite;
        }

        .scu-flow-icon-warning::before {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 9999px;
          background: radial-gradient(
            closest-side,
            var(--color-warning-soft),
            transparent 70%
          );
          z-index: -1;
        }

        @keyframes scu-step-reveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scu-flow-section .scu-flow-step {
          opacity: 0;
        }
        .scu-flow-section[data-revealed="true"] .scu-flow-step {
          animation: scu-step-reveal 520ms ease-out forwards;
          animation-delay: calc(var(--step-index) * 110ms);
        }
        @media (prefers-reduced-motion: reduce) {
          .scu-flow-section .scu-flow-step {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};
