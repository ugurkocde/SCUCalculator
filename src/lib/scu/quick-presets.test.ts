import { describe, expect, it } from "vitest";

import { calculateScuEstimate } from "~/lib/scu/calculate";
import { DEFAULT_INPUT } from "~/lib/scu/constants";
import {
  AGENT_INTENSITY_PRESETS,
  QUICK_DEFAULT_VALUES,
  buildQuickInputPatch,
  inferQuickValuesFromInput,
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

describe("inferQuickValuesFromInput", () => {
  it("round-trips defaults", () => {
    const inferred = inferQuickValuesFromInput(DEFAULT_INPUT);
    expect(inferred.licenseProfile).toBe("e5_or_e7");
    expect(inferred.paidE5Users).toBe(DEFAULT_INPUT.e5PaidUserLicenses);
    expect(inferred.analystCount).toBe(DEFAULT_INPUT.analystCount);
    expect(["none", "few", "many"]).toContain(inferred.agentIntensity);
  });
});
