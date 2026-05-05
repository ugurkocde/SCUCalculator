import { describe, expect, it } from "vitest";

import { calculateScuEstimate } from "~/lib/scu/calculate";
import { DEFAULT_INPUT } from "~/lib/scu/constants";
import {
  AGENT_INTENSITY_PRESETS,
  QUICK_DEFAULT_VALUES,
  SCENARIO_PRESETS,
  buildQuickInputPatch,
  buildScenarioPatch,
  inferQuickValuesFromInput,
  matchesScenario,
  workloadSizeHint,
} from "~/lib/scu/quick-presets";

describe("buildQuickInputPatch", () => {
  it("maps the E5/E7 profile to e5_security with the auto formula", () => {
    const patch = buildQuickInputPatch({
      ...QUICK_DEFAULT_VALUES,
      licenseProfile: "e5_or_e7",
    });
    expect(patch.licenseTier).toBe("e5_security");
    expect(patch.includedPoolTier).toBe("auto_e5_license_formula");
  });

  it("maps the Standalone profile to standalone with no included pool", () => {
    const patch = buildQuickInputPatch({
      ...QUICK_DEFAULT_VALUES,
      licenseProfile: "standalone",
    });
    expect(patch.licenseTier).toBe("standalone");
    expect(patch.includedPoolTier).toBe("none");
  });

  it("translates each agent intensity preset to a concrete agent count", () => {
    for (const preset of AGENT_INTENSITY_PRESETS) {
      const patch = buildQuickInputPatch({
        ...QUICK_DEFAULT_VALUES,
        agentIntensity: preset.id,
      });
      expect(patch.agentCount).toBe(preset.agentCount);
    }
  });

  it("produces a non-zero monthly cost when chat usage exceeds the included pool", () => {
    // Defaults (8 users × 5 msgs × 22 × 0.25 = 220 SCU/mo) sit inside the pool ($0).
    // Bump messages to push past the 400 SCU pool.
    const patch = buildQuickInputPatch({
      ...QUICK_DEFAULT_VALUES,
      messagesPerWorkday: 20,
    });
    const merged = { ...DEFAULT_INPUT, ...patch };
    const output = calculateScuEstimate(merged);
    expect(output.monthlyUsd).toBeGreaterThan(0);
  });

  it("produces zero monthly cost for the default values (within pool)", () => {
    const patch = buildQuickInputPatch(QUICK_DEFAULT_VALUES);
    const merged = { ...DEFAULT_INPUT, ...patch };
    const output = calculateScuEstimate(merged);
    expect(output.monthlyUsd).toBe(0);
  });

  it("yields a higher cost when intensity changes from none to many", () => {
    const noneInput = {
      ...DEFAULT_INPUT,
      ...buildQuickInputPatch({ ...QUICK_DEFAULT_VALUES, agentIntensity: "none" }),
    };
    const manyInput = {
      ...DEFAULT_INPUT,
      ...buildQuickInputPatch({ ...QUICK_DEFAULT_VALUES, agentIntensity: "many" }),
    };
    const noneOutput = calculateScuEstimate(noneInput);
    const manyOutput = calculateScuEstimate(manyInput);
    expect(manyOutput.monthlyUsd).toBeGreaterThan(noneOutput.monthlyUsd);
  });
});

describe("workloadSizeHint", () => {
  it("labels small SOCs as Light", () => {
    expect(workloadSizeHint(2).label).toBe("Light");
  });
  it("labels mid-market SOCs as Standard", () => {
    expect(workloadSizeHint(8).label).toBe("Standard");
  });
  it("labels large SOCs as Heavy", () => {
    expect(workloadSizeHint(40).label).toBe("Heavy");
  });
});

describe("SCENARIO_PRESETS", () => {
  it("Small business stays inside the included pool", () => {
    const small = SCENARIO_PRESETS.find((p) => p.id === "small")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(small) };
    const output = calculateScuEstimate(merged);
    expect(output.monthlyUsd).toBe(0);
  });

  it("Mid-market produces a non-zero monthly cost", () => {
    const mid = SCENARIO_PRESETS.find((p) => p.id === "mid")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(mid) };
    const output = calculateScuEstimate(merged);
    expect(output.monthlyUsd).toBeGreaterThan(0);
  });

  it("Enterprise pushes meaningfully past the 10,000 SCU pool cap", () => {
    const enterprise = SCENARIO_PRESETS.find((p) => p.id === "enterprise")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(enterprise) };
    const output = calculateScuEstimate(merged);
    expect(output.includedScuMonthly).toBe(10000);
    expect(output.billableOverageScuMonthly).toBeGreaterThan(1000);
  });

  it("Enterprise scenario uses the agent picker instead of intensity preset", () => {
    const enterprise = SCENARIO_PRESETS.find((p) => p.id === "enterprise")!;
    const patch = buildScenarioPatch(enterprise);
    expect(patch.agentCount).toBe(0);
    expect(patch.selectedAgents?.length).toBeGreaterThan(0);
  });
});

describe("matchesScenario", () => {
  it("matches a freshly-applied preset for every scenario", () => {
    for (const preset of SCENARIO_PRESETS) {
      const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(preset) };
      expect(matchesScenario(merged, preset)).toBe(true);
    }
  });

  it("breaks the match as soon as the user edits any controlled input", () => {
    const small = SCENARIO_PRESETS.find((p) => p.id === "small")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(small) };
    const edited = { ...merged, analystCount: merged.analystCount + 1 };
    expect(matchesScenario(edited, small)).toBe(false);
  });

  it("ignores selectedAgents ordering when comparing", () => {
    const enterprise = SCENARIO_PRESETS.find((p) => p.id === "enterprise")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(enterprise) };
    const reordered = {
      ...merged,
      selectedAgents: [...merged.selectedAgents].reverse(),
    };
    expect(matchesScenario(reordered, enterprise)).toBe(true);
  });

  it("does not match a different preset", () => {
    const small = SCENARIO_PRESETS.find((p) => p.id === "small")!;
    const enterprise = SCENARIO_PRESETS.find((p) => p.id === "enterprise")!;
    const merged = { ...DEFAULT_INPUT, ...buildScenarioPatch(small) };
    expect(matchesScenario(merged, enterprise)).toBe(false);
  });
});

describe("inferQuickValuesFromInput", () => {
  it("round-trips defaults", () => {
    const inferred = inferQuickValuesFromInput(DEFAULT_INPUT);
    expect(inferred.licenseProfile).toBe("e5_or_e7");
    expect(inferred.paidE5Users).toBe(DEFAULT_INPUT.e5PaidUserLicenses);
    expect(inferred.analystCount).toBe(DEFAULT_INPUT.analystCount);
    expect(["none", "few", "many"]).toContain(inferred.agentIntensity);
  });
});
