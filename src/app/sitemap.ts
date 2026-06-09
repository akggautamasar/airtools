import { MetadataRoute } from "next";
import { ALL_TOOLS } from "@/lib/tools-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://airtools.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = ALL_TOOLS.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticPages = [
    { url: BASE_URL, priority: 1.0 },
    { url: `${BASE_URL}/tools`, priority: 0.9 },
    { url: `${BASE_URL}/pricing`, priority: 0.7 },
    { url: `${BASE_URL}/blog`, priority: 0.7 },
    { url: `${BASE_URL}/contact`, priority: 0.5 },
  ].map(({ url, priority }) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority,
  }));

  return [...staticPages, ...toolPages];
}
