"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/site/Reveal";
import { EASE } from "@/lib/motion-presets";
import { cn, getCanonicalAssetKey } from "@/lib/utils";
import { homeData, imageUrls, imageUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";

type Category =
  | "Campus"
  | "Events"
  | "Sports"
  | "Activities"
  | "Hostel"
  | "Arts"
  | "Infrastructure"
  | "Celebration"
  | "Academic";

const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Campus",
  "Events",
  "Sports",
  "Activities",
  "Hostel",
  "Arts",
  "Infrastructure",
  "Celebration",
  "Academic",
];

interface AlbumImage {
  src: string;
  alt: string;
  eventName?: string;
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
  "others",
  "other",
  "/others",
  "album/others",
  "assets/others",
  "visual editor",
  "visual editor picked",
  "visual-editor-picked",
  "visual_editor_picked",
  "visualeditor",
  "document",
  "documents",
  "/documents",
  "/document",
  "documents/general",
  "documents/admission",
  "documents/career",
  "documents/staff",
  "admissiondocuments",
  "admission_documents",
  "assets/documents",
  "assets/document",
  "popupbanner",
  "popup_banner",
  "popup-banner",
  "pop-up-banner",
  "album/popupbanner",
  "album/home",
  "album/news",
];

function isStaffStudentOrPressItem(item: Record<string, unknown>): boolean {
  if (!item) return false;
  const type = String(item.eventType || item.type || item.directory || "").toLowerCase().trim();
  const name = String(item.eventName || item.title || item.name || item.album || "").toLowerCase().trim();
  const cat = String(item.category || "").toLowerCase().trim();
  const dir = String(item.directoryName || item.directory || item.folder || "").toLowerCase().trim();
  const tags = Array.isArray(item.tags)
    ? item.tags.map((t) => String(t).toLowerCase())
    : [String(item.tags || "").toLowerCase()];

  if (
    dir.includes("document") ||
    type.includes("document") ||
    cat.includes("document") ||
    item.mimeType === "application/pdf"
  ) {
    return true;
  }

  const urls = Array.isArray(item.fileUrl)
    ? item.fileUrl
    : typeof item.fileUrl === "string"
      ? [item.fileUrl]
      : [];
  if (urls.some((u: any) => typeof u === "string" && (u.toLowerCase().includes("/documents/") || u.toLowerCase().includes("/document/")))) {
    return true;
  }

  if (FORBIDDEN_TERMS.some((term) =>
    type === term || type.includes(`${term}_`) || type.includes(`_${term}`) || type.includes(term) ||
    cat === term || cat.includes(term) ||
    dir === term || dir.includes(term)
  )) {
    return true;
  }
  if (FORBIDDEN_TERMS.some((term) => tags.some((tag) => tag.includes(term)))) return true;
  if (
    name.includes("staff photo") ||
    name.includes("student photo") ||
    name.includes("staff profile") ||
    name.includes("student profile") ||
    name.includes("press release") ||
    name.includes("press document") ||
    name.includes("setting") ||
    name.includes("review") ||
    name.includes("visual editor") ||
    name.includes("visual-editor") ||
    name.includes("visual_editor") ||
    name.includes("others") ||
    name.includes("document")
  ) {
    return true;
  }
  return false;
}

function isStaffStudentOrPressUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();

  // Exclude non-image file extensions if any
  if (
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".ppt") ||
    lower.endsWith(".pptx") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".zip") ||
    lower.includes(".pdf?") ||
    lower.includes(".doc?") ||
    lower.includes(".docx?")
  ) {
    return true;
  }

  if (lower.includes("/settings/icons") || lower.includes("settings/icons")) {
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
    "/others/",
    "/Others/",
    "/assets/others/",
    "/assets/Others/",
    "/documents/",
    "/Documents/",
    "/assets/documents/",
    "/assets/Documents/",
    "/document/",
    "/Document/",
    "/assets/document/",
    "/assets/Document/",
    "admissiondocuments",
    "others",
    "visual_editor",
    "visual-editor",
    "visual editor",
    "visualeditor",
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

function cleanEventTitle(rawName?: string, fallbackType?: string): string {
  let str = String(rawName || "").trim();
  if (str.includes("/")) {
    const parts = str.split("/").map((p) => p.trim()).filter(Boolean);
    str = parts[parts.length - 1] || str;
  }
  str = str.replace(/([a-z])([A-Z])/g, "$1 $2");
  str = str.replace(/[_-]+/g, " ").trim();

  if (
    !str ||
    str.toLowerCase() === "album" ||
    str.toLowerCase() === "cloudinary album" ||
    str.toLowerCase() === "school album" ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|pdf|mp4)$/i.test(str) ||
    /^upload-\d+$/i.test(str) ||
    /^cdn-\d+$/i.test(str) ||
    str.toLowerCase().startsWith("facility-") ||
    str.toLowerCase().startsWith("banner_") ||
    str.toLowerCase().startsWith("hero-") ||
    /^file_[a-z0-9]+$/i.test(str)
  ) {
    let fb = String(fallbackType || "School Event").trim();
    if (fb.includes("/")) {
      const parts = fb.split("/").map((p) => p.trim()).filter(Boolean);
      fb = parts[parts.length - 1] || fb;
    }
    fb = fb.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
    return (!fb || fb.toLowerCase() === "album") ? "School Event" : fb;
  }
  return text(str, fallbackType || "School Event");
}

