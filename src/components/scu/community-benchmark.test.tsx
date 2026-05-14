import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityBenchmark } from "~/components/scu/community-benchmark";
import { DEFAULT_INPUT } from "~/lib/scu/constants";

const originalFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn() as unknown as ReturnType<typeof vi.fn>;
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const benchmarkResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("CommunityBenchmark", () => {
  it("derives the paidUserBand from e5PaidUserLicenses and shows medians when the cohort is large enough", async () => {
    fetchMock.mockResolvedValueOnce(
      benchmarkResponse({
        ok: true,
        paidUserBand: "1000_4999",
        count: 7,
        medianScu: 1400,
        medianCostUsd: 8400,
      }),
    );

    render(
      <CommunityBenchmark
        input={{ ...DEFAULT_INPUT, e5PaidUserLicenses: 1000 }}
      />,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/benchmark?paidUserBand=1000_4999",
      expect.anything(),
    );

    expect(
      await screen.findByText("Orgs with 1,000-4,999 paid users"),
    ).toBeInTheDocument();
    expect(await screen.findByText("1,400 SCU")).toBeInTheDocument();
    expect(await screen.findByText("$8,400 / mo")).toBeInTheDocument();
    expect(await screen.findByText("7")).toBeInTheDocument();
  });

  it("shows the 'not enough submissions' message when the cohort is too small", async () => {
    fetchMock.mockResolvedValueOnce(
      benchmarkResponse({
        ok: true,
        paidUserBand: "5000_24999",
        count: 1,
      }),
    );

    render(
      <CommunityBenchmark
        input={{ ...DEFAULT_INPUT, e5PaidUserLicenses: 6000 }}
      />,
    );

    expect(
      await screen.findByText(/Not enough submissions in this cohort yet/i),
    ).toBeInTheDocument();
  });

  it("falls back to the all-submissions cohort when no paid licenses are configured", async () => {
    fetchMock.mockResolvedValueOnce(
      benchmarkResponse({
        ok: true,
        paidUserBand: null,
        count: 12,
        medianScu: 900,
        medianCostUsd: 5400,
      }),
    );

    render(
      <CommunityBenchmark
        input={{ ...DEFAULT_INPUT, e5PaidUserLicenses: 0 }}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/benchmark",
        expect.anything(),
      );
    });

    expect(
      await screen.findByText("All anonymous submissions"),
    ).toBeInTheDocument();
  });

  it("renders a graceful error message when the benchmark request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 502 }),
    );

    render(
      <CommunityBenchmark
        input={{ ...DEFAULT_INPUT, e5PaidUserLicenses: 200 }}
      />,
    );

    expect(
      await screen.findByText("Benchmark is temporarily unavailable."),
    ).toBeInTheDocument();
  });
});
