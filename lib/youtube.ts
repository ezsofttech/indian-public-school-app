import { getOptionalApi, unwrapCollection } from "@/lib/api-client";

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
};

const DEFAULT_HANDLE = "ipssbp";
const DEFAULT_CHANNEL_ID = "UCLnjAG02fRWXCTM3ZFM_o9A";
const RSS_URL = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

export function decodeXmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function pickTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1] ? decodeXmlEntities(match[1].trim()) : "";
}

export function pickAttr(block: string, tag: string, attr: string): string {
  const match = block.match(
    new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*\\/?>`),
  );
  return match?.[1] ?? "";
}

export function parseRssEntries(xml: string): YouTubeVideo[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const id =
        pickTag(entry, "yt:videoId") ||
        pickTag(entry, "id").replace(/^yt:video:/, "");
      if (!id) return null;

      const title = pickTag(entry, "title");
      const description =
        pickTag(entry, "media:description") || pickTag(entry, "summary");
      const publishedAt = pickTag(entry, "published");
      const thumbnailUrl =
        pickAttr(entry, "media:thumbnail", "url") ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      return {
        id,
        title,
        description,
        publishedAt,
        thumbnailUrl,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube.com/embed/${id}`,
      };
    })
    .filter((video): video is YouTubeVideo => Boolean(video));
}

export async function resolveChannelIdFromHandle(handle: string): Promise<string | null> {
  const cleanHandle = handle.replace(/^@/, "").trim();
  if (!cleanHandle) return null;

  try {
    const res = await fetch(`https://www.youtube.com/@${cleanHandle}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const external = html.match(/"externalId":"(UC[^"]+)"/)?.[1];
    const channel = html.match(/"channelId":"(UC[^"]+)"/)?.[1];
    return external || channel || null;
  } catch {
    return null;
  }
}

export async function channelRssHasVideos(channelId: string): Promise<boolean> {
  try {
    const res = await fetch(RSS_URL(channelId), { next: { revalidate: 3600 } });
    if (!res.ok) return false;
    const xml = await res.text();
    return /<entry>/.test(xml);
  } catch {
    return false;
  }
}

export async function resolveChannelId(): Promise<string> {
  const handle =
    process.env.YOUTUBE_CHANNEL_HANDLE?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE?.trim();
  if (handle) {
    const fromHandle = await resolveChannelIdFromHandle(handle);
    if (fromHandle) return fromHandle;
  }

  const fromEnv =
    process.env.YOUTUBE_CHANNEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID?.trim();
  if (fromEnv && (await channelRssHasVideos(fromEnv))) return fromEnv;

  const fallbackHandle = DEFAULT_HANDLE;
  const fallbackId = await resolveChannelIdFromHandle(fallbackHandle);
  if (fallbackId) return fallbackId;

  return fromEnv || DEFAULT_CHANNEL_ID;
}

export async function fetchFromRss(
  channelId: string,
  limit: number,
): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch(RSS_URL(channelId), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssEntries(xml).slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchFromApi(
  channelId: string,
  limit: number,
): Promise<YouTubeVideo[]> {
  const apiKey =
    process.env.YOUTUBE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY?.trim();
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      part: "snippet",
      channelId,
      order: "date",
      maxResults: String(limit),
      type: "video",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          description?: string;
          publishedAt?: string;
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
      }>;
    };

    return (data.items ?? [])
      .map((item) => {
        const id = item.id?.videoId;
        if (!id) return null;
        const snippet = item.snippet;
        return {
          id,
          title: decodeXmlEntities(snippet?.title ?? "Campus Video"),
          description: decodeXmlEntities(snippet?.description ?? ""),
          publishedAt: snippet?.publishedAt ?? "",
          thumbnailUrl:
            snippet?.thumbnails?.high?.url ??
            snippet?.thumbnails?.medium?.url ??
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
          embedUrl: `https://www.youtube.com/embed/${id}`,
        };
      })
      .filter((video): video is YouTubeVideo => Boolean(video));
  } catch {
    return [];
  }
}

export function getYouTubeChannelUrl(): string {
  const handle = (
    process.env.YOUTUBE_CHANNEL_HANDLE ||
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE ||
    DEFAULT_HANDLE
  )
    .trim()
    .replace(/^@/, "");

  return `https://www.youtube.com/@${handle}`;
}

