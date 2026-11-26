import rawPages from "@/public/collections/pages.json";

export interface StaticPage {
  _id?: string;
  publicId?: string;
  title: string;
  slug?: string;
  targetUrl?: string;
  heading?: string;
  subHeading?: string;
  "sub-title"?: string;
  description?: string;
  content?: string;
  textContent?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean | string;
  blocks?: any[];
  cardItem?: any[];
  list?: any[];
  steps?: any[];
  fileUrl?: string;
  fileUrls?: string[];
  image?: string;
  images?: string[];
  [key: string]: unknown;
}

export const staticPages: StaticPage[] = (rawPages as unknown as StaticPage[]).filter(
  (page) => page.isPublished !== false && page.isPublished !== "false"
);

function normalizeKey(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Find static page by candidate slug or path
 */
export function getStaticPageBySlug(slug: string | string[]): StaticPage | null {
  const slugStr = Array.isArray(slug) ? slug.join("/") : slug;
  if (!slugStr) return null;

  const lastSeg = Array.isArray(slug) ? slug.at(-1) || "" : slug.split("/").pop() || "";
  const normLastSeg = normalizeKey(lastSeg);
  const normFull = normalizeKey(slugStr);

  const match = staticPages.find((p) => {
    if (!p || typeof p !== "object") return false;
    const s = normalizeKey(String(p.slug || ""));
    const u = normalizeKey(String(p.targetUrl || ""));
    return s === normLastSeg || s === normFull || u === normFull || u === `/${normFull}`;
  });

  return match || null;
}

export default staticPages;
