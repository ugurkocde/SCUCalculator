import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import { BUILD_DATE, SITE_URL } from "~/lib/scu/constants";
import { type FaqEntry } from "~/lib/scu/faq";

export const buildSoftwareApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Microsoft Security Copilot SCU Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/`,
  description:
    "Free calculator that estimates Microsoft Security Copilot Security Compute Unit (SCU) cost, including the M365 E5/E7 auto-inclusion formula and per-agent SCU consumption.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isAccessibleForFree: true,
  featureList: [
    "E5 and E7 included SCU formula: min(10000, paid_E5_users / 1000 * 400)",
    "Per-agent SCU consumption catalogue with provenance labels",
    "Multi-currency cost estimates",
    "Microsoft Learn citations and methodology transparency",
  ],
  publisher: {
    "@type": "Organization",
    name: "SCU Calculator",
    url: `${SITE_URL}/`,
  },
  dateModified: BUILD_DATE,
});

export const buildFaqLd = (entries: FaqEntry[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: entries.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.answer,
    },
  })),
});

export const buildOrganizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SCU Calculator",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/og.png`,
});

export const buildWebSiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SCU Calculator",
  url: `${SITE_URL}/`,
});

export const buildBreadcrumbLd = (
  trail: Array<{ name: string; url: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: entry.name,
    item: entry.url,
  })),
});

export const buildAgentItemListLd = () => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Microsoft Security Copilot agents and estimated SCU consumption",
  itemListElement: SECURITY_COPILOT_AGENTS.map((agent, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: agent.name,
    url: agent.docsUrl,
    description: `${agent.product} — ${agent.scuPerRun} SCU per run (${agent.source}).`,
  })),
});
