"use client";

import { type CalculatorOutput } from "~/lib/scu/types";

interface StickyMobileCostProps {
  output: CalculatorOutput;
}

const formatCost = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const StickyMobileCost = ({ output }: StickyMobileCostProps) => {
  const showConverted = output.currencyTotals.currency !== "USD";
  const display = showConverted
    ? formatCost(output.currencyTotals.monthly, output.currencyTotals.currency)
    : formatCost(output.monthlyUsd, "USD");

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-hairline)] bg-[color:var(--color-bg-base)]/90 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md lg:hidden"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-subtle)]">
            Projected monthly
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-[color:var(--color-text)]">
            {display}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            output.billableOverageScuMonthly > 0
              ? "border-amber-300/30 bg-amber-300/5 text-amber-200"
              : "border-emerald-300/30 bg-emerald-300/5 text-emerald-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              output.billableOverageScuMonthly > 0 ? "bg-amber-300" : "bg-emerald-300"
            }`}
          />
          {output.billableOverageScuMonthly > 0 ? "Overage" : "In pool"}
        </span>
      </div>
    </div>
  );
};