// Built-in seed fallback to guarantee uninterrupted flow
const SEED_YOUTUBE_VIDEOS: YouTubeVideo[] = [
  {
    id: "z-AJiDOVNvU",
    title: "✨🌺 Glimpses of Navratri Celebrations at Indian Public School, Sambalpur! 🌺✨",
    description: "Joyful highlights and vibrant cultural performances by our students during Navratri celebrations.",
    publishedAt: "2026-10-16T06:15:58Z",
    thumbnailUrl: "https://i.ytimg.com/vi/z-AJiDOVNvU/hqdefault.jpg",
    watchUrl: "https://www.youtube.com/watch?v=z-AJiDOVNvU",
    embedUrl: "https://www.youtube.com/embed/z-AJiDOVNvU",
  },
  {
    id: "Czb0Gp7VZpU",
    title: "Indian Public School, Sambalpur - Campus Highlights",
    description: "A glimpse of the scenic campus, smart classrooms, and infrastructure at Indian Public School.",
    publishedAt: "2026-09-22T14:49:24Z",
    thumbnailUrl: "https://i.ytimg.com/vi/Czb0Gp7VZpU/hqdefault.jpg",
    watchUrl: "https://www.youtube.com/watch?v=Czb0Gp7VZpU",
    embedUrl: "https://www.youtube.com/embed/Czb0Gp7VZpU",
  },
  {
    id: "zNXmtf5vsms",
    title: "🌾 NUAKHAI CELEBRATION BY OUR LITTLE ONES 🌾",
    description: "Little children celebrating the agrarian festival Nuakhai with traditional fervor and joy.",
    publishedAt: "2026-09-13T12:28:28Z",
    thumbnailUrl: "https://i.ytimg.com/vi/zNXmtf5vsms/hqdefault.jpg",
    watchUrl: "https://www.youtube.com/watch?v=zNXmtf5vsms",
    embedUrl: "https://www.youtube.com/embed/zNXmtf5vsms",
  },
  {
    id: "NU-Jj5oJxxU",
    title: "🎨✨ LITTLE HANDS, BIG IMAGINATIONS! 👐🌈",
    description: "Creative arts, crafts and imaginative activities by pre-primary and primary students.",
    publishedAt: "2026-09-13T02:51:32Z",
    thumbnailUrl: "https://i.ytimg.com/vi/NU-Jj5oJxxU/hqdefault.jpg",
    watchUrl: "https://www.youtube.com/watch?v=NU-Jj5oJxxU",
    embedUrl: "https://www.youtube.com/embed/NU-Jj5oJxxU",
  },
  {
    id: "CCt99Xyna8U",
    title: "🇮🇳✨ Celebrating the Spirit of Freedom! ✨🇮🇳",
    description: "Independence Day celebration and national anthem performance by students.",
    publishedAt: "2026-08-16T18:04:37Z",
    thumbnailUrl: "https://i.ytimg.com/vi/CCt99Xyna8U/hqdefault.jpg",
    watchUrl: "https://www.youtube.com/watch?v=CCt99Xyna8U",
    embedUrl: "https://www.youtube.com/embed/CCt99Xyna8U",
  },
];

export async function fetchLatestYouTubeVideos(limit = 6): Promise<YouTubeVideo[]> {
  try {
    // 1. Try dedicated Backend API endpoint (/api/v1/youtube/videos)
    const backendRes = await getOptionalApi<any>(`/youtube/videos?limit=${limit}`);
    const items = unwrapCollection<any>(backendRes);
    if (Array.isArray(items) && items.length > 0) {
      return items.slice(0, limit).map((v) => ({
        id: v.id,
        title: decodeXmlEntities(v.title || v.eventName || "Campus Video"),
        description: decodeXmlEntities(v.description || ""),
        publishedAt: v.publishedAt || v.date || "",
        thumbnailUrl: v.poster || v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        watchUrl: v.src || `https://www.youtube.com/watch?v=${v.id}`,
        embedUrl: v.embedUrl || `https://www.youtube.com/embed/${v.id}`,
      }));
    }

    // 2. Try RSS feed directly
    const channelId = await resolveChannelId();
    const rssVideos = await fetchFromRss(channelId, limit);
    if (rssVideos.length > 0) return rssVideos;

    // 3. Try YouTube API directly
    const apiVideos = await fetchFromApi(channelId, limit);
    if (apiVideos.length > 0) return apiVideos;

    // 4. Return reliable seed fallback
    return SEED_YOUTUBE_VIDEOS.slice(0, limit);
  } catch {
    return SEED_YOUTUBE_VIDEOS.slice(0, limit);
  }
}
