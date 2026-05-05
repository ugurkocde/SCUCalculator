import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import {
  E5_INCLUDED_SCU_CAP,
  E5_INCLUDED_SCU_PER_1000_USERS,
  HOURS_PER_MONTH,
  HOURS_PER_YEAR,
  INCLUDED_POOL_BY_TIER,
  SCU_PER_CHAT_MESSAGE,
  SCU_PER_USER_PER_MONTH,
  WORKING_DAYS_PER_MONTH,
} from "~/lib/scu/constants";
import {
  type AgentSelection,
  type CalculatorInput,
  type CalculatorOutput,
  type ProvisionedRecommendation,
  type UserSplit,
} from "~/lib/scu/types";

const sanitizeNumber = (value: number): number => {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
};

const round = (value: number, precision = 6): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const estimateE5IncludedScuFromLicenses = (paidUsers: number): number => {
  const included = (sanitizeNumber(paidUsers) / 1000) * E5_INCLUDED_SCU_PER_1000_USERS;
  return round(Math.min(E5_INCLUDED_SCU_CAP, included), 2);
};

const getIncludedScuMonthly = (input: CalculatorInput): number => {
  if (input.licenseTier !== "e5_security") {
    return 0;
  }
  if (input.includedPoolTier === "auto_e5_license_formula") {
    return estimateE5IncludedScuFromLicenses(input.e5PaidUserLicenses);
  }
  if (input.includedPoolTier === "custom") {
    return sanitizeNumber(input.customIncludedScuMonthly);
  }
  return INCLUDED_POOL_BY_TIER[input.includedPoolTier];
};

export const userSplitTotal = (split: UserSplit | null | undefined): number => {
  if (!split) return 0;
  return (
    sanitizeNumber(split.defender) +
    sanitizeNumber(split.entra) +
    sanitizeNumber(split.intune) +
    sanitizeNumber(split.purview) +
    sanitizeNumber(split.standalone)
  );
};

export const userSplitScuPerHour = (split: UserSplit | null | undefined): number => {
  if (!split) return 0;
  const monthly =
    sanitizeNumber(split.defender) * SCU_PER_USER_PER_MONTH.defender +
    sanitizeNumber(split.entra) * SCU_PER_USER_PER_MONTH.entra +
    sanitizeNumber(split.intune) * SCU_PER_USER_PER_MONTH.intune +
    sanitizeNumber(split.purview) * SCU_PER_USER_PER_MONTH.purview +
    sanitizeNumber(split.standalone) * SCU_PER_USER_PER_MONTH.standalone;
  return monthly / HOURS_PER_MONTH;
};

export const selectedAgentScuPerHour = (selections: AgentSelection[] | undefined): number => {
  if (!selections || selections.length === 0) {
    return 0;
  }
  let totalScuPerMonth = 0;
  for (const selection of selections) {
    const agent = SECURITY_COPILOT_AGENTS.find((entry) => entry.id === selection.agentId);
    if (!agent) {
      continue;
    }
    totalScuPerMonth += sanitizeNumber(agent.scuPerRun) * sanitizeNumber(selection.runsPerMonth);
  }
  return totalScuPerMonth / HOURS_PER_MONTH;
};

const getEffectiveConsumedScuPerHour = (input: CalculatorInput): number => {
  if (input.estimatorMode === "direct") {
    return sanitizeNumber(input.consumedScuPerHour);
  }

  const splitActive = userSplitTotal(input.userSplit) > 0;

  // Chat usage from users in the standalone portal + embedded experiences.
  // Workday-based, not 24/7: users × messages/workday × 22 working days × 0.25 SCU/message.
  // Converted to SCU/hour by dividing by HOURS_PER_MONTH so the existing pipeline (which
  // multiplies by 730 hours) lands at the correct monthly figure.
  const chatScuPerMonth =
    sanitizeNumber(input.analystCount) *
    sanitizeNumber(input.messagesPerWorkday) *
    WORKING_DAYS_PER_MONTH *
    SCU_PER_CHAT_MESSAGE;

  const analystLoad = splitActive
    ? userSplitScuPerHour(input.userSplit)
    : chatScuPerMonth / HOURS_PER_MONTH;

  const agentLoad =
    sanitizeNumber(input.agentCount) *
    sanitizeNumber(input.runsPerAgentPerHour) *
    sanitizeNumber(input.scuPerRun);

  const pickerLoad = selectedAgentScuPerHour(input.selectedAgents);

  return round(
    analystLoad + agentLoad + sanitizeNumber(input.backgroundScuPerHour) + pickerLoad,
  );
};

const buildWarnings = (
  input: CalculatorInput,
  includedScuMonthly: number,
): string[] => {
  const warnings: string[] = [];

  if (input.licenseTier === "m365_e3") {
    warnings.push(
      "Current inclusion documentation references Microsoft 365 E5 paid-user pools. This E3 scenario assumes no bundled included SCUs unless your contract states otherwise.",
    );
  }

  if (input.licenseTier === "e5_security") {
    warnings.push(
      "E5 monthly included SCUs are modeled with the published formula: 400 SCUs per 1,000 paid E5 users, capped at 10,000.",
    );

    if (input.includedPoolTier === "custom") {
      warnings.push(
        "Custom included SCU amount is a manual assumption and should be reconciled with current Microsoft contracts.",
      );
    }

    if (input.includedPoolTier === "auto_e5_license_formula" && input.e5PaidUserLicenses <= 0) {
      warnings.push(
        "Paid E5 user count is set to 0. Included monthly pool resolves to 0 until a positive value is provided.",
      );
    }
  }

  if (input.mode === "e5_included" && includedScuMonthly === 0) {
    warnings.push(
      "E5 included mode selected without an included monthly pool. Costs will behave as pure overage.",
    );
  }

  return warnings;
};

