"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { homeData, imageUrl } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";

import { SmartImage } from "@/components/ui/SmartImage";

export function BannerSlider() {
  const home = homeData(useSiteData());
  const banner = (home.banner as Record<string, unknown>) ?? {};
  const images = (Array.isArray(banner.fileUrls) ? banner.fileUrls : [])
    .map(imageUrl)
    .filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % images.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [images.length]);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const changeSlide = (offset: number) =>
    setIndex((current) => (current + offset + images.length) % images.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      changeSlide(1);
    } else if (diff < -45) {
      changeSlide(-1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!images.length) return null;

  return (
    <section aria-label="School highlights" className="bg-secondary/40 py-10 lg:py-14 select-none">
      <div className="container-page">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-lift"
        >
          <SmartImage
            src={images[index]!}
            alt={`Indian Public School highlight ${index + 1}`}
            className="aspect-[16/7] w-full object-cover"
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => changeSlide(-1)}
                className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 text-white/85 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ChevronLeft className="size-5 sm:size-6 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => changeSlide(1)}
                className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 text-white/85 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ChevronRight className="size-5 sm:size-6 transition-transform group-hover:translate-x-0.5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 shadow-lg">
                {images.map((_, slide) => (
                  <button
                    key={slide}
                    type="button"
                    aria-label={`Show banner ${slide + 1}`}
                    onClick={() => setIndex(slide)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      slide === index ? "w-6 sm:w-8 bg-gold shadow-xs" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
