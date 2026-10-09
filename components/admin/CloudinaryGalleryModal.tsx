"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, UploadCloud, Check, Image as ImageIcon, LoaderCircle, ExternalLink, Filter, Scissors, Video, Music, FileText, File, Eye, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { getOptionalApi, unwrapCollection, API_URL } from "@/lib/api-client";
import { getAssetUrl } from "@/lib/utils";
import { ImageStudioModal } from "./ImageStudioModal";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { PdfCanvasThumbnail } from "@/components/ui/PdfCanvasThumbnail";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";
import { FileUploadProgressLoader, FileUploadStatus } from "@/components/ui/FileUploadProgressLoader";
import { getCloudinaryPdfThumbnailUrl, isPdfFile, isDocumentFile, isWordFile, isExcelFile, isGoogleDocUrl, isGoogleSheetUrl } from "@/lib/file-preview";

interface CloudinaryGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  title?: string;
}

interface MediaItem {
  id: string;
  url: string;
  title: string;
  category: string;
  directory?: string;
  source: "database" | "cloudinary";
}

export function getFileType(url: string): "image" | "video" | "audio" | "document" {
  if (!url || typeof url !== "string") return "image";
  const lowercaseUrl = url.toLowerCase();
  const cleanUrl = lowercaseUrl.split("?")[0].split("#")[0];

  if (
    cleanUrl.match(/\.(mp4|webm|mov|mkv|avi|ogv)$/) ||
    lowercaseUrl.includes("/video/upload/") ||
    lowercaseUrl.includes("resource_type=video")
  ) {
    return "video";
  }
  if (
    cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/) ||
    lowercaseUrl.includes("/audio/upload/") ||
    lowercaseUrl.includes("resource_type=audio")
  ) {
    return "audio";
  }
  if (
    isDocumentFile(url) ||
    isPdfFile(url) ||
    cleanUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z)$/) ||
    lowercaseUrl.includes("/raw/upload/")
  ) {
    return "document";
  }
  return "image";
}

