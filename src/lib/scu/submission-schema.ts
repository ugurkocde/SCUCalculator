import { z } from "zod";

import { type CalculatorInput } from "~/lib/scu/types";

export const ANONYMOUS_SUBMISSION_CONSENT_VERSION = "anonymous-submissions-v1";
export const SCU_FORMULA_VERSION = "scu-calculator-v1";

const MAX_CALCULATOR_INPUT_VALUE = 1_000_000_000;
const MAX_OBSERVED_MONTHLY_SCU = 10_000_000;
const MAX_OBSERVED_MONTHLY_COST_USD = 100_000_000;
const MAX_FX_RATE = 1_000_000;

const boundedNonNegativeNumberSchema = z
  .number()
  .finite()
  .min(0)
  .max(MAX_CALCULATOR_INPUT_VALUE);

const observedMonthlyScuSchema = z
  .number()
  .finite()
  .min(0)
  .max(MAX_OBSERVED_MONTHLY_SCU);

const observedMonthlyCostUsdSchema = z
  .number()
  .finite()
  .min(0)
  .max(MAX_OBSERVED_MONTHLY_COST_USD);

const calculatorInputSchema = z
  .object({
    mode: z.enum(["e5_included", "provisioned_overage"]),
    licenseTier: z.enum(["e5_security", "m365_e3", "standalone"]),
    includedPoolTier: z.enum(["none", "auto_e5_license_formula", "custom"]),
    customIncludedScuMonthly: boundedNonNegativeNumberSchema,
    e5PaidUserLicenses: boundedNonNegativeNumberSchema,
    estimatorMode: z.enum(["guided", "direct"]),
    consumedScuPerHour: boundedNonNegativeNumberSchema,
    provisionedScuPerHour: boundedNonNegativeNumberSchema,
    provisionedRateUsd: boundedNonNegativeNumberSchema,
    overageRateUsd: boundedNonNegativeNumberSchema,
    fxCurrency: z.enum(["USD", "EUR", "GBP", "TRY", "CAD", "AUD", "JPY"]),
    fxRate: z.number().finite().positive().max(MAX_FX_RATE),
    analystCount: boundedNonNegativeNumberSchema,
    promptsPerAnalystPerHour: boundedNonNegativeNumberSchema,
    scuPerPrompt: boundedNonNegativeNumberSchema,
    messagesPerWorkday: boundedNonNegativeNumberSchema,
    agentCount: boundedNonNegativeNumberSchema,
    runsPerAgentPerMonth: boundedNonNegativeNumberSchema,
    backgroundScuPerHour: boundedNonNegativeNumberSchema,
    selectedAgents: z
      .array(
        z
          .object({
            agentId: z
              .string()
              .min(1)
              .max(80)
              .regex(/^[a-z0-9-]+$/),
            runsPerMonth: boundedNonNegativeNumberSchema,
          })
          .strict(),
      )
      .max(50),
  })
  .strict() satisfies z.ZodType<CalculatorInput>;

export const submissionEnvironmentSchema = z
  .object({
    regionBand: z
      .enum([
        "north_america",
        "europe",
        "asia_pacific",
        "latin_america",
        "middle_east_africa",
        "global_multi_region",
      ])
      .optional(),
  })
  .strict();

export const anonymousSubmissionRequestSchema = z
  .object({
    input: calculatorInputSchema,
    observedMonthlyScu: observedMonthlyScuSchema.nullish(),
    observedMonthlyCostUsd: observedMonthlyCostUsdSchema.nullish(),
    environment: submissionEnvironmentSchema,
    consentAccepted: z.literal(true),
    consentVersion: z.literal(ANONYMOUS_SUBMISSION_CONSENT_VERSION),
  })
  .strict();

export type AnonymousSubmissionRequest = z.infer<
  typeof anonymousSubmissionRequestSchema
>;
export type SubmissionEnvironment = z.infer<typeof submissionEnvironmentSchema>;

const FORBIDDEN_IDENTIFIER_KEYS = new Set([
  "company",
  "companyname",
  "domain",
  "email",
  "freetext",
  "notes",
  "tenantid",
]);

const normalizeIdentifierKey = (key: string): string =>
  key.normalize("NFKC").replace(/[\s_-]/g, "").toLowerCase();

export const findDirectIdentifierPath = (
  value: unknown,
  path: string[] = [],
): string[] | null => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nestedPath = findDirectIdentifierPath(value[index], [
        ...path,
        String(index),
      ]);
      if (nestedPath) {
        return nestedPath;
      }
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (FORBIDDEN_IDENTIFIER_KEYS.has(normalizeIdentifierKey(key))) {
      return nextPath;
    }

    const nestedPath = findDirectIdentifierPath(nestedValue, nextPath);
    if (nestedPath) {
      return nestedPath;
    }
  }

  return null;
};
