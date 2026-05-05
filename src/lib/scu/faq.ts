export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "what-is-scu",
    question: "What is a Security Compute Unit (SCU)?",
    answer:
      "A Security Compute Unit (SCU) is a unit of compute capacity Microsoft uses to meter Security Copilot consumption. In provisioned mode you commit to N SCUs per hour at a flat rate; in E5/E7 inclusion and overage modes, SCUs are deducted per consumed operation at one-decimal precision. Microsoft does not publish per-operation SCU rates; the figures of 3 SCU per prompt, 0.5 SCU per incident summary, and 3.7 SCU per promptbook appear in Microsoft Learn's billing-math examples as teaching scenarios, not benchmarks. Real consumption depends on operation complexity and is only visible in your tenant's usage dashboard.",
  },
  {
    id: "scus-included-in-e5",
    question: "Are SCUs included with Microsoft 365 E5?",
    answer:
      "Yes. Microsoft began auto-provisioning SCUs to paid Microsoft 365 E5 and E7 subscriptions in November 2025, with global rollout completing by mid-2026. The included pool is calculated as min(10,000, paid_E5_users / 1,000 x 400) SCU per month, capped at 10,000. A tenant with 5,000 paid E5 users receives 2,000 included SCU per month.",
  },
  {
    id: "scus-included-in-e3",
    question: "Are SCUs included with Microsoft 365 E3?",
    answer:
      "No. Microsoft has only announced auto-included SCUs for Microsoft 365 E5 and E7. E3 subscriptions receive no included SCU and consumption is fully billable at the published overage rate.",
  },
  {
    id: "overage-rate",
    question: "What is the SCU overage rate?",
    answer:
      "Microsoft documents an overage rate of $6 USD per SCU on a pay-as-you-go basis once the included pool is exhausted and overage is enabled for the tenant. Overage is billed at one-decimal precision per consumed SCU — not rounded up to whole units.",
  },
  {
    id: "provisioned-rate",
    question: "What does a provisioned SCU cost per hour?",
    answer:
      "Microsoft's pricing examples use $4 USD per provisioned SCU per hour. A single provisioned SCU running 24/7 costs roughly $2,920 per month — billed flat, regardless of how much capacity you actually consume that hour. E5/E7 inclusion is a separate model with no hourly billing; the two don't stack.",
  },
  {
    id: "phishing-triage-cost",
    question: "How many SCU does the Phishing Triage Agent consume?",
    answer:
      "Microsoft has not published a per-run rate for the Phishing Triage Agent. Field reports from Microsoft product teams put it around 0.5 SCU per email triaged — the same as the incident-summarisation reference in Microsoft's billing-math example. This calculator uses 0.5 SCU as the default; verify against your tenant's usage dashboard.",
  },
  {
    id: "conditional-access-agent-cost",
    question: "How many SCU does the Conditional Access Optimization Agent consume?",
    answer:
      "Microsoft documents the Conditional Access Optimization Agent at less than 1 SCU per run on average. A single run can scan up to 300 users and 150 apps.",
  },
  {
    id: "how-many-scus-needed",
    question: "How many SCU does my organisation need?",
    answer:
      "Microsoft does not publish a definitive sizing matrix per analyst or per endpoint. The recommended approach is to provision 1 to 3 SCU per hour for evaluation, set overage to unlimited or a budget cap, then size up based on the tenant usage dashboard after the first month.",
  },
];
