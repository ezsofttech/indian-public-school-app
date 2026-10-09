"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X, Search, Image as ImageIcon, ChevronLeft, ChevronRight, Download, ExternalLink, Filter, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { EASE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { homeData, imageUrls, imageUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";
import { UniversalMedia, detectMediaType } from "@/components/ui/UniversalMedia";

type Category = "All" | "Campus" | "Events" | "Sports" | "Activities" | "Hostel" | "Arts" | "Banners";

const CATEGORIES: Category[] = ["All", "Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Banners"];

interface AlbumImage {
  src: string;
  alt: string;
  category: Category;
  album: string;
  directory?: string;
  directoryName?: string;
  date?: string;
  source?: "database" | "cloudinary" | "datasource";
}

const FORBIDDEN_TERMS = [
  "staff",
  "staffs",
  "teacher",
  "teachers",
  "faculty",
  "student",
  "students",
  "profile",
  "profiles",
  "avatar",
  "avatars",
  "press",
  "pressrelease",
  "press-release",
  "press_release",
  "news release",
  "media release",
  "press_doc",
  "setting",
  "settings",
  "school-settings",
  "school_settings",
  "assets/settings",
  "assets/Settings",
  "review",
  "reviews",
  "album/reviews",
];

function isStaffStudentOrPressItem(item: Record<string, unknown>): boolean {
  if (!item) return false;
  const type = String(item.eventType || item.type || item.directory || "").toLowerCase().trim();
  const name = String(item.eventName || item.title || item.name || item.album || "").toLowerCase().trim();
  const cat = String(item.category || "").toLowerCase().trim();
  const tags = Array.isArray(item.tags)
    ? item.tags.map((t) => String(t).toLowerCase())
    : [String(item.tags || "").toLowerCase()];

  if (FORBIDDEN_TERMS.some((term) => type === term || type.includes(`${term}_`) || type.includes(`_${term}`) || type.includes(term))) {
    return true;
  }
  if (FORBIDDEN_TERMS.some((term) => cat === term || cat.includes(term))) return true;
  if (FORBIDDEN_TERMS.some((term) => tags.some((tag) => tag.includes(term)))) return true;
  if (
    name.includes("staff photo") ||
    name.includes("student photo") ||
    name.includes("staff profile") ||
    name.includes("student profile") ||
    name.includes("press release") ||
    name.includes("press document") ||
    name.includes("setting") ||
    name.includes("review")
  ) {
    return true;
  }
  return false;
}

function isStaffStudentOrPressUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();

  // Exclude non-image file extensions if any
  if (lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx") || lower.endsWith(".mp4")) {
    return true;
  }

  const forbiddenSubstrings = [
    "/staff/",
    "/staffs/",
    "/student/",
    "/students/",
    "/profiles/",
    "/avatars/",
    "/press/",
    "/pressrelease/",
    "/settings/",
    "/Settings/",
    "/assets/settings/",
    "/assets/Settings/",
    "/review/",
    "/reviews/",
    "/assets/review/",
    "/assets/Review/",
    "staff_photo",
    "student_photo",
    "staff-photo",
    "student-photo",
    "staff_profile",
    "student_profile",
    "press_release",
    "press-release",
    "pressrelease",
    "press_doc",
    "press-doc",
    "review",
    "review_1",
    "review_2",
    "review_3",
    "logo",
    "favicon",
  ];

  const containsForbidden = forbiddenSubstrings.some((sub) => lower.includes(sub));
  if (containsForbidden && !lower.includes("campus") && !lower.includes("building")) {
    return true;
  }
  return false;
}

function formatEventTitle(rawName?: string, fallbackType?: string): string {
  const str = String(rawName || "").trim();
  if (
    !str ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|pdf|mp4)$/i.test(str) ||
    /^upload-\d+$/i.test(str) ||
    /^cdn-\d+$/i.test(str) ||
    str.toLowerCase().startsWith("facility-") ||
    str.toLowerCase().startsWith("banner_") ||
    str.toLowerCase().startsWith("hero-")
  ) {
    return String(fallbackType || "School Album").trim();
  }
  return text(str, fallbackType || "School Album");
}

