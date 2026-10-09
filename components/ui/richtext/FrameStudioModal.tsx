"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Image as ImageIcon, Eye, Check, Palette, AlignLeft, AlignCenter, AlignRight, LayoutTemplate } from "lucide-react";
import { generateFrameTemplateHtml } from "./richtext.helpers";

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
  const [imageUrl, setImageUrl] = useState(
    initialImageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
  );
  const [templateStyle, setTemplateStyle] = useState<"portrait-badge" | "floating-accent" | "modern-gradient" | "polaroid">("portrait-badge");
  const [name, setName] = useState("Mrs. Suman Dalmia");
  const [designation, setDesignation] = useState("Chairman");
  const [subtitle, setSubtitle] = useState("Indian Public School");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [maxWidth, setMaxWidth] = useState("380px");

  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  if (!isOpen) return null;

  const previewHtml = generateFrameTemplateHtml({
    imageUrl,
    templateStyle,
    name,
    designation,
    subtitle,
    accentColor,
    alignment,
    maxWidth,
  });

  const handleInsert = () => {
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

            {/* Image Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Frame Photo / Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste Image URL or pick from gallery..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-200 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={onOpenGallery}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-amber-500 transition cursor-pointer shadow-md"
                >
                  <ImageIcon size={14} />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

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
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                Card Text & Caption Details
              </span>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Name / Main Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mrs. Suman Dalmia"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Chairman"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Subtitle / Organization
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Indian Public School"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
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
                Card Width Constraint
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
