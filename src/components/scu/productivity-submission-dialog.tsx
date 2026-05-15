"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  PRODUCTIVITY_PAID_USER_BANDS,
  PRODUCTIVITY_REGION_BANDS,
  PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
  USE_CASE_LABEL,
  USE_CASES,
  type ProductivityPaidUserBand,
  type ProductivityRegionBand,
  type UseCase,
} from "~/lib/scu/productivity-schema";

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

const UNKNOWN_VALUE = "unknown";
type UnknownOr<T extends string> = T | typeof UNKNOWN_VALUE;

const PAID_USER_BAND_LABEL: Record<ProductivityPaidUserBand, string> = {
  "1_249": "1-249 paid users",
  "250_999": "250-999 paid users",
  "1000_4999": "1,000-4,999 paid users",
  "5000_24999": "5,000-24,999 paid users",
  "25000_plus": "25,000+ paid users",
};

const REGION_LABEL: Record<ProductivityRegionBand, string> = {
  north_america: "North America",
  europe: "Europe",
  asia_pacific: "Asia Pacific",
  latin_america: "Latin America",
  middle_east_africa: "Middle East and Africa",
  global_multi_region: "Global or multi-region",
};

interface ProductivitySubmissionPayload {
  useCase: UseCase;
  teamHoursSavedPerMonth: number;
  environment: {
    regionBand?: ProductivityRegionBand;
    paidUserBand?: ProductivityPaidUserBand;
  };
  consentAccepted: true;
  consentVersion: typeof PRODUCTIVITY_SUBMISSION_CONSENT_VERSION;
}

interface ProductivitySubmissionDialogProps {
  buttonClassName: string;
  buttonLabel?: string;
  onSubmitted?: () => void;
}

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]";

const fieldClass =
  "mt-1 w-full rounded-md border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)] px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]";

const parsePositiveNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const ProductivitySubmissionDialog = ({
  buttonClassName,
  buttonLabel = "Share what your team gets back",
  onSubmitted,
}: ProductivitySubmissionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [useCase, setUseCase] = useState<UseCase>("phishing_triage");
  const [teamHoursRaw, setTeamHoursRaw] = useState("");
  const [paidUserBand, setPaidUserBand] =
    useState<UnknownOr<ProductivityPaidUserBand>>(UNKNOWN_VALUE);
  const [regionBand, setRegionBand] =
    useState<UnknownOr<ProductivityRegionBand>>(UNKNOWN_VALUE);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const teamHoursSavedPerMonth = parsePositiveNumber(teamHoursRaw);

  const payload = useMemo<ProductivitySubmissionPayload | null>(() => {
    if (teamHoursSavedPerMonth === null) return null;

    const environment: ProductivitySubmissionPayload["environment"] = {};
    if (paidUserBand !== UNKNOWN_VALUE) {
      environment.paidUserBand = paidUserBand;
    }
    if (regionBand !== UNKNOWN_VALUE) {
      environment.regionBand = regionBand;
    }

    return {
      useCase,
      teamHoursSavedPerMonth,
      environment,
      consentAccepted: true,
      consentVersion: PRODUCTIVITY_SUBMISSION_CONSENT_VERSION,
    };
  }, [useCase, teamHoursSavedPerMonth, paidUserBand, regionBand]);

  const canSubmit =
    consentAccepted &&
    payload !== null &&
    status !== "submitting" &&
    status !== "success";

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    headingRef.current?.focus();

    const getFocusable = (): HTMLElement[] => {
      const root = dialogRef.current;
      if (!root) return [];
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
      if (event.key !== "Tab") return;

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
    setUseCase("phishing_triage");
    setTeamHoursRaw("");
    setPaidUserBand(UNKNOWN_VALUE);
    setRegionBand(UNKNOWN_VALUE);
    setConsentAccepted(false);
    setOpen(true);
  };

  const submit = useCallback(async () => {
    if (!canSubmit || payload === null) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/productivity-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          "Looks like this exact contribution was already submitted. Adjust a value and try again.",
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
        if (event.target === event.currentTarget && status !== "submitting") {
          setOpen(false);
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="productivity-submission-title"
        aria-describedby="productivity-submission-description"
        className="w-full max-w-md rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5 text-[color:var(--color-text)] shadow-[0_24px_80px_-24px_oklch(0_0_0_/_0.75)] focus:outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="productivity-submission-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-semibold focus:outline-none"
            >
              Share what your team gets back
            </h2>
            <p
              id="productivity-submission-description"
              className="mt-1 text-sm leading-5 text-[color:var(--color-text-muted)]"
            >
              Anonymous productivity contribution &mdash; takes 15 seconds.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] text-base text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
            onClick={() => {
              if (status !== "submitting") setOpen(false);
            }}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className={labelClass}>
              Use case
              <span aria-hidden="true" className="ml-1 text-[color:var(--color-accent)]">
                *
              </span>
            </span>
            <select
              value={useCase}
              onChange={(event) => {
                setUseCase(event.target.value as UseCase);
              }}
              className={fieldClass}
              aria-required="true"
            >
              {USE_CASES.map((value) => (
                <option key={value} value={value}>
                  {USE_CASE_LABEL[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>
              Team hours saved per month
              <span aria-hidden="true" className="ml-1 text-[color:var(--color-accent)]">
                *
              </span>
            </span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={teamHoursRaw}
              onChange={(event) => {
                setTeamHoursRaw(event.target.value);
              }}
              placeholder="e.g. 40"
              className={fieldClass}
              aria-invalid={
                teamHoursRaw.trim() !== "" && teamHoursSavedPerMonth === null
              }
              aria-required="true"
              required
            />
            <span className="mt-1 block text-[11px] leading-4 text-[color:var(--color-text-subtle)]">
              Your team-aggregated estimate &mdash; the number you&apos;d say in
              a renewal review.
            </span>
          </label>

          <label className="block">
            <span className={labelClass}>Paid user license size</span>
            <select
              value={paidUserBand}
              onChange={(event) => {
                setPaidUserBand(
                  event.target.value as UnknownOr<ProductivityPaidUserBand>,
                );
              }}
              className={fieldClass}
            >
              <option value={UNKNOWN_VALUE}>Prefer not to say</option>
              {PRODUCTIVITY_PAID_USER_BANDS.map((value) => (
                <option key={value} value={value}>
                  {PAID_USER_BAND_LABEL[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Region</span>
            <select
              value={regionBand}
              onChange={(event) => {
                setRegionBand(
                  event.target.value as UnknownOr<ProductivityRegionBand>,
                );
              }}
              className={fieldClass}
            >
              <option value={UNKNOWN_VALUE}>Prefer not to say</option>
              {PRODUCTIVITY_REGION_BANDS.map((value) => (
                <option key={value} value={value}>
                  {REGION_LABEL[value]}
                </option>
              ))}
            </select>
          </label>

          <p className="text-[11px] leading-5 text-[color:var(--color-text-subtle)]">
            No email, tenant ID, company name, domain, free-text notes, IP
            address, hourly rate, or raw user agent is stored.
          </p>

          <label className="flex items-start gap-3 text-sm leading-5 text-[color:var(--color-text-muted)]">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => {
                setConsentAccepted(event.target.checked);
              }}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent)]"
              aria-describedby="productivity-submission-consent-version"
            />
            <span>
              I confirm this submission is anonymous and may be aggregated into
              public productivity statistics.
              <span
                id="productivity-submission-consent-version"
                className="sr-only"
              >
                Consent version {PRODUCTIVITY_SUBMISSION_CONSENT_VERSION}.
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
                Thanks &mdash; your contribution has been recorded.
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
                  : "Submit contribution"}
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
