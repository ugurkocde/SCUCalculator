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
    estimatorMode: "direct" as const,
    consumedScuPerHour: 9,
  },
  observedMonthlyScu: 1200,
  observedMonthlyCostUsd: 7200,
  environment: {
    organizationSizeBand: "1000_4999",
    securityTeamSizeBand: "21_50",
    cloud: "commercial",
    deploymentStage: "pilot",
    industry: "technology",
    region: "europe",
  },
  consentAccepted: true,
  consentVersion: "anonymous-submissions-v1",
};

describe("POST /api/submissions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    supabaseMocks.singleMock.mockReset();
  });

  it("recomputes output server-side and inserts the expected anonymous payload", async () => {
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
    const insertedRows = insertCalls[0]?.[0];
    expect(insertedRows).toBeDefined();
    if (!insertedRows) {
      throw new Error("Expected route to insert a submission row.");
    }
    expect(insertedRows).toMatchObject({
      calculator_input: validPayload.input,
      observed_monthly_scu: 1200,
      observed_monthly_cost_usd: 7200,
      environment: validPayload.environment,
      consent_version: "anonymous-submissions-v1",
      source: "web",
    });
    expect(insertedRows.duplicate_fingerprint).toEqual(expect.any(String));
    expect(insertedRows.user_agent_hash).toBeNull();
    expect(insertedRows).not.toHaveProperty("email");
    expect(insertedRows).not.toHaveProperty("tenantId");
    expect(insertedRows).not.toHaveProperty("companyName");
    expect(insertedRows).not.toHaveProperty("domain");
    expect(insertedRows).not.toHaveProperty("notes");
    expect(insertedRows.computed_output).toEqual(
      calculateScuEstimate(validPayload.input),
    );
    expect(supabaseMocks.selectMock).toHaveBeenCalledWith("id");
    expect(supabaseMocks.singleMock).toHaveBeenCalled();
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
    const insertedRows = insertCalls[0]?.[0];
    expect(insertedRows?.user_agent_hash).toEqual(expect.any(String));
    expect(insertedRows?.user_agent_hash).not.toBe("Raw Browser 1.0");
    expect(insertedRows).not.toHaveProperty("ip");
    expect(insertedRows).not.toHaveProperty("user_agent");
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
