"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Eye, Check, Palette, AlignLeft, AlignCenter, AlignRight, LayoutTemplate, UploadCloud, LoaderCircle } from "lucide-react";
import { generateFrameTemplateHtml } from "./richtext.helpers";
import { getAssetUrl } from "@/lib/utils";
import axios from "axios";

interface FrameStudioModalProps {
  isOpen: boolean;
  initialImageUrl?: string;
  onClose: () => void;
  onOpenGallery: () => void;
  onInsertHtml: (html: string) => void;
}

export function FrameStudioModal({
  isOpen,
  initialImageUrl = "",
  onClose,
  onOpenGallery,
  onInsertHtml,
}: FrameStudioModalProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialImageUrl ? [initialImageUrl] : []
  );
  const [bulkLayout, setBulkLayout] = useState<"auto" | "grid-2" | "grid-3" | "featured-hero">("auto");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionSubtitle, setCollectionSubtitle] = useState("");

  const [templateStyle, setTemplateStyle] = useState<"portrait-badge" | "floating-accent" | "modern-gradient" | "polaroid">("portrait-badge");
  const [showHeading, setShowHeading] = useState(false);
  const [name, setName] = useState("");
  const [showSubHeading, setShowSubHeading] = useState(false);
  const [designation, setDesignation] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [description, setDescription] = useState("");

  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [maxWidth, setMaxWidth] = useState("380px");

  const [objectPositionX, setObjectPositionX] = useState<number>(50);
  const [objectPositionY, setObjectPositionY] = useState<number>(0);
  const [objectFit, setObjectFit] = useState<"cover" | "contain" | "fill">("cover");
  const [aspectRatio, setAspectRatio] = useState<string>("3/4");
  const [maxHeight, setMaxHeight] = useState<string>("380px");
  const [zoomScale, setZoomScale] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && initialImageUrl) {
      setImageUrl(initialImageUrl);
      setImageUrls((prev) => (prev.includes(initialImageUrl) ? prev : [...prev, initialImageUrl]));
    }
  }, [isOpen, initialImageUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ips_admin_token") ||
            localStorage.getItem("admin_token") ||
            localStorage.getItem("token") ||
            ""
          : "";
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("album", "FrameStudio");

          const res = await axios.post(`${API_URL}/uploads`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const rawUrl = res.data?.fileUrl || res.data?.secure_url || res.data?.url || res.data?.data?.fileUrl;
          if (rawUrl) {
            uploadedUrls.push(getAssetUrl(rawUrl));
          } else {
            uploadedUrls.push(URL.createObjectURL(file));
          }
        } catch {
          uploadedUrls.push(URL.createObjectURL(file));
        }
      }

      if (uploadedUrls.length > 0) {
        setImageUrl(uploadedUrls[0]);
        setImageUrls((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err) {
      console.error("Direct frame image upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const previewHtml = generateFrameTemplateHtml({
    mode,
    imageUrl,
    imageUrls,
    bulkLayout,
    collectionTitle,
    collectionSubtitle,
    templateStyle,
    name,
    designation,
    subtitle,
    description,
    showHeading,
    showSubHeading,
    showSubtitle,
    showDescription,
    accentColor,
    alignment,
    maxWidth,
    maxHeight,
    objectPosition: `${objectPositionX}% ${objectPositionY}%`,
    objectFit,
    aspectRatio,
    zoomScale,
  });

  const handleInsert = () => {
    if (mode === "single" && !imageUrl.trim()) {
      onOpenGallery();
      return;
    }
    if (mode === "bulk" && (!imageUrls || imageUrls.length === 0)) {
      onOpenGallery();
      return;
    }
    onInsertHtml(previewHtml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
                Image Frame & Card Studio
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Interactive Templates
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose custom frame styles, executive portrait badges, floating accents & customizable captions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Controls */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto border-r border-slate-800 bg-slate-900/60 p-5 space-y-5 scrollbar-thin">

            {/* Mode Selector (Single vs Bulk Collection) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  mode === "single"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <ImageIcon size={14} />
                <span>Single Photo Card</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  mode === "bulk"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <LayoutTemplate size={14} />
                <span>Bulk Collection ({imageUrls.length})</span>
              </button>
            </div>

            {/* Single Image Selector */}
            {mode === "single" ? (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Frame Photo / Image Source
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={imageUrl}
                    placeholder="No image selected — click Gallery or Upload..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs font-mono text-slate-400 outline-none cursor-not-allowed select-none"
                  />
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="shrink-0 flex items-center gap-1 rounded-xl bg-red-600/20 border border-red-500/30 px-3 py-2 text-xs font-extrabold text-red-400 hover:bg-red-600/30 transition cursor-pointer"
                      title="Clear selected image"
                    >
                      <X size={14} />
                      <span>Clear</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onOpenGallery}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-amber-500 transition cursor-pointer shadow-md"
                    title="Pick or upload image from Cloudinary Media Gallery"
                  >
                    <ImageIcon size={14} />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-extrabold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer shadow-md"
                    title="Upload local image directly from device"
                  >
                    {uploading ? <LoaderCircle size={14} className="animate-spin text-amber-400" /> : <UploadCloud size={14} className="text-amber-400" />}
                    <span>{uploading ? "Uploading..." : "Upload"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Bulk Collection Manager */
              <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Bulk Image Collection ({imageUrls.length} Items)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={onOpenGallery}
                      className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-500 transition cursor-pointer"
                    >
                      <ImageIcon size={12} />
                      <span>Add from Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {uploading ? <LoaderCircle size={12} className="animate-spin text-amber-400" /> : <UploadCloud size={12} className="text-amber-400" />}
                      <span>Upload Files</span>
                    </button>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {imageUrls.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative shrink-0 w-16 h-16 rounded-xl border border-slate-700 overflow-hidden group bg-slate-950">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Remove photo from collection"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 font-medium py-2.5 px-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                    No images added yet. Click <strong>Add from Gallery</strong> or <strong>Upload Files</strong> above.
                  </div>
                )}

                {/* Bulk Grid Layout Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bulk Collection Layout Template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "auto" as const, title: "Auto Responsive Grid", sub: "Adapts to 1, 3, 5, 7, odd/even items" },
                      { id: "grid-3" as const, title: "3-Col Grid", sub: "Standard 3 Column Showcase" },
                      { id: "grid-2" as const, title: "2-Col Grid", sub: "Large 2 Column Showcase" },
                      { id: "featured-hero" as const, title: "Hero Banner", sub: "1 Hero + Side Cards Grid" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setBulkLayout(l.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          bulkLayout === l.id
                            ? "border-amber-500 bg-amber-600/20 text-white font-bold"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold">{l.title}</div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{l.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collection Titles */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Collection Main Heading</label>
                    <input
                      type="text"
                      value={collectionTitle}
                      onChange={(e) => setCollectionTitle(e.target.value)}
                      placeholder="e.g. Photo Gallery Showcase"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Collection Subtitle</label>
                    <input
                      type="text"
                      value={collectionSubtitle}
                      onChange={(e) => setCollectionSubtitle(e.target.value)}
                      placeholder="e.g. Explore our campus activities"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Template Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Frame Template Style
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: "portrait-badge" as const,
                    title: "Executive Badge",
                    sub: "Gold Corner Curve & Overlapping Navy Badge",
                  },
                  {
                    id: "floating-accent" as const,
                    title: "Floating Accents",
                    sub: "Soft Circle & Gold Pill Background Accents",
                  },
                  {
                    id: "modern-gradient" as const,
                    title: "Modern Gradient",
                    sub: "Top Gradient Accent Bar & Sleek Card",
                  },
                  {
                    id: "polaroid" as const,
                    title: "Polaroid Showcase",
                    sub: "Clean Photo Margin & Bottom Caption Area",
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplateStyle(tpl.id);
                      if (tpl.id === "portrait-badge") setMaxWidth("380px");
                      if (tpl.id === "floating-accent") setMaxWidth("560px");
                      if (tpl.id === "modern-gradient") setMaxWidth("480px");
                      if (tpl.id === "polaroid") setMaxWidth("420px");
                    }}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer ${templateStyle === tpl.id
                        ? "border-amber-500 bg-amber-500/10 text-white ring-2 ring-amber-500/30"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                  >
                    <span className="text-xs font-extrabold flex items-center justify-between">
                      {tpl.title}
                      {templateStyle === tpl.id && <Check size={14} className="text-amber-400" />}
                    </span>
                    <span className="text-[10px] mt-1 leading-tight text-slate-400">
                      {tpl.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Text Fields */}
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                  Card Text & Caption Details
                </span>
                <span className="text-[10px] text-slate-400">
                  Toggle checkboxes to include or omit text
                </span>
              </div>

              {/* Heading / Main Title */}
              <div className="space-y-1">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showHeading}
                      onChange={(e) => setShowHeading(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
                    />
                    Heading (Name / Main Title)
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">{showHeading ? "Enabled" : "Disabled"}</span>
                </label>
                {showHeading && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mrs. Suman Dalmia"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Sub Heading / Role */}
              <div className="space-y-1">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showSubHeading}
                      onChange={(e) => setShowSubHeading(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
                    />
                    Sub Heading (Designation / Role)
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">{showSubHeading ? "Enabled" : "Disabled"}</span>
                </label>
                {showSubHeading && (
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Chairman"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Subtitle / Organization */}
              <div className="space-y-1">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showSubtitle}
                      onChange={(e) => setShowSubtitle(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
                    />
                    Subtitle / Organization
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">{showSubtitle ? "Enabled" : "Disabled"}</span>
                </label>
                {showSubtitle && (
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Indian Public School"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Description / Caption Paragraph */}
              <div className="space-y-1">
                <label className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showDescription}
                      onChange={(e) => setShowDescription(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
                    />
                    Description / Extended Caption
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">{showDescription ? "Enabled" : "Disabled"}</span>
                </label>
                {showDescription && (
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Write a brief description or caption..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 resize-none"
                  />
                )}
              </div>
            </div>

            {/* Colors & Layout */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Palette size={13} className="text-amber-400" /> Accent Line Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: "Gold", value: "#f59e0b" },
                    { name: "Navy", value: "#102a4c" },
                    { name: "Blue", value: "#2563eb" },
                    { name: "Emerald", value: "#059669" },
                    { name: "Crimson", value: "#dc2626" },
                    { name: "Purple", value: "#7c3aed" },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setAccentColor(c.value)}
                      className={`w-6 h-6 rounded-full border transition cursor-pointer ${accentColor === c.value ? "ring-2 ring-white scale-110 border-transparent" : "border-slate-700 hover:scale-105"
                        }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Frame Alignment
                </label>
                <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                  {[
                    { id: "left" as const, Icon: AlignLeft },
                    { id: "center" as const, Icon: AlignCenter },
                    { id: "right" as const, Icon: AlignRight },
                  ].map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAlignment(id)}
                      className={`flex-1 flex justify-center py-1 rounded-lg transition cursor-pointer ${alignment === id ? "bg-amber-600 text-white font-extrabold" : "text-slate-400 hover:text-white"
                        }`}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Frame Width */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Card Width Constraint (Horizontal Size)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["320px", "380px", "480px", "580px", "100%"].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setMaxWidth(w)}
                    className={`rounded-lg border px-3 py-1 text-xs font-bold transition cursor-pointer ${maxWidth === w
                        ? "border-amber-500 bg-amber-600 text-white"
                        : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Visible Portion, Focal Point & Resizing Controls */}
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                  Visible Portion & Focal Point (X / Y / Zoom)
                </span>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {objectPositionX}% X · {objectPositionY}% Y
                </span>
              </div>

              {/* Focal Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                  Quick Visible Focal Area
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: "Top (Face)", x: 50, y: 0 },
                    { label: "Center", x: 50, y: 50 },
                    { label: "Bottom", x: 50, y: 100 },
                    { label: "Left Focus", x: 0, y: 50 },
                    { label: "Right Focus", x: 100, y: 50 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setObjectPositionX(p.x);
                        setObjectPositionY(p.y);
                      }}
                      className={`rounded-lg border py-1.5 text-[10px] font-extrabold transition cursor-pointer text-center ${
                        objectPositionX === p.x && objectPositionY === p.y
                          ? "border-amber-500 bg-amber-600 text-white shadow-sm"
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal & Vertical Focal Sliders */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Horizontal Focus (X-Axis)</span>
                    <span className="text-amber-400 font-mono text-[10px]">{objectPositionX}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={objectPositionX}
                    onChange={(e) => setObjectPositionX(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Vertical Focus (Y-Axis)</span>
                    <span className="text-amber-400 font-mono text-[10px]">{objectPositionY}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={objectPositionY}
                    onChange={(e) => setObjectPositionY(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Object Fit & Aspect Ratio */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Fit & Crop Mode
                  </label>
                  <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                    {[
                      { id: "cover" as const, label: "Cover (Crop)" },
                      { id: "contain" as const, label: "Contain (Whole)" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setObjectFit(f.id)}
                        className={`flex-1 py-1 text-[10px] font-extrabold rounded transition cursor-pointer ${
                          objectFit === f.id
                            ? "bg-amber-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Aspect Ratio (Shape)
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="3/4">3:4 Portrait</option>
                    <option value="1/1">1:1 Square</option>
                    <option value="4/3">4:3 Landscape</option>
                    <option value="16/9">16:9 Widescreen</option>
                    <option value="auto">Auto / Natural</option>
                  </select>
                </div>
              </div>

              {/* Max Height & Zoom Scale */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Frame Max Height</span>
                    <span className="text-amber-400 font-mono text-[10px]">{maxHeight}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={600}
                    step={20}
                    value={parseInt(maxHeight) || 380}
                    onChange={(e) => setMaxHeight(`${e.target.value}px`)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Zoom Scale</span>
                    <span className="text-amber-400 font-mono text-[10px]">{Math.round(zoomScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={2}
                    step={0.05}
                    value={zoomScale}
                    onChange={(e) => setZoomScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 p-6 overflow-y-auto scrollbar-thin max-h-[calc(92vh-130px)]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 shrink-0">
              <span className="text-xs font-extrabold uppercase text-slate-400 flex items-center gap-2">
                <Eye size={15} className="text-amber-400 animate-pulse" /> Live Canvas Frame Preview:
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                WYSIWYG Interactive Output
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner min-h-[380px] overflow-y-auto scrollbar-thin">
              <div
                className="w-full max-w-full flex justify-center py-2"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-xs">
          <div className="text-xs text-slate-400 font-medium">
            Clicking Insert will place this styled frame card directly into your page editor.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2 text-xs font-black text-white hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-600/30 transition cursor-pointer"
            >
              <Check size={16} />
              <span>Insert Frame Card Into Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
