import type { Metadata } from "next";
import { HomeClient } from "@/components/site/HomeClient";
import { getPageSeoMetadata } from "@/lib/seo";
import { API_URL } from "@/lib/config";
import { getStaticPageBySlug } from "@/data/pages";

export const metadata: Metadata = getPageSeoMetadata("home", "/");

async function getHomePageData() {
  try {
    const res = await fetch(`${API_URL}/pages/slug/home`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }
  } catch {
    // fallback cleanly if API server is offline, crashed, or delayed
  }
  return getStaticPageBySlug("home");
}

export default async function Home() {
  return <HomeClient />;
}

