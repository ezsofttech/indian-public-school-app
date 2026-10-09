import type { Metadata } from "next";
import { HomeClient } from "@/components/site/HomeClient";
import { getPageSeoMetadata } from "@/lib/seo";

const API_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

export const metadata: Metadata = getPageSeoMetadata("home", "/");


async function getHomePageData() {

  try {
    const res = await fetch(`${API_URL}/pages/slug/home`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }
  } catch {
    // fallback cleanly if API server is offline or unreachable
  }
  return null;
}

export default async function Home() {
  return <HomeClient />;
}

