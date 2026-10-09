"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { getFileType } from "@/components/admin/CloudinaryGalleryModal";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { PdfCanvasThumbnail } from "@/components/ui/PdfCanvasThumbnail";
import {
  getCloudinaryPdfThumbnailUrl,
  isPdfFile,
  isDocumentFile,
  getCloudinaryInlineViewerUrl,
} from "@/lib/file-preview";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";
import { imageUrl } from "@/lib/site-data";
import { RecordItem, Resource } from "../types/admin.types";
import { titleCase, decodeHtmlEntities, getPreviewUrl } from "../utils/admin.helpers";

export function StructuredDetailValue({
  keyName,
  val,
  item,
}: {
  keyName: string;
  val: unknown;
  item: RecordItem;
}) {
  if (val === null || val === undefined || val === "") {
    return <span className="text-slate-400 italic text-xs">—</span>;
  }

  if (typeof val === "boolean") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
          val ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {val ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof val === "string") {
    const decoded = decodeHtmlEntities(val).trim();
    const isHtml =
      decoded.includes("<") &&
      decoded.includes(">") &&
      (/<[a-z][\s\S]*>/i.test(decoded) ||
        decoded.includes("<div") ||
        decoded.includes("<p") ||
        decoded.includes("<span") ||
        decoded.includes("<table") ||
        decoded.includes("<center") ||
        decoded.includes("<img") ||
        decoded.includes("<h") ||
        decoded.includes("<section") ||
        decoded.includes("<br"));

    if (isHtml) {
      return (
        <div
          className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-800 max-h-[500px] overflow-y-auto leading-relaxed font-sans shadow-xs"
          dangerouslySetInnerHTML={{ __html: decoded }}
        />
      );
    }
  }

  if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
    const isImg =
      (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(val) ||
      val.includes("cloudinary") ||
      val.includes("/uploads/")) && !isDocumentFile(val);
    if (isImg) {
      return (
        <div className="flex items-center gap-3 font-sans">
          <SmartFileThumbnail
            url={imageUrl(val)}
            alt={keyName}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <a
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-bold text-[#1a5d9c] hover:underline block"
            >
              {val}
            </a>
            <span className="text-[10px] text-slate-400 font-medium">Asset Attachment</span>
          </div>
        </div>
      );
    }
    return (
      <a
        href={val}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-xs font-bold text-[#1a5d9c] hover:underline font-sans"
      >
        {val}
      </a>
    );
  }

  if (Array.isArray(val)) {
    return (
      <div className="flex flex-wrap gap-1 font-sans">
        {val.map((itemVal, i) => (
          <span
            key={i}
            className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 font-medium"
          >
            {typeof itemVal === "object" ? JSON.stringify(itemVal) : String(itemVal)}
          </span>
        ))}
      </div>
    );
  }

  let parsedObj: Record<string, any> | null = null;
  if (typeof val === "string" && (val.trim().startsWith("{") || val.trim().startsWith("["))) {
    try {
      parsedObj = JSON.parse(val);
    } catch {}
  } else if (typeof val === "object" && val !== null) {
    parsedObj = val as Record<string, any>;
  }

  if (parsedObj && typeof parsedObj === "object") {
    const entries = Object.entries(parsedObj);
    return (
      <div className="space-y-2 font-sans">
        {entries.map(([k, v]) => {
          const isUrlOrPath =
            typeof v === "string" &&
            (v.startsWith("http://") ||
              v.startsWith("https://") ||
              v.startsWith("/") ||
              k.toLowerCase().endsWith("url") ||
              k.toLowerCase().endsWith("logo") ||
              k.toLowerCase().endsWith("path") ||
              k.toLowerCase().endsWith("badge"));

          if (isUrlOrPath && typeof v === "string" && v.trim()) {
            const finalLink = imageUrl(v);
            return (
              <div key={k} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <SmartFileThumbnail
                  url={finalLink}
                  alt={k}
                  className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-700 capitalize">{titleCase(k)} Preview Link</p>
                  <a
                    href={finalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a5d9c] hover:underline truncate max-w-full"
                  >
                    <span className="truncate">{v}</span>
                    <ExternalLink size={13} className="shrink-0 text-[#1a5d9c]" />
                  </a>
                </div>
              </div>
            );
          }

          return (
            <div
              key={k}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60 text-xs"
            >
              <span className="font-semibold text-slate-600 capitalize">{titleCase(k)}</span>
              <span className="font-bold text-slate-800">
                {typeof v === "boolean" ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      v ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </span>
                ) : (
                  String(v ?? "—")
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="font-semibold text-slate-800 font-sans">{String(val ?? "—")}</span>;
}

export function MediaDetailDialog({
  item,
  resource,
  onClose,
  onEdit,
  onDelete,
}: {
  item: RecordItem;
  resource?: Resource;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const getMediaUrls = (val: unknown): string[] => {
    const list: string[] = [];
    if (Array.isArray(val)) list.push(...val.map(String));
    else if (typeof val === "string" && val.trim()) list.push(val.trim());

    if (item.profileImageUrl && typeof item.profileImageUrl === "string") list.push(item.profileImageUrl);
    if (item.avatar && typeof item.avatar === "string") list.push(item.avatar);
    if (item.image && typeof item.image === "string") list.push(item.image);
    if (item.photo && typeof item.photo === "string") list.push(item.photo);
    if (item.marksheetUrl && typeof item.marksheetUrl === "string") list.push(item.marksheetUrl);
    if (Array.isArray(item.documents)) {
      item.documents.forEach((d: unknown) => {
        if (typeof d === "string" && d.trim()) list.push(d.trim());
      });
    }

    if (item.value) {
      let itemValue = item.value;
      if (typeof itemValue === "string") {
        try {
          itemValue = JSON.parse(itemValue);
        } catch {}
      }
      if (itemValue && typeof itemValue === "object") {
        const vObj = itemValue as Record<string, any>;
        if (typeof vObj.logoUrl === "string" && vObj.logoUrl) list.push(vObj.logoUrl);
        if (typeof vObj.secondaryLogoUrl === "string" && vObj.secondaryLogoUrl) list.push(vObj.secondaryLogoUrl);
        if (typeof vObj.badgeUrl === "string" && vObj.badgeUrl) list.push(vObj.badgeUrl);
        if (typeof vObj.trustLogoUrl === "string" && vObj.trustLogoUrl) list.push(vObj.trustLogoUrl);
        if (typeof vObj.partnerLogoUrl === "string" && vObj.partnerLogoUrl) list.push(vObj.partnerLogoUrl);
        if (typeof vObj.fileUrl === "string" && vObj.fileUrl) list.push(vObj.fileUrl);
        if (typeof vObj.url === "string" && vObj.url) list.push(vObj.url);
      }
    }

    if (item.message && typeof item.message === "string") {
      const matched = item.message.match(/https?:\/\/[^\s"'>\)]+/gi) || [];
      matched.forEach((url) => {
        if (url.includes("cloudinary") || url.includes("/uploads/")) {
          list.push(url);
        }
      });
    }

    return Array.from(new Set(list.filter((s) => s && (s.startsWith("http") || s.startsWith("/")))));
  };

  const urls = getMediaUrls(
    item.fileUrl ||
      item.url ||
      item.path ||
      item.attachmentUrl ||
      item.avatar ||
      item.profileImageUrl ||
      item.image ||
      item.photo
  );
  const primaryUrl = urls[activeUrlIndex] || urls[0] || "";
  const title = String(
    item.eventName || item.title || item.name || item.originalname || item.album || item.key || "Record Item"
  );
  const album = String(item.eventType || item.album || item.category || "General");
  const fileType = getFileType(primaryUrl);
  const isPdf = isPdfFile(primaryUrl);
  const pagePreviewUrl = getPreviewUrl(item);

  const copyUrl = () => {
    if (!primaryUrl) return;
    navigator.clipboard.writeText(primaryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5d9c] border border-blue-200/50">
                {resource?.label || album || "Record Inspector"}
              </span>
              {pagePreviewUrl && (
                <a
                  href={pagePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition"
                  title="Open live page preview in new tab"
                >
                  <ExternalLink size={11} /> Live Page Preview
                </a>
              )}
            </div>
            <h2 className="mt-1 truncate text-lg font-bold text-[#102a4c]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Media Preview Box */}
          {primaryUrl && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5 relative group">
              <div className="relative flex min-h-[220px] max-h-[380px] w-full items-center justify-center bg-slate-900 p-2">
                {fileType === "image" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl(primaryUrl)}
                    alt={title}
                    className="max-h-[360px] w-auto rounded-lg object-contain shadow-lg"
                  />
                ) : isPdf ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                    <PdfCanvasThumbnail
                      url={getCloudinaryPdfThumbnailUrl(primaryUrl)}
                      className="h-44 w-auto rounded-lg shadow-md border border-slate-700 object-contain mb-3"
                    />
                    <p className="text-xs text-slate-300 font-medium max-w-md truncate">{primaryUrl}</p>
                    <button
                      type="button"
                      onClick={() => setIsViewerOpen(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#102a4c] transition"
                    >
                      <Eye size={14} /> Open Full Screen PDF Viewer
                    </button>
                  </div>
                ) : fileType === "video" ? (
                  <video src={primaryUrl} controls className="max-h-[360px] w-full rounded-lg" />
                ) : fileType === "audio" ? (
                  <div className="p-8 w-full max-w-md">
                    <audio src={primaryUrl} controls className="w-full" />
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 font-medium text-xs">
                    File preview not available directly in browser frame.
                  </div>
                )}
              </div>

              {/* Thumbnail Selector if multiple URLs */}
              {urls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-200 bg-slate-100 p-2">
                  {urls.map((u, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveUrlIndex(idx)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeUrlIndex === idx ? "border-[#1a5d9c] ring-2 ring-[#1a5d9c]/20" : "border-slate-300 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl(u)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Preview Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-sm">{primaryUrl}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                  <a
                    href={getCloudinaryInlineViewerUrl(primaryUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5d9c] px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-[#102a4c] transition"
                  >
                    <ExternalLink size={14} />
                    <span>Open Link</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Record Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100/70 text-[#1a5d9c]">
                  <SlidersHorizontal size={14} />
                </div>
                <span className="font-bold text-slate-700">Record Actions</span>
                {Boolean(item.status) && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1a5d9c] border border-blue-200/60">
                    {String(item.status)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 cursor-pointer active:scale-95"
                >
                  <Pencil size={14} className="text-slate-500" /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:border-red-300 hover:text-red-700 cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} className="text-red-500" /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Complete Metadata Details */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Complete Record Details</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(item)
                    .filter(([key]) => key !== "_id" && key !== "__v")
                    .map(([key, val]) => (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="w-1/3 whitespace-nowrap bg-slate-50/70 px-4 py-3 font-bold text-slate-600">
                          {titleCase(key)}
                        </td>
                        <td className="break-all px-4 py-3 text-slate-800">
                          <StructuredDetailValue keyName={key} val={val} item={item} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <FileViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        url={primaryUrl}
        title={title}
      />
    </div>
  );
}
