"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ANONYMOUS_SUBMISSION_CONSENT_VERSION } from "~/lib/scu/submission-schema";
import { type CalculatorInput } from "~/lib/scu/types";

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

type Option<T extends string = string> = {
  value: T;
  label: string;
};

const UNKNOWN_VALUE = "unknown";
type UnknownOr<T extends string> = T | typeof UNKNOWN_VALUE;

const unknownOption = {
  value: UNKNOWN_VALUE,
  label: "Prefer not to say",
} as const satisfies Option;

const regionOptions = [
  unknownOption,
  { value: "north_america", label: "North America" },
  { value: "europe", label: "Europe" },
  { value: "asia_pacific", label: "Asia Pacific" },
  { value: "latin_america", label: "Latin America" },
  { value: "middle_east_africa", label: "Middle East and Africa" },
  { value: "global_multi_region", label: "Global or multi-region" },
] as const satisfies readonly Option[];

type RegionBand = Exclude<
  (typeof regionOptions)[number]["value"],
  typeof UNKNOWN_VALUE
>;

interface AnonymousSubmissionFormState {
  regionBand: UnknownOr<RegionBand>;
}

interface SubmissionEnvironmentPayload {
  regionBand?: RegionBand;
}

interface AnonymousSubmissionPayload {
  input: CalculatorInput;
  observedMonthlyScu: number;
  observedMonthlyCostUsd: number | null;
  environment: SubmissionEnvironmentPayload;
  consentAccepted: true;
  consentVersion: typeof ANONYMOUS_SUBMISSION_CONSENT_VERSION;
}

interface AnonymousSubmissionDialogProps {
  input: CalculatorInput;
  buttonClassName: string;
  buttonLabel?: string;
  onSubmitted?: () => void;
}

const initialFormState: AnonymousSubmissionFormState = {
  regionBand: UNKNOWN_VALUE,
};

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]";

const fieldClass =
  "mt-1 w-full rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]";

