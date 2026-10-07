"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getPopupBannerConfig } from "@/lib/site-data";
import { openAdmissionModal } from "@/components/site/AdmissionApplicationModal";
import { getAssetUrl } from "@/lib/utils";

export function PopupBannerModal() {
  const siteData = useSiteData();
  const config = getPopupBannerConfig(siteData);

  const [isOpen, setIsOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => getAssetUrl(config.imageUrl) || "/assets/Settings/Home/POP_UP_IMAGE.jpeg");

  useEffect(() => {
    setImgSrc(getAssetUrl(config.imageUrl) || "/assets/Settings/Home/POP_UP_IMAGE.jpeg");
  }, [config.imageUrl]);

  useEffect(() => {
    if (!config.enabled || !config.imageUrl) return;

    if (config.onlyOncePerSession) {
      const dismissed = sessionStorage.getItem("ips_popup_dismissed");
      if (dismissed === "true") return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, Math.max(500, config.delaySeconds * 1000));

    return () => clearTimeout(timer);
  }, [config.enabled, config.imageUrl, config.delaySeconds, config.onlyOncePerSession]);

  const handleClose = () => {
    setIsOpen(false);
    if (config.onlyOncePerSession) {
      sessionStorage.setItem("ips_popup_dismissed", "true");
    }
  };

  const handleEnquiry = () => {
    setIsOpen(false);
    if (config.onlyOncePerSession) {
      sessionStorage.setItem("ips_popup_dismissed", "true");
    }
    openAdmissionModal();
  };

  // Helper functions for dynamic sizing
  const getMaxWidthClass = () => {
    switch (config.modalWidth) {
      case "sm":
        return "max-w-md";
      case "md":
        return "max-w-lg";
      case "lg":
        return "max-w-xl";
      case "xl":
        return "max-w-3xl";
      case "full":
        return "max-w-[92vw]";
      case "custom":
        return "";
      default:
        return "max-w-xl";
    }
  };

  const getAspectRatioClass = () => {
    switch (config.aspectRatio) {
      case "16/9":
        return "aspect-[16/9]";
      case "16/10":
        return "aspect-[16/10]";
      case "4/3":
        return "aspect-[4/3]";
      case "1/1":
        return "aspect-square";
      case "3/2":
        return "aspect-[3/2]";
      case "2/1":
        return "aspect-[2/1]";
      default:
        return "aspect-[16/10]";
    }
  };

  if (!isOpen || !config.enabled || !config.imageUrl) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[var(--navy-deep)]/80 backdrop-blur-md transition-opacity"
          />

          {/* Dynamic Poster Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 w-full ${getMaxWidthClass()} ${getAspectRatioClass()} overflow-hidden border border-white/20 bg-slate-950 text-white shadow-2xl my-auto flex flex-col justify-between transition-all group`}
            style={{
              maxWidth: (config.modalWidth === "custom" || config.imageWidth) ? `${config.imageWidth}px` : undefined,
              aspectRatio: (config.aspectRatio || "16/10").replace('/', ' / '),
              height: config.imageMaxHeight ? `${config.imageMaxHeight}px` : "auto",
              maxHeight: "88vh",
              borderRadius: `${config.imageBorderRadius || 24}px`,
            }}
          >
            {/* Poster Graphic Image Container (Full Poster Image Fully Visible) */}
            {Boolean(config.imageUrl?.trim()) && (
              <div className="relative w-full flex-1 min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={imgSrc}
                  alt={config.title || "Indian Public School Announcement"}
                  onError={() => {
                    if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                      setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                    }
                  }}
                  className={`w-full h-full transition-transform duration-500 group-hover:scale-[1.02] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""
                    }`}
                  style={{
                    objectFit: config.imageFit || "contain",
                    objectPosition: config.imagePosition || "center",
                  }}
                  onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                />
              </div>
            )}

            {/* Dedicated Bottom Footer Action Bar (Positioned below image so poster text is unobscured) */}
            <div className="shrink-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-20">
              {/* Optional Title & Subtitle */}
              <div className="min-w-0 flex-1 space-y-0.5">
                {config.title && (
                  <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-snug line-clamp-2 font-[var(--font-display)]">
                    {config.title}
                  </h2>
                )}
                {config.subtitle && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider line-clamp-1">
                    {config.subtitle}
                  </p>
                )}
              </div>

              {/* Action Buttons: Enquiry Now & Close */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleEnquiry}
                  className="bg-[var(--primary)] hover:bg-[var(--navy)] text-[var(--primary-foreground)] font-extrabold text-xs px-4 py-2 shadow-md border border-white/20 cursor-pointer transform active:scale-95 transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                  style={{ borderRadius: "var(--btn-radius, 9999px)" }}
                >
                  <i className="bi bi-pencil-square text-xs text-[var(--gold)]" />
                  <span>{config.enquiryButtonText || "Enquiry Now"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold text-xs px-3.5 py-2 border border-slate-700 hover:border-slate-600 cursor-pointer transform active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                  style={{ borderRadius: "var(--btn-radius, 9999px)" }}
                >
                  <i className="bi bi-x-lg text-[10px]" />
                  <span>{config.closeButtonText || "Close"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Fullscreen Lightbox when clicking image */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-5 right-5 z-10 grid size-10 place-items-center rounded-full bg-red-600 text-white hover:bg-red-700 transition cursor-pointer border border-red-400/40 shadow-xl"
              title="Close Full Image"
            >
              <i className="bi bi-x-lg text-base" />
            </button>
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={imgSrc}
              alt="Full Announcement Poster"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
