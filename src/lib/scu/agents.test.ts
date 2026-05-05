import { describe, expect, it } from "vitest";

import {
  SECURITY_COPILOT_AGENTS,
  agentScuPerHour,
} from "~/lib/scu/agents";

describe("SECURITY_COPILOT_AGENTS catalog", () => {
  it("has at least the eight agents required by the picker grid", () => {
    expect(SECURITY_COPILOT_AGENTS.length).toBeGreaterThanOrEqual(8);
  });

  it("uses unique stable ids", () => {
    const ids = SECURITY_COPILOT_AGENTS.map((agent) => agent.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("declares a Microsoft or community-estimate provenance for every agent", () => {
    for (const agent of SECURITY_COPILOT_AGENTS) {
      expect(["microsoft", "community-estimate"]).toContain(agent.source);
    }
  });

  it("uses positive scuPerRun and runs-per-month defaults", () => {
    for (const agent of SECURITY_COPILOT_AGENTS) {
      expect(agent.scuPerRun).toBeGreaterThan(0);
      expect(agent.defaultRunsPerMonth).toBeGreaterThanOrEqual(0);
    }
  });

  it("links each agent to a learn.microsoft.com docs URL", () => {
    for (const agent of SECURITY_COPILOT_AGENTS) {
      expect(agent.docsUrl).toMatch(/^https:\/\/learn\.microsoft\.com\//);
    }
  });
});

describe("agentScuPerHour", () => {
  it("converts runs/month into SCU/hour using a 730 hour month", () => {
    const agent = { scuPerRun: 1.0 };
    expect(agentScuPerHour(agent, 730)).toBeCloseTo(1.0, 6);
    expect(agentScuPerHour(agent, 1460)).toBeCloseTo(2.0, 6);
  });

  it("treats invalid runs counts as zero", () => {
    const agent = { scuPerRun: 1.0 };
    expect(agentScuPerHour(agent, 0)).toBe(0);
    expect(agentScuPerHour(agent, Number.NaN)).toBe(0);
    expect(agentScuPerHour(agent, -10)).toBe(0);
  });
});
