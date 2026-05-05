import {
  type CalculatorInput,
  type CurrencyCode,
  type IncludedPoolTier,
  type SourceReference,
} from "~/lib/scu/types";

export const HOURS_PER_MONTH = 730;
export const HOURS_PER_YEAR = 8760;
export const WORKING_DAYS_PER_MONTH = 22;
export const SCU_PER_CHAT_MESSAGE = 0.25;
export const E5_INCLUDED_SCU_PER_1000_USERS = 400;
export const E5_INCLUDED_SCU_CAP = 10000;

export const DEFAULT_PROVISIONED_RATE_USD = 4;
export const DEFAULT_OVERAGE_RATE_USD = 6;

export const INCLUDED_POOL_BY_TIER: Record<IncludedPoolTier, number> = {
  none: 0,
  auto_e5_license_formula: 0,
  custom: 0,
};

export const DEFAULT_INPUT: CalculatorInput = {
  mode: "e5_included",
  licenseTier: "e5_security",
  includedPoolTier: "auto_e5_license_formula",
  customIncludedScuMonthly: 1600,
  e5PaidUserLicenses: 1000,
  estimatorMode: "guided",
  consumedScuPerHour: 12,
  provisionedScuPerHour: 10,
  provisionedRateUsd: DEFAULT_PROVISIONED_RATE_USD,
  overageRateUsd: DEFAULT_OVERAGE_RATE_USD,
  fxCurrency: "USD",
  fxRate: 1,
  analystCount: 8,
  promptsPerAnalystPerHour: 4,
  scuPerPrompt: 0.12,
  messagesPerWorkday: 5,
  agentCount: 0,
  runsPerAgentPerHour: 3,
  scuPerRun: 0.18,
  backgroundScuPerHour: 0,
  selectedAgents: [],
};

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "TRY", label: "Turkish Lira" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
];

export const SCU_SOURCES: SourceReference[] = [
  {
    id: "inclusion-faq",
    title: "Security Copilot inclusion in Microsoft 365 E5 and E7",
    publisher: "Microsoft Learn",
    url: "https://learn.microsoft.com/copilot/security/security-copilot-inclusion",
    description:
      "Canonical FAQ for the auto-inclusion program: rollout timeline, $6/SCU overage, scope, and confirmation that E3 is not part of the inclusion.",
  },
  {
    id: "security-store",
    title: "Microsoft Security Store",
    publisher: "Microsoft",
    url: "https://securitystore.microsoft.com",
    description:
      "Official Security Store listing Microsoft and partner Security Copilot agents. Per-agent SCU consumption is published per listing where available.",
  },
  {
    id: "pricing",
    title: "Microsoft Security Copilot pricing",
    publisher: "Microsoft Security",
    url: "https://www.microsoft.com/en-us/security/pricing/microsoft-security-copilot",
    description:
      "Official pricing model and billing examples, including sample values of $4/SCU and $6/SCU in public documentation examples.",
  },
  {
    id: "get-started-included",
    title: "Get started with Security Copilot",
    publisher: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/copilot/security/get-started-security-copilot",
    description:
      "Current inclusion model reference: 400 included SCUs per 1,000 paid Microsoft 365 E5 users (up to 10,000), with purchase guidance constraints.",
  },
  {
    id: "manage-usage",
    title: "Manage Security Copilot usage and budget",
    publisher: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/copilot/security/manage-usage?tabs=securitycomputeunits%2Cprovisioned",
    description:
      "Capacity, overage billing behavior, and SCU monitoring guidance for budget control.",
  },
  {
    id: "ignite-2025",
    title: "Security Copilot announcements at Ignite 2025",
    publisher: "Microsoft Security Blog",
    url: "https://www.microsoft.com/en-us/security/blog/2025/11/18/microsoft-security-copilot-announcements-at-microsoft-ignite-2025/",
    description:
      "Context on bundled M365 E5 and E5 Security experiences and general availability messaging.",
  },
  {
    id: "m365-e5-inclusion",
    title: "Microsoft 365 Copilot Security included in E5",
    publisher: "Microsoft 365 Blog",
    url: "https://www.microsoft.com/en-us/microsoft-365/blog/2025/12/04/microsoft-365-copilot-security-is-now-included-in-microsoft-365-e5-and-e5-security/",
    description:
      "Official M365 announcement on E5/E5 Security inclusion and rollout context.",
  },
  {
    id: "capacity-guidance",
    title: "Estimate and monitor SCU use",
    publisher: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/copilot/security/estimate-scu",
    description:
      "Workload estimation methodology for analysts, prompts, and agent activity planning.",
  },
];

const buildDateRaw = process.env.BUILD_DATE;
export const BUILD_DATE: string =
  buildDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(buildDateRaw)
    ? buildDateRaw
    : "2026-05-05";

export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://scucalculator.com";
