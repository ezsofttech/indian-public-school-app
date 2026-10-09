"use client";

import React, { useState } from "react";
import { Plus, ArrowUp, ArrowDown, Trash2, UploadCloud, Image as ImageIcon, Loader2, X } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

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
}: HomeSectionsTabProps) {
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500">Mission & Vision Cards</label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Array.isArray(homeObj["section-1"]?.[0]?.cardItem) ? homeObj["section-1"][0].cardItem : []).map((card: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">{idx === 0 ? "Our Mission (Card #1)" : idx === 1 ? "Our Vision (Card #2)" : `Card #${idx + 1}`}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Title (e.g. Our Mission)"
                      value={card.heading || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        const cards = [...(sec[0].cardItem || [])];
                        cards[idx] = { ...cards[idx], heading: e.target.value };
                        sec[0] = { ...sec[0], cardItem: cards };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none"
                    />
                    <textarea
                      rows={2}
                      placeholder="Description"
                      value={card.description || ""}
                      onChange={(e) => {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        const cards = [...(sec[0].cardItem || [])];
                        cards[idx] = { ...cards[idx], description: e.target.value };
                        sec[0] = { ...sec[0], cardItem: cards };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none"
                    />

                    {/* Icon / Image Upload Controls (Gallery & Cloudinary) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        readOnly
                        placeholder="Icon/Image URL (pick via Gallery or Upload)"
                        value={card.icoUrl || card.imageUrl || card.fileUrl || card.icon || ""}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-500 outline-none cursor-not-allowed"
                      />
                      {onOpenGalleryPicker && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenGalleryPicker((url) => {
                              const sec = [...(homeObj["section-1"] || [{}])];
                              const cards = [...(sec[0].cardItem || [])];
                              cards[idx] = { ...cards[idx], icoUrl: url, imageUrl: url, fileUrl: url, icon: url };
                              sec[0] = { ...sec[0], cardItem: cards };
                              updateHome((prev) => ({ ...prev, "section-1": sec }));
                            }, "Choose Icon from Gallery");
                          }}
                          className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                          title="Pick icon from Cloudinary Gallery"
                        >
                          <ImageIcon size={13} className="text-amber-600" />
                          <span>Gallery</span>
                        </button>
                      )}
                      <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs">
                        <UploadCloud size={13} className="text-[#1a5d9c]" />
                        <span>{uploadingCard === `sec1-${idx}` ? "Uploading..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingCard === `sec1-${idx}`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingCard(`sec1-${idx}`);
                              try {
                                const url = await uploadImage(file);
                                if (url) {
                                  const sec = [...(homeObj["section-1"] || [{}])];
                                  const cards = [...(sec[0].cardItem || [])];
                                  cards[idx] = { ...cards[idx], icoUrl: url, imageUrl: url, fileUrl: url, icon: url };
                                  sec[0] = { ...sec[0], cardItem: cards };
                                  updateHome((prev) => ({ ...prev, "section-1": sec }));
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
                ))}
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
                              e.currentTarget.src = "/assets/Album/ClassRoom.webp";
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
                              src={card.fileUrl}
                              alt={card.title || card.heading || `Student Life ${cardIdx + 1}`}
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

                  {/* Collapsible Advanced Customizations */}
                  <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 transition">
                    <summary className="flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-600 cursor-pointer select-none">
                      <span>Advanced Customizations (Titles, Eyebrow &amp; Player Controls)</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-200/60">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Eyebrow Tagline</label>
                          <input
                            type="text"
                            value={eyebrowVal}
                            onChange={(e) => updateVideoData({ eyebrow: e.target.value, videoEyebrow: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Main Title</label>
                          <input
                            type="text"
                            value={titleVal}
                            onChange={(e) => updateVideoData({ title: e.target.value, heading: e.target.value, videoTitle: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Description</label>
                        <textarea
                          rows={2}
                          value={descVal}
                          onChange={(e) => updateVideoData({ description: e.target.value, videoDescription: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            checked={autoPlayVal}
                            onChange={(e) => updateVideoData({ autoPlay: e.target.checked })}
                            className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                          />
                          <span>AutoPlay Video on Load</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            checked={loopVal}
                            onChange={(e) => updateVideoData({ loop: e.target.checked })}
                            className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                          />
                          <span>Loop Video Continuously</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            checked={mutedVal}
                            onChange={(e) => updateVideoData({ muted: e.target.checked })}
                            className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                          />
                          <span>Mute Audio by Default</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                          <input
                            type="checkbox"
                            checked={controlsVal}
                            onChange={(e) => updateVideoData({ controls: e.target.checked })}
                            className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                          />
                          <span>Show Player Controls</span>
                        </label>
                      </div>
                    </div>
                  </details>
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
                        <img src={course.fileUrl || course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
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
                      <img src={homeObj["section-9"][0].fileUrls[0]} alt="Director" className="h-full w-full object-cover" />
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
