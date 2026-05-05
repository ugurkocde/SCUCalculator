import { type MetadataRoute } from "next";

import { SITE_URL } from "~/lib/scu/constants";

export default function robots(): MetadataRoute.Robots {
  const allowedAgents = [
    "*",
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "Google-Extended",
    "ClaudeBot",
    "anthropic-ai",
    "Claude-Web",
    "PerplexityBot",
    "Perplexity-User",
    "Applebot",
    "Applebot-Extended",
    "CCBot",
    "Bytespider",
    "Amazonbot",
    "YouBot",
    "PhindBot",
    "Meta-ExternalAgent",
    "Meta-ExternalFetcher",
    "Diffbot",
    "Cohere-ai",
    "Timpibot",
    "MistralAI-User",
  ];
  return {
    rules: allowedAgents.map((userAgent) => ({
      userAgent,
      allow: "/",
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