function cleanAlbumName(rawAlbum?: string, rawDir?: string, fallbackCategory?: string): string {
  let albumStr = String(rawAlbum || "").trim();
  if (
    albumStr.toLowerCase() === "cloudinary album" ||
    albumStr.toLowerCase() === "album" ||
    albumStr.toLowerCase().startsWith("album/") ||
    !albumStr
  ) {
    const dir = String(rawDir || "").trim();
    if (dir.toLowerCase().includes("album")) {
      const parts = dir.replace(/^[/\\]+|[/\\]+$/g, "").split(/[/\\]+/);
      const idx = parts.findIndex((p) => p.toLowerCase() === "album");
      if (idx !== -1 && parts[idx + 1]) {
        albumStr = parts[idx + 1];
      }
    }
  }
  if (!albumStr || albumStr.toLowerCase() === "cloudinary album" || albumStr.toLowerCase() === "album") {
    albumStr = fallbackCategory || "Events";
  }
  if (albumStr.includes("/")) {
    const parts = albumStr.split("/").map((p) => p.trim()).filter(Boolean);
    albumStr = parts[parts.length - 1] || albumStr;
  }
  albumStr = albumStr.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
  return (!albumStr || albumStr.toLowerCase() === "album") ? (fallbackCategory || "Events") : albumStr;
}

