"use client";

import { useEffect, useState } from "react";

import { CURRENCIES } from "~/lib/scu/constants";
import { type CalculatorInput } from "~/lib/scu/types";

interface FxSelectorProps {
  input: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
  onWarningChange: (warning: string | null) => void;
  idPrefix: string;
}

interface ExchangeRateApiResponse {
  result?: string;
  rates?: Record<string, number>;
}

export const FxSelector = ({
  input,
  onChange,
  onWarningChange,
  idPrefix,
}: FxSelectorProps) => {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (input.fxCurrency === "USD") {
      onChange({ fxRate: 1 });
      setStatus("ready");
      onWarningChange(null);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const fetchRate = async (): Promise<void> => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`FX request failed with status ${response.status}`);
        }

        const data = (await response.json()) as ExchangeRateApiResponse;
        const nextRate = data.rates?.[input.fxCurrency];

        if (!nextRate) {
          throw new Error(`Missing rate for ${input.fxCurrency}`);
        }

        onChange({ fxRate: nextRate });
        onWarningChange(null);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          onChange({ fxRate: 1 });
          onWarningChange(
            "Live FX conversion is temporarily unavailable. Showing USD-equivalent values for now.",
          );
          setStatus("error");
        }
      }
    };

    void fetchRate();

    return () => {
      controller.abort();
    };
  }, [input.fxCurrency, onChange, onWarningChange]);

  return (
    <section
      className="rounded-xl border border-[color:var(--color-hairline)] bg-white/[0.01] p-4"
      aria-label="Currency conversion"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label
          className="flex flex-col gap-2 text-sm font-medium text-[color:var(--color-text)]"
          htmlFor={`${idPrefix}-fx-currency`}
        >
          Display currency
          <select
            id={`${idPrefix}-fx-currency`}
            value={input.fxCurrency}
            className="rounded-lg border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-sunken)] px-3 py-2 text-base text-[color:var(--color-text)] focus-visible:border-[color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
            onChange={(event) => {
              onChange({ fxCurrency: event.currentTarget.value as CalculatorInput["fxCurrency"] });
            }}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[color:var(--color-text-subtle)]" aria-live="polite">
          {status === "loading"
            ? "Fetching latest USD exchange rate..."
            : `FX rate (1 USD): ${input.fxRate.toFixed(4)} ${input.fxCurrency}`}
        </p>
      </div>
    </section>
  );
};
