"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Search,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Newspaper,
  Calendar,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { EASE } from "@/lib/motion-presets";
import { cn, getAssetUrl } from "@/lib/utils";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export interface PressReleaseImage {
  src: string;
  alt: string;
  title: string;
  date?: string;
  source?: "database" | "cloudinary" | "static";
}

const STATIC_PRESS_RELEASE_IMAGES: PressReleaseImage[] = Array.from({ length: 25 }, (_, i) => {
  const index = i + 1;
  const ext = index === 2 ? "png" : "jpg";
  return {
    src: `/PressRelease/PRESS_${index}.${ext}`,
    alt: `Press Release Media Clipping ${index}`,
    title: `Official Press Release Media Feature #${index}`,
    date: "2024-05-15",
    source: "static",
  };
});

function cleanTitle(raw: string): string {
  if (!raw) return "Press Release Clipping";
  const name = raw.split("/").pop() || raw;
  const noExt = name.replace(/\.(jpg|jpeg|png|webp|svg|pdf)$/i, "");
  const stripped = noExt.replace(/^\d+/, "").replace(/^[_ -]+/, "");
  if (!stripped || stripped.length < 3) {
    return "Press Release Media Clipping";
  }
  return stripped
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PressReleaseClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [extraApiImages, setExtraApiImages] = useState<PressReleaseImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;

  useEffect(() => {
    let isMounted = true;
    const fetchLivePressReleaseImages = async () => {
      try {
        const directoryPath = encodeURIComponent("indian-public-school/assets/PressRelease");
        const [dirGalleryRes, cdnRes] = await Promise.all([
          getOptionalApi<any>(`/gallery?page=1&limit=500&sortBy=createdAt&sortOrder=desc&directory=${directoryPath}`),
          getOptionalApi<any>("/uploads/cloudinary-resources"),
        ]);

        const dirItems = unwrapCollection<any>(dirGalleryRes);

        const fetchedFromDb: PressReleaseImage[] = (Array.isArray(dirItems) ? dirItems : []).flatMap((item: any) => {
          const rawTitle = text(item.eventName || item.title, "Press Release Media");
          const formattedTitle = cleanTitle(rawTitle);
          const urls = Array.isArray(item.fileUrl)
            ? item.fileUrl
            : typeof item.fileUrl === "string" && item.fileUrl.trim()
            ? [item.fileUrl]
            : [];
          return urls.map((u: string) => ({
            src: u,
            alt: formattedTitle,
            title: formattedTitle,
            date: item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : undefined,
            source: "database" as const,
          }));
        });

        if (isMounted) {
          setExtraApiImages(fetchedFromDb);
        }
      } catch (err) {
        console.error("Failed to fetch live press release images:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLivePressReleaseImages();
    return () => {
      isMounted = false;
    };
  }, []);

  const allImages = useMemo(() => {
    const list = extraApiImages.length ? extraApiImages : STATIC_PRESS_RELEASE_IMAGES;
    return list;
  }, [extraApiImages]);

  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allImages;

    return allImages.filter(
      (img) =>
        img.title.toLowerCase().includes(query) ||
        img.alt.toLowerCase().includes(query) ||
        (img.date && img.date.includes(query))
    );
  }, [allImages, searchQuery]);

  const totalPages = Math.ceil(filteredImages.length / pageSize) || 1;
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredImages.slice(start, start + pageSize);
  }, [filteredImages, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const currentLightboxImage =
    lightboxIndex !== null && filteredImages[lightboxIndex]
      ? filteredImages[lightboxIndex]
      : null;

  const handlePrevLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1));
  };

  const handleNextLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") handlePrevLightbox();
      if (e.key === "ArrowRight") handleNextLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredImages]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col font-sans">
      {/* Hero Header */}
      <section
        className="relative overflow-hidden py-12 sm:py-16 text-navy-foreground border-b border-[var(--gold)]/30 shadow-2xl"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="container-page relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-2 border border-[var(--gold)]/40 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white/90 backdrop-blur-md mb-6 shadow-md"
            style={{ borderRadius: "var(--badge-radius, 9999px)" }}
          >
            <GraduationCap className="size-4 text-[var(--gold)] shrink-0 mr-1" />
            <Link href="/" className="hover:text-[var(--gold)] transition-colors text-white/80">
              Home
            </Link>
            <span className="text-[var(--gold)] font-bold">*</span>
            <span className="text-[var(--gold)] font-bold drop-shadow">Press Release</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span
                className="inline-flex items-center gap-1.5 bg-[var(--gold)]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--gold)] border border-[var(--gold)]/40"
                style={{ borderRadius: "var(--badge-radius, 9999px)" }}
              >
                <Newspaper className="size-3.5" /> Official Media Archives
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md font-[var(--font-display)]">
                Press Releases & Media Coverage
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                Explore our official press clippings, newspaper publications, academic merit announcements, and media honors inside <code className="text-[var(--gold)] bg-black/30 px-1.5 py-0.5 rounded border border-[var(--gold)]/30">assets/PressRelease</code>.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search press releases..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 text-white placeholder:text-slate-300 text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 backdrop-blur-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container-page max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-16 flex-1">
        {/* Results Info Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{filteredImages.length}</strong> press release media item{filteredImages.length !== 1 ? "s" : ""}
            </span>
          </div>
          {totalPages > 1 && (
            <span>
              Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </span>
          )}
        </div>

        {/* Media Grid */}
        {filteredImages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-12 text-center my-12 shadow-sm">
            <ImageIcon className="mx-auto size-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No press release images found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              No press releases match your search query &quot;{searchQuery}&quot;. Try resetting your search filter.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-5 rounded-lg bg-gold/20 px-4 py-2 text-xs font-bold text-amber-500 border border-gold/40 hover:bg-gold/30 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedImages.map((img, idx) => {
              const globalIdx = (currentPage - 1) * pageSize + idx;
              return (
                <motion.article
                  key={`${img.src}-${globalIdx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: (idx % 6) * 0.05 }}
                  onClick={() => setLightboxIndex(globalIdx)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
                    <img
                      src={getAssetUrl(img.src)}
                      alt={img.alt}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="absolute right-3 top-3 rounded-full bg-slate-900/80 p-2 text-gold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="size-4" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2 bg-card text-card-foreground">
                    <div className="flex items-center justify-between text-xs text-amber-500 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Newspaper className="size-3" /> Press Release
                      </span>
                      {img.date && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                          <Calendar className="size-3" /> {img.date}
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                      {img.title}
                    </h3>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-gold/50 hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "size-9 rounded-xl text-sm font-semibold transition-all",
                    page === currentPage
                      ? "bg-gold text-slate-950 shadow-md shadow-gold/20"
                      : "bg-card border border-border text-foreground hover:bg-secondary"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-gold/50 hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {currentLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-5 top-5 z-50 rounded-full bg-slate-800/80 p-3 text-slate-200 transition-all hover:bg-red-500 hover:text-white"
              aria-label="Close Preview"
            >
              <X className="size-6" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrevLightbox}
              className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-slate-900/80 p-3 text-slate-200 transition-all hover:bg-gold hover:text-slate-950 shadow-xl"
              aria-label="Previous Image"
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              onClick={handleNextLightbox}
              className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-slate-900/80 p-3 text-slate-200 transition-all hover:bg-gold hover:text-slate-950 shadow-xl"
              aria-label="Next Image"
            >
              <ChevronRight className="size-6" />
            </button>

            {/* Modal Body */}
            <div className="relative flex max-h-[90vh] max-w-5xl flex-col items-center justify-center p-2">
              <motion.img
                key={currentLightboxImage.src}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={getAssetUrl(currentLightboxImage.src)}
                alt={currentLightboxImage.alt}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
              />

              <div className="mt-4 text-center max-w-2xl space-y-2">
                <h2 className="text-lg font-bold text-white sm:text-xl drop-shadow">
                  {currentLightboxImage.title}
                </h2>
                {currentLightboxImage.date && (
                  <p className="text-xs text-gold/90 font-medium">
                    Published: {currentLightboxImage.date}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-center gap-3">
                  <a
                    href={getAssetUrl(currentLightboxImage.src)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 transition-all"
                  >
                    <Download className="size-4" /> Download Press Clipping
                  </a>
                  <a
                    href={getAssetUrl(currentLightboxImage.src)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
                  >
                    <ExternalLink className="size-4" /> Open Original Image
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
