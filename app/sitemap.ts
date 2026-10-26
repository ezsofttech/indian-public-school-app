import type { MetadataRoute } from "next";
import datasource from "@/public/cloud-datasource.json";

function extractInternalRoutes(obj: unknown, foundRoutes = new Set<string>()): Set<string> {
  if (!obj || typeof obj !== "object") return foundRoutes;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractInternalRoutes(item, foundRoutes);
    }
    return foundRoutes;
  }

  const record = obj as Record<string, unknown>;
  if (typeof record.redirectUrl === "string" && record.redirectUrl.startsWith("/")) {
    const cleanPath = record.redirectUrl.split("#")[0].trim();
    if (cleanPath && cleanPath !== "/" && !cleanPath.startsWith("/admin") && !cleanPath.startsWith("/api")) {
      foundRoutes.add(cleanPath);
    }
  }

  for (const key of Object.keys(record)) {
    if (key === "redirectUrl") continue;
    extractInternalRoutes(record[key], foundRoutes);
  }

  return foundRoutes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "https://indian-public-school-app.vercel.app";

  const staticRoutes: { path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/contact-us", priority: 0.85, changeFrequency: "monthly" },
    { path: "/careers", priority: 0.75, changeFrequency: "monthly" },
    { path: "/gallery", priority: 0.8, changeFrequency: "weekly" },
    { path: "/gallery/album", priority: 0.8, changeFrequency: "weekly" },
    { path: "/gallery/videos", priority: 0.8, changeFrequency: "weekly" },
    { path: "/press-release", priority: 0.75, changeFrequency: "weekly" },
  ];

  const dynamicRoutesSet = extractInternalRoutes(datasource);

  // Add default core dynamic pages if not already extracted
  const corePages = [
    "/about",
    "/about/school-establishment",
    "/about/our-mission",
    "/about/core-value",
    "/about/director-message",
    "/about/chairman-message",
    "/about/principal-message",
    "/admission/curriculum",
    "/admissions/policy",
    "/admissions/procedure",
    "/admission/registration-form",
    "/download/mandatory/certificate-of-recognition",
    "/download/mandatory/cbse-affiliation",
    "/download/mandatory/public-disclosure"
  ];

  corePages.forEach((route) => dynamicRoutesSet.add(route));

  // Build sitemap items map to avoid duplicate URLs
  const sitemapEntriesMap = new Map<string, MetadataRoute.Sitemap[number]>();

  const now = new Date();

  for (const route of staticRoutes) {
    const fullUrl = route.path === "" ? baseUrl : `${baseUrl}${route.path}`;
    sitemapEntriesMap.set(fullUrl, {
      url: fullUrl,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  for (const routePath of dynamicRoutesSet) {
    const formattedPath = routePath.startsWith("/") ? routePath : `/${routePath}`;
    const fullUrl = `${baseUrl}${formattedPath}`;

    if (!sitemapEntriesMap.has(fullUrl)) {
      const priority = formattedPath.startsWith("/about") || formattedPath.startsWith("/admission") ? 0.8 : 0.65;
      sitemapEntriesMap.set(fullUrl, {
        url: fullUrl,
        lastModified: now,
        changeFrequency: "weekly",
        priority,
      });
    }
  }

  return Array.from(sitemapEntriesMap.values());
}
