"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Sliders,
  Type,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Images,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { imageUrl } from "@/lib/site-data";

interface HomeHeroTabProps {
  homeObj: any;
  updateHome: (updater: (prev: any) => any) => void;
  uploadImage: (file: File) => Promise<string>;
}

const PRESET_COLORS = [
  { name: "Dark Navy", value: "#0a192f" },
  { name: "Deep Slate", value: "#0f172a" },
  { name: "Pure Black", value: "#000000" },
  { name: "Royal Blue", value: "#1e3a8a" },
  { name: "Forest Dark", value: "#064e3b" },
  { name: "Burgundy", value: "#4c0519" },
];

export function HomeHeroTab({ homeObj, updateHome, uploadImage }: HomeHeroTabProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState<number>(0);

  const heroObj = homeObj.hero || {};
  const content = heroObj.content?.[0] || {};
  const fileUrls: string[] = Array.isArray(heroObj.fileUrls) ? heroObj.fileUrls : [];

  // Global Slide Duration (in milliseconds, default 5000 = 5s)
  const slideDuration = heroObj.slideDuration ?? content.slideDuration ?? 5000;

  // Build slides list
  const slides: any[] = Array.isArray(heroObj.slides) && heroObj.slides.length > 0
    ? heroObj.slides
    : fileUrls.map((url) => ({
      bannerUrl: url,
      title: content.title || "",
      h1: content.h1 || "",
      h2: content.h2 || "",
      description: content.description || "",
      enableOverlay: (content.enableOverlay ?? heroObj.enableOverlay) !== false,
      showText: (content.showText ?? heroObj.showText) !== false,
      overlayColor: content.overlayColor || heroObj.overlayColor || "#0a192f",
      overlayOpacity: content.overlayOpacity ?? heroObj.overlayOpacity ?? 0.6,
    }));

  if (slides.length === 0) {
    slides.push({
      bannerUrl: heroObj.bannerUrl || "",
      title: content.title || "",
      h1: content.h1 || "",
      h2: content.h2 || "",
      description: content.description || "",
      enableOverlay: true,
      showText: true,
      overlayColor: "#0a192f",
      overlayOpacity: 0.6,
    });
  }

  const activeSlideIdx = Math.min(selectedSlideIdx, slides.length - 1);
  const currentSlide = slides[activeSlideIdx] || slides[0];

  const updateSlidesList = (newSlides: any[], newDuration?: number) => {
    const primaryBanner = newSlides[0]?.bannerUrl || "";
    const updatedFileUrls = newSlides.map((s) => s.bannerUrl).filter(Boolean);
    const updatedContent = [...(heroObj.content || [{}])];

    if (newSlides[0]) {
      updatedContent[0] = {
        ...updatedContent[0],
        title: newSlides[0].title,
        h1: newSlides[0].h1,
        h2: newSlides[0].h2,
        session: newSlides[0].title || newSlides[0].h2,
        description: newSlides[0].description,
        fontSizeTitle: newSlides[0].fontSizeTitle,
        fontSizeH1: newSlides[0].fontSizeH1,
        fontSizeH2: newSlides[0].fontSizeH2,
        fontSizeDescription: newSlides[0].fontSizeDescription,
        enableOverlay: newSlides[0].enableOverlay,
        showText: newSlides[0].showText,
        overlayColor: newSlides[0].overlayColor,
        overlayOpacity: newSlides[0].overlayOpacity,
      };
    }

    updateHome((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: newSlides,
        bannerUrl: primaryBanner,
        fileUrls: updatedFileUrls,
        slideDuration: newDuration !== undefined ? newDuration : (prev.hero?.slideDuration ?? slideDuration),
        fontSizeTitle: newSlides[0]?.fontSizeTitle,
        fontSizeH1: newSlides[0]?.fontSizeH1,
        fontSizeH2: newSlides[0]?.fontSizeH2,
        fontSizeDescription: newSlides[0]?.fontSizeDescription,
        content: updatedContent,
      },
    }));
  };

  const updateCurrentSlideField = (field: string, value: any) => {
    const updated = [...slides];
    updated[activeSlideIdx] = {
      ...updated[activeSlideIdx],
      [field]: value,
    };
    updateSlidesList(updated);
  };

  const addNewSlide = (bannerUrl: string) => {
    const newSlide = {
      bannerUrl,
      title: "",
      h1: "",
      h2: "",
      description: "",
      enableOverlay: true,
      showText: true,
      overlayColor: "#0a192f",
      overlayOpacity: 0.6,
    };
    const updated = [...slides, newSlide];
    updateSlidesList(updated);
    setSelectedSlideIdx(updated.length - 1);
  };

  const removeSlide = (indexToRemove: number) => {
    if (slides.length <= 1) {
      alert("At least 1 hero banner slide must remain.");
      return;
    }
    const updated = slides.filter((_, idx) => idx !== indexToRemove);
    updateSlidesList(updated);
    setSelectedSlideIdx((prev) => Math.min(prev, updated.length - 1));
  };

  const moveSlideOrder = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= slides.length || fromIdx === toIdx) return;
    const updated = [...slides];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    updateSlidesList(updated);
    setSelectedSlideIdx(toIdx);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) return;
    moveSlideOrder(draggedIdx, targetIndex);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Header & Global Slide Duration Config */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-[#102a4c] flex items-center gap-2">
              <Sliders className="text-[#1a5d9c]" size={20} /> Hero Sliding Banner & Content Configurator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage banner slide rotation timing and configure H1, H2, description, and optional overlay per slide.
            </p>
          </div>

          {/* Slide Auto-Rotation Timer Setting */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
            <Clock size={16} className="text-[#1a5d9c]" />
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Slide Timer:</label>
            <select
              value={slideDuration}
              onChange={(e) => updateSlidesList(slides, parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-[#102a4c] outline-none cursor-pointer focus:border-[#1a5d9c]"
            >
              <option value={3000}>3 Seconds (Fast)</option>
              <option value={5000}>5 Seconds (Standard)</option>
              <option value={8000}>8 Seconds (Relaxed)</option>
              <option value={10000}>10 Seconds (Slow)</option>
              <option value={15000}>15 Seconds</option>
            </select>
          </div>
        </div>

        {/* Banner Slides List & Drag/Drop Reorder */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon size={15} className="text-[#1a5d9c]" /> Hero Banner Slides ({slides.length})
              <span className="text-[10px] text-slate-400 font-normal">(Drag cards to reorder positions)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer"
              >
                <Images size={15} className="text-[#1a5d9c]" /> Choose from Gallery
              </button>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#102a4c] transition">
                <UploadCloud size={14} /> Upload New Slide
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      if (url) addNewSlide(url);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Draggable Slides Grid */}
          <div className="grid gap-3 sm:grid-cols-4">
            {slides.map((slide, idx) => {
              const isEditing = activeSlideIdx === idx;
              const isBeingDragged = draggedIdx === idx;

              return (
                <div
                  key={slide.bannerUrl + idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => setDraggedIdx(null)}
                  onClick={() => setSelectedSlideIdx(idx)}
                  className={`group relative aspect-video overflow-hidden rounded-xl border-2 transition cursor-grab active:cursor-grabbing ${isBeingDragged ? "opacity-40 scale-95 border-amber-400" : ""
                    } ${isEditing
                      ? "border-[#1a5d9c] ring-2 ring-[#1a5d9c]/30 shadow-md"
                      : "border-slate-200 hover:border-slate-400"
                    }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {slide.bannerUrl ? (
                    <img src={imageUrl(slide.bannerUrl) || slide.bannerUrl} alt={`Slide ${idx + 1}`} className="size-full object-cover pointer-events-none" />
                  ) : (
                    <div className="size-full bg-slate-800 flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center pointer-events-none">
                      <ImageIcon className="size-6 text-slate-500 opacity-60" />
                      <span className="text-[11px] font-medium text-slate-400">No Image Selected</span>
                    </div>
                  )}

                  {/* Top Bar Badges & Actions */}
                  <div className="absolute top-1.5 inset-x-1.5 z-20 flex items-center justify-between pointer-events-none">
                    {/* Left: Drag Handle & Index Badge */}
                    <div className="flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                      <GripVertical size={12} className="text-slate-300" />
                      <span>#{idx + 1}</span>
                    </div>

                    {/* Right: Overlay Status & Delete Action Button Box */}
                    <div className="flex items-center gap-1 pointer-events-auto">
                      {slide.enableOverlay !== false ? (
                        <span className="rounded-md bg-[#1a5d9c]/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs shadow-xs">
                          Overlay ({Math.round((slide.overlayOpacity ?? 0.6) * 100)}%)
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs shadow-xs">
                          Clean
                        </span>
                      )}

                      <button
                        type="button"
                        title="Delete This Slide"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(idx);
                        }}
                        className="flex items-center justify-center rounded-md bg-red-600 text-white p-1 hover:bg-red-700 shadow-md transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Move Left / Right Controls on Hover */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlideOrder(idx, idx - 1);
                      }}
                      className="rounded-full bg-black/75 p-1 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Left"
                    >
                      <ArrowLeft size={13} />
                    </button>

                    <button
                      type="button"
                      disabled={idx === slides.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlideOrder(idx, idx + 1);
                      }}
                      className="rounded-full bg-black/75 p-1 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move Right"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Bottom Footer Title Bar */}
                  <div className={`absolute inset-x-0 bottom-0 z-20 px-2 py-1 text-[10px] font-bold text-white truncate text-center backdrop-blur-xs ${isEditing ? "bg-[#1a5d9c]/90" : "bg-black/75"
                    }`}>
                    {isEditing ? "Currently Editing" : slide.h1 || `Slide ${idx + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Slide Detail Editor */}
        <div className="rounded-xl border border-[#1a5d9c]/30 bg-slate-50/80 p-5 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h4 className="text-xs font-bold text-[#102a4c] flex items-center gap-2">
              Editing Slide #{activeSlideIdx + 1} Configuration
            </h4>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-semibold">
                Slide {activeSlideIdx + 1} of {slides.length}
              </span>
              <button
                type="button"
                onClick={() => removeSlide(activeSlideIdx)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
              >
                <Trash2 size={13} /> Delete Slide #{activeSlideIdx + 1}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Banner Image URL */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Slide Banner Image URL</label>
              <input
                type="text"
                value={currentSlide.bannerUrl || ""}
                onChange={(e) => updateCurrentSlideField("bannerUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#1a5d9c]"
              />
            </div>

            {/* Per-Slide Text Visibility Toggle */}
            <div className="sm:col-span-2 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-[#102a4c] flex items-center gap-1.5">
                  {currentSlide.showText !== false ? <Eye size={15} className="text-[#1a5d9c]" /> : <EyeOff size={15} className="text-slate-400" />}
                  Slide Text Overlay Visibility
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Show or hide H1, H2, and Description text on this slide. Hide to display a clean poster image.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={currentSlide.showText !== false}
                  onChange={(e) => updateCurrentSlideField("showText", e.target.checked)}
                  className="size-4 rounded text-[#1a5d9c] focus:ring-[#1a5d9c] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#102a4c]">
                  {currentSlide.showText !== false ? "Show Text" : "Hide Text (Clean Poster)"}
                </span>
              </label>
            </div>

            {/* Slide Text Inputs & Font Size Controllers */}
            {currentSlide.showText !== false && (
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
                {/* 1. Title / Green Badge Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-700 block">
                      Title (Green Badge)
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. ADMISSIONS OPEN 2026–27"
                    value={currentSlide.title || ""}
                    onChange={(e) => updateCurrentSlideField("title", e.target.value)}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs font-bold text-emerald-800 outline-none focus:border-emerald-500"
                  />
                  {/* Font Size Selector */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Size:</span>
                    {[
                      { label: "S", value: "sm" },
                      { label: "M", value: "md" },
                      { label: "L", value: "lg" },
                      { label: "XL", value: "xl" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateCurrentSlideField("fontSizeTitle", opt.value)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          (currentSlide.fontSizeTitle || "md") === opt.value
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. H1 Main Heading (White Text) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      H1 Main Heading (White Text)
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Where Curiosity Meets"
                    value={currentSlide.h1 || ""}
                    onChange={(e) => updateCurrentSlideField("h1", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#102a4c] outline-none focus:border-[#1a5d9c]"
                  />
                  {/* Font Size Selector */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Size:</span>
                    {[
                      { label: "S", value: "sm" },
                      { label: "M", value: "md" },
                      { label: "L", value: "lg" },
                      { label: "XL", value: "xl" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateCurrentSlideField("fontSizeH1", opt.value)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          (currentSlide.fontSizeH1 || "md") === opt.value
                            ? "bg-[#1a5d9c] text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. H2 Secondary Heading (Yellow Text) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-700 block">
                      H2 Secondary Heading (Yellow Text)
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Excellence"
                    value={currentSlide.h2 || ""}
                    onChange={(e) => updateCurrentSlideField("h2", e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs font-bold text-amber-800 outline-none focus:border-amber-500"
                  />
                  {/* Font Size Selector */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Size:</span>
                    {[
                      { label: "S", value: "sm" },
                      { label: "M", value: "md" },
                      { label: "L", value: "lg" },
                      { label: "XL", value: "xl" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateCurrentSlideField("fontSizeH2", opt.value)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                          (currentSlide.fontSizeH2 || "md") === opt.value
                            ? "bg-amber-500 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Description Paragraph */}
                <div className="sm:col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Description Text Paragraph
                    </label>
                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">Size:</span>
                      {[
                        { label: "S", value: "sm" },
                        { label: "M", value: "md" },
                        { label: "L", value: "lg" },
                        { label: "XL", value: "xl" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateCurrentSlideField("fontSizeDescription", opt.value)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            (currentSlide.fontSizeDescription || "md") === opt.value
                              ? "bg-slate-800 text-white shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="e.g. Empowering young minds with knowledge, character, creativity and confidence."
                    value={currentSlide.description || ""}
                    onChange={(e) => updateCurrentSlideField("description", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c] resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Per-Slide Overlay Configuration */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="text-xs font-bold text-[#102a4c] flex items-center gap-1.5">
                <Sliders size={14} className="text-[#1a5d9c]" /> Per-Slide Overlay Toggle & Opacity Settings
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={currentSlide.enableOverlay !== false}
                  onChange={(e) => updateCurrentSlideField("enableOverlay", e.target.checked)}
                  className="size-3.5 rounded text-[#1a5d9c] focus:ring-[#1a5d9c] cursor-pointer"
                />
                <span className="text-[11px] font-bold text-[#102a4c]">
                  {currentSlide.enableOverlay !== false ? "Overlay ON" : "Overlay OFF (100% Clean Image)"}
                </span>
              </label>
            </div>

            {currentSlide.enableOverlay !== false ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Overlay Opacity ({Math.round((currentSlide.overlayOpacity ?? 0.6) * 100)}%)</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentSlide.overlayOpacity ?? 0.6}
                      onChange={(e) => updateCurrentSlideField("overlayOpacity", parseFloat(e.target.value))}
                      className="w-14 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5 text-[11px] text-center"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={currentSlide.overlayOpacity ?? 0.6}
                    onChange={(e) => updateCurrentSlideField("overlayOpacity", parseFloat(e.target.value))}
                    className="w-full accent-[#1a5d9c] cursor-pointer"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Overlay Tint Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentSlide.overlayColor?.startsWith("#") ? currentSlide.overlayColor : "#0a192f"}
                      onChange={(e) => updateCurrentSlideField("overlayColor", e.target.value)}
                      className="size-7 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={currentSlide.overlayColor || "#0a192f"}
                      onChange={(e) => updateCurrentSlideField("overlayColor", e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => updateCurrentSlideField("overlayColor", preset.value)}
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer ${currentSlide.overlayColor === preset.value
                          ? "border-[#1a5d9c] bg-[#1a5d9c] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: preset.value }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 border border-emerald-200">
                <ShieldAlert size={16} className="text-emerald-600 shrink-0" />
                <span>
                  <strong>100% Clean Image Mode:</strong> Overlay tint and background gradient are completely disabled (0% opacity). The banner image will render 100% pristine and untouched.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloudinary Gallery Modal */}
      <CloudinaryGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectImage={(url) => {
          addNewSlide(url);
          setIsGalleryOpen(false);
        }}
        title="Choose Hero Slide Image from Gallery"
      />
    </div>
  );
}
