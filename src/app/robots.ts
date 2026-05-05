import { type MetadataRoute } from "next";

import { SITE_URL } from "~/lib/scu/constants";

export default function robots(): MetadataRoute.Robots {
  const allowedAgents = [
    "*",
    "GPTBot",
    "ChatGPT-User",
    "Google-Extended",
    "ClaudeBot",
    "anthropic-ai",
    "PerplexityBot",
    "Applebot-Extended",
    "CCBot",
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
