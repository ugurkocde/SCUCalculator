import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnonymousSubmissionDialog } from "~/components/scu/anonymous-submission-dialog";
import { DEFAULT_INPUT } from "~/lib/scu/constants";
import { anonymousSubmissionRequestSchema } from "~/lib/scu/submission-schema";

const originalFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(
    async () => new Response(null, { status: 201 }),
  ) as unknown as ReturnType<typeof vi.fn>;
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const renderDialog = (onSubmitted?: () => void) => {
  render(
    <AnonymousSubmissionDialog
      input={DEFAULT_INPUT}
      buttonClassName="test-trigger"
      onSubmitted={onSubmitted}
    />,
  );
};

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole("button", { name: /Contribute anonymous benchmark|Share your SCU usage/ }),
  );
  return screen.getByRole("dialog", { name: "Share your monthly SCU usage" });
};

describe("AnonymousSubmissionDialog", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const lastSubmissionBody = () => {
    const submissionCall = fetchMock.mock.calls.find(
      (call) => call[0] === "/api/submissions",
    );
    if (!submissionCall) {
      throw new Error("Expected a fetch call to /api/submissions.");
    }
    const requestInit = submissionCall[1] as RequestInit | undefined;
    const requestBody = requestInit?.body;
    if (typeof requestBody !== "string") {
      throw new Error("Expected submission body to be a JSON string.");
    }
    return anonymousSubmissionRequestSchema.parse(
      JSON.parse(requestBody) as unknown,
    );
  };

  it("opens from the trigger and keeps submit disabled without consent", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await openDialog(user);

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/observedMonthlyScu/),
    ).not.toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(/Observed monthly SCU/),
      "123.45",
    );

    expect(
      within(dialog).getByRole("button", { name: "Submit benchmark" }),
    ).toBeDisabled();
  });

  it("submits with only the selected environment fields and fires onSubmitted", async () => {
    const user = userEvent.setup();
    const onSubmitted = vi.fn();
    renderDialog(onSubmitted);
    const dialog = await openDialog(user);

    await user.type(
      within(dialog).getByLabelText(/Observed monthly SCU/),
      "250",
    );
    await user.type(
      within(dialog).getByLabelText(/Observed monthly cost USD/),
      "1250",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Region"),
      "north_america",
    );
    await user.click(
      within(dialog).getByLabelText(
        /I confirm this submission is anonymous/i,
      ),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Submit benchmark" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/submissions",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const body = lastSubmissionBody();

    expect(body.input).toEqual(DEFAULT_INPUT);
    expect(body.observedMonthlyScu).toBe(250);
    expect(body.observedMonthlyCostUsd).toBe(1250);
    expect(body.environment).toEqual({
      regionBand: "north_america",
    });
    expect(body.consentAccepted).toBe(true);
    expect(body.consentVersion).toBe("anonymous-submissions-v1");
    expect(Object.keys(body)).not.toContain("duplicateFingerprint");
    expect(Object.keys(body)).not.toContain("email");
    expect(Object.keys(body)).not.toContain("companyName");
    expect(Object.keys(body)).not.toContain("domain");
    expect(Object.keys(body)).not.toContain("tenantId");
    expect(Object.keys(body)).not.toContain("notes");

    expect(
      await within(dialog).findByText(/your benchmark has been recorded/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Submit benchmark" }),
    ).not.toBeInTheDocument();
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it("omits all environment fields when the user keeps the default 'Prefer not to say' selections", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = await openDialog(user);

    await user.type(
      within(dialog).getByLabelText(/Observed monthly SCU/),
      "100",
    );
    await user.click(
      within(dialog).getByLabelText(
        /I confirm this submission is anonymous/i,
      ),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Submit benchmark" }),
    );

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some((call) => call[0] === "/api/submissions"),
      ).toBe(true);
    });

    const body = lastSubmissionBody();

    expect(body.environment).toEqual({});
  });

  it("shows a status-aware error and offers a retry on server failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    renderDialog();
    const dialog = await openDialog(user);

    await user.type(within(dialog).getByLabelText(/Observed monthly SCU/), "1");
    await user.click(
      within(dialog).getByLabelText(
        /I confirm this submission is anonymous/i,
      ),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Submit benchmark" }),
    );

    expect(
      await within(dialog).findByText(
        /couldn't save this submission right now/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });
});