export function normalizeCategoryKey(raw?: string): string {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.trim();
  if (s.startsWith("/album/")) s = s.replace(/^\/album\//, "");
  if (s.includes("/")) s = s.split("/").pop() || s;
  return s.trim();
}

export function formatCategoryDisplay(cat: string): string {
  if (!cat) return "";
  if (cat === "All" || cat === "AdmissionDocuments") return cat;
  return cat
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}

export function CloudinaryGalleryModal({
  isOpen,
  onClose,
  onSelectImage,
  title = "Cloudinary Media Gallery",
}: CloudinaryGalleryModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Fetch live unified gallery media from school backend /gallery
  useEffect(() => {
    if (!isOpen) return;

    const fetchGalleryMedia = async () => {
      setLoading(true);
      try {
        const galleryRes = await getOptionalApi<any>("/gallery?limit=1000");
        const dbItems = unwrapCollection<any>(galleryRes);

        const fetchedMedia: MediaItem[] = (Array.isArray(dbItems) ? dbItems : []).flatMap(
          (item: any, idx: number): MediaItem[] => {
            const urls = Array.isArray(item.fileUrl)
              ? item.fileUrl
              : typeof item.fileUrl === "string" && item.fileUrl.trim()
                ? [item.fileUrl]
                : [];
            if (urls.length === 0) return [];
            return urls.map((rawUrl: string, uIdx: number) => {
              const url = getAssetUrl(rawUrl);
              const dir = item.directory || item.folder || item.eventType || item.album || item.category || "General";
              const lowerDir = String(dir).toLowerCase();
              const isSettingsAsset = url.toLowerCase().includes("/settings/") || lowerDir.includes("settings") || item.eventType === "Settings";

              return {
                id: item._id || item.id ? `${item._id || item.id}-${uIdx}` : `media-${idx}-${uIdx}`,
                url,
                title: item.eventName || item.title || item.album || `Gallery Media #${idx + 1}${urls.length > 1 ? ` (${uIdx + 1})` : ""}`,
                category: lowerDir.includes("admission")
                  ? "AdmissionDocuments"
                  : isSettingsAsset || lowerDir.includes("settings")
                  ? "Settings"
                  : (item.eventType || item.category || dir || "General"),
                directory: dir,
                source: item.isCdnResource ? "cloudinary" : "database",
              };
            });
          }
        );

        // Deduplicate by URL
        const uniqueMap = new Map<string, MediaItem>();
        fetchedMedia.forEach((item) => {
          if (item.url && !uniqueMap.has(item.url)) {
            uniqueMap.set(item.url, item);
          }
        });

        setMediaList(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error("Failed to load Cloudinary media gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryMedia();
  }, [isOpen]);

  // Handle direct file upload to Cloudinary on the spot (Supports images, videos, pdfs, docs, audio)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setUploadStatus({
      isUploading: true,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: file.type,
      previewUrl,
      progress: 5,
      step: "preparing",
      stageMessage: "Step 1/3: Reading binary buffer & initializing Cloudinary payload…",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const isIconsCategory = activeCategory === "Icons" || activeCategory === "Settings/Icons";
      const isLogosCategory = activeCategory === "Logos" || activeCategory === "Settings/Logos";
      const isSettingsCategory = activeCategory && (activeCategory.toLowerCase().includes("setting") || activeCategory === "Settings");
      formData.append("album", isIconsCategory || isLogosCategory || isSettingsCategory ? "Settings" : activeCategory === "AdmissionDocuments" ? "Admission" : "Visual Editor Picked");
      if (activeCategory && activeCategory !== "All") {
        formData.append(
          "folder",
          isIconsCategory
            ? "Settings/Icons"
            : isLogosCategory
              ? "Settings/Logos"
              : isSettingsCategory
                ? "Settings/Home"
                : activeCategory === "AdmissionDocuments"
                  ? "Documents/Admission"
                  : activeCategory
        );
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ips_admin_token") ||
          localStorage.getItem("admin_token") ||
          localStorage.getItem("token") ||
          ""
          : "";

      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      setUploadStatus((prev) => ({
        ...prev,
        progress: 15,
        step: "uploading",
        stageMessage: "Step 2/3: Transmitting asset to server & Cloudinary CDN…",
      }));

      const res = await axios.post(`${API_URL}/uploads`, formData, {
        headers,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadStatus((prev) => ({
              ...prev,
              progress: Math.min(pct, 95),
              step: pct >= 95 ? "processing" : "uploading",
              stageMessage:
                pct >= 95
                  ? "Step 3/3: Optimizing asset & generating Cloudinary CDN links…"
                  : `Step 2/3: Transmitting asset to CDN server (${pct}%)…`,
            }));
          }
        },
      });

      setUploadStatus((prev) => ({
        ...prev,
        progress: 98,
        step: "processing",
        stageMessage: "Step 3/3: Processing asset & generating Cloudinary response URL…",
      }));

      const data = res.data?.data ?? res.data;
      const url = data?.url || data?.fileUrl || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : "");
      if (!url) throw new Error("No URL returned from server upload.");

      const newItem: MediaItem = {
        id: `upload-${Date.now()}`,
        url,
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: activeCategory !== "All" ? activeCategory : "New Uploads",
        directory: activeCategory === "AdmissionDocuments" ? "Documents/Admission" : activeCategory,
        source: "database",
      };

      setMediaList((prev) => [newItem, ...prev]);
      setSelectedUrl(url);

      setUploadStatus((prev) => ({
        ...prev,
        progress: 100,
        step: "done",
        stageMessage: "Upload complete! Asset added to gallery.",
      }));

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      const errMsg = err?.response?.data?.message || err.message || "Failed to upload file.";
      setUploadError(errMsg);
      setUploadStatus((prev) => ({
        ...prev,
        step: "error",
        errorMessage: errMsg,
        stageMessage: "Upload encountered an error.",
      }));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setUploading(false);
      setUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    }
  };

  const categories = useMemo(() => {
    const categoryMap = new Map<string, string>(); // lowerCaseKey -> cleanCategoryKey

    categoryMap.set("all", "All");
    categoryMap.set("settings", "Settings");
    categoryMap.set("icons", "Icons");
    categoryMap.set("logos", "Logos");
    categoryMap.set("admissiondocuments", "AdmissionDocuments");

    mediaList.forEach((m) => {
      [m.category, m.directory].forEach((raw) => {
        if (!raw) return;
        const normKey = normalizeCategoryKey(raw);
        if (!normKey) return;
        const lower = normKey.toLowerCase();
        if (lower === "all" || lower === "general") return;

        if (!categoryMap.has(lower)) {
          categoryMap.set(lower, normKey);
        }
      });
    });

    return Array.from(categoryMap.values());
  }, [mediaList]);

  const filteredMedia = useMemo(() => {
    return mediaList.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.directory && m.directory.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCategory === "All") return true;

      const fType = getFileType(m.url);
      if (activeCategory === "Videos") return fType === "video";
      if (activeCategory === "Documents") return fType === "document";
      if (activeCategory === "Audio") return fType === "audio";
      if (activeCategory === "Images") return fType === "image";

      const activeNorm = normalizeCategoryKey(activeCategory).toLowerCase();

      if (activeNorm === "admissiondocuments") {
        return (
          m.category.toLowerCase().includes("admissiondocuments") ||
          (m.directory && m.directory.toLowerCase().includes("admissiondocuments")) ||
          m.url.toLowerCase().includes("admissiondocuments")
        );
      }

      const catNorm = normalizeCategoryKey(m.category).toLowerCase();
      const dirNorm = normalizeCategoryKey(m.directory).toLowerCase();

      return (
        catNorm === activeNorm ||
        dirNorm === activeNorm ||
        catNorm.includes(activeNorm) ||
        dirNorm.includes(activeNorm) ||
        m.url.toLowerCase().includes(activeNorm)
      );
    });
  }, [mediaList, searchQuery, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#102a4c] flex items-center gap-2">
              <ImageIcon className="text-amber-500" size={20} />
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pick any file (Image, Video, PDF, Document, Audio) from Cloudinary media gallery or upload a new one.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 p-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search files by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Upload Button */}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#102a4c] transition shrink-0">
            {uploading ? <LoaderCircle size={15} className="animate-spin" /> : <UploadCloud size={15} />}
            <span>{uploading ? "Uploading..." : "Upload New File"}</span>
            <input
              type="file"
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {(uploadStatus.isUploading || uploadStatus.step === "done" || uploadStatus.step === "error") && (
          <div className="px-4 pt-3 bg-slate-50 border-b border-slate-200">
            <FileUploadProgressLoader status={uploadStatus} />
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50/90 border-b border-slate-200 overflow-x-auto scrollbar-none min-h-[52px]">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            <Filter size={13} />
            <span>Filter:</span>
          </div>
          {categories.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            const isSpecial = cat === "All" || cat === "Videos" || cat === "Documents" || cat === "Audio" || cat === "Images";
            const displayLabel = isSpecial ? cat : formatCategoryDisplay(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0 cursor-pointer ${isSelected
                    ? "bg-[#1a5d9c] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center justify-between">
            <span>{uploadError}</span>
            <button type="button" onClick={() => setUploadError("")} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Media Grid Gallery */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center">
              <LoaderCircle size={32} className="mx-auto animate-spin text-[#1a5d9c]" />
              <p className="mt-3 text-xs font-semibold text-slate-500">Loading Cloudinary media library...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <ImageIcon size={36} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-600">No media files found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search query or upload a new file above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => {
                const isSelected = selectedUrl === item.url;
                const fileType = getFileType(item.url);
                const isPdf = isPdfFile(item.url);
                const pdfThumbnail = isPdf ? getCloudinaryPdfThumbnailUrl(item.url, 1, 600) : item.url;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedUrl(item.url)}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all shadow-2xs ${isSelected
                        ? "border-[#1a5d9c] ring-4 ring-blue-100 bg-blue-50/20"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                      }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                      {fileType === "video" ? (
                        <div className="relative h-full w-full flex flex-col items-center justify-center bg-slate-950 text-white">
                          <video src={item.url} muted preload="metadata" className="h-full w-full object-cover opacity-60" />
                          <div className="absolute grid h-10 w-10 place-items-center rounded-full bg-blue-600/80 text-white shadow-md">
                            <Video size={20} />
                          </div>
                          <span className="absolute bottom-1 right-1.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-200">
                            VIDEO
                          </span>
                        </div>
                      ) : fileType === "audio" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-950 p-2 text-center text-white">
                          <Music size={30} className="text-purple-300 mb-1" />
                          <p className="line-clamp-1 text-[10px] font-semibold text-purple-100">{item.title}</p>
                          <span className="mt-1 rounded-md bg-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-200">
                            AUDIO
                          </span>
                        </div>
                      ) : isPdf ? (
                        <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                          <PdfCanvasThumbnail url={item.url} alt={item.title} className="h-full w-full" />
                          <span className="absolute bottom-1 right-1.5 rounded-md bg-red-950/90 border border-red-700/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-200 shadow-md pointer-events-none">
                            PDF PREVIEW
                          </span>
                        </div>
                      ) : isExcelFile(item.url) ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-2 text-center text-white">
                          <FileSpreadsheet size={32} className="text-emerald-400 mb-1" />
                          <p className="line-clamp-1 text-[10px] font-bold text-slate-200">{item.title}</p>
                          <span className="mt-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
                            {isGoogleSheetUrl(item.url) ? "GOOGLE SHEET" : item.url.toLowerCase().endsWith(".csv") ? "CSV SPREADSHEET" : "EXCEL (.XLSX)"}
                          </span>
                        </div>
                      ) : isWordFile(item.url) ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-2 text-center text-white">
                          <FileText size={32} className="text-blue-400 mb-1" />
                          <p className="line-clamp-1 text-[10px] font-bold text-slate-200">{item.title}</p>
                          <span className="mt-1 rounded-md bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-300">
                            {isGoogleDocUrl(item.url) ? "GOOGLE DOC" : "WORD (.DOCX)"}
                          </span>
                        </div>
                      ) : fileType === "document" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-2 text-center text-white">
                          <FileText size={32} className="text-blue-400 mb-1" />
                          <p className="line-clamp-1 text-[10px] font-semibold text-slate-200">{item.title}</p>
                          <span className="mt-1 rounded-md bg-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-200">
                            DOCUMENT
                          </span>
                        </div>
                      ) : (
                        <SmartFileThumbnail
                          url={item.url}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Quick File Viewer Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFileUrl(item.url);
                        }}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition rounded-lg bg-slate-900/80 p-1.5 text-white hover:bg-blue-600 shadow-md"
                        title="Preview File Full Screen"
                      >
                        <Eye size={13} />
                      </button>
                    </div>

                    {/* Checkmark overlay for selection */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 rounded-full bg-[#1a5d9c] p-1 text-white shadow-md">
                        <Check size={14} />
                      </div>
                    )}

                    <div className="p-2.5">
                      <p className="text-xs font-bold text-[#102a4c] truncate">{item.title}</p>
                      <div className="mt-1 flex items-center justify-between gap-1.5">
                        <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-full">
                          {formatCategoryDisplay(normalizeCategoryKey(item.category || item.directory || "General"))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <span className="text-xs text-slate-500 truncate max-w-xs font-mono">
            {selectedUrl ? selectedUrl : "Select a file above to pick media URL"}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            {selectedUrl && getFileType(selectedUrl) === "image" && (
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition cursor-pointer"
              >
                <Scissors size={14} />
                <span>Edit & Crop First</span>
              </button>
            )}
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelectImage(selectedUrl);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#1a5d9c] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#102a4c] disabled:opacity-40 transition cursor-pointer"
            >
              <Check size={15} />
              <span>Use Selected File</span>
            </button>
          </div>
        </div>
      </div>

      <ImageStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialData={selectedUrl}
        onApply={({ src }) => {
          onSelectImage(src);
          setIsStudioOpen(false);
          onClose();
        }}
      />

      <FileViewerModal
        isOpen={!!previewFileUrl}
        onClose={() => setPreviewFileUrl(null)}
        url={previewFileUrl}
        title="Gallery File Preview"
      />
    </div>
  );
}
