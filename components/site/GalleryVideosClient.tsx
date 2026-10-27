"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Film,
  Youtube,
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
  subscriberCount?: string | number;
  videoCount?: string | number;
  viewCount?: string | number;
}

const DEFAULT_CHANNEL: ChannelInfo = {
  channelId: "UCLnjAG02fRWXCTM3ZFM_o9A",
  handle: "@ipssbp",
  title: "Indian Public School, Sambalpur",
  url: "https://www.youtube.com/@ipssbp",
  description: "Official YouTube Channel of Indian Public School, Sambalpur",
  subscriberCount: "755+",
  videoCount: "91",
  viewCount: "96.5K+",
};

const ITEMS_PER_PAGE = 12;

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
    duration: "0:32",
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
    duration: "0:48",
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
    duration: "0:55",
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const gridTopRef = useRef<HTMLDivElement>(null);

  // Fetch YouTube Channel Videos from API
  useEffect(() => {
    let isMounted = true;
    const fetchVideos = async () => {
      try {
        // 1. Fetch videos and channel info in parallel
        const [videosRes, channelRes] = await Promise.all([
          getOptionalApi<any>("/youtube/videos?limit=100"),
          getOptionalApi<any>("/youtube/channel"),
        ]);

        let response = videosRes;

        // 2. Fallback to /gallery/videos if needed
        if (!response?.data) {
          response = await getOptionalApi<any>("/gallery/videos?limit=100");
        }

        // 3. Fallback to general gallery if needed
        if (!response?.data) {
          response = await getOptionalApi<any>("/gallery?limit=500");
        }

        // Extract channel info from meta, data, or dedicated endpoint
        const channelMeta =
          (videosRes as any)?.meta?.channel ||
          (videosRes?.data as any)?.channel ||
          channelRes?.data;

        if (channelMeta && isMounted) {
          setChannel((prev) => ({
            ...prev,
            ...channelMeta,
            url: channelMeta.url || `https://www.youtube.com/${channelMeta.handle || "@ipssbp"}`,
          }));
        }

        const rawList = unwrapCollection<any>(response);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped: VideoItem[] = rawList
            .filter((item: any) => {
              const isYt =
                item.isYouTube ||
                item.id?.startsWith("yt-") ||
                String(item.mimeType || "").includes("youtube");
              const hasYtUrl = Array.isArray(item.fileUrl)
                ? item.fileUrl.some(
                    (u: string) =>
                      String(u).includes("youtube.com") || String(u).includes("youtu.be"),
                  )
                : typeof item.url === "string" &&
                  (item.url.includes("youtube.com") || item.url.includes("youtu.be"));
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
          }
        } else {
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

  // Sorted list: latest videos first
  const sortedVideos = useMemo(() => {
    const list = [...videos];
    list.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
    return list;
  }, [videos]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(sortedVideos.length / ITEMS_PER_PAGE));
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedVideos.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedVideos, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Generate page numbers with ellipses
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

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
      <section className="relative overflow-hidden bg-navy-950 py-10 text-white sm:py-14">
        <div className="container-page relative z-10">
          {/* Breadcrumbs Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide sm:text-sm text-white/70"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="text-white/30">/</span>
            <Link href="/gallery" className="transition-colors hover:text-white">
              Gallery
            </Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Videos</span>
          </nav>

          {/* Title and Top Channel Controls */}
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-0.5 text-xs font-bold tracking-wider text-red-400 uppercase">
                <Youtube className="size-3.5 text-red-500" />
                <span>YouTube Channel</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl font-[var(--font-display)]">
                School Video Gallery
              </h1>
              <p className="text-sm text-white/75 sm:text-base">
                Watch school events, annual celebrations, sports tournaments, and learning moments broadcasted directly from our official YouTube channel.
              </p>
            </div>

            {/* Outside Subscribe & View Channel Controls */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <a
                href={`${channel.url}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:bg-red-700 hover:scale-105 active:scale-95"
              >
                <Youtube className="size-4 fill-white" />
                <span>Subscribe</span>
              </a>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                <span>View Channel</span>
                <ExternalLink className="size-3.5" />
              </a>
              <Link
                href="/gallery/album"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ImageIcon className="size-3.5" />
                <span>Photos</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section ref={gridTopRef} className="container-page mt-8 space-y-6">
        {/* Simple Header Bar: Count & Page info */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              All Videos
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {sortedVideos.length}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </div>
        </div>

        {/* Video Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading YouTube Channel Videos...
            </p>
          </div>
        ) : paginatedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Film className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">
              No videos available
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              There are currently no videos available from the channel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedVideos.map((video, index) => {
              return (
                <motion.article
                  key={video.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: EASE }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs transition-all hover:border-red-500/50 hover:shadow-md"
                >
                  {/* Clean Video Thumbnail Frame */}
                  <div
                    onClick={() => setActiveModalVideo(video)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-neutral-900"
                  >
                    {video.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.poster}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                    ) : null}

                    {/* Subtle Darkening Overlay on hover */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    {/* Simple Play Icon Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-red-600">
                        <Play className="size-5 translate-x-0.5 fill-current" />
                      </div>
                    </div>

                    {/* Simple Duration Badge (bottom-right only) */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium text-white tracking-wide">
                          {video.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Simple Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                    <div className="space-y-1.5">
                      {video.category && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                          {video.category}
                        </span>
                      )}
                      <h3
                        onClick={() => setActiveModalVideo(video)}
                        className="cursor-pointer text-sm sm:text-base font-bold text-foreground transition-colors hover:text-red-600 line-clamp-2 leading-snug"
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

                    {/* Simple Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                      {video.date ? (
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="size-3 text-muted-foreground/70" />
                          {new Date(video.date).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-[11px]">Indian Public School</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(video)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title="Share"
                        >
                          {copiedId === video.id ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="size-3.5" />
                          )}
                        </button>

                        <a
                          href={video.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600 transition-colors"
                          title="Open on YouTube"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => setActiveModalVideo(video)}
                          className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer ml-1"
                        >
                          <span>Watch</span>
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedVideos.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {sortedVideos.length}
              </span>{" "}
              videos
            </p>

            <nav aria-label="Pagination" className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                  currentPage === 1
                    ? "pointer-events-none opacity-40 text-muted-foreground"
                    : "hover:bg-muted text-foreground cursor-pointer"
                )}
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </button>

              {/* Numbered Pages */}
              {pageNumbers.map((page, idx) => {
                if (page === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-xs text-muted-foreground select-none"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = Number(page);
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-red-600 text-white shadow-xs"
                        : "border border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                  currentPage === totalPages
                    ? "pointer-events-none opacity-40 text-muted-foreground"
                    : "hover:bg-muted text-foreground cursor-pointer"
                )}
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </nav>
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
                      <span>YouTube</span>
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

              {/* Modal Footer with metadata */}
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

                <a
                  href={activeModalVideo.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
