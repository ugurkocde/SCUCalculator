"use client";

import { useState } from "react";

import { buildEmailSummary } from "~/lib/scu/summary";
import { type CalculatorInput, type CalculatorOutput } from "~/lib/scu/types";

interface ShareActionsProps {
  input: CalculatorInput;
  output: CalculatorOutput;
  shareUrl: string;
}

type Status = "idle" | "copied" | "error";

const buttonClass =
  "rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-accent-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]";

export const ShareActions = ({
  input,
  output,
  shareUrl,
}: ShareActionsProps) => {
  const [linkStatus, setLinkStatus] = useState<Status>("idle");
  const [emailStatus, setEmailStatus] = useState<Status>("idle");

  const announce = (setStatus: (next: Status) => void, next: Status): void => {
    setStatus(next);
    if (next !== "idle") {
      window.setTimeout(() => {
        setStatus("idle");
      }, 1800);
    }
  };

  const copy = async (
    text: string,
    setStatus: (next: Status) => void,
  ): Promise<void> => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        announce(setStatus, "copied");
        return;
      }
      throw new Error("Clipboard unavailable");
    } catch {
      announce(setStatus, "error");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          void copy(shareUrl, setLinkStatus);
        }}
      >
        {linkStatus === "copied"
          ? "Link copied"
          : linkStatus === "error"
            ? "Copy failed"
            : "Copy shareable link"}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          void copy(buildEmailSummary(input, output, shareUrl), setEmailStatus);
        }}
      >
        {emailStatus === "copied"
          ? "Summary copied"
          : emailStatus === "error"
            ? "Copy failed"
            : "Copy summary for email"}
      </button>
    </div>
  );
};
