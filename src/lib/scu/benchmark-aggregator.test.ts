import { describe, expect, it } from "vitest";

import { aggregateCohort } from "~/lib/scu/benchmark-aggregator";

const makeRow = (overrides: Partial<Record<string, unknown>>) => ({
  paid_user_band: "1000_4999",
  license_tier: "e5_security",
  licensed_users: 2500,
  agent_count: 4,
  messages_per_workday: 12,
  observed_monthly_scu: 1400,
  observed_monthly_cost_usd: 8400,
  computed_monthly_usd: 7080,
  ...overrides,
}) as Parameters<typeof aggregateCohort>[0][number];

describe("aggregateCohort", () => {
  it("returns medians and a positive observed-vs-computed gap for a single cohort", () => {
    const rows = [
      makeRow({ observed_monthly_cost_usd: 7200, computed_monthly_usd: 6000 }),
      makeRow({ observed_monthly_cost_usd: 8400, computed_monthly_usd: 7080 }),
      makeRow({ observed_monthly_cost_usd: 10800, computed_monthly_usd: 9000 }),
    ];

    const cohort = aggregateCohort(rows, "1000_4999", "e5_security");

    expect(cohort.count).toBe(3);
    expect(cohort.medianObservedMonthlyCostUsd).toBe(8400);
    expect(cohort.medianComputedMonthlyUsd).toBe(7080);
    expect(cohort.observedVsComputedDeltaUsd).toBe(8400 - 7080);
    expect(cohort.observedVsComputedDeltaPct).toBeCloseTo(
      (8400 - 7080) / 7080,
      5,
    );
  });

  it("hides medians when the cohort has fewer than three rows", () => {
    const rows = [
      makeRow({ observed_monthly_cost_usd: 7200 }),
      makeRow({ observed_monthly_cost_usd: 8400 }),
    ];

    const cohort = aggregateCohort(rows, "1000_4999", "e5_security");

    expect(cohort.count).toBe(2);
    expect(cohort.medianObservedMonthlyCostUsd).toBeNull();
    expect(cohort.medianComputedMonthlyUsd).toBeNull();
    expect(cohort.observedVsComputedDeltaPct).toBeNull();
  });

  it("filters by paid_user_band and license_tier independently", () => {
    const rows = [
      makeRow({ paid_user_band: "1000_4999", license_tier: "e5_security" }),
      makeRow({ paid_user_band: "1000_4999", license_tier: "m365_e3" }),
      makeRow({ paid_user_band: "5000_24999", license_tier: "e5_security" }),
      makeRow({ paid_user_band: "5000_24999", license_tier: "e5_security" }),
      makeRow({ paid_user_band: "5000_24999", license_tier: "e5_security" }),
    ];

    expect(aggregateCohort(rows, "5000_24999", null).count).toBe(3);
    expect(aggregateCohort(rows, null, "e5_security").count).toBe(4);
    expect(aggregateCohort(rows, "1000_4999", "m365_e3").count).toBe(1);
    expect(aggregateCohort(rows, null, null).count).toBe(5);
  });

  it("treats null cost rows as missing rather than zero in median computation", () => {
    const rows = [
      makeRow({ observed_monthly_cost_usd: null }),
      makeRow({ observed_monthly_cost_usd: 1200 }),
      makeRow({ observed_monthly_cost_usd: 1800 }),
    ];

    const cohort = aggregateCohort(rows, "1000_4999", "e5_security");

    expect(cohort.count).toBe(3);
    expect(cohort.medianObservedMonthlyCostUsd).toBe(1500);
  });

  it("returns null gap percentages when computed cost is zero", () => {
    const rows = [
      makeRow({ computed_monthly_usd: 0, observed_monthly_cost_usd: 500 }),
      makeRow({ computed_monthly_usd: 0, observed_monthly_cost_usd: 600 }),
      makeRow({ computed_monthly_usd: 0, observed_monthly_cost_usd: 700 }),
    ];

    const cohort = aggregateCohort(rows, "1000_4999", "e5_security");

    expect(cohort.medianComputedMonthlyUsd).toBe(0);
    expect(cohort.observedVsComputedDeltaPct).toBeNull();
  });
});
