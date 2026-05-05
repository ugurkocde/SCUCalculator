import { type MetadataRoute } from "next";

import { BUILD_DATE, SITE_URL } from "~/lib/scu/constants";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = `${BUILD_DATE}T00:00:00.000Z`;
  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: ChangeFrequency;
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/methodology", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/agents", priority: 0.8, changeFrequency: "monthly" },
  ];
  return routes.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
