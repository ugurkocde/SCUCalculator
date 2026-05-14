"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const industryOptions = [
  unknownOption,
  { value: "financial_services", label: "Financial services" },
  { value: "healthcare", label: "Healthcare" },
  { value: "public_sector", label: "Public sector" },
  { value: "technology", label: "Technology" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "education", label: "Education" },
  { value: "other_regulated", label: "Other regulated" },
  { value: "other_commercial", label: "Other commercial" },
] as const satisfies readonly Option[];

const paidUserBandOptions = [
  unknownOption,
  { value: "1_249", label: "1-249" },
  { value: "250_999", label: "250-999" },
  { value: "1000_4999", label: "1,000-4,999" },
  { value: "5000_24999", label: "5,000-24,999" },
  { value: "25000_plus", label: "25,000+" },
] as const satisfies readonly Option[];

const activeAdminBandOptions = [
  unknownOption,
  { value: "1_4", label: "1-4" },
  { value: "5_14", label: "5-14" },
  { value: "15_49", label: "15-49" },
  { value: "50_199", label: "50-199" },
  { value: "200_plus", label: "200+" },
] as const satisfies readonly Option[];

const productOptions = [
  { value: "security_copilot_portal", label: "Security Copilot portal" },
  { value: "defender_xdr", label: "Microsoft Defender XDR" },
  { value: "sentinel", label: "Microsoft Sentinel" },
  { value: "intune", label: "Microsoft Intune" },
  { value: "entra", label: "Microsoft Entra" },
  { value: "purview", label: "Microsoft Purview" },
] as const satisfies readonly Option[];

const agentCategoryOptions = [
  { value: "microsoft_first_party", label: "Microsoft first-party agents" },
  { value: "custom_agents", label: "Custom agents" },
  { value: "partner_agents", label: "Partner agents" },
  { value: "automation_playbooks", label: "Automation or playbooks" },
  { value: "none_unsure", label: "None or unsure" },
] as const satisfies readonly Option[];

type RegionBand = Exclude<
  (typeof regionOptions)[number]["value"],
  typeof UNKNOWN_VALUE
>;
type IndustryCategory = Exclude<
  (typeof industryOptions)[number]["value"],
  typeof UNKNOWN_VALUE
>;
type PaidUserBand = Exclude<
  (typeof paidUserBandOptions)[number]["value"],
  typeof UNKNOWN_VALUE
>;
type ActiveAdminBand = Exclude<
  (typeof activeAdminBandOptions)[number]["value"],
  typeof UNKNOWN_VALUE
>;
type ProductUsed = (typeof productOptions)[number]["value"];
type AgentCategory = (typeof agentCategoryOptions)[number]["value"];

interface AnonymousSubmissionFormState {
  regionBand: UnknownOr<RegionBand>;
  industryCategory: UnknownOr<IndustryCategory>;
  paidUserBand: UnknownOr<PaidUserBand>;
  activeAdminBand: UnknownOr<ActiveAdminBand>;
  productsUsed: ProductUsed[];
  agentCategories: AgentCategory[];
}

interface SubmissionEnvironmentPayload {
  regionBand?: RegionBand;
  industryCategory?: IndustryCategory;
  paidUserBand?: PaidUserBand;
  activeAdminBand?: ActiveAdminBand;
  productsUsed?: ProductUsed[];
  agentCategories?: AgentCategory[];
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
}

