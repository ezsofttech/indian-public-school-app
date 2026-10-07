"use client";

import React from "react";
import { UploadCloud, Trash2 } from "lucide-react";

interface HomeBannerTabProps {
  homeObj: any;
  updateHome: (updater: (prev: any) => any) => void;
  uploadImage: (file: File) => Promise<string>;
}

export function HomeBannerTab({ homeObj, updateHome, uploadImage }: HomeBannerTabProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
            <i className="bi bi-flag-fill text-[#1a5d9c]" /> Sliding Banner Posters
          </h3>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#102a4c]">
            <UploadCloud size={14} /> Upload New Banner Poster
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadImage(file);
                  if (url) {
                    const currentUrls = Array.isArray(homeObj.banner?.fileUrls)
                      ? homeObj.banner.fileUrls
                      : Array.isArray(homeObj.banner)
                        ? homeObj.banner.map((b: any) => typeof b === "string" ? b : b.fileUrl)
                        : [];
                    updateHome((prev) => ({
                      ...prev,
                      banner: { ...(typeof prev.banner === "object" && !Array.isArray(prev.banner) ? prev.banner : {}), fileUrls: [...currentUrls, url] },
                    }));
                  }
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            Array.isArray(homeObj.banner?.fileUrls)
              ? homeObj.banner.fileUrls
              : Array.isArray(homeObj.banner)
                ? homeObj.banner
                : []
          ).map((item: any, idx: number) => {
            const imgUrl = typeof item === "string" ? item : item?.fileUrl || "";
            return (
              <div key={idx} className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {imgUrl ? (
                  <img src={imgUrl} alt={`Banner ${idx + 1}`} className="h-full w-full object-cover" />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const currentList = Array.isArray(homeObj.banner?.fileUrls)
                      ? homeObj.banner.fileUrls
                      : Array.isArray(homeObj.banner)
                        ? homeObj.banner
                        : [];
                    const updated = currentList.filter((_: any, i: number) => i !== idx);
                    if (Array.isArray(homeObj.banner?.fileUrls)) {
                      updateHome((prev) => ({ ...prev, banner: { ...prev.banner, fileUrls: updated } }));
                    } else {
                      updateHome((prev) => ({ ...prev, banner: updated }));
                    }
                  }}
                  className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
