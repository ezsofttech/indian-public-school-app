"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Video,
  Play,
  X,
  Grid,
  Tv,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Film,
} from "lucide-react";
import { cn, getAssetUrl } from "@/lib/utils";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";
import { UniversalMedia, detectMediaType } from "@/components/ui/UniversalMedia";
import { EASE } from "@/lib/motion-presets";

export interface VideoItem {
  id: string;
  src: string;
  title: string;
  category: string;
  directory?: string;
  description?: string;
  poster?: string;
  date?: string;
  source: "database" | "cloudinary" | "datasource";
  isFeatured?: boolean;
}

const VIDEO_CATEGORIES = [
  "All",
  "Campus & Tour",
  "Events & Celebrations",
  "Sports & Activities",
  "Academics & Learning",
  "Hostel & Student Life",
] as const;

type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim().toLowerCase().split("?")[0].split("#")[0];
  if (
    clean.includes("youtube.com") ||
    clean.includes("youtu.be") ||
    clean.includes("vimeo.com")
  ) {
    return true;
  }
  if (
    /\.(mp4|webm|ogv|mkv|mov|avi|flv|m4v)$/i.test(clean) ||
    url.toLowerCase().includes("/video/upload/") ||
    url.toLowerCase().includes("resource_type=video")
  ) {
    return true;
  }
  return false;
}

function mapVideoToCategory(rawType?: string, title?: string, dir?: string): string {
  const combined = `${rawType || ""} ${title || ""} ${dir || ""}`.toLowerCase();

  if (
    combined.includes("sport") ||
    combined.includes("game") ||
    combined.includes("race") ||
    combined.includes("match") ||
    combined.includes("activity") ||
    combined.includes("activities") ||
    combined.includes("dance") ||
    combined.includes("yoga") ||
    combined.includes("karate")
  ) {
    return "Sports & Activities";
  }

  if (
    combined.includes("event") ||
    combined.includes("celebration") ||
    combined.includes("annual") ||
    combined.includes("day") ||
    combined.includes("republic") ||
    combined.includes("independence") ||
    combined.includes("fest") ||
    combined.includes("award")
  ) {
    return "Events & Celebrations";
  }

  if (
    combined.includes("hostel") ||
    combined.includes("mess") ||
    combined.includes("dorm") ||
    combined.includes("student life") ||
    combined.includes("house")
  ) {
    return "Hostel & Student Life";
  }

  if (
    combined.includes("academic") ||
    combined.includes("science") ||
    combined.includes("class") ||
    combined.includes("lab") ||
    combined.includes("exhibition") ||
    combined.includes("learning") ||
    combined.includes("robotics")
  ) {
    return "Academics & Learning";
  }

  return "";
}

function formatVideoTitle(rawName?: string, fallback = "Campus Video"): string {
  if (!rawName) return fallback;
  let str = String(rawName).trim();
  // Strip file extensions if present
  str = str.replace(/\.(mp4|webm|mov|mkv|avi)$/i, "");
  str = str.replace(/[-_]/g, " ");
  str = str.replace(/\b\w/g, (c) => c.toUpperCase());
  return str || fallback;
}

