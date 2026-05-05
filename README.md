# SCU Calculator

Free Microsoft Security Copilot SCU (Security Compute Unit) cost calculator. Estimate your monthly bill in 60 seconds — no Azure login required.

> Live: https://scucalculator.com

<img width="1185" height="951" alt="image" src="https://github.com/user-attachments/assets/0503b945-f127-48e1-bbf7-881506cc6737" />


## Why this exists

Microsoft started auto-including SCUs in paid Microsoft 365 E5 and E7 licenses in November 2025. Buyers and license managers immediately had one question: **"what does going over the included pool cost me?"** Microsoft's own calculator at securitycopilot.microsoft.com/calculator is excellent at sizing provisioned capacity but requires an Azure login and frames the answer as a provisioned-vs-overage table — not as a single dollar number a CFO can read.

This calculator answers the budget question directly:

- **Hero number** is the monthly cost in your currency, with the included E5 / E7 pool already subtracted.
- **One click** opens the math trace so you can see every input and intermediate step.
- **Provisioned-vs-overage optimisation** automatically recommends the cheapest steady-state commitment.
- **Per-agent picker** lets you model specific Security Copilot Store agents (Phishing Triage, Conditional Access Optimization, etc.) with documented or conservative-estimate SCU rates.
- **URL state** — every input is encoded in the URL, so estimates are shareable.

## Features

- **3-input quick estimate**: license profile, paid users, analysts. Result renders on first paint.
- **Per-experience refinement**: optional split across Defender / Entra / Intune / Purview / Standalone with per-product per-user-month rates.
- **Agent picker**: 8 Security Copilot Store agents with provenance pills (Microsoft-published vs. community-estimate).
- **Provisioning recommendation**: when steady-state usage is high enough, surfaces the cheapest commitment at $4/SCU instead of $6/SCU overage.
- **Math-trace expander**: every dollar shown can be expanded into a step-by-step calculation.
- **Shareable URLs**: state encoded as compact query params; only non-default values are written.
- **Copy-for-email summary**: one-click clipboard copy of a procurement-ready text block including the URL.
- **Multi-currency**: live FX conversion for USD / EUR / GBP / TRY / CAD / AUD / JPY.
- **SEO + GEO**: server-rendered hero, FAQ accordion, JSON-LD schemas (`SoftwareApplication`, `FAQPage`, `Organization`, `WebSite`, `BreadcrumbList`), sitemap, robots.txt with explicit AI-bot allowlist (GPTBot, ClaudeBot, PerplexityBot, etc.), auto-generated 1200×630 OG image.
- **Sub-pages**: `/agents`, `/methodology`, `/faq` for deep reference content with their own metadata and breadcrumbs.

## Stack

- **Next.js 15** (App Router) on **React 19**
- **Tailwind CSS 4** with a warm-graphite + steel-blue oklch design system
- **TypeScript** strict, **Vitest** + **React Testing Library** for tests
- **Turbopack** dev server, **next/og** for dynamic Open Graph images
- Zero runtime third-party JS for trackers / analytics — the page is just the calculator.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 (Turbopack)
npm test             # vitest in watch mode
npm run test:run     # one-shot test run
npm run typecheck
npm run lint
npm run build        # production build
```

The dev server uses Turbopack and starts in ~1 second. There is no database, no auth, no API key required.

## Project structure

```
src/
  app/
    layout.tsx              Root layout, metadata, JSON-LD (Organization + WebSite), SiteHeader
    page.tsx                Server-rendered home: hero + calculator + reference + FAQ
    methodology/page.tsx    Formulas, sources, change log
    agents/page.tsx         Per-agent SCU reference table
    faq/page.tsx            Long-form FAQ
    sitemap.ts              4-route sitemap with build-date lastModified
    robots.ts               Robots.txt with AI-bot allowlist
    opengraph-image.tsx     Dynamic 1200×630 OG image (edge runtime)
  components/scu/
    calculator-shell.tsx    State + URL hydration + share-URL writer
    quick-estimate.tsx      Hero card with the 3 inputs
    results.tsx             Result card with hero number, savings chip, metrics strip, trace slot
    calculation-trace.tsx   Math trace (workload → included → overage → cost)
    agent-picker.tsx        Collapsible 8-card grid
    user-split.tsx          Optional per-experience input
    home-faq.tsx            Server-rendered FAQ accordion
    site-header.tsx         Top nav (brand, links, GitHub, mobile sheet)
    site-footer.tsx         Byline, GitHub, LinkedIn, last updated
    json-ld.tsx             Safe JSON-LD injector
  lib/scu/
    types.ts                CalculatorInput, CalculatorOutput, AgentSelection, UserSplit
    constants.ts            DEFAULT_INPUT, currencies, sources, per-experience rates, BUILD_DATE
    calculate.ts            Core math + recommendProvisioned()
    agents.ts               Security Copilot Store agent catalog
    quick-presets.ts        Quick-mode → CalculatorInput mapping
    url-state.ts            Encode / decode CalculatorInput as URL query params
    summary.ts              Email summary builder, range output
    structured-data.ts      JSON-LD schema builders
    faq.ts                  FAQ source of truth (used by both visible accordion and FAQPage LD)
```

## Methodology

Every number on the page is sourced or labelled. Highlights:

- **E5 / E7 included pool**: `min(10,000, paid_E5_users / 1,000 × 400)` SCU per month — direct from [Microsoft Learn](https://learn.microsoft.com/copilot/security/security-copilot-inclusion).
- **Overage rate**: `$6/SCU` from [Microsoft Learn](https://learn.microsoft.com/copilot/security/security-copilot-inclusion).
- **Provisioned rate**: `$4/SCU/hour` from Microsoft's [pricing page](https://www.microsoft.com/en-us/security/pricing/microsoft-security-copilot).
- **Agent SCU rates**: only the Conditional Access Optimization and Identity Risk Management agents have published per-run rates (both documented as `<1 SCU/run on average`). All other agents default to `0.5 SCU/run` — anchored to Microsoft's incident-summarisation reference (0.5 SCU) used in the billing-math example — with a clear "Estimate" pill on the card. Defaults are calibrated for mid-market usage; very large enterprises will see higher runs/month volumes per agent. The `/methodology` page lists every source.
- **The 3 / 0.5 / 3.7 SCU figures** are illustrative billing-math examples from Microsoft Learn, not benchmarks — the calculator surfaces this caveat instead of presenting them as typical rates.

Real per-tenant consumption only lives in the [Security Copilot usage dashboard](https://securitycopilot.microsoft.com/usage-monitoring). This calculator is a planning tool, not a billing oracle.

## Verification

- 37 unit + component tests covering the calculation engine, URL codec, agent catalog, quick presets, provisioned-savings recommender, and rendered React surface.
- Production build under 120 kB First Load JS for the home route.
- Tested across 1920 / 1440 / 1024 / 768 / 414 / 360 viewports for layout integrity.

## Contributing

PRs welcome. Particularly useful contributions:

- New Security Copilot Store agents (with documented or community-observed SCU rates)
- Updated per-experience SCU/user/month rates as Microsoft publishes telemetry
- Translations of the FAQ entries
- Bug reports for math errors (open an issue with the URL — state is encoded, so reproductions are one click)

## License

MIT.

## Author

Built by [Ugur Koc](https://www.linkedin.com/in/ugurkocde/).
