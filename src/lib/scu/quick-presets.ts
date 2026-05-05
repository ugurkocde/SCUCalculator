import { type CalculatorInput, type LicenseTier } from "~/lib/scu/types";

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
      description: "Small SOC, evaluation phase",
    };
  }
  if (analystCount <= 14) {
    return {
      label: "Standard",
      description: "Mid-market SOC",
    };
  }
  return {
    label: "Heavy",
    description: "Enterprise SOC, multi-shift",
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