const parseNonNegativeNumber = (value: string): number | null => {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const buildEnvironmentPayload = (
  form: AnonymousSubmissionFormState,
): SubmissionEnvironmentPayload => {
  const environment: SubmissionEnvironmentPayload = {};

  if (form.regionBand !== UNKNOWN_VALUE) {
    environment.regionBand = form.regionBand;
  }

  return environment;
};

export const AnonymousSubmissionDialog = ({
  input,
  buttonClassName,
  buttonLabel = "Contribute anonymous benchmark",
  onSubmitted,
}: AnonymousSubmissionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] =
    useState<AnonymousSubmissionFormState>(initialFormState);
  const [observedMonthlyScuRaw, setObservedMonthlyScuRaw] = useState("");
  const [observedMonthlyCostUsdRaw, setObservedMonthlyCostUsdRaw] =
    useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const observedMonthlyScu = parseNonNegativeNumber(observedMonthlyScuRaw);
  const parsedObservedMonthlyCostUsd = parseNonNegativeNumber(
    observedMonthlyCostUsdRaw,
  );
  const observedMonthlyCostUsd =
    observedMonthlyCostUsdRaw.trim() === ""
      ? null
      : parsedObservedMonthlyCostUsd;
  const observedMonthlyCostUsdValid =
    observedMonthlyCostUsdRaw.trim() === "" ||
    parsedObservedMonthlyCostUsd !== null;

  const payload = useMemo<AnonymousSubmissionPayload | null>(() => {
    if (observedMonthlyScu === null || !observedMonthlyCostUsdValid) {
      return null;
    }

    return {
      input,
      observedMonthlyScu,
      observedMonthlyCostUsd,
      environment: buildEnvironmentPayload(form),
      consentAccepted: true as const,
      consentVersion: ANONYMOUS_SUBMISSION_CONSENT_VERSION,
    };
  }, [
    form,
    input,
    observedMonthlyCostUsd,
    observedMonthlyCostUsdValid,
    observedMonthlyScu,
  ]);

  const canSubmit =
    consentAccepted &&
    payload !== null &&
    status !== "submitting" &&
    status !== "success";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    headingRef.current?.focus();

    const getFocusable = (): HTMLElement[] => {
      const root = dialogRef.current;
      if (!root) {
        return [];
      }
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("aria-hidden") && element.offsetParent !== null,
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && status !== "submitting") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [open, status]);

  const resetForOpen = () => {
    setStatus("idle");
    setErrorMessage("");
    setForm(initialFormState);
    setObservedMonthlyScuRaw("");
    setObservedMonthlyCostUsdRaw("");
    setConsentAccepted(false);
    setOpen(true);
  };

  const submit = useCallback(async () => {
    if (!canSubmit || payload === null) {
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
        onSubmitted?.();
        return;
      }

      setStatus("error");
      if (response.status === 409) {
        setErrorMessage(
          "Looks like this exact benchmark was already submitted. Adjust a value and try again.",
        );
      } else if (response.status === 429) {
        setErrorMessage(
          "Too many submissions from this network recently. Try again in a few minutes.",
        );
      } else if (response.status >= 500) {
        setErrorMessage(
          "We couldn't save this submission right now. Try again in a moment.",
        );
      } else {
        setErrorMessage(
          "Something in this submission was rejected. Check your inputs and try again.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage(
        "We couldn't reach the server. Check your connection and retry.",
      );
    }
  }, [canSubmit, onSubmitted, payload]);

  const overlay = open ? (
    <div
      className="fixed inset-0 z-[2147483000] flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-md sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          status !== "submitting"
        ) {
          setOpen(false);
        }
      }}
    >
          <section
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="anonymous-submission-title"
            aria-describedby="anonymous-submission-description"
            className="w-full max-w-md rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5 text-[color:var(--color-text)] shadow-[0_24px_80px_-24px_oklch(0_0_0_/_0.75)] focus:outline-none sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="anonymous-submission-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-lg font-semibold focus:outline-none"
                >
                  Share your monthly SCU usage
                </h2>
                <p
                  id="anonymous-submission-description"
                  className="mt-1 text-sm leading-5 text-[color:var(--color-text-muted)]"
                >
                  Anonymous benchmark contribution &mdash; takes 15 seconds.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] text-base text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                onClick={() => {
                  if (status !== "submitting") {
                    setOpen(false);
                  }
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelClass}>
                  Observed monthly SCU
                  <span
                    aria-hidden="true"
                    className="ml-1 text-[color:var(--color-accent)]"
                  >
                    *
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={observedMonthlyScuRaw}
                  onChange={(event) => {
                    setObservedMonthlyScuRaw(event.target.value);
                  }}
                  placeholder="e.g. 1200"
                  className={fieldClass}
                  aria-invalid={
                    observedMonthlyScuRaw.trim() !== "" &&
                    observedMonthlyScu === null
                  }
                  aria-required="true"
                  required
                />
              </label>

              <label className="block">
                <span className={labelClass}>
                  Observed monthly cost USD
                  <span className="ml-1 font-normal normal-case tracking-normal text-[color:var(--color-text-subtle)]">
                    (optional)
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={observedMonthlyCostUsdRaw}
                  onChange={(event) => {
                    setObservedMonthlyCostUsdRaw(event.target.value);
                  }}
                  placeholder="e.g. 7200"
                  className={fieldClass}
                  aria-invalid={
                    observedMonthlyCostUsdRaw.trim() !== "" &&
                    observedMonthlyCostUsd === null
                  }
                />
              </label>

              <label className="block">
                <span className={labelClass}>Region</span>
                <select
                  value={form.regionBand}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      regionBand: event.target.value as UnknownOr<RegionBand>,
                    }));
                  }}
                  className={fieldClass}
                >
                  {regionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-[11px] leading-5 text-[color:var(--color-text-subtle)]">
                No email, tenant ID, company name, domain, free-text notes,
                IP address, or raw user agent is stored.
              </p>

              <label className="flex items-start gap-3 text-sm leading-5 text-[color:var(--color-text-muted)]">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => {
                    setConsentAccepted(event.target.checked);
                  }}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent)]"
                  aria-describedby="anonymous-submission-consent-version"
                />
                <span>
                  I confirm this submission is anonymous and may be aggregated
                  into public benchmark statistics.
                  <span
                    id="anonymous-submission-consent-version"
                    className="sr-only"
                  >
                    Consent version {ANONYMOUS_SUBMISSION_CONSENT_VERSION}.
                  </span>
                </span>
              </label>

              <div className="min-h-6 text-xs" aria-live="polite">
                {status === "submitting" ? (
                  <p className="text-[color:var(--color-text-muted)]">
                    Submitting&hellip;
                  </p>
                ) : null}
                {status === "success" ? (
                  <p className="rounded-md border border-emerald-300/30 bg-emerald-300/5 p-2 text-emerald-200">
                    Thanks &mdash; your benchmark has been recorded.
                  </p>
                ) : null}
                {status === "error" ? (
                  <p className="rounded-md border border-rose-300/30 bg-rose-300/5 p-2 text-rose-200">
                    {errorMessage}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                {status === "error" ? (
                  <button
                    type="button"
                    className="rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                    onClick={() => {
                      void submit();
                    }}
                    disabled={!canSubmit}
                  >
                    Retry
                  </button>
                ) : null}
                {status === "success" ? (
                  <button
                    type="button"
                    className="w-full rounded-md border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/[0.12] px-3 py-2 text-sm font-semibold text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent)]/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)] sm:w-auto"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-md border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/[0.12] px-3 py-2 text-sm font-semibold text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent)]/[0.18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:border-[color:var(--color-hairline)] disabled:bg-white/[0.02] disabled:text-[color:var(--color-text-subtle)] sm:w-auto"
                    disabled={!canSubmit}
                    onClick={() => {
                      void submit();
                    }}
                  >
                    {status === "submitting"
                      ? "Submitting…"
                      : "Submit benchmark"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
  ) : null;

  return (
    <>
      <button type="button" className={buttonClassName} onClick={resetForOpen}>
        {buttonLabel}
      </button>
      {overlay && typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : null}
    </>
  );
};