const initialFormState: AnonymousSubmissionFormState = {
  regionBand: UNKNOWN_VALUE,
  industryCategory: UNKNOWN_VALUE,
  paidUserBand: UNKNOWN_VALUE,
  activeAdminBand: UNKNOWN_VALUE,
  productsUsed: [],
  agentCategories: [],
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

const toggleValue = <T extends string>(values: T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];

const buildEnvironmentPayload = (
  form: AnonymousSubmissionFormState,
): SubmissionEnvironmentPayload => {
  const environment: SubmissionEnvironmentPayload = {};

  if (form.regionBand !== UNKNOWN_VALUE) {
    environment.regionBand = form.regionBand;
  }
  if (form.industryCategory !== UNKNOWN_VALUE) {
    environment.industryCategory = form.industryCategory;
  }
  if (form.paidUserBand !== UNKNOWN_VALUE) {
    environment.paidUserBand = form.paidUserBand;
  }
  if (form.activeAdminBand !== UNKNOWN_VALUE) {
    environment.activeAdminBand = form.activeAdminBand;
  }
  if (form.productsUsed.length > 0) {
    environment.productsUsed = form.productsUsed;
  }
  if (form.agentCategories.length > 0) {
    environment.agentCategories = form.agentCategories;
  }

  return environment;
};

const CheckboxGroup = <T extends string>({
  legend,
  options,
  values,
  onToggle,
}: {
  legend: string;
  options: readonly Option<T>[];
  values: T[];
  onToggle: (value: T) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className={labelClass}>{legend}</legend>
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] px-3 py-2 text-xs text-[color:var(--color-text-muted)]"
        >
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={() => {
              onToggle(option.value);
            }}
            className="h-4 w-4 accent-[color:var(--color-accent)]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

export const AnonymousSubmissionDialog = ({
  input,
  buttonClassName,
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
  }, [canSubmit, payload]);

  return (
    <>
      <button type="button" className={buttonClassName} onClick={resetForOpen}>
        Contribute anonymous benchmark
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm sm:items-center"
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
            className="w-full max-w-2xl rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5 text-[color:var(--color-text)] shadow-[0_24px_80px_-24px_oklch(0_0_0_/_0.75)] focus:outline-none sm:p-6"
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
                  className="mt-1 max-w-2xl text-sm leading-5 text-[color:var(--color-text-muted)]"
                >
                  Help build a community benchmark for Security Compute Unit
                  pricing. Your contribution stays anonymous.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] text-base text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                onClick={() => {
                  if (status !== "submitting") {
                    setOpen(false);
                  }
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="mt-4 rounded-md border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.06] p-3 text-xs leading-5 text-[color:var(--color-text-muted)]">
              <p className="font-semibold text-[color:var(--color-text)]">
                What we collect
              </p>
              <p className="mt-1">
                Your observed monthly SCU, optional cost in USD, and the coarse
                environment fields you select below.
              </p>
              <p className="mt-3 font-semibold text-[color:var(--color-text)]">
                What we never collect
              </p>
              <p className="mt-1">
                No email, tenant ID, company name, domain, free-text notes, IP
                address, or raw user agent is stored with your submission.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
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
                    className={fieldClass}
                    aria-invalid={
                      observedMonthlyScuRaw.trim() !== "" &&
                      observedMonthlyScu === null
                    }
                    aria-required="true"
                    required
                  />
                </label>
                <label>
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
                    className={fieldClass}
                    aria-invalid={
                      observedMonthlyCostUsdRaw.trim() !== "" &&
                      observedMonthlyCostUsd === null
                    }
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
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
                <label>
                  <span className={labelClass}>Industry</span>
                  <select
                    value={form.industryCategory}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        industryCategory: event.target
                          .value as UnknownOr<IndustryCategory>,
                      }));
                    }}
                    className={fieldClass}
                  >
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Paid user range</span>
                  <select
                    value={form.paidUserBand}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        paidUserBand: event.target
                          .value as UnknownOr<PaidUserBand>,
                      }));
                    }}
                    className={fieldClass}
                  >
                    {paidUserBandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Active admins</span>
                  <select
                    value={form.activeAdminBand}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        activeAdminBand: event.target
                          .value as UnknownOr<ActiveAdminBand>,
                      }));
                    }}
                    className={fieldClass}
                  >
                    {activeAdminBandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <CheckboxGroup
                legend="Products used (optional)"
                options={productOptions}
                values={form.productsUsed}
                onToggle={(value) => {
                  setForm((current) => ({
                    ...current,
                    productsUsed: toggleValue(current.productsUsed, value),
                  }));
                }}
              />

              <CheckboxGroup
                legend="Agent categories (optional)"
                options={agentCategoryOptions}
                values={form.agentCategories}
                onToggle={(value) => {
                  setForm((current) => ({
                    ...current,
                    agentCategories: toggleValue(
                      current.agentCategories,
                      value,
                    ),
                  }));
                }}
              />

              <label className="flex items-start gap-3 rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] p-3 text-sm leading-5 text-[color:var(--color-text-muted)]">
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
                {status === "idle" ? (
                  <p className="text-[color:var(--color-text-muted)]">
                    {observedMonthlyScu === null
                      ? "Enter your observed monthly SCU to continue."
                      : !consentAccepted
                        ? "Check the consent box to submit."
                        : "Ready to submit."}
                  </p>
                ) : null}
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
      ) : null}
    </>
  );
};
