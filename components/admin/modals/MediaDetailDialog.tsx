"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  SlidersHorizontal,
  LoaderCircle,
  FileSpreadsheet,
  FileText,
  Music,
  Video,
} from "lucide-react";
import { getFileType } from "@/components/admin/CloudinaryGalleryModal";
import {
  getCloudinaryPdfThumbnailUrl,
  isPdfFile,
  isWordFile,
  isExcelFile,
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
  if (keyName === "parentId") {
    if (item.parentTitle) return <span className="font-semibold text-slate-800">{String(item.parentTitle)}</span>;
    if (typeof item.parent === "object" && item.parent && "title" in (item.parent as object)) {
      return <span className="font-semibold text-slate-800">{String((item.parent as any).title)}</span>;
    }
    const rawVal = typeof val === "object" && val && "_id" in (val as object) ? String((val as any)._id) : String(val ?? "");
    if (!rawVal || rawVal === "null" || rawVal === "undefined" || Number(item.level) === 1) {
      return <span className="text-slate-400 italic text-xs">None (Root Level 1 Item)</span>;
    }
    if (typeof item.parent === "object" && item.parent && "menuId" in (item.parent as object)) {
      return <span className="font-semibold text-slate-800">{String((item.parent as any).menuId)}</span>;
    }
    return <span className="font-semibold text-slate-800">Parent Item</span>;
  }

  if (keyName === "id") {
    const publicRef = item.publicId || item.menuId || item.applicationNo;
    if (publicRef) {
      return <code className="font-mono font-bold text-[#1a5d9c]">{String(publicRef)}</code>;
    }
  }

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

  if (
    typeof val === "string" &&
    (val.startsWith("http://") ||
      val.startsWith("https://") ||
      (val.startsWith("/") &&
        (/\.(jpg|jpeg|png|webp|gif|svg|pdf|doc|docx)$/i.test(val) ||
          val.includes("/Student/") ||
          val.includes("/Staff/") ||
          val.includes("/Careers/") ||
          val.includes("/AdmissionDocuments/"))))
  ) {
    const fullUrl = imageUrl(val);
    const isDoc = isDocumentFile(val) || isPdfFile(val);
    const isImg =
      (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(val) ||
        val.includes("cloudinary") ||
        val.includes("/uploads/") ||
        keyName === "avatar") &&
      !isDoc;

    if (isImg) {
      return (
        <div className="flex items-center gap-3 font-sans">
          <SmartFileThumbnail
            url={fullUrl}
            alt={keyName}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-bold text-[#1a5d9c] hover:underline block"
            >
              {val}
            </a>
            <span className="text-[10px] text-slate-400 font-medium">Image Attachment</span>
          </div>
        </div>
      );
    }

    if (isDoc) {
      return (
        <div className="flex items-center gap-3 font-sans">
          <SmartFileThumbnail
            url={fullUrl}
            alt={keyName}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-bold text-[#1a5d9c] hover:underline block"
            >
              {val}
            </a>
            <span className="text-[10px] text-slate-400 font-medium">Document / Attachment</span>
          </div>
        </div>
      );
    }

    return (
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-xs font-bold text-[#1a5d9c] hover:underline font-sans"
      >
        {val}
      </a>
    );
  }

  if (Array.isArray(val)) {
    const isUrlArray =
      val.length > 0 &&
      val.every(
        (itemVal) =>
          typeof itemVal === "string" &&
          (itemVal.startsWith("http://") ||
            itemVal.startsWith("https://") ||
            itemVal.startsWith("/") ||
            /\.(jpg|jpeg|png|webp|gif|svg|pdf|doc|docx)$/i.test(itemVal))
      );

    if (isUrlArray) {
      return (
        <div className="flex flex-col gap-2.5 font-sans">
          {val.map((itemVal, i) => {
            const strVal = String(itemVal);
            const fullUrl = imageUrl(strVal);
            return (
              <div key={i} className="flex items-center gap-3 p-1.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <SmartFileThumbnail
                  url={fullUrl}
                  alt={`${keyName}-${i}`}
                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs font-bold text-[#1a5d9c] hover:underline block"
                  >
                    {strVal}
                  </a>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Document {i + 1} of {val.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

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
  isDeleting = false,
  onClose,
  onEdit,
  onDelete,
}: {
  item: RecordItem;
  resource?: Resource;
  isDeleting?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);

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
  const resolvedUrl = getCloudinaryInlineViewerUrl(primaryUrl) || (primaryUrl ? imageUrl(primaryUrl) : "");
  const title = String(
    item.eventName || item.title || item.name || item.originalname || item.album || item.key || "Record Item"
  );
  const album = String(item.eventType || item.album || item.category || "General");
  const fileType = getFileType(primaryUrl, title);
  const isPdf = isPdfFile(primaryUrl, title);
  const isWord = isWordFile(primaryUrl, title);
  const isExcel = isExcelFile(primaryUrl, title);
  const isDoc = isDocumentFile(primaryUrl, title) || fileType === "document";
  const isImage = fileType === "image" && !isPdf && !isWord && !isExcel && !isDoc;
  const pagePreviewUrl = getPreviewUrl(item);

  const copyUrl = () => {
    const urlToCopy = resolvedUrl || primaryUrl;
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
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
              <div className="relative flex min-h-[220px] max-h-[380px] w-full items-center justify-center bg-slate-900 p-4 overflow-hidden">
                {isImage ? (
                  <div className="relative flex h-full max-h-[350px] w-full items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(primaryUrl)}
                      alt={title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/Settings/Home/hero-campus.png";
                      }}
                      className="max-h-[350px] max-w-full w-auto rounded-xl object-contain shadow-2xl"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500/20 via-red-500/10 to-rose-950/40 border border-rose-500/30 text-rose-400 shadow-xl mb-3">
                      <FileText size={44} className="text-rose-500 drop-shadow-md" />
                      <span className="absolute -bottom-2 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                        PDF
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-sm mb-1">{title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{primaryUrl}</p>
                  </div>
                ) : isWord ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-950/40 border border-blue-500/30 text-blue-400 shadow-xl mb-3">
                      <FileText size={44} className="text-blue-400 drop-shadow-md" />
                      <span className="absolute -bottom-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                        DOCX
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-sm mb-1">{title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{primaryUrl}</p>
                  </div>
                ) : isExcel ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-xl mb-3">
                      <FileSpreadsheet size={44} className="text-emerald-400 drop-shadow-md" />
                      <span className="absolute -bottom-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                        SHEET
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-sm mb-1">{title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{primaryUrl}</p>
                  </div>
                ) : fileType === "video" ? (
                  <video src={resolvedUrl || primaryUrl} controls className="max-h-[350px] max-w-full rounded-xl shadow-lg" />
                ) : fileType === "audio" ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-950/40 border border-purple-500/30 text-purple-400 shadow-xl mb-3">
                      <Music size={36} className="text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 max-w-sm mb-3">{title}</h3>
                    <audio src={resolvedUrl || primaryUrl} controls className="w-full max-w-sm" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800 border border-slate-700 text-slate-400 shadow-xl mb-3">
                      <FileText size={36} className="text-slate-400" />
                      <span className="absolute -bottom-2 rounded-full bg-slate-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-200 shadow-md">
                        FILE
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 max-w-sm mb-1">{title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">{primaryUrl}</p>
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
                      <SmartFileThumbnail
                        url={u}
                        alt={`${title}-${idx}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Preview Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-sm">{resolvedUrl || primaryUrl}</span>
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
                    href={resolvedUrl || primaryUrl}
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
                  disabled={isDeleting}
                  onClick={() => {
                    onDelete();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                >
                  {isDeleting ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin text-red-600" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} className="text-red-500" />
                      <span>Delete</span>
                    </>
                  )}
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
    </div>
  );
}
