import { describe, expect, it } from "vitest";

import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import {
  buildBaselineValueSnapshot,
  calculateAgentValue,
  DEFAULT_HOURLY_RATE_USD,
  SCU_OVERAGE_USD,
} from "~/lib/scu/value-calculate";

describe("calculateAgentValue", () => {
  it("returns one row per agent with all defaults applied", () => {
    const snapshot = calculateAgentValue();

    expect(snapshot.rows).toHaveLength(SECURITY_COPILOT_AGENTS.length);
    expect(snapshot.hourlyRateUsd).toBe(DEFAULT_HOURLY_RATE_USD);

    for (let i = 0; i < snapshot.rows.length; i += 1) {
      const row = snapshot.rows[i]!;
      const agent = SECURITY_COPILOT_AGENTS[i]!;
      expect(row.agent.id).toBe(agent.id);
      expect(row.included).toBe(true);
      expect(row.runsPerMonth).toBe(agent.defaultRunsPerMonth);
      expect(row.hoursSavedPerRun).toBe(agent.defaultHoursSavedPerRun);
      expect(row.monthlyCostUsd).toBeCloseTo(
        agent.scuPerRun * agent.defaultRunsPerMonth * SCU_OVERAGE_USD,
        5,
      );
      expect(row.monthlyHoursSaved).toBeCloseTo(
        agent.defaultRunsPerMonth * agent.defaultHoursSavedPerRun,
        5,
      );
    }
  });

  it("computes value = hours × rate and net = value - cost when rate is set", () => {
    const snapshot = calculateAgentValue(
      { "phishing-triage": { runsPerMonth: 100, hoursSavedPerRun: 0.25 } },
      100,
    );

    const row = snapshot.rows.find((r) => r.agent.id === "phishing-triage")!;
    // 100 runs × 0.25 h = 25 hours
    expect(row.monthlyHoursSaved).toBeCloseTo(25, 5);
    // 25 × $100 = $2500
    expect(row.monthlyValueUsd).toBeCloseTo(2500, 5);
    // cost = 0.5 SCU × 100 × $6 = $300
    expect(row.monthlyCostUsd).toBeCloseTo(300, 5);
    // net = $2500 - $300 = $2200
    expect(row.monthlyNetUsd).toBeCloseTo(2200, 5);
  });

  it("returns null value and null net per row when hourly rate is null", () => {
    const snapshot = calculateAgentValue({}, null);

    for (const row of snapshot.rows) {
      expect(row.monthlyValueUsd).toBeNull();
      expect(row.monthlyNetUsd).toBeNull();
      // Hours and cost still compute.
      expect(row.monthlyCostUsd).toBeGreaterThanOrEqual(0);
      expect(row.monthlyHoursSaved).toBeGreaterThan(0);
    }

    expect(snapshot.totals.monthlyValueUsd).toBeNull();
    expect(snapshot.totals.monthlyNetUsd).toBeNull();
    expect(snapshot.totals.monthlyCostUsd).toBeGreaterThan(0);
    expect(snapshot.totals.monthlyHoursSaved).toBeGreaterThan(0);
  });

  it("excludes rows where included is false from totals", () => {
    const allIncluded = calculateAgentValue({}, 100);
    const oneExcluded = calculateAgentValue(
      { "phishing-triage": { included: false } },
      100,
    );

    expect(oneExcluded.totals.includedAgentCount).toBe(
      allIncluded.totals.includedAgentCount - 1,
    );
    expect(oneExcluded.totals.monthlyCostUsd).toBeLessThan(
      allIncluded.totals.monthlyCostUsd,
    );
    expect(oneExcluded.totals.monthlyValueUsd).toBeLessThan(
      allIncluded.totals.monthlyValueUsd!,
    );

    // The excluded row still appears in rows, just with included=false.
    const excluded = oneExcluded.rows.find(
      (r) => r.agent.id === "phishing-triage",
    )!;
    expect(excluded.included).toBe(false);
    expect(excluded.monthlyCostUsd).toBeGreaterThan(0);
  });

  it("falls back to defaults for invalid override values", () => {
    const snapshot = calculateAgentValue(
      {
        "phishing-triage": {
          runsPerMonth: Number.NaN,
          hoursSavedPerRun: -1,
        },
      },
      100,
    );

    const row = snapshot.rows.find((r) => r.agent.id === "phishing-triage")!;
    const agent = SECURITY_COPILOT_AGENTS.find(
      (a) => a.id === "phishing-triage",
    )!;
    expect(row.runsPerMonth).toBe(agent.defaultRunsPerMonth);
    expect(row.hoursSavedPerRun).toBe(agent.defaultHoursSavedPerRun);
  });

  it("accepts zero runs and zero hours saved without throwing", () => {
    const snapshot = calculateAgentValue(
      {
        "phishing-triage": { runsPerMonth: 0, hoursSavedPerRun: 0 },
      },
      100,
    );

    const row = snapshot.rows.find((r) => r.agent.id === "phishing-triage")!;
    expect(row.runsPerMonth).toBe(0);
    expect(row.hoursSavedPerRun).toBe(0);
    expect(row.monthlyCostUsd).toBe(0);
    expect(row.monthlyHoursSaved).toBe(0);
    expect(row.monthlyValueUsd).toBe(0);
    expect(row.monthlyNetUsd).toBe(0);
  });

  it("sums totals across all included agents at default rate", () => {
    const snapshot = calculateAgentValue();

    const expectedCost = SECURITY_COPILOT_AGENTS.reduce(
      (acc, a) => acc + a.scuPerRun * a.defaultRunsPerMonth * SCU_OVERAGE_USD,
      0,
    );
    const expectedHours = SECURITY_COPILOT_AGENTS.reduce(
      (acc, a) => acc + a.defaultRunsPerMonth * a.defaultHoursSavedPerRun,
      0,
    );

    expect(snapshot.totals.monthlyCostUsd).toBeCloseTo(expectedCost, 5);
    expect(snapshot.totals.monthlyHoursSaved).toBeCloseTo(expectedHours, 5);
    expect(snapshot.totals.monthlyValueUsd).toBeCloseTo(
      expectedHours * DEFAULT_HOURLY_RATE_USD,
      5,
    );
    expect(snapshot.totals.includedAgentCount).toBe(
      SECURITY_COPILOT_AGENTS.length,
    );
  });
});

