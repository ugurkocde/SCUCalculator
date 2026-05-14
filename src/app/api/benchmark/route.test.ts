import { afterEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const limitMock = vi.fn();
  const orderMock = vi.fn(() => ({ limit: limitMock }));
  type Builder = { filter: ReturnType<typeof vi.fn>; order: typeof orderMock };
  const filterMock = vi.fn();
  const builder: Builder = { filter: filterMock, order: orderMock };
  filterMock.mockImplementation(() => builder);
  const selectMock = vi.fn(() => builder);
  const fromMock = vi.fn(() => ({ select: selectMock }));
  const createSupabaseServiceRoleClientMock = vi.fn(() => ({ from: fromMock }));

  return {
    createSupabaseServiceRoleClientMock,
    filterMock,
    fromMock,
    limitMock,
    orderMock,
    selectMock,
  };
});

vi.mock("~/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient:
    supabaseMocks.createSupabaseServiceRoleClientMock,
}));

describe("GET /api/benchmark", () => {
  afterEach(() => {
    vi.clearAllMocks();
    supabaseMocks.limitMock.mockReset();
  });

  it("returns medians and count for a valid paidUserBand cohort", async () => {
    supabaseMocks.limitMock.mockResolvedValueOnce({
      data: [
        { observed_monthly_scu: 1200, observed_monthly_cost_usd: 7200 },
        { observed_monthly_scu: 1400, observed_monthly_cost_usd: 8400 },
        { observed_monthly_scu: 1800, observed_monthly_cost_usd: 10800 },
      ],
      error: null,
    });

    const { GET } = await import("~/app/api/benchmark/route");
    const response = await GET(
      new Request(
        "http://localhost/api/benchmark?paidUserBand=1000_4999",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      paidUserBand: "1000_4999",
      count: 3,
      medianScu: 1400,
      medianCostUsd: 8400,
    });
    expect(supabaseMocks.filterMock).toHaveBeenCalledWith(
      "environment->>paidUserBand",
      "eq",
      "1000_4999",
    );
  });

  it("hides medians when fewer than three submissions exist in the cohort", async () => {
    supabaseMocks.limitMock.mockResolvedValueOnce({
      data: [
        { observed_monthly_scu: 1200, observed_monthly_cost_usd: 7200 },
        { observed_monthly_scu: 1500, observed_monthly_cost_usd: 9000 },
      ],
      error: null,
    });

    const { GET } = await import("~/app/api/benchmark/route");
    const response = await GET(
      new Request(
        "http://localhost/api/benchmark?paidUserBand=25000_plus",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      paidUserBand: "25000_plus",
      count: 2,
    });
  });

  it("rejects an unknown paidUserBand without hitting the database", async () => {
    const { GET } = await import("~/app/api/benchmark/route");
    const response = await GET(
      new Request("http://localhost/api/benchmark?paidUserBand=bogus"),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.fromMock).not.toHaveBeenCalled();
  });

  it("aggregates across all submissions when no paidUserBand is supplied", async () => {
    supabaseMocks.limitMock.mockResolvedValueOnce({
      data: [
        { observed_monthly_scu: 100, observed_monthly_cost_usd: null },
        { observed_monthly_scu: 200, observed_monthly_cost_usd: 1200 },
        { observed_monthly_scu: 300, observed_monthly_cost_usd: 1800 },
      ],
      error: null,
    });

    const { GET } = await import("~/app/api/benchmark/route");
    const response = await GET(new Request("http://localhost/api/benchmark"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      paidUserBand: null,
      count: 3,
      medianScu: 200,
      medianCostUsd: 1500,
    });
    expect(supabaseMocks.filterMock).not.toHaveBeenCalled();
  });
});
