"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  LoaderCircle,
  Lock,
  Music,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Video,
  X,
  Crown,
} from "lucide-react";
import { RichTextBox } from "@/components/ui/RichTextBox";
import { CloudinaryGalleryModal, getFileType } from "@/components/admin/CloudinaryGalleryModal";
import { PdfCanvasThumbnail } from "@/components/ui/PdfCanvasThumbnail";
import { isPdfFile, getCloudinaryInlineViewerUrl } from "@/lib/file-preview";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";
import { FileUploadProgressLoader, FileUploadStatus } from "@/components/ui/FileUploadProgressLoader";
import { toCleanRelativeAssetPath, getAssetUrl, formatHref } from "@/lib/utils";
import { HomeLayoutEditorModal } from "./HomeLayoutEditorModal";
import { Resource, RecordItem } from "../types/admin.types";
import { API_URL, resources } from "../config/admin.config";
import { asPaginatedPayload, isRequiredField, isSuperAdminRole, itemId, titleCase } from "../utils/admin.helpers";

export function RecordDialog({
  token,
  resource,
  record,
  saving,
  formError,
  allSectionPages = [],
  allMenuItems = [],
  onClose,
  onClearError,
  onSave,
}: {
  token: string;
  resource: Resource;
  record: RecordItem | null;
  saving: boolean;
  formError?: string;
  allSectionPages?: RecordItem[];
  allMenuItems?: RecordItem[];
  onClose: () => void;
  onClearError?: () => void;
  onSave: (value: Record<string, unknown>, options?: { keepOpen?: boolean }) => void | Promise<void>;
}) {
  if (resource.key === "school-settings") {
    return (
      <HomeLayoutEditorModal
        token={token}
        record={record}
        saving={saving}
        allMenuItems={allMenuItems}
        allSectionPages={allSectionPages}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }

  const initial = Object.fromEntries(
    Object.keys(resource.inputs).map((key) => {
      let val = record?.[key] ?? (resource.inputs[key] === "boolean" ? false : "");
      if (resource.key === "school-settings" && key === "value" && typeof val === "object" && val !== null) {
        val = JSON.stringify(val, null, 2);
      }
      if (resource.key === "gallery" && key === "directory" && !val) {
        val = "/album/";
      }
      return [key, val];
    })
  );

  if (resource.key === "users") {
    if (!initial.role) initial.role = "Sub Admin";
    if (!initial.allowedModules) {
      initial.allowedModules = Array.isArray(record?.allowedModules)
        ? record.allowedModules
        : initial.role === "Super Admin"
          ? ["*"]
          : ["students", "news", "gallery"];
    }
  }

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
  const [galleryPickerField, setGalleryPickerField] = useState<string | null>(null);

  const [publishedPagesState, setPublishedPagesState] = useState<RecordItem[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/pages/published`)
      .then((res) => {
        const parsed = asPaginatedPayload(res.data);
        if (isMounted && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setPublishedPagesState(parsed.items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveSectionPages = React.useMemo(() => {
    const pageMap = new Map<string, RecordItem>();
    (allSectionPages || []).forEach((p) => {
      const id = String(p.slug || p.targetUrl || p._id || p.publicId || "");
      if (id) pageMap.set(id, p);
    });
    (publishedPagesState || []).forEach((p) => {
      const id = String(p.slug || p.targetUrl || p._id || p.publicId || "");
      if (id) {
        const existing = pageMap.get(id) || {};
        pageMap.set(id, { ...existing, ...p, isPublished: true });
      }
    });
    return Array.from(pageMap.values());
  }, [allSectionPages, publishedPagesState]);

  const setValue = (field: string, value: unknown) => {
    if (onClearError && formError) onClearError();
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const handleFilesUpload = async (field: string, files: File[]) => {
    if (!files || files.length === 0) return;
    setUploading(field);
    setUploadError("");

    const isMulti = field === "fileUrl" || field === "document" || Array.isArray(values[field]);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      const fileNum = files.length > 1 ? `[${i + 1}/${files.length}] ` : "";

      setUploadStatus({
        isUploading: true,
        field,
        fileName: file.name,
        fileSize: formattedSize,
        fileType: file.type,
        previewUrl,
        progress: 10,
        step: "preparing",
        stageMessage: files.length > 1 ? `Preparing ${fileNum}upload…` : "Preparing upload…",
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        if ((resource.key as string) === "school-settings" || (resource.key as string) === "settings") {
          formData.append("album", "Settings");
          formData.append("folder", "Settings");
        } else if (resource.key === "students") {
          formData.append("album", "Student");
          formData.append("folder", "Student");
        } else if (resource.key === "staff") {
          formData.append("album", "Staff");
          formData.append("folder", "Staff");
        } else {
          formData.append("album", resource.label);

          const targetFolder =
            (typeof values.directory === "string" && values.directory.trim()) ||
            (typeof values.folder === "string" && values.folder.trim()) ||
            (typeof values.cloudinaryFolder === "string" && values.cloudinaryFolder.trim()) ||
            "";

          if (targetFolder) {
            formData.append("folder", targetFolder);
          }
        }

        const res = await axios.post(`${API_URL}/uploads`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadStatus((prev) => ({
                ...prev,
                progress: Math.min(pct, 95),
                step: pct >= 95 ? "processing" : "uploading",
                stageMessage:
                  pct >= 95
                    ? (files.length > 1 ? `Processing file ${fileNum}…` : "Processing file…")
                    : (files.length > 1 ? `Uploading ${fileNum}(${pct}%)…` : `Uploading file (${pct}%)…`),
              }));
            }
          },
        });

        const data = res.data?.data ?? res.data;
        const rawUrl = data?.url || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : data?.fileUrl);

        if (!rawUrl) {
          throw new Error("No URL returned from upload response.");
        }
        const uploadedUrl = toCleanRelativeAssetPath(rawUrl);
        uploadedUrls.push(uploadedUrl);
      } catch (err) {
        const errMsg = axios.isAxiosError(err)
          ? String(err.response?.data?.message || err.message)
          : `Failed to upload ${file.name}.`;
        setUploadError(errMsg);
        setUploadStatus((prev) => ({
          ...prev,
          step: "error",
          errorMessage: errMsg,
          stageMessage: `Upload failed.`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1500));
        break;
      }
    }

    if (uploadedUrls.length > 0) {
      if (isMulti) {
        const existingList = Array.isArray(values[field])
          ? (values[field] as string[])
          : typeof values[field] === "string" && values[field]
          ? [values[field] as string]
          : [];
        setValue(field, [...existingList, ...uploadedUrls]);
      } else {
        setValue(field, uploadedUrls[0]);
      }

      setValues((prev) => {
        const curRedirect = String(prev.redirectUrl || prev.targetUrl || "").trim();
        if (!curRedirect) {
          return { ...prev, redirectUrl: uploadedUrls[0] };
        }
        return prev;
      });

      setUploadStatus((prev) => ({
        ...prev,
        progress: 100,
        step: "done",
        stageMessage: files.length > 1 ? `${uploadedUrls.length} files uploaded!` : "Upload complete!",
      }));
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setUploading(null);
    setUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
  };

  const handleFileUpload = (field: string, file: File) => handleFilesUpload(field, [file]);

  const removeImage = (field: string, urlToRemove?: string) => {
    if (urlToRemove) {
      const currentList = Array.isArray(values[field])
        ? (values[field] as string[])
        : typeof values[field] === "string" && values[field]
        ? [values[field] as string]
        : [];
      const updated = currentList.filter((url) => url !== urlToRemove);
      setValue(field, updated);
    } else {
      if (field === "document" || field === "fileUrl" || Array.isArray(values[field])) {
        setValue(field, []);
      } else {
        setValue(field, "");
      }
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...values };
    if (resource.key === "pages" || resource.key === "menu-items") {
      if (record && record.isPublished !== undefined && payload.isPublished === undefined) {
        payload.isPublished = record.isPublished;
      } else if (!record && payload.isPublished === undefined) {
        payload.isPublished = true;
      }
    }
    if (resource.key === "reviews") {
      if (record && record.isApproved !== undefined && payload.isApproved === undefined) {
        payload.isApproved = record.isApproved;
      } else if (!record && payload.isApproved === undefined) {
        payload.isApproved = false;
      }
    }
    if (resource.key === "menu-items") {
      payload.category = record?.category || "Header";
    }
    if (!payload.redirectUrl && payload.attachmentUrl) {
      payload.redirectUrl = String(payload.attachmentUrl);
    }
    if (resource.key === "gallery" && typeof payload.fileUrl === "string") {
      payload.fileUrl = String(payload.fileUrl).split("\n").map((url) => toCleanRelativeAssetPath(url.trim())).filter(Boolean);
    }
    if (resource.key === "school-settings" && typeof payload.value === "string") {
      try { payload.value = JSON.parse(payload.value); } catch { /* Plain-text setting values are valid. */ }
    }
    onSave(payload);
  };

  const isLargeModal = resource.key === "pages" || Object.values(resource.inputs).includes("richtext");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <form onSubmit={submit} className={`max-h-[92vh] w-full flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 transition-all ${isLargeModal ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 shrink-0 rounded-t-3xl z-20">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#102a4c]">
              {record ? "Edit" : "Add"} {resource.label.endsWith("s") ? resource.label.slice(0, -1) : resource.label}
            </h2>
            <p className="text-sm text-slate-500">Changes are sent to the school API and synced to Cloudinary.</p>
          </div>
          <button
            type="button"
            disabled={saving || Boolean(uploading)}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <X size={19} />
          </button>
        </div>

        {saving && (
          <div className="relative h-1 w-full overflow-hidden bg-blue-100 shrink-0">
            <div className="h-full w-full bg-[#1a5d9c] animate-pulse" />
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 grid gap-4 sm:grid-cols-2 ${saving ? "opacity-75 pointer-events-none" : ""}`}>
          {formError && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-900 shadow-2xs animate-in fade-in duration-150">
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-950 text-sm">Action Failed</p>
                <p className="mt-0.5 text-red-800 leading-relaxed font-medium">{formError}</p>
              </div>
              {onClearError && (
                <button type="button" onClick={onClearError} className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 transition cursor-pointer">
                  <X size={15} />
                </button>
              )}
            </div>
          )}
          {uploadError && (
            <div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {uploadError}
            </div>
          )}
          {Object.entries(resource.inputs)
            .filter(([field]) => field !== "status")
            .map(([field, type]) => {
            const required = isRequiredField(field, resource.key, Boolean(record));
            return (
              <label key={field} className={type === "textarea" || type === "file" || type === "richtext" || field === "role" || field === "targetUrl" || field === "redirectUrl" || field === "linkUrl" ? "sm:col-span-2" : ""}>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {titleCase(field)}
                  {required && <span className="ml-1 font-bold text-red-500" title="Required field">*</span>}
                </span>
                {type === "file" ? (
                  (() => {
                    const isMultiFile = field === "document" || field === "fileUrl" || Array.isArray(values[field]);
                    const rawVal = values[field];
                    const fileUrls: string[] = Array.isArray(rawVal)
                      ? (rawVal as string[]).map(String).filter(Boolean)
                      : typeof rawVal === "string" && rawVal.trim()
                      ? [rawVal.trim()]
                      : [];

                    const displayVal =
                      fileUrls.length > 0
                        ? isMultiFile && fileUrls.length > 1
                          ? `${fileUrls.length} files attached: ${fileUrls.join(", ")}`
                          : fileUrls[0]
                        : "";

                    return (
                      <div className="space-y-3">
                        {/* Readonly / Disabled Path Input Displaying Current Asset URL with Icon-Only Controls */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            disabled
                            readOnly
                            value={displayVal}
                            placeholder={`No ${titleCase(field)} attached`}
                            className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-100/90 px-3.5 py-2.5 text-xs font-mono text-slate-600 outline-none cursor-not-allowed select-all shadow-2xs"
                          />

                          {/* Upload Button - Icon Only */}
                          <label
                            title={
                              uploading === field
                                ? "Uploading to Cloudinary…"
                                : isMultiFile
                                ? `Upload ${titleCase(field)} (Multiple Supported)`
                                : `Upload ${titleCase(field)} to Cloudinary`
                            }
                            className="inline-flex h-9.5 w-9.5 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#1a5d9c] text-white hover:bg-[#102a4c] transition shadow-2xs"
                          >
                            {uploading === field ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <UploadCloud size={16} />
                            )}
                            <input
                              type="file"
                              multiple={isMultiFile}
                              accept={
                                field === "avatar"
                                  ? "image/*"
                                  : field === "resume"
                                  ? ".pdf,.doc,.docx,application/pdf"
                                  : "image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                              }
                              onChange={(event) => {
                                const fileList = event.target.files;
                                if (fileList && fileList.length > 0) {
                                  void handleFilesUpload(field, Array.from(fileList));
                                }
                                event.target.value = "";
                              }}
                              className="hidden"
                            />
                          </label>

                          {/* Gallery Picker Button - Icon Only */}
                          <button
                            type="button"
                            onClick={() => setGalleryPickerField(field)}
                            title="Pick from Cloudinary Gallery"
                            className="inline-flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                          >
                            <ImageIcon size={16} className="text-amber-500" />
                          </button>

                          {/* Clear Button - Icon Only */}
                          {fileUrls.length > 0 && (
                            <button
                              type="button"
                              onClick={() => removeImage(field)}
                              title={isMultiFile && fileUrls.length > 1 ? `Clear all ${fileUrls.length} assets` : "Clear attached asset"}
                              className="inline-flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition shadow-2xs cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {uploadStatus.field === field && (uploadStatus.isUploading || uploadStatus.step === "done" || uploadStatus.step === "error") && (
                          <FileUploadProgressLoader status={uploadStatus} />
                        )}

                        {fileUrls.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                            {fileUrls.map((url, idx) => {
                              const fType = getFileType(url);
                              const filename = url.split("/").pop() || "Media Asset";
                              return (
                                <div
                                  key={`${url}-${idx}`}
                                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-2xs transition hover:shadow-md"
                                >
                                  <div className="relative h-32 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                                    {fType === "video" ? (
                                      <div className="relative h-full w-full flex flex-col items-center justify-center text-white bg-slate-950">
                                        <video src={getAssetUrl(url)} muted className="h-full w-full object-cover opacity-70" />
                                        <Video size={28} className="absolute text-blue-400 drop-shadow-md" />
                                      </div>
                                    ) : fType === "audio" ? (
                                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-950 p-3 text-white text-center">
                                        <Music size={32} className="text-purple-300 mb-1 animate-pulse" />
                                        <span className="text-[11px] font-bold text-purple-200 truncate w-full px-2">{filename}</span>
                                      </div>
                                    ) : isPdfFile(url) ? (
                                      <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                        <PdfCanvasThumbnail url={url} alt={filename} className="h-full w-full" />
                                        <span className="absolute bottom-1 right-1.5 rounded-md bg-red-950/90 border border-red-700/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-200 shadow-md pointer-events-none">
                                          PDF
                                        </span>
                                      </div>
                                    ) : fType === "document" ? (
                                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-3 text-white text-center">
                                        <FileText size={32} className="text-blue-400 mb-1" />
                                        <span className="text-[11px] font-bold text-slate-300 truncate w-full px-2">{filename}</span>
                                      </div>
                                    ) : (
                                      <img
                                        src={getAssetUrl(url) || url}
                                        alt={filename || "Image preview"}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          const clean = url?.trim() || "";
                                          if (clean && target.src !== clean && !target.dataset.triedOriginal) {
                                            target.dataset.triedOriginal = "true";
                                            target.src = clean;
                                          } else if (clean && !clean.startsWith("http") && !clean.startsWith("/") && !target.dataset.triedUploads) {
                                            target.dataset.triedUploads = "true";
                                            target.src = `https://indianpublicschool.in/admin/uploads/images/${clean}`;
                                          }
                                        }}
                                      />
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                                      <a
                                        href={getCloudinaryInlineViewerUrl(url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full bg-slate-900/80 p-1.5 text-slate-200 hover:bg-blue-600 hover:text-white transition"
                                        title="Open media in new tab"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(field, url)}
                                        className="rounded-full bg-slate-900/80 p-1.5 text-slate-200 hover:bg-red-600 hover:text-white transition cursor-pointer"
                                        title="Remove asset"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-700 truncate">{filename}</span>
                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">{fType}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()) : type === "boolean" ? (
                  <button
                    type="button"
                    onClick={() => setValue(field, !values[field])}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold ${values[field] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                  >
                    <span>{values[field] ? "Enabled" : "Disabled"}</span>
                    <span className={`h-5 w-9 rounded-full p-0.5 ${values[field] ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white transition ${values[field] ? "translate-x-4" : ""}`} />
                    </span>
                  </button>
                ) : type === "richtext" ? (
                  <RichTextBox
                    value={String(values[field] ?? "")}
                    onChange={(val) => setValue(field, val)}
                    placeholder="Write page rich text content, headings, formatting..."
                  />
                ) : field === "parentId" ? (
                  <div className="relative">
                    {(() => {
                      const menuOptions = resource.key === "menu-items" ? allMenuItems : effectiveSectionPages;
                      const rawParent =
                        typeof values.parentId === "object" && values.parentId && "_id" in (values.parentId as object)
                          ? String((values.parentId as RecordItem)._id)
                          : String(values.parentId ?? "");

                      const matched = menuOptions.find(
                        (i) =>
                          itemId(i) === rawParent ||
                          String(i._id) === rawParent ||
                          String(i.id) === rawParent ||
                          String(i.publicId) === rawParent ||
                          String(i.menuId) === rawParent ||
                          String(i.slug) === rawParent
                      );

                      const selectValue = matched ? itemId(matched) : rawParent;

                      return (
                        <select
                          value={selectValue}
                          onChange={(event) => setValue("parentId", event.target.value || null)}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
                        >
                          <option value="">-- None (Root Level 1 Item) --</option>
                          {menuOptions
                            .filter((item) => itemId(item) !== (record ? itemId(record) : ""))
                            .filter(
                              (item, idx, arr) =>
                                arr.findIndex(
                                  (i) =>
                                    String(i.title || "").toLowerCase().trim() ===
                                    String(item.title || "").toLowerCase().trim() &&
                                    Number(i.level || 1) === Number(item.level || 1)
                                ) === idx
                            )
                            .map((item) => {
                              const level = Number(item.level || 1);
                              const isMaxDepth = resource.key === "menu-items" && level >= 3;
                              const optVal = itemId(item);
                              return (
                                <option key={optVal} value={optVal} disabled={isMaxDepth}>
                                  {level === 1 ? "" : level === 2 ? "└─ " : "    └─ "}
                                  {String(item.title || "Untitled")} (Level {level})
                                  {isMaxDepth ? " - Max 3-level depth reached" : ""}
                                </option>
                              );
                            })}
                        </select>
                      );
                    })()}
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                ) : field === "targetUrl" || field === "redirectUrl" || field === "linkUrl" ? (
                  (() => {
                    const defaultSitePages = [
                      { title: "Home", url: "/" },
                      { title: "About Us", url: "/about" },
                      { title: "Student Admissions", url: "/admission" },
                      { title: "Pictures & Photo Albums", url: "/gallery/album" },
                      { title: "Photo & Picture Gallery", url: "/gallery" },
                      { title: "Video Gallery", url: "/gallery/videos" },
                      { title: "Academics & Courses Offered", url: "/academics/courses-offered" },
                      { title: "Mandatory Public Disclosure", url: "/mandatory-disclosure" },
                      { title: "School Establishment & Trust", url: "/about-us/school-establishment" },
                      { title: "CBSE Affiliation Details", url: "/about-us/affiliation" },
                      { title: "Career Opportunities", url: "/careers" },
                      { title: "Notice & News", url: "/news" },
                      { title: "Contact Us", url: "/contact-us" },
                      { title: "Other Link", url: "/other" },
                    ];

                    const pagesMap = new Map<string, string>();
                    defaultSitePages.forEach((p) => pagesMap.set(p.url, p.title));
                    effectiveSectionPages.forEach((p) => {
                      const isPublished = p.isPublished !== false && p.isPublished !== "false";
                      if (!isPublished) return;
                      const rawPageUrl = String(p.targetUrl || (p.slug ? `/pages/${p.slug}` : "")).trim();
                      const pageUrl = formatHref(rawPageUrl);
                      if (pageUrl) {
                        pagesMap.set(pageUrl, String(p.title || pageUrl));
                      }
                    });

                    const allPages = Array.from(pagesMap.entries())
                      .map(([url, title]) => ({ url, title }))
                      .sort((a, b) => a.title.localeCompare(b.title));
                    const currentVal = String(values[field] || "").trim();
                    const isKnownPage = allPages.some((p) => p.url === currentVal);

                    return (
                      <div className="space-y-2">
                        <div className="relative">
                          <select
                            value={isKnownPage ? currentVal : "__custom__"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== "__custom__") {
                                setValue(field, val);
                                const matched = allPages.find((p) => p.url === val);
                                if (matched && (!values.title || values.title === "")) {
                                  setValue("title", matched.title);
                                }
                              }
                            }}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
                          >
                            <option value="__custom__">Custom URL / External Link (Type below)...</option>

                            <optgroup label="Website Pages">
                              {allPages.map((page) => (
                                <option key={page.url} value={page.url}>
                                  {page.title} ({page.url})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        <input
                          type="text"
                          required={required && !isKnownPage}
                          disabled={isKnownPage}
                          placeholder="e.g. /pages/about-us or https://external-link.com"
                          value={String(values[field] ?? "")}
                          onChange={(event) => setValue(field, event.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-400">
                          Pick a page from the dropdown list, or type a custom internal/external URL above.
                        </p>
                      </div>
                    );
                  })()
                ) : type === "textarea" ? (
                  <textarea
                    required={required}
                    value={String(values[field] ?? "")}
                    onChange={(event) => setValue(field, event.target.value)}
                    rows={field === "value" || field === "content" || field === "message" || field === "feedback" || field === "textContent" ? 14 : 3}
                    className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs ${field === "value" || (typeof values[field] === "string" && (values[field] as string).trim().startsWith("{")) ? "font-mono text-xs" : ""
                      }`}
                  />
                ) : field === "role" ? (
                  <div className="space-y-4 pt-1">
                    {record && isSuperAdminRole(record.role) ? (
                      <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900 shadow-2xs">
                        <Crown size={18} className="shrink-0 fill-amber-400 text-amber-600" />
                        <div>
                          <p className="font-bold text-amber-950">Primary Super Admin Account (Full Privileges)</p>
                          <p className="mt-0.5 text-[11px] text-amber-800">Only 1 Super Admin account is permitted in the system. Component access restrictions cannot be applied to this account.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs font-bold text-[#1a5d9c]">
                          <div className="flex items-center gap-2">
                            <Shield size={16} />
                            <span>Role: Sub Admin</span>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] text-blue-800 font-semibold">Configurable Component Permissions</span>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Sub-Admin Component Access & Action Permissions</p>
                              <p className="text-[11px] text-slate-500">Configure which components this Sub-Admin can access (view), update (add/edit), and delete:</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#1a5d9c]">
                              <button
                                type="button"
                                onClick={() => {
                                  const allPerms = resources.flatMap((r) => [`${r.key}:access`, `${r.key}:update`, `${r.key}:delete`]);
                                  setValue("allowedModules", allPerms);
                                }}
                                className="hover:underline"
                              >
                                Grant Full Sub-Admin Access
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setValue("allowedModules", [])}
                                className="text-slate-500 hover:underline hover:text-slate-700"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {resources.map((res) => {
                              const list = Array.isArray(values.allowedModules) ? (values.allowedModules as string[]) : [];
                              const hasFullModule = list.includes(res.key) || list.includes("*");

                              const canAccess = hasFullModule || list.includes(`${res.key}:access`);
                              const canUpdate = hasFullModule || list.includes(`${res.key}:update`);
                              const canDelete = hasFullModule || list.includes(`${res.key}:delete`);

                              const toggleAction = (act: "access" | "update" | "delete") => {
                                let next = [...list];
                                if (next.includes("*")) {
                                  next = resources.flatMap((r) => [`${r.key}:access`, `${r.key}:update`, `${r.key}:delete`]);
                                }
                                const permKey = `${res.key}:${act}`;
                                if (next.includes(permKey)) {
                                  next = next.filter((p) => p !== permKey && p !== res.key);
                                } else {
                                  next.push(permKey);
                                }
                                setValue("allowedModules", next);
                              };

                              const Icon = res.icon;

                              return (
                                <div
                                  key={res.key}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs gap-2"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#1a5d9c]">
                                      <Icon size={16} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-[#102a4c]">{res.label}</p>
                                      <p className="text-[10px] text-slate-400">{res.description}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                                    <label
                                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${canAccess
                                        ? "border-blue-300 bg-blue-50 text-[#1a5d9c]"
                                        : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={canAccess}
                                        onChange={() => toggleAction("access")}
                                        className="h-3.5 w-3.5 rounded text-[#1a5d9c]"
                                      />
                                      <Eye size={12} /> Access
                                    </label>

                                    <label
                                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${canUpdate
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={canUpdate}
                                        onChange={() => toggleAction("update")}
                                        className="h-3.5 w-3.5 rounded text-emerald-600"
                                      />
                                      <Pencil size={12} /> Update
                                    </label>

                                    <label
                                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${canDelete
                                        ? "border-red-300 bg-red-50 text-red-700"
                                        : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={canDelete}
                                        onChange={() => toggleAction("delete")}
                                        className="h-3.5 w-3.5 rounded text-red-600"
                                      />
                                      <Trash2 size={12} /> Delete
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : type === "select" ? (
                  (() => {
                    const isGalleryEventType = resource.key === "gallery" && field === "eventType";
                    const isGalleryDirectory = resource.key === "gallery" && field === "directory";
                    const currentVal = String(values[field] ?? "");

                    const getAutoEventType = (dir: string): string => {
                      if (!dir) return "";
                      const clean = dir.trim();
                      if (clean === "Settings/Icons" || clean.endsWith("/Icons") || clean.toLowerCase() === "icons") return "Icons";
                      if (clean === "Settings/Logos" || clean.endsWith("/Logos") || clean.toLowerCase() === "logos") return "Logos";
                      if (clean === "Settings/Home" || clean.endsWith("/Home") || clean.toLowerCase() === "home") return "Home";
                      if (clean.startsWith("Settings")) return "Settings";
                      if (clean === "Documents/Admission") return "AdmissionDocuments";
                      if (clean.startsWith("Documents")) return "Documents";
                      if (clean.startsWith("Album/")) {
                        const sub = clean.slice("Album/".length);
                        if (sub) return sub;
                      }
                      if (clean === "Album") return "General";
                      if (clean === "PressRelease") return "PressRelease";
                      return clean;
                    };

                    const getAutoDirectory = (evt: string): string => {
                      if (!evt) return "";
                      if (evt === "Icons") return "Settings/Icons";
                      if (evt === "Logos") return "Settings/Logos";
                      if (evt === "Home") return "Settings/Home";
                      if (evt === "Settings") return "Settings/Logos";
                      if (evt === "Documents") return "Documents/General";
                      if (evt === "AdmissionDocuments") return "Documents/Admission";
                      if (evt === "News" || evt === "PressRelease") return "PressRelease";
                      if (["Events", "Hostel", "Infrastructure", "Empowerment", "Competitions", "Partners", "Achievements", "Reviews", "Awareness", "Sports", "Activities", "Campus", "Arts"].includes(evt)) {
                        return `Album/${evt}`;
                      }
                      if (evt === "General") return "Album";
                      return evt;
                    };

                    const handleSelectDirectory = (val: string) => {
                      setValue("directory", val);
                      const autoEvt = getAutoEventType(val);
                      if (autoEvt) {
                        setValue("eventType", autoEvt);
                      }
                    };

                    const handleSelectEventType = (val: string) => {
                      setValue("eventType", val);
                      const currentDir = String(values["directory"] ?? "");
                      if (!currentDir) {
                        const autoDir = getAutoDirectory(val);
                        if (autoDir) {
                          setValue("directory", autoDir);
                        }
                      }
                    };

                    const optionsList = resource.options?.[field] || [];

                    return (
                      <div className="relative">
                        <select
                          required={required}
                          value={currentVal}
                          onChange={(event) => {
                            const val = event.target.value;
                            if (isGalleryDirectory) {
                              handleSelectDirectory(val);
                            } else if (isGalleryEventType) {
                              handleSelectEventType(val);
                            } else {
                              setValue(field, val);
                            }
                          }}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
                        >
                          <option value="" disabled className="text-slate-400">
                            Select {titleCase(field)}
                          </option>
                          {optionsList.map((opt) => (
                            <option key={opt} value={opt} className="text-slate-800 py-1 font-medium">
                              {opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    {type === "text" && field.toLowerCase().match(/(url|image|logo|avatar|photo|file|icon|banner|attachment|badge|poster)/i) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            required={required}
                            type="text"
                            placeholder="https://res.cloudinary.com/... or /assets/..."
                            value={String(values[field] ?? "")}
                            onChange={(event) => setValue(field, event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs"
                          />
                          <label
                            title={uploading === field ? "Uploading to Cloudinary…" : "Upload to Cloudinary"}
                            className="inline-flex h-9.5 w-9.5 cursor-pointer items-center justify-center shrink-0 rounded-xl bg-[#1a5d9c] text-white hover:bg-[#102a4c] transition shadow-xs"
                          >
                            {uploading === field ? <LoaderCircle size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                            <input
                              type="file"
                              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void handleFileUpload(field, file);
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setGalleryPickerField(field)}
                            title="Pick from Cloudinary Gallery"
                            className="inline-flex h-9.5 w-9.5 items-center justify-center shrink-0 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                          >
                            <ImageIcon size={15} className="text-amber-500" />
                          </button>
                        </div>

                        {uploadStatus.field === field && (uploadStatus.isUploading || uploadStatus.step === "done" || uploadStatus.step === "error") && (
                          <FileUploadProgressLoader status={uploadStatus} />
                        )}
                      </div>
                    ) : (
                      <input
                        required={required}
                        type={type}
                        value={String(values[field] ?? "").slice(0, type === "date" ? 10 : undefined)}
                        onChange={(event) => setValue(field, type === "number" ? Number(event.target.value) : event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm opacity-90 outline-none transition focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      />
                    )}
                  </div>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 shrink-0 rounded-b-3xl z-10">
          <button
            type="button"
            disabled={saving || Boolean(uploading)}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || Boolean(uploading)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a5d9c] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition"
          >
            {saving && <LoaderCircle size={16} className="animate-spin text-white" />}
            <span>
              {saving
                ? record
                  ? "Updating record…"
                  : "Adding record…"
                : record
                  ? `Update ${resource.label.endsWith("s") ? resource.label.slice(0, -1) : resource.label}`
                  : `Add ${resource.label.endsWith("s") ? resource.label.slice(0, -1) : resource.label}`}
            </span>
          </button>
        </div>
      </form>

      <CloudinaryGalleryModal
        isOpen={Boolean(galleryPickerField)}
        onClose={() => setGalleryPickerField(null)}
        onSelectImage={(url) => {
          if (galleryPickerField) {
            const isMulti =
              galleryPickerField === "document" ||
              galleryPickerField === "fileUrl" ||
              Array.isArray(values[galleryPickerField]);
            if (isMulti) {
              const currentList = Array.isArray(values[galleryPickerField])
                ? (values[galleryPickerField] as string[])
                : typeof values[galleryPickerField] === "string" && values[galleryPickerField]
                ? [values[galleryPickerField] as string]
                : [];
              setValue(galleryPickerField, [...currentList, url]);
            } else {
              setValue(galleryPickerField, url);
            }
          }
        }}
      />
    </div>
  );
}
