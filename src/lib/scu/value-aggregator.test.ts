import { describe, expect, it } from "vitest";

import {
  aggregateValueCohort,
  type ValueRow,
} from "~/lib/scu/value-aggregator";

const makeRow = (overrides: Partial<ValueRow> = {}): ValueRow => ({
  use_case: "phishing_triage",
  team_hours_saved_per_month: 40,
  paid_user_band: "1000_4999",
  ...overrides,
});

describe("aggregateValueCohort", () => {
  it("returns median hours for a single cohort with three or more rows", () => {
    const rows = [
      makeRow({ team_hours_saved_per_month: 20 }),
      makeRow({ team_hours_saved_per_month: 40 }),
      makeRow({ team_hours_saved_per_month: 60 }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(3);
    expect(cohort.medianTeamHoursSavedPerMonth).toBe(40);
  });

  it("hides medians when the cohort has fewer than three rows", () => {
    const rows = [
      makeRow({ team_hours_saved_per_month: 20 }),
      makeRow({ team_hours_saved_per_month: 60 }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(2);
    expect(cohort.medianTeamHoursSavedPerMonth).toBeNull();
  });

  it("filters by use_case and paid_user_band independently", () => {
    const rows = [
      makeRow({ use_case: "phishing_triage", paid_user_band: "1000_4999" }),
      makeRow({ use_case: "phishing_triage", paid_user_band: "5000_24999" }),
      makeRow({ use_case: "kql_authoring", paid_user_band: "1000_4999" }),
      makeRow({ use_case: "kql_authoring", paid_user_band: "1000_4999" }),
      makeRow({ use_case: "kql_authoring", paid_user_band: "1000_4999" }),
    ];

    expect(aggregateValueCohort(rows, "kql_authoring", null).count).toBe(3);
    expect(
      aggregateValueCohort(rows, "kql_authoring", "1000_4999").count,
    ).toBe(3);
    expect(
      aggregateValueCohort(rows, "phishing_triage", "1000_4999").count,
    ).toBe(1);
    expect(aggregateValueCohort(rows, null, null).count).toBe(5);
  });

  it("computes median for an even number of values", () => {
    const rows = [
      makeRow({ team_hours_saved_per_month: 10 }),
      makeRow({ team_hours_saved_per_month: 20 }),
      makeRow({ team_hours_saved_per_month: 30 }),
      makeRow({ team_hours_saved_per_month: 40 }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(4);
    expect(cohort.medianTeamHoursSavedPerMonth).toBe(25);
  });

  it("ignores zero or negative hours from medians but counts rows", () => {
    const rows = [
      makeRow({ team_hours_saved_per_month: 0 }),
      makeRow({ team_hours_saved_per_month: 30 }),
      makeRow({ team_hours_saved_per_month: 50 }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(3);
    expect(cohort.medianTeamHoursSavedPerMonth).toBe(40);
  });

  it("returns a null median when count meets the gate but no row has positive hours", () => {
    const rows = [
      makeRow({ team_hours_saved_per_month: 0 }),
      makeRow({ team_hours_saved_per_month: 0 }),
      makeRow({ team_hours_saved_per_month: 0 }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(3);
    expect(cohort.medianTeamHoursSavedPerMonth).toBeNull();
  });

  it("matches rows whose paid_user_band is null when the cohort filter is null", () => {
    const rows = [
      makeRow({ paid_user_band: null }),
      makeRow({ paid_user_band: null }),
      makeRow({ paid_user_band: null }),
    ];

    const cohort = aggregateValueCohort(rows, "phishing_triage", null);

    expect(cohort.count).toBe(3);
    expect(cohort.medianTeamHoursSavedPerMonth).toBe(40);
  });
});
