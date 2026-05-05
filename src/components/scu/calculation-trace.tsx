import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import {
  HOURS_PER_MONTH,
  SCU_PER_AGENT_RUN,
  SCU_PER_CHAT_MESSAGE,
  WORKING_DAYS_PER_MONTH,
} from "~/lib/scu/constants";
import { type CalculatorInput, type CalculatorOutput } from "~/lib/scu/types";

interface CalculationTraceProps {
  input: CalculatorInput;
  output: CalculatorOutput;
}

const fmt = (value: number, decimals = 2): string => {
  const rounded = Number(value.toFixed(decimals));
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

const fmtUsd = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

interface Line {
  label: string;
  expression: string;
  result: string;
}

const buildLines = (input: CalculatorInput): Line[] => {
  const lines: Line[] = [];

  const chatScuPerMonth =
    input.analystCount *
    input.messagesPerWorkday *
    WORKING_DAYS_PER_MONTH *
    SCU_PER_CHAT_MESSAGE;
  lines.push({
    label: "Chat usage",
    expression: `${input.analystCount} admins × ${input.messagesPerWorkday} msgs/admin/workday × ${WORKING_DAYS_PER_MONTH} days × ${SCU_PER_CHAT_MESSAGE} SCU`,
    result: `${fmt(chatScuPerMonth, 0)} SCU/mo`,
  });

  // Intensity-preset agents (only when picker is empty)
  if (input.agentCount > 0) {
    const agentScuPerMonth =
      input.agentCount * input.runsPerAgentPerMonth * SCU_PER_AGENT_RUN;
    lines.push({
      label: "Agents (intensity preset)",
      expression: `${input.agentCount} agents × ${input.runsPerAgentPerMonth} runs/mo × ${SCU_PER_AGENT_RUN} SCU`,
      result: `${fmt(agentScuPerMonth, 0)} SCU/mo`,
    });
  }

  // Background
  if (input.backgroundScuPerHour > 0) {
    lines.push({
      label: "Background load",
      expression: `${input.backgroundScuPerHour} SCU/hr × ${HOURS_PER_MONTH}`,
      result: `${fmt(input.backgroundScuPerHour * HOURS_PER_MONTH, 0)} SCU/mo`,
    });
  }

  // Selected agents (picker)
  if (input.selectedAgents.length > 0) {
    const totalPickerSCU = input.selectedAgents.reduce((sum, sel) => {
      const agent = SECURITY_COPILOT_AGENTS.find((a) => a.id === sel.agentId);
      if (!agent) return sum;
      return sum + agent.scuPerRun * sel.runsPerMonth;
    }, 0);
    const breakdown = input.selectedAgents
      .map((sel) => {
        const agent = SECURITY_COPILOT_AGENTS.find((a) => a.id === sel.agentId);
        if (!agent) return null;
        return `${agent.name.split(" ")[0]} ${sel.runsPerMonth.toLocaleString()}×${agent.scuPerRun}`;
      })
      .filter(Boolean)
      .join(" + ");
    lines.push({
      label: `Picked agents (${input.selectedAgents.length})`,
      expression: breakdown || "—",
      result: `${fmt(totalPickerSCU, 0)} SCU/mo`,
    });
  }

  return lines;
};

export const CalculationTrace = ({ input, output }: CalculationTraceProps) => {
  const lines = buildLines(input);
  const totalConsumedMonthly = output.effectiveConsumedScuPerHour * HOURS_PER_MONTH;
  const isE5 = input.licenseTier === "e5_security";
  const overageRate = input.overageRateUsd;
  const showCurrencyNote = output.currencyTotals.currency !== "USD";

  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-[color:var(--color-text-subtle)] underline decoration-[color:var(--color-text-subtle)]/40 underline-offset-2 hover:text-[color:var(--color-accent-fg)]">
        Show calculation
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-3 w-3 transform transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </summary>

      <div className="mt-3 rounded-lg border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)]/60 p-3 font-mono text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">
        <div className="space-y-1.5">
          {lines.map((line) => (
            <div key={line.label} className="flex flex-wrap items-baseline gap-x-2">
              <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
                {line.label}
              </span>
              <span className="flex-1 text-[color:var(--color-text-muted)]">
                {line.expression}
              </span>
              <span className="tabular-nums text-[color:var(--color-text)]">
                {line.result}
              </span>
            </div>
          ))}
        </div>

        <div className="my-2 h-px bg-[color:var(--color-hairline)]" />

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
            Projected total
          </span>
          <span className="flex-1 text-[color:var(--color-text-muted)]">
            sum of above
          </span>
          <span className="tabular-nums text-[color:var(--color-text)]">
            {fmt(totalConsumedMonthly, 0)} SCU/mo
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
            {isE5 ? "Included pool (E5)" : "Included pool"}
          </span>
          <span className="flex-1 text-[color:var(--color-text-muted)]">
            {isE5
              ? `min(10,000, ${input.e5PaidUserLicenses.toLocaleString()} / 1,000 × 400)`
              : "no included pool"}
          </span>
          <span className="tabular-nums text-[color:var(--color-text)]">
            −{fmt(output.includedScuMonthly, 0)} SCU/mo
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
            Billable overage
          </span>
          <span className="flex-1 text-[color:var(--color-text-muted)]">
            max(0, total − included)
          </span>
          <span className="tabular-nums text-[color:var(--color-text)]">
            {fmt(output.billableOverageScuMonthly, 1)} SCU/mo
          </span>
        </div>

        <div className="my-2 h-px bg-[color:var(--color-hairline)]" />

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
            Monthly cost
          </span>
          <span className="flex-1 text-[color:var(--color-text-muted)]">
            {fmt(output.billableOverageScuMonthly, 1)} × ${overageRate} overage rate
          </span>
          <span className="tabular-nums text-[color:var(--color-text)]">
            {fmtUsd(output.monthlyUsd)}
          </span>
        </div>

        {showCurrencyNote ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="min-w-[140px] text-[color:var(--color-text-subtle)]">
              In {output.currencyTotals.currency}
            </span>
            <span className="flex-1 text-[color:var(--color-text-muted)]">
              × {output.currencyTotals.fxRate.toFixed(4)} FX rate
            </span>
            <span className="tabular-nums text-[color:var(--color-text)]">
              {formatCurrency(
                output.currencyTotals.monthly,
                output.currencyTotals.currency,
              )}
            </span>
          </div>
        ) : null}
      </div>
    </details>
  );
};
