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
  /**
   * Conservative estimate of analyst hours given back per agent run, used by
   * the /value page. Adjustable inline by the visitor. See hoursSavedSourceNote
   * for the anchor behind the default. If Microsoft publishes a per-agent
   * time-savings claim, upgrade hoursSavedSource to "microsoft" and quote the
   * claim verbatim in hoursSavedSourceNote.
   */
  defaultHoursSavedPerRun: number;
  hoursSavedSource: AgentSourceProvenance;
  hoursSavedSourceNote: string;
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
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft does not publish a per-run rate; their Phishing Triage docs point to the in-tenant usage dashboard (\"cost per email processed\"). 0.5 SCU anchors to Microsoft's incident-summarisation reference in their billing-math example.",
    defaultRunsPerMonth: 100,
    defaultHoursSavedPerRun: 0.25,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure. Independent SOC research (Ponemon Institute Cost of Phishing reports; IBM X-Force) places manual phishing triage at 20-30 minutes per reported email. 0.25 h (15 min) is a conservative midpoint of analyst time given back per run.",
    docsUrl: "https://learn.microsoft.com/defender-xdr/phishing-triage-agent",
  },
  {
    id: "alert-triage",
    name: "Security Alert Triage Agent",
    product: "Microsoft Defender XDR",
    productTag: "Defender XDR",
    description:
      "Reviews new alerts, summarises evidence, and proposes a verdict to reduce analyst time per incident.",
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft does not publish a per-run rate; their Alert Triage docs point to the in-tenant usage dashboard. 0.5 SCU anchors to Microsoft's incident-summarisation reference (the underlying operation).",
    defaultRunsPerMonth: 100,
    defaultHoursSavedPerRun: 0.25,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure for this agent. Tier 1 SOC alert triage commonly takes 15-30 minutes per alert (SANS Institute SOC surveys; vendor SIEM/SOAR benchmarks). 0.25 h is a conservative estimate of analyst time given back; verify against your tenant's MTTR before relying on it.",
    docsUrl: "https://learn.microsoft.com/defender-xdr/security-alert-triage-agent",
  },
  {
    id: "conditional-access-optimization",
    name: "Conditional Access Optimization Agent",
    product: "Microsoft Entra",
    productTag: "Entra",
    description:
      "Scans Conditional Access policy gaps daily and proposes safe optimisations across users and apps.",
    scuPerRun: 0.5,
    source: "microsoft",
    sourceNote:
      "Microsoft Learn states verbatim: \"On average, each agent run consumes less than one SCU.\" 0.5 used as the midpoint estimate.",
    defaultRunsPerMonth: 30,
    defaultHoursSavedPerRun: 0.5,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft has not published a specific per-run time-saved figure. The agent surfaces policy gap recommendations daily that an identity admin would otherwise have to derive manually from sign-in logs and policy state. 0.5 h (30 min) per run is a conservative estimate of the recommendation-curation time given back.",
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
    scuPerRun: 0.5,
    source: "microsoft",
    sourceNote:
      "Microsoft Learn states verbatim: \"On average, each agent run consumes less than one SCU.\" 0.5 used as the midpoint estimate.",
    defaultRunsPerMonth: 30,
    defaultHoursSavedPerRun: 0.5,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft has not published a specific per-run time-saved figure. Risky-user batches typically contain multiple users and an identity admin would otherwise review each user's sign-in pattern and recommend a remediation manually. 0.5 h (30 min) per batch run is a conservative estimate.",
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
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft does not publish a per-run rate. 0.5 SCU anchors to the incident-summarisation reference; verify against your tenant's usage dashboard.",
    defaultRunsPerMonth: 100,
    defaultHoursSavedPerRun: 0.25,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure. Per-device vulnerability triage and remediation drafting typically takes 10-20 minutes when done manually (Verizon DBIR adjacent endpoint operations research). 0.25 h (15 min) per run is a conservative estimate of endpoint admin time given back.",
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
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft does not publish a per-run rate. Aligned with the other triage agents at 0.5 SCU; the 3.7 SCU promptbook value in Microsoft's billing-math example is an illustrative scenario, not a benchmark for this agent.",
    defaultRunsPerMonth: 4,
    defaultHoursSavedPerRun: 1,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure. Producing a tailored TI briefing manually — gathering open-source intel, mapping to tenant assets, drafting the write-up — typically takes 1-2 hours for a TI analyst. 1 h per briefing is a conservative estimate of TI analyst time given back.",
    docsUrl: "https://learn.microsoft.com/copilot/security/threat-intel-briefing-agent",
  },
  {
    id: "insider-risk-triage",
    name: "Insider Risk Triage Agent",
    product: "Microsoft Purview Insider Risk Management",
    productTag: "Purview IRM",
    description:
      "Triages insider risk alerts by analysing recent user activity and surfacing the highest-risk cases.",
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft documents that consumption depends on alert volume and type and points to the in-tenant usage dashboard. 0.5 SCU anchors to the incident-summarisation reference.",
    defaultRunsPerMonth: 100,
    defaultHoursSavedPerRun: 0.25,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure. Insider risk alerts require context-loading across user activity history; manual triage commonly takes 15-30 minutes per alert. 0.25 h is a conservative estimate of insider-risk-reviewer time given back.",
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
    scuPerRun: 0.5,
    source: "community-estimate",
    sourceNote:
      "Microsoft documents that consumption depends on alert volume and type and points to the in-tenant usage dashboard. 0.5 SCU anchors to the incident-summarisation reference.",
    defaultRunsPerMonth: 100,
    defaultHoursSavedPerRun: 0.25,
    hoursSavedSource: "community-estimate",
    hoursSavedSourceNote:
      "Microsoft does not publish a per-run time-saved figure. DLP alert triage commonly takes 10-20 minutes per alert when separating real exposure from noise. 0.25 h is a conservative estimate of DLP-reviewer time given back.",
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
