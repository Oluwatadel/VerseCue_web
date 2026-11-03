import type { MetadataRoute } from "next";
import { GUIDES } from "../lib/guides";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://versecue.app").replace(/\/$/, "");
  return ["", "/features", "/download", "/docs", "/support", "/about", "/releases", ...GUIDES.map((guide) => `/docs/${guide.slug}`)]
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date("2026-10-30T00:00:00Z") }));
}
