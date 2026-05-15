"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  type AgentValueOverride,
  type AgentValueOverrides,
  type AgentValueRow,
  type AgentValueSnapshot,
  calculateAgentValue,
  DEFAULT_HOURLY_RATE_USD,
} from "~/lib/scu/value-calculate";

const RATE_STORAGE_KEY = "scucalc:value:hourlyRate";
const OVERRIDES_STORAGE_KEY = "scucalc:value:overrides";
const MIN_HOURLY_RATE = 1;
const MAX_HOURLY_RATE = 1000;

const hoursFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatHours = (value: number): string =>
  `${hoursFormatter.format(value)} h`;

const formatUsd = (value: number | null): string =>
  value === null ? "—" : usdFormatter.format(value);

const formatNetUsd = (value: number | null): string => {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : "−"}${usdFormatter.format(Math.abs(value))}`;
};

const sanitizeStoredOverrides = (raw: unknown): AgentValueOverrides => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: AgentValueOverrides = {};
  for (const [agentId, entry] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    const clean: AgentValueOverride = {};
    if (typeof e.included === "boolean") {
      clean.included = e.included;
    }
    if (
      typeof e.runsPerMonth === "number" &&
      Number.isFinite(e.runsPerMonth) &&
      e.runsPerMonth >= 0
    ) {
      clean.runsPerMonth = e.runsPerMonth;
    }
    if (
      typeof e.hoursSavedPerRun === "number" &&
      Number.isFinite(e.hoursSavedPerRun) &&
      e.hoursSavedPerRun >= 0
    ) {
      clean.hoursSavedPerRun = e.hoursSavedPerRun;
    }
    if (Object.keys(clean).length > 0) {
      out[agentId] = clean;
    }
  }
  return out;
};

interface EditableNumberProps {
  initialValue: number;
  onValueChange: (next: number | undefined) => void;
  min: number;
  inputMode: "numeric" | "decimal";
  className: string;
  ariaLabel: string;
}

/**
 * Numeric entry that uses `type="text"` + `inputMode` rather than
 * `type="number"`, so partial-decimal states like "0." or "1." are preserved
 * during typing instead of being normalised away by the browser. The parent
 * owns the parsed number; to force a reset of the displayed value, re-mount
 * this component via a different `key`.
 */
const EditableNumber = ({
  initialValue,
  onValueChange,
  min,
  inputMode,
  className,
  ariaLabel,
}: EditableNumberProps) => {
  const [raw, setRaw] = useState<string>(String(initialValue));

  const allowedPattern =
    inputMode === "decimal" ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;

  return (
    <input
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={raw}
      onChange={(event) => {
        const next = event.target.value;
        // Reject characters outside the numeric grammar so the raw string can
        // never carry garbage.
        if (!allowedPattern.test(next)) {
          return;
        }
        setRaw(next);
        if (next.trim() === "" || next === ".") {
          onValueChange(undefined);
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed) && parsed >= min) {
          onValueChange(parsed);
          return;
        }
        onValueChange(undefined);
      }}
      className={className}
      aria-label={ariaLabel}
    />
  );
};

const sourceLabel = (source: "microsoft" | "community-estimate"): string =>
  source === "microsoft" ? "Microsoft (range)" : "estimate";

interface AgentRowCardProps {
  row: AgentValueRow;
  onChange: (patch: AgentValueOverride) => void;
}

const AgentRowCard = ({ row, onChange }: AgentRowCardProps) => {
  const { agent } = row;
  const muted = !row.included;

  return (
    <article
      className={`rounded-2xl border p-5 transition-colors ${
        muted
          ? "border-[color:var(--color-hairline)] bg-white/[0.015]"
          : "border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)]"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={row.included}
            onChange={(event) => {
              onChange({ included: event.target.checked });
            }}
            className="mt-1 h-4 w-4 accent-[color:var(--color-accent)]"
            aria-label={`Include ${agent.name} in totals`}
          />
          <span>
            <span
              className={`text-base font-semibold ${
                muted
                  ? "text-[color:var(--color-text-muted)]"
                  : "text-[color:var(--color-text)]"
              }`}
            >
              {agent.name}
            </span>
            <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--color-hairline)] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
              {agent.productTag}
            </span>
          </span>
        </label>
        <a
          href={agent.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[color:var(--color-text-muted)] underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
        >
          Docs ↗
        </a>
      </header>

      <p
        className={`mt-2 text-sm leading-relaxed ${
          muted
            ? "text-[color:var(--color-text-subtle)]"
            : "text-[color:var(--color-text-muted)]"
        }`}
      >
        {agent.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            SCU / run
          </span>
          <p className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {agent.scuPerRun}
          </p>
        </div>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Runs / month
          </span>
          <EditableNumber
            initialValue={row.runsPerMonth}
            onValueChange={(next) => {
              onChange({ runsPerMonth: next });
            }}
            min={0}
            inputMode="numeric"
            ariaLabel={`Runs per month for ${agent.name}`}
            className="mt-1 w-full rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Hours saved / run
          </span>
          <EditableNumber
            initialValue={row.hoursSavedPerRun}
            onValueChange={(next) => {
              onChange({ hoursSavedPerRun: next });
            }}
            min={0}
            inputMode="decimal"
            ariaLabel={`Hours saved per run for ${agent.name}`}
            className="mt-1 w-full rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
          />
        </label>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[color:var(--color-hairline)] pt-4 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Cost / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatUsd(row.monthlyCostUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Hours saved / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatHours(row.monthlyHoursSaved)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Value / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatUsd(row.monthlyValueUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Net / mo
          </dt>
          <dd
            className={`mt-1 font-mono text-sm tabular-nums ${
              row.monthlyNetUsd === null
                ? "text-[color:var(--color-text-subtle)]"
                : row.monthlyNetUsd >= 0
                  ? "text-emerald-200"
                  : "text-amber-200"
            }`}
          >
            {formatNetUsd(row.monthlyNetUsd)}
          </dd>
        </div>
      </dl>

      <details className="mt-4 text-xs leading-relaxed text-[color:var(--color-text-subtle)]">
        <summary className="cursor-pointer text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]">
          Source notes
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            <strong className="font-semibold text-[color:var(--color-text-muted)]">
              SCU / run ({sourceLabel(agent.source)}):
            </strong>{" "}
            {agent.sourceNote}
          </p>
          <p>
            <strong className="font-semibold text-[color:var(--color-text-muted)]">
              Hours saved / run ({sourceLabel(agent.hoursSavedSource)}):
            </strong>{" "}
            {agent.hoursSavedSourceNote}
          </p>
        </div>
      </details>
    </article>
  );
};

interface TotalsBarProps {
  snapshot: AgentValueSnapshot;
}

const TotalsBar = ({ snapshot }: TotalsBarProps) => {
  const { totals } = snapshot;

  return (
    <section
      aria-label="Monthly totals across included agents"
      className="sticky top-0 z-10 rounded-2xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-bg-raised)]/95 p-5 backdrop-blur-md"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-fg)]">
          Monthly net value
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
          {totals.includedAgentCount} of {snapshot.rows.length} agents included
        </p>
      </div>
      <p
        className={`mt-1 break-words font-semibold tabular-nums tracking-tight text-[clamp(2rem,6vw,3.25rem)] ${
          totals.monthlyNetUsd === null
            ? "text-[color:var(--color-text-subtle)]"
            : totals.monthlyNetUsd >= 0
              ? "text-[color:var(--color-text)]"
              : "text-amber-200"
        }`}
      >
        {formatNetUsd(totals.monthlyNetUsd)}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Hours saved / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatHours(totals.monthlyHoursSaved)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Value / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatUsd(totals.monthlyValueUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-subtle)]">
            Cost / mo
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums text-[color:var(--color-text)]">
            {formatUsd(totals.monthlyCostUsd)}
          </dd>
        </div>
      </dl>
    </section>
  );
};

