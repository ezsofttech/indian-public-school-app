"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  ImageIcon,
  File,
  Building2,
} from "lucide-react";
import { cn, getAssetUrl } from "@/lib/utils";
import {
  isPdfFile,
  isWordFile,
  isExcelFile,
  isDocumentFile,
} from "@/lib/file-preview";

export interface SmartFileThumbnailProps {
  url?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackIcon?: React.ReactNode;
}

/**
 * Smart file thumbnail that renders:
 * - PDF icon badge for PDF files
 * - Word/Doc icon badge for Word documents
 * - Sheet/Excel icon badge for Spreadsheets/CSV
 * - Generic File icon badge for other documents
 * - Loaded image for valid image URLs
 * - Icon placeholder (Bootstrap/Lucide styled) if URL is missing or image load fails
 */
export function SmartFileThumbnail({
  url,
  alt = "",
  className,
  style,
  fallbackIcon,
}: SmartFileThumbnailProps) {
  const cleanUrl = typeof url === "string" ? url.trim() : "";
  const initialSrc = cleanUrl ? (getAssetUrl(cleanUrl) || cleanUrl) : "";

  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setHasError(false);
    const resolved = cleanUrl ? (getAssetUrl(cleanUrl) || cleanUrl) : "";
    setCurrentSrc(resolved);
  }, [cleanUrl]);

  if (!cleanUrl) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-xs shrink-0 select-none",
          className
        )}
        style={style}
      >
        {fallbackIcon || <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />}
      </div>
    );
  }

  // PDF Document
  if (isPdfFile(cleanUrl)) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900/50 p-1.5 shadow-xs shrink-0 font-sans select-none",
          className
        )}
        style={style}
        title={alt || "PDF Document"}
      >
        <FileText className="h-5 w-5 text-rose-500 shrink-0" />
        <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          PDF
        </span>
      </div>
    );
  }

  // Word Document
  if (isWordFile(cleanUrl)) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-900/50 p-1.5 shadow-xs shrink-0 font-sans select-none",
          className
        )}
        style={style}
        title={alt || "Word Document"}
      >
        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
        <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          DOC
        </span>
      </div>
    );
  }

  // Excel / Spreadsheet / CSV
  if (isExcelFile(cleanUrl)) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50 p-1.5 shadow-xs shrink-0 font-sans select-none",
          className
        )}
        style={style}
        title={alt || "Spreadsheet Document"}
      >
        <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />
        <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          SHEET
        </span>
      </div>
    );
  }

  // Generic Document
  if (isDocumentFile(cleanUrl)) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900/50 p-1.5 shadow-xs shrink-0 font-sans select-none",
          className
        )}
        style={style}
        title={alt || "Document File"}
      >
        <File className="h-5 w-5 text-amber-500 shrink-0" />
        <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          FILE
        </span>
      </div>
    );
  }

  // Image failed to load -> show Icon Fallback
  if (hasError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-xs shrink-0 select-none",
          className
        )}
        style={style}
      >
        {fallbackIcon || <ImageIcon className="h-6 w-6 text-slate-400 shrink-0" />}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (currentSrc !== cleanUrl && cleanUrl) {
          setCurrentSrc(cleanUrl);
        } else if (
          cleanUrl &&
          !cleanUrl.startsWith("http") &&
          !cleanUrl.startsWith("/") &&
          !currentSrc.includes("indianpublicschool.in")
        ) {
          setCurrentSrc(`https://indianpublicschool.in/admin/uploads/images/${cleanUrl}`);
        } else {
          setHasError(true);
        }
      }}
      className={cn("object-cover shrink-0", className)}
      style={style}
    />
  );
}
