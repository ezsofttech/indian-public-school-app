"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, UploadCloud, ImageIcon, X, Link as LinkIcon } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

const DEFAULT_MENU_PATHS: { title: string; url: string }[] = [
  { title: "Home", url: "/" },
  { title: "About Us (Section)", url: "/#about" },
  { title: "About Us (Page)", url: "/about" },
  { title: "Academics (Section)", url: "/#academics" },
  { title: "Admissions (Page)", url: "/admission" },
  { title: "Contact Us (Section)", url: "/#contact" },
  { title: "Chairman's Message", url: "/about/chairman-message" },
  { title: "Principal's Desk", url: "/about/principal-message" },
  { title: "Campus Life", url: "/#campus-life" },
  { title: "Gallery (Section)", url: "/#gallery" },
  { title: "Gallery Album", url: "/gallery-album" },
  { title: "Enquiry (Section)", url: "/#enquiry" },
  { title: "Mandatory Disclosure", url: "/mandatory-disclosure" },
  { title: "Parent Portal", url: "/connectivity/parent-teacher-meeting" },
  { title: "School App", url: "/connectivity/school-app" },
  { title: "Notice & News", url: "/news" },
  { title: "Press Release", url: "/press-release" },
  { title: "Brochures", url: "/brochures" },
];

interface HomeQuickCardsTabProps {
  homeObj: any;
  updateHome: (updater: (prev: any) => any) => void;
  moveTopArrayItem?: (key: string, index: number, dir: "up" | "down") => void;
  uploadImage?: (file: File) => Promise<string>;
  menuOptions?: { title: string; url: string }[];
  onOpenGallery?: (onSelect: (url: string) => void, title?: string) => void;
}

export function HomeQuickCardsTab({
  homeObj,
  updateHome,
  moveTopArrayItem,
  uploadImage,
  menuOptions = [],
  onOpenGallery,
}: HomeQuickCardsTabProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Combine default menu paths with dynamically fetched menu options
  const pathOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_MENU_PATHS.forEach((opt) => map.set(opt.url, opt.title));
    menuOptions.forEach((opt) => {
      if (opt.url && opt.title) {
        map.set(opt.url, opt.title);
      }
    });
    return Array.from(map.entries()).map(([url, title]) => ({ title, url }));
  }, [menuOptions]);

  const handleFileUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      let url = "";
      if (uploadImage) {
        url = await uploadImage(file);
      } else {
        // Fallback FileReader if uploadImage function isn't passed
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(String(e.target?.result || ""));
          reader.readAsDataURL(file);
        });
      }
      if (url) {
        const cards = [...(homeObj.menuCard || [])];
        cards[idx] = {
          ...cards[idx],
          icoUrl: url,
          iconUrl: url,
          imageUrl: url,
        };
        updateHome((prev) => ({ ...prev, menuCard: cards }));
      }
    } catch (err) {
      console.error("Failed to upload icon image:", err);
    } finally {
      setUploadingIdx(null);
    }
  };

  const cardsList = Array.isArray(homeObj.menuCard) ? homeObj.menuCard : [];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
              <i className="bi bi-grid-3x3-gap text-[#1a5d9c]" /> Quick Action Menu Cards ({cardsList.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update heading, subheading, icon image, and redirect path for each action card.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cardsList.map((card: any, idx: number) => {
            const iconPath = card.icoUrl || card.iconUrl || card.imageUrl || card.icon || "";
            const currentRedirect = card.redirectUrl || card.linkUrl || card.href || "";

            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#1a5d9c] flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#1a5d9c]/10 text-[11px] font-bold text-[#1a5d9c]">
                      {idx + 1}
                    </span>
                    {card.heading || `Card #${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {moveTopArrayItem && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveTopArrayItem("menuCard", idx, "up")}
                          disabled={idx === 0}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTopArrayItem("menuCard", idx, "down")}
                          disabled={idx === cardsList.length - 1}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Heading */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Heading Title</label>
                  <input
                    type="text"
                    placeholder="Card Heading (e.g. Admission)"
                    value={card.heading || ""}
                    onChange={(e) => {
                      const cards = [...(homeObj.menuCard || [])];
                      cards[idx] = { ...cards[idx], heading: e.target.value };
                      updateHome((prev) => ({ ...prev, menuCard: cards }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1a5d9c]"
                  />
                </div>

                {/* SubHeading */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">SubHeading Note</label>
                  <input
                    type="text"
                    placeholder="Subheading (e.g. Session 2026-27)"
                    value={card.subHeading || ""}
                    onChange={(e) => {
                      const cards = [...(homeObj.menuCard || [])];
                      cards[idx] = { ...cards[idx], subHeading: e.target.value };
                      updateHome((prev) => ({ ...prev, menuCard: cards }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#1a5d9c]"
                  />
                </div>

                {/* Card Icon (Image Upload) */}
                <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[#1a5d9c]" /> Icon Image
                    </span>
                    {iconPath && (
                      <button
                        type="button"
                        onClick={() => {
                          const cards = [...(homeObj.menuCard || [])];
                          cards[idx] = { ...cards[idx], icoUrl: "", iconUrl: "", imageUrl: "" };
                          updateHome((prev) => ({ ...prev, menuCard: cards }));
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                      >
                        <X size={11} /> Clear Icon
                      </button>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    {/* Thumbnail Preview */}
                    <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#123B70] grid place-items-center shadow-2xs">
                      {iconPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAssetUrl(iconPath)}
                          alt="Icon Preview"
                          className="size-6 object-contain brightness-0 invert"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon size={16} className="text-slate-300" />
                      )}
                    </div>

                    {/* Gallery & Upload Buttons */}
                    <div className="flex flex-1 items-center gap-1.5">
                      {onOpenGallery && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenGallery((url) => {
                              const cards = [...(homeObj.menuCard || [])];
                              cards[idx] = { ...cards[idx], icoUrl: url, iconUrl: url, imageUrl: url, icon: url };
                              updateHome((prev) => ({ ...prev, menuCard: cards }));
                            }, "Select Card Icon from Gallery");
                          }}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                          title="Pick existing icon from Cloudinary Gallery"
                        >
                          <ImageIcon size={13} className="text-amber-600" />
                          <span>Gallery</span>
                        </button>
                      )}

                      <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs">
                        <UploadCloud size={13} className="text-[#1a5d9c]" />
                        <span>{uploadingIdx === idx ? "Uploading..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingIdx === idx}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleFileUpload(idx, file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Path / Redirect URL Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <LinkIcon size={12} className="text-[#1a5d9c]" /> Target Path / Menu Item
                  </label>

                  <select
                    value={currentRedirect}
                    onChange={(e) => {
                      const cards = [...(homeObj.menuCard || [])];
                      cards[idx] = { ...cards[idx], redirectUrl: e.target.value };
                      updateHome((prev) => ({ ...prev, menuCard: cards }));
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#1a5d9c]"
                  >
                    <option value="">-- Select Menu Item Path --</option>
                    {pathOptions.map((opt) => (
                      <option key={opt.url} value={opt.url}>
                        {opt.title} ({opt.url})
                      </option>
                    ))}
                    {currentRedirect && !pathOptions.some((opt) => opt.url === currentRedirect) && (
                      <option value={currentRedirect}>Selected Path: {currentRedirect}</option>
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

