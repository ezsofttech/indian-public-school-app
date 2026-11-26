import type { MetadataRoute } from "next";
import { DOMAIN } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = DOMAIN;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin/*", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}