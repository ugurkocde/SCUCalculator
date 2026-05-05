import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import {
  type CalculatorInput,
  type CalculatorOutput,
} from "~/lib/scu/types";

const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const usesCommunityEstimates = (input: CalculatorInput): boolean =>
  input.selectedAgents.some((selection) => {
    const agent = SECURITY_COPILOT_AGENTS.find((entry) => entry.id === selection.agentId);
    return agent ? agent.source === "community-estimate" : false;
  });

const RANGE_LOW_FACTOR = 0.6;

export interface ResultRange {
  monthlyLow: number;
  monthlyHigh: number;
  monthlyLabel: string;
}

export const buildResultRange = (
  input: CalculatorInput,
  output: CalculatorOutput,
): ResultRange | null => {
  if (!usesCommunityEstimates(input)) {
    return null;
  }
  const currency = output.currencyTotals.currency;
  const high = currency === "USD" ? output.monthlyUsd : output.currencyTotals.monthly;
  const low = high * RANGE_LOW_FACTOR;
  return {
    monthlyLow: low,
    monthlyHigh: high,
    monthlyLabel: `${formatCurrency(low, currency)} – ${formatCurrency(high, currency)}`,
  };
};

const licenseLabel = (input: CalculatorInput): string => {
  if (input.licenseTier === "e5_security") return "Microsoft 365 E5 / E7";
  if (input.licenseTier === "m365_e3") return "Microsoft 365 E3";
  return "Standalone";
};

export const buildEmailSummary = (
  input: CalculatorInput,
  output: CalculatorOutput,
  shareUrl: string,
): string => {
  const range = buildResultRange(input, output);
  const currency = output.currencyTotals.currency;
  const monthly =
    currency === "USD" ? output.monthlyUsd : output.currencyTotals.monthly;
  const annual =
    currency === "USD" ? output.annualUsd : output.currencyTotals.annual;

  const monthlyLine = range
    ? `Estimated Microsoft Security Copilot cost: ${range.monthlyLabel} / month`
    : `Estimated Microsoft Security Copilot cost: ${formatCurrency(monthly, currency)} / month (${formatCurrency(annual, currency)} / year)`;

  const enabledAgents = input.selectedAgents
    .map((selection) => {
      const agent = SECURITY_COPILOT_AGENTS.find((entry) => entry.id === selection.agentId);
      return agent ? `${agent.name} (${selection.runsPerMonth.toLocaleString()} runs/mo)` : null;
    })
    .filter(Boolean) as string[];

  const isE5 = input.licenseTier === "e5_security";
  const inputLine = isE5
    ? `Inputs: ${licenseLabel(input)}, ${input.e5PaidUserLicenses.toLocaleString()} paid users, ${input.analystCount} analysts`
    : `Inputs: ${licenseLabel(input)}, ${input.analystCount} analysts`;

  const lines: string[] = [
    monthlyLine,
    inputLine,
  ];

  if (isE5) {
    lines.push(`Included from E5: ${output.includedScuMonthly.toLocaleString()} SCU/month`);
  }
  lines.push(
    `Projected billable overage: ${output.billableOverageScuMonthly.toLocaleString()} SCU/month`,
  );

  if (enabledAgents.length > 0) {
    lines.push(`Agents enabled: ${enabledAgents.join("; ")}`);
  }

  if (range) {
    lines.push(
      "Range reflects community-estimated agent rates. Verify in your tenant usage dashboard.",
    );
  }

  lines.push(`Source: ${shareUrl}`);

  return lines.join("\n");
};

