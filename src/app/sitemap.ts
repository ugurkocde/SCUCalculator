import { type MetadataRoute } from "next";

import { BUILD_DATE, SITE_URL } from "~/lib/scu/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = `${BUILD_DATE}T00:00:00.000Z`;
  const routes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1.0 },
    { path: "/methodology", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    { path: "/agents", priority: 0.8 },
  ];
  return routes.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: entry.priority,
  }));
}
