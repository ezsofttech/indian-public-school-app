"use client";

import React from "react";
import {
    Scissors,
    ArrowUp,
    Plus,
    Trash2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Ban,
    Palette,
    X,
    Paintbrush,
    Image as ImageIcon,
    Table,
} from "lucide-react";

export interface RichTextQuickActionsProps {
    selectedBlockEl: HTMLElement | null;
    selectedImageEl: HTMLImageElement | null;
    selectedAnchorEl: HTMLAnchorElement | null;
    selectedTableEl: HTMLTableElement | null;
    selectedTableRowEl: HTMLTableRowElement | null;
    selectedTableCellEl: HTMLTableCellElement | null;
    selectParentBlock: () => void;
    insertParagraphAfterSelectedBlock: () => void;
    deleteSelectedBlock: () => void;
    applyImageAlignment: (align: "left" | "center" | "right") => void;
    updateBlockBgColor: (color: string) => void;
    updatePageBgColor: (color: string) => void;
    setIsGalleryOpen: (open: boolean) => void;
    openFrameStudio?: (url?: string) => void;
    deleteSelectedImage: () => void;
    openLinkModal: (targetAnchor?: HTMLAnchorElement | null) => void;
    removeHyperlink: () => void;
    addTableRowAbove: () => void;
    addTableRowBelow: () => void;
    addTableColumnLeft: () => void;
    addTableColumnRight: () => void;
    deleteTableRow: () => void;
    deleteTableColumn: () => void;
    toggleHeaderCell: () => void;
    deleteEntireTable: () => void;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    syncIframeToState: () => void;
}