export function GalleryVideosClient() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "theater">("grid");
  const [activeModalVideo, setActiveModalVideo] = useState<VideoItem | null>(null);
  const [theaterSelectedVideo, setTheaterSelectedVideo] = useState<VideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch live videos from admin API (/gallery)
  useEffect(() => {
    let isMounted = true;
    const fetchLiveVideos = async () => {
      try {
        const galleryRes = await getOptionalApi<any>("/gallery?limit=500");
        const dbItems = unwrapCollection<any>(galleryRes);

        const fetchedDb: VideoItem[] = (Array.isArray(dbItems) ? dbItems : [])
          .flatMap((item: any) => {
            const isVidItem =
              String(item.mimeType || "").toLowerCase().includes("video") ||
              String(item.directory || "").toLowerCase().includes("video") ||
              String(item.eventType || "").toLowerCase().includes("video");

            const urls: string[] = Array.isArray(item.fileUrl)
              ? item.fileUrl
              : typeof item.fileUrl === "string" && item.fileUrl.trim()
                ? [item.fileUrl]
                : [];

            return urls
              .filter((u: string) => isVidItem || isVideoUrl(u))
              .map((u: string, idx: number) => {
                const title = formatVideoTitle(
                  item.eventName || item.title,
                  "Campus Video"
                );
                return {
                  id: String(item._id || item.publicId || `db-vid-${idx}-${u}`),
                  src: u,
                  title,
                  category: mapVideoToCategory(item.eventType, title, item.directory),
                  directory: item.directory || "/album/videos",
                  date: item.createdAt || item.updatedAt,
                  source: "database" as const,
                };
              });
          });

        if (isMounted) {
          setVideos(fetchedDb);
        }
      } catch (err) {
        console.error("Failed to load video gallery items:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  const allVideos = videos;

  // Sorted videos
  const filteredVideos = useMemo(() => {
    const result = [...allVideos];

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
      // default: newest
      return (b.date || "").localeCompare(a.date || "");
    });

    return result;
  }, [allVideos, sortBy]);

  // Featured video selection
  const featuredVideo = useMemo(() => {
    return allVideos.find((v) => v.isFeatured) || allVideos[0] || null;
  }, [allVideos]);

  // Current theater video
  const activeTheaterVideo = theaterSelectedVideo || featuredVideo;

  // Handle share / copy link
  const handleCopyLink = (video: VideoItem) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-[var(--gold)] selection:text-navy-950">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-deep to-navy-950 py-16 text-white sm:py-20 lg:py-24">
        {/* Ambient glowing background accents */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[var(--gold)] blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[var(--gold)] uppercase backdrop-blur-sm">
                <Video className="size-3.5 animate-pulse" />
                <span>Video Gallery & Campus Glimpses</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md font-[var(--font-display)]">
                School Life in Motion
              </h1>
              <p className="text-base text-white/80 sm:text-lg">
                Explore our rich collection of campus tours, annual functions, sports events,
                classroom learning moments, and celebrations at Indian Public School.
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
              <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-bold tracking-wide text-navy-950 shadow-sm">
                <Video className="size-4" />
                <span>Videos ({allVideos.length})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container-page mt-8 space-y-8">
        {/* Sleek Toolbar: Title, Count, Sort, and View Mode */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between text-card-foreground">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Film className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-foreground sm:text-lg font-[var(--font-display)]">
                  All Campus Videos
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {allVideos.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Browse our collection of campus tours, events, and school moments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] cursor-pointer"
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
                        <span className="rounded-full bg-[var(--gold)]/20 px-3 py-1 text-xs font-bold text-[var(--gold)] border border-[var(--gold)]/30">
                          {activeTheaterVideo.category}
                        </span>
                      ) : null}
                      {activeTheaterVideo.isFeatured && (
                        <span className="rounded-full bg-[var(--gold)]/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-400/30">
                          Featured Video
                        </span>
                      )}
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
                        href={getAssetUrl(activeTheaterVideo.src)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        title="Download Video File"
                      >
                        <Download className="size-3.5" />
                        <span>Download</span>
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
                  <h3 className="text-sm font-semibold tracking-wider text-white/90 uppercase">
                    Playlist ({filteredVideos.length})
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
                          "w-full text-left flex items-start gap-3 rounded-xl p-2.5 transition-all",
                          isSelected
                            ? "bg-white/15 border border-[var(--gold)]/40 text-white"
                            : "hover:bg-white/5 text-white/70 hover:text-white"
                        )}
                      >
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-black border border-white/10 flex items-center justify-center">
                          <Play
                            className={cn(
                              "size-5 transition-transform",
                              isSelected
                                ? "text-[var(--gold)] scale-110"
                                : "text-white/60"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          {vid.category ? (
                            <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--gold)]">
                              {vid.category}
                            </span>
                          ) : null}
                          <h4 className="truncate text-xs font-semibold leading-snug">
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
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Film className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No videos available</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              There are currently no videos available in the gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video, index) => {
              return (
                <motion.article
                  key={video.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: EASE }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:border-[var(--gold)]/40 hover:shadow-lg"
                >
                  {/* Video Thumbnail / Preview Container */}
                  <div
                    onClick={() => setActiveModalVideo(video)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-navy-950 flex items-center justify-center"
                  >
                    {/* Background visual placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                    {/* Featured badge top left */}
                    {video.isFeatured && (
                      <div className="absolute top-3 left-3 z-10 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[11px] font-bold text-navy-950 shadow-sm">
                        Featured
                      </div>
                    )}

                    {/* Center Animated Play Button */}
                    <div className="relative z-10 flex size-14 items-center justify-center rounded-full bg-[var(--gold)] text-navy-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="size-6 translate-x-0.5 fill-current" />
                    </div>

                    {video.category ? (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                          {video.category}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Content Details */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      <h3
                        onClick={() => setActiveModalVideo(video)}
                        className="cursor-pointer text-base font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2"
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
                        <button
                          type="button"
                          onClick={() => handleCopyLink(video)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === video.id ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModalVideo(video)}
                          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          <span>Watch</span>
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
                  <span className="text-[10px] font-bold tracking-wider text-[var(--gold)] uppercase">
                    {activeModalVideo.category}
                  </span>
                  <h3 className="truncate text-base font-bold text-white sm:text-lg">
                    {activeModalVideo.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeModalVideo)}
                    className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    title="Copy Link"
                  >
                    {copiedId === activeModalVideo.id ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </button>
                  <a
                    href={getAssetUrl(activeModalVideo.src)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    title="Download Video File"
                  >
                    <Download className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveModalVideo(null)}
                    className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