function mapEventTypeToCategory(rawType: unknown): Category {
  const t = text(rawType, "Campus").trim();
  if (t.startsWith("/album/")) {
    const folder = t.replace(/^\/album\//i, "").trim();
    const matched = CATEGORIES.find((c) => c.toLowerCase() === folder.toLowerCase());
    if (matched && matched !== "All") return matched as Category;
  }
  if (["Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Banners"].includes(t)) {
    return t as Category;
  }
  const lower = t.toLowerCase();
  if (lower.includes("banner") || lower.includes("hero")) return "Banners";
  if (lower.includes("sports") || lower.includes("winner")) return "Sports";
  if (
    lower.includes("activity") ||
    lower.includes("skill") ||
    lower.includes("experiential") ||
    lower.includes("training") ||
    lower.includes("trip") ||
    lower.includes("speech")
  ) {
    return "Activities";
  }
  if (lower.includes("hostel")) return "Hostel";
  if (lower.includes("art") || lower.includes("cultural")) return "Arts";
  if (lower.includes("campus") || lower.includes("infra")) return "Campus";
  return "Events";
}



interface GalleryAlbumClientProps {
  mode?: "everything" | "album";
  initialCategoryName?: string;
  initialAlbum?: string;
}

export function GalleryAlbumClient({
  mode = "everything",
  initialCategoryName,
  initialAlbum,
}: GalleryAlbumClientProps) {
  const siteData = useSiteData();
  const home = homeData(siteData);
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [extraApiImages, setExtraApiImages] = useState<AlbumImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Sync category filter from URL query parameter or path prop (e.g. /album/Campus or /gallery-album?category=Campus)
  useEffect(() => {
    const rawParam =
      initialCategoryName ||
      searchParams.get("category") ||
      searchParams.get("dir") ||
      searchParams.get("directory") ||
      searchParams.get("album") ||
      "";
    if (rawParam) {
      const cleaned = rawParam.replace(/^\/album\//i, "").trim();
      const matched = CATEGORIES.find((c) => c.toLowerCase() === cleaned.toLowerCase());
      if (matched) {
        setActiveCategory(matched);
      }
    }
  }, [searchParams, initialCategoryName]);

  // Fetch live API gallery items & Cloudinary resources
  useEffect(() => {
    let isMounted = true;
    const fetchLiveGallery = async () => {
      try {
        const [galleryRes, cdnRes] = await Promise.all([
          getOptionalApi<any>("/gallery?limit=500"),
          getOptionalApi<any>("/uploads/cloudinary-resources"),
        ]);

        const dbItems = unwrapCollection<any>(galleryRes);
        const cdnItems = unwrapCollection<any>(cdnRes);

        const fetchedFromDb: AlbumImage[] = (Array.isArray(dbItems) ? dbItems : [])
          .filter((item) => !isStaffStudentOrPressItem(item))
          .flatMap((item: any) => {
            const cat = mapEventTypeToCategory(item.eventType || item.category || item.directory);
            const albumName = formatEventTitle(item.eventName || item.title || item.album, item.eventType || cat);
            const dir = String(item.directoryName || item.directory || "").trim() || `/album/${cat.toLowerCase()}`;
            const urls = Array.isArray(item.fileUrl)
              ? item.fileUrl
              : typeof item.fileUrl === "string" && item.fileUrl.trim()
                ? [item.fileUrl]
                : [];
            return urls
              .filter((u: string) => !isStaffStudentOrPressUrl(u))
              .map((u: string) => ({
                src: u,
                alt: albumName,
                category: cat,
                album: albumName,
                directory: dir,
                directoryName: dir,
                source: "database" as const,
              }));
          });

        const fetchedFromCdn: AlbumImage[] = (Array.isArray(cdnItems) ? cdnItems : [])
          .filter((item) => !isStaffStudentOrPressItem(item))
          .map((item: any) => {
            const url = item.secure_url || item.url || item.fileUrl || "";
            const cat = mapEventTypeToCategory(item.folder || item.category);
            const folderStr = String(item.folder || item.category || "general").toLowerCase();
            const dir = folderStr.startsWith("/album/") ? folderStr : `/album/${folderStr}`;
            const rawTitle = item.public_id ? item.public_id.split("/").pop() || "" : "";
            const title = formatEventTitle(rawTitle, item.folder || item.category || cat);
            return {
              src: url,
              alt: title,
              category: cat,
              album: item.folder || "Cloudinary Album",
              directory: dir,
              directoryName: dir,
              source: "cloudinary" as const,
            };
          })
          .filter((img) => img.src && !isStaffStudentOrPressUrl(img.src));

        if (isMounted) {
          setExtraApiImages([...fetchedFromDb, ...fetchedFromCdn]);
        }
      } catch (err) {
        console.error("Failed to load live gallery API images:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Base gallery images from siteData (cloud-datasource fallback)
  const datasourceImages = useMemo(() => {
    const rawGallery = siteData.galleryItems?.length ? siteData.galleryItems : (home.gallery as Record<string, unknown>[]);
    const list = Array.isArray(rawGallery) ? (rawGallery as Record<string, unknown>[]) : [];

    const galleryMapped = list
      .filter((item) => !isStaffStudentOrPressItem(item))
      .flatMap((item) => {
        const cat = mapEventTypeToCategory(item.eventType);
        const eventName = text(item.eventName, "Campus Photo");
        const dir = String(item.directoryName || item.directory || "").trim() || `/album/${cat.toLowerCase()}`;
        return imageUrls(item)
          .filter((url) => !isStaffStudentOrPressUrl(url))
          .map((url) => ({
            src: url,
            alt: eventName,
            category: cat,
            album: text(item.album || item.eventName, "School Gallery"),
            directory: dir,
            directoryName: dir,
            source: "datasource" as const,
          }));
      });

    // Also include home banner images
    const bannerObj = (home.banner as Record<string, unknown>) ?? {};
    const bannerUrls = Array.isArray(bannerObj.fileUrls) ? bannerObj.fileUrls : [];
    const bannerMapped: AlbumImage[] = bannerUrls
      .map((file, idx) => ({
        src: imageUrl(file),
        alt: `School Banner Image ${idx + 1}`,
        category: "Banners" as Category,
        album: "Hero Campus Banners",
        directory: "/album/banners",
        directoryName: "/album/banners",
        source: "datasource" as const,
      }))
      .filter((img) => img.src && !isStaffStudentOrPressUrl(img.src));

    return [...galleryMapped, ...bannerMapped];
  }, [siteData, home]);

  // Combine and deduplicate images by image URL
  const allImages = useMemo(() => {
    const combined = [...extraApiImages, ...datasourceImages];
    const seen = new Set<string>();
    const uniqueList: AlbumImage[] = [];

    for (const img of combined) {
      if (!img.src || isStaffStudentOrPressUrl(img.src)) continue;
      if (seen.has(img.src)) continue;
      seen.add(img.src);
      uniqueList.push(img);
    }
    return uniqueList;
  }, [extraApiImages, datasourceImages]);

  const isAlbumMode = mode === "album";

  // Filtered images based on mode (/gallery-album vs /gallery), active category, and search query
  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      // On /gallery-album (mode === "album"), STRICTLY show images where directoryName / directory matches /album/*
      if (isAlbumMode) {
        const dirPath = (img.directoryName || img.directory || "").toLowerCase().trim();
        const isForbiddenFolder =
          dirPath.includes("/staff") ||
          dirPath.includes("/press") ||
          dirPath.includes("/documents") ||
          dirPath.includes("/logos");

        if (isForbiddenFolder) return false;

        const isExplicitAlbum = dirPath.startsWith("/album/") || dirPath.includes("/album");
        const isAlbumCategory = ["Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Banners"].includes(img.category);

        if (!isExplicitAlbum && !isAlbumCategory) {
          return false;
        }
      }

      const matchesCategory = activeCategory === "All" || img.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        img.alt.toLowerCase().includes(query) ||
        img.album.toLowerCase().includes(query) ||
        img.category.toLowerCase().includes(query) ||
        (img.directoryName && img.directoryName.toLowerCase().includes(query)) ||
        (img.directory && img.directory.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [allImages, activeCategory, searchQuery, isAlbumMode]);

  // Reset to page 1 whenever activeCategory, searchQuery, or mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, mode]);

  const totalItems = filteredImages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredImages.slice(start, start + pageSize);
  }, [filteredImages, currentPage, pageSize]);

  const handleNextLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % filteredImages.length);
  };

  const handlePrevLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 pt-8">
      {/* Page Header Banner */}
      <section
        className="relative overflow-hidden py-16 text-navy-foreground lg:py-20"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_50%)]" />
        <div className="container-page relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Breadcrumb */}
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-white/80">
              <Link href="/" className="hover:text-[var(--gold)] transition-colors">Home</Link>
              <span>/</span>
              <Link href="/gallery" className="hover:text-[var(--gold)] transition-colors">Gallery</Link>
              {isAlbumMode && (
                <>
                  <span>/</span>
                  <span className="text-[var(--gold)] font-semibold">Album</span>
                </>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-[var(--font-display)] text-white">
              {isAlbumMode ? (
                <>Photo Albums <span className="text-[var(--gold)]">&</span> Media Collections</>
              ) : (
                <>School Gallery <span className="text-[var(--gold)]">&</span> Photo Collections</>
              )}
            </h1>

            {/* Quick Stats Pill */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-white/90">
              <div
                className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 backdrop-blur-xs border border-white/15"
                style={{ borderRadius: "var(--badge-radius, 9999px)" }}
              >
                <ImageIcon className="size-4 text-[var(--gold)]" />
                <span>{filteredImages.length} High-Res Photos</span>
              </div>
              <div
                className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 backdrop-blur-xs border border-white/15"
                style={{ borderRadius: "var(--badge-radius, 9999px)" }}
              >
                <LayoutGrid className="size-4 text-[var(--gold)]" />
                <span>{CATEGORIES.length - 1} Categories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Controls & Content Area */}
      <section id="gallery-section" className="container-page mt-10">
        {/* Search & Categories Bar */}
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Filter className="size-3.5" />
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const count = cat === "All"
                ? filteredImages.length
                : allImages.filter((i) => {
                  if (isAlbumMode) {
                    const dirPath = (i.directoryName || i.directory || "").toLowerCase().trim();
                    if (!dirPath.startsWith("/album/")) return false;
                  }
                  return i.category === cat;
                }).length;

              if (cat !== "All" && count === 0) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "relative rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  <span>{cat}</span>
                  <span className={cn("ml-1.5 rounded-md px-1.5 py-0.5 text-[10px]", activeCategory === cat ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search albums & photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
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
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Loading high quality photo albums...</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && (
          <motion.div layout className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {paginatedImages.map((img, pageIdx) => {
                const globalIndex = (currentPage - 1) * pageSize + pageIdx;
                return (
                  <motion.div
                    key={`${img.src}-${globalIndex}`}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: EASE, delay: Math.min(pageIdx * 0.02, 0.3) }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div
                      className="relative aspect-4/3 w-full cursor-pointer overflow-hidden bg-secondary/50"
                      onClick={() => setLightboxIndex(globalIndex)}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 rounded-lg bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                        {img.category}
                      </span>

                      {/* Hover Click Action */}
                      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex size-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-xs transition-transform duration-300 group-hover:scale-110">
                          <ImageIcon className="size-5 text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Album Caption Footer */}
                    <div className="flex flex-1 flex-col justify-between p-4 bg-card text-card-foreground">
                      <div>
                        <h3 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary">
                          {img.alt}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-[11px] font-medium text-muted-foreground">
                          Album: {img.album}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination Bar */}
        {!loading && totalItems > 0 && (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-xs sm:flex-row sm:px-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing <strong className="font-semibold text-foreground">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> to{" "}
                <strong className="font-semibold text-foreground">{Math.min(currentPage * pageSize, totalItems)}</strong> of{" "}
                <strong className="font-semibold text-foreground">{totalItems}</strong> photos
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-muted-foreground">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-border bg-secondary px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  const el = document.getElementById("gallery-section");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-xs text-muted-foreground">...</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage(p);
                            const el = document.getElementById("gallery-section");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={cn(
                            "flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all",
                            currentPage === p
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border border-border bg-card text-foreground hover:bg-secondary"
                          )}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  const el = document.getElementById("gallery-section");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-slate-950/95 p-4 backdrop-blur-md"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div
              className="flex w-full max-w-6xl items-center justify-between py-2 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-400">
                  Image {lightboxIndex + 1} of {filteredImages.length}
                </span>
                <span className="text-sm font-semibold text-white">
                  {filteredImages[lightboxIndex].alt}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={filteredImages[lightboxIndex].src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/20"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Main Lightbox Content with Prev/Next Controls */}
            <div
              className="relative flex flex-1 w-full max-w-6xl items-center justify-center py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevLightbox}
                  className="absolute left-2 z-10 flex size-12 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg backdrop-blur-xs transition-transform hover:scale-110 hover:bg-primary"
                >
                  <ChevronLeft className="size-6" />
                </button>
              )}

              {/* Universal Media Lightbox Preview */}
              <div className="flex h-full w-full items-center justify-center p-2">
                <UniversalMedia
                  key={filteredImages[lightboxIndex].src}
                  src={filteredImages[lightboxIndex].src}
                  alt={filteredImages[lightboxIndex].alt}
                  title={filteredImages[lightboxIndex].alt}
                  controls
                  autoPlay
                  containerClassName="max-h-[78vh] w-auto max-w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden"
                />
              </div>


              {/* Next Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextLightbox}
                  className="absolute right-2 z-10 flex size-12 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg backdrop-blur-xs transition-transform hover:scale-110 hover:bg-primary"
                >
                  <ChevronRight className="size-6" />
                </button>
              )}
            </div>

            {/* Bottom Caption Bar */}
            <div
              className="flex w-full max-w-2xl items-center justify-between rounded-xl bg-white/10 px-5 py-3 text-center text-xs text-slate-200 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <span className="font-semibold text-gold">Category: </span>
                {filteredImages[lightboxIndex].category}
              </div>
              <div>
                <span className="font-semibold text-gold">Album: </span>
                {filteredImages[lightboxIndex].album}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