describe("buildBaselineValueSnapshot", () => {
  it("emits all agents with default assumptions and computed fields", () => {
    const snapshot = buildBaselineValueSnapshot();

    expect(snapshot.schemaVersion).toBe("1");
    expect(snapshot.hourlyRateUsd).toBe(DEFAULT_HOURLY_RATE_USD);
    expect(snapshot.scuOverageRateUsd).toBe(SCU_OVERAGE_USD);
    expect(snapshot.agents).toHaveLength(SECURITY_COPILOT_AGENTS.length);

    for (const entry of snapshot.agents) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.scuPerRun).toBeGreaterThan(0);
      expect(entry.defaultHoursSavedPerRun).toBeGreaterThan(0);
      expect(["microsoft", "community-estimate"]).toContain(entry.scuSource);
      expect(["microsoft", "community-estimate"]).toContain(
        entry.hoursSavedSource,
      );
      expect(entry.computed.monthlyCostUsd).toBeGreaterThanOrEqual(0);
      expect(entry.computed.monthlyHoursSaved).toBeGreaterThan(0);
      expect(entry.computed.monthlyValueUsd).toBeGreaterThan(0);
    }
  });

  it("respects a custom hourly rate", () => {
    const snapshot = buildBaselineValueSnapshot(50);
    expect(snapshot.hourlyRateUsd).toBe(50);
    const phishing = snapshot.agents.find((a) => a.id === "phishing-triage")!;
    expect(phishing.computed.monthlyValueUsd).toBeCloseTo(
      phishing.computed.monthlyHoursSaved * 50,
      5,
    );
  });
});
