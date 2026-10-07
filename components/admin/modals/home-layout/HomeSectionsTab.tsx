"use client";

import React from "react";
import { Plus, ArrowUp, ArrowDown, Trash2, UploadCloud, Image as ImageIcon } from "lucide-react";

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
}: HomeSectionsTabProps) {
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
                <button
                  type="button"
                  onClick={() => addItemToSection("section-1", { heading: "New Pillar", description: "Pillar details", redirectUrl: "/about" })}
                  className="flex items-center gap-1 text-xs font-bold text-[#1a5d9c] hover:underline"
                >
                  <Plus size={13} /> Add Card
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Array.isArray(homeObj["section-1"]?.[0]?.cardItem) ? homeObj["section-1"][0].cardItem : []).map((card: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Pillar #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveItemInSection("section-1", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowUp size={12} />
                        </button>
                        <button type="button" onClick={() => moveItemInSection("section-1", idx, "down")} disabled={idx === homeObj["section-1"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowDown size={12} />
                        </button>
                        <button type="button" onClick={() => deleteItemFromSection("section-1", idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
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
                  </div>
                ))}
              </div>
            </div>

            {/* Campus Photo */}
            <div className="flex items-center gap-4 pt-2">
              {homeObj["section-1"]?.[0]?.briefCard?.[0]?.fileUrl && (
                <div className="relative h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={homeObj["section-1"][0].briefCard[0].fileUrl} alt="Campus Aerial" className="h-full w-full object-cover" />
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50">
                <UploadCloud size={16} /> Upload Campus Cover Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      if (url) {
                        const sec = [...(homeObj["section-1"] || [{}])];
                        const briefCard = [...(sec[0].briefCard || [{}])];
                        briefCard[0] = { ...briefCard[0], fileUrl: url };
                        sec[0] = { ...sec[0], briefCard };
                        updateHome((prev) => ({ ...prev, "section-1": sec }));
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
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
                onClick={() => addItemToSection("section-3", { heading: "New Commitment", description: "Commitment details", icoUrl: "", redirectUrl: "/about" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Commitment Card
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-3"]?.[0]?.cardItem) ? homeObj["section-3"][0].cardItem : []).map((card: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
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
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Redirect URL / Link Target (e.g. /academics, #admissions)</label>
                    <input
                      type="text"
                      placeholder="Redirect URL (e.g. /about, /academics, #admissions)"
                      value={card.redirectUrl || card.linkUrl || card.targetUrl || card.url || ""}
                      onChange={(e) => {
                        const sec3 = [...(homeObj["section-3"] || [{}])];
                        const cards = [...(sec3[0].cardItem || [])];
                        cards[idx] = { ...cards[idx], redirectUrl: e.target.value, linkUrl: e.target.value };
                        sec3[0] = { ...sec3[0], cardItem: cards };
                        updateHome((prev) => ({ ...prev, "section-3": sec3 }));
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#1a5d9c]"
                    />
                  </div>
                </div>
              ))}
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

      {/* TAB: Section 5 */}
      {activeTab === "sec5" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-activity text-[#1a5d9c]" /> Section 5: Co-Curricular Activities ({(homeObj["section-5"]?.[0]?.cardItem || []).length} Cards)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-5", { heading: "New Activity", description: "Activity details", redirectUrl: "/about" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Activity
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-5"]?.[0]?.cardItem) ? homeObj["section-5"][0].cardItem : []).map((activity: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-bold text-slate-400">Activity #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveItemInSection("section-5", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveItemInSection("section-5", idx, "down")} disabled={idx === homeObj["section-5"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteItemFromSection("section-5", idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={activity.heading || ""}
                    onChange={(e) => {
                      const sec5 = [...(homeObj["section-5"] || [{}])];
                      const cards = [...(sec5[0].cardItem || [])];
                      cards[idx] = { ...cards[idx], heading: e.target.value };
                      sec5[0] = { ...sec5[0], cardItem: cards };
                      updateHome((prev) => ({ ...prev, "section-5": sec5 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none"
                  />
                  <textarea
                    rows={2}
                    value={activity.description || ""}
                    onChange={(e) => {
                      const sec5 = [...(homeObj["section-5"] || [{}])];
                      const cards = [...(sec5[0].cardItem || [])];
                      cards[idx] = { ...cards[idx], description: e.target.value };
                      sec5[0] = { ...sec5[0], cardItem: cards };
                      updateHome((prev) => ({ ...prev, "section-5": sec5 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none"
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-building-fill text-[#1a5d9c]" /> Section 6: Campus Infrastructure Cards ({(homeObj["section-6"]?.[0]?.cardItem || []).length} Cards)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-6", { title: "New Facility", "sub-title": "Facility features", fileUrl: "" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Facility Card
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Array.isArray(homeObj["section-6"]?.[0]?.cardItem) ? homeObj["section-6"][0].cardItem : []).map((infra: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-[11px] font-bold text-slate-400">Facility #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveItemInSection("section-6", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveItemInSection("section-6", idx, "down")} disabled={idx === homeObj["section-6"][0].cardItem.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteItemFromSection("section-6", idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={infra.title || ""}
                    onChange={(e) => {
                      const sec6 = [...(homeObj["section-6"] || [{}])];
                      const cards = [...(sec6[0].cardItem || [])];
                      cards[idx] = { ...cards[idx], title: e.target.value };
                      sec6[0] = { ...sec6[0], cardItem: cards };
                      updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    value={infra["sub-title"] || ""}
                    onChange={(e) => {
                      const sec6 = [...(homeObj["section-6"] || [{}])];
                      const cards = [...(sec6[0].cardItem || [])];
                      cards[idx] = { ...cards[idx], "sub-title": e.target.value };
                      sec6[0] = { ...sec6[0], cardItem: cards };
                      updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none"
                  />
                  <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50">
                    <UploadCloud size={13} /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) {
                            const sec6 = [...(homeObj["section-6"] || [{}])];
                            const cards = [...(sec6[0].cardItem || [])];
                            cards[idx] = { ...cards[idx], fileUrl: url };
                            sec6[0] = { ...sec6[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-6": sec6 }));
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}
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
                  <i className="bi bi-people-fill text-[#1a5d9c]" /> Section 7: Student Life Showcase
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-camera-video-fill text-[#1a5d9c]" /> Campus Introduction Video Setup
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                Controls IntroVideo section &amp; site_datasource media
              </span>
            </div>

            {(() => {
              const secVid = homeObj["section-video"]?.[0] || {};
              const sec8 = homeObj["section-8"]?.[0] || {};
              const eyebrowVal = secVid.eyebrow || sec8.videoEyebrow || "Discover IPS";
              const titleVal = secVid.title || secVid.heading || sec8.videoTitle || "Experience life at Indian Public School";
              const descVal = secVid.description || sec8.videoDescription || "Take a look at the campus, learning spaces and student life.";
              const DEFAULT_VIDEO = "/Videos/IPSIntroVideo.mp4";
              let videoUrlVal = secVid.introFileUrl || secVid.videoUrl || sec8.introFileUrl || sec8.videoUrl;
              if (!videoUrlVal || videoUrlVal === "/IPSIntroVideo.mp4") {
                videoUrlVal = DEFAULT_VIDEO;
              }
              const folderVal = secVid.cloudinaryFolder || sec8.cloudinaryFolder || "Videos";

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

              const autoPlayVal = secVid.autoPlay ?? sec8.autoPlay ?? true;
              const loopVal = secVid.loop ?? sec8.loop ?? true;
              const mutedVal = secVid.muted ?? sec8.muted ?? true;
              const controlsVal = secVid.controls ?? sec8.controls ?? true;
              const posterVal = secVid.poster || sec8.poster || secVid.posterUrl || sec8.posterUrl || "";

              return (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Eyebrow Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Discover IPS"
                        value={eyebrowVal}
                        onChange={(e) => updateVideoData({ eyebrow: e.target.value, videoEyebrow: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1a5d9c]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Main Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Experience life at Indian Public School"
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
                      placeholder="e.g. Take a look at the campus, learning spaces and student life."
                      value={descVal}
                      onChange={(e) => updateVideoData({ description: e.target.value, videoDescription: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                    <label className="text-[11px] font-bold text-[#102a4c] flex items-center gap-1.5">
                      Video Playback Controls &amp; Player Settings
                    </label>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={autoPlayVal}
                          onChange={(e) => updateVideoData({ autoPlay: e.target.checked })}
                          className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                        />
                        <span>AutoPlay Video on Load</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={loopVal}
                          onChange={(e) => updateVideoData({ loop: e.target.checked })}
                          className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                        />
                        <span>Loop Video Continuously</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={mutedVal}
                          onChange={(e) => updateVideoData({ muted: e.target.checked })}
                          className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                        />
                        <span>Mute Audio by Default</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={controlsVal}
                          onChange={(e) => updateVideoData({ controls: e.target.checked })}
                          className="rounded text-[#1a5d9c] focus:ring-[#1a5d9c]"
                        />
                        <span>Show Player Controls (Play/Pause, Sound)</span>
                      </label>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-bold text-slate-600">Video Poster / Thumbnail Frame URL (Optional)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. https://res.cloudinary.com/.../poster.jpg"
                          value={posterVal}
                          onChange={(e) => updateVideoData({ poster: e.target.value, posterUrl: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-[#1a5d9c]"
                        />
                        <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50 shrink-0">
                          <UploadCloud size={14} /> Upload Thumbnail
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = await uploadImage(file);
                                if (url) {
                                  updateVideoData({ poster: url, posterUrl: url });
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#102a4c] flex items-center gap-1.5">
                        Cloudinary Target Storage Location / Folder
                      </label>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        Direct Cloudinary Upload
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. indian-public-school/assets/Videos"
                      value={folderVal}
                      onChange={(e) => updateVideoData({ cloudinaryFolder: e.target.value })}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-[#1a5d9c]"
                    />
                    <p className="text-[11px] text-slate-500">
                      Videos uploaded here will be stored in your Cloudinary account at path: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">{folderVal}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600">Video File URL (Cloudinary Link or MP4 Path)</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. https://res.cloudinary.com/.../IPSIntroVideo.mp4"
                        value={videoUrlVal}
                        onChange={(e) => updateVideoData({ introFileUrl: e.target.value, videoUrl: e.target.value })}
                        className="flex-1 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-[#1a5d9c]"
                      />
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-500 bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shrink-0 shadow-xs">
                        <UploadCloud size={16} /> Upload Video to Cloudinary
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadImage(file);
                              if (url) {
                                updateVideoData({ introFileUrl: url, videoUrl: url });
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {videoUrlVal && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove the video from your layout?")) {
                              updateVideoData({ introFileUrl: "", videoUrl: "" });
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition shrink-0"
                        >
                          <Trash2 size={14} /> Delete Video
                        </button>
                      )}
                    </div>
                  </div>

                  {videoUrlVal && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600">Live Video Preview</label>
                        {videoUrlVal.includes("cloudinary.com") && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Hosted on Cloudinary
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 aspect-video max-h-64 flex items-center justify-center">
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-mortarboard-fill text-[#1a5d9c]" /> Section 8: Our Courses ({(homeObj["section-8"]?.[0]?.cardItem || []).length} Level Cards)
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-8", { title: "New Level", description: "Course level details", fileUrl: "" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Course Level
              </button>
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
                    {course.fileUrl && (
                      <div className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={course.fileUrl} alt={course.title} className="h-full w-full object-cover" />
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
                  <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-1 text-[11px] font-bold text-[#1a5d9c] hover:bg-blue-50">
                    <UploadCloud size={13} /> Upload Image
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
                            cards[idx] = { ...cards[idx], fileUrl: url };
                            sec8[0] = { ...sec8[0], cardItem: cards };
                            updateHome((prev) => ({ ...prev, "section-8": sec8 }));
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
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
              <i className="bi bi-person-badge-fill text-[#1a5d9c]" /> Section 9: Best CBSE School / Director Message
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

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Director Photo */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Director / Intro Photo</span>
                <div className="flex items-center gap-3">
                  {homeObj["section-9"]?.[0]?.fileUrls?.[0] && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={homeObj["section-9"][0].fileUrls[0]} alt="Director" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50">
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

              {/* Admissions Banner Background */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Admissions Banner Background</span>
                <div className="flex items-center gap-3">
                  {homeObj["section-9"]?.[0]?.bgImageUrl && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={homeObj["section-9"][0].bgImageUrl} alt="Banner Background" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-[#1a5d9c] hover:bg-blue-50">
                    <UploadCloud size={14} /> Upload Banner Background
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) {
                            const sec9 = [...(homeObj["section-9"] || [{}])];
                            sec9[0] = { ...sec9[0], bgImageUrl: url };
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

      {/* TAB: Section 10 */}
      {activeTab === "sec10" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102a4c] flex items-center gap-2">
                <i className="bi bi-newspaper text-[#1a5d9c]" /> Section 10: News & Notice Board Items ({(homeObj["section-10"]?.[0]?.list || []).length})
              </h3>
              <button
                type="button"
                onClick={() => addItemToSection("section-10", { title: "New School Notice / Announcement", createdAt: new Date().toISOString(), redirectUrl: "/news" })}
                className="flex items-center gap-1 rounded-xl bg-[#1a5d9c] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#102a4c]"
              >
                <Plus size={14} /> Add Notice Item
              </button>
            </div>

            <div className="space-y-3">
              {(Array.isArray(homeObj["section-10"]?.[0]?.list) ? homeObj["section-10"][0].list : []).map((news: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveItemInSection("section-10", idx, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => moveItemInSection("section-10", idx, "down")} disabled={idx === homeObj["section-10"][0].list.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Notice / Event Title"
                    value={news.title || ""}
                    onChange={(e) => {
                      const sec10 = [...(homeObj["section-10"] || [{}])];
                      const list = [...(sec10[0].list || [])];
                      list[idx] = { ...list[idx], title: e.target.value };
                      sec10[0] = { ...sec10[0], list };
                      updateHome((prev) => ({ ...prev, "section-10": sec10 }));
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Target Link / PDF URL"
                    value={news.redirectUrl || ""}
                    onChange={(e) => {
                      const sec10 = [...(homeObj["section-10"] || [{}])];
                      const list = [...(sec10[0].list || [])];
                      list[idx] = { ...list[idx], redirectUrl: e.target.value };
                      sec10[0] = { ...sec10[0], list };
                      updateHome((prev) => ({ ...prev, "section-10": sec10 }));
                    }}
                    className="w-1/3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => deleteItemFromSection("section-10", idx)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                    title="Delete Notice Item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
