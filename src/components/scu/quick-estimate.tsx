"use client";

import { type ChangeEvent } from "react";

import { CalculationTrace } from "~/components/scu/calculation-trace";
import { CalculatorResults } from "~/components/scu/results";
import { FxSelector } from "~/components/scu/fx";
import { ShareActions } from "~/components/scu/share-actions";
import {
  AGENT_INTENSITY_PRESETS,
  type AgentIntensity,
  type QuickLicenseProfile,
  buildQuickInputPatch,
  inferQuickValuesFromInput,
  workloadSizeHint,
} from "~/lib/scu/quick-presets";
import { buildResultRange } from "~/lib/scu/summary";
import { type CalculatorInput, type CalculatorOutput } from "~/lib/scu/types";

interface QuickEstimateProps {
  input: CalculatorInput;
  output: CalculatorOutput;
  onChange: (patch: Partial<CalculatorInput>) => void;
  fxWarning: string | null;
  onFxWarningChange: (warning: string | null) => void;
  shareUrl: string;
}

const cardBase =
  "flex min-h-[64px] flex-col gap-1 rounded-lg border px-4 py-3 text-left transition";
const cardSelected =
  "border-[color:var(--color-accent)]/60 bg-[color:var(--color-accent)]/[0.06] ring-1 ring-[color:var(--color-accent)]/30 text-[color:var(--color-text)]";
const cardIdle =
  "border-[color:var(--color-hairline)] bg-white/[0.01] hover:border-white/15 text-[color:var(--color-text-muted)]";

const inputClass =
  "rounded-lg border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)] px-3 py-2 text-base text-[color:var(--color-text)] focus-visible:border-[color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]";

const labelEyebrow =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]";

