import { z } from "zod";

export const PRODUCTIVITY_SUBMISSION_CONSENT_VERSION =
  "productivity-submissions-v1";

export const USE_CASES = [
  "phishing_triage",
  "incident_summarization",
  "kql_authoring",
  "threat_intel_enrichment",
  "vuln_prioritization",
  "ir_guidance",
  "identity_investigation",
  "device_investigation",
  "other",
] as const;

export type UseCase = (typeof USE_CASES)[number];

export const USE_CASE_LABEL: Record<UseCase, string> = {
  phishing_triage: "Phishing triage and investigation",
  incident_summarization: "Incident summarization",
  kql_authoring: "KQL or query authoring",
  threat_intel_enrichment: "Threat intelligence enrichment",
  vuln_prioritization: "Vulnerability prioritization",
  ir_guidance: "IR guidance and runbook generation",
  identity_investigation: "Identity and sign-in investigation",
  device_investigation: "Device and endpoint investigation",
  other: "Other",
};

export const PRODUCTIVITY_REGION_BANDS = [
  "north_america",
  "europe",
  "asia_pacific",
  "latin_america",
  "middle_east_africa",
  "global_multi_region",
] as const;

export type ProductivityRegionBand =
  (typeof PRODUCTIVITY_REGION_BANDS)[number];

export const PRODUCTIVITY_PAID_USER_BANDS = [
  "1_249",
  "250_999",
  "1000_4999",
  "5000_24999",
  "25000_plus",
] as const;

export type ProductivityPaidUserBand =
  (typeof PRODUCTIVITY_PAID_USER_BANDS)[number];

const MAX_TEAM_HOURS_SAVED_PER_MONTH = 100_000;

const teamHoursSavedSchema = z
  .number()
  .finite()
  .positive()
  .max(MAX_TEAM_HOURS_SAVED_PER_MONTH);

export const productivityEnvironmentSchema = z
  .object({
    regionBand: z.enum(PRODUCTIVITY_REGION_BANDS).optional(),
    paidUserBand: z.enum(PRODUCTIVITY_PAID_USER_BANDS).optional(),
  })
  .strict();

export const productivitySubmissionRequestSchema = z
  .object({
    useCase: z.enum(USE_CASES),
    teamHoursSavedPerMonth: teamHoursSavedSchema,
    environment: productivityEnvironmentSchema,
    consentAccepted: z.literal(true),
    consentVersion: z.literal(PRODUCTIVITY_SUBMISSION_CONSENT_VERSION),
  })
  .strict();

export type ProductivitySubmissionRequest = z.infer<
  typeof productivitySubmissionRequestSchema
>;

export type ProductivityEnvironment = z.infer<
  typeof productivityEnvironmentSchema
>;
