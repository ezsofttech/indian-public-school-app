"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  X,
  Target,
  Compass,
  Link as LinkIcon,
  Lock,
  ChevronDown,
} from "lucide-react";
import fallbackMenuItemsList from "@/public/collections/menuitems.json";
import { getAssetUrl, formatHref } from "@/lib/utils";

interface HomeSectionsTabProps {
  activeTab: string;
  homeObj: any;
  updateHome: (updater: (prev: any) => any) => void;
  addItemToSection: (secKey: string, defaultObj: any) => void;
  deleteItemFromSection: (secKey: string, index: number) => void;
  moveItemInSection: (secKey: string, index: number, dir: "up" | "down") => void;
  addTopArrayItem: (key: string, defaultObj: any) => void;
  deleteTopArrayItem: (key: string, index: number) => void;
  moveTopArrayItem: (key: string, index: number, dir: "up" | "down") => void;
  uploadImage: (file: File) => Promise<string>;
  onOpenGallery?: () => void;
  onOpenGalleryPicker?: (onSelect: (url: string) => void, title?: string) => void;
  allMenuItems?: any[];
  allSectionPages?: any[];
}

export function HomeSectionsTab({
  activeTab,
  homeObj,
  updateHome,
  addItemToSection,
  deleteItemFromSection,
  moveItemInSection,
  addTopArrayItem,
  deleteTopArrayItem,
  moveTopArrayItem,
  uploadImage,
  onOpenGallery,
  onOpenGalleryPicker,
  allMenuItems = [],
  allSectionPages = [],
}: HomeSectionsTabProps) {
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);

  const { webMenuGroups, allMenuUrls } = useMemo(() => {
    const rawMenu = (allMenuItems && allMenuItems.length > 0 ? allMenuItems : (fallbackMenuItemsList as any[])) || [];

    const itemMap = new Map<string, any>();
    rawMenu.forEach((item) => {
      if (item._id) itemMap.set(String(item._id), item);
      if (item.menuId) itemMap.set(String(item.menuId), item);
    });

    const getFullPath = (item: any): string => {
      const parts = [String(item.title || item.heading || item.name || "").trim()];
      let curr = item;
      let depth = 0;
      while (curr.parentId && itemMap.has(String(curr.parentId)) && depth < 5) {
        curr = itemMap.get(String(curr.parentId))!;
        const parentTitle = String(curr.title || curr.heading || curr.name || "").trim();
        if (parentTitle) parts.unshift(parentTitle);
        depth++;
      }
      return parts.join(" → ");
    };

    const getRootGroupName = (item: any): string => {
      let curr = item;
      let depth = 0;
      while (curr.parentId && itemMap.has(String(curr.parentId)) && depth < 5) {
        curr = itemMap.get(String(curr.parentId))!;
        depth++;
      }
      return String(curr.title || curr.category || "Main Navigation").trim();
    };

    const groups: Record<string, { title: string; url: string; fullPath: string }[]> = {};
    const urlSet = new Set<string>();

    rawMenu.forEach((item) => {
      const isPublished = item.isPublished !== false && String(item.isPublished) !== "false";
      if (!isPublished) return;
      const rawUrl = String(item.targetUrl || item.linkUrl || item.redirectUrl || item.href || (item.slug ? `/${item.slug}` : "")).trim();
      if (!rawUrl) return;
      const url = formatHref(rawUrl);
      const fullPath = getFullPath(item);
      const rootGroup = getRootGroupName(item);
      const title = String(item.title || "").trim() || fullPath;

      if (!groups[rootGroup]) groups[rootGroup] = [];
      groups[rootGroup].push({ title, url, fullPath });
      urlSet.add(url);
    });

    if (allSectionPages && allSectionPages.length > 0) {
      const secPageList: { title: string; url: string; fullPath: string }[] = [];
      allSectionPages.forEach((p) => {
        const isPublished = p.isPublished !== false && String(p.isPublished) !== "false";
        if (!isPublished) return;
        const rawUrl = String(p.targetUrl || (p.slug ? `/pages/${p.slug}` : "")).trim();
        if (!rawUrl) return;
        const url = formatHref(rawUrl);
        const title = String(p.title || p.heading || "Page").trim();
        const fullPath = `Page: ${title}`;
        secPageList.push({ title, url, fullPath });
        urlSet.add(url);
      });
      if (secPageList.length > 0) {
        groups["Section Pages & Content"] = secPageList;
      }
    }

    const inPageSections = [
      { title: "Home Page (Top)", url: "/", fullPath: "Home Page (/)" },
      { title: "About Us (Section)", url: "/#about", fullPath: "Section: About Us (/#about)" },
      { title: "Academics (Section)", url: "/#academics", fullPath: "Section: Academics (/#academics)" },
      { title: "Admissions (Section)", url: "/#admissions", fullPath: "Section: Admissions (/#admissions)" },
      { title: "Campus Life (Section)", url: "/#campus-life", fullPath: "Section: Campus Life (/#campus-life)" },
      { title: "Infrastructure (Section)", url: "/#infrastructure", fullPath: "Section: Infrastructure (/#infrastructure)" },
      { title: "Gallery (Section)", url: "/#gallery", fullPath: "Section: Gallery (/#gallery)" },
      { title: "Student Life (Section)", url: "/#student-life", fullPath: "Section: Student Life (/#student-life)" },
      { title: "Enquiry (Section)", url: "/#enquiry", fullPath: "Section: Admission Enquiry (/#enquiry)" },
      { title: "Contact Us (Section)", url: "/#contact", fullPath: "Section: Contact Us (/#contact)" },
    ];
    groups["Website Sections & In-Page Anchors"] = inPageSections;
    inPageSections.forEach((s) => urlSet.add(s.url));

    return { webMenuGroups: groups, allMenuUrls: urlSet };
  }, [allMenuItems, allSectionPages]);

  const sec1Cards = React.useMemo(() => {
    const sec = homeObj["section-1"];
    const raw = Array.isArray(sec) && Array.isArray(sec[0]?.cardItem) ? sec[0].cardItem : [];
    return [
      {
        heading: raw[0]?.heading ?? "Our Mission",
        description: raw[0]?.description ?? "",
        icoUrl: raw[0]?.icoUrl ?? raw[0]?.imageUrl ?? raw[0]?.fileUrl ?? raw[0]?.icon ?? "",
        redirectUrl: raw[0]?.redirectUrl ?? "",
      },
      {
        heading: raw[1]?.heading ?? "Our Vision",
        description: raw[1]?.description ?? "",
        icoUrl: raw[1]?.icoUrl ?? raw[1]?.imageUrl ?? raw[1]?.fileUrl ?? raw[1]?.icon ?? "",
        redirectUrl: raw[1]?.redirectUrl ?? "",
      },
    ];
  }, [homeObj]);

  const updateSec1Card = (idx: number, patch: Record<string, any>) => {
    const sec = [...(homeObj["section-1"] || [{}])];
    const raw = Array.isArray(sec[0]?.cardItem) ? sec[0].cardItem : [];
    const currentCards = [
      {
        heading: raw[0]?.heading ?? "Our Mission",
        description: raw[0]?.description ?? "",
        icoUrl: raw[0]?.icoUrl ?? raw[0]?.imageUrl ?? raw[0]?.fileUrl ?? raw[0]?.icon ?? "",
        redirectUrl: raw[0]?.redirectUrl ?? "",
      },
      {
        heading: raw[1]?.heading ?? "Our Vision",
        description: raw[1]?.description ?? "",
        icoUrl: raw[1]?.icoUrl ?? raw[1]?.imageUrl ?? raw[1]?.fileUrl ?? raw[1]?.icon ?? "",
        redirectUrl: raw[1]?.redirectUrl ?? "",
      },
    ];
    currentCards[idx] = { ...currentCards[idx], ...patch };
    sec[0] = { ...sec[0], cardItem: currentCards };
    updateHome((prev) => ({ ...prev, "section-1": sec }));
  };

  return (
    <>
      {/* TAB: Section 1 */}
      {activeTab === "sec1" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
              <i className="bi bi-building text-[#1a5d9c]" /> Section 1: About Our School
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Section Title</label>
                <input
                  type="text"
                  value={homeObj["section-1"]?.[0]?.heading || ""}
                  onChange={(e) => {
                    const sec = [...(homeObj["section-1"] || [{}])];
                    sec[0] = { ...sec[0], heading: e.target.value };
                    updateHome((prev) => ({ ...prev, "section-1": sec }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Sub Heading</label>
                <input
                  type="text"
                  value={homeObj["section-1"]?.[0]?.subHeading || ""}
                  onChange={(e) => {
                    const sec = [...(homeObj["section-1"] || [{}])];
                    sec[0] = { ...sec[0], subHeading: e.target.value };
                    updateHome((prev) => ({ ...prev, "section-1": sec }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Description Paragraph 1</label>
                <textarea
                  rows={3}
                  value={homeObj["section-1"]?.[0]?.description?.[0] || ""}
                  onChange={(e) => {
                    const sec = [...(homeObj["section-1"] || [{}])];
                    const desc = [...(sec[0].description || ["", ""])];
                    desc[0] = e.target.value;
                    sec[0] = { ...sec[0], description: desc };
                    updateHome((prev) => ({ ...prev, "section-1": sec }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Description Paragraph 2</label>
                <textarea
                  rows={3}
                  value={homeObj["section-1"]?.[0]?.description?.[1] || ""}
                  onChange={(e) => {
                    const sec = [...(homeObj["section-1"] || [{}])];
                    const desc = [...(sec[0].description || ["", ""])];
                    desc[1] = e.target.value;
                    sec[0] = { ...sec[0], description: desc };
                    updateHome((prev) => ({ ...prev, "section-1": sec }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            {/* Mission & Vision Cards */}
            <div className="space-y-3 pt-2 border-t border-slate-200/80">
              <div>
                <label className="text-xs font-bold text-[#102a4c] flex items-center gap-1.5">
                  <Target size={14} className="text-[#1a5d9c]" /> Mission &amp; Vision Cards (2)
                </label>
                <p className="text-[11px] text-slate-500">
                  Configure Our Mission (Card #1) and Our Vision (Card #2) with titles, descriptions, and consistent icon upload/gallery selection.
                </p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {sec1Cards.map((card: any, idx: number) => {
                  const iconUrl = card.icoUrl || card.imageUrl || card.fileUrl || card.icon || "";
                  const isUploading = uploadingCard === `sec1-${idx}`;

                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
                      {/* Card header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] font-bold text-[#1a5d9c] flex items-center gap-1.5">
                          <span className="flex size-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-[#1a5d9c]">
                            {idx + 1}
                          </span>
                          {idx === 0 ? "Our Mission (Card #1)" : "Our Vision (Card #2)"}
                        </span>
                      </div>

                      {/* Card Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">Title / Heading</label>
                        <input
                          type="text"
                          placeholder="Title (e.g. Our Mission)"
                          value={card.heading || ""}
                          onChange={(e) => updateSec1Card(idx, { heading: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1a5d9c]"
                        />
                      </div>

                      {/* Card Description */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">Description</label>
                        <textarea
                          rows={3}
                          placeholder="Description"
                          value={card.description || ""}
                          onChange={(e) => updateSec1Card(idx, { description: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 leading-relaxed outline-none focus:border-[#1a5d9c]"
                        />
                      </div>

                      {/* Icon / Media Upload Consistent Form */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <ImageIcon size={12} className="text-[#1a5d9c]" /> Card Icon / Image
                          </label>
                          {iconUrl && (
                            <button
                              type="button"
                              onClick={() => updateSec1Card(idx, { icoUrl: "", imageUrl: "", fileUrl: "", icon: "" })}
                              className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5 font-medium"
                            >
                              <X size={11} /> Clear Icon
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Preview thumbnail */}
                          <div
                            className="size-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-amber-50/70 grid place-items-center shadow-2xs"
                            title={iconUrl ? "Custom Icon" : idx === 0 ? "Default Target Icon" : "Default Compass Icon"}
                          >
                            {iconUrl ? (
                              <img
                                src={getAssetUrl(iconUrl)}
                                alt="Icon"
                                className="size-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : idx === 0 ? (
                              <Target size={18} className="text-amber-700" />
                            ) : idx === 1 ? (
                              <Compass size={18} className="text-amber-700" />
                            ) : (
                              <ImageIcon size={18} className="text-slate-400" />
                            )}
                          </div>

                          {/* URL input */}
                          <input
                            type="text"
                            readOnly
                            placeholder="Pick via Gallery or Upload"
                            value={iconUrl}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 outline-none cursor-not-allowed select-all font-mono truncate"
                          />

                          {/* Consistent Upload Button */}
                          <label className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c] transition cursor-pointer shrink-0 shadow-2xs">
                            {isUploading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <UploadCloud size={13} />
                            )}
                            <span>{isUploading ? "Uploading…" : "Upload"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingCard(`sec1-${idx}`);
                                  try {
                                    const url = await uploadImage(file);
                                    if (url) {
                                      updateSec1Card(idx, { icoUrl: url, imageUrl: url, fileUrl: url, icon: url });
                                    }
                                  } catch (err) {
                                    console.error("Failed to upload icon:", err);
                                  } finally {
                                    setUploadingCard(null);
                                    e.target.value = "";
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {/* Consistent Gallery Button */}
                          {onOpenGalleryPicker && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenGalleryPicker((url) => {
                                  updateSec1Card(idx, { icoUrl: url, imageUrl: url, fileUrl: url, icon: url });
                                }, `Choose Icon for ${card.heading || "Card"}`);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs"
                              title="Pick icon from Cloudinary Gallery"
                            >
                              <ImageIcon size={13} className="text-amber-500" />
                              <span>Gallery</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 1 Action Button (Discover Our Story) */}
            <div className="space-y-3 pt-3 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-[#102a4c] flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-[#1a5d9c]" /> Section Action Button ("Discover Our Story")
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Configure the call-to-action button displayed under About Our School. Choose destination directly from web menu items or toggle visibility.
                  </p>
                </div>

                {/* Toggle Button Visibility */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-slate-600">Button Status:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentShow = homeObj["section-1"]?.[0]?.btnLinkText?.show !== false;
                      const sec = [...(homeObj["section-1"] || [{}])];
                      sec[0] = {
                        ...sec[0],
                        btnLinkText: {
                          show: !currentShow,
                          text: sec[0].btnLinkText?.text ?? "Discover Our Story",
                          url: sec[0].btnLinkText?.url ?? "/about/school-establishment",
                        },
                      };
                      updateHome((prev) => ({ ...prev, "section-1": sec }));
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${homeObj["section-1"]?.[0]?.btnLinkText?.show !== false ? "bg-[#1a5d9c]" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${homeObj["section-1"]?.[0]?.btnLinkText?.show !== false ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${homeObj["section-1"]?.[0]?.btnLinkText?.show !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                  >
                    {homeObj["section-1"]?.[0]?.btnLinkText?.show !== false ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {/* 1. Button Label */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="Discover Our Story"
                    value={homeObj["section-1"]?.[0]?.btnLinkText?.text ?? "Discover Our Story"}
                    onChange={(e) => {
                      const sec = [...(homeObj["section-1"] || [{}])];
                      sec[0] = {
                        ...sec[0],
                        btnLinkText: {
                          show: sec[0].btnLinkText?.show !== false,
                          url: sec[0].btnLinkText?.url ?? "/about/school-establishment",
                          text: e.target.value,
                        },
                      };
                      updateHome((prev) => ({ ...prev, "section-1": sec }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1a5d9c] shadow-2xs hover:border-slate-300 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Label displayed on the button (e.g. Discover Our Story)
                  </p>
                </div>

                {/* 2. Web Menu Items Dropdown (No limitation to choose) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                    <span>Web Menu Item Destination</span>
                    <span className="text-[10px] font-bold text-[#1a5d9c]">
                      Select from Web Menus
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={homeObj["section-1"]?.[0]?.btnLinkText?.url ?? "/about/school-establishment"}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        const sec = [...(homeObj["section-1"] || [{}])];
                        sec[0] = {
                          ...sec[0],
                          btnLinkText: {
                            show: sec[0].btnLinkText?.show !== false,
                            text: sec[0].btnLinkText?.text ?? "Discover Our Story",
                            url: newUrl,
                          },
                        };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-xs font-semibold text-slate-800 outline-none focus:border-[#1a5d9c] cursor-pointer shadow-2xs hover:border-slate-300 transition"
                    >
                      <option value="">-- Choose Destination Menu Item --</option>
                      {Object.entries(webMenuGroups).map(([groupName, items]) => (
                        <optgroup key={groupName} label={groupName}>
                          {items.map((opt, optIdx) => (
                            <option key={`${groupName}-${opt.url}-${optIdx}`} value={opt.url}>
                              {opt.fullPath} ({opt.url})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {homeObj["section-1"]?.[0]?.btnLinkText?.url &&
                        !allMenuUrls.has(homeObj["section-1"]?.[0]?.btnLinkText?.url) && (
                          <optgroup label="Current Custom Path">
                            <option value={homeObj["section-1"]?.[0]?.btnLinkText?.url}>
                              Current: {homeObj["section-1"]?.[0]?.btnLinkText?.url}
                            </option>
                          </optgroup>
                        )}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select any web menu item, submenu, or section page
                  </p>
                </div>

                {/* 3. Target URL / Route (Disabled input) */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock size={12} className="text-slate-400" />
                      <span>Target URL / Route</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      Disabled
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      readOnly
                      placeholder="/about/school-establishment"
                      value={homeObj["section-1"]?.[0]?.btnLinkText?.url ?? "/about/school-establishment"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/90 px-3 py-2 pr-8 text-xs font-mono font-medium text-slate-600 outline-none cursor-not-allowed select-none"
                      title="Direct path input is disabled. Select a menu item from the dropdown to update this path."
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" title="Field is locked">
                      <Lock size={13} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-assigned from menu dropdown above (read-only)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 2 */}
      {activeTab === "sec2" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-bar-chart-fill text-[#1a5d9c]" /> Section 2: Key Statistics Counters ({(homeObj["section-2"] || []).length})
              </h3>
              <button
                type="button"
                onClick={() => addTopArrayItem("section-2", { count: "100+", heading: "New Stat", "sub-heading": "Stat description" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Stat Counter
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(Array.isArray(homeObj["section-2"]) ? homeObj["section-2"] : []).map((stat: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-bold text-slate-400">Stat #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveTopArrayItem("section-2", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveTopArrayItem("section-2", idx, "down")} disabled={idx === homeObj["section-2"].length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteTopArrayItem("section-2", idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Count (e.g. 1000+)"
                    value={stat.count || ""}
                    onChange={(e) => {
                      const stats = [...(homeObj["section-2"] || [])];
                      stats[idx] = { ...stats[idx], count: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-2": stats }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#1a5d9c] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Heading"
                    value={stat.heading || ""}
                    onChange={(e) => {
                      const stats = [...(homeObj["section-2"] || [])];
                      stats[idx] = { ...stats[idx], heading: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-2": stats }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 3 */}
      {activeTab === "sec3" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-star-fill text-[#1a5d9c]" /> Section 3: Why Choose IPS ({(homeObj["section-3"]?.[0]?.cardItem || []).length} Cards)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-3", { heading: "New Commitment", description: "Commitment details", icoUrl: "BookOpenCheck" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Commitment Card
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-3"]?.[0]?.cardItem) ? homeObj["section-3"][0].cardItem : []).map((card: any, idx: number) => {
                const currentIcon = card.icoUrl || card.icon || card.iconName || "";

                return (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[11px] font-bold text-slate-400">Card #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveItemInSection("section-3", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowUp size={12} />
                        </button>
                        <button type="button" onClick={() => moveItemInSection("section-3", idx, "down")} disabled={idx === homeObj["section-3"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowDown size={12} />
                        </button>
                        <button type="button" onClick={() => deleteItemFromSection("section-3", idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Card Heading / Feature Title</label>
                      <input
                        type="text"
                        placeholder="Feature Title (e.g. CBSE Curriculum)"
                        value={card.heading || ""}
                        onChange={(e) => {
                          const sec3 = [...(homeObj["section-3"] || [{}])];
                          const cards = [...(sec3[0].cardItem || [])];
                          cards[idx] = { ...cards[idx], heading: e.target.value };
                          sec3[0] = { ...sec3[0], cardItem: cards };
                          updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Card Description</label>
                      <textarea
                        rows={2}
                        placeholder="Feature Description"
                        value={card.description || ""}
                        onChange={(e) => {
                          const sec3 = [...(homeObj["section-3"] || [{}])];
                          const cards = [...(sec3[0].cardItem || [])];
                          cards[idx] = { ...cards[idx], description: e.target.value };
                          sec3[0] = { ...sec3[0], cardItem: cards };
                          updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1a5d9c]"
                      />
                    </div>
                    {/* Card Icon (Image Upload) - Same as Quick Card */}
                    <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon size={13} className="text-[#1a5d9c]" /> Icon Image
                        </span>
                        {currentIcon ? (
                          <button
                            type="button"
                            onClick={() => {
                              const sec3 = [...(homeObj["section-3"] || [{}])];
                              const cards = [...(sec3[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], icoUrl: "", icon: "", imageUrl: "", fileUrl: "" };
                              sec3[0] = { ...sec3[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                          >
                            <X size={11} /> Clear Icon
                          </button>
                        ) : null}
                      </label>

                      <div className="flex items-center gap-2">
                        {/* Thumbnail Preview */}
                        <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#123B70] grid place-items-center shadow-2xs">
                          {currentIcon ? (
                            <img
                              src={getAssetUrl(currentIcon)}
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

                        {/* Upload & Gallery Buttons */}
                        <div className="flex flex-1 items-center gap-1.5">
                          {onOpenGalleryPicker && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenGalleryPicker((url) => {
                                  const sec3 = [...(homeObj["section-3"] || [{}])];
                                  const cards = [...(sec3[0].cardItem || [])];
                                  cards[idx] = { ...cards[idx], icoUrl: url, icon: url, imageUrl: url, fileUrl: url };
                                  sec3[0] = { ...sec3[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                                }, "Choose Icon from Gallery");
                              }}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                              title="Pick icon from Cloudinary Gallery"
                            >
                              <ImageIcon size={13} className="text-amber-600" />
                              <span>Gallery</span>
                            </button>
                          )}

                          <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs">
                            <UploadCloud size={13} className="text-[#1a5d9c]" />
                            <span>{uploadingCard === `sec3-${idx}` ? "Uploading..." : "Upload"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingCard === `sec3-${idx}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingCard(`sec3-${idx}`);
                                  try {
                                    const url = await uploadImage(file);
                                    if (url) {
                                      const sec3 = [...(homeObj["section-3"] || [{}])];
                                      const cards = [...(sec3[0].cardItem || [])];
                                      cards[idx] = { ...cards[idx], icoUrl: url, icon: url, imageUrl: url, fileUrl: url };
                                      sec3[0] = { ...sec3[0], cardItem: cards };
                                      updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                                    }
                                  } catch (err) {
                                    console.error("Failed to upload icon:", err);
                                  } finally {
                                    setUploadingCard(null);
                                    e.target.value = "";
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 4 */}
      {activeTab === "sec4" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-book-fill text-[#1a5d9c]" /> Section 4: Academic Journey Stages ({(homeObj["section-4"]?.[0]?.cardItem || []).length} Stages)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-4", { heading: "Grade X – XII", mainHeading: "New Stage", description: "Stage curriculum details" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Academic Stage
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-4"]?.[0]?.cardItem) ? homeObj["section-4"][0].cardItem : []).map((stage: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-bold text-slate-400">Stage #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveItemInSection("section-4", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveItemInSection("section-4", idx, "down")} disabled={idx === homeObj["section-4"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteItemFromSection("section-4", idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Grade range"
                      value={stage.heading || ""}
                      onChange={(e) => {
                        const sec4 = [...(homeObj["section-4"] || [{}])];
                        const stages = [...(sec4[0].cardItem || [])];
                        stages[idx] = { ...stages[idx], heading: e.target.value };
                        sec4[0] = { ...sec4[0], cardItem: stages };
                        updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                      }}
                      className="w-1/2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Stage title"
                      value={stage.mainHeading || ""}
                      onChange={(e) => {
                        const sec4 = [...(homeObj["section-4"] || [{}])];
                        const stages = [...(sec4[0].cardItem || [])];
                        stages[idx] = { ...stages[idx], mainHeading: e.target.value };
                        sec4[0] = { ...sec4[0], cardItem: stages };
                        updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                      }}
                      className="w-1/2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-[#1a5d9c] outline-none"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={stage.description || ""}
                    onChange={(e) => {
                      const sec4 = [...(homeObj["section-4"] || [{}])];
                      const stages = [...(sec4[0].cardItem || [])];
                      stages[idx] = { ...stages[idx], description: e.target.value };
                      sec4[0] = { ...sec4[0], cardItem: stages };
                      updateHome((prev) => ({ ...prev, "section-4": sec4 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 6 */}
      {activeTab === "sec6" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-building-fill text-[#1a5d9c]" /> Section 5: Campus Infrastructure Cards ({(homeObj["section-6"]?.[0]?.cardItem || []).length} Cards)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-6", { title: "New Facility", heading: "New Facility", "sub-title": "Facility features", description: "Facility features", fileUrl: "", imageUrl: "" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Facility Card
              </button>
            </div>

            {/* Section Header Controls */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Eyebrow / Section Title</label>
                <input
                  type="text"
                  value={homeObj["section-6"]?.[0]?.heading || ""}
                  onChange={(e) => {
                    const sec6 = [...(homeObj["section-6"] || [{}])];
                    sec6[0] = { ...sec6[0], heading: e.target.value };
                    updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Main Heading</label>
                <input
                  type="text"
                  value={homeObj["section-6"]?.[0]?.mainHeading || ""}
                  onChange={(e) => {
                    const sec6 = [...(homeObj["section-6"] || [{}])];
                    sec6[0] = { ...sec6[0], mainHeading: e.target.value };
                    updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500">Section Description</label>
              <textarea
                rows={2}
                value={
                  Array.isArray(homeObj["section-6"]?.[0]?.description)
                    ? homeObj["section-6"][0].description[0] || ""
                    : homeObj["section-6"]?.[0]?.description || ""
                }
                onChange={(e) => {
                  const sec6 = [...(homeObj["section-6"] || [{}])];
                  sec6[0] = { ...sec6[0], description: [e.target.value] };
                  updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-6"]?.[0]?.cardItem) ? homeObj["section-6"][0].cardItem : []).map((infra: any, idx: number) => {
                const cardImgUrl = infra.fileUrl || infra.imageUrl || infra.icoUrl || "";
                const displayImgUrl = cardImgUrl ? getAssetUrl(cardImgUrl) : "";
                const isCardUploading = uploadingCard === `sec6-${idx}`;

                return (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[11px] font-bold text-slate-400">Facility #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItemInSection("section-6", idx, "up")}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                          title="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItemInSection("section-6", idx, "down")}
                          disabled={idx === (homeObj["section-6"]?.[0]?.cardItem || []).length - 1}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
                          title="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItemFromSection("section-6", idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete facility card"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Facility Title</label>
                      <input
                        type="text"
                        value={infra.title || infra.heading || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sec6 = [...(homeObj["section-6"] || [{}])];
                          const cards = [...(sec6[0].cardItem || [])];
                          cards[idx] = { ...cards[idx], title: val, heading: val };
                          sec6[0] = { ...sec6[0], cardItem: cards };
                          updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                        placeholder="e.g. Science Labs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Subtitle / Feature Description</label>
                      <input
                        type="text"
                        value={infra["sub-title"] || infra.description || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sec6 = [...(homeObj["section-6"] || [{}])];
                          const cards = [...(sec6[0].cardItem || [])];
                          cards[idx] = { ...cards[idx], "sub-title": val, description: val };
                          sec6[0] = { ...sec6[0], cardItem: cards };
                          updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1a5d9c]"
                        placeholder="e.g. Physics, chemistry and biology labs."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                      <input
                        type="text"
                        value={cardImgUrl}
                        disabled
                        readOnly
                        placeholder="No image attached"
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                      />
                    </div>

                    {/* Linked Image Preview & Actions */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Attached Facility Image</label>
                      {cardImgUrl ? (
                        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={displayImgUrl}
                            alt={infra.title || "Campus Facility"}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getAssetUrl("/Album/ClassRoom.webp") || "/assets/Settings/Home/hero-campus.png";
                            }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 rounded-md bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                            <ImageIcon size={10} className="text-amber-400" /> Attached Image
                          </div>
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {onOpenGalleryPicker && (
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenGalleryPicker((url) => {
                                    const sec6 = [...(homeObj["section-6"] || [{}])];
                                    const cards = [...(sec6[0].cardItem || [])];
                                    cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                    sec6[0] = { ...sec6[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                  }, `Choose Image for ${infra.title || "Facility"}`);
                                }}
                                className="rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-700 flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <ImageIcon size={11} /> Gallery
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const sec6 = [...(homeObj["section-6"] || [{}])];
                                const cards = [...(sec6[0].cardItem || [])];
                                cards[idx] = { ...cards[idx], fileUrl: "", imageUrl: "", icoUrl: "" };
                                sec6[0] = { ...sec6[0], cardItem: cards };
                                updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                              }}
                              className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <ImageIcon size={20} className="text-slate-300 mb-1" />
                          <span className="text-[11px] font-medium">No image attached</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {onOpenGalleryPicker && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenGalleryPicker((url) => {
                                const sec6 = [...(homeObj["section-6"] || [{}])];
                                const cards = [...(sec6[0].cardItem || [])];
                                cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                sec6[0] = { ...sec6[0], cardItem: cards };
                                updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                              }, `Choose Image for ${infra.title || "Facility"}`);
                            }}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                            title="Choose existing photo from Cloudinary Gallery"
                          >
                            <ImageIcon size={13} className="text-amber-600" /> Choose from Gallery
                          </button>
                        )}

                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50 transition-colors">
                          {isCardUploading ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-[#1a5d9c]" /> Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud size={13} /> {cardImgUrl ? "Change Upload" : "Upload Image"}
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isCardUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingCard(`sec6-${idx}`);
                                try {
                                  const url = await uploadImage(file);
                                  if (url) {
                                    const sec6 = [...(homeObj["section-6"] || [{}])];
                                    const cards = [...(sec6[0].cardItem || [])];
                                    cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                                    sec6[0] = { ...sec6[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                                  }
                                } finally {
                                  setUploadingCard(null);
                                  e.target.value = "";
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 7 */}
      {activeTab === "sec7" && (() => {
        const sec7Data = homeObj["section-7"]?.[0] || {};
        const cardsList: Array<{ title?: string; heading?: string; fileUrl: string }> = Array.isArray(sec7Data.cardItem)
          ? sec7Data.cardItem
          : [];
        const descText = Array.isArray(sec7Data.description)
          ? sec7Data.description[0] || ""
          : typeof sec7Data.description === "string"
            ? sec7Data.description
            : "";

        return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-people-fill text-[#1a5d9c]" /> Section 6: Student Life Showcase
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1a5d9c] border border-blue-100">
                  {cardsList.length} {cardsList.length === 1 ? "Image" : "Images"} configured
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Eyebrow / Sub-Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. Student Life"
                    value={sec7Data.heading || ""}
                    onChange={(e) => {
                      const sec7 = [...(homeObj["section-7"] || [{}])];
                      sec7[0] = { ...sec7[0], heading: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Main Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. A day here is never quiet"
                    value={sec7Data.mainHeading || ""}
                    onChange={(e) => {
                      const sec7 = [...(homeObj["section-7"] || [{}])];
                      sec7[0] = { ...sec7[0], mainHeading: e.target.value };
                      updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#1a5d9c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Section Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Assemblies, house matches, rehearsals, science fairs and quiet reading corners..."
                  value={descText}
                  onChange={(e) => {
                    const sec7 = [...(homeObj["section-7"] || [{}])];
                    sec7[0] = { ...sec7[0], description: [e.target.value] };
                    updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#1a5d9c] resize-none"
                />
              </div>
            </div>

            {/* Section 7 Images Grid Editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#102a4c]">Student Life Showcase Photos</h4>
                  <p className="text-[11px] text-slate-500">Upload multiple photos to display in the Student Life section masonry grid.</p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenGalleryPicker && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenGalleryPicker((url) => {
                          const currentCards = [...(homeObj["section-7"]?.[0]?.cardItem || [])];
                          const autoTitle = "Gallery Photo";
                          currentCards.push({ title: autoTitle, fileUrl: url });
                          const sec7 = [...(homeObj["section-7"] || [{}])];
                          sec7[0] = { ...sec7[0], cardItem: currentCards };
                          updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                        }, "Select Photo for Student Life from Gallery");
                      }}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                    >
                      <ImageIcon size={15} className="text-amber-600" /> Choose from Gallery
                    </button>
                  )}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white hover:bg-[#124272] transition-colors shadow-sm">
                    <Plus size={16} /> Add Image(s)
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const currentCards = [...(homeObj["section-7"]?.[0]?.cardItem || [])];
                        for (const file of files) {
                          const url = await uploadImage(file);
                          if (url) {
                            const autoTitle = file.name
                              .replace(/\.[^/.]+$/, "")
                              .replace(/[-_]/g, " ")
                              .trim();
                            currentCards.push({ title: autoTitle, fileUrl: url });
                          }
                        }
                        const sec7 = [...(homeObj["section-7"] || [{}])];
                        sec7[0] = { ...sec7[0], cardItem: currentCards };
                        updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {cardsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
                  <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No Student Life images added yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Click &quot;Add Image(s)&quot; above to upload photos for this section.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cardsList.map((card, cardIdx) => (
                    <div
                      key={`sec7-card-${cardIdx}`}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-3 hover:border-slate-300 transition-all shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                          {card.fileUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={getAssetUrl(card.fileUrl)}
                              alt={card.title || card.heading || `Student Life ${cardIdx + 1}`}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/assets/Settings/Home/hero-campus.png";
                              }}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                          <span className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                            #{cardIdx + 1}
                          </span>
                        </div>

                        <input
                          type="text"
                          placeholder="Image Caption / Title"
                          value={card.title || card.heading || ""}
                          onChange={(e) => {
                            const sec7 = [...(homeObj["section-7"] || [{}])];
                            const cards = [...(sec7[0].cardItem || [])];
                            cards[cardIdx] = { ...cards[cardIdx], title: e.target.value };
                            sec7[0] = { ...sec7[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#1a5d9c]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          {onOpenGalleryPicker && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenGalleryPicker((url) => {
                                  const sec7 = [...(homeObj["section-7"] || [{}])];
                                  const cards = [...(sec7[0].cardItem || [])];
                                  cards[cardIdx] = { ...cards[cardIdx], fileUrl: url };
                                  sec7[0] = { ...sec7[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                                }, "Pick Photo from Gallery");
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                              title="Select existing photo from Cloudinary Gallery"
                            >
                              <ImageIcon size={13} className="text-amber-600" /> Gallery
                            </button>
                          )}

                          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-[#1a5d9c] hover:underline">
                            <UploadCloud size={14} /> Change Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await uploadImage(file);
                                  if (url) {
                                    const sec7 = [...(homeObj["section-7"] || [{}])];
                                    const cards = [...(sec7[0].cardItem || [])];
                                    cards[cardIdx] = { ...cards[cardIdx], fileUrl: url };
                                    sec7[0] = { ...sec7[0], cardItem: cards };
                                    updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const sec7 = [...(homeObj["section-7"] || [{}])];
                            const cards = (sec7[0].cardItem || []).filter((_: any, idx: number) => idx !== cardIdx);
                            sec7[0] = { ...sec7[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-7": sec7 }));
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB: Video Setup */}
      {activeTab === "video" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                  <i className="bi bi-camera-video-fill text-[#1a5d9c]" /> Campus Introduction Video
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated video setup for home section. Select or upload your intro video.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Automated Video Mode
              </span>
            </div>

            {(() => {
              const secVid = homeObj["section-video"]?.[0] || {};
              const sec8 = homeObj["section-8"]?.[0] || {};
              const DEFAULT_VIDEO = "/Videos/IPSIntroVideo.mp4";
              let videoUrlVal = secVid.introFileUrl || secVid.videoUrl || sec8.introFileUrl || sec8.videoUrl;
              if (!videoUrlVal || videoUrlVal === "/IPSIntroVideo.mp4") {
                videoUrlVal = DEFAULT_VIDEO;
              }

              const updateVideoData = (updates: Record<string, any>) => {
                updateHome((prev) => {
                  const prevVid = prev["section-video"]?.[0] || {};
                  const prevSec8 = prev["section-8"]?.[0] || {};
                  const newVid = { ...prevVid, ...updates };
                  const newSec8 = { ...prevSec8, ...updates };
                  return {
                    ...prev,
                    "section-video": [newVid],
                    "section-8": [newSec8],
                  };
                });
              };

              const eyebrowVal = secVid.eyebrow || sec8.videoEyebrow || "Discover IPS";
              const titleVal = secVid.title || secVid.heading || sec8.videoTitle || "Experience life at Indian Public School";
              const descVal = secVid.description || sec8.videoDescription || "Take a look at the campus, learning spaces and student life.";
              const autoPlayVal = secVid.autoPlay ?? sec8.autoPlay ?? true;
              const loopVal = secVid.loop ?? sec8.loop ?? true;
              const mutedVal = secVid.muted ?? sec8.muted ?? true;
              const controlsVal = secVid.controls ?? sec8.controls ?? true;

              return (
                <div className="space-y-5">
                  {/* Video Main Title Settings */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-[#1a5d9c]/10 text-[#1a5d9c]">
                        <i className="bi bi-fonts text-base" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Main Title Above Video</h4>
                        <p className="text-[11px] text-slate-500">Displayed prominently above the video player on the homepage</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Video Main Title</span>
                        <span className="text-[10px] text-slate-400 font-normal">Displayed above video</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Experience Life at Indian Public School"
                        value={secVid.title || secVid.heading || sec8.videoTitle || ""}
                        onChange={(e) => updateVideoData({ title: e.target.value, heading: e.target.value, videoTitle: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#1a5d9c] focus:bg-white focus:ring-1 focus:ring-[#1a5d9c] transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Video File Selection Box */}
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      Active Intro Video File URL
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="text"
                        disabled
                        readOnly
                        placeholder="e.g. https://res.cloudinary.com/.../IPSIntroVideo.mp4"
                        value={videoUrlVal}
                        onChange={(e) => updateVideoData({ introFileUrl: e.target.value, videoUrl: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-3.5 py-2.5 text-xs font-mono outline-none shadow-2xs select-all"
                      />

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Option 1: Choose from Gallery */}
                        {onOpenGallery && (
                          <button
                            type="button"
                            onClick={onOpenGallery}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <ImageIcon size={16} /> Choose from Gallery
                          </button>
                        )}

                        {/* Option 2: Upload from Local Device */}
                        <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a5d9c] hover:bg-[#102a4c] text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer">
                          <UploadCloud size={16} />
                          <span>Upload from Local</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const url = await uploadImage(file);
                                  if (url) {
                                    updateVideoData({ introFileUrl: url, videoUrl: url });
                                  }
                                } catch (err) {
                                  console.error("Video upload failed:", err);
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Delete Button */}
                        {videoUrlVal && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove the intro video?")) {
                                updateVideoData({ introFileUrl: "", videoUrl: "" });
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                            title="Remove Video"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Video Preview */}
                  {videoUrlVal && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          Live Automated Video Preview
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {videoUrlVal.includes("cloudinary.com") ? "Hosted on Cloudinary" : "Active Video Asset"}
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-video max-h-72 flex items-center justify-center shadow-md">
                        <video
                          key={videoUrlVal}
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="h-full w-full object-contain"
                        >
                          <source src={videoUrlVal} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB: Section 8 */}
      {activeTab === "sec8" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-mortarboard-fill text-[#1a5d9c]" /> Section 7: Our Courses ({(homeObj["section-8"]?.[0]?.cardItem || []).length} Level Cards)
              </h3>
              <div className="flex items-center gap-2">
                {onOpenGalleryPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGalleryPicker((url) => {
                        const currentCards = [...(homeObj["section-8"]?.[0]?.cardItem || [])];
                        currentCards.push({ title: "New Level", description: "Course level details", fileUrl: url, imageUrl: url });
                        const sec8 = [...(homeObj["section-8"] || [{}])];
                        sec8[0] = { ...sec8[0], cardItem: currentCards };
                        updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                      }, "Select Photo for Course Level from Gallery");
                    }}
                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                  >
                    <ImageIcon size={14} className="text-amber-600" /> Choose from Gallery
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addItemToSection("section-8", { title: "New Level", description: "Course level details", fileUrl: "" })}
                  className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
                >
                  <Plus size={14} /> Add Course Level
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-8"]?.[0]?.cardItem) ? homeObj["section-8"][0].cardItem : []).map((course: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-bold text-slate-400">Course Level #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveItemInSection("section-8", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveItemInSection("section-8", idx, "down")} disabled={idx === homeObj["section-8"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteItemFromSection("section-8", idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(course.fileUrl || course.imageUrl) && (
                      <div className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAssetUrl(course.fileUrl || course.imageUrl)}
                          alt={course.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/assets/Settings/Home/hero-campus.png";
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={course.title || ""}
                      onChange={(e) => {
                        const sec8 = [...(homeObj["section-8"] || [{}])];
                        const cards = [...(sec8[0].cardItem || [])];
                        cards[idx] = { ...cards[idx], title: e.target.value };
                        sec8[0] = { ...sec8[0], cardItem: cards };
                        updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={course.description || ""}
                    onChange={(e) => {
                      const sec8 = [...(homeObj["section-8"] || [{}])];
                      const cards = [...(sec8[0].cardItem || [])];
                      cards[idx] = { ...cards[idx], description: e.target.value };
                      sec8[0] = { ...sec8[0], cardItem: cards };
                      updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none"
                  />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                    <input
                      type="text"
                      value={course.fileUrl || course.imageUrl || ""}
                      disabled
                      readOnly
                      placeholder="No image attached"
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {onOpenGalleryPicker && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenGalleryPicker((url) => {
                            const sec8 = [...(homeObj["section-8"] || [{}])];
                            const cards = [...(sec8[0].cardItem || [])];
                            cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                            sec8[0] = { ...sec8[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                          }, `Choose Image for ${course.title || "Course Level"}`);
                        }}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <ImageIcon size={13} className="text-amber-600" /> Choose from Gallery
                      </button>
                    )}
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1.5 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50">
                      <UploadCloud size={13} /> {(course.fileUrl || course.imageUrl) ? "Change Upload" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await uploadImage(file);
                            if (url) {
                              const sec8 = [...(homeObj["section-8"] || [{}])];
                              const cards = [...(sec8[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], fileUrl: url, imageUrl: url };
                              sec8[0] = { ...sec8[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Section 9 */}
      {activeTab === "sec9" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
              <i className="bi bi-person-badge-fill text-[#1a5d9c]" /> Section 8: Best CBSE School / Director Message
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Heading"
                value={homeObj["section-9"]?.[0]?.heading || ""}
                onChange={(e) => {
                  const sec9 = [...(homeObj["section-9"] || [{}])];
                  sec9[0] = { ...sec9[0], heading: e.target.value };
                  updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none"
              />
              <input
                type="text"
                placeholder="SubHeading"
                value={homeObj["section-9"]?.[0]?.subHeading || ""}
                onChange={(e) => {
                  const sec9 = [...(homeObj["section-9"] || [{}])];
                  sec9[0] = { ...sec9[0], subHeading: e.target.value };
                  updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Description"
              value={homeObj["section-9"]?.[0]?.description || ""}
              onChange={(e) => {
                const sec9 = [...(homeObj["section-9"] || [{}])];
                sec9[0] = { ...sec9[0], description: e.target.value };
                updateHome((prev) => ({ ...prev, "section-9": sec9 }));
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
            />

            {/* Director Photo */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Director / Intro Photo</span>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Image Path / URL (Disabled)</label>
                <input
                  type="text"
                  value={homeObj["section-9"]?.[0]?.fileUrls?.[0] || ""}
                  disabled
                  readOnly
                  placeholder="No image attached"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-500 cursor-not-allowed outline-none select-all"
                />
              </div>
              <div className="flex items-center gap-3">
                {homeObj["section-9"]?.[0]?.fileUrls?.[0] && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAssetUrl(homeObj["section-9"][0].fileUrls[0])}
                      alt="Director"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/assets/Settings/Home/hero-campus.png";
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-1.5">
                  {onOpenGalleryPicker && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenGalleryPicker((url) => {
                          const sec9 = [...(homeObj["section-9"] || [{}])];
                          sec9[0] = { ...sec9[0], fileUrls: [url] };
                          updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                        }, "Pick Director Photo from Gallery");
                      }}
                      className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                    >
                      <ImageIcon size={13} className="text-amber-600" /> Pick from Gallery
                    </button>
                  )}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50">
                    <UploadCloud size={14} /> Upload Director Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) {
                            const sec9 = [...(homeObj["section-9"] || [{}])];
                            sec9[0] = { ...sec9[0], fileUrls: [url] };
                            updateHome((prev) => ({ ...prev, "section-9": sec9 }));
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
