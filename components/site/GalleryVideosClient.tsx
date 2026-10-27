"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Video,
  Play,
  X,
  Grid,
  Tv,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Film,
  Search,
  Youtube,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";
import { UniversalMedia } from "@/components/ui/UniversalMedia";
import { EASE } from "@/lib/motion-presets";

export interface VideoItem {
  id: string;
  src: string;
  embedUrl?: string;
  title: string;
  category: string;
  directory?: string;
  description?: string;
  poster?: string;
  date?: string;
  views?: string;
  duration?: string;
  channelTitle?: string;
  source: "youtube" | "database";
  isFeatured?: boolean;
}

export interface ChannelInfo {
  channelId: string;
  handle: string;
  title: string;
  url: string;
  avatarUrl?: string;
  description?: string;
}

const VIDEO_CATEGORIES = [
  "All",
  "Events & Celebrations",
  "Campus & Tour",
  "Sports & Activities",
  "Academics & Learning",
  "Hostel & Student Life",
] as const;

type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

const DEFAULT_CHANNEL: ChannelInfo = {
  channelId: "UCLnjAG02fRWXCTM3ZFM_o9A",
  handle: "@ipssbp",
  title: "Indian Public School, Sambalpur",
  url: "https://www.youtube.com/@ipssbp",
  description: "Official YouTube Channel of Indian Public School, Sambalpur",
};

// Fallback seed videos from official @ipssbp channel to guarantee immediate rendering
const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: "z-AJiDOVNvU",
    src: "https://www.youtube.com/watch?v=z-AJiDOVNvU",
    embedUrl: "https://www.youtube.com/embed/z-AJiDOVNvU",
    title: "✨🌺 Glimpses of Navratri Celebrations at Indian Public School, Sambalpur! 🌺✨",
    category: "Events & Celebrations",
    directory: "/album/videos",
    description: "Joyful highlights and vibrant cultural performances by our students during Navratri celebrations.",
    poster: "https://i.ytimg.com/vi/z-AJiDOVNvU/hqdefault.jpg",
    date: "2026-10-16T06:15:58.000Z",
    duration: "1:27",
    channelTitle: "Indian Public School, Sambalpur",
    source: "youtube",
    isFeatured: true,
  },
  {
    id: "Czb0Gp7VZpU",
    src: "https://www.youtube.com/watch?v=Czb0Gp7VZpU",
    embedUrl: "https://www.youtube.com/embed/Czb0Gp7VZpU",
    title: "Indian Public School, Sambalpur - Campus Highlights",
    category: "Campus & Tour",
    directory: "/album/videos",
    description: "A glimpse of the scenic campus, smart classrooms, and infrastructure at Indian Public School.",
    poster: "https://i.ytimg.com/vi/Czb0Gp7VZpU/hqdefault.jpg",
    date: "2026-10-05T10:00:00.000Z",
    channelTitle: "Indian Public School, Sambalpur",
    source: "youtube",
  },
  {
    id: "NU-Jj5oJxxU",
    src: "https://www.youtube.com/watch?v=NU-Jj5oJxxU",
    embedUrl: "https://www.youtube.com/embed/NU-Jj5oJxxU",
    title: "🌾 NUAKHAI CELEBRATION BY OUR LITTLE ONES 🌾",
    category: "Events & Celebrations",
    directory: "/album/videos",
    description: "Little children celebrating the agrarian festival Nuakhai with traditional fervor and joy.",
    poster: "https://i.ytimg.com/vi/NU-Jj5oJxxU/hqdefault.jpg",
    date: "2026-09-20T08:30:00.000Z",
    channelTitle: "Indian Public School, Sambalpur",
    source: "youtube",
  },
  {
    id: "CCt99Xyna8U",
    src: "https://www.youtube.com/watch?v=CCt99Xyna8U",
    embedUrl: "https://www.youtube.com/embed/CCt99Xyna8U",
    title: "🎨✨ LITTLE HANDS, BIG IMAGINATIONS! 👐🌈",
    category: "Sports & Activities",
    directory: "/album/videos",
    description: "Creative arts, crafts and imaginative activities by pre-primary and primary students.",
    poster: "https://i.ytimg.com/vi/CCt99Xyna8U/hqdefault.jpg",
    date: "2026-09-12T05:45:00.000Z",
    channelTitle: "Indian Public School, Sambalpur",
    source: "youtube",
  },
];

