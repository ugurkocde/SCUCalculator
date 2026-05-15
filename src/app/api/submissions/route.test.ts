import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_INPUT } from "~/lib/scu/constants";
import { calculateScuEstimate } from "~/lib/scu/calculate";

const supabaseMocks = vi.hoisted(() => {
  const singleMock = vi.fn();
  const selectMock = vi.fn(() => ({ single: singleMock }));
  const insertMock = vi.fn(() => ({ select: selectMock }));
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  const createSupabaseServiceRoleClientMock = vi.fn(() => ({ from: fromMock }));

  return {
    createSupabaseServiceRoleClientMock,
    fromMock,
    insertMock,
    selectMock,
    singleMock,
  };
});

vi.mock("~/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient:
    supabaseMocks.createSupabaseServiceRoleClientMock,
}));

const jsonRequest = (body: unknown, init?: RequestInit): Request => {
  const { headers: extraHeaders, ...rest } = init ?? {};
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...rest,
    headers: { "content-type": "application/json", ...(extraHeaders ?? {}) },
  });
};

const validPayload = {
  input: {
    ...DEFAULT_INPUT,
    e5PaidUserLicenses: 1500,
    licenseTier: "e5_security" as const,
    agentCount: 3,
    messagesPerWorkday: 8,
    estimatorMode: "direct" as const,
    consumedScuPerHour: 9,
  },
  observedMonthlyScu: 1200,
  observedMonthlyCostUsd: 7200,
  environment: {
    regionBand: "europe" as const,
  },
  consentAccepted: true,
  consentVersion: "anonymous-submissions-v1",
};

describe("POST /api/submissions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    supabaseMocks.singleMock.mockReset();
  });

  it("writes the slim signal columns and recomputes computed_monthly_usd server-side", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "submission-1" },
      error: null,
    });

    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(jsonRequest(validPayload));

    expect(response.status).toBe(201);
    expect(supabaseMocks.fromMock).toHaveBeenCalledWith(
      "anonymous_submissions",
    );

    const insertCalls = supabaseMocks.insertMock.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    const insertedRow = insertCalls[0]?.[0];
    expect(insertedRow).toBeDefined();
    if (!insertedRow) {
      throw new Error("Expected route to insert a submission row.");
    }

    expect(insertedRow).toMatchObject({
      licensed_users: 1500,
      license_tier: "e5_security",
      agent_count: 3,
      messages_per_workday: 8,
      observed_monthly_scu: 1200,
      observed_monthly_cost_usd: 7200,
      region_band: "europe",
      paid_user_band: "1000_4999",
      consent_version: "anonymous-submissions-v1",
      source: "web",
    });
    expect(insertedRow.computed_monthly_usd).toBeCloseTo(
      calculateScuEstimate(validPayload.input).monthlyUsd,
      5,
    );
    expect(insertedRow.duplicate_fingerprint).toEqual(expect.any(String));
    expect(insertedRow.user_agent_hash).toBeNull();
    expect(insertedRow).not.toHaveProperty("calculator_input");
    expect(insertedRow).not.toHaveProperty("computed_output");
    expect(insertedRow).not.toHaveProperty("environment");
    expect(insertedRow).not.toHaveProperty("email");
    expect(insertedRow).not.toHaveProperty("tenantId");
    expect(insertedRow).not.toHaveProperty("companyName");
    expect(insertedRow).not.toHaveProperty("domain");
    expect(insertedRow).not.toHaveProperty("notes");
    expect(supabaseMocks.selectMock).toHaveBeenCalledWith("id");
    expect(supabaseMocks.singleMock).toHaveBeenCalled();
  });

  it("derives paid_user_band server-side across all size brackets", async () => {
    const brackets: Array<[number, string | null]> = [
      [0, null],
      [50, "1_249"],
      [500, "250_999"],
      [2500, "1000_4999"],
      [10000, "5000_24999"],
      [30000, "25000_plus"],
    ];

    const { POST } = await import("~/app/api/submissions/route");

    for (const [licenses, expectedBand] of brackets) {
      supabaseMocks.singleMock.mockResolvedValueOnce({
        data: { id: `submission-${licenses}` },
        error: null,
      });

      const response = await POST(
        jsonRequest({
          ...validPayload,
          input: { ...validPayload.input, e5PaidUserLicenses: licenses },
          observedMonthlyScu: 1000 + licenses,
        }),
      );

      expect(response.status).toBe(201);
      const insertCalls = supabaseMocks.insertMock.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >;
      const lastRow = insertCalls[insertCalls.length - 1]?.[0];
      expect(lastRow?.paid_user_band).toBe(expectedBand);
    }
  });

  it("rejects requests without an application/json Content-Type", async () => {
    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      new Request("http://localhost/api/submissions", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(415);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects identifier-like fields before inserting", async () => {
    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      jsonRequest({
        ...validPayload,
        email: "security@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects nested identifier-like fields the schema would otherwise allow through", async () => {
    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      jsonRequest({
        ...validPayload,
        input: {
          ...validPayload.input,
          selectedAgents: [
            {
              agentId: "demo-agent",
              runsPerMonth: 10,
              notes: "internal",
            },
          ],
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects client-supplied duplicate fingerprints before inserting", async () => {
    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      jsonRequest({
        ...validPayload,
        duplicateFingerprint: "browser-session_abc12345",
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("stores only a hash of the user agent", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "submission-ua" },
      error: null,
    });

    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      jsonRequest(
        {
          ...validPayload,
          observedMonthlyScu: 1201,
        },
        { headers: { "user-agent": "Raw Browser 1.0" } },
      ),
    );

    expect(response.status).toBe(201);

    const insertCalls = supabaseMocks.insertMock.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    const insertedRow = insertCalls[0]?.[0];
    expect(insertedRow?.user_agent_hash).toEqual(expect.any(String));
    expect(insertedRow?.user_agent_hash).not.toBe("Raw Browser 1.0");
    expect(insertedRow).not.toHaveProperty("ip");
    expect(insertedRow).not.toHaveProperty("user_agent");
  });

  it("maps duplicate database errors to a duplicate submission response", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const { POST } = await import("~/app/api/submissions/route");
    const response = await POST(
      jsonRequest({
        ...validPayload,
        observedMonthlyScu: 1300,
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "duplicate_submission" },
    });
  });
});
