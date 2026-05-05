import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import {
  type AgentSelection,
  type CalculatorInput,
  type CurrencyCode,
} from "~/lib/scu/types";

const KNOWN_AGENT_IDS = new Set(SECURITY_COPILOT_AGENTS.map((agent) => agent.id));

const CURRENCY_CODES = new Set<CurrencyCode>([
  "USD",
  "EUR",
  "GBP",
  "TRY",
  "CAD",
  "AUD",
  "JPY",
]);

const parseNumber = (raw: string | null): number | undefined => {
  if (raw === null) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return value;
};

const parseCurrency = (raw: string | null): CurrencyCode | undefined => {
  if (raw === null) return undefined;
  return CURRENCY_CODES.has(raw as CurrencyCode) ? (raw as CurrencyCode) : undefined;
};

const parseLicense = (raw: string | null): CalculatorInput["licenseTier"] | undefined => {
  if (raw === "e5") return "e5_security";
  if (raw === "e3") return "m365_e3";
  if (raw === "standalone") return "standalone";
  return undefined;
};

const encodeLicense = (tier: CalculatorInput["licenseTier"]): string => {
  if (tier === "e5_security") return "e5";
  if (tier === "m365_e3") return "e3";
  return "standalone";
};

const parseAgents = (raw: string | null): AgentSelection[] | undefined => {
  if (!raw) return undefined;
  const entries = raw.split(",").filter(Boolean);
  const selections: AgentSelection[] = [];
  for (const entry of entries) {
    const [id, runsRaw] = entry.split(":");
    if (!id || !KNOWN_AGENT_IDS.has(id)) continue;
    const runs = Number(runsRaw);
    selections.push({
      agentId: id,
      runsPerMonth: Number.isFinite(runs) && runs > 0 ? runs : 0,
    });
  }
  return selections;
};

const encodeAgents = (selections: AgentSelection[]): string =>
  selections
    .map((entry) => `${entry.agentId}:${Math.round(entry.runsPerMonth)}`)
    .join(",");

export const decodeInputFromParams = (
  params: URLSearchParams,
  fallback: CalculatorInput,
): CalculatorInput => {
  const next: CalculatorInput = { ...fallback };

  const license = parseLicense(params.get("lp"));
  if (license) {
    next.licenseTier = license;
    next.includedPoolTier =
      license === "e5_security" ? "auto_e5_license_formula" : "none";
  }

  const paidUsers = parseNumber(params.get("pu"));
  if (paidUsers !== undefined) {
    next.e5PaidUserLicenses = paidUsers;
  }

  const analysts = parseNumber(params.get("an"));
  if (analysts !== undefined) {
    next.analystCount = analysts;
  }

  const messages = parseNumber(params.get("mpd"));
  if (messages !== undefined) {
    next.messagesPerWorkday = messages;
  }

  const agentCount = parseNumber(params.get("ac"));
  if (agentCount !== undefined) {
    next.agentCount = agentCount;
  }

  const currency = parseCurrency(params.get("cur"));
  if (currency) {
    next.fxCurrency = currency;
  }

  const agents = parseAgents(params.get("agents"));
  if (agents) {
    next.selectedAgents = agents;
  }

  return next;
};

export const encodeInputToSearchString = (
  input: CalculatorInput,
  defaults: CalculatorInput,
): string => {
  const params = new URLSearchParams();

  if (input.licenseTier !== defaults.licenseTier) {
    params.set("lp", encodeLicense(input.licenseTier));
  }
  if (
    input.licenseTier === "e5_security" &&
    Math.round(input.e5PaidUserLicenses) !== Math.round(defaults.e5PaidUserLicenses)
  ) {
    params.set("pu", String(Math.round(input.e5PaidUserLicenses)));
  }
  if (Math.round(input.analystCount) !== Math.round(defaults.analystCount)) {
    params.set("an", String(Math.round(input.analystCount)));
  }
  if (
    Math.round(input.messagesPerWorkday) !== Math.round(defaults.messagesPerWorkday)
  ) {
    params.set("mpd", String(Math.round(input.messagesPerWorkday)));
  }
  if (Math.round(input.agentCount) !== Math.round(defaults.agentCount)) {
    params.set("ac", String(Math.round(input.agentCount)));
  }
  if (input.fxCurrency !== defaults.fxCurrency) {
    params.set("cur", input.fxCurrency);
  }
  if (input.selectedAgents.length > 0) {
    params.set("agents", encodeAgents(input.selectedAgents));
  }
  return params.toString();
};
