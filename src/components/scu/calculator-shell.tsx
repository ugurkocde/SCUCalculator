"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { AgentPicker } from "~/components/scu/agent-picker";
import { QuickEstimate } from "~/components/scu/quick-estimate";
import { SiteFooter } from "~/components/scu/site-footer";
import { StickyMobileCost } from "~/components/scu/sticky-mobile-cost";
import { DEFAULT_INPUT, SITE_URL } from "~/lib/scu/constants";
import { calculateScuEstimate } from "~/lib/scu/calculate";
import { type CalculatorInput } from "~/lib/scu/types";
import {
  decodeInputFromParams,
  encodeInputToSearchString,
} from "~/lib/scu/url-state";

const sanitizePatch = (patch: Partial<CalculatorInput>): Partial<CalculatorInput> => {
  const nextPatch = { ...patch };

  for (const [key, value] of Object.entries(nextPatch)) {
    if (typeof value === "number" && (!Number.isFinite(value) || Number.isNaN(value))) {
      (nextPatch as Record<string, unknown>)[key] = 0;
    }
  }

  return nextPatch;
};

export const CalculatorShell = () => {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [fxWarning, setFxWarning] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>(`${SITE_URL}/`);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length > 0) {
      setInput((current) => decodeInputFromParams(params, current));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = encodeInputToSearchString(input, DEFAULT_INPUT);
    const url = search.length > 0
      ? `${window.location.pathname}?${search}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
    setShareUrl(`${window.location.origin}${url}`);
  }, [input]);

  const updateInput = useCallback((patch: Partial<CalculatorInput>): void => {
    const safePatch = sanitizePatch(patch);
    setInput((current) => ({ ...current, ...safePatch }));
  }, []);

  const output = useMemo(() => calculateScuEstimate(input), [input]);

  return (
    <div className="space-y-6">
      <QuickEstimate
        input={input}
        output={output}
        onChange={updateInput}
        fxWarning={fxWarning}
        onFxWarningChange={setFxWarning}
        shareUrl={shareUrl}
      />

      <AgentPicker input={input} onChange={updateInput} />

      <SiteFooter />

      <StickyMobileCost output={output} />
    </div>
  );
};
