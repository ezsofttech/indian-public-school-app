"use client";

import React from "react";
import {
  CheckCircle2,
  LoaderCircle,
  UploadCloud,
  AlertTriangle,
} from "lucide-react";

export type UploadStep = "preparing" | "uploading" | "processing" | "done" | "error";

export interface FileUploadStatus {
  isUploading: boolean;
  field?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  previewUrl?: string;
  progress: number; // 0 to 100
  step: UploadStep;
  errorMessage?: string;
  stageMessage?: string;
}

export function FileUploadProgressLoader({ status, onClose }: { status: FileUploadStatus; onClose?: () => void }) {
  if (!status.isUploading) return null;

  const { fileName, fileSize, fileType, previewUrl, progress, step, errorMessage, stageMessage } = status;
  const isImage = fileType?.startsWith("image/");

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/80 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Top Bar: Thumbnail/Icon + File details + Percentage */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {previewUrl && isImage ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-blue-200/90 shadow-xs bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Uploading preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a5d9c] to-[#102a4c] text-white shadow-xs">
              <UploadCloud className="h-6 w-6 animate-bounce" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                {fileName || "File asset"}
              </span>
              {fileSize && (
                <span className="shrink-0 rounded-full bg-blue-100/90 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {fileSize}
                </span>
              )}
            </div>

            <div className="mt-0.5 text-xs text-blue-800 font-medium flex items-center gap-1.5 truncate">
              {step === "error" ? (
                <AlertTriangle size={13} className="text-red-600 shrink-0" />
              ) : step === "done" ? (
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              ) : (
                <LoaderCircle size={13} className="animate-spin text-blue-600 shrink-0" />
              )}

              <span className="truncate">
                {stageMessage ||
                  (step === "preparing"
                    ? "Step 1/3: Reading binary buffer & initializing Cloudinary payload…"
                    : step === "uploading"
                    ? `Step 2/3: Transmitting asset to CDN server (${progress}%)…`
                    : step === "processing"
                    ? "Step 3/3: Optimizing asset & generating CDN response URL…"
                    : step === "done"
                    ? "Upload complete! Asset synced successfully."
                    : errorMessage || "Upload failed.")}
              </span>
            </div>
          </div>
        </div>

        {/* Big percentage indicator */}
        <div className="flex flex-col items-end shrink-0">
          <span className="font-mono text-xs sm:text-sm font-extrabold text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-xl shadow-2xs">
            {step === "error" ? "FAILED" : `${progress}%`}
          </span>
        </div>
      </div>

      {/* Modern Progress Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-blue-200/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out shadow-xs ${
            step === "error"
              ? "bg-red-500"
              : step === "done"
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 animate-pulse"
          }`}
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      {/* Behind-The-Scenes Execution Steps Visual Tracker */}
      <div className="mt-3 pt-2.5 border-t border-blue-100/80 grid grid-cols-3 gap-2 text-[11px]">
        {/* Step 1 */}
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
            step === "preparing"
              ? "bg-blue-100 text-blue-900 font-bold border border-blue-300"
              : progress > 0 || step === "done"
              ? "text-emerald-700 font-medium"
              : "text-slate-400"
          }`}
        >
          {progress > 0 || step === "done" ? (
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          ) : step === "preparing" ? (
            <LoaderCircle size={13} className="animate-spin text-blue-600 shrink-0" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
          )}
          <span className="truncate">1. File Prep</span>
        </div>

        {/* Step 2 */}
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
            step === "uploading"
              ? "bg-blue-100 text-blue-900 font-bold border border-blue-300"
              : step === "processing" || step === "done"
              ? "text-emerald-700 font-medium"
              : "text-slate-400"
          }`}
        >
          {step === "processing" || step === "done" ? (
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          ) : step === "uploading" ? (
            <LoaderCircle size={13} className="animate-spin text-blue-600 shrink-0" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
          )}
          <span className="truncate">2. CDN Upload</span>
        </div>

        {/* Step 3 */}
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
            step === "processing"
              ? "bg-blue-100 text-blue-900 font-bold border border-blue-300"
              : step === "done"
              ? "text-emerald-700 font-medium"
              : "text-slate-400"
          }`}
        >
          {step === "done" ? (
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          ) : step === "processing" ? (
            <LoaderCircle size={13} className="animate-spin text-blue-600 shrink-0" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
          )}
          <span className="truncate">3. CDN Sync</span>
        </div>
      </div>
    </div>
  );
}