function cleanVideoTitle(rawName?: string, fallback = "Campus Video"): string {
  if (!rawName) return fallback;
  let str = String(rawName).trim();
  str = str.replace(/\.(mp4|webm|mov|mkv|avi)$/i, "");
  return str || fallback;
}

export function GalleryVideosClient() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channel, setChannel] = useState<ChannelInfo>(DEFAULT_CHANNEL);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "theater">("grid");
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);
  const [theaterSelectedVideo, setTheaterSelectedVideo] = useState<VideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch YouTube Channel Videos from API
  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      try {
        // 1. Try dedicated YouTube videos endpoint
        let response = await getOptionalApi<any>("/youtube/videos?limit=100");

        // 2. Fallback to /gallery/videos if needed
        if (!response?.data) {
          response = await getOptionalApi<any>("/gallery/videos?limit=100");
        }

        // 3. Fallback to general gallery if needed
        if (!response?.data) {
          response = await getOptionalApi<any>("/gallery?limit=500");
        }

        const rawList = unwrapCollection<any>(response);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped: VideoItem[] = rawList
            .filter((item: any) => {
              // Ensure we only use YouTube items or explicit video items, not Cloudinary raw video files
              const isYt = item.isYouTube || item.id?.startsWith("yt-") || String(item.mimeType || "").includes("youtube");
              const hasYtUrl = Array.isArray(item.fileUrl)
                ? item.fileUrl.some((u: string) => String(u).includes("youtube.com") || String(u).includes("youtu.be"))
                : typeof item.url === "string" && (item.url.includes("youtube.com") || item.url.includes("youtu.be"));
              return isYt || hasYtUrl || item.embedUrl;
            })
            .map((item: any, idx: number) => {
              const rawId = item.id ? String(item.id).replace(/^yt-/, "") : `yt-vid-${idx}`;
              const videoUrl =
                (Array.isArray(item.fileUrl) && item.fileUrl[0]) ||
                item.url ||
                `https://www.youtube.com/watch?v=${rawId}`;

              const thumbnail =
                item.thumbnail ||
                item.posterUrl ||
                item.poster ||
                `https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`;

              return {
                id: rawId,
                src: videoUrl,
                embedUrl: item.embedUrl || `https://www.youtube.com/embed/${rawId}`,
                title: cleanVideoTitle(item.eventName || item.title, "Campus Video"),
                category: item.eventType || item.category || "Events & Celebrations",
                directory: item.directory || "/album/videos",
                description: item.description || "",
                poster: thumbnail,
                date: item.publishedAt || item.createdAt || item.updatedAt,
                views: item.views,
                duration: item.duration,
                channelTitle: item.channelTitle || DEFAULT_CHANNEL.title,
                source: "youtube" as const,
                isFeatured: Boolean(item.isFeatured || idx === 0),
              };
            });

          if (isMounted) {
            setVideos(mapped.length > 0 ? mapped : FALLBACK_VIDEOS);
            if (response?.data && typeof response.data === "object" && !Array.isArray(response.data) && (response.data as any).channel) {
              setChannel((response.data as any).channel);
            }
          }
        } else {
          // If no API items returned, load fallback seed videos
          if (isMounted) {
            setVideos(FALLBACK_VIDEOS);
          }
        }
      } catch (err) {
        console.error("Failed to load YouTube videos:", err);
        if (isMounted) setVideos(FALLBACK_VIDEOS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & Sorted Videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search keyword filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          v.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (a.isFeatured) return -1;
      if (b.isFeatured) return 1;

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "oldest") {
        return (a.date || "").localeCompare(b.date || "");
      }
      return (b.date || "").localeCompare(a.date || "");
    });

    return result;
  }, [videos, selectedCategory, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: videos.length };
    for (const cat of VIDEO_CATEGORIES) {
      if (cat === "All") continue;
      counts[cat] = videos.filter(
        (v) => v.category.toLowerCase() === cat.toLowerCase()
      ).length;
    }
    return counts;
  }, [videos]);

  // Featured video selection
  const featuredVideo = useMemo(() => {
    return videos.find((v) => v.isFeatured) || videos[0] || null;
  }, [videos]);

  // Current theater video
  const activeTheaterVideo = theaterSelectedVideo || featuredVideo;

  // Handle share / copy link
  const handleCopyLink = (video: VideoItem) => {
    const shareUrl = video.src.startsWith("http")
      ? video.src
      : typeof window !== "undefined"
      ? `${window.location.origin}/gallery/videos#${video.id}`
      : "";

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-[var(--gold)] selection:text-navy-950">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-deep to-navy-950 py-16 text-white sm:py-20 lg:py-24">
        {/* Ambient glowing background accents */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[var(--gold)] blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-red-600 blur-3xl" />
        </div>

        <div className="container-page relative z-10">
          {/* Breadcrumbs & Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide sm:text-sm"
          >
            <Link
              href="/"
              className="transition-colors hover:text-[var(--gold)] hover:underline text-white/80"
            >
              Home
            </Link>
            <span className="text-[var(--gold)] font-extrabold">*</span>
            <Link
              href="/gallery"
              className="transition-colors hover:text-[var(--gold)] hover:underline text-white/80"
            >
              Gallery
            </Link>
            <span className="text-[var(--gold)] font-extrabold">*</span>
            <span className="font-bold text-[var(--gold)] drop-shadow-sm">
              Videos
            </span>
          </nav>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3.5 py-1 text-xs font-bold tracking-wider text-red-400 uppercase backdrop-blur-sm">
                <Youtube className="size-4 text-red-500" />
                <span>YouTube Channel Spotlight</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md font-[var(--font-display)]">
                School Life in Motion
              </h1>
              <p className="text-base text-white/80 sm:text-lg">
                Watch school events, annual celebrations, sports tournaments, campus tour glimpses, and learning moments broadcasted directly from our official YouTube channel.
              </p>
            </div>

            {/* Quick Switcher: Photos vs Videos */}
            <div className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-md">
              <Link
                href="/gallery/album"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                <ImageIcon className="size-4" />
                <span>Photos</span>
              </Link>
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm">
                <Youtube className="size-4 fill-white" />
                <span>YouTube Videos ({videos.length})</span>
              </div>
            </div>
          </div>

          {/* YouTube Channel Banner Spotlight */}
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                <Youtube className="size-7 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white sm:text-base">
                    {channel.title}
                  </h2>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-mono text-red-300">
                    {channel.handle}
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  {channel.description || "Official YouTube channel broadcasting all campus events and celebrations"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <a
                href={`${channel.url}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:bg-red-700 hover:scale-105 active:scale-95"
              >
                <Youtube className="size-4 fill-white" />
                <span>Subscribe</span>
              </a>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                <span>Visit Channel</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container-page mt-8 space-y-6">
        {/* Category Filter Pills & Search */}
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-4">
            {VIDEO_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20 scale-102"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                  )}
                >
                  <span>{cat}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sleek Toolbar: Title, Search, Sort, and View Mode */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between text-card-foreground">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campus videos..."
                className="w-full rounded-xl border border-input bg-background pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid View"
                >
                  <Grid className="size-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("theater")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    viewMode === "theater"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Theater View"
                >
                  <Tv className="size-3.5" />
                  <span>Theater</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode: Theater Showcase */}
        {viewMode === "theater" && activeTheaterVideo && (
          <section className="rounded-3xl border border-border bg-navy-950 p-6 text-white shadow-xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Theater Player */}
              <div className="space-y-4 lg:col-span-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                  <UniversalMedia
                    src={activeTheaterVideo.src}
                    title={activeTheaterVideo.title}
                    poster={activeTheaterVideo.poster}
                    controls={true}
                    aspectRatio="video"
                    objectFit="contain"
                    autoPlay={false}
                    className="w-full"
                    containerClassName="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {activeTheaterVideo.category ? (
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30">
                          {activeTheaterVideo.category}
                        </span>
                      ) : null}
                      {activeTheaterVideo.isFeatured && (
                        <span className="rounded-full bg-[var(--gold)]/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-400/30">
                          Featured
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90">
                        <Youtube className="size-3.5 text-red-500 fill-red-500" />
                        <span>YouTube</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(activeTheaterVideo)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        title="Copy Video Link"
                      >
                        {copiedId === activeTheaterVideo.id ? (
                          <>
                            <Check className="size-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="size-3.5" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                      <a
                        href={activeTheaterVideo.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 shadow-xs"
                        title="Open directly on YouTube"
                      >
                        <Youtube className="size-3.5 fill-white" />
                        <span>Watch on YouTube</span>
                      </a>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-[var(--font-display)]">
                    {activeTheaterVideo.title}
                  </h2>
                  {activeTheaterVideo.description && (
                    <p className="text-sm text-white/70 leading-relaxed">
                      {activeTheaterVideo.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Theater Playlist Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm font-semibold tracking-wider text-white/90 uppercase flex items-center gap-2">
                    <Film className="size-4 text-red-400" />
                    <span>Playlist ({filteredVideos.length})</span>
                  </h3>
                  <span className="text-xs text-white/60">Click to switch</span>
                </div>
                <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                  {filteredVideos.map((vid, idx) => {
                    const isSelected = vid.id === activeTheaterVideo.id;
                    return (
                      <button
                        key={vid.id || idx}
                        type="button"
                        onClick={() => setTheaterSelectedVideo(vid)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 rounded-xl p-2.5 transition-all cursor-pointer",
                          isSelected
                            ? "bg-white/15 border border-red-500/50 text-white shadow-sm"
                            : "hover:bg-white/5 text-white/70 hover:text-white"
                        )}
                      >
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10">
                          {vid.poster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={vid.poster}
                              alt={vid.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play
                              className={cn(
                                "size-4 transition-transform",
                                isSelected
                                  ? "text-red-500 fill-red-500 scale-125"
                                  : "text-white/80"
                              )}
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          {vid.category ? (
                            <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                              {vid.category}
                            </span>
                          ) : null}
                          <h4 className="line-clamp-2 text-xs font-semibold leading-snug">
                            {vid.title}
                          </h4>
                          {vid.date && (
                            <span className="flex items-center gap-1 text-[10px] text-white/50">
                              <Calendar className="size-3" />
                              {new Date(vid.date).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Video Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading YouTube Channel Videos...
            </p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Film className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">
              No videos found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              {searchQuery
                ? `No videos matched the query "${searchQuery}". Try a different keyword or reset filters.`
                : "There are currently no videos available in this category."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video, index) => {
              return (
                <motion.article
                  key={video.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: EASE }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-red-500/40 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Video Thumbnail / Preview Container */}
                  <div
                    onClick={() => setActiveModalVideo(video)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-black flex items-center justify-center"
                  >
                    {/* YouTube Poster Image */}
                    {video.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.poster}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}

                    {/* Gradient Overlay for high-contrast readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                    {/* Featured badge top left */}
                    {video.isFeatured && (
                      <div className="absolute top-3 left-3 z-10 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[11px] font-bold text-navy-950 shadow-sm flex items-center gap-1">
                        <Sparkles className="size-3" />
                        <span>Featured</span>
                      </div>
                    )}

                    {/* YouTube Logo Badge top right */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                      <Youtube className="size-3.5 fill-white" />
                      <span>YouTube</span>
                    </div>

                    {/* Center Animated Play Button */}
                    <div className="relative z-10 flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-all duration-300 group-hover:scale-115 group-hover:bg-red-700">
                      <Play className="size-6 translate-x-0.5 fill-current" />
                    </div>

                    {/* Category pill bottom left */}
                    {video.category ? (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="rounded-md bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-sm border border-white/10">
                          {video.category}
                        </span>
                      </div>
                    ) : null}

                    {/* Duration or Views bottom right */}
                    {(video.duration || video.views) && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <span className="flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                          {video.duration ? (
                            <>
                              <Clock className="size-2.5" />
                              <span>{video.duration}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="size-2.5" />
                              <span>{video.views}</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Content Details */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      <h3
                        onClick={() => setActiveModalVideo(video)}
                        className="cursor-pointer text-base font-bold text-foreground transition-colors group-hover:text-red-600 line-clamp-2"
                        title={video.title}
                      >
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <div className="text-muted-foreground text-[11px]">
                        {video.date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground/70" />
                            {new Date(video.date).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span>Indian Public School</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Share Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(video)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title="Share Video Link"
                        >
                          {copiedId === video.id ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="size-3.5" />
                          )}
                        </button>

                        {/* Open on YouTube */}
                        <a
                          href={video.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                          title="Watch on YouTube"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        {/* Watch / Cast Modal button */}
                        <button
                          type="button"
                          onClick={() => setActiveModalVideo(video)}
                          className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <span>Cast / Watch</span>
                          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* Video Lightbox / Interactive Modal */}
      <AnimatePresence>
        {activeModalVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setActiveModalVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ ease: EASE, duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-navy-950 text-white shadow-2xl"
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
                      {activeModalVideo.category}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/70">
                      <Youtube className="size-3 text-red-500 fill-red-500" />
                      <span>YouTube Cast</span>
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold text-white sm:text-lg">
                    {activeModalVideo.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeModalVideo)}
                    className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    title="Copy Video Link"
                  >
                    {copiedId === activeModalVideo.id ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </button>
                  <a
                    href={activeModalVideo.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-white/70 hover:bg-red-600 hover:text-white transition-colors"
                    title="Watch on YouTube"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveModalVideo(null)}
                    className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="bg-black">
                <UniversalMedia
                  src={activeModalVideo.src}
                  title={activeModalVideo.title}
                  poster={activeModalVideo.poster}
                  controls={true}
                  autoPlay={true}
                  aspectRatio="video"
                  objectFit="contain"
                  className="w-full"
                  containerClassName="w-full"
                />
              </div>

              {/* Modal Footer with navigation & metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
                    Indian Public School
                  </span>
                  {activeModalVideo.date && (
                    <span>
                      {new Date(activeModalVideo.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Prev / Next video controls */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentIndex = filteredVideos.findIndex(
                      (v) => v.id === activeModalVideo.id
                    );
                    const hasPrev = currentIndex > 0;
                    const hasNext = currentIndex < filteredVideos.length - 1;

                    return (
                      <>
                        <button
                          type="button"
                          disabled={!hasPrev}
                          onClick={() => {
                            if (hasPrev) {
                              setActiveModalVideo(filteredVideos[currentIndex - 1]);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="size-3.5" />
                          <span>Previous</span>
                        </button>
                        <span className="text-white/40">|</span>
                        <button
                          type="button"
                          disabled={!hasNext}
                          onClick={() => {
                            if (hasNext) {
                              setActiveModalVideo(filteredVideos[currentIndex + 1]);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="size-3.5" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
