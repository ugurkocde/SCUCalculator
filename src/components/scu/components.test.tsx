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
});
