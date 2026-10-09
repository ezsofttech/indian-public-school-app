"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { cn } from "@/lib/utils";
import { homeData, imageUrls, imageUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";

type Category = "Campus" | "Events" | "Sports" | "Activities" | "Hostel" | "Arts";

const CATEGORIES: ("All" | Category)[] = ["All", "Campus", "Events", "Sports", "Activities", "Hostel", "Arts"];

interface AlbumImage {
  src: string;
  alt: string;
  category: Category | "Banners";
  album: string;
  directory?: string;
  directoryName?: string;
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

  return forbiddenSubstrings.some((term) => lower.includes(term)) && !lower.includes("campus");
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
  if (["Campus", "Events", "Sports", "Activities", "Hostel", "Arts"].includes(t)) {
    return t as Category;
  }
  const lower = t.toLowerCase();
  if (lower.includes("sports") || lower.includes("winner")) return "Sports";
  if (
    lower.includes("activity") ||
    lower.includes("skill") ||
    lower.includes("experiential") ||
    lower.includes("training") ||
    lower.includes("trip") ||
    lower.includes("speech") ||
    lower.includes("competition") ||
    lower.includes("empowerment")
  ) {
    return "Activities";
  }
  if (lower.includes("hostel")) return "Hostel";
  if (lower.includes("art") || lower.includes("cultural")) return "Arts";
  if (lower.includes("campus") || lower.includes("partner")) return "Campus";
  return "Events";
}



export function Gallery() {
  const siteData = useSiteData();
  const home = homeData(siteData);

  const [extraApiImages, setExtraApiImages] = useState<AlbumImage[]>([]);

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
            };
          })
          .filter((img) => img.src && !isStaffStudentOrPressUrl(img.src));

        if (isMounted) {
          setExtraApiImages([...fetchedFromDb, ...fetchedFromCdn]);
        }
      } catch (err) {
        console.error("Failed to load live gallery API images:", err);
      }
    };

    fetchLiveGallery();
    return () => {
      isMounted = false;
    };
  }, []);

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
          }));
      });

    const bannerObj = (home.banner as Record<string, unknown>) ?? {};
    const bannerUrls = Array.isArray(bannerObj.fileUrls) ? bannerObj.fileUrls : [];
    const bannerMapped: AlbumImage[] = bannerUrls
      .map((file, idx) => ({
        src: imageUrl(file),
        alt: `School Banner Image ${idx + 1}`,
        category: "Campus" as Category,
        album: "Hero Campus Banners",
        directory: "/album/campus",
        directoryName: "/album/campus",
      }))
      .filter((img) => img.src && !isStaffStudentOrPressUrl(img.src));

    return [...galleryMapped, ...bannerMapped];
  }, [siteData, home]);

  // Combined & deduplicated album images
  const allAlbumImages = useMemo(() => {
    const combined = [...extraApiImages, ...datasourceImages];
    const seen = new Set<string>();
    const uniqueList: AlbumImage[] = [];

    for (const img of combined) {
      if (!img.src || isStaffStudentOrPressUrl(img.src)) continue;

      // Strictly filter for album images matching /gallery-album logic
      const dirPath = (img.directoryName || img.directory || "").toLowerCase().trim();
      const isForbiddenFolder =
        dirPath.includes("/staff") ||
        dirPath.includes("/press") ||
        dirPath.includes("/documents") ||
        dirPath.includes("/logos");

      if (isForbiddenFolder) continue;

      const isExplicitAlbum = dirPath.startsWith("/album/") || dirPath.includes("/album");
      const isAlbumCategory = ["Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Banners"].includes(img.category);

      if (!isExplicitAlbum && !isAlbumCategory) continue;

      if (seen.has(img.src)) continue;
      seen.add(img.src);
      uniqueList.push(img);
    }
    return uniqueList;
  }, [extraApiImages, datasourceImages]);

  const [active, setActive] = useState<Category | "All">("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const shownAll = useMemo(
    () => allAlbumImages.filter((i) => active === "All" || i.category === active),
    [active, allAlbumImages],
  );

  // Show a preview subset (max 9 images) on homepage, as user specified "not need to show all"
  const homepageShown = useMemo(() => shownAll.slice(0, 9), [shownAll]);

  return (
    <section id="gallery" className="py-20 lg:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Gallery"
          title="Moments from around the school"
          description="A glimpse of campus, classrooms, competitions and celebrations through the year."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active === c ? "text-primary-foreground" : "text-foreground hover:bg-secondary",
              )}
            >
              {active === c ? (
                <motion.span
                  layoutId="gallery-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ duration: 0.4, ease: EASE }}
                />
              ) : null}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {homepageShown.map((img, i) => (
              <motion.button
                key={`${img.src}-${i}`}
                layout
                type="button"
                onClick={() => setLightbox(homepageShown.indexOf(img))}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.03 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/50">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute top-3 left-3 rounded-lg bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                    {img.category}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <h3 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary">
                    {img.alt}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">
                    Album: {img.album}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href={active !== "All" ? `/album/${encodeURIComponent(active.toLowerCase())}` : "/gallery-album"}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span>{active !== "All" ? `Explore ${active} Photo Albums` : "Explore All Photo Albums"}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && homepageShown[lightbox] ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-navy-deep/90 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              src={homepageShown[lightbox].src}
              alt={homepageShown[lightbox].alt}
              className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-lift"
            />
            <button
              type="button"
              aria-label="Close image"
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 grid size-11 place-items-center rounded-full border border-navy-foreground/30 text-navy-foreground transition-colors hover:bg-navy-foreground/15"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

