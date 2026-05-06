import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatorResults } from "~/components/scu/results";
import { DEFAULT_INPUT } from "~/lib/scu/constants";
import { calculateScuEstimate } from "~/lib/scu/calculate";

describe("CalculatorResults", () => {
  it("renders the projected monthly headline and metrics strip", () => {
    const output = calculateScuEstimate(DEFAULT_INPUT);
    render(<CalculatorResults output={output} fxWarning={null} />);

    expect(screen.getByText("Projected monthly cost")).toBeInTheDocument();
    expect(screen.getByText("Annual")).toBeInTheDocument();
    expect(screen.getByText("Pool")).toBeInTheDocument();
    expect(screen.getByText("Overage")).toBeInTheDocument();
  });

  it("displays the converted currency in the hero number when fx is non-USD", () => {
    const input = {
      ...DEFAULT_INPUT,
      fxCurrency: "EUR" as const,
      fxRate: 0.9,
    };
    const output = calculateScuEstimate(input);
    render(<CalculatorResults output={output} fxWarning={null} />);

    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
  });

  it("renders the overage cap recommendation pill when overage is projected", () => {
    const input = {
      ...DEFAULT_INPUT,
      mode: "provisioned_overage" as const,
      estimatorMode: "direct" as const,
      consumedScuPerHour: 18,
      provisionedScuPerHour: 10,
    };
    const output = calculateScuEstimate(input);
    render(<CalculatorResults output={output} fxWarning={null} />);

    expect(screen.getByTestId("overage-cap-pill")).toBeInTheDocument();
    expect(screen.getByTestId("overage-cap-pill").textContent).toContain("12 SCUs");
  });

  it("hides the overage cap pill when there is no projected overage", () => {
    const input = {
      ...DEFAULT_INPUT,
      mode: "e5_included" as const,
      licenseTier: "e5_security" as const,
      includedPoolTier: "auto_e5_license_formula" as const,
      e5PaidUserLicenses: 100000,
      estimatorMode: "direct" as const,
      consumedScuPerHour: 0.1,
    };
    const output = calculateScuEstimate(input);
    render(<CalculatorResults output={output} fxWarning={null} />);

    expect(screen.queryByTestId("overage-cap-pill")).not.toBeInTheDocument();
  });
});
