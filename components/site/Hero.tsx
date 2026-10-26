"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EASE } from "@/lib/motion-presets";
import { DEFAULT_HERO_IMAGE, firstSection, homeData, imageUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { SmartImage } from "@/components/ui/SmartImage";
import fallbackSiteData from "@/public/cloud-datasource.json";

export interface HeroSlide {
  bannerUrl: string;
  mobileBannerUrl?: string;
  title?: string;
  h1?: string;
  h2?: string;
  description?: string;
  fontSizeTitle?: "sm" | "md" | "lg" | "xl";
  fontSizeH1?: "sm" | "md" | "lg" | "xl";
  fontSizeH2?: "sm" | "md" | "lg" | "xl";
  fontSizeDescription?: "sm" | "md" | "lg" | "xl";
  enableOverlay?: boolean;
  showText?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  objectPosition?: string;
  mobileObjectPosition?: string;
  objectFit?: "cover" | "contain";
  mobileObjectFit?: "cover" | "contain";
}

const TITLE_SIZE_CLASSES: Record<string, string> = {
  sm: "text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1",
  md: "text-[11px] sm:text-xs px-3 sm:px-3.5 py-0.5 sm:py-1",
  lg: "text-xs sm:text-sm px-3.5 sm:px-4 py-1 sm:py-1.5",
  xl: "text-sm sm:text-base px-4 sm:px-5 py-1.5 sm:py-2",
};

const H1_SIZE_CLASSES: Record<string, string> = {
  sm: "text-base sm:text-2xl lg:text-3xl font-bold",
  md: "text-lg sm:text-3xl lg:text-4xl font-extrabold",
  lg: "text-xl sm:text-4xl lg:text-5xl font-extrabold",
  xl: "text-2xl sm:text-5xl lg:text-6xl font-extrabold",
};

const H2_SIZE_CLASSES: Record<string, string> = {
  sm: "text-sm sm:text-xl lg:text-2xl font-bold",
  md: "text-base sm:text-2xl lg:text-3xl font-extrabold",
  lg: "text-lg sm:text-3xl lg:text-4xl font-extrabold",
  xl: "text-xl sm:text-4xl lg:text-5xl font-extrabold",
};

const DESC_SIZE_CLASSES: Record<string, string> = {
  sm: "text-[11px] sm:text-xs",
  md: "text-xs sm:text-sm lg:text-base",
  lg: "text-sm sm:text-base lg:text-lg",
  xl: "text-base sm:text-lg lg:text-xl",
};

export function Hero() {
  const home = homeData(useSiteData());
  const hero = (home.hero as Record<string, unknown>) ?? {};
  const content = firstSection({ content: hero.content }, "content");

  // Dynamic Slide Rotation Duration (in milliseconds, e.g. 5000 = 5s)
  const rawDuration = hero.slideDuration ?? content.slideDuration ?? 5000;
  const slideDuration = typeof rawDuration === "number" && rawDuration >= 1000 ? rawDuration : 5000;

  // Fallback defaults
  const fallbackHeroConfig = (fallbackSiteData.home[0]?.hero as Record<string, unknown>) ?? {};
  const jsonHeroImage =
    imageUrl(fallbackHeroConfig.bannerUrl) ||
    imageUrl(Array.isArray(fallbackHeroConfig.fileUrls) ? fallbackHeroConfig.fileUrls[0] : "");

  // Build array of slides with per-slide properties
  const rawSlides: any[] = Array.isArray(hero.slides) ? hero.slides : [];
  const slides: HeroSlide[] = useMemoSlides(rawSlides, hero, content, jsonHeroImage, DEFAULT_HERO_IMAGE);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide Timer Effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, slideDuration);
    return () => clearInterval(interval);
  }, [slides.length, slideDuration]);

  const currentSlide = slides[currentIndex] || slides[0]!;

  // Strict Overlay & Ambient Gradient Toggle (When enableOverlay === false -> 100% clean image, zero tint/gradient)
  const enableOverlay = currentSlide.enableOverlay !== false;
  const overlayColor = String(currentSlide.overlayColor || "#0a192f");
  const rawOpacity = currentSlide.overlayOpacity;
  const configuredOpacity =
    typeof rawOpacity === "number"
      ? Math.max(0, Math.min(1, rawOpacity))
      : typeof rawOpacity === "string" && !isNaN(parseFloat(rawOpacity))
        ? Math.max(0, Math.min(1, parseFloat(rawOpacity)))
        : 0.6;

  const overlayOpacity = enableOverlay ? configuredOpacity : 0;

  // Flexible Text Visibility Toggle (Can be turned ON/OFF per slide)
  const showText = currentSlide.showText !== false;

  // Pure optional extraction with zero hardcoded fallbacks
  const rawTitle = showText && currentSlide.title ? text(currentSlide.title, "").trim() : "";
  const rawH1 = showText && currentSlide.h1 ? text(currentSlide.h1, "").trim() : "";
  const rawH2 = showText && currentSlide.h2 ? text(currentSlide.h2, "").trim() : "";
  const rawDescription = showText && currentSlide.description ? text(currentSlide.description, "").trim() : "";

  const titleSizeClass = TITLE_SIZE_CLASSES[currentSlide.fontSizeTitle || "md"] || TITLE_SIZE_CLASSES.md;
  const h1SizeClass = H1_SIZE_CLASSES[currentSlide.fontSizeH1 || "md"] || H1_SIZE_CLASSES.md;
  const h2SizeClass = H2_SIZE_CLASSES[currentSlide.fontSizeH2 || "md"] || H2_SIZE_CLASSES.md;
  const descSizeClass = DESC_SIZE_CLASSES[currentSlide.fontSizeDescription || "md"] || DESC_SIZE_CLASSES.md;

  const hasTitle = Boolean(rawTitle);
  const hasH1 = Boolean(rawH1);
  const hasH2 = Boolean(rawH2);
  const hasDesc = Boolean(rawDescription);
  const hasDetailedContent = hasH1 || hasH2 || hasDesc;
  const hasTextContent = showText && (hasTitle || hasDetailedContent);

  // Determine mobile-friendly object-fit styling (default to 'cover' so banner images seamlessly fill the hero without black voids)
  const isContainDesktop = currentSlide.objectFit === "contain";
  const isContainMobile = currentSlide.mobileObjectFit
    ? currentSlide.mobileObjectFit === "contain"
    : currentSlide.objectFit === "contain";

  const objectFitClass =
    isContainDesktop && isContainMobile
      ? "object-contain"
      : !isContainDesktop && !isContainMobile
        ? "object-cover"
        : isContainMobile
          ? "object-contain sm:object-cover"
          : "object-cover sm:object-contain";

  const needsAmbientBackdrop = isContainDesktop || isContainMobile;

  const ref = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "12%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.08]);

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % slides.length);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? (touchStartY.current ?? 0);
    const diffX = touchStartX.current - endX;
    const diffY = (touchStartY.current ?? 0) - endY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <section
      id="home"
      ref={ref}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative isolate overflow-hidden bg-slate-950 flex items-end sm:items-center transition-[min-height] duration-500 select-none ${
        hasTextContent
          ? "h-[78vw] min-h-[320px] max-h-[440px] sm:h-auto sm:max-h-none sm:min-h-[75svh] lg:min-h-[90svh]"
          : "h-[54vw] min-h-[210px] max-h-[320px] sm:h-auto sm:max-h-none sm:min-h-[60svh] md:min-h-[75svh] lg:min-h-[90svh]"
      }`}
    >
      {/* Background Banner Image with Smooth Cross-Fade Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={(currentSlide.mobileBannerUrl || currentSlide.bannerUrl) + currentIndex}
          style={{ y, scale }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 z-0"
        >
          {/* Ambient blurred backdrop when objectFit is 'contain' or on mobile clean banners so posters don't show blank voids */}
          {needsAmbientBackdrop && (
            <div
              className="absolute inset-0 scale-125 blur-3xl opacity-40 bg-center bg-cover pointer-events-none"
              style={{
                backgroundImage: `url(${imageUrl(currentSlide.mobileBannerUrl) || imageUrl(currentSlide.bannerUrl) || currentSlide.bannerUrl})`,
              }}
              aria-hidden
            />
          )}

          <SmartImage
            src={currentSlide.bannerUrl}
            mobileSrc={currentSlide.mobileBannerUrl}
            fallbackSrc={jsonHeroImage || DEFAULT_HERO_IMAGE}
            alt={rawH1 || rawTitle || "Indian Public School Campus Banner"}
            width={1920}
            height={1080}
            containerClassName="size-full flex items-center justify-center"
            className={`size-full ${objectFitClass}`}
            style={{
              objectPosition: currentSlide.objectPosition || "center center",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Per-Slide Dynamic Overlay Layer (Rendered ONLY if enableOverlay === true) */}
      {enableOverlay && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 z-10 transition-all duration-500 pointer-events-none"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}

      {/* Ambient Gradient for Depth (Rendered ONLY if enableOverlay === true) */}
      {enableOverlay && (
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none"
          aria-hidden
        />
      )}

      {/* Main Banner Content (Title, H1, H2, Description) - Rendered ONLY if showText === true */}
      {hasTextContent && (
        <div className="container-page relative z-20 pb-16 pt-4 sm:py-20 lg:py-28 flex flex-col items-center sm:items-start justify-end sm:justify-center px-4 sm:px-10 lg:px-20 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={"content-" + currentIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className={`pointer-events-auto transition-all duration-300 max-w-4xl sm:mx-0 ${
                !enableOverlay && hasDetailedContent
                  ? "bg-slate-950/40 sm:bg-black/50 p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xs border border-white/10 sm:drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] text-center sm:text-left"
                  : "text-center sm:text-left"
              }`}
            >
              {/* 1. Green Title Badge (Rendered ONLY if provided) */}
              {rawTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className={`inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-slate-950/45 sm:bg-emerald-400/15 font-bold tracking-wide sm:tracking-[0.16em] text-emerald-300 uppercase backdrop-blur-md shadow-md mb-2 sm:mb-4 sm:w-fit ${titleSizeClass}`}
                >
                  <span className="leading-tight sm:leading-normal text-center sm:text-left [text-wrap:balance] sm:[text-wrap:normal]">
                    {rawTitle}
                  </span>
                </motion.div>
              )}

              {/* 2. White H1 Main Heading (Rendered ONLY if provided) */}
              {rawH1 && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                  className={`font-display font-extrabold leading-tight sm:leading-[1.08] text-white drop-shadow-lg [text-wrap:balance] sm:[text-wrap:normal] break-words ${h1SizeClass}`}
                >
                  {rawH1}
                </motion.h1>
              )}

              {/* 3. Yellow H2 Secondary Heading (Rendered ONLY if provided) */}
              {rawH2 && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                  className={`mt-1 font-display font-extrabold leading-tight sm:leading-[1.08] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-md [text-wrap:balance] sm:[text-wrap:normal] break-words ${h2SizeClass}`}
                >
                  {rawH2}
                </motion.h2>
              )}

              {/* 4. Description Paragraph (Rendered ONLY if provided) */}
              {rawDescription && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
                  className={`mt-4 sm:mt-6 max-w-2xl leading-relaxed text-slate-100 font-normal drop-shadow-md sm:[text-wrap:normal] ${descSizeClass}`}
                >
                  {rawDescription}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Navigation Arrows & Indicator Dots (If multiple slides exist) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous Slide"
            onClick={goToPrev}
            className="absolute left-2 sm:left-6 lg:left-8 top-[30%] sm:top-1/2 z-30 -translate-y-1/2 size-8 sm:size-auto rounded-full sm:rounded-none bg-slate-950/45 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/15 sm:border-0 shadow-lg sm:shadow-none flex items-center justify-center p-1.5 sm:p-2 text-white/85 sm:text-white/75 hover:text-white transition-all duration-300 hover:scale-105 sm:hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
          >
            <ChevronLeft className="size-4.5 sm:size-9 transition-transform group-hover:-translate-x-0.5 sm:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            onClick={goToNext}
            className="absolute right-2 sm:right-6 lg:right-8 top-[30%] sm:top-1/2 z-30 -translate-y-1/2 size-8 sm:size-auto rounded-full sm:rounded-none bg-slate-950/45 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/15 sm:border-0 shadow-lg sm:shadow-none flex items-center justify-center p-1.5 sm:p-2 text-white/85 sm:text-white/75 hover:text-white transition-all duration-300 hover:scale-105 sm:hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
          >
            <ChevronRight className="size-4.5 sm:size-9 transition-transform group-hover:translate-x-0.5 sm:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-11 sm:bottom-6 inset-x-0 z-30 flex justify-center items-center pointer-events-none">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-slate-950/40 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-0 shadow-lg sm:shadow-none pointer-events-auto">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? "w-6 sm:w-8 bg-emerald-400 sm:shadow-xs"
                      : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// Helper to construct slide objects reliably
function useMemoSlides(
  rawSlides: any[],
  hero: Record<string, unknown>,
  content: Record<string, any>,
  jsonHeroImage: string,
  fallbackImage: string
): HeroSlide[] {
  if (Array.isArray(rawSlides) && rawSlides.length > 0) {
    return rawSlides.map((item: any) => ({
      bannerUrl:
        imageUrl(item.bannerUrl) ||
        imageUrl(item.imageUrl) ||
        jsonHeroImage ||
        fallbackImage,
      mobileBannerUrl:
        imageUrl(item.mobileBannerUrl) ||
        imageUrl(item.mobileImageUrl) ||
        "",
      title: item.title ?? content.title,
      h1: item.h1 ?? content.h1,
      h2: item.h2 ?? content.h2,
      description: item.description ?? content.description,
      fontSizeTitle: item.fontSizeTitle,
      fontSizeH1: item.fontSizeH1,
      fontSizeH2: item.fontSizeH2,
      fontSizeDescription: item.fontSizeDescription,
      enableOverlay: item.enableOverlay ?? hero.enableOverlay ?? true,
      showText: item.showText ?? hero.showText ?? true,
      overlayColor: item.overlayColor || hero.overlayColor || "#0a192f",
      overlayOpacity: item.overlayOpacity ?? hero.overlayOpacity ?? 0.6,
      objectPosition: item.objectPosition || (hero.objectPosition as string) || "center center",
      mobileObjectPosition: item.mobileObjectPosition || item.objectPosition || (hero.objectPosition as string) || "center center",
      objectFit: (item.objectFit as "cover" | "contain") || (hero.objectFit as "cover" | "contain") || "cover",
      mobileObjectFit: (item.mobileObjectFit as "cover" | "contain") || undefined,
    }));
  }

  const fileUrls: string[] = Array.isArray(hero.fileUrls) ? hero.fileUrls : [];
  const primaryBanner = imageUrl(hero.bannerUrl) || (fileUrls[0] ? imageUrl(fileUrls[0]) : "");

  const listToUse = fileUrls.length > 0 ? fileUrls : primaryBanner ? [primaryBanner] : [fallbackImage];

  return listToUse.map((url) => ({
    bannerUrl: imageUrl(url) || fallbackImage,
    mobileBannerUrl: imageUrl(hero.mobileBannerUrl) || "",
    title: content.title,
    h1: content.h1,
    h2: content.h2,
    description: content.description,
    fontSizeTitle: hero.fontSizeTitle as any,
    fontSizeH1: hero.fontSizeH1 as any,
    fontSizeH2: hero.fontSizeH2 as any,
    fontSizeDescription: hero.fontSizeDescription as any,
    enableOverlay: (content.enableOverlay ?? hero.enableOverlay) !== false,
    showText: (content.showText ?? hero.showText) !== false,
    overlayColor: content.overlayColor || hero.overlayColor || "#0a192f",
    overlayOpacity: content.overlayOpacity ?? hero.overlayOpacity ?? 0.6,
    objectPosition: (hero.objectPosition as string) || "center center",
    mobileObjectPosition: (hero.mobileObjectPosition as string) || (hero.objectPosition as string) || "center center",
    objectFit: (hero.objectFit as "cover" | "contain") || "cover",
    mobileObjectFit: (hero.mobileObjectFit as "cover" | "contain") || undefined,
  }));
}