export type { ProvisionedRecommendation } from "~/lib/scu/types";

/**
 * Recommends the cheapest steady-state provisioned commitment to cover a given monthly overage SCU.
 *
 * Provisioned billing: pay `N × $4 × 730 hours` regardless of usage.
 * Overage billing: pay `consumed × $6` per SCU consumed beyond the pool / commitment.
 *
 * For a steady C SCU/month overage, the cost-minimising integer commitment is `ceil(C / 730)`.
 * Below ~487 SCU/month, even 1 SCU/hour committed is more expensive than pure overage,
 * so we report no recommendation.
 */
const recommendProvisioned = (
  monthlyOverageScu: number,
  provisionedRateUsd: number,
  overageRateUsd: number,
): ProvisionedRecommendation => {
  const consumed = sanitizeNumber(monthlyOverageScu);
  const provRate = sanitizeNumber(provisionedRateUsd);
  const overRate = sanitizeNumber(overageRateUsd);
  const allOverageCost = consumed * overRate;

  if (consumed <= 0 || provRate <= 0 || overRate <= 0) {
    return {
      provisionedScuPerHour: 0,
      monthlyCostUsd: 0,
      monthlySavingsUsd: 0,
      remainingOverageScuMonthly: 0,
      worthProvisioning: false,
    };
  }

  const provisionedScuPerHour = Math.max(1, Math.ceil(consumed / HOURS_PER_MONTH));
  const provisionedCapacity = provisionedScuPerHour * HOURS_PER_MONTH;
  const remainingOverage = Math.max(0, consumed - provisionedCapacity);
  const provisionedCost =
    provisionedScuPerHour * provRate * HOURS_PER_MONTH + remainingOverage * overRate;
  const savings = allOverageCost - provisionedCost;

  return {
    provisionedScuPerHour,
    monthlyCostUsd: round(provisionedCost),
    monthlySavingsUsd: round(savings),
    remainingOverageScuMonthly: round(remainingOverage),
    worthProvisioning: savings > 0,
  };
};

export const calculateScuEstimate = (input: CalculatorInput): CalculatorOutput => {
  const effectiveConsumedScuPerHour = getEffectiveConsumedScuPerHour(input);
  const includedScuMonthly = getIncludedScuMonthly(input);

  const provisionedScuPerHour = sanitizeNumber(input.provisionedScuPerHour);
  const provisionedRateUsd = sanitizeNumber(input.provisionedRateUsd);
  const overageRateUsd = sanitizeNumber(input.overageRateUsd);

  let hourlyUsd = 0;
  let billableOverageScuHourly = 0;
  let billableOverageScuMonthly = 0;

  if (input.mode === "provisioned_overage") {
    const hourlyProvisionedCost = provisionedScuPerHour * provisionedRateUsd;
    billableOverageScuHourly = Math.max(
      effectiveConsumedScuPerHour - provisionedScuPerHour,
      0,
    );
    const hourlyOverageCost = billableOverageScuHourly * overageRateUsd;
    hourlyUsd = hourlyProvisionedCost + hourlyOverageCost;
    billableOverageScuMonthly = billableOverageScuHourly * HOURS_PER_MONTH;
  } else {
    const monthlyConsumedScu = effectiveConsumedScuPerHour * HOURS_PER_MONTH;
    billableOverageScuMonthly = Math.max(monthlyConsumedScu - includedScuMonthly, 0);
    billableOverageScuHourly = billableOverageScuMonthly / HOURS_PER_MONTH;
    hourlyUsd = (billableOverageScuMonthly * overageRateUsd) / HOURS_PER_MONTH;
  }

  const monthlyUsd = hourlyUsd * HOURS_PER_MONTH;
  const annualUsd = hourlyUsd * HOURS_PER_YEAR;
  const safeFxRate = sanitizeNumber(input.fxRate) || 1;

  const provisionedRecommendation = recommendProvisioned(
    billableOverageScuMonthly,
    provisionedRateUsd,
    overageRateUsd,
  );

  return {
    effectiveConsumedScuPerHour: round(effectiveConsumedScuPerHour),
    hourlyUsd: round(hourlyUsd),
    monthlyUsd: round(monthlyUsd),
    annualUsd: round(annualUsd),
    includedScuMonthly: round(includedScuMonthly),
    billableOverageScuHourly: round(billableOverageScuHourly),
    billableOverageScuMonthly: round(billableOverageScuMonthly),
    currencyTotals: {
      currency: input.fxCurrency,
      fxRate: round(safeFxRate),
      hourly: round(hourlyUsd * safeFxRate),
      monthly: round(monthlyUsd * safeFxRate),
      annual: round(annualUsd * safeFxRate),
    },
    warnings: buildWarnings(input, includedScuMonthly),
    provisionedRecommendation,
  };
};
