import { describe, expect, it } from "vitest";

import { DEFAULT_INPUT } from "~/lib/scu/constants";
import {
  anonymousSubmissionRequestSchema,
  findDirectIdentifierPath,
} from "~/lib/scu/submission-schema";

const validSubmission = () => ({
  input: DEFAULT_INPUT,
  observedMonthlyScu: 1200,
  observedMonthlyCostUsd: null,
  environment: {
    organizationSizeBand: "1000_4999",
    securityTeamSizeBand: "21_50",
    region: "europe",
    cloud: "commercial",
    industry: "technology",
    deploymentStage: "pilot",
  },
  consentAccepted: true,
  consentVersion: "anonymous-submissions-v1",
});

describe("anonymousSubmissionRequestSchema", () => {
  it("accepts the anonymous submission contract", () => {
    const parsed =
      anonymousSubmissionRequestSchema.safeParse(validSubmission());

    expect(parsed.success).toBe(true);
  });

  it.each(["email", "tenantId", "companyName", "domain", "notes"] as const)(
    "rejects identifier-like field %s",
    (field) => {
      const parsed = anonymousSubmissionRequestSchema.safeParse({
        ...validSubmission(),
        [field]: "contoso.example",
      });

      expect(parsed.success).toBe(false);
    },
  );

  it("requires explicit consent for the active consent version", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      consentAccepted: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires consent version", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      consentVersion: undefined,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects uncontrolled environment fields", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      environment: {
        ...validSubmission().environment,
        customLabel: "anything",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts the controlled environment shape sent by the UI", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      environment: {
        regionBand: "north_america",
        industryCategory: "technology",
        paidUserBand: "1000_4999",
        activeAdminBand: "5_14",
        productsUsed: ["sentinel"],
        agentCategories: ["microsoft_first_party"],
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects client-supplied duplicate fingerprints", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      duplicateFingerprint: "browser-session_abc12345",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects observed monthly SCU above the realistic cap", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      observedMonthlyScu: 1e12,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects observed monthly cost above the realistic cap", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      observedMonthlyCostUsd: 1e12,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unbounded calculator-input numerics", () => {
    const parsed = anonymousSubmissionRequestSchema.safeParse({
      ...validSubmission(),
      input: {
        ...DEFAULT_INPUT,
        e5PaidUserLicenses: 1e15,
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("findDirectIdentifierPath", () => {
  it.each([
    ["email"],
    ["tenant ID"],
    ["tenantId"],
    ["company"],
    ["companyName"],
    ["domain"],
    ["freeText"],
    ["notes"],
  ])("finds direct identifier key %s anywhere in the payload", (key) => {
    const payload = {
      input: DEFAULT_INPUT,
      environment: {
        nested: {
          [key]: "identifier",
        },
      },
    };

    expect(findDirectIdentifierPath(payload)).toEqual([
      "environment",
      "nested",
      key,
    ]);
  });

  it("finds direct identifier keys disguised with Unicode homoglyphs", () => {
    const fullwidthEmail = "ｅｍａｉｌ";
    const payload = {
      environment: {
        [fullwidthEmail]: "security@example.com",
      },
    };

    expect(findDirectIdentifierPath(payload)).toEqual([
      "environment",
      fullwidthEmail,
    ]);
  });
});