export const RichTextQuickActions: React.FC<RichTextQuickActionsProps> = ({
    selectedBlockEl,
    selectedImageEl,
    selectedAnchorEl,
    selectedTableEl,
    selectedTableRowEl,
    selectedTableCellEl,
    selectParentBlock,
    insertParagraphAfterSelectedBlock,
    deleteSelectedBlock,
    applyImageAlignment,
    updateBlockBgColor,
    updatePageBgColor,
    setIsGalleryOpen,
    openFrameStudio,
    deleteSelectedImage,
    openLinkModal,
    removeHyperlink,
    addTableRowAbove,
    addTableRowBelow,
    addTableColumnLeft,
    addTableColumnRight,
    deleteTableRow,
    deleteTableColumn,
    toggleHeaderCell,
    deleteEntireTable,
    iframeRef,
    syncIframeToState,
}) => {
    const selectedEl = selectedBlockEl || selectedImageEl || selectedAnchorEl;

    return (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50/90 p-2.5 shadow-md animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                    <Scissors size={15} className="text-blue-600 animate-pulse" /> Image & Component Suite:
                </span>
                <span className="text-[11px] font-bold text-blue-700 max-w-[220px] truncate bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedEl
                        ? `Selected: <${selectedEl.tagName.toLowerCase()}>`
                        : "Click or drag any component to edit/remove"}
                </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {selectedEl && (
                    <>
                        <button
                            type="button"
                            onClick={selectParentBlock}
                            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer animate-in fade-in"
                            title="Select Outer Parent Box / Container"
                        >
                            <ArrowUp size={13} />
                            <span>Select Outer Box</span>
                        </button>
                        <button
                            type="button"
                            onClick={insertParagraphAfterSelectedBlock}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer animate-in fade-in"
                            title="Insert a clean plain text line below selected component"
                        >
                            <Plus size={13} />
                            <span>+ Text Line Below</span>
                        </button>
                        <button
                            type="button"
                            onClick={deleteSelectedBlock}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-red-700 transition cursor-pointer animate-in fade-in"
                            title="Remove selected component or element from visual canvas"
                        >
                            <Trash2 size={13} />
                            <span>Remove Component</span>
                        </button>
                    </>
                )}

                {/* Quick Resizes */}
                <span className={`text-[10px] font-extrabold uppercase ${(!selectedBlockEl && !selectedImageEl && !selectedTableEl) ? "text-slate-400" : "text-blue-800"}`}>Width:</span>
                {[25, 50, 75, 100].map((pct) => {
                    const isDisabled = !selectedBlockEl && !selectedImageEl && !selectedTableEl;
                    return (
                        <button
                            key={pct}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                                const iframe = iframeRef.current;
                                const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
                                const target = selectedTableEl || selectedBlockEl || selectedImageEl || (doc?.querySelector(".wysiwyg-selected-block") as HTMLElement) || (doc?.querySelector("img.wysiwyg-selected-img") as HTMLElement);
                                if (target) {
                                    target.style.width = pct === 100 ? "100%" : `${pct}%`;
                                    target.style.maxWidth = "100%";
                                    if (target.tagName === "TABLE" && pct < 100 && target.style.marginLeft === "auto" && target.style.marginRight === "auto") {
                                        target.style.display = "table";
                                    }
                                    syncIframeToState();
                                }
                            }}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${isDisabled
                                ? "border-slate-200 bg-slate-100 text-slate-400 opacity-40 cursor-not-allowed"
                                : "border-blue-200 bg-white text-slate-700 hover:bg-blue-100 cursor-pointer"
                                }`}
                            title={isDisabled ? "Not Allowed / Not Applicable — Select a block box, table, or image first" : `Quick resize width to ${pct}%`}
                        >
                            {pct}%
                        </button>
                    );
                })}

                <div className="h-4 w-px bg-blue-200 mx-0.5" />

                {/* Alignment */}
                <span className={`text-[10px] font-extrabold uppercase ${(!selectedImageEl && !selectedTableEl && !selectedBlockEl) ? "text-slate-400" : "text-blue-800"}`}>Align:</span>
                {[
                    { align: "left" as const, Icon: AlignLeft, title: "Left / Float Left" },
                    { align: "center" as const, Icon: AlignCenter, title: "Center Table / Component" },
                    { align: "right" as const, Icon: AlignRight, title: "Right / Float Right" },
                ].map(({ align, Icon, title }) => {
                    const isDisabled = !selectedImageEl && !selectedTableEl && !selectedBlockEl;
                    return (
                        <button
                            key={align}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => applyImageAlignment(align)}
                            title={isDisabled ? "Not Allowed / Not Applicable — Select an image, table, or component block first" : title}
                            className={`rounded-lg border p-1 transition ${isDisabled
                                ? "border-slate-200 bg-slate-100 text-slate-400 opacity-40 cursor-not-allowed"
                                : "border-blue-200 bg-white text-slate-700 hover:bg-blue-100 cursor-pointer"
                                }`}
                        >
                            {isDisabled ? <Ban size={13} className="text-slate-400" /> : <Icon size={13} />}
                        </button>
                    );
                })}

                <div className="h-4 w-px bg-blue-200 mx-0.5" />

                {/* Box / Component Background Color Customizer */}
                {(() => {
                    const isDisabled = !selectedBlockEl && !selectedImageEl;
                    return (
                        <div
                            className={`flex items-center gap-1 border rounded-xl px-2 py-0.5 shadow-2xs transition ${isDisabled ? "bg-slate-100 border-slate-200 opacity-50" : "bg-white/90 border-blue-200"
                                }`}
                            title={isDisabled ? "Not Allowed / Not Applicable — Select a component box first to change background" : "Pick Custom Box Background Color"}
                        >
                            {isDisabled ? <Ban size={12} className="text-slate-400" /> : <Palette size={12} className="text-indigo-600" />}
                            <span className={`text-[10px] font-black uppercase ${isDisabled ? "text-slate-400" : "text-blue-900"}`}>Box BG:</span>
                            <input
                                type="color"
                                disabled={isDisabled}
                                title={isDisabled ? "Not Allowed / Not Applicable — Select a component box first" : "Pick Custom Box Background Color"}
                                onChange={(e) => updateBlockBgColor(e.target.value)}
                                className={`w-5 h-5 rounded border border-slate-300 p-0 bg-transparent ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                            />
                            {[
                                { name: "Navy", value: "#0f172a" },
                                { name: "Blue", value: "#1a5d9c" },
                                { name: "Sky", value: "#f0f9ff" },
                                { name: "Green", value: "#ecfdf5" },
                                { name: "Amber", value: "#fffbe6" },
                                { name: "Rose", value: "#fff1f2" },
                                { name: "White", value: "#ffffff" },
                                { name: "Clear", value: "transparent" },
                            ].map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    disabled={isDisabled}
                                    title={isDisabled ? "Not Allowed / Not Applicable — Select a component box first" : `Set Component BG to ${c.name}`}
                                    onClick={() => updateBlockBgColor(c.value)}
                                    className={`w-4 h-4 rounded-full border border-slate-300 transition shadow-2xs flex items-center justify-center text-[8px] font-bold ${isDisabled ? "opacity-40 cursor-not-allowed" : "hover:scale-110 cursor-pointer"
                                        }`}
                                    style={{ backgroundColor: c.value === "transparent" ? "#ffffff" : c.value }}
                                >
                                    {c.value === "transparent" ? <X size={9} className="text-slate-500" /> : null}
                                </button>
                            ))}
                        </div>
                    );
                })()}

                <div className="h-4 w-px bg-blue-200 mx-0.5" />

                {/* Full Page / Canvas Background Color Customizer */}
                <div className="flex items-center gap-1 bg-white/90 border border-emerald-200 rounded-xl px-2 py-0.5 shadow-2xs">
                    <Paintbrush size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-950 uppercase">Page BG:</span>
                    <input
                        type="color"
                        title="Pick Custom Canvas Page Background Color"
                        onChange={(e) => updatePageBgColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border border-slate-300 p-0 bg-transparent"
                    />
                    {[
                        { name: "White", value: "#ffffff" },
                        { name: "Navy", value: "#0f172a" },
                        { name: "Warm", value: "#fffbeb" },
                        { name: "Sky", value: "#f0f9ff" },
                        { name: "Emerald", value: "#ecfdf5" },
                        { name: "Night", value: "#020617" },
                        { name: "Reset", value: "transparent" },
                    ].map((c) => (
                        <button
                            key={c.name}
                            type="button"
                            title={`Set Entire Canvas Page BG to ${c.name}`}
                            onClick={() => updatePageBgColor(c.value)}
                            className="w-4 h-4 rounded-full border border-slate-300 hover:scale-110 transition shadow-2xs flex items-center justify-center text-[8px] font-bold cursor-pointer"
                            style={{ backgroundColor: c.value === "transparent" ? "#ffffff" : c.value }}
                        >
                            {c.value === "transparent" ? <X size={9} className="text-slate-500" /> : null}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-blue-200 mx-0.5" />

                {/* Gallery & Image Focal Crop */}
                <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    title="Insert / Replace from Cloudinary Media Gallery"
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                >
                    <ImageIcon size={12} />
                    <span>Gallery</span>
                </button>
                {selectedImageEl && (
                    <>
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-amber-900">Crop Focus:</span>
                            {[
                                { label: "Top (Head)", pos: "top center" },
                                { label: "Center", pos: "center center" },
                                { label: "Bottom", pos: "bottom center" },
                            ].map((fp) => (
                                <button
                                    key={fp.label}
                                    type="button"
                                    onClick={() => {
                                        selectedImageEl.style.objectPosition = fp.pos;
                                        selectedImageEl.style.objectFit = "cover";
                                        syncIframeToState();
                                    }}
                                    className="rounded bg-white border border-amber-300 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                                    title={`Set image focal point to ${fp.label}`}
                                >
                                    {fp.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={deleteSelectedImage}
                            title="Delete Image"
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                            <Trash2 size={12} />
                        </button>
                    </>
                )}
                {selectedAnchorEl && (
                    <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-2 py-1 rounded-xl">
                        <span className="text-[11px] font-extrabold text-sky-900 truncate max-w-[160px] flex items-center gap-1" title={selectedAnchorEl.getAttribute("href") || ""}>
                            <i className="bi bi-link-45deg" /> {selectedAnchorEl.getAttribute("href") || "Link"}
                        </span>
                        <button
                            type="button"
                            onClick={() => openLinkModal(selectedAnchorEl)}
                            className="rounded-lg bg-[#1a5d9c] px-2 py-0.5 text-[11px] font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                        >
                            Edit Link
                        </button>
                        <button
                            type="button"
                            onClick={removeHyperlink}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                            Remove
                        </button>
                    </div>
                )}
                {selectedTableEl && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl animate-in fade-in flex-wrap">
                        <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1">
                            <Table size={13} className="text-indigo-600" /> Table Actions:
                        </span>
                        <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => applyImageAlignment("left")}
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                                title="Align Table Left"
                            >
                                <AlignLeft size={12} /> Left
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment("center")}
                                className="rounded px-1.5 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Center Table on Page"
                            >
                                <AlignCenter size={12} /> Center Table
                            </button>
                            <button
                                type="button"
                                onClick={() => applyImageAlignment("right")}
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                                title="Align Table Right"
                            >
                                <AlignRight size={12} /> Right
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={addTableRowAbove}
                            className="rounded-lg bg-white border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Add Row Above"
                        >
                            + Row Above
                        </button>
                        <button
                            type="button"
                            onClick={addTableRowBelow}
                            className="rounded-lg bg-white border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Add Row Below"
                        >
                            + Row Below
                        </button>
                        <button
                            type="button"
                            onClick={addTableColumnLeft}
                            className="rounded-lg bg-white border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Add Column Left"
                        >
                            + Col Left
                        </button>
                        <button
                            type="button"
                            onClick={addTableColumnRight}
                            className="rounded-lg bg-white border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Add Column Right"
                        >
                            + Col Right
                        </button>
                        <button
                            type="button"
                            onClick={deleteTableRow}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            title="Delete Current Row"
                        >
                            Del Row
                        </button>
                        <button
                            type="button"
                            onClick={deleteTableColumn}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            title="Delete Current Column"
                        >
                            Del Col
                        </button>
                        {selectedTableCellEl && (
                            <button
                                type="button"
                                onClick={toggleHeaderCell}
                                className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                                title="Toggle Header (TH/TD)"
                            >
                                Header ({selectedTableCellEl.tagName.toUpperCase()})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={deleteEntireTable}
                            className="rounded-lg border border-red-200 bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white hover:bg-red-700 transition cursor-pointer"
                            title="Delete Entire Table"
                        >
                            Delete Table
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
