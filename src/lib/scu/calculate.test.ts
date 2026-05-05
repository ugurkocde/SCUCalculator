import { describe, expect, it } from "vitest";

import { DEFAULT_INPUT, HOURS_PER_MONTH, HOURS_PER_YEAR } from "~/lib/scu/constants";
import { calculateScuEstimate } from "~/lib/scu/calculate";
import { type CalculatorInput } from "~/lib/scu/types";

const baseInput = (): CalculatorInput => ({ ...DEFAULT_INPUT });

describe("calculateScuEstimate", () => {
  it("uses direct consumed SCU for direct mode", () => {
    const input = baseInput();
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 25;
    input.mode = "provisioned_overage";
    input.provisionedScuPerHour = 10;

    const output = calculateScuEstimate(input);

    expect(output.effectiveConsumedScuPerHour).toBe(25);
    expect(output.billableOverageScuHourly).toBe(15);
  });

  it("calculates guided estimator correctly", () => {
    const input = baseInput();
    input.estimatorMode = "guided";
    input.analystCount = 10;
    input.promptsPerAnalystPerHour = 4;
    input.scuPerPrompt = 0.2;
    input.agentCount = 3;
    input.runsPerAgentPerHour = 2;
    input.scuPerRun = 0.5;
    input.backgroundScuPerHour = 1;

    const output = calculateScuEstimate(input);

    expect(output.effectiveConsumedScuPerHour).toBe(12);
  });

  it("applies provisioned and overage math", () => {
    const input = baseInput();
    input.mode = "provisioned_overage";
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 18;
    input.provisionedScuPerHour = 10;
    input.provisionedRateUsd = 4;
    input.overageRateUsd = 6;

    const output = calculateScuEstimate(input);

    expect(output.hourlyUsd).toBe(88);
    expect(output.billableOverageScuHourly).toBe(8);
    expect(output.billableOverageScuMonthly).toBe(8 * HOURS_PER_MONTH);
  });

  it("applies E5 included monthly pool before overage", () => {
    const input = baseInput();
    input.mode = "e5_included";
    input.licenseTier = "e5_security";
    input.includedPoolTier = "auto_e5_license_formula";
    input.e5PaidUserLicenses = 4000;
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 10;
    input.overageRateUsd = 6;

    const output = calculateScuEstimate(input);

    expect(output.billableOverageScuMonthly).toBe(5700);
    expect(output.monthlyUsd).toBe(34200);
    expect(output.hourlyUsd).toBeCloseTo(34200 / HOURS_PER_MONTH, 6);
  });

  it("calculates monthly and annual rollups", () => {
    const input = baseInput();
    input.mode = "provisioned_overage";
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 10;
    input.provisionedScuPerHour = 10;
    input.provisionedRateUsd = 4;
    input.overageRateUsd = 6;

    const output = calculateScuEstimate(input);

    expect(output.hourlyUsd).toBe(40);
    expect(output.monthlyUsd).toBe(40 * HOURS_PER_MONTH);
    expect(output.annualUsd).toBe(40 * HOURS_PER_YEAR);
  });

  it("converts totals with FX rate", () => {
    const input = baseInput();
    input.mode = "provisioned_overage";
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 10;
    input.provisionedScuPerHour = 10;
    input.provisionedRateUsd = 4;
    input.fxCurrency = "EUR";
    input.fxRate = 0.9;

    const output = calculateScuEstimate(input);

    expect(output.currencyTotals.currency).toBe("EUR");
    expect(output.currencyTotals.hourly).toBe(36);
    expect(output.currencyTotals.monthly).toBe(26280);
  });

  it("uses the user split to derive workload when set, replacing the analyst formula", () => {
    const baseline = baseInput();
    baseline.userSplit = null;

    const split = baseInput();
    split.userSplit = {
      defender: 100,
      entra: 0,
      intune: 0,
      purview: 0,
      standalone: 0,
    };
    // 100 Defender users × 5 SCU/user/month = 500 SCU/month from analysts
    // baseline analystLoad: 8 × 4 × 0.12 = 3.84 SCU/hour × 730 = 2,803.2 SCU/month
    const baselineOutput = calculateScuEstimate(baseline);
    const splitOutput = calculateScuEstimate(split);

    expect(splitOutput.effectiveConsumedScuPerHour).toBeLessThan(
      baselineOutput.effectiveConsumedScuPerHour,
    );
  });

  it("ignores the user split when all five values are zero", () => {
    const input = baseInput();
    input.userSplit = {
      defender: 0,
      entra: 0,
      intune: 0,
      purview: 0,
      standalone: 0,
    };
    const baselineOutput = calculateScuEstimate(baseInput());
    const splitOutput = calculateScuEstimate(input);

    expect(splitOutput.effectiveConsumedScuPerHour).toBe(
      baselineOutput.effectiveConsumedScuPerHour,
    );
  });

  it("returns licensing warnings", () => {
    const e3 = baseInput();
    e3.licenseTier = "m365_e3";
    const e3Output = calculateScuEstimate(e3);

    const e5 = baseInput();
    e5.licenseTier = "e5_security";
    const e5Output = calculateScuEstimate(e5);

    expect(e3Output.warnings.join(" ")).toContain("E3 scenario");
    expect(e5Output.warnings.join(" ")).toContain("400 SCUs per 1,000");
  });

  it("recommends a provisioned commitment that saves money when overage is large", () => {
    const input = baseInput();
    input.mode = "e5_included";
    input.licenseTier = "e5_security";
    input.includedPoolTier = "auto_e5_license_formula";
    input.e5PaidUserLicenses = 1000;
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 5;

    const output = calculateScuEstimate(input);

    expect(output.provisionedRecommendation.worthProvisioning).toBe(true);
    expect(output.provisionedRecommendation.provisionedScuPerHour).toBe(
      Math.max(1, Math.ceil(output.billableOverageScuMonthly / HOURS_PER_MONTH)),
    );
    expect(output.provisionedRecommendation.monthlySavingsUsd).toBeGreaterThan(0);
    expect(output.provisionedRecommendation.monthlyCostUsd).toBeLessThan(output.monthlyUsd);
  });

  it("does not recommend provisioning when overage is below the break-even", () => {
    const input = baseInput();
    input.mode = "e5_included";
    input.licenseTier = "e5_security";
    input.includedPoolTier = "auto_e5_license_formula";
    input.e5PaidUserLicenses = 1000;
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 0.6;

    const output = calculateScuEstimate(input);

    expect(output.billableOverageScuMonthly).toBeGreaterThan(0);
    expect(output.billableOverageScuMonthly).toBeLessThan(487);
    expect(output.provisionedRecommendation.worthProvisioning).toBe(false);
  });

  it("returns a zero recommendation when there is no overage", () => {
    const input = baseInput();
    input.mode = "e5_included";
    input.licenseTier = "e5_security";
    input.includedPoolTier = "auto_e5_license_formula";
    input.e5PaidUserLicenses = 100000;
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 0.1;

    const output = calculateScuEstimate(input);

    expect(output.billableOverageScuMonthly).toBe(0);
    expect(output.provisionedRecommendation.worthProvisioning).toBe(false);
    expect(output.provisionedRecommendation.monthlySavingsUsd).toBe(0);
  });

  it("caps E5 included pool at 10,000 SCUs in auto formula mode", () => {
    const input = baseInput();
    input.mode = "e5_included";
    input.licenseTier = "e5_security";
    input.includedPoolTier = "auto_e5_license_formula";
    input.e5PaidUserLicenses = 50000;
    input.estimatorMode = "direct";
    input.consumedScuPerHour = 25;

    const output = calculateScuEstimate(input);

    expect(output.includedScuMonthly).toBe(10000);
  });
});
