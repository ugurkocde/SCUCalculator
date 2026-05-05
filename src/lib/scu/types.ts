export type CalculationMode = "e5_included" | "provisioned_overage";

export type LicenseTier =
  | "e5_security"
  | "m365_e3"
  | "standalone";

export type IncludedPoolTier =
  | "none"
  | "auto_e5_license_formula"
  | "custom";

export type EstimatorMode = "guided" | "direct";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "TRY" | "CAD" | "AUD" | "JPY";

export interface AgentSelection {
  agentId: string;
  runsPerMonth: number;
}

export interface CalculatorInput {
  mode: CalculationMode;
  licenseTier: LicenseTier;
  includedPoolTier: IncludedPoolTier;
  customIncludedScuMonthly: number;
  e5PaidUserLicenses: number;
  estimatorMode: EstimatorMode;
  consumedScuPerHour: number;
  provisionedScuPerHour: number;
  provisionedRateUsd: number;
  overageRateUsd: number;
  fxCurrency: CurrencyCode;
  fxRate: number;
  analystCount: number;
  promptsPerAnalystPerHour: number;
  scuPerPrompt: number;
  messagesPerWorkday: number;
  agentCount: number;
  runsPerAgentPerHour: number;
  scuPerRun: number;
  backgroundScuPerHour: number;
  selectedAgents: AgentSelection[];
}

export interface CurrencyTotals {
  currency: CurrencyCode;
  fxRate: number;
  hourly: number;
  monthly: number;
  annual: number;
}

export interface ProvisionedRecommendation {
  provisionedScuPerHour: number;
  monthlyCostUsd: number;
  monthlySavingsUsd: number;
  remainingOverageScuMonthly: number;
  worthProvisioning: boolean;
}

export interface CalculatorOutput {
  effectiveConsumedScuPerHour: number;
  hourlyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
  includedScuMonthly: number;
  billableOverageScuHourly: number;
  billableOverageScuMonthly: number;
  currencyTotals: CurrencyTotals;
  warnings: string[];
  provisionedRecommendation: ProvisionedRecommendation;
}

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  description: string;
}