function mapEventTypeToCategory(rawType: unknown): Category {
  const t = text(rawType, "Events").trim();
  const clean = t.replace(/^\/?album\/?/i, "").trim();
  const matched = CATEGORIES.find((c) => c.toLowerCase() === clean.toLowerCase());
  if (matched && matched !== "All") return matched as Category;

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
  if (lower.includes("infra")) return "Infrastructure";
  if (lower.includes("celebrat")) return "Celebration";
  if (lower.includes("academ")) return "Academic";
  if (lower.includes("campus") || lower.includes("building") || lower.includes("partner")) return "Campus";
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
          .filter((item) => {
            if (isStaffStudentOrPressItem(item)) return false;
            const dir = String(item.directoryName || item.directory || "").toLowerCase().trim();
            const alb = String(item.album || "").toLowerCase().trim();
            const src = Array.isArray(item.fileUrl) ? item.fileUrl[0] : item.fileUrl;
            const srcStr = String(src || "").toLowerCase();
            return dir.includes("album") || (alb.length > 0 && alb !== "others") || srcStr.includes("/album/");
          })
          .flatMap((item: any) => {
            const dir = String(item.directoryName || item.directory || "").trim();
            const cat = mapEventTypeToCategory(item.album || item.eventType || item.category || dir);
            const albumName = cleanAlbumName(item.album, dir, cat);
            const title = cleanEventTitle(item.eventName || item.title || albumName, cat);
            const urls = Array.isArray(item.fileUrl)
              ? item.fileUrl
              : typeof item.fileUrl === "string" && item.fileUrl.trim()
                ? [item.fileUrl]
                : [];
            return urls
              .filter((u: string) => !isStaffStudentOrPressUrl(u))
              .map((u: string) => ({
                src: u,
                alt: title,
                eventName: title,
                category: cat,
                album: albumName,
                directory: dir || `Album/${albumName}`,
                directoryName: dir || `Album/${albumName}`,
              }));
          });

        const fetchedFromCdn: AlbumImage[] = (Array.isArray(cdnItems) ? cdnItems : [])
          .filter((item) => {
            if (isStaffStudentOrPressItem(item)) return false;
            const folderStr = String(item.folder || item.category || "").toLowerCase().trim();
            const pubId = String(item.public_id || item.id || "").toLowerCase().trim();
            return folderStr.includes("album") || pubId.includes("/album/");
          })
          .map((item: any) => {
            const url = item.secure_url || item.url || item.fileUrl || "";
            const folderStr = String(item.folder || item.category || "").trim();
            const cat = mapEventTypeToCategory(folderStr);
            const dir = folderStr.startsWith("/album/") || folderStr.startsWith("album/")
              ? folderStr
              : `/album/${folderStr.replace(/^.*?album\/?/i, "")}`;
            const rawTitle = item.public_id ? item.public_id.split("/").pop() || "" : "";
            const albumName = cleanAlbumName(item.folder || item.category, dir, cat);
            const title = cleanEventTitle(rawTitle || item.title, albumName || cat);
            return {
              src: url,
              alt: title,
              eventName: title,
              category: cat,
              album: albumName,
              directory: dir,
              directoryName: dir,
            };
          })
          .filter((img) => img.src && !isStaffStudentOrPressUrl(img.src));

        if (isMounted) {
          const seenApiKeys = new Set<string>();
          const uniqueApiList: AlbumImage[] = [];
          // When database records exist, strictly use them to prevent duplicacy and cloud-datasource pollution!
          const primarySource = fetchedFromDb.length > 0 ? fetchedFromDb : fetchedFromCdn;
          for (const img of primarySource) {
            const key = getCanonicalAssetKey(img.src);
            if (!key || seenApiKeys.has(key)) continue;
            seenApiKeys.add(key);
            uniqueApiList.push(img);
          }
          setExtraApiImages(uniqueApiList);
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
      .filter((item) => {
        if (isStaffStudentOrPressItem(item)) return false;
        const dir = String(item.directoryName || item.directory || "").toLowerCase().trim();
        const alb = String((item as any).album || "").toLowerCase().trim();
        return dir.includes("album") || (alb.length > 0 && alb !== "others");
      })
      .flatMap((item) => {
        const dir = String(item.directoryName || item.directory || "").trim();
        const cat = mapEventTypeToCategory((item as any).album || item.eventType);
        const albumName = cleanAlbumName((item as any).album as string, dir, cat);
        const eventName = cleanEventTitle(item.eventName as string, albumName || cat);
        return imageUrls(item)
          .filter((url) => !isStaffStudentOrPressUrl(url))
          .map((url) => ({
            src: url,
            alt: eventName,
            category: cat,
            album: albumName,
            directory: dir || `Album/${albumName}`,
            directoryName: dir || `Album/${albumName}`,
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
    // When backend is connected, strictly render from DB / API! Only use datasourceImages if backend is offline.
    const isBackendConnected = siteData.backendConnected !== false;
    const sourceImages = isBackendConnected ? extraApiImages : (extraApiImages.length > 0 ? extraApiImages : datasourceImages);
    const seen = new Set<string>();
    const uniqueList: AlbumImage[] = [];

    for (const img of sourceImages) {
      if (!img.src || isStaffStudentOrPressUrl(img.src)) continue;
      const key = getCanonicalAssetKey(img.src);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      // Strictly filter for album images matching /gallery-album logic
      const dirPath = (img.directoryName || img.directory || "").toLowerCase().trim();
      const albumName = (img.album || "").toLowerCase().trim();
      const altText = (img.alt || "").toLowerCase().trim();
      const srcUrl = (img.src || "").toLowerCase().trim();

      if (
        dirPath.includes("document") ||
        dirPath.includes("documents") ||
        albumName.includes("document") ||
        albumName.includes("documents") ||
        srcUrl.includes("/documents") ||
        srcUrl.includes("/document") ||
        dirPath.includes("others") ||
        albumName.includes("others") ||
        srcUrl.includes("/others") ||
        dirPath.includes("visual editor") ||
        dirPath.includes("visual-editor") ||
        dirPath.includes("visual_editor") ||
        albumName.includes("visual editor") ||
        albumName.includes("visual-editor") ||
        albumName.includes("visual_editor") ||
        altText.includes("visual editor") ||
        altText.includes("visual-editor") ||
        altText.includes("visual_editor") ||
        srcUrl.includes("visual-editor") ||
        srcUrl.includes("visual_editor") ||
        srcUrl.includes("visual editor")
      ) {
        continue;
      }

      // In public web portal, strictly ONLY show images which include directory name "album" or have a valid album name
      const isAlbumItem =
        dirPath.includes("album") ||
        srcUrl.includes("/album/") ||
        srcUrl.includes("/album") ||
        (Boolean(albumName) && !["others", "general document", "document", "documents"].includes(albumName));

      if (!isAlbumItem) {
        continue;
      }

      const isForbiddenFolder =
        dirPath.includes("/staff") ||
        dirPath.includes("/press") ||
        dirPath.includes("/documents") ||
        dirPath.includes("/logos");

      if (isForbiddenFolder) continue;

      const isExplicitAlbum =
        dirPath.includes("album") ||
        srcUrl.includes("/album/") ||
        Boolean(albumName);

      const isAlbumCategory = [
        "Campus",
        "Events",
        "Sports",
        "Activities",
        "Hostel",
        "Arts",
        "Infrastructure",
        "Celebration",
        "Academic",
      ].map((s) => s.toLowerCase()).includes(img.category.toLowerCase());

      if (!isExplicitAlbum && !isAlbumCategory) continue;

      uniqueList.push(img);
    }
    return uniqueList;
  }, [extraApiImages, datasourceImages, siteData.backendConnected]);

  const [active, setActive] = useState<Category | "All">("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const shownAll = useMemo(
    () =>
      allAlbumImages.filter(
        (i) =>
          active === "All" ||
          i.category.toLowerCase() === active.toLowerCase() ||
          i.album.toLowerCase() === active.toLowerCase() ||
          (i.directoryName && i.directoryName.toLowerCase().includes(active.toLowerCase()))
      ),
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
                    {img.eventName || img.alt}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 line-clamp-1 text-[11px] font-medium text-slate-500">
                    <span className="font-semibold text-primary/80">Event:</span>
                    <span className="text-foreground/90 font-medium">{cleanEventTitle(img.eventName || img.alt)}</span>
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href={active !== "All" ? `/album/${encodeURIComponent(active.toLowerCase())}` : "/gallery/album"}
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

