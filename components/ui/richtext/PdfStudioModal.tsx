"use client";

import React, { useState, useEffect } from "react";
import { FileText, X, Image as ImageIcon, Eye, Check } from "lucide-react";
import { generatePdfCardHtml } from "./richtext.helpers";
import { PdfCanvasThumbnail } from "@/components/ui/PdfCanvasThumbnail";
import { getCloudinaryInlineViewerUrl, normalizePdfUrl } from "@/lib/file-preview";

interface PdfStudioModalProps {
  isOpen: boolean;
  initialPdfUrl?: string;
  onClose: () => void;
  onOpenGallery: () => void;
  onInsertHtml: (html: string) => void;
}

export function PdfStudioModal({
  isOpen,
  initialPdfUrl = "",
  onClose,
  onOpenGallery,
  onInsertHtml,
}: PdfStudioModalProps) {
  const [pdfStudioUrl, setPdfStudioUrl] = useState(normalizePdfUrl(initialPdfUrl));
  const [pdfStudioTheme, setPdfStudioTheme] = useState<"light" | "dark" | "banner" | "badge">("light");
  const [pdfStudioTitle, setPdfStudioTitle] = useState("Official PDF Document");
  const [pdfStudioSubtitle, setPdfStudioSubtitle] = useState("");
  const [pdfStudioButtonText, setPdfStudioButtonText] = useState("Open Document");
  const [pdfStudioMaxHeight, setPdfStudioMaxHeight] = useState(420);

  useEffect(() => {
    if (initialPdfUrl) {
      const normalized = normalizePdfUrl(initialPdfUrl);
      setPdfStudioUrl(normalized);
      const rawFileName = normalized.split("/").pop() || "Official Document";
      const cleanName = rawFileName.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, "").replace(/[-_]/g, " ");
      if (cleanName) {
        setPdfStudioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  }, [initialPdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/20 text-rose-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
                PDF Card Customizer Studio
                <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  Hand Customization
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Customize layout theme, document title, description & action buttons for your PDF embed
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
          <div className="lg:col-span-5 flex flex-col overflow-y-auto border-r border-slate-800 bg-slate-900/60 p-5 space-y-4 scrollbar-thin">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                PDF Document File URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={pdfStudioUrl}
                  placeholder={
                    pdfStudioUrl
                      ? pdfStudioUrl
                      : "No PDF document selected — click Gallery to select..."
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs font-mono text-slate-400 outline-none cursor-not-allowed select-none"
                />
                <button
                  type="button"
                  onClick={onOpenGallery}
                  className="shrink-0 flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                >
                  <ImageIcon size={14} />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Card Theme & Layout Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "light", name: "Modern Light Card", icon: "bi bi-sun-fill", desc: "Clean white card with page preview" },
                  { id: "dark", name: "Dark Executive", icon: "bi bi-moon-stars-fill", desc: "Navy dark theme with glowing border" },
                  { id: "banner", name: "Compact Banner", icon: "bi bi-file-earmark-pdf-fill", desc: "Single row horizontal download bar" },
                  { id: "badge", name: "Minimal Pill Badge", icon: "bi bi-tag-fill", desc: "Rounded pill action link badge" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPdfStudioTheme(t.id as any)}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer ${
                      pdfStudioTheme === t.id
                        ? "border-rose-500 bg-rose-500/15 text-white shadow-md ring-1 ring-rose-500/50"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <i className={`${t.icon} text-rose-400`} />
                      <span>{t.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                value={pdfStudioTitle}
                onChange={(e) => setPdfStudioTitle(e.target.value)}
                placeholder="e.g. Admission Form Session 2026-27"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-100 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Subtitle / Description (Optional)
              </label>
              <input
                type="text"
                value={pdfStudioSubtitle}
                onChange={(e) => setPdfStudioSubtitle(e.target.value)}
                placeholder="e.g. Official application form for Grade Nursery to IX"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Action Button Label
              </label>
              <input
                type="text"
                value={pdfStudioButtonText}
                onChange={(e) => setPdfStudioButtonText(e.target.value)}
                placeholder="e.g. Open Document"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-rose-500"
              />
            </div>

            {pdfStudioTheme !== "badge" && pdfStudioTheme !== "banner" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Page Preview Height
                  </label>
                  <span className="text-xs font-mono font-bold text-rose-400">{pdfStudioMaxHeight}px</span>
                </div>
                <input
                  type="range"
                  min={250}
                  max={650}
                  step={25}
                  value={pdfStudioMaxHeight}
                  onChange={(e) => setPdfStudioMaxHeight(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye size={14} className="text-rose-400" /> Live Interactive Preview:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Theme: {pdfStudioTheme}</span>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5 scrollbar-thin">
              {!pdfStudioUrl ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-2 p-8">
                  <FileText size={48} className="text-slate-700" />
                  <p className="text-xs font-medium">Select a PDF file or paste URL to preview custom card</p>
                </div>
              ) : pdfStudioTheme === "badge" ? (
                <div className="flex items-center justify-center p-8 bg-slate-950 rounded-2xl border border-slate-800">
                  <a
                    href={getCloudinaryInlineViewerUrl(pdfStudioUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/20 px-5 py-2.5 text-sm font-bold text-rose-300 shadow-md hover:bg-rose-500/30 transition"
                  >
                    <span>{pdfStudioTitle || "Official Document"}</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              ) : pdfStudioTheme === "banner" ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-900">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 font-bold text-xs text-rose-600">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 truncate">
                        {pdfStudioTitle || "Official Document"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {pdfStudioSubtitle || "PDF Document • Click to View / Download"}
                      </div>
                    </div>
                  </div>
                  <a
                    href={getCloudinaryInlineViewerUrl(pdfStudioUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#102a4c] transition shrink-0"
                  >
                    {pdfStudioButtonText || "Open Document"} &rarr;
                  </a>
                </div>
              ) : pdfStudioTheme === "dark" ? (
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-400">
                        PDF Document
                      </span>
                      <span className="text-sm font-bold text-white">{pdfStudioTitle}</span>
                    </div>
                    <a
                      href={getCloudinaryInlineViewerUrl(pdfStudioUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-sky-400 transition"
                    >
                      {pdfStudioButtonText || "Open Document"} &rarr;
                    </a>
                  </div>
                  {pdfStudioSubtitle && (
                    <div className="border-b border-slate-800 bg-slate-950 px-5 py-2 text-xs text-slate-400">
                      {pdfStudioSubtitle}
                    </div>
                  )}
                  <div
                    className="flex flex-col items-center justify-center bg-slate-900/60 p-5 overflow-hidden"
                    style={{ minHeight: `${Math.min(pdfStudioMaxHeight, 420)}px` }}
                  >
                    <PdfCanvasThumbnail
                      url={pdfStudioUrl}
                      alt={pdfStudioTitle}
                      className="max-h-[400px] w-auto rounded-lg border border-slate-700 shadow-lg object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                        PDF Document
                      </span>
                      <span className="text-sm font-bold text-slate-900">{pdfStudioTitle}</span>
                    </div>
                    <a
                      href={getCloudinaryInlineViewerUrl(pdfStudioUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#102a4c] transition"
                    >
                      {pdfStudioButtonText || "Open Document"} &rarr;
                    </a>
                  </div>
                  {pdfStudioSubtitle && (
                    <div className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">
                      {pdfStudioSubtitle}
                    </div>
                  )}
                  <div
                    className="flex flex-col items-center justify-center bg-slate-100/70 p-5 overflow-hidden"
                    style={{ minHeight: `${Math.min(pdfStudioMaxHeight, 420)}px` }}
                  >
                    <PdfCanvasThumbnail
                      url={pdfStudioUrl}
                      alt={pdfStudioTitle}
                      className="max-h-[400px] w-auto rounded-lg border border-slate-300 shadow-md object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pdfStudioUrl}
                onClick={() => {
                  if (!pdfStudioUrl) return;
                  const htmlSnippet = generatePdfCardHtml({
                    url: pdfStudioUrl,
                    title: pdfStudioTitle,
                    subtitle: pdfStudioSubtitle,
                    buttonText: pdfStudioButtonText,
                    theme: pdfStudioTheme,
                    maxHeight: pdfStudioMaxHeight,
                  });
                  onInsertHtml(htmlSnippet);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Check size={16} />
                <span>Apply & Insert PDF Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
