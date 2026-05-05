export type AgentSourceProvenance = "microsoft" | "community-estimate";

export interface SecurityCopilotAgent {
  id: string;
  name: string;
  product: string;
  productTag: string;
  description: string;
  scuPerRun: number;
  source: AgentSourceProvenance;
  sourceNote: string;
  defaultRunsPerMonth: number;
  docsUrl: string;
}

export const SECURITY_COPILOT_AGENTS: SecurityCopilotAgent[] = [
  {
    id: "phishing-triage",
    name: "Phishing Triage Agent",
    product: "Microsoft Defender for Office 365",
    productTag: "Defender O365",
    description:
      "Auto-triages user-reported phishing messages, classifying intent and prioritising real threats for the SOC.",
    scuPerRun: 1.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft has not published a per-run rate. 1.0 SCU is a conservative upper bound (verify in your tenant's usage dashboard).",
    defaultRunsPerMonth: 5000,
    docsUrl: "https://learn.microsoft.com/defender-xdr/phishing-triage-agent",
  },
  {
    id: "alert-triage",
    name: "Security Alert Triage Agent",
    product: "Microsoft Defender XDR",
    productTag: "Defender XDR",
    description:
      "Reviews new alerts, summarises evidence, and proposes a verdict to reduce analyst time per incident.",
    scuPerRun: 1.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft has not published a per-run rate. 1.0 SCU is a conservative upper bound (verify in your tenant's usage dashboard).",
    defaultRunsPerMonth: 2500,
    docsUrl: "https://learn.microsoft.com/defender-xdr/security-alert-triage-agent",
  },
  {
    id: "conditional-access-optimization",
    name: "Conditional Access Optimization Agent",
    product: "Microsoft Entra",
    productTag: "Entra",
    description:
      "Scans Conditional Access policy gaps daily and proposes safe optimisations across users and apps.",
    scuPerRun: 1.0,
    source: "microsoft",
    sourceNote:
      "Microsoft documents this agent at less than 1 SCU per run on average. Using 1.0 as the conservative upper bound.",
    defaultRunsPerMonth: 30,
    docsUrl:
      "https://learn.microsoft.com/entra/security-copilot/conditional-access-agent-optimization",
  },
  {
    id: "identity-risk-management",
    name: "Identity Risk Management Agent",
    product: "Microsoft Entra ID Protection",
    productTag: "Entra ID Protection",
    description:
      "Investigates risky users in batches and recommends remediations such as resets, MFA, or session revocation.",
    scuPerRun: 1.0,
    source: "microsoft",
    sourceNote:
      "Microsoft documents this agent at less than 1 SCU per run on average. Using 1.0 as the conservative upper bound.",
    defaultRunsPerMonth: 30,
    docsUrl:
      "https://learn.microsoft.com/entra/id-protection/identity-risk-management-agent-get-started",
  },
  {
    id: "vulnerability-remediation",
    name: "Vulnerability Remediation Agent",
    product: "Microsoft Intune",
    productTag: "Intune",
    description:
      "Continuously identifies vulnerable devices and drafts remediation tasks for endpoint admins.",
    scuPerRun: 1.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft has not published a per-run rate. 1.0 SCU is a conservative upper bound.",
    defaultRunsPerMonth: 200,
    docsUrl:
      "https://learn.microsoft.com/intune/copilot/agents/vulnerability-remediation-agent",
  },
  {
    id: "threat-intel-briefing",
    name: "Threat Intelligence Briefing Agent",
    product: "Microsoft Security Copilot standalone",
    productTag: "Standalone",
    description:
      "Generates a tailored threat intelligence briefing for the tenant on a recurring schedule.",
    scuPerRun: 4.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft has not published a per-run rate. The agent runs as a promptbook; 4.0 SCU is a conservative upper bound matching the 3.7-SCU promptbook value used in Microsoft's billing-math example.",
    defaultRunsPerMonth: 4,
    docsUrl: "https://learn.microsoft.com/copilot/security/threat-intel-briefing-agent",
  },
  {
    id: "insider-risk-triage",
    name: "Insider Risk Triage Agent",
    product: "Microsoft Purview Insider Risk Management",
    productTag: "Purview IRM",
    description:
      "Triages insider risk alerts by analysing recent user activity and surfacing the highest-risk cases.",
    scuPerRun: 1.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft documents that consumption depends on the number and type of alerts processed. 1.0 SCU is a conservative upper bound.",
    defaultRunsPerMonth: 200,
    docsUrl:
      "https://learn.microsoft.com/purview/copilot-in-purview-triage-irm-agent-get-started",
  },
  {
    id: "dlp-alert-triage",
    name: "DLP Alert Triage Agent",
    product: "Microsoft Purview Data Loss Prevention",
    productTag: "Purview DLP",
    description:
      "Reviews DLP alerts and prioritises real exposure incidents over noise.",
    scuPerRun: 1.0,
    source: "community-estimate",
    sourceNote:
      "Microsoft documents that consumption depends on the number and type of alerts processed. 1.0 SCU is a conservative upper bound.",
    defaultRunsPerMonth: 400,
    docsUrl:
      "https://learn.microsoft.com/purview/copilot-in-purview-triage-dlp-agent-get-started",
  },
];

export const HOURS_PER_MONTH_FOR_AGENTS = 730;

export const agentScuPerHour = (
  agent: Pick<SecurityCopilotAgent, "scuPerRun">,
  runsPerMonth: number,
): number => {
  const safeRuns = Number.isFinite(runsPerMonth) && runsPerMonth > 0 ? runsPerMonth : 0;
  return (agent.scuPerRun * safeRuns) / HOURS_PER_MONTH_FOR_AGENTS;
};
