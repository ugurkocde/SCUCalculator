import { describe, expect, it } from "vitest";

import {
  PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
  productivitySubmissionRequestSchema,
} from "~/lib/scu/productivity-schema";

const validSubmission = () => ({
  useCase: "phishing_triage" as const,
  teamHoursSavedPerMonth: 40,
  environment: {
    regionBand: "europe" as const,
    paidUserBand: "1000_4999" as const,
  },
  consentAccepted: true,
  consentVersion: PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
});

describe("productivitySubmissionRequestSchema", () => {
  it("accepts the productivity submission contract", () => {
    const parsed = productivitySubmissionRequestSchema.safeParse(
      validSubmission(),
    );

    expect(parsed.success).toBe(true);
  });

  it("accepts an empty environment", () => {
    const parsed = productivitySubmissionRequestSchema.safeParse({
      ...validSubmission(),
      environment: {},
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts each use case in the closed list", () => {
    const cases = [
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

    for (const useCase of cases) {
      const parsed = productivitySubmissionRequestSchema.safeParse({
        ...validSubmission(),
        useCase,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects unknown use cases", () => {
    const parsed = productivitySubmissionRequestSchema.safeParse({
      ...validSubmission(),
      useCase: "writing_marketing_copy",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects zero or negative team hours", () => {
    expect(
      productivitySubmissionRequestSchema.safeParse({
        ...validSubmission(),
        teamHoursSavedPerMonth: 0,
      }).success,
    ).toBe(false);

    expect(
      productivitySubmissionRequestSchema.safeParse({
        ...validSubmission(),
        teamHoursSavedPerMonth: -5,
      }).success,
    ).toBe(false);
  });

  it("rejects team hours above the realistic cap", () => {
    const parsed = productivitySubmissionRequestSchema.safeParse({
      ...validSubmission(),
      teamHoursSavedPerMonth: 1_000_000,
    });

    expect(parsed.success).toBe(false);
  });

  it.each([
    "email",
    "tenantId",
    "companyName",
    "domain",
    "notes",
    "hourlyRate",
    "computedSavingsUsd",
  ] as const)("rejects extraneous field %s on the request", (field) => {
    const parsed = productivitySubmissionRequestSchema.safeParse({
      ...validSubmission(),
      [field]: "anything",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects uncontrolled environment fields", () => {
    const parsed = productivitySubmissionRequestSchema.safeParse({
      ...validSubmission(),
      environment: {
        ...validSubmission().environment,
        industry: "finance",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("requires explicit consent at the active version", () => {
    expect(
      productivitySubmissionRequestSchema.safeParse({
        ...validSubmission(),
        consentAccepted: false,
      }).success,
    ).toBe(false);

    expect(
      productivitySubmissionRequestSchema.safeParse({
        ...validSubmission(),
        consentVersion: "productivity-submissions-v0",
      }).success,
    ).toBe(false);
  });
});
