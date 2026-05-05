import {
  type AgentSelection,
  type CalculatorInput,
  type LicenseTier,
} from "~/lib/scu/types";

export type AgentIntensity = "none" | "few" | "many";

export type QuickLicenseProfile = "e5_or_e7" | "standalone";

export interface AgentIntensityPreset {
  id: AgentIntensity;
  label: string;
  description: string;
  agentCount: number;
}

export const AGENT_INTENSITY_PRESETS: AgentIntensityPreset[] = [
  {
    id: "none",
    label: "No agents",
    description: "Analysts only",
    agentCount: 0,
  },
  {
    id: "few",
    label: "A few",
    description: "2 agents enabled",
    agentCount: 2,
  },
  {
    id: "many",
    label: "Many",
    description: "8 agents enabled",
    agentCount: 8,
  },
];

export interface WorkloadSizeHint {
  label: "Light" | "Standard" | "Heavy";
  description: string;
}

export const workloadSizeHint = (analystCount: number): WorkloadSizeHint => {
  if (analystCount <= 4) {
    return {
      label: "Light",
      description: "Small team, evaluating Copilot",
    };
  }
  if (analystCount <= 14) {
    return {
      label: "Standard",
      description: "Mid-sized team, regular use",
    };
  }
  return {
    label: "Heavy",
    description: "Large team, multi-shift coverage",
  };
};

export const licenseTierForProfile = (profile: QuickLicenseProfile): LicenseTier => {
  return profile === "e5_or_e7" ? "e5_security" : "standalone";
};

export interface QuickEstimateValues {
  licenseProfile: QuickLicenseProfile;
  paidE5Users: number;
  analystCount: number;
  messagesPerWorkday: number;
  agentIntensity: AgentIntensity;
}

export const QUICK_DEFAULT_VALUES: QuickEstimateValues = {
  licenseProfile: "e5_or_e7",
  paidE5Users: 1000,
  analystCount: 8,
  messagesPerWorkday: 5,
  agentIntensity: "none",
};

const intensityPreset = (intensity: AgentIntensity): AgentIntensityPreset => {
  const found = AGENT_INTENSITY_PRESETS.find((preset) => preset.id === intensity);
  return found ?? AGENT_INTENSITY_PRESETS[0]!;
};

export const buildQuickInputPatch = (
  values: QuickEstimateValues,
  context?: { hasAgentSelections?: boolean },
): Partial<CalculatorInput> => {
  const licenseTier = licenseTierForProfile(values.licenseProfile);
  const intensity = intensityPreset(values.agentIntensity);
  const pickerOverrides = Boolean(context?.hasAgentSelections);

  return {
    mode: "e5_included",
    licenseTier,
    includedPoolTier:
      licenseTier === "e5_security" ? "auto_e5_license_formula" : "none",
    e5PaidUserLicenses: Math.max(0, values.paidE5Users),
    estimatorMode: "guided",
    analystCount: Math.max(0, values.analystCount),
    messagesPerWorkday: Math.max(0, values.messagesPerWorkday),
    agentCount: pickerOverrides ? 0 : intensity.agentCount,
  };
};

export interface ScenarioPreset {
  id: "small" | "mid" | "enterprise";
  label: string;
  summary: string;
  values: QuickEstimateValues;
  selectedAgents: AgentSelection[];
}

/**
 * Three "start with an example" scenarios. Numbers are picked so each tells a
 * distinct story when calculated against the E5 inclusion formula:
 *   - Small: comfortably inside the pool ($0/mo)
 *   - Mid-market: moderate overage from chat + a couple of agents
 *   - Enterprise: pool capped at 10,000 SCU; heavy agent automation pushes past it
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "small",
    label: "Small business",
    summary: "250 E5 users · 2 admins · stays within pool",
    values: {
      licenseProfile: "e5_or_e7",
      paidE5Users: 250,
      analystCount: 2,
      messagesPerWorkday: 5,
      agentIntensity: "none",
    },
    selectedAgents: [],
  },
  {
    id: "mid",
    label: "Mid-market",
    summary: "1,500 E5 users · 10 admins · 2 agents",
    values: {
      licenseProfile: "e5_or_e7",
      paidE5Users: 1500,
      analystCount: 10,
      messagesPerWorkday: 8,
      agentIntensity: "few",
    },
    selectedAgents: [],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    summary: "25,000 E5 users · 40 admins · heavy agent use",
    values: {
      licenseProfile: "e5_or_e7",
      paidE5Users: 25000,
      analystCount: 40,
      messagesPerWorkday: 15,
      agentIntensity: "none",
    },
    selectedAgents: [
      { agentId: "phishing-triage", runsPerMonth: 10000 },
      { agentId: "alert-triage", runsPerMonth: 6000 },
      { agentId: "vulnerability-remediation", runsPerMonth: 2500 },
      { agentId: "identity-risk-management", runsPerMonth: 800 },
      { agentId: "conditional-access-optimization", runsPerMonth: 200 },
    ],
  },
];

export const buildScenarioPatch = (
  preset: ScenarioPreset,
): Partial<CalculatorInput> => ({
  ...buildQuickInputPatch(preset.values, {
    hasAgentSelections: preset.selectedAgents.length > 0,
  }),
  selectedAgents: preset.selectedAgents,
});

export const inferQuickValuesFromInput = (
  input: CalculatorInput,
): QuickEstimateValues => {
  const licenseProfile: QuickLicenseProfile =
    input.licenseTier === "e5_security" ? "e5_or_e7" : "standalone";

  const intensity: AgentIntensity =
    input.agentCount <= 0 ? "none" : input.agentCount <= 4 ? "few" : "many";

  return {
    licenseProfile,
    paidE5Users: input.e5PaidUserLicenses,
    analystCount: input.analystCount,
    messagesPerWorkday: input.messagesPerWorkday,
    agentIntensity: intensity,
  };
};
