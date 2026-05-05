import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "~/app/page";

describe("route smoke tests", () => {
  it("renders /", () => {
    render(<HomePage />);
    expect(screen.getByText("What will Security Copilot cost you?")).toBeInTheDocument();
  });
});