export const ValueResults = () => {
  const [rateInputRaw, setRateInputRaw] = useState<string>(
    String(DEFAULT_HOURLY_RATE_USD),
  );
  const [overrides, setOverrides] = useState<AgentValueOverrides>({});
  const [resetToken, setResetToken] = useState<number>(0);

  useEffect(() => {
    try {
      const storedRate = window.localStorage.getItem(RATE_STORAGE_KEY);
      if (storedRate !== null) {
        const parsed = Number(storedRate);
        if (Number.isFinite(parsed) && parsed >= MIN_HOURLY_RATE) {
          setRateInputRaw(String(Math.min(MAX_HOURLY_RATE, parsed)));
        }
      }

      const storedOverrides = window.localStorage.getItem(
        OVERRIDES_STORAGE_KEY,
      );
      if (storedOverrides !== null) {
        const parsed: unknown = JSON.parse(storedOverrides);
        const sanitized = sanitizeStoredOverrides(parsed);
        if (Object.keys(sanitized).length > 0) {
          setOverrides(sanitized);
          setResetToken((token) => token + 1);
        }
      }
    } catch {
      // localStorage may be unavailable in some browsers.
    }
  }, []);

  const hourlyRate = useMemo<number | null>(() => {
    if (rateInputRaw.trim() === "") return null;
    const parsed = Number(rateInputRaw);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < MIN_HOURLY_RATE) return MIN_HOURLY_RATE;
    if (parsed > MAX_HOURLY_RATE) return MAX_HOURLY_RATE;
    return parsed;
  }, [rateInputRaw]);

  useEffect(() => {
    if (hourlyRate === null) return;
    try {
      window.localStorage.setItem(RATE_STORAGE_KEY, String(hourlyRate));
    } catch {
      // localStorage may be unavailable.
    }
  }, [hourlyRate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        OVERRIDES_STORAGE_KEY,
        JSON.stringify(overrides),
      );
    } catch {
      // localStorage may be unavailable.
    }
  }, [overrides]);

  const snapshot = useMemo(
    () => calculateAgentValue(overrides, hourlyRate),
    [overrides, hourlyRate],
  );

  const updateOverride = (agentId: string, patch: AgentValueOverride) => {
    setOverrides((current) => {
      const next: AgentValueOverride = { ...(current[agentId] ?? {}) };
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) {
          delete next[key as keyof AgentValueOverride];
        } else {
          // @ts-expect-error key is a known field of AgentValueOverride
          next[key] = value;
        }
      }
      return { ...current, [agentId]: next };
    });
  };

  const resetOverrides = () => {
    setOverrides({});
    setResetToken((token) => token + 1);
  };

  return (
    <>
      <section
        aria-label="Hourly rate"
        className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5"
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            Your team&apos;s loaded hourly rate (USD)
          </span>
          <input
            type="number"
            min={MIN_HOURLY_RATE}
            max={MAX_HOURLY_RATE}
            step="1"
            inputMode="decimal"
            value={rateInputRaw}
            onChange={(event) => {
              setRateInputRaw(event.target.value);
            }}
            onBlur={() => {
              if (hourlyRate === null) {
                setRateInputRaw(String(DEFAULT_HOURLY_RATE_USD));
              } else {
                setRateInputRaw(String(hourlyRate));
              }
            }}
            className="mt-1 w-full max-w-[14rem] rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-3 py-2 font-mono text-base tabular-nums text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
            aria-describedby="value-rate-hint"
          />
        </label>
        <p
          id="value-rate-hint"
          className="mt-2 text-xs leading-5 text-[color:var(--color-text-muted)]"
        >
          Illustrative — adjust to your team&apos;s rate. Drives every dollar
          figure below. Stored in your browser, never sent to the server.
          Default ${DEFAULT_HOURLY_RATE_USD}/hr.
        </p>
      </section>

      <TotalsBar snapshot={snapshot} />

      <section aria-label="Per-agent value" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
            Agents
          </h2>
          {Object.keys(overrides).length > 0 ? (
            <button
              type="button"
              onClick={resetOverrides}
              className="text-xs text-[color:var(--color-text-muted)] underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
            >
              Reset to defaults
            </button>
          ) : null}
        </div>

        {snapshot.rows.map((row) => (
          <AgentRowCard
            key={`${row.agent.id}-${resetToken}`}
            row={row}
            onChange={(patch) => {
              updateOverride(row.agent.id, patch);
            }}
          />
        ))}
      </section>

      <p className="text-xs text-[color:var(--color-text-subtle)]">
        Per-agent costs above do not subtract the included E5 / E7 SCU pool —
        that&apos;s a tenant-level offset and depends on your paid licenses.
        Use the{" "}
        <Link
          href="/"
          className="underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
        >
          calculator
        </Link>{" "}
        for tenant-level net cost.
      </p>
    </>
  );
};
