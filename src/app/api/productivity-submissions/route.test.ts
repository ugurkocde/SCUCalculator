import { afterEach, describe, expect, it, vi } from "vitest";

import { PRODUCTIVITY_SUBMISSION_CONSENT_VERSION } from "~/lib/scu/productivity-schema";

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
  return new Request("http://localhost/api/productivity-submissions", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...rest,
    headers: { "content-type": "application/json", ...(extraHeaders ?? {}) },
  });
};

const validPayload = {
  useCase: "phishing_triage" as const,
  teamHoursSavedPerMonth: 40,
  environment: {
    regionBand: "europe" as const,
    paidUserBand: "1000_4999" as const,
  },
  consentAccepted: true,
  consentVersion: PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
};

describe("POST /api/productivity-submissions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    supabaseMocks.singleMock.mockReset();
  });

  it("inserts hours-only signal columns, no rate or dollar columns", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "productivity-1" },
      error: null,
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(jsonRequest(validPayload));

    expect(response.status).toBe(201);
    expect(supabaseMocks.fromMock).toHaveBeenCalledWith(
      "productivity_submissions",
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
      use_case: "phishing_triage",
      team_hours_saved_per_month: 40,
      region_band: "europe",
      paid_user_band: "1000_4999",
      consent_version: PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
      source: "web",
    });
    expect(insertedRow.duplicate_fingerprint).toEqual(expect.any(String));
    expect(insertedRow.user_agent_hash).toBeNull();
    expect(insertedRow).not.toHaveProperty("hourly_rate");
    expect(insertedRow).not.toHaveProperty("hourly_rate_usd");
    expect(insertedRow).not.toHaveProperty("computed_savings_usd");
    expect(insertedRow).not.toHaveProperty("computed_monthly_usd");
    expect(insertedRow).not.toHaveProperty("notes");
    expect(insertedRow).not.toHaveProperty("email");
    expect(supabaseMocks.selectMock).toHaveBeenCalledWith("id");
    expect(supabaseMocks.singleMock).toHaveBeenCalled();
  });

  it("inserts null environment columns when empty", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "productivity-2" },
      error: null,
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest({
        ...validPayload,
        environment: {},
      }),
    );

    expect(response.status).toBe(201);
    const insertCalls = supabaseMocks.insertMock.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    const row = insertCalls[0]?.[0];
    expect(row?.region_band).toBeNull();
    expect(row?.paid_user_band).toBeNull();
  });

  it("rejects requests without an application/json Content-Type", async () => {
    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      new Request("http://localhost/api/productivity-submissions", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(415);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON", async () => {
    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      new Request("http://localhost/api/productivity-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects identifier-like fields before inserting", async () => {
    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest({
        ...validPayload,
        email: "security@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects nested identifier-like fields", async () => {
    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest({
        ...validPayload,
        environment: {
          ...validPayload.environment,
          notes: "internal context",
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("rejects client-supplied hourly rate", async () => {
    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest({
        ...validPayload,
        hourlyRateUsd: 120,
      }),
    );

    expect(response.status).toBe(400);
    expect(supabaseMocks.insertMock).not.toHaveBeenCalled();
  });

  it("stores only a hash of the user agent", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "productivity-ua" },
      error: null,
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest(
        {
          ...validPayload,
          teamHoursSavedPerMonth: 41,
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

  it("maps duplicate database errors to a 409 duplicate response", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(
      jsonRequest({
        ...validPayload,
        teamHoursSavedPerMonth: 42,
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "duplicate_submission" },
    });
  });

  it("returns 502 when the database errors generically", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: null,
      error: { code: "XX000", message: "internal error" },
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );
    const response = await POST(jsonRequest({ ...validPayload, teamHoursSavedPerMonth: 43 }));

    expect(response.status).toBe(502);
  });

  it("produces a stable duplicate fingerprint for identical submissions", async () => {
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "productivity-a" },
      error: null,
    });
    supabaseMocks.singleMock.mockResolvedValueOnce({
      data: { id: "productivity-b" },
      error: null,
    });

    const { POST } = await import(
      "~/app/api/productivity-submissions/route"
    );

    await POST(jsonRequest(validPayload));
    await POST(jsonRequest(validPayload));

    const insertCalls = supabaseMocks.insertMock.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    expect(insertCalls).toHaveLength(2);
    const fingerprintA = insertCalls[0]?.[0]?.duplicate_fingerprint;
    const fingerprintB = insertCalls[1]?.[0]?.duplicate_fingerprint;
    expect(fingerprintA).toBeDefined();
    expect(fingerprintA).toBe(fingerprintB);
  });
});
