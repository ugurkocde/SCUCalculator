import { SECURITY_COPILOT_AGENTS } from "~/lib/scu/agents";
import { BUILD_DATE, SCU_SOURCES, SITE_URL } from "~/lib/scu/constants";
import { type FaqEntry } from "~/lib/scu/faq";

const PERSON_ID = `${SITE_URL}/#person-ugurkoc`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const METHODOLOGY_PUBLISHED = "2025-12-04";

export const buildSoftwareApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "WebApplication"],
  name: "Microsoft Security Copilot SCU Calculator",
  applicationCategory: "FinanceApplication",
  applicationSubCategory: "PricingCalculator",
  operatingSystem: "Web",
  url: `${SITE_URL}/`,
  description:
    "Free calculator that estimates Microsoft Security Copilot Security Compute Unit (SCU) cost, including the M365 E5/E7 auto-inclusion formula and per-agent SCU consumption.",
  inLanguage: "en",
  softwareVersion: "1.0",
  browserRequirements: "Requires JavaScript. Works in modern browsers.",
  keywords: [
    "Microsoft Security Copilot pricing",
    "SCU calculator",
    "Security Compute Unit",
    "Microsoft 365 E5 SCU inclusion",
    "Microsoft 365 E7 SCU inclusion",
    "Security Copilot cost estimator",
    "Security Copilot agents",
  ].join(", "),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isAccessibleForFree: true,
  featureList: [
    "E5 and E7 included SCU pool: 0.4 SCU per paid license, capped at 10,000/month",
    "Per-agent SCU consumption catalogue with provenance labels",
    "Multi-currency cost estimates",
    "Microsoft Learn citations and methodology transparency",
  ],
  author: { "@id": PERSON_ID },
  publisher: { "@id": ORGANIZATION_ID },
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
  "@id": ORGANIZATION_ID,
  name: "SCU Calculator",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "Free Microsoft Security Copilot SCU pricing calculator built on Microsoft-published formulas.",
  founder: { "@id": PERSON_ID },
  sameAs: [
    "https://github.com/ugurkocde/scucalculator",
    "https://www.linkedin.com/in/ugurkocde/",
  ],
  knowsAbout: [
    "Microsoft Security Copilot",
    "Security Compute Units",
    "Microsoft 365 E5 licensing",
    "Microsoft 365 E7 licensing",
    "Microsoft Intune",
  ],
});

export const buildPersonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Ugur Koc",
  url: "https://www.linkedin.com/in/ugurkocde/",
  jobTitle: "Microsoft MVP, Security and Cloud",
  description:
    "Microsoft MVP focused on Microsoft Intune, Security Copilot, and modern endpoint management.",
  sameAs: [
    "https://www.linkedin.com/in/ugurkocde/",
    "https://github.com/ugurkocde",
  ],
});

export const buildWebSiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SCU Calculator",
  url: `${SITE_URL}/`,
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION_ID },
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

export const buildAgentDatasetLd = () => ({
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Microsoft Security Copilot agent SCU consumption rates",
  description:
    "Per-agent SCU consumption estimates for Microsoft Security Copilot agents, with documented or estimated rates and provenance labels.",
  url: `${SITE_URL}/agents`,
  creator: { "@id": PERSON_ID },
  publisher: { "@id": ORGANIZATION_ID },
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  inLanguage: "en",
  keywords: [
    "Security Copilot agents",
    "SCU per run",
    "Microsoft Security Store",
    "Security Copilot pricing",
  ],
  variableMeasured: ["SCU per run", "Agent product family", "Source provenance"],
  dateModified: BUILD_DATE,
});

export const buildMethodologyArticleLd = () => ({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How the SCU Calculator works — methodology and sources",
  url: `${SITE_URL}/methodology`,
  author: { "@id": PERSON_ID },
  publisher: { "@id": ORGANIZATION_ID },
  datePublished: METHODOLOGY_PUBLISHED,
  dateModified: BUILD_DATE,
  inLanguage: "en",
  proficiencyLevel: "Expert",
  about: "Microsoft Security Copilot Security Compute Unit cost estimation",
  citation: SCU_SOURCES.map((source) => ({
    "@type": "CreativeWork",
    name: source.title,
    publisher: source.publisher,
    url: source.url,
  })),
});
