import { createHash } from "node:crypto";

import {
  productivitySubmissionRequestSchema,
  type ProductivitySubmissionRequest,
  PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
} from "~/lib/scu/productivity-schema";
import { findDirectIdentifierPath } from "~/lib/scu/submission-schema";
import { createSupabaseServiceRoleClient } from "~/lib/supabase/service-role";

export const runtime = "nodejs";

type ErrorCode =
  | "database_error"
  | "direct_identifier_rejected"
  | "duplicate_submission"
  | "invalid_content_type"
  | "invalid_json"
  | "server_misconfigured"
  | "validation_failed";

interface ErrorResponseBody {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    issues?: { path: string; message: string }[];
  };
}

interface SuccessResponseBody {
  ok: true;
  submissionId: string;
}

const errorResponse = (
  status: number,
  code: ErrorCode,
  message: string,
  issues?: ErrorResponseBody["error"]["issues"],
): Response =>
  Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(issues ? { issues } : {}),
      },
    } satisfies ErrorResponseBody,
    { status },
  );

const hashValue = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
};

const isDuplicateError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  return (
    maybeError.code === "23505" ||
    (typeof maybeError.message === "string" &&
      maybeError.message.toLowerCase().includes("duplicate"))
  );
};

const buildDuplicateFingerprint = (
  submission: ProductivitySubmissionRequest,
): string => {
  const fingerprintPayload = {
    consentVersion: submission.consentVersion,
    useCase: submission.useCase,
    teamHoursSavedPerMonth: submission.teamHoursSavedPerMonth,
    regionBand: submission.environment.regionBand ?? null,
    paidUserBand: submission.environment.paidUserBand ?? null,
  };

  return createHash("sha256")
    .update(JSON.stringify(fingerprintPayload))
    .digest("hex");
};

const hasJsonContentType = (request: Request): boolean => {
  const header = request.headers.get("content-type");
  if (!header) return false;
  const mediaType = header.split(";")[0]?.trim().toLowerCase() ?? "";
  return mediaType === "application/json";
};

export const POST = async (request: Request): Promise<Response> => {
  if (!hasJsonContentType(request)) {
    return errorResponse(
      415,
      "invalid_content_type",
      "Content-Type must be application/json.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const directIdentifierPath = findDirectIdentifierPath(body);
  if (directIdentifierPath) {
    return errorResponse(
      400,
      "direct_identifier_rejected",
      "Submission payload contains a direct identifier field.",
      [
        {
          path: directIdentifierPath.join("."),
          message: "Remove direct identifiers.",
        },
      ],
    );
  }

  const parsed = productivitySubmissionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "validation_failed",
      "Submission payload failed validation.",
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const submission = parsed.data;
  const userAgentHash = hashValue(request.headers.get("user-agent"));
  const duplicateFingerprint = buildDuplicateFingerprint(submission);

  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return errorResponse(
      500,
      "server_misconfigured",
      "Submission service is not configured.",
    );
  }

  const { data, error } = await supabase
    .from("productivity_submissions")
    .insert({
      use_case: submission.useCase,
      team_hours_saved_per_month: submission.teamHoursSavedPerMonth,
      region_band: submission.environment.regionBand ?? null,
      paid_user_band: submission.environment.paidUserBand ?? null,
      consent_version: PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
      source: "web",
      user_agent_hash: userAgentHash,
      duplicate_fingerprint: duplicateFingerprint,
    })
    .select("id")
    .single();

  if (error) {
    if (isDuplicateError(error)) {
      return errorResponse(
        409,
        "duplicate_submission",
        "This anonymous productivity submission appears to have already been submitted.",
      );
    }

    return errorResponse(
      502,
      "database_error",
      "Submission could not be saved.",
    );
  }

  const submissionId = data && "id" in data ? String(data.id) : "";
  if (!submissionId) {
    return errorResponse(
      502,
      "database_error",
      "Submission was saved without an id.",
    );
  }

  return Response.json(
    { ok: true, submissionId } satisfies SuccessResponseBody,
    { status: 201 },
  );
};