export const QuickEstimate = ({
  input,
  output,
  onChange,
  fxWarning,
  onFxWarningChange,
  shareUrl,
}: QuickEstimateProps) => {
  const quick = inferQuickValuesFromInput(input);
  const sizeHint = workloadSizeHint(quick.analystCount);
  const range = buildResultRange(input, output);
  const rangeNote = range
    ? "Range reflects community-estimated agent rates."
    : undefined;

  const pickerActive = input.selectedAgents.length > 0;
  const baseContext = { hasAgentSelections: pickerActive };

  const setLicense = (profile: QuickLicenseProfile): void => {
    onChange(buildQuickInputPatch({ ...quick, licenseProfile: profile }, baseContext));
  };

  const setAnalysts = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.currentTarget.valueAsNumber;
    const safe = Number.isFinite(next) ? Math.max(0, Math.min(500, next)) : 0;
    onChange(buildQuickInputPatch({ ...quick, analystCount: safe }, baseContext));
  };

  const setMessages = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.currentTarget.valueAsNumber;
    const safe = Number.isFinite(next) ? Math.max(0, Math.min(50, next)) : 0;
    onChange(buildQuickInputPatch({ ...quick, messagesPerWorkday: safe }, baseContext));
  };

  const setPaidUsers = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.currentTarget.valueAsNumber;
    const safe = Number.isFinite(next) ? Math.max(0, next) : 0;
    onChange(buildQuickInputPatch({ ...quick, paidE5Users: safe }, baseContext));
  };

  const setIntensity = (intensity: AgentIntensity): void => {
    // Picking a preset clears any picker selections so the preset's count applies.
    onChange({
      ...buildQuickInputPatch({ ...quick, agentIntensity: intensity }),
      selectedAgents: [],
    });
  };

  const isE5 = quick.licenseProfile === "e5_or_e7";

  return (
    <section
      className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-6 sm:p-8 lg:p-10"
      aria-label="Quick SCU estimate"
    >
      <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.02em] text-[color:var(--color-text)] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
        What will Security Copilot cost you?
      </h1>
      <p className="mt-3 max-w-2xl text-base text-[color:var(--color-text-muted)] sm:text-lg">
        Microsoft includes a free SCU pool with paid M365 E5 and E7. Enter your numbers
        to see what you&apos;ll pay beyond it.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <fieldset>
            <legend className={labelEyebrow}>1. License profile</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`${cardBase} ${isE5 ? cardSelected : cardIdle}`}
                onClick={() => {
                  setLicense("e5_or_e7");
                }}
                aria-pressed={isE5}
              >
                <span className="text-sm font-semibold text-[color:var(--color-text)]">
                  M365 E5 / E7
                </span>
                <span className="text-xs text-[color:var(--color-text-muted)]">
                  Auto-included SCU pool
                </span>
              </button>
              <button
                type="button"
                className={`${cardBase} ${!isE5 ? cardSelected : cardIdle}`}
                onClick={() => {
                  setLicense("standalone");
                }}
                aria-pressed={!isE5}
              >
                <span className="text-sm font-semibold text-[color:var(--color-text)]">
                  Standalone
                </span>
                <span className="text-xs text-[color:var(--color-text-muted)]">
                  Pay per SCU · E3 bills every SCU
                </span>
              </button>
            </div>
          </fieldset>

          {isE5 ? (
            <label
              className="flex flex-col gap-2 text-sm font-medium text-[color:var(--color-text)]"
              htmlFor="quick-paid-users"
            >
              <span className={labelEyebrow}>2. Paid Microsoft 365 E5 / E7 users</span>
              <input
                id="quick-paid-users"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={quick.paidE5Users}
                onChange={setPaidUsers}
                className={inputClass}
              />
              <span className="text-xs text-[color:var(--color-text-subtle)]">
                Drives the included pool. Default 1,000 — adjust for your tenant.
              </span>
            </label>
          ) : null}

          <div className="space-y-3">
            <fieldset className="space-y-2">
              <legend className={labelEyebrow}>
                {isE5 ? "3" : "2"}. Security Copilot chat admins
              </legend>
              <p className="text-xs text-[color:var(--color-text-subtle)]">
                Admins using Copilot chat in the standalone portal or embedded
                experiences (Defender, Entra, Intune, Purview).
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className="flex flex-col gap-1.5 text-sm font-medium text-[color:var(--color-text)]"
                  htmlFor="quick-analysts"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
                    Active admins
                  </span>
                  <input
                    id="quick-analysts"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={500}
                    step={1}
                    value={quick.analystCount}
                    onChange={setAnalysts}
                    className={inputClass}
                  />
                </label>
                <label
                  className="flex flex-col gap-1.5 text-sm font-medium text-[color:var(--color-text)]"
                  htmlFor="quick-msgs"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
                    Messages per admin / workday
                  </span>
                  <input
                    id="quick-msgs"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={50}
                    step={1}
                    value={quick.messagesPerWorkday}
                    onChange={setMessages}
                    className={inputClass}
                  />
                </label>
              </div>
              <p className="text-xs text-[color:var(--color-text-subtle)]">
                <span className="font-mono text-[color:var(--color-text-muted)]">
                  {sizeHint.label}
                </span>{" "}
                · {sizeHint.description}
              </p>
              <p className="text-[11px] leading-relaxed text-[color:var(--color-text-subtle)]">
                Each chat message is estimated at 0.25 SCU — calibrated below
                Microsoft&apos;s 0.5 SCU incident-summarisation reference, since chat
                prompts are typically lighter than full incident analysis.{" "}
                <a
                  href="/methodology#chat-rate"
                  className="underline decoration-[color:var(--color-text-subtle)] underline-offset-2 hover:text-[color:var(--color-accent-fg)]"
                >
                  why 0.25
                </a>
              </p>
            </fieldset>
          </div>

          <fieldset>
            <legend className={labelEyebrow}>
              {isE5 ? "4" : "3"}. Security Copilot agents
            </legend>
            <div
              className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg border border-[color:var(--color-hairline)]"
              role="radiogroup"
              aria-label="Agent intensity"
            >
              {AGENT_INTENSITY_PRESETS.map((preset) => {
                const selected = !pickerActive && preset.id === quick.agentIntensity;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setIntensity(preset.id);
                    }}
                    className={`flex flex-col items-start gap-0.5 px-3 py-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--color-accent)] ${
                      selected
                        ? "bg-[color:var(--color-accent)]/[0.08] text-[color:var(--color-text)]"
                        : "bg-transparent text-[color:var(--color-text-muted)] hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="text-sm font-semibold">{preset.label}</span>
                    <span className="text-xs text-[color:var(--color-text-subtle)]">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-text-subtle)]">
              {pickerActive
                ? `Custom · ${input.selectedAgents.length} agent${input.selectedAgents.length === 1 ? "" : "s"} selected via picker. Click a preset to clear.`
                : "For finer control, pick specific agents in the agent picker below."}
            </p>
          </fieldset>

          <FxSelector
            input={input}
            onChange={onChange}
            onWarningChange={onFxWarningChange}
            idPrefix="quick"
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <CalculatorResults
            output={output}
            fxWarning={fxWarning}
            title="Projected monthly cost"
            range={range}
            rangeNote={rangeNote}
            trace={<CalculationTrace input={input} output={output} />}
            actions={
              <ShareActions input={input} output={output} shareUrl={shareUrl} />
            }
          />
        </div>
      </div>
    </section>
  );
};
