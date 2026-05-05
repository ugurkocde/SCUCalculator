"use client";

import { type ChangeEvent } from "react";

import { SCU_PER_USER_PER_MONTH } from "~/lib/scu/constants";
import { type CalculatorInput, type UserSplit } from "~/lib/scu/types";

interface UserSplitFieldsProps {
  input: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
}

const EMPTY_SPLIT: UserSplit = {
  defender: 0,
  entra: 0,
  intune: 0,
  purview: 0,
  standalone: 0,
};

interface FieldDef {
  key: keyof UserSplit;
  label: string;
  hint: string;
  rate: number;
}

const FIELDS: FieldDef[] = [
  { key: "defender", label: "Defender", hint: "Hunting, alerts, summaries", rate: SCU_PER_USER_PER_MONTH.defender },
  { key: "standalone", label: "Standalone", hint: "Power users, prompts", rate: SCU_PER_USER_PER_MONTH.standalone },
  { key: "purview", label: "Purview", hint: "DLP / IRM triage", rate: SCU_PER_USER_PER_MONTH.purview },
  { key: "entra", label: "Entra", hint: "CA, identity risk", rate: SCU_PER_USER_PER_MONTH.entra },
  { key: "intune", label: "Intune", hint: "Endpoint admin tasks", rate: SCU_PER_USER_PER_MONTH.intune },
];

const inputClass =
  "w-full rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)] px-2.5 py-1.5 text-sm tabular-nums text-[color:var(--color-text)] focus-visible:border-[color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]";

export const UserSplitFields = ({ input, onChange }: UserSplitFieldsProps) => {
  const split: UserSplit = input.userSplit ?? EMPTY_SPLIT;
  const total: number = (Object.values(split) as number[]).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );
  const monthlyScu: number = FIELDS.reduce(
    (sum, f) => sum + (split[f.key] ?? 0) * f.rate,
    0,
  );

  const setField = (key: keyof UserSplit, raw: ChangeEvent<HTMLInputElement>): void => {
    const value = raw.currentTarget.valueAsNumber;
    const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const next: UserSplit = { ...split, [key]: safe };
    const anyPositive = Object.values(next).some((n) => n > 0);
    onChange({ userSplit: anyPositive ? next : null });
  };

  const clear = (): void => {
    onChange({ userSplit: null });
  };

  return (
    <details className="group rounded-lg border border-[color:var(--color-hairline)] bg-white/[0.01] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)]">
        <span className="flex flex-col gap-0.5 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            Refine by experience
          </span>
          <span className="text-[11px] text-[color:var(--color-text-subtle)]">
            {total > 0
              ? `${total.toLocaleString()} users across products · overrides analyst count`
              : "Split your users across Defender, Purview, Entra, Intune, Standalone for tighter math"}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 transform text-[color:var(--color-text-subtle)] transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </summary>

      <div className="space-y-3 border-t border-[color:var(--color-hairline)] p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FIELDS.map((field) => (
            <label
              key={field.key}
              htmlFor={`split-${field.key}`}
              className="flex flex-col gap-1 text-[11px] text-[color:var(--color-text-muted)]"
            >
              <span className="flex items-baseline justify-between gap-1">
                <span className="font-medium text-[color:var(--color-text)]">{field.label}</span>
                <span className="font-mono text-[10px] text-[color:var(--color-text-subtle)]">
                  {field.rate} SCU/u/mo
                </span>
              </span>
              <input
                id={`split-${field.key}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={split[field.key] || 0}
                onChange={(event) => {
                  setField(field.key, event);
                }}
                className={inputClass}
              />
              <span className="text-[10px] text-[color:var(--color-text-subtle)]">
                {field.hint}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-hairline)] pt-3 text-[11px] text-[color:var(--color-text-subtle)]">
          <p>
            {total > 0 ? (
              <>
                Total{" "}
                <span className="font-mono text-[color:var(--color-text)]">
                  {total.toLocaleString()}
                </span>{" "}
                users · est.{" "}
                <span className="font-mono text-[color:var(--color-text)]">
                  {monthlyScu.toLocaleString()}
                </span>{" "}
                SCU/month from analysts.
              </>
            ) : (
              <>Per-user rates are conservative estimates — Microsoft has not published them.</>
            )}
          </p>
          {total > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="rounded border border-[color:var(--color-hairline)] px-2 py-1 text-[10px] font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-accent-fg)]"
            >
              Clear split
            </button>
          ) : null}
        </div>
      </div>
    </details>
  );
};
