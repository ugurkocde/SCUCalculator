"use client";

import { useMemo } from "react";

import {
  SECURITY_COPILOT_AGENTS,
  type SecurityCopilotAgent,
} from "~/lib/scu/agents";
import { type AgentSelection, type CalculatorInput } from "~/lib/scu/types";

interface AgentPickerProps {
  input: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
}

const formatScu = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const findSelection = (
  selections: AgentSelection[],
  id: string,
): AgentSelection | undefined => selections.find((entry) => entry.agentId === id);

export const AgentPicker = ({ input, onChange }: AgentPickerProps) => {
  const selections = useMemo(
    () => input.selectedAgents ?? [],
    [input.selectedAgents],
  );
  const selectedById = useMemo(() => {
    const map = new Map<string, AgentSelection>();
    for (const selection of selections) {
      map.set(selection.agentId, selection);
    }
    return map;
  }, [selections]);

  const toggleAgent = (agent: SecurityCopilotAgent): void => {
    const current = findSelection(selections, agent.id);
    if (current) {
      onChange({
        selectedAgents: selections.filter((entry) => entry.agentId !== agent.id),
      });
      return;
    }
    onChange({
      selectedAgents: [
        ...selections,
        { agentId: agent.id, runsPerMonth: agent.defaultRunsPerMonth },
      ],
      // Picker is now the source of truth for agent SCU; zero the intensity-driven count.
      agentCount: 0,
    });
  };

  const setSelections = (next: AgentSelection[]): void => {
    onChange({ selectedAgents: next });
  };

  const updateRuns = (agentId: string, runsPerMonth: number): void => {
    const safe = Number.isFinite(runsPerMonth) && runsPerMonth > 0 ? runsPerMonth : 0;
    setSelections(
      selections.map((entry) =>
        entry.agentId === agentId ? { ...entry, runsPerMonth: safe } : entry,
      ),
    );
  };

  return (
    <details
      className="group rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] [&_summary::-webkit-details-marker]:hidden"
      aria-label="Security Copilot agent picker"
    >
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-5 text-sm font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)] sm:px-6 sm:py-6">
        <span className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
            Pick specific agents
          </span>
          <span className="text-base font-semibold text-[color:var(--color-text)]">
            Override defaults with the agents you actually plan to enable
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-xs text-[color:var(--color-text-subtle)]">
            {selectedById.size} of {SECURITY_COPILOT_AGENTS.length} selected
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-5 w-5 transform text-[color:var(--color-text-muted)] transition group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 8 4 4 4-4" />
          </svg>
        </span>
      </summary>

      <div className="border-t border-[color:var(--color-hairline)] px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
      <p className="rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] p-3 text-xs text-[color:var(--color-text-subtle)]">
        Microsoft has not published per-run SCU rates for most agents. Defaults are
        conservative upper bounds (1 SCU/run) so cost is not under-quoted. Verify against
        your tenant&apos;s usage dashboard.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECURITY_COPILOT_AGENTS.map((agent) => {
          const selection = selectedById.get(agent.id);
          const enabled = Boolean(selection);
          const runs = selection?.runsPerMonth ?? agent.defaultRunsPerMonth;
          const scuPerHour = (agent.scuPerRun * (enabled ? runs : 0)) / 730;

          return (
            <article
              key={agent.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
                enabled
                  ? "border-[color:var(--color-accent)]/60 bg-[color:var(--color-accent)]/[0.05]"
                  : "border-[color:var(--color-hairline)] bg-white/[0.01] hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
                  {agent.productTag}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    agent.source === "microsoft"
                      ? "bg-emerald-300/10 text-emerald-200"
                      : "bg-amber-300/10 text-amber-200"
                  }`}
                  title={agent.sourceNote}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      agent.source === "microsoft" ? "bg-emerald-300" : "bg-amber-300"
                    }`}
                  />
                  {agent.source === "microsoft" ? "Microsoft" : "Estimate"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
                  {agent.name}
                </h3>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {agent.description}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <a
                  href={agent.docsUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[11px] font-medium text-[color:var(--color-text-subtle)] underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
                >
                  Microsoft docs
                </a>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? "Disable" : "Enable"} ${agent.name}`}
                  onClick={() => {
                    toggleAgent(agent);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)] ${
                    enabled
                      ? "border-[color:var(--color-accent)]/70 bg-[color:var(--color-accent)]/30"
                      : "border-[color:var(--color-hairline)] bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[color:var(--color-text)] transition ${
                      enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {enabled ? (
                <div className="mt-1 grid grid-cols-2 gap-2 border-t border-[color:var(--color-hairline)] pt-3">
                  <label
                    className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-[color:var(--color-text-subtle)]"
                    htmlFor={`agent-runs-${agent.id}`}
                  >
                    Runs / month
                    <input
                      id={`agent-runs-${agent.id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={10}
                      value={runs}
                      onChange={(event) => {
                        updateRuns(agent.id, event.currentTarget.valueAsNumber);
                      }}
                      className="rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)] px-2 py-1 font-mono text-xs text-[color:var(--color-text)] focus-visible:border-[color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                    />
                  </label>
                  <div className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-[color:var(--color-text-subtle)]">
                    Adds
                    <span className="font-mono text-xs tabular-nums text-[color:var(--color-text)]">
                      {formatScu(scuPerHour)} SCU/hr
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[color:var(--color-text-subtle)]">
                  Default {agent.defaultRunsPerMonth.toLocaleString()} runs/month ·{" "}
                  {agent.scuPerRun} SCU/run
                </p>
              )}
            </article>
          );
        })}
      </div>
      </div>
    </details>
  );
};
