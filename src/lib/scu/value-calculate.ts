import {
  SECURITY_COPILOT_AGENTS,
  type SecurityCopilotAgent,
} from "~/lib/scu/agents";

/**
 * Pure math for the /value page. Computes per-agent and total monthly value
 * from the agent catalogue, optional visitor overrides, and an hourly rate.
 *
 * Design notes:
 * - Hours and cost are always computed (rate-independent).
 * - Value and net are `number | null`; null means the visitor hasn't set a
 *   rate, so we can't compute a dollar figure honestly.
 * - Cost does not subtract the included E5/E7 SCU pool. The pool offset is a
 *   tenant-level question handled on `/`, not a per-agent question handled
 *   here.
 * - SCU overage rate is the Microsoft-published $6/SCU rate; that lives in
 *   `constants.ts` already but we keep this module self-contained.
 */

export const SCU_OVERAGE_USD = 6;
export const DEFAULT_HOURLY_RATE_USD = 100;

export interface AgentValueOverride {
  included?: boolean;
  runsPerMonth?: number;
  hoursSavedPerRun?: number;
}

export type AgentValueOverrides = Record<string, AgentValueOverride>;

export interface AgentValueRow {
  agent: SecurityCopilotAgent;
  included: boolean;
  runsPerMonth: number;
  hoursSavedPerRun: number;
  monthlyCostUsd: number;
  monthlyHoursSaved: number;
  monthlyValueUsd: number | null;
  monthlyNetUsd: number | null;
}

export interface AgentValueTotals {
  monthlyCostUsd: number;
  monthlyHoursSaved: number;
  monthlyValueUsd: number | null;
  monthlyNetUsd: number | null;
  includedAgentCount: number;
}

export interface AgentValueSnapshot {
  rows: AgentValueRow[];
  totals: AgentValueTotals;
  hourlyRateUsd: number | null;
}

const sanitizePositive = (
  value: number | undefined,
  fallback: number,
): number => {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return fallback;
  return value;
};

const sanitizeIncluded = (value: boolean | undefined): boolean => {
  return value !== false;
};

const computeRow = (
  agent: SecurityCopilotAgent,
  override: AgentValueOverride,
  hourlyRateUsd: number | null,
): AgentValueRow => {
  const included = sanitizeIncluded(override.included);
  const runsPerMonth = sanitizePositive(
    override.runsPerMonth,
    agent.defaultRunsPerMonth,
  );
  const hoursSavedPerRun = sanitizePositive(
    override.hoursSavedPerRun,
    agent.defaultHoursSavedPerRun,
  );

  const monthlyCostUsd = agent.scuPerRun * runsPerMonth * SCU_OVERAGE_USD;
  const monthlyHoursSaved = runsPerMonth * hoursSavedPerRun;

  const monthlyValueUsd =
    hourlyRateUsd === null ? null : monthlyHoursSaved * hourlyRateUsd;
  const monthlyNetUsd =
    monthlyValueUsd === null ? null : monthlyValueUsd - monthlyCostUsd;

  return {
    agent,
    included,
    runsPerMonth,
    hoursSavedPerRun,
    monthlyCostUsd,
    monthlyHoursSaved,
    monthlyValueUsd,
    monthlyNetUsd,
  };
};

const sumTotals = (rows: AgentValueRow[]): AgentValueTotals => {
  let monthlyCostUsd = 0;
  let monthlyHoursSaved = 0;
  let monthlyValueUsd: number | null = 0;
  let monthlyNetUsd: number | null = 0;
  let includedAgentCount = 0;

  for (const row of rows) {
    if (!row.included) continue;
    includedAgentCount += 1;
    monthlyCostUsd += row.monthlyCostUsd;
    monthlyHoursSaved += row.monthlyHoursSaved;
    if (row.monthlyValueUsd === null || monthlyValueUsd === null) {
      monthlyValueUsd = null;
    } else {
      monthlyValueUsd += row.monthlyValueUsd;
    }
    if (row.monthlyNetUsd === null || monthlyNetUsd === null) {
      monthlyNetUsd = null;
    } else {
      monthlyNetUsd += row.monthlyNetUsd;
    }
  }

  return {
    monthlyCostUsd,
    monthlyHoursSaved,
    monthlyValueUsd,
    monthlyNetUsd,
    includedAgentCount,
  };
};

export const calculateAgentValue = (
  overrides: AgentValueOverrides = {},
  hourlyRateUsd: number | null = DEFAULT_HOURLY_RATE_USD,
  agents: SecurityCopilotAgent[] = SECURITY_COPILOT_AGENTS,
): AgentValueSnapshot => {
  const rows = agents.map((agent) =>
    computeRow(agent, overrides[agent.id] ?? {}, hourlyRateUsd),
  );
  const totals = sumTotals(rows);

  return {
    rows,
    totals,
    hourlyRateUsd,
  };
};

/**
 * Build a baseline snapshot using only the catalogue defaults. Used by
 * /value.json so external consumers see a stable, reproducible view of the
 * vendor-neutral assumptions.
 */
export const buildBaselineValueSnapshot = (
  hourlyRateUsd: number = DEFAULT_HOURLY_RATE_USD,
) => {
  const snapshot = calculateAgentValue({}, hourlyRateUsd);
  return {
    schemaVersion: "1" as const,
    generatedAt: new Date().toISOString(),
    hourlyRateUsd,
    scuOverageRateUsd: SCU_OVERAGE_USD,
    agents: snapshot.rows.map((row) => ({
      id: row.agent.id,
      name: row.agent.name,
      product: row.agent.product,
      scuPerRun: row.agent.scuPerRun,
      scuSource: row.agent.source,
      scuSourceNote: row.agent.sourceNote,
      defaultRunsPerMonth: row.runsPerMonth,
      defaultHoursSavedPerRun: row.hoursSavedPerRun,
      hoursSavedSource: row.agent.hoursSavedSource,
      hoursSavedSourceNote: row.agent.hoursSavedSourceNote,
      docsUrl: row.agent.docsUrl,
      computed: {
        monthlyCostUsd: row.monthlyCostUsd,
        monthlyHoursSaved: row.monthlyHoursSaved,
        monthlyValueUsd: row.monthlyValueUsd,
        monthlyNetUsd: row.monthlyNetUsd,
      },
    })),
    totals: snapshot.totals,
  };
};
