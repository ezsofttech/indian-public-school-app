"use client";

import React from "react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { ImageStudioModal } from "@/components/admin/ImageStudioModal";
import {
    isPdfFile,
    getCloudinaryPdfThumbnailUrl,
    isWordFile,
    isExcelFile,
    isGoogleDocUrl,
    isGoogleSheetUrl,
} from "@/lib/file-preview";
import {
    Scissors,
    Eye,
    Pencil,
    Maximize2,
    Minimize2,
    FileCode,
    Layers,
    ExternalLink,
    Ban,
} from "lucide-react";

import { PdfStudioModal } from "./richtext/PdfStudioModal";
import { FrameStudioModal } from "./richtext/FrameStudioModal";
import { TableStudioModal } from "./richtext/TableStudioModal";
import { DocStudioModal } from "./richtext/DocStudioModal";
import { LinkStudioModal } from "./richtext/LinkStudioModal";
import { RichTextToolbar } from "./richtext/RichTextToolbar";
import { RichTextToolbox } from "./richtext/RichTextToolbox";
import { RichTextQuickActions } from "./richtext/RichTextQuickActions";
import { useRichTextEditor } from "./richtext/useRichTextEditor";

interface RichTextBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextBox({
    value,
    onChange,
    placeholder = "Write or build your dynamic page content here...",
}: RichTextBoxProps) {
    const editor = useRichTextEditor({ value, onChange, placeholder });

    return (
        <div
            ref={editor.containerRef}
            className={`bg-white transition-all overflow-hidden ${editor.isFullscreen
                ? "fixed inset-0 z-[9999] h-screen w-screen flex flex-col p-0 rounded-none border-0 shadow-none"
                : "relative rounded-3xl border border-slate-200 shadow-xs"
                }`}
        >
            {/* Top Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 shrink-0">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => editor.setActiveTab("visual")}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${editor.activeTab === "visual"
                            ? "bg-white text-[#1a5d9c] shadow-2xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <Pencil size={13} /> Visual Content Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.setActiveTab("preview")}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${editor.activeTab === "preview"
                            ? "bg-white text-[#1a5d9c] shadow-2xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <Eye size={13} /> Live Page Preview
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.setActiveTab("html")}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${editor.activeTab === "html"
                            ? "bg-white text-[#1a5d9c] shadow-2xs border border-slate-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <FileCode size={13} /> HTML Code
                    </button>
                    <button
                        type="button"
                        disabled={!editor.selectedImageEl}
                        onClick={() => editor.openStudioForTargetImage()}
                        className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition ml-2 ${!editor.selectedImageEl ? "opacity-45 cursor-not-allowed hover:brightness-100" : "hover:brightness-110 cursor-pointer"}`}
                        title={!editor.selectedImageEl ? "Not Allowed / Not Applicable — Select an image in the editor first to open Image Studio" : "Image Studio (Crop, Resize, Compress)"}
                    >
                        {!editor.selectedImageEl ? <Ban size={13} className="text-white/80" /> : <Scissors size={13} />}
                        <span>Image Studio (Crop, Resize, Compress)</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {editor.activeTab === "visual" && (
                        <button
                            type="button"
                            onClick={() => editor.setShowToolbox(!editor.showToolbox)}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${editor.showToolbox
                                ? "border-blue-300 bg-blue-50 text-[#1a5d9c]"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                        >
                            <Layers size={13} />
                            <span>{editor.showToolbox ? "Hide VB Toolbox" : "Visual Components Toolbox"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            const syncKey = "rte_sync_" + Date.now();
                            if (typeof window !== "undefined") {
                                localStorage.setItem(syncKey, value || "");
                                window.open(`/admin/editor?key=${syncKey}`, "_blank");
                            }
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                        title="Open Full Interactive CMS Editor with All Tools in New Tab"
                    >
                        <ExternalLink size={13} />
                        <span>Open Editor in New Tab</span>
                    </button>

                    <button
                        type="button"
                        onClick={editor.toggleNativeFullscreen}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${editor.isFullscreen
                            ? "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                        title={editor.isFullscreen ? "Exit Fullscreen (Esc)" : "Full Native Device Screen Workspace"}
                    >
                        {editor.isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        <span>{editor.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                    </button>
                </div>
            </div>

            {/* Formatting Toolbar */}
            <RichTextToolbar
                activeTab={editor.activeTab}
                handleFormatBlock={editor.handleFormatBlock}
                execCommand={editor.execCommand}
                colorMenuOpen={editor.colorMenuOpen}
                setColorMenuOpen={editor.setColorMenuOpen}
                highlightMenuOpen={editor.highlightMenuOpen}
                setHighlightMenuOpen={editor.setHighlightMenuOpen}
                handleAddLink={editor.handleAddLink}
                handleAddImage={editor.handleAddImage}
                openTableStudio={editor.openTableStudio}
                openDocStudio={editor.openDocStudio}
                selectedBlockEl={editor.selectedBlockEl}
                selectedImageEl={editor.selectedImageEl}
                selectedAnchorEl={editor.selectedAnchorEl}
                insertParagraphAfterSelectedBlock={editor.insertParagraphAfterSelectedBlock}
                deleteSelectedBlock={editor.deleteSelectedBlock}
            />

            {/* Main Content Workspace with Visual Basic Toolbox */}
            <div className={`flex flex-col md:flex-row overflow-hidden ${editor.isFullscreen ? "flex-1" : ""}`}>
                {/* Left Side: Visual Basic Component Toolbox Panel */}
                <RichTextToolbox
                    activeTab={editor.activeTab}
                    showToolbox={editor.showToolbox}
                    selectedBlockEl={editor.selectedBlockEl}
                    selectedImageEl={editor.selectedImageEl}
                    selectedAnchorEl={editor.selectedAnchorEl}
                    deleteSelectedBlock={editor.deleteSelectedBlock}
                    toolboxComponents={editor.toolboxComponents}
                    insertComponent={editor.insertComponent}
                />

                {/* Right Side: Document Canvas / Preview / Code View */}
                <div className={`flex-1 p-3 bg-white flex flex-col ${editor.isFullscreen ? "overflow-hidden" : ""}`}>
                    {editor.activeTab === "visual" && (
                        <RichTextQuickActions
                            selectedBlockEl={editor.selectedBlockEl}
                            selectedImageEl={editor.selectedImageEl}
                            selectedAnchorEl={editor.selectedAnchorEl}
                            selectedTableEl={editor.selectedTableEl}
                            selectedTableRowEl={editor.selectedTableRowEl}
                            selectedTableCellEl={editor.selectedTableCellEl}
                            selectParentBlock={editor.selectParentBlock}
                            insertParagraphAfterSelectedBlock={editor.insertParagraphAfterSelectedBlock}
                            deleteSelectedBlock={editor.deleteSelectedBlock}
                            applyImageAlignment={editor.applyImageAlignment}
                            updateBlockBgColor={editor.updateBlockBgColor}
                            updatePageBgColor={editor.updatePageBgColor}
                            setIsGalleryOpen={editor.setIsGalleryOpen}
                            openFrameStudio={editor.openFrameStudio}
                            deleteSelectedImage={editor.deleteSelectedImage}
                            openLinkModal={editor.openLinkModal}
                            removeHyperlink={editor.removeHyperlink}
                            addTableRowAbove={editor.addTableRowAbove}
                            addTableRowBelow={editor.addTableRowBelow}
                            addTableColumnLeft={editor.addTableColumnLeft}
                            addTableColumnRight={editor.addTableColumnRight}
                            deleteTableRow={editor.deleteTableRow}
                            deleteTableColumn={editor.deleteTableColumn}
                            toggleHeaderCell={editor.toggleHeaderCell}
                            deleteEntireTable={editor.deleteEntireTable}
                            iframeRef={editor.iframeRef}
                            syncIframeToState={editor.syncIframeToState}
                        />
                    )}

                    {editor.activeTab === "visual" && (
                        <iframe
                            ref={editor.iframeRef}
                            title="Visual CMS Content Editor Workspace"
                            className={`w-full border border-slate-100 outline-none bg-white rounded-2xl ${editor.isFullscreen ? "flex-1 min-h-[70vh]" : "min-h-[460px]"
                                }`}
                        />
                    )}

                    {editor.activeTab === "preview" && (
                        <div
                            className={`w-full p-6 text-slate-800 border border-slate-100 rounded-2xl bg-white leading-relaxed text-base dynamic-page-content ${editor.isFullscreen ? "flex-1 overflow-y-auto" : "min-h-[460px]"
                                }`}
                            dangerouslySetInnerHTML={{
                                __html:
                                    value ||
                                    '<div className="py-16 text-center text-slate-400 italic"><p>No page content entered yet. Switch to Visual Editor and click any block in the Visual Component Toolbox to build!</p></div>',
                            }}
                        />
                    )}

                    {editor.activeTab === "html" && (
                        <textarea
                            value={value || ""}
                            onChange={(e) => {
                                editor.isInternalChangeRef.current = true;
                                onChange(e.target.value);
                            }}
                            placeholder="<div>Enter HTML content...</div>"
                            rows={editor.isFullscreen ? 28 : 18}
                            className="w-full font-mono text-xs leading-relaxed bg-slate-900 text-emerald-400 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/50 flex-1"
                        />
                    )}
                </div>
            </div>

            <CloudinaryGalleryModal
                isOpen={editor.isGalleryOpen}
                onClose={() => editor.setIsGalleryOpen(false)}
                onSelectImage={(url) => {
                    if (editor.isFrameStudioOpen) {
                        editor.setFrameStudioImageUrl(url);
                        editor.setIsGalleryOpen(false);
                    } else if (editor.isPdfStudioOpen) {
                        editor.setPdfStudioUrl(url);
                        const rawFileName = url.split("/").pop() || "Official Document";
                        const cleanName = rawFileName.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, "").replace(/[-_]/g, " ");
                        editor.setPdfStudioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                        editor.setIsGalleryOpen(false);
                    } else if (editor.isDocStudioOpen) {
                        editor.setDocStudioUrl(url);
                        const rawFileName = url.split("/").pop() || "Document";
                        const cleanName = rawFileName.replace(/\.(docx|doc|xlsx|xls|csv)$/i, "").replace(/[-_]/g, " ");
                        editor.setDocStudioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                        if (isExcelFile(url) || isGoogleSheetUrl(url)) {
                            editor.setDocType("excel");
                        } else if (isWordFile(url) || isGoogleDocUrl(url)) {
                            editor.setDocType("word");
                        }
                        editor.setIsGalleryOpen(false);
                    } else if (editor.selectedImageEl) {
                        editor.selectedImageEl.src = isPdfFile(url) ? getCloudinaryPdfThumbnailUrl(url, 1, 1000) : url;
                        editor.setSelectedImageEl(null);
                        editor.syncIframeToState();
                        editor.setIsGalleryOpen(false);
                    } else if (isPdfFile(url)) {
                        editor.openPdfStudio(url);
                        editor.setIsGalleryOpen(false);
                    } else if (isExcelFile(url) || isGoogleSheetUrl(url)) {
                        editor.openDocStudio("excel", url);
                        editor.setIsGalleryOpen(false);
                    } else if (isWordFile(url) || isGoogleDocUrl(url)) {
                        editor.openDocStudio("word", url);
                        editor.setIsGalleryOpen(false);
                    } else {
                        editor.insertHTML(`<img src="${url}" alt="Cloudinary Media" style="max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);" /><p><br></p>`);
                        editor.setIsGalleryOpen(false);
                    }
                }}
            />

            <ImageStudioModal
                isOpen={editor.isStudioOpen}
                onClose={() => editor.setIsStudioOpen(false)}
                initialData={editor.studioInitialData}
                onApply={({ htmlSnippet, data }) => {
                    if (editor.selectedImageEl) {
                        editor.selectedImageEl.insertAdjacentHTML("beforebegin", htmlSnippet);
                        editor.selectedImageEl.remove();
                        editor.setSelectedImageEl(null);
                        editor.syncIframeToState();
                    } else {
                        editor.insertHTML(htmlSnippet);
                    }
                }}
            />

            {/* Image Frame & Card Studio Modal */}
            <FrameStudioModal
                isOpen={editor.isFrameStudioOpen}
                initialImageUrl={editor.frameStudioImageUrl}
                onClose={() => editor.setIsFrameStudioOpen(false)}
                onOpenGallery={() => editor.setIsGalleryOpen(true)}
                onInsertHtml={editor.insertHTML}
            />

            {/* PDF Card Customizer Studio Modal */}
            <PdfStudioModal
                isOpen={editor.isPdfStudioOpen}
                initialPdfUrl={editor.pdfStudioUrl}
                onClose={() => editor.setIsPdfStudioOpen(false)}
                onOpenGallery={() => editor.setIsGalleryOpen(true)}
                onInsertHtml={editor.insertHTML}
            />

            {/* Hyperlink Creation & Edit Modal */}
            <LinkStudioModal
                isOpen={editor.isLinkModalOpen}
                editingAnchorEl={editor.editingAnchorEl}
                selectedAnchorEl={editor.selectedAnchorEl}
                linkText={editor.linkText}
                setLinkText={editor.setLinkText}
                linkUrl={editor.linkUrl}
                setLinkUrl={editor.setLinkUrl}
                linkTarget={editor.linkTarget}
                setLinkTarget={editor.setLinkTarget}
                linkStyle={editor.linkStyle}
                setLinkStyle={editor.setLinkStyle}
                onClose={() => editor.setIsLinkModalOpen(false)}
                removeHyperlink={editor.removeHyperlink}
                applyHyperlink={editor.applyHyperlink}
            />

            {/* Table Builder & CSV Import Studio Modal */}
            <TableStudioModal
                isOpen={editor.isTableStudioOpen}
                initialTab={editor.tableActiveTab}
                onClose={() => editor.setIsTableStudioOpen(false)}
                insertHTML={editor.insertHTML}
            />

            {/* Word & Excel Document Studio Modal */}
            <DocStudioModal
                isOpen={editor.isDocStudioOpen}
                onClose={() => editor.setIsDocStudioOpen(false)}
                insertHTML={editor.insertHTML}
                docType={editor.docType}
                setDocType={editor.setDocType}
                docStudioUrl={editor.docStudioUrl}
                setDocStudioUrl={editor.setDocStudioUrl}
                docStudioTitle={editor.docStudioTitle}
                setDocStudioTitle={editor.setDocStudioTitle}
                docStudioSubtitle={editor.docStudioSubtitle}
                setDocStudioSubtitle={editor.setDocStudioSubtitle}
                docStudioButtonText={editor.docStudioButtonText}
                setDocStudioButtonText={editor.setDocStudioButtonText}
                docStudioTheme={editor.docStudioTheme}
                setDocStudioTheme={editor.setDocStudioTheme}
                docStudioViewMode={editor.docStudioViewMode}
                setDocStudioViewMode={editor.setDocStudioViewMode}
                docStudioEmbedHeight={editor.docStudioEmbedHeight}
                setDocStudioEmbedHeight={editor.setDocStudioEmbedHeight}
                onOpenGallery={() => editor.setIsGalleryOpen(true)}
            />
        </div>
    );
}
