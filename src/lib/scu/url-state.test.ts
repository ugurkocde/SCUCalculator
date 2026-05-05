import { describe, expect, it } from "vitest";

import { DEFAULT_INPUT } from "~/lib/scu/constants";
import {
  decodeInputFromParams,
  encodeInputToSearchString,
} from "~/lib/scu/url-state";

describe("URL state codec", () => {
  it("round-trips a typical configuration", () => {
    const input = {
      ...DEFAULT_INPUT,
      e5PaidUserLicenses: 5000,
      analystCount: 12,
      agentCount: 4,
      fxCurrency: "EUR" as const,
      selectedAgents: [
        { agentId: "phishing-triage", runsPerMonth: 8000 },
        { agentId: "conditional-access-optimization", runsPerMonth: 30 },
      ],
    };
    const params = new URLSearchParams(
      encodeInputToSearchString(input, DEFAULT_INPUT),
    );
    const decoded = decodeInputFromParams(params, DEFAULT_INPUT);

    expect(decoded.licenseTier).toBe("e5_security");
    expect(decoded.e5PaidUserLicenses).toBe(5000);
    expect(decoded.analystCount).toBe(12);
    expect(decoded.agentCount).toBe(4);
    expect(decoded.fxCurrency).toBe("EUR");
    expect(decoded.selectedAgents).toHaveLength(2);
    expect(decoded.selectedAgents[0]).toEqual({
      agentId: "phishing-triage",
      runsPerMonth: 8000,
    });
  });

  it("falls back to defaults for missing or invalid params", () => {
    const params = new URLSearchParams("lp=bogus&pu=-10&an=abc");
    const decoded = decodeInputFromParams(params, DEFAULT_INPUT);
    expect(decoded.licenseTier).toBe(DEFAULT_INPUT.licenseTier);
    expect(decoded.e5PaidUserLicenses).toBe(DEFAULT_INPUT.e5PaidUserLicenses);
    expect(decoded.analystCount).toBe(DEFAULT_INPUT.analystCount);
  });

  it("maps E3 license to no-pool included tier", () => {
    const params = new URLSearchParams("lp=e3");
    const decoded = decodeInputFromParams(params, DEFAULT_INPUT);
    expect(decoded.licenseTier).toBe("m365_e3");
    expect(decoded.includedPoolTier).toBe("none");
  });
});
