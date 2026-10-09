"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { getPopupBannerConfig } from "@/lib/site-data";
import { openAdmissionModal } from "@/components/site/AdmissionApplicationModal";
import { AdmissionEnquiryForm } from "@/components/site/AdmissionEnquiryForm";
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          />

          {/* CONCEPT 1: Neon Glassmorphic Card (Responsive for all mobile & desktop screens) */}
          {config.bannerStyle === "concept1" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-[#070e24]/95 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-blue-400/80 shadow-[0_0_45px_rgba(59,130,246,0.5),inset_0_0_20px_rgba(59,130,246,0.25)] backdrop-blur-xl my-auto flex flex-col md:flex-row items-stretch gap-4 sm:gap-6 overflow-y-auto md:overflow-hidden group"
              style={{
                borderRadius: `${config.imageBorderRadius || 24}px`,
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-8 sm:size-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition border border-white/20 cursor-pointer shadow-lg"
                title={config.closeButtonText || "Close"}
              >
                <i className="bi bi-x-lg text-xs" />
              </button>

              {/* Poster Image (100% Fully Visible with object-contain) */}
              {Boolean(config.imageUrl?.trim()) && (
                <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-blue-400/30 flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={imgSrc}
                    alt={config.title || "Announcement"}
                    onError={() => {
                      if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                        setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                      }
                    }}
                    className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""}`}
                    onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                  />
                </div>
              )}

              {/* Content Panel */}
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 sm:space-y-4 px-1 py-1 md:py-0 overflow-y-auto md:overflow-visible shrink-0 md:shrink">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-blue-400">ENQUIRY</span>
                  <span className="h-px bg-blue-500/50 flex-1" />
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">
                  {config.title || "Enquiry"}
                </h2>

                <div className="w-12 sm:w-14 h-1.5 bg-amber-400 rounded-full" />

                <p className="text-xs sm:text-sm text-blue-200/90 font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
                  {config.subtitle || "Indian Public School, Sambalpur — Empowering young minds with academic excellence & holistic growth."}
                </p>

                <div className="pt-2 sm:pt-3">
                  <button
                    type="button"
                    onClick={handleEnquiry}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <i className="bi bi-pencil-square text-sm" />
                    <span>{config.enquiryButtonText || "Enquire Now"}</span>
                    <i className="bi bi-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONCEPT 2: Dark Navy Side-by-Side (Exact match to picture) */}
          {config.bannerStyle === "concept2" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-[#051326] text-white rounded-2xl sm:rounded-3xl border border-blue-400/30 shadow-2xl my-auto flex flex-col md:flex-row items-stretch overflow-y-auto md:overflow-hidden group"
              style={{
                borderRadius: `${config.imageBorderRadius || 24}px`,
              }}
            >
              {/* Left Column: Poster Graphic (100% Fully Visible) */}
              {Boolean(config.imageUrl?.trim()) && (
                <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full bg-slate-950 flex items-center justify-center p-3 shrink-0 border-b md:border-b-0 md:border-r border-blue-900/50">
                  <img
                    src={imgSrc}
                    alt={config.title || "Announcement"}
                    onError={() => {
                      if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                        setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                      }
                    }}
                    className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""}`}
                    onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                  />
                </div>
              )}

              {/* Right Column: Dark Navy Form / Content Showcase (Centered like Picture) */}
              <div className="w-full md:w-1/2 p-5 sm:p-8 bg-[#07162c] flex flex-col justify-center items-center text-center space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1 max-w-sm sm:max-w-md mx-auto">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">
                    {config.title || "Enquiry"}
                  </h2>
                  <div className="w-12 h-1 bg-blue-500/80 rounded-full mx-auto my-1" />
                  {config.subtitle && (
                    <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
                      {config.subtitle}
                    </p>
                  )}
                </div>

                {/* Quick Admission Form Container with Clean White Inputs Directly on Navy BG */}
                <div className="w-full max-w-sm sm:max-w-md mx-auto text-left space-y-2.5 [&_form>div:first-child]:grid-cols-1 [&_form>div:first-child]:gap-3 [&_label]:text-blue-100 [&_label]:font-bold [&_label]:text-xs [&_input]:bg-white [&_input]:border-slate-300 [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_input]:rounded-lg [&_input]:font-medium [&_input]:h-10 [&_textarea]:bg-white [&_textarea]:border-slate-300 [&_textarea]:text-slate-900 [&_textarea]:rounded-lg [&_button[role=combobox]]:bg-white [&_button[role=combobox]]:text-slate-900 [&_button[role=combobox]]:h-10 [&_button[role=combobox]]:rounded-lg">
                  <AdmissionEnquiryForm
                    onClose={() => handleClose()}
                  />
                  <p className="text-[11px] text-blue-200/70 text-center pt-1 font-medium">
                    * Privacy: We respect your details & data privacy.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONCEPT 3: Split Poster + Quick Form Mode */}
          {config.bannerStyle === "concept3" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[92vw] sm:w-[88vw] max-w-5xl h-[90vh] md:h-[80vh] max-h-[92vh] bg-[#06142a] text-white rounded-2xl sm:rounded-3xl border border-blue-400/40 shadow-2xl overflow-y-auto md:overflow-hidden my-auto flex flex-col md:flex-row items-stretch group"
              style={{
                borderRadius: `${config.imageBorderRadius || 24}px`,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-8 sm:size-9 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center transition border border-white/20 cursor-pointer shadow-xl"
                title="Close Pop-Up"
              >
                <i className="bi bi-x-lg text-xs" />
              </button>

              {Boolean(config.imageUrl?.trim()) && (
                <div className="w-full md:w-1/2 h-[32vh] sm:h-[40vh] md:h-full bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-blue-900/50">
                  <img
                    src={imgSrc}
                    alt={config.title || "Announcement"}
                    onError={() => {
                      if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                        setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                      }
                    }}
                    className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""}`}
                    onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                  />
                </div>
              )}

              <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 bg-[#091b38] flex flex-col justify-start md:justify-center overflow-y-auto flex-1 h-auto md:h-full pb-6">
                <div className="mb-3 sm:mb-4 space-y-1 pr-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight font-[var(--font-display)]">
                    {config.title && config.title !== "Admissions Open 2026–27" && config.title !== "ADMISSIONS OPEN 2026–27" ? config.title : "Enquiry"}
                  </h2>
                  {config.subtitle && (
                    <p className="text-[11px] sm:text-xs text-blue-200/90 font-medium">
                      {config.subtitle}
                    </p>
                  )}
                </div>

                <div className="bg-[#0b1b36] p-4 sm:p-5 rounded-2xl border border-blue-400/30 shadow-2xl text-white space-y-2.5 sm:space-y-3 [&_label]:text-amber-300 [&_label]:font-extrabold [&_label]:text-xs [&_label]:tracking-wide [&_input]:bg-[#040b1a] [&_input]:border-blue-400/40 [&_input]:text-white [&_input]:placeholder:text-blue-300/40 [&_input]:rounded-xl [&_input]:focus:border-amber-400 [&_input]:focus:ring-2 [&_input]:focus:ring-amber-400/20 [&_textarea]:bg-[#040b1a] [&_textarea]:border-blue-400/40 [&_textarea]:text-white [&_textarea]:placeholder:text-blue-300/40 [&_textarea]:rounded-xl [&_button[role=combobox]]:bg-[#040b1a] [&_button[role=combobox]]:border-blue-400/40 [&_button[role=combobox]]:text-white [&_button[type=submit]]:bg-gradient-to-r [&_button[type=submit]]:from-amber-400 [&_button[type=submit]]:via-yellow-400 [&_button[type=submit]]:to-amber-500 [&_button[type=submit]]:text-slate-950 [&_button[type=submit]]:font-black [&_button[type=submit]]:shadow-lg [&_button[type=submit]]:shadow-amber-500/25 [&_button[type=submit]]:border-0 [&_button[type=submit]]:rounded-xl">
                  <AdmissionEnquiryForm
                    onSuccess={() => handleClose()}
                    onClose={() => handleClose()}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* CONCEPT 4: Ultra Luxury Golden Showcase */}
          {config.bannerStyle === "concept4" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[92vh] bg-gradient-to-br from-[#060c22] via-[#091536] to-[#040817] text-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-9 border-2 border-amber-400/80 shadow-[0_0_55px_rgba(251,191,36,0.4)] backdrop-blur-2xl my-auto flex flex-col md:flex-row items-stretch gap-4 sm:gap-8 overflow-y-auto md:overflow-hidden group"
              style={{
                borderRadius: `${config.imageBorderRadius || 32}px`,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 size-9 sm:size-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/80 hover:bg-amber-400 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl"
                title="Close"
              >
                <i className="bi bi-x-lg text-xs sm:text-sm" />
              </button>

              {Boolean(config.imageUrl?.trim()) && (
                <div className="w-full md:w-1/2 h-[42vh] sm:h-[48vh] md:h-full rounded-xl sm:rounded-2xl border-2 border-amber-400/40 bg-slate-950 overflow-hidden flex items-center justify-center p-2 shadow-2xl shrink-0">
                  <img
                    src={imgSrc}
                    alt={config.title || "Announcement"}
                    onError={() => {
                      if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                        setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                      }
                    }}
                    className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""}`}
                    onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                  />
                </div>
              )}

              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 sm:space-y-4 px-1 py-1 md:py-0 overflow-y-auto md:overflow-visible shrink-0 md:shrink">
                <div className="flex items-center gap-2 sm:gap-3">
                  <i className="bi bi-trophy-fill text-amber-400 text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-300">ENQUIRY</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight font-[var(--font-display)]">
                  {config.title || "Enquiry"}
                </h2>

                <div className="w-14 sm:w-16 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />

                <p className="text-xs sm:text-sm font-semibold text-amber-100/80 leading-relaxed line-clamp-3 md:line-clamp-none">
                  {config.subtitle || "Build Your Child's Brighter Future with Indian Public School's premier academic curriculum."}
                </p>

                <div className="pt-2 sm:pt-3">
                  <button
                    type="button"
                    onClick={handleEnquiry}
                    className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    <span>{config.enquiryButtonText || "Enquire Now"}</span>
                    <i className="bi bi-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CLASSIC / STANDARD POSTER CARD */}
          {(config.bannerStyle === "card" || config.bannerStyle === "full-bleed" || config.bannerStyle === "side-by-side") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`relative z-10 w-[92vw] sm:w-[88vw] max-w-5xl h-[88vh] md:h-[80vh] max-h-[90vh] overflow-hidden border border-white/20 bg-slate-950 text-white shadow-2xl my-auto flex flex-col justify-between transition-all group`}
              style={{
                maxWidth: (config.modalWidth === "custom" || config.imageWidth) ? `${config.imageWidth}px` : undefined,
                aspectRatio: (config.aspectRatio || "16/10").replace('/', ' / '),
                height: config.imageMaxHeight ? `${config.imageMaxHeight}px` : "auto",
                maxHeight: "90vh",
                borderRadius: `${config.imageBorderRadius || 24}px`,
              }}
            >
              {/* Poster Graphic Image Container */}
              {Boolean(config.imageUrl?.trim()) && (
                <div className="relative w-full flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={config.title || "Announcement"}
                    onError={() => {
                      if (imgSrc !== "/assets/Settings/Home/POP_UP_IMAGE.jpeg") {
                        setImgSrc("/assets/Settings/Home/POP_UP_IMAGE.jpeg");
                      }
                    }}
                    className={`w-full h-full transition-transform duration-500 group-hover:scale-[1.02] ${config.showImageZoomOnClick ? "cursor-zoom-in" : ""}`}
                    style={{
                      objectFit: config.imageFit || "contain",
                      objectPosition: config.imagePosition || "center",
                    }}
                    onClick={() => config.showImageZoomOnClick && setIsLightboxOpen(true)}
                  />
                </div>
              )}

              {/* Bottom Footer Action Bar */}
              <div className="shrink-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-3.5 py-2.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 relative z-20">
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
          )}
        </div>
      </AnimatePresence>
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
