"use client";

import React, { useRef, useState, useEffect } from "react";
import { ImageStudioData } from "@/components/admin/ImageStudioModal";
import {
    isPdfFile,
    getCloudinaryPdfThumbnailUrl,
    isWordFile,
    isExcelFile,
    isGoogleDocUrl,
    isGoogleSheetUrl,
} from "@/lib/file-preview";
import { TOOLBOX_COMPONENTS } from "./richtext.constants";
import { getComponentHtmlSnippet } from "./richtext.helpers";

export interface UseRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function useRichTextEditor({
    value,
    onChange,
    placeholder = "Write or build your dynamic page content here...",
}: UseRichTextEditorProps) {
    const [activeTab, setActiveTab] = useState<"visual" | "preview" | "html">("visual");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showToolbox, setShowToolbox] = useState(true);

    const [canvasMode, setCanvasMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [pageBgColor, setPageBgColor] = useState<string>("#ffffff");

    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Image & Component Selection States
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [studioInitialData, setStudioInitialData] = useState<ImageStudioData | string | null>(null);
    const [selectedImageEl, setSelectedImageEl] = useState<HTMLImageElement | null>(null);
    const [selectedBlockEl, setSelectedBlockEl] = useState<HTMLElement | null>(null);

    // Table Customizer & CSV Import Studio States
    const [isTableStudioOpen, setIsTableStudioOpen] = useState(false);
    const [tableActiveTab, setTableActiveTab] = useState<"builder" | "csv">("builder");

    // Word & Excel Document Studio Modal States
    const [isDocStudioOpen, setIsDocStudioOpen] = useState(false);
    const [docType, setDocType] = useState<"word" | "excel">("word");
    const [docStudioUrl, setDocStudioUrl] = useState("");
    const [docStudioTitle, setDocStudioTitle] = useState("");
    const [docStudioSubtitle, setDocStudioSubtitle] = useState("");
    const [docStudioButtonText, setDocStudioButtonText] = useState("Open Document");
    const [docStudioTheme, setDocStudioTheme] = useState<"light" | "dark" | "banner" | "badge">("light");
    const [docStudioViewMode, setDocStudioViewMode] = useState<"embed" | "card">("embed");
    const [docStudioEmbedHeight, setDocStudioEmbedHeight] = useState<number>(550);

    // Selected Table Elements inside Iframe Canvas
    const [selectedTableEl, setSelectedTableEl] = useState<HTMLTableElement | null>(null);
    const [selectedTableCellEl, setSelectedTableCellEl] = useState<HTMLTableCellElement | null>(null);
    const [selectedTableRowEl, setSelectedTableRowEl] = useState<HTMLTableRowElement | null>(null);

    // PDF Studio Customizer States
    const [isPdfStudioOpen, setIsPdfStudioOpen] = useState(false);
    const [pdfStudioUrl, setPdfStudioUrl] = useState("");
    const [pdfStudioTitle, setPdfStudioTitle] = useState("Official Document Preview");
    const [pdfStudioSubtitle, setPdfStudioSubtitle] = useState("Click to view or download the document");
    const [pdfStudioButtonText, setPdfStudioButtonText] = useState("Open Document");
    const [pdfStudioTheme, setPdfStudioTheme] = useState<"light" | "dark" | "banner" | "badge">("light");
    const [pdfStudioMaxHeight, setPdfStudioMaxHeight] = useState(420);

    // Image Frame & Card Studio Modal States
    const [isFrameStudioOpen, setIsFrameStudioOpen] = useState(false);
    const [frameStudioImageUrl, setFrameStudioImageUrl] = useState("");

    // Link Creator / Hyperlink Modal States
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("https://");
    const [linkTarget, setLinkTarget] = useState<"_blank" | "_self">("_self");
    const [linkStyle, setLinkStyle] = useState<"text" | "gold-button" | "navy-button" | "outline-button" | "pill-badge">("text");
    const [editingAnchorEl, setEditingAnchorEl] = useState<HTMLAnchorElement | null>(null);
    const [selectedAnchorEl, setSelectedAnchorEl] = useState<HTMLAnchorElement | null>(null);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInternalChangeRef = useRef(false);
    const valueOnTabSwitchRef = useRef(value);

    const openPdfStudio = (url = "") => {
        if (url) {
            setPdfStudioUrl(url);
            const cleanName = url.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") || "Official Document";
            setPdfStudioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
        setIsPdfStudioOpen(true);
    };

    const openFrameStudio = (url = "") => {
        if (url) {
            setFrameStudioImageUrl(url);
        } else if (selectedImageEl?.src) {
            setFrameStudioImageUrl(selectedImageEl.src);
        } else {
            setFrameStudioImageUrl("");
        }
        setIsFrameStudioOpen(true);
    };

    const openTableStudio = (tab: "builder" | "csv" = "builder") => {
        setTableActiveTab(tab);
        setIsTableStudioOpen(true);
    };

    const openDocStudio = (type: "word" | "excel", url = "") => {
        let activeType = type;
        if (url) {
            if (isGoogleSheetUrl(url) || isExcelFile(url)) activeType = "excel";
            if (isGoogleDocUrl(url) || isWordFile(url)) activeType = "word";
        }
        setDocType(activeType);

        if (url) {
            setDocStudioUrl(url);
            if (isGoogleDocUrl(url)) {
                setDocStudioTitle("Google Document");
                setDocStudioSubtitle("Google Docs Document (Live Interactive Preview)");
                setDocStudioButtonText("Open Google Doc");
            } else if (isGoogleSheetUrl(url)) {
                setDocStudioTitle("Google Spreadsheet");
                setDocStudioSubtitle("Google Sheets Spreadsheet (Live Interactive Preview)");
                setDocStudioButtonText("Open Google Sheet");
            } else {
                const rawFileName = url.split("/").pop() || "Document";
                const cleanName = rawFileName.replace(/\.(docx|doc|xlsx|xls|csv)$/i, "").replace(/[-_]/g, " ");
                setDocStudioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                setDocStudioSubtitle(activeType === "word" ? "Word / Google Doc (.docx / .doc / Google Doc)" : "Excel / Google Sheet (.xlsx / .csv / Google Sheet)");
                setDocStudioButtonText(activeType === "word" ? "View Word / Google Doc" : "View Sheet / Spreadsheet");
            }
        } else {
            setDocStudioTitle(activeType === "word" ? "Official Word / Google Doc" : "Official Excel / Google Sheet");
            setDocStudioSubtitle(activeType === "word" ? "Word Document or Google Doc" : "Excel Worksheet or Google Sheet");
            setDocStudioButtonText(activeType === "word" ? "View Document" : "View Spreadsheet");
        }
        setIsDocStudioOpen(true);
    };

    // Sync state with native HTML5 fullscreen changes
    useEffect(() => {
        const handleFsChange = () => {
            const doc = document as any;
            const isFs = !!(
                doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement
            );
            setIsFullscreen(isFs);
        };

        document.addEventListener("fullscreenchange", handleFsChange);
        document.addEventListener("webkitfullscreenchange", handleFsChange);
        document.addEventListener("mozfullscreenchange", handleFsChange);
        document.addEventListener("MSFullscreenChange", handleFsChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFsChange);
            document.removeEventListener("webkitfullscreenchange", handleFsChange);
            document.removeEventListener("mozfullscreenchange", handleFsChange);
            document.removeEventListener("MSFullscreenChange", handleFsChange);
        };
    }, []);

    const toggleNativeFullscreen = () => {
        const doc = document as any;
        const elem = containerRef.current as any;

        const isNativeFs = !!(
            doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        );

        if (!isNativeFs) {
            if (elem) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(() => setIsFullscreen(true));
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                } else {
                    setIsFullscreen(true);
                }
            } else {
                setIsFullscreen(true);
            }
        } else {
            if (doc.exitFullscreen) {
                doc.exitFullscreen().catch(() => setIsFullscreen(false));
            } else if (doc.webkitExitFullscreen) {
                doc.webkitExitFullscreen();
            } else if (doc.mozCancelFullScreen) {
                doc.mozCancelFullScreen();
            } else if (doc.msExitFullscreen) {
                doc.msExitFullscreen();
            } else {
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        if (!isInternalChangeRef.current) {
            valueOnTabSwitchRef.current = value;
        }
    }, [value]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const channel = new BroadcastChannel("rte_sync_channel");
            channel.onmessage = (event) => {
                if (event.data?.value !== undefined) {
                    isInternalChangeRef.current = true;
                    onChange(event.data.value);
                }
            };
            return () => {
                channel.close();
            };
        } catch (e) { }
    }, [onChange]);

    // Initialize iframe document ONLY when switching tabs to "visual" mode
    useEffect(() => {
        if (activeTab !== "visual") return;

        const iframe = iframeRef.current;
        if (!iframe) return;

        const timer = setTimeout(() => {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;

            doc.designMode = "on";

            const htmlTemplate = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * {
                box-sizing: border-box !important;
              }
              html {
                background: #f1f5f9;
                padding: 16px 0;
                margin: 0;
                width: 100%;
                min-height: 100vh;
                box-sizing: border-box;
                overflow-x: hidden !important;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 15px;
                line-height: 1.7;
                color: #1e293b;
                padding: 32px 36px;
                margin: 0 auto;
                width: 100%;
                max-width: 100%;
                min-height: 580px;
                background: #ffffff;
                box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04);
                border-radius: 0;
                outline: none;
                box-sizing: border-box;
                overflow-x: hidden !important;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              img, table, iframe, pre, figure, section, div, p, blockquote {
                max-width: 100% !important;
                box-sizing: border-box !important;
              }
              body:empty:before, body[data-empty="true"]:before {
                content: attr(data-placeholder);
                color: #94a3b8;
                font-style: italic;
                position: absolute;
                pointer-events: none;
              }
              h1 { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem; margin-bottom: 0.75rem; line-height: 1.2; }
              h2 { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin-top: 1.25rem; margin-bottom: 0.5rem; }
              h3 { font-size: 1.35rem; font-weight: 600; color: #334155; margin-top: 1rem; margin-bottom: 0.375rem; }
              p { margin-top: 0; margin-bottom: 1rem; }
              ul, ol { padding-left: 1.5rem; margin-top: 0; margin-bottom: 1rem; }
              li { margin-bottom: 0.35rem; }
              blockquote {
                border-left: 4px solid #1a5d9c;
                background: #f0f7ff;
                padding: 14px 20px;
                margin: 1.25rem 0;
                border-radius: 0 14px 14px 0;
                color: #1e3a8a;
                font-style: italic;
              }
              a { color: #1a5d9c; text-decoration: underline; font-weight: 600; cursor: pointer; }
              a.wysiwyg-selected-link { outline: 2px dashed #1a5d9c !important; outline-offset: 3px !important; background-color: rgba(26, 93, 156, 0.08) !important; border-radius: 4px; }
              img { max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1); cursor: pointer; transition: all 0.2s ease; }
              img.wysiwyg-selected-img { outline: 3px solid #2563eb !important; outline-offset: 3px !important; box-shadow: 0 0 20px rgba(37, 99, 235, 0.35) !important; }
              .wysiwyg-selected-block { outline: 2px dashed #1a5d9c !important; outline-offset: 4px !important; box-shadow: 0 0 0 4px rgba(26, 93, 156, 0.12) !important; border-radius: 8px; position: relative !important; }
              .wysiwyg-resize-handle {
                position: absolute !important;
                width: 14px !important;
                height: 14px !important;
                background-color: #1a5d9c !important;
                border: 2px solid #ffffff !important;
                border-radius: 4px !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
                z-index: 99999 !important;
                cursor: nwse-resize !important;
                user-select: none !important;
              }
              .wysiwyg-resize-handle.bottom-right {
                bottom: -6px !important;
                right: -6px !important;
              }
              .wysiwyg-block-toolbar {
                position: absolute !important;
                display: inline-flex !important;
                flex-wrap: nowrap !important;
                white-space: nowrap !important;
                align-items: center !important;
                gap: 4px !important;
                width: max-content !important;
                max-width: calc(100vw - 24px) !important;
                background: #0f172a !important;
                color: #ffffff !important;
                padding: 3.5px 8px !important;
                border-radius: 9999px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2) !important;
                z-index: 9999999 !important;
                user-select: none !important;
                pointer-events: auto !important;
                transition: opacity 0.15s ease, box-shadow 0.15s ease !important;
              }
              .wysiwyg-block-toolbar:hover {
                box-shadow: 0 12px 30px -4px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(255,255,255,0.3) !important;
              }
              .wysiwyg-block-toolbar button {
                background: rgba(255,255,255,0.18) !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 9999px !important;
                padding: 2.5px 7px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 3px !important;
                white-space: nowrap !important;
                line-height: 1.3 !important;
              }
              .wysiwyg-block-toolbar button:hover {
                background: rgba(255,255,255,0.35) !important;
              }
              .wysiwyg-block-toolbar button.btn-fit-text {
                background: #6366f1 !important;
              }
              .wysiwyg-block-toolbar button.btn-fit-text:hover {
                background: #4f46e5 !important;
              }
              .wysiwyg-block-toolbar button.btn-delete {
                background: #ef4444 !important;
              }
              .wysiwyg-block-toolbar button.btn-delete:hover {
                background: #dc2626 !important;
              }
              .wysiwyg-block-toolbar button.btn-add-line {
                background: #10b981 !important;
              }
              .wysiwyg-block-toolbar button.btn-add-line:hover {
                background: #059669 !important;
              }
              body.wysiwyg-is-moving-mode,
              body.wysiwyg-is-moving-mode * {
                cursor: grabbing !important;
                cursor: -webkit-grabbing !important;
                user-select: none !important;
              }
              .wysiwyg-moving-block {
                outline: 3px dashed #f59e0b !important;
                outline-offset: 4px !important;
                box-shadow: 0 0 25px rgba(245, 158, 11, 0.5), 0 0 0 4px rgba(245, 158, 11, 0.2) !important;
                border-radius: 12px !important;
                animation: wysiwygPulseMove 1.5s infinite alternate !important;
                position: relative !important;
                cursor: grabbing !important;
              }
              @keyframes wysiwygPulseMove {
                0% { outline-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
                100% { outline-color: #3b82f6; box-shadow: 0 0 25px rgba(59, 130, 246, 0.65); }
              }
              .wysiwyg-drop-indicator {
                height: 4px !important;
                background: #3b82f6 !important;
                border-radius: 4px !important;
                margin: 8px 0 !important;
                box-shadow: 0 0 14px #3b82f6 !important;
                pointer-events: none !important;
                transition: all 0.15s ease !important;
              }
              .wysiwyg-block-toolbar button.btn-pick-move {
                background: #f59e0b !important;
                color: #0f172a !important;
              }
              .wysiwyg-block-toolbar button.btn-pick-move:hover {
                background: #d97706 !important;
                color: #ffffff !important;
              }
              hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5rem 0; }
              pre { background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 14px; font-family: monospace; overflow-x: auto; }
              table { width: 100%; border-collapse: collapse; margin: 1rem 0; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
              th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; }
              img[src=""], img:not([src]) { display: none !important; }
            </style>
            <script>
              window.addEventListener('error', function(e) {
                if (e.target && e.target.tagName === 'IMG') {
                  var img = e.target;
                  img.style.display = 'none';
                  if (img.nextElementSibling && img.nextElementSibling.style) {
                    img.nextElementSibling.style.display = 'flex';
                  }
                }
              }, true);
            </script>
          </head>
          <body>${valueOnTabSwitchRef.current || ""}</body>
        </html>
      `;

            doc.open();
            doc.write(htmlTemplate);
            doc.close();

            // Extract page background color if value was previously wrapped in wysiwyg-page-wrapper
            const existingWrapper = doc.body.querySelector(".wysiwyg-page-wrapper") as HTMLElement;
            if (existingWrapper) {
                if (existingWrapper.style.backgroundColor) {
                    doc.body.style.backgroundColor = existingWrapper.style.backgroundColor;
                }
                doc.body.innerHTML = existingWrapper.innerHTML;
            }

            const checkEmpty = () => {
                if (!doc || !doc.body) return;
                const body = doc.body;
                const hasMediaOrElements = body.querySelector("img, table, iframe, figure, div, section, blockquote, hr, svg, video, audio, h1, h2, h3, ul, ol, a") !== null;
                const textContent = body.textContent?.replace(/\u8203|\u200B|\s/g, "") || "";
                const rawHtml = body.innerHTML.trim();
                const isHtmlEmpty = !rawHtml || rawHtml === "<br>" || rawHtml === "<p><br></p>" || rawHtml === "<p></p>" || rawHtml === "<div><br></div>";

                let isEmpty = true;
                if (hasMediaOrElements) {
                    isEmpty = false;
                } else if (body.children.length > 0) {
                    const first = body.firstElementChild as HTMLElement;
                    const tag = first?.tagName?.toLowerCase();
                    if ((tag === "p" || tag === "div") && !first.querySelector("img, table, iframe, figure, svg, hr") && !first.textContent?.trim()) {
                        isEmpty = true;
                    } else {
                        isEmpty = false;
                    }
                } else if (textContent) {
                    isEmpty = false;
                }

                body.setAttribute("data-empty", String(isEmpty));
                body.setAttribute("data-placeholder", placeholder || "Write page rich text content, headings, formatting...");
            };

            checkEmpty();

            const syncContent = () => {
                checkEmpty();
                const cleanHtml = getCleanHtmlFromDoc(doc);
                isInternalChangeRef.current = true;
                onChange(cleanHtml);
            };

            const updateMovingState = (movingEl: HTMLElement | null) => {
                if (!doc || !doc.body) return;
                if (movingEl) {
                    doc.body.classList.add("wysiwyg-is-moving-mode");
                } else {
                    doc.body.classList.remove("wysiwyg-is-moving-mode");
                    doc.querySelectorAll(".wysiwyg-drop-indicator").forEach((el) => el.remove());
                }
            };

            const isComponentContainer = (el: HTMLElement): boolean => {
                if (!doc || !el || el === doc.body || el === doc.documentElement) return false;
                if (
                    el.classList.contains("wysiwyg-block-toolbar") ||
                    el.classList.contains("wysiwyg-resize-handle") ||
                    el.classList.contains("wysiwyg-drop-indicator")
                ) return false;

                const tag = el.tagName.toLowerCase();
                if (
                    tag === "section" ||
                    tag === "table" ||
                    tag === "figure" ||
                    tag === "blockquote" ||
                    tag === "h1" ||
                    tag === "h2" ||
                    tag === "h3" ||
                    tag === "h4" ||
                    tag === "h5" ||
                    tag === "h6" ||
                    tag === "p" ||
                    tag === "hr" ||
                    tag === "ul" ||
                    tag === "ol" ||
                    tag === "li" ||
                    tag === "a" ||
                    tag === "pre" ||
                    tag === "code" ||
                    tag === "iframe" ||
                    tag === "img"
                ) return true;

                if (tag === "div") {
                    const style = (el.getAttribute("style") || "").toLowerCase();
                    const classNames = (el.className || "").toLowerCase();
                    return (
                        style.includes("border") ||
                        style.includes("background") ||
                        style.includes("display: flex") ||
                        style.includes("display: grid") ||
                        classNames.includes("card") ||
                        classNames.includes("banner") ||
                        el.children.length > 0 ||
                        !!el.textContent?.trim()
                    );
                }
                return false;
            };

            const getClosestDropTarget = (target: HTMLElement, clientY: number): { dropTarget: HTMLElement; insertBefore: boolean } | null => {
                if (!doc || !doc.body) return null;
                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;

                let candidate: HTMLElement | null = target;
                while (candidate && candidate.parentElement && candidate.parentElement !== doc.body && candidate.parentElement.tagName !== "BODY") {
                    if (isComponentContainer(candidate) && candidate !== movingBlock && !movingBlock?.contains(candidate)) {
                        break;
                    }
                    candidate = candidate.parentElement;
                }

                if (!candidate || candidate === doc.body || candidate === doc.documentElement || candidate === movingBlock || movingBlock?.contains(candidate)) {
                    const bodyChildren = Array.from(doc.body.children).filter(
                        (child) =>
                            child !== movingBlock &&
                            !child.classList.contains("wysiwyg-block-toolbar") &&
                            !child.classList.contains("wysiwyg-resize-handle") &&
                            !child.classList.contains("wysiwyg-drop-indicator")
                    ) as HTMLElement[];

                    if (bodyChildren.length === 0) return null;

                    let closestChild = bodyChildren[0];
                    let minDistance = Math.abs(clientY - (closestChild.getBoundingClientRect().top + closestChild.getBoundingClientRect().height / 2));

                    for (let i = 1; i < bodyChildren.length; i++) {
                        const child = bodyChildren[i];
                        const dist = Math.abs(clientY - (child.getBoundingClientRect().top + child.getBoundingClientRect().height / 2));
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestChild = child;
                        }
                    }
                    candidate = closestChild;
                }

                if (candidate && candidate !== movingBlock && !movingBlock?.contains(candidate)) {
                    const rect = candidate.getBoundingClientRect();
                    const insertBefore = clientY < rect.top + rect.height / 2;
                    return { dropTarget: candidate, insertBefore };
                }
                return null;
            };

            function bindBlockSelection(targetBlock: HTMLElement) {
                if (!doc || !targetBlock) return;
                doc.querySelectorAll(".wysiwyg-resize-handle, .wysiwyg-block-toolbar").forEach((el) => el.remove());
                doc.querySelectorAll(".wysiwyg-selected-block").forEach((el) => el.classList.remove("wysiwyg-selected-block"));

                targetBlock.classList.add("wysiwyg-selected-block");
                setSelectedBlockEl(targetBlock);

                if (targetBlock.tagName === "A") {
                    const computedDisplay = doc.defaultView?.getComputedStyle(targetBlock).display;
                    if (!computedDisplay || computedDisplay === "inline") {
                        targetBlock.style.display = "inline-block";
                    }
                    if (!targetBlock.style.width) {
                        targetBlock.style.width = "fit-content";
                        targetBlock.style.maxWidth = "100%";
                    }
                    targetBlock.style.boxSizing = "border-box";
                    targetBlock.style.cursor = "grab";
                }

                targetBlock.setAttribute("draggable", "true");
                targetBlock.ondragstart = (dragEv: DragEvent) => {
                    dragEv.stopPropagation();
                    if (dragEv.dataTransfer) {
                        dragEv.dataTransfer.setData("text/wysiwyg-block-drag", "1");
                        dragEv.dataTransfer.effectAllowed = "move";
                    }
                    doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                    targetBlock.classList.add("wysiwyg-moving-block");
                    targetBlock.style.opacity = "0.55";
                    updateMovingState(targetBlock);
                };
                targetBlock.ondragend = () => {
                    targetBlock.style.opacity = "";
                    targetBlock.classList.remove("wysiwyg-moving-block");
                    updateMovingState(null);
                };
                targetBlock.ondblclick = (dEv: MouseEvent) => {
                    dEv.stopPropagation();
                    dEv.preventDefault();
                    if (targetBlock.classList.contains("wysiwyg-moving-block")) {
                        targetBlock.classList.remove("wysiwyg-moving-block");
                        updateMovingState(null);
                    } else {
                        doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                        targetBlock.classList.add("wysiwyg-moving-block");
                        updateMovingState(targetBlock);
                    }
                };

                const subInteractiveList = targetBlock.tagName === "IMG" || targetBlock.tagName === "A"
                    ? [targetBlock]
                    : Array.from(targetBlock.querySelectorAll<HTMLElement>("img, a"));

                subInteractiveList.forEach((subEl) => {
                    subEl.setAttribute("draggable", "true");
                    subEl.ondragstart = (dragEv: DragEvent) => {
                        dragEv.stopPropagation();
                        if (dragEv.dataTransfer) {
                            dragEv.dataTransfer.setData("text/wysiwyg-block-drag", "1");
                            dragEv.dataTransfer.effectAllowed = "move";
                        }
                        doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                        subEl.classList.add("wysiwyg-moving-block");
                        subEl.style.opacity = "0.55";
                        updateMovingState(subEl);
                    };
                    subEl.ondragend = () => {
                        subEl.style.opacity = "";
                        subEl.classList.remove("wysiwyg-moving-block");
                        updateMovingState(null);
                    };
                    subEl.ondblclick = (dEv: MouseEvent) => {
                        dEv.stopPropagation();
                        dEv.preventDefault();
                        if (subEl.classList.contains("wysiwyg-moving-block")) {
                            subEl.classList.remove("wysiwyg-moving-block");
                            updateMovingState(null);
                        } else {
                            doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                            subEl.classList.add("wysiwyg-moving-block");
                            updateMovingState(subEl);
                            bindBlockSelection(subEl);
                        }
                    };
                });

                let parentBlock: HTMLElement | null = null;
                let pCurr: HTMLElement | null = targetBlock.parentElement;
                while (pCurr && pCurr !== doc.body && pCurr.tagName !== "BODY") {
                    if (isComponentContainer(pCurr)) {
                        parentBlock = pCurr;
                        break;
                    }
                    pCurr = pCurr.parentElement;
                }

                const currentPos = doc.defaultView?.getComputedStyle(targetBlock).position;
                if (!currentPos || currentPos === "static") {
                    targetBlock.style.position = "relative";
                }

                const tb = doc.createElement("div");
                tb.className = "wysiwyg-block-toolbar";
                tb.contentEditable = "false";

                let userMovedTb = false;
                let isTbMinimized = false;

                // Intelligent positioning: places toolbar where it NEVER covers text above, below, or the element itself.
                // If user drags the toolbar manually, custom user position is strictly respected.
                const updateTbPosition = () => {
                    if (!doc || !tb.isConnected || !targetBlock.isConnected) return;
                    if (userMovedTb) return;

                    const blockRect = targetBlock.getBoundingClientRect();
                    const scrollY = doc.defaultView?.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0;
                    const scrollX = doc.defaultView?.scrollX || doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
                    const tbHeight = tb.offsetHeight || 32;
                    const tbWidth = tb.offsetWidth || 340;
                    const viewportWidth = doc.documentElement.clientWidth || doc.body.clientWidth || 800;
                    const viewportHeight = doc.documentElement.clientHeight || 600;

                    let top = 0;
                    let left = 0;

                    const spaceRight = viewportWidth - blockRect.right;
                    const spaceLeft = blockRect.left;
                    const spaceAbove = blockRect.top;

                    // If compact element (e.g. link, button, short box) and room on right,
                    // place beside it on the RIGHT so text above (like preceding lines) and below are 100% visible!
                    if (spaceRight >= tbWidth + 16) {
                        left = blockRect.right + scrollX + 10;
                        top = blockRect.top + scrollY + Math.max(0, (blockRect.height - tbHeight) / 2);
                    } else if (spaceLeft >= tbWidth + 16) {
                        // Otherwise if space to the left, place on the left
                        left = blockRect.left + scrollX - tbWidth - 10;
                        top = blockRect.top + scrollY + Math.max(0, (blockRect.height - tbHeight) / 2);
                    } else {
                        // Wide block: place above if space, else below
                        if (spaceAbove >= tbHeight + 10) {
                            top = blockRect.top + scrollY - tbHeight - 8;
                        } else {
                            top = blockRect.bottom + scrollY + 8;
                        }
                        left = blockRect.left + scrollX;
                        const maxLeft = scrollX + viewportWidth - tbWidth - 12;
                        if (left > maxLeft) {
                            left = Math.max(scrollX + 8, maxLeft);
                        }
                        if (left < scrollX + 8) {
                            left = scrollX + 8;
                        }
                    }

                    // Clamp vertically so toolbar is never clipped outside the visible viewport
                    const minTop = scrollY + 6;
                    const maxTop = scrollY + viewportHeight - tbHeight - 6;
                    top = Math.max(minTop, Math.min(top, maxTop));

                    tb.style.setProperty("top", `${Math.round(top)}px`, "important");
                    tb.style.setProperty("left", `${Math.round(left)}px`, "important");
                    tb.style.setProperty("right", "auto", "important");
                    tb.style.setProperty("bottom", "auto", "important");
                };

                const parentBtnHtml = parentBlock
                    ? `<button type="button" class="btn-select-parent" title="Switch selection to Outer Parent Box"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="m18 15-6-6-6 6"/></svg>Outer Box (&lt;${parentBlock.tagName.toLowerCase()}&gt;)</button>`
                    : ``;

                const targetImgEl = (targetBlock.tagName === "IMG" ? targetBlock : targetBlock.querySelector("img")) as HTMLImageElement | null;
                const changeImgBtnHtml = targetImgEl
                    ? `<button type="button" class="btn-change-image" title="Change / Replace Image from Media Gallery" style="background:#2563eb; color:#ffffff; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; display:inline-flex; align-items:center; gap:4px; border:none; cursor:pointer;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:2px;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>Change Image</button>`
                    : ``;

                tb.innerHTML = `
                    <span class="tb-drag-handle" title="Drag to move toolbar anywhere" style="cursor:grab; display:inline-flex; align-items:center; padding:1px 4px; color:#94a3b8; font-size:12px; line-height:1; user-select:none;">&#8942;&#8942;</span>
                    <span class="tb-tag-label" style="opacity:0.8; font-family:monospace;">&lt;${targetBlock.tagName.toLowerCase()}&gt;</span>
                    ${parentBtnHtml}
                    ${changeImgBtnHtml}
                    <button type="button" class="btn-fit-text" title="Fit Text / Link (cover only as much space as text)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M4 14h6m-6 0 3-3m-3 3 3 3"/><path d="M20 10h-6m6 0-3-3m3 3-3 3"/></svg>Fit Text</button>
                    <label style="display:inline-flex; align-items:center; gap:3px; background:rgba(255,255,255,0.18); padding:2px 6px; border-radius:4px; cursor:pointer;" title="Change Component Background Color">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.6 1.95-1.5.28-1.02-.32-2.12-1.35-2.42-.42-.12-.7-.47-.7-.91 0-.6.44-1.09 1.04-1.15.59-.06 1.13.34 1.25.93.38 1.83 1.94 3.05 3.81 3.05 2.21 0 4-1.79 4-4 0-4.42-3.58-8-8-8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/></svg>
                        <span style="font-size:10px; font-weight:800;">BG</span>
                        <input type="color" class="btn-bg-picker" style="width:16px; height:16px; border:none; padding:0; background:none; cursor:pointer;" />
                    </label>
                    <button type="button" class="btn-pick-move" title="Double-Click or Click here to Move & Auto-Arrange object anywhere"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l3-3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>Move / Auto-Arrange</button>
                    <button type="button" class="btn-add-line" title="Insert Plain Text Line Below Component"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>Text Below</button>
                    <button type="button" class="btn-move-up" title="Move Up"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg></button>
                    <button type="button" class="btn-move-down" title="Move Down"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
                    <button type="button" class="btn-delete" title="Delete Component"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>Remove</button>
                    <button type="button" class="btn-tb-minimize" title="Minimize Toolbar" style="background:rgba(255,255,255,0.12); padding:1px 6px; font-size:11px; margin-left:2px;">&minus;</button>
                `;

                // Drag handle for toolbar itself
                const dragHandle = tb.querySelector(".tb-drag-handle") as HTMLElement;
                if (dragHandle) {
                    dragHandle.addEventListener("mousedown", (dEv: MouseEvent) => {
                        dEv.stopPropagation();
                        dEv.preventDefault();
                        userMovedTb = true;
                        dragHandle.style.cursor = "grabbing";
                        const startMouseX = dEv.clientX;
                        const startMouseY = dEv.clientY;
                        const startTbLeft = parseInt(tb.style.left || "0", 10) || tb.offsetLeft;
                        const startTbTop = parseInt(tb.style.top || "0", 10) || tb.offsetTop;

                        const onTbDrag = (mEv: MouseEvent) => {
                            const dx = mEv.clientX - startMouseX;
                            const dy = mEv.clientY - startMouseY;
                            tb.style.setProperty("left", `${Math.round(startTbLeft + dx)}px`, "important");
                            tb.style.setProperty("top", `${Math.round(startTbTop + dy)}px`, "important");
                        };

                        const onTbDragEnd = () => {
                            dragHandle.style.cursor = "grab";
                            doc.removeEventListener("mousemove", onTbDrag);
                            doc.removeEventListener("mouseup", onTbDragEnd);
                            window.removeEventListener("mousemove", onTbDrag);
                            window.removeEventListener("mouseup", onTbDragEnd);
                        };

                        doc.addEventListener("mousemove", onTbDrag);
                        doc.addEventListener("mouseup", onTbDragEnd);
                        window.addEventListener("mousemove", onTbDrag);
                        window.addEventListener("mouseup", onTbDragEnd);
                    });
                }

                // Minimize / Expand toggle
                const minBtn = tb.querySelector(".btn-tb-minimize") as HTMLElement;
                if (minBtn) {
                    minBtn.addEventListener("mousedown", (evt) => {
                        evt.stopPropagation();
                        evt.preventDefault();
                        isTbMinimized = !isTbMinimized;
                        tb.querySelectorAll<HTMLElement>("button:not(.btn-tb-minimize), label, span:not(.tb-tag-label):not(.tb-drag-handle)").forEach((el) => {
                            el.style.display = isTbMinimized ? "none" : "";
                        });
                        minBtn.innerHTML = isTbMinimized ? "+" : "&minus;";
                        minBtn.title = isTbMinimized ? "Expand Toolbar" : "Minimize Toolbar";
                    });
                }

                // Fit Text / Auto-size button
                tb.querySelector(".btn-fit-text")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    targetBlock.style.width = "fit-content";
                    targetBlock.style.height = "auto";
                    targetBlock.style.maxWidth = "100%";
                    syncContent();
                    updateTbPosition();
                });

                if (targetImgEl) {
                    tb.querySelector(".btn-change-image")?.addEventListener("mousedown", (evt) => {
                        evt.stopPropagation();
                        evt.preventDefault();
                        doc.querySelectorAll("img").forEach((i) => i.classList.remove("wysiwyg-selected-img"));
                        targetImgEl.classList.add("wysiwyg-selected-img");
                        setSelectedImageEl(targetImgEl);
                        setIsGalleryOpen(true);
                    });
                }

                tb.querySelector(".btn-pick-move")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (targetBlock.classList.contains("wysiwyg-moving-block")) {
                        targetBlock.classList.remove("wysiwyg-moving-block");
                        updateMovingState(null);
                    } else {
                        doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                        targetBlock.classList.add("wysiwyg-moving-block");
                        updateMovingState(targetBlock);
                    }
                });

                if (parentBlock) {
                    tb.querySelector(".btn-select-parent")?.addEventListener("mousedown", (evt) => {
                        evt.stopPropagation();
                        evt.preventDefault();
                        bindBlockSelection(parentBlock!);
                    });
                }

                tb.querySelector(".btn-bg-picker")?.addEventListener("input", (evt: any) => {
                    evt.stopPropagation();
                    applyBgToElement(targetBlock, evt.target.value);
                    syncContent();
                });

                tb.querySelector(".btn-delete")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    targetBlock.remove();
                    setSelectedBlockEl(null);
                    setSelectedImageEl(null);
                    syncContent();
                });

                tb.querySelector(".btn-add-line")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    const newP = doc.createElement("p");
                    newP.innerHTML = "<br>";
                    targetBlock.insertAdjacentElement("afterend", newP);

                    const sel = doc.getSelection();
                    if (sel) {
                        const range = doc.createRange();
                        range.setStart(newP, 0);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    syncContent();
                });

                tb.querySelector(".btn-move-up")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (targetBlock.previousElementSibling) {
                        targetBlock.parentNode?.insertBefore(targetBlock, targetBlock.previousElementSibling);
                        syncContent();
                    }
                });

                tb.querySelector(".btn-move-down")?.addEventListener("mousedown", (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (targetBlock.nextElementSibling) {
                        targetBlock.parentNode?.insertBefore(targetBlock.nextElementSibling, targetBlock);
                        syncContent();
                    }
                });

                doc.body.appendChild(tb);
                updateTbPosition();
                requestAnimationFrame(updateTbPosition);

                const onDocReposition = () => {
                    if (tb.isConnected && targetBlock.isConnected) {
                        updateTbPosition();
                    }
                };
                doc.addEventListener("scroll", onDocReposition, { passive: true });
                doc.defaultView?.addEventListener("resize", onDocReposition);

                const handle = doc.createElement("div");
                handle.className = "wysiwyg-resize-handle bottom-right";
                handle.title = "Drag corner to extend or reduce size | Double-click to Fit Text/Link";
                handle.contentEditable = "false";

                let startX = 0;
                let startY = 0;
                let startW = 0;
                let startH = 0;

                const onMouseMove = (moveEv: MouseEvent) => {
                    const dx = moveEv.clientX - startX;
                    const dy = moveEv.clientY - startY;
                    // Unrestricted minimum resizing: can shrink smoothly down to 20px, or expand as large as desired
                    const newW = Math.max(20, startW + dx);
                    targetBlock.style.width = newW + "px";
                    targetBlock.style.maxWidth = "100%";
                    if (Math.abs(dy) > 4) {
                        const newH = Math.max(16, startH + dy);
                        targetBlock.style.height = newH + "px";
                    }
                    updateTbPosition();
                };

                const onMouseUp = () => {
                    doc.removeEventListener("mousemove", onMouseMove);
                    doc.removeEventListener("mouseup", onMouseUp);
                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("mouseup", onMouseUp);
                    syncContent();
                    updateTbPosition();
                };

                handle.addEventListener("mousedown", (mEv: MouseEvent) => {
                    mEv.stopPropagation();
                    mEv.preventDefault();
                    startX = mEv.clientX;
                    startY = mEv.clientY;
                    startW = targetBlock.offsetWidth;
                    startH = targetBlock.offsetHeight;

                    doc.addEventListener("mousemove", onMouseMove);
                    doc.addEventListener("mouseup", onMouseUp);
                    window.addEventListener("mousemove", onMouseMove);
                    window.addEventListener("mouseup", onMouseUp);
                });

                // Double click resize handle resets to fit text/link content tightly
                handle.addEventListener("dblclick", (dEv: MouseEvent) => {
                    dEv.stopPropagation();
                    dEv.preventDefault();
                    targetBlock.style.width = "fit-content";
                    targetBlock.style.height = "auto";
                    targetBlock.style.maxWidth = "100%";
                    syncContent();
                    updateTbPosition();
                });

                if (targetBlock.tagName !== "SPAN") {
                    targetBlock.appendChild(handle);
                }
            }

            const handleDocMouseMove = (e: MouseEvent) => {
                if (!doc) return;
                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;
                if (!movingBlock) return;

                updateMovingState(movingBlock);

                const result = getClosestDropTarget(e.target as HTMLElement, e.clientY);

                doc.querySelectorAll(".wysiwyg-drop-indicator").forEach((el) => el.remove());

                if (result) {
                    const indicator = doc.createElement("div");
                    indicator.className = "wysiwyg-drop-indicator";
                    indicator.contentEditable = "false";
                    if (result.insertBefore) {
                        result.dropTarget.parentNode?.insertBefore(indicator, result.dropTarget);
                    } else {
                        result.dropTarget.parentNode?.insertBefore(indicator, result.dropTarget.nextElementSibling);
                    }
                }
            };

            const handleDocClick = (e: MouseEvent) => {
                if (!doc) return;
                const target = e.target as HTMLElement;

                if (target?.closest?.(".wysiwyg-block-toolbar") || target?.closest?.(".wysiwyg-resize-handle")) {
                    return;
                }

                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;
                if (movingBlock) {
                    e.preventDefault();
                    e.stopPropagation();

                    const result = getClosestDropTarget(target, e.clientY);
                    if (result) {
                        if (result.insertBefore) {
                            result.dropTarget.parentNode?.insertBefore(movingBlock, result.dropTarget);
                        } else {
                            result.dropTarget.parentNode?.insertBefore(movingBlock, result.dropTarget.nextElementSibling);
                        }
                    } else {
                        doc.body.appendChild(movingBlock);
                    }

                    movingBlock.classList.remove("wysiwyg-moving-block");
                    updateMovingState(null);
                    bindBlockSelection(movingBlock);
                    syncContent();
                    return;
                }

                const imgEl = (target && target.tagName === "IMG" ? target : target?.closest?.("img")) as HTMLImageElement | null;
                const anchorEl = (target && target.tagName === "A" ? target : target?.closest?.("a")) as HTMLAnchorElement | null;

                if (imgEl) {
                    imgEl.classList.add("wysiwyg-selected-img");
                    setSelectedImageEl(imgEl);

                    if (imgEl.closest("section, article")) {
                        const parentComp = imgEl.closest("section, article") as HTMLElement;
                        bindBlockSelection(parentComp);
                        return;
                    }

                    let container: HTMLElement;
                    if (imgEl.parentElement && imgEl.parentElement.classList.contains("wysiwyg-img-container")) {
                        container = imgEl.parentElement;
                    } else {
                        container = doc.createElement("figure");
                        container.className = "wysiwyg-img-container";
                        container.style.position = "relative";
                        container.style.display = imgEl.style.display === "block" ? "block" : "inline-block";
                        container.style.margin = imgEl.style.margin || "12px 0";
                        container.style.maxWidth = "100%";
                        container.style.width = imgEl.style.width || "auto";
                        imgEl.parentNode?.insertBefore(container, imgEl);
                        container.appendChild(imgEl);
                    }

                    bindBlockSelection(container);
                    return;
                }

                if (anchorEl) {
                    doc.querySelectorAll("a.wysiwyg-selected-link").forEach((el) => el.classList.remove("wysiwyg-selected-link"));
                    anchorEl.classList.add("wysiwyg-selected-link");
                    setSelectedAnchorEl(anchorEl);
                    bindBlockSelection(anchorEl);
                    return;
                }

                let topBlock: HTMLElement | null = null;
                let curr: HTMLElement | null = target;
                while (curr && curr.parentElement && curr.parentElement !== doc.body && curr.parentElement.tagName !== "BODY") {
                    if (isComponentContainer(curr)) {
                        topBlock = curr;
                        break;
                    }
                    curr = curr.parentElement;
                }
                if (!topBlock && curr && curr !== doc.body && isComponentContainer(curr)) {
                    topBlock = curr;
                }
                if (topBlock) {
                    bindBlockSelection(topBlock);
                }
            };

            const handleSelectionOrInput = () => {
                const selectedImg = doc.querySelector("img.wysiwyg-selected-img") as HTMLElement;
                const selectedBlock = doc.querySelector(".wysiwyg-selected-block") as HTMLElement;
                const selectedLink = doc.querySelector("a.wysiwyg-selected-link") as HTMLElement;

                const activeTarget = selectedImg || selectedLink || selectedBlock;
                if (!activeTarget) return;

                const sel = doc.getSelection();
                const isTextSelection = sel && sel.toString().length > 0;

                const activeElem = doc.activeElement as HTMLElement;
                const isInsideFormInput = activeElem && (activeElem.tagName === "INPUT" || activeElem.tagName === "TEXTAREA" || activeElem.isContentEditable);

                if (isTextSelection || isInsideFormInput) {
                    doc.querySelectorAll(".wysiwyg-resize-handle, .wysiwyg-block-toolbar").forEach((el) => el.remove());
                    doc.querySelectorAll(".wysiwyg-selected-block").forEach((el) => el.classList.remove("wysiwyg-selected-block"));
                    doc.querySelectorAll("img").forEach((img) => img.classList.remove("wysiwyg-selected-img"));
                    doc.querySelectorAll("a").forEach((a) => a.classList.remove("wysiwyg-selected-link"));

                    setSelectedBlockEl(null);
                    setSelectedImageEl(null);
                    setSelectedAnchorEl(null);
                }
            };

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Enter") {
                    const sel = doc.getSelection();
                    if (!sel || !sel.rangeCount) return;

                    const range = sel.getRangeAt(0);
                    const container = range.startContainer.parentElement;

                    const topBlock = container?.closest("section, blockquote, figure, table, div") as HTMLElement | null;

                    if (topBlock && !topBlock.classList.contains("wysiwyg-img-container") && topBlock.tagName !== "TD" && topBlock.tagName !== "TH") {
                        e.preventDefault();

                        const newP = doc.createElement("p");
                        newP.innerHTML = "<br>";

                        topBlock.insertAdjacentElement("afterend", newP);

                        const newRange = doc.createRange();
                        newRange.setStart(newP, 0);
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);

                        syncContent();
                    }
                }
            };

            const handleDragOver = (e: DragEvent) => {
                e.preventDefault();
                if (!doc) return;
                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;

                if (movingBlock) {
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = "move";
                    }
                    const result = getClosestDropTarget(e.target as HTMLElement, e.clientY);

                    if (result) {
                        doc.querySelectorAll(".wysiwyg-drop-indicator").forEach((el) => el.remove());
                        const indicator = doc.createElement("div");
                        indicator.className = "wysiwyg-drop-indicator";
                        indicator.contentEditable = "false";

                        if (result.insertBefore) {
                            result.dropTarget.parentNode?.insertBefore(indicator, result.dropTarget);
                        } else {
                            result.dropTarget.parentNode?.insertBefore(indicator, result.dropTarget.nextElementSibling);
                        }
                    }
                } else if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "copy";
                }
            };

            const handleDrop = (e: DragEvent) => {
                if (!doc) return;
                e.preventDefault();

                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;
                const indicator = doc.querySelector(".wysiwyg-drop-indicator") as HTMLElement | null;

                if (movingBlock && indicator && indicator.parentElement) {
                    indicator.parentElement.insertBefore(movingBlock, indicator);
                    indicator.remove();
                    movingBlock.classList.remove("wysiwyg-moving-block");
                    movingBlock.style.opacity = "";
                    updateMovingState(null);
                    bindBlockSelection(movingBlock);
                    syncContent();
                    return;
                }

                doc.querySelectorAll(".wysiwyg-drop-indicator").forEach((el) => el.remove());

                const compId = e.dataTransfer?.getData("text/plain");

                if (compId) {
                    if (compId === "hyperlink") {
                        openLinkModal();
                        return;
                    }
                    if (compId === "pdfCard") {
                        openPdfStudio();
                        return;
                    }
                    if (compId === "wordCard") {
                        openDocStudio("word");
                        return;
                    }
                    if (compId === "excelCard") {
                        openDocStudio("excel");
                        return;
                    }
                    if (compId === "customTable") {
                        openTableStudio();
                        return;
                    }
                    if (compId === "csvTable") {
                        setIsTableStudioOpen(true);
                        setTableActiveTab("csv");
                        return;
                    }

                    const snippet = getComponentHtmlSnippet(compId);
                    if (snippet) {
                        const target = e.target as HTMLElement;
                        if (target && target !== doc.body) {
                            target.insertAdjacentHTML("afterend", snippet);
                        } else {
                            doc.body.insertAdjacentHTML("beforeend", snippet);
                        }
                        syncContent();
                    }
                }
            };

            const handleDocDblClick = (e: MouseEvent) => {
                if (!doc) return;
                const target = e.target as HTMLElement;
                if (!target || target === doc.body || target === doc.documentElement) return;
                if (target.closest(".wysiwyg-block-toolbar") || target.closest(".wysiwyg-resize-handle")) return;

                const movingBlock = doc.querySelector(".wysiwyg-moving-block") as HTMLElement | null;

                if (movingBlock) {
                    e.preventDefault();
                    e.stopPropagation();

                    const result = getClosestDropTarget(target, e.clientY);
                    if (result) {
                        if (result.insertBefore) {
                            result.dropTarget.parentNode?.insertBefore(movingBlock, result.dropTarget);
                        } else {
                            result.dropTarget.parentNode?.insertBefore(movingBlock, result.dropTarget.nextElementSibling);
                        }
                    } else {
                        doc.body.appendChild(movingBlock);
                    }

                    movingBlock.classList.remove("wysiwyg-moving-block");
                    updateMovingState(null);
                    bindBlockSelection(movingBlock);
                    syncContent();
                    return;
                }

                let targetBlock: HTMLElement | null = null;
                let curr: HTMLElement | null = target;
                while (curr && curr.parentElement && curr.parentElement !== doc.body && curr.parentElement.tagName !== "BODY") {
                    if (isComponentContainer(curr)) {
                        targetBlock = curr;
                        break;
                    }
                    curr = curr.parentElement;
                }
                if (!targetBlock && curr && curr !== doc.body && isComponentContainer(curr)) {
                    targetBlock = curr;
                }

                if (targetBlock) {
                    e.preventDefault();
                    e.stopPropagation();

                    doc.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
                    targetBlock.classList.add("wysiwyg-moving-block");
                    updateMovingState(targetBlock);
                    bindBlockSelection(targetBlock);
                }
            };

            doc.addEventListener("keyup", syncContent);
            doc.addEventListener("paste", () => setTimeout(syncContent, 50));
            doc.addEventListener("click", handleDocClick);
            doc.addEventListener("mousemove", handleDocMouseMove);
            doc.addEventListener("dblclick", handleDocDblClick);
            doc.addEventListener("selectionchange", handleSelectionOrInput);
            doc.addEventListener("input", handleSelectionOrInput);
            doc.addEventListener("keydown", handleKeyDown);
            doc.addEventListener("dragover", handleDragOver);
            doc.addEventListener("drop", handleDrop);
        }, 80);

        return () => clearTimeout(timer);
    }, [activeTab, placeholder]);

    const openStudioForTargetImage = (img?: HTMLImageElement | null) => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const target =
            img ||
            selectedImageEl ||
            (doc?.querySelector("img.wysiwyg-selected-img") as HTMLImageElement) ||
            (doc?.querySelector(".wysiwyg-selected-block img") as HTMLImageElement);

        if (!target) return;

        setSelectedImageEl(target);
        setStudioInitialData({
            src: target.src,
            alt: target.alt || "",
            width: target.style.width ? parseInt(target.style.width, 10) : undefined,
            alignment: (target.style.float as any) || "center",
        });
        setIsStudioOpen(true);
    };

    const openStudioForSelectedImage = () => {
        openStudioForTargetImage();
    };

    const applyQuickImageResize = (widthPercent: number) => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const target = selectedImageEl || (doc?.querySelector("img.wysiwyg-selected-img") as HTMLImageElement);
        if (target) {
            target.style.width = `${widthPercent}%`;
            target.style.maxWidth = "100%";
            syncIframeToState();
        }
    };

    const applyImageAlignment = (alignment: "left" | "center" | "right" | "full") => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const target = selectedTableEl || selectedImageEl || selectedBlockEl || (doc?.querySelector("img.wysiwyg-selected-img") as HTMLElement) || (doc?.querySelector(".wysiwyg-selected-block") as HTMLElement);
        if (!target) return;

        const isTable = target.tagName === "TABLE" || !!target.querySelector("table");
        const tableTarget = (target.tagName === "TABLE" ? target : target.querySelector("table") || target) as HTMLElement;

        if (alignment === "left") {
            if (isTable) {
                tableTarget.style.float = "left";
                tableTarget.style.marginLeft = "0";
                tableTarget.style.marginRight = "auto";
                tableTarget.style.marginTop = "12px";
                tableTarget.style.marginBottom = "12px";
                if (!tableTarget.style.width || tableTarget.style.width === "100%") {
                    tableTarget.style.width = "auto";
                }
            } else {
                target.style.float = "left";
                target.style.margin = "0 16px 16px 0";
                target.style.display = "inline-block";
            }
        } else if (alignment === "right") {
            if (isTable) {
                tableTarget.style.float = "right";
                tableTarget.style.marginLeft = "auto";
                tableTarget.style.marginRight = "0";
                tableTarget.style.marginTop = "12px";
                tableTarget.style.marginBottom = "12px";
                if (!tableTarget.style.width || tableTarget.style.width === "100%") {
                    tableTarget.style.width = "auto";
                }
            } else {
                target.style.float = "right";
                target.style.margin = "0 0 16px 16px";
                target.style.display = "inline-block";
            }
        } else if (alignment === "full") {
            target.style.float = "none";
            target.style.width = "100%";
            target.style.display = "block";
            target.style.margin = "16px 0";
            target.style.marginLeft = "0";
            target.style.marginRight = "0";
            if (isTable) {
                tableTarget.style.width = "100%";
                tableTarget.style.display = "table";
            }
        } else {
            if (isTable) {
                tableTarget.style.float = "none";
                tableTarget.style.marginLeft = "auto";
                tableTarget.style.marginRight = "auto";
                tableTarget.style.marginTop = "16px";
                tableTarget.style.marginBottom = "16px";
                tableTarget.style.display = "table";
                if (!tableTarget.style.width || tableTarget.style.width === "100%") {
                    tableTarget.style.width = "80%";
                }
            } else {
                target.style.float = "none";
                target.style.display = "block";
                target.style.margin = "16px auto";
                target.style.marginLeft = "auto";
                target.style.marginRight = "auto";
            }
        }
        syncIframeToState();
    };

    const deleteSelectedImage = () => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const target = selectedImageEl || (doc?.querySelector("img.wysiwyg-selected-img") as HTMLImageElement);
        if (target) {
            target.remove();
            setSelectedImageEl(null);
            syncIframeToState();
        }
    };

    const updateCanvasMode = (mode: "desktop" | "tablet" | "mobile") => {
        setCanvasMode(mode);
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (doc && doc.body) {
            const widthMap = {
                desktop: "100%",
                tablet: "768px",
                mobile: "375px",
            };
            doc.body.style.width = widthMap[mode];
            doc.body.style.maxWidth = "100%";
            doc.body.style.boxSizing = "border-box";
            doc.body.style.transition = "all 0.35s ease";
            if (mode === "desktop") {
                doc.body.style.margin = "0 auto";
                doc.body.style.borderRadius = "0";
                doc.body.style.padding = "32px 36px";
            } else {
                doc.body.style.margin = "0 auto";
                doc.body.style.borderRadius = "16px";
                if (mode === "mobile") {
                    doc.body.style.padding = "20px 16px";
                } else {
                    doc.body.style.padding = "28px 32px";
                }
            }
            if (doc.documentElement) {
                doc.documentElement.style.overflowX = "hidden";
                doc.documentElement.style.margin = "0";
                doc.documentElement.style.padding = mode === "desktop" ? "0" : "16px 0";
            }
            syncIframeToState();
        }
    };

    const getCleanHtmlFromDoc = (d: Document): string => {
        const clone = d.body.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".wysiwyg-resize-handle, .wysiwyg-block-toolbar, .wysiwyg-drop-indicator").forEach((el) => el.remove());
        clone.querySelectorAll("figure.wysiwyg-img-container").forEach((fig) => {
            const img = fig.querySelector("img");
            if (img) {
                fig.parentNode?.insertBefore(img, fig);
            }
            fig.remove();
        });
        clone.querySelectorAll(".wysiwyg-selected-block").forEach((el) => el.classList.remove("wysiwyg-selected-block"));
        clone.querySelectorAll(".wysiwyg-moving-block").forEach((el) => el.classList.remove("wysiwyg-moving-block"));
        clone.querySelectorAll("img.wysiwyg-selected-img").forEach((img) => img.classList.remove("wysiwyg-selected-img"));
        clone.querySelectorAll("a.wysiwyg-selected-link").forEach((a) => a.classList.remove("wysiwyg-selected-link"));
        const html = clone.innerHTML;
        if (html === "<br>") return "";

        const bodyBg = d.body.style.backgroundColor || pageBgColor;
        const bodyColor = d.body.style.color;
        const bodyWidth = d.body.style.maxWidth || "100%";

        const firstChild = clone.firstElementChild;
        if (clone.children.length === 1 && firstChild && firstChild.classList.contains("wysiwyg-page-wrapper")) {
            if (bodyBg && bodyBg !== "transparent") (firstChild as HTMLElement).style.backgroundColor = bodyBg;
            if (bodyColor) (firstChild as HTMLElement).style.color = bodyColor;
            (firstChild as HTMLElement).setAttribute("data-canvas-mode", canvasMode);
            return clone.innerHTML;
        } else {
            const bgStyle = bodyBg && bodyBg !== "transparent" ? `background-color: ${bodyBg};` : "";
            const colorStyle = bodyColor ? `color: ${bodyColor};` : "";
            const borderRadiusCss = canvasMode === "desktop" ? "0px" : "16px";
            return `<div class="wysiwyg-page-wrapper" data-canvas-mode="${canvasMode}" style="${bgStyle} ${colorStyle} padding: 32px 24px; margin: 0 auto; width: 100%; max-width: ${bodyWidth}; border-radius: ${borderRadiusCss}; min-height: 100%; box-sizing: border-box; overflow-x: hidden; word-wrap: break-word; overflow-wrap: break-word;">${html}</div>`;
        }
    };

    const syncIframeToState = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        const hasMediaOrElements = doc.body.querySelector("img, table, iframe, figure, div, section, blockquote, hr, svg, video, audio, h1, h2, h3, ul, ol, a") !== null;
        const textContent = doc.body.textContent?.replace(/\u8203|\u200B|\s/g, "") || "";
        const rawHtml = doc.body.innerHTML.trim();
        const isHtmlEmpty = !rawHtml || rawHtml === "<br>" || rawHtml === "<p><br></p>" || rawHtml === "<p></p>" || rawHtml === "<div><br></div>";

        const isEmpty = !hasMediaOrElements && !textContent && isHtmlEmpty;
        doc.body.setAttribute("data-empty", String(isEmpty));

        const cleanHtml = getCleanHtmlFromDoc(doc);
        isInternalChangeRef.current = true;
        onChange(cleanHtml);
    };

    const addTableRowAbove = () => {
        if (!selectedTableEl) return;
        const targetRow = selectedTableRowEl || selectedTableEl.querySelector("tr");
        if (!targetRow) return;
        const colCount = targetRow.children.length || 3;
        const newRow = document.createElement("tr");
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement("td");
            td.textContent = "New Data";
            newRow.appendChild(td);
        }
        targetRow.parentNode?.insertBefore(newRow, targetRow);
        syncIframeToState();
    };

    const addTableRowBelow = () => {
        if (!selectedTableEl) return;
        const targetRow = selectedTableRowEl || selectedTableEl.querySelector("tr:last-child");
        if (!targetRow) return;
        const colCount = targetRow.children.length || 3;
        const newRow = document.createElement("tr");
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement("td");
            td.textContent = "New Data";
            newRow.appendChild(td);
        }
        targetRow.parentNode?.insertBefore(newRow, targetRow.nextSibling);
        syncIframeToState();
    };

    const addTableColumnLeft = () => {
        if (!selectedTableEl) return;
        const colIndex = selectedTableCellEl ? selectedTableCellEl.cellIndex : 0;
        const rows = Array.from(selectedTableEl.querySelectorAll("tr"));
        rows.forEach((row, rowIndex) => {
            const isHeaderRow = row.parentNode?.nodeName === "THEAD" || rowIndex === 0;
            const newCell = document.createElement(isHeaderRow ? "th" : "td");
            newCell.textContent = isHeaderRow ? "New Header" : "New Data";
            const targetCell = row.children[colIndex];
            if (targetCell) {
                row.insertBefore(newCell, targetCell);
            } else {
                row.appendChild(newCell);
            }
        });
        syncIframeToState();
    };

    const addTableColumnRight = () => {
        if (!selectedTableEl) return;
        const colIndex = selectedTableCellEl ? selectedTableCellEl.cellIndex : 0;
        const rows = Array.from(selectedTableEl.querySelectorAll("tr"));
        rows.forEach((row, rowIndex) => {
            const isHeaderRow = row.parentNode?.nodeName === "THEAD" || rowIndex === 0;
            const newCell = document.createElement(isHeaderRow ? "th" : "td");
            newCell.textContent = isHeaderRow ? "New Header" : "New Data";
            const targetCell = row.children[colIndex];
            if (targetCell && targetCell.nextSibling) {
                row.insertBefore(newCell, targetCell.nextSibling);
            } else {
                row.appendChild(newCell);
            }
        });
        syncIframeToState();
    };

    const deleteTableRow = () => {
        if (!selectedTableRowEl) return;
        const parentTable = selectedTableRowEl.closest("table");
        selectedTableRowEl.remove();
        setSelectedTableRowEl(null);
        setSelectedTableCellEl(null);
        if (parentTable && parentTable.querySelectorAll("tr").length === 0) {
            parentTable.remove();
            setSelectedTableEl(null);
        }
        syncIframeToState();
    };

    const deleteTableColumn = () => {
        if (!selectedTableEl || !selectedTableCellEl) return;
        const colIndex = selectedTableCellEl.cellIndex;
        const rows = Array.from(selectedTableEl.querySelectorAll("tr"));
        rows.forEach((row) => {
            if (row.children[colIndex]) {
                row.children[colIndex].remove();
            }
        });
        setSelectedTableCellEl(null);
        syncIframeToState();
    };

    const toggleHeaderCell = () => {
        if (!selectedTableCellEl) return;
        const currentTag = selectedTableCellEl.tagName.toLowerCase();
        const newTag = currentTag === "th" ? "td" : "th";
        const newCell = document.createElement(newTag);
        newCell.innerHTML = selectedTableCellEl.innerHTML;
        Array.from(selectedTableCellEl.attributes).forEach((attr) => {
            newCell.setAttribute(attr.name, attr.value);
        });
        selectedTableCellEl.parentNode?.replaceChild(newCell, selectedTableCellEl);
        setSelectedTableCellEl(newCell as HTMLTableCellElement);
        syncIframeToState();
    };

    const deleteEntireTable = () => {
        if (!selectedTableEl) return;
        selectedTableEl.remove();
        setSelectedTableEl(null);
        setSelectedTableCellEl(null);
        setSelectedTableRowEl(null);
        syncIframeToState();
    };

    const execCommand = (command: string, arg?: string) => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        if (selectedTableEl && (command === "justifyCenter" || command === "justifyLeft" || command === "justifyRight" || command === "justifyFull")) {
            const sel = iframe.contentWindow?.getSelection() || doc.getSelection();
            const selectedText = sel ? sel.toString().trim() : "";
            if (!selectedText) {
                const alignMap: Record<string, "left" | "center" | "right" | "full"> = {
                    justifyLeft: "left",
                    justifyCenter: "center",
                    justifyRight: "right",
                    justifyFull: "full",
                };
                if (alignMap[command]) {
                    applyImageAlignment(alignMap[command]);
                    return;
                }
            }
        }

        iframe.contentWindow?.focus();
        doc.execCommand(command, false, arg);
        syncIframeToState();
    };

    const insertHTML = (htmlSnippet: string) => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        iframe.contentWindow?.focus();
        const sel = iframe.contentWindow?.getSelection() || doc.getSelection();

        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();

            const tempDiv = doc.createElement("div");
            tempDiv.innerHTML = htmlSnippet;
            const frag = doc.createDocumentFragment();

            let node: Node | null;
            let lastNode: Node | null = null;
            while ((node = tempDiv.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            if (lastNode) {
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            doc.body.insertAdjacentHTML("beforeend", htmlSnippet);
        }

        syncIframeToState();
    };

    const handleFormatBlock = (formatTag: string) => {
        execCommand("formatBlock", formatTag);
    };

    const openLinkModal = (targetAnchor?: HTMLAnchorElement | null) => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const win = iframe?.contentWindow;

        const anchorEl = targetAnchor || selectedAnchorEl || (doc?.querySelector("a.wysiwyg-selected-link") as HTMLAnchorElement);

        if (anchorEl) {
            setEditingAnchorEl(anchorEl);
            setLinkText(anchorEl.innerText || anchorEl.textContent || "");
            setLinkUrl(anchorEl.getAttribute("href") || "https://");
            setLinkTarget(anchorEl.target === "_blank" ? "_blank" : "_self");

            const styleStr = (anchorEl.getAttribute("style") || "").toLowerCase();
            const classStr = (anchorEl.getAttribute("class") || "").toLowerCase();

            if (styleStr.includes("f4bd4f") || classStr.includes("amber")) {
                setLinkStyle("gold-button");
            } else if (styleStr.includes("102a4c") || classStr.includes("navy")) {
                setLinkStyle("navy-button");
            } else if (styleStr.includes("border") && styleStr.includes("1a5d9c")) {
                setLinkStyle("outline-button");
            } else if (styleStr.includes("e0f2fe") || classStr.includes("badge")) {
                setLinkStyle("pill-badge");
            } else {
                setLinkStyle("text");
            }
        } else {
            setEditingAnchorEl(null);
            let text = "";
            if (win) {
                const selection = win.getSelection();
                if (selection) {
                    text = selection.toString().trim();
                    const container = selection.anchorNode?.parentElement;
                    const closestA = container?.closest("a") as HTMLAnchorElement | null;
                    if (closestA) {
                        setEditingAnchorEl(closestA);
                        setLinkText(closestA.innerText || closestA.textContent || "");
                        setLinkUrl(closestA.getAttribute("href") || "https://");
                        setLinkTarget(closestA.target === "_blank" ? "_blank" : "_self");
                        setIsLinkModalOpen(true);
                        return;
                    }
                }
            }
            setLinkText(text);
            setLinkUrl("https://");
            setLinkTarget("_self");
            setLinkStyle("text");
        }
        setIsLinkModalOpen(true);
    };

    const applyHyperlink = () => {
        const url = linkUrl.trim();
        if (!url) return;

        const text = linkText.trim() || url;
        const targetAttr = linkTarget === "_blank" ? `target="_blank" rel="noopener noreferrer"` : `target="_self"`;

        let customStyle = `color: #1a5d9c; text-decoration: underline; font-weight: 600;`;
        if (linkStyle === "gold-button") {
            customStyle = `background-color: #f4bd4f; color: #102a4c; font-weight: 700; padding: 0.65rem 1.35rem; border-radius: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 5px rgba(0,0,0,0.1);`;
        } else if (linkStyle === "navy-button") {
            customStyle = `background-color: #102a4c; color: #ffffff; font-weight: 700; padding: 0.65rem 1.35rem; border-radius: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 5px rgba(16,42,76,0.2);`;
        } else if (linkStyle === "outline-button") {
            customStyle = `border: 2px solid #1a5d9c; color: #1a5d9c; background-color: #ffffff; font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;`;
        } else if (linkStyle === "pill-badge") {
            customStyle = `background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700; padding: 0.35rem 0.9rem; border-radius: 9999px; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem;`;
        }

        const linkHtml = `<a href="${url}" ${targetAttr} style="${customStyle}">${text}${linkStyle.includes("button") ? " &rarr;" : ""}</a>`;

        if (editingAnchorEl) {
            editingAnchorEl.outerHTML = linkHtml;
            setEditingAnchorEl(null);
        } else {
            insertHTML(linkHtml);
        }

        setIsLinkModalOpen(false);
        syncIframeToState();
    };

    const removeHyperlink = () => {
        if (editingAnchorEl) {
            const textNode = editingAnchorEl.innerText || editingAnchorEl.textContent || "";
            editingAnchorEl.replaceWith(document.createTextNode(textNode));
            setEditingAnchorEl(null);
            setIsLinkModalOpen(false);
            syncIframeToState();
        } else if (selectedAnchorEl) {
            const textNode = selectedAnchorEl.innerText || selectedAnchorEl.textContent || "";
            selectedAnchorEl.replaceWith(document.createTextNode(textNode));
            setSelectedAnchorEl(null);
            setIsLinkModalOpen(false);
            syncIframeToState();
        }
    };

    const handleAddLink = () => {
        openLinkModal();
    };

    const handleAddImage = () => {
        setIsGalleryOpen(true);
    };

    const insertParagraphAfterSelectedBlock = () => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!doc) return;

        const targetEl =
            selectedBlockEl ||
            selectedImageEl ||
            selectedAnchorEl ||
            (doc.querySelector(".wysiwyg-selected-block") as HTMLElement) ||
            (doc.querySelector("img.wysiwyg-selected-img") as HTMLElement);

        if (targetEl) {
            const newP = doc.createElement("p");
            newP.innerHTML = "<br>";
            targetEl.insertAdjacentElement("afterend", newP);

            const sel = doc.getSelection();
            if (sel) {
                const range = doc.createRange();
                range.setStart(newP, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            syncIframeToState();
        } else {
            insertHTML("<p><br></p>");
        }
    };

    const deleteSelectedBlock = () => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!doc) return;

        const targetEl =
            selectedBlockEl ||
            selectedImageEl ||
            selectedAnchorEl ||
            (doc.querySelector(".wysiwyg-selected-block") as HTMLElement) ||
            (doc.querySelector("img.wysiwyg-selected-img") as HTMLElement);

        if (targetEl) {
            targetEl.remove();
            setSelectedBlockEl(null);
            setSelectedImageEl(null);
            setSelectedAnchorEl(null);
            syncIframeToState();
        }
    };

    const applyBgToElement = (el: HTMLElement, col: string) => {
        const applySingle = (target: HTMLElement) => {
            if (col === "transparent") {
                target.style.backgroundColor = "transparent";
            } else {
                target.style.backgroundColor = col;
            }
        };

        applySingle(el);

        const children = el.querySelectorAll<HTMLElement>("div, section, figure, table, th, td, p, h1, h2, h3, blockquote");
        children.forEach((child) => {
            const styleAttr = child.getAttribute("style") || "";
            if (!styleAttr.includes("background-color") && !styleAttr.includes("background:")) {
                child.style.backgroundColor = "transparent";
            }
        });
    };

    const updateBlockBgColor = (color: string) => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!doc) return;

        const target =
            selectedBlockEl ||
            selectedImageEl ||
            (doc.querySelector(".wysiwyg-selected-block") as HTMLElement) ||
            (doc.querySelector("img.wysiwyg-selected-img") as HTMLElement);

        if (target) {
            let topEl = target;
            let curr = target.parentElement;
            while (curr && curr.parentElement && curr.parentElement !== doc.body && curr.parentElement.tagName !== "BODY") {
                const tag = curr.tagName.toLowerCase();
                if (tag === "section" || tag === "table" || tag === "figure" || tag === "blockquote" || curr.classList.contains("wysiwyg-img-container")) {
                    topEl = curr;
                    break;
                }
                curr = curr.parentElement;
            }

            applyBgToElement(topEl, color);
            syncIframeToState();
        }
    };

    const selectParentBlock = () => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!doc) return;

        const currentSelected = selectedBlockEl || (doc.querySelector(".wysiwyg-selected-block") as HTMLElement);

        if (currentSelected && currentSelected.parentElement && currentSelected.parentElement !== doc.body) {
            let parent: HTMLElement | null = currentSelected.parentElement;
            while (parent && parent !== doc.body && parent.tagName !== "BODY") {
                const tag = parent.tagName.toLowerCase();
                if (tag === "section" || tag === "table" || tag === "figure" || tag === "blockquote" || tag === "div") {
                    doc.querySelectorAll(".wysiwyg-resize-handle, .wysiwyg-block-toolbar").forEach((el) => el.remove());
                    doc.querySelectorAll(".wysiwyg-selected-block").forEach((el) => el.classList.remove("wysiwyg-selected-block"));

                    parent.classList.add("wysiwyg-selected-block");
                    setSelectedBlockEl(parent);

                    const currentPos = doc.defaultView?.getComputedStyle(parent).position;
                    if (!currentPos || currentPos === "static") {
                        parent.style.position = "relative";
                    }
                    break;
                }
                parent = parent.parentElement;
            }
        }
    };

    const updatePageBgColor = (color: string) => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (doc) {
            if (color === "transparent") {
                doc.body.style.backgroundColor = "transparent";
            } else {
                doc.body.style.backgroundColor = color;
            }
            syncIframeToState();
        }
    };

    const insertComponent = (type: string) => {
        if (type === "frameCard") {
            openFrameStudio();
            return;
        }
        if (type === "hyperlink") {
            openLinkModal();
            return;
        }
        if (type === "pdfCard") {
            openPdfStudio();
            return;
        }
        if (type === "wordCard") {
            openDocStudio("word");
            return;
        }
        if (type === "excelCard") {
            openDocStudio("excel");
            return;
        }
        if (type === "customTable") {
            openTableStudio();
            return;
        }
        if (type === "csvTable") {
            setIsTableStudioOpen(true);
            setTableActiveTab("csv");
            return;
        }
        const htmlSnippet = getComponentHtmlSnippet(type);
        if (htmlSnippet) {
            insertHTML(htmlSnippet);
        }
    };

    return {
        // Refs
        iframeRef,
        containerRef,
        isInternalChangeRef,
        valueOnTabSwitchRef,
        // States
        activeTab,
        setActiveTab,
        isFullscreen,
        setIsFullscreen,
        showToolbox,
        setShowToolbox,
        colorMenuOpen,
        setColorMenuOpen,
        highlightMenuOpen,
        setHighlightMenuOpen,
        isGalleryOpen,
        setIsGalleryOpen,
        isStudioOpen,
        setIsStudioOpen,
        studioInitialData,
        selectedImageEl,
        setSelectedImageEl,
        selectedBlockEl,
        setSelectedBlockEl,
        selectedAnchorEl,
        setSelectedAnchorEl,
        selectedTableEl,
        setSelectedTableEl,
        selectedTableRowEl,
        setSelectedTableRowEl,
        selectedTableCellEl,
        setSelectedTableCellEl,
        isTableStudioOpen,
        setIsTableStudioOpen,
        tableActiveTab,
        setTableActiveTab,
        isDocStudioOpen,
        setIsDocStudioOpen,
        docType,
        setDocType,
        docStudioUrl,
        setDocStudioUrl,
        docStudioTitle,
        setDocStudioTitle,
        docStudioSubtitle,
        setDocStudioSubtitle,
        docStudioButtonText,
        setDocStudioButtonText,
        docStudioTheme,
        setDocStudioTheme,
        docStudioViewMode,
        setDocStudioViewMode,
        docStudioEmbedHeight,
        setDocStudioEmbedHeight,
        isPdfStudioOpen,
        setIsPdfStudioOpen,
        pdfStudioUrl,
        setPdfStudioUrl,
        pdfStudioTitle,
        setPdfStudioTitle,
        pdfStudioSubtitle,
        setPdfStudioSubtitle,
        pdfStudioButtonText,
        setPdfStudioButtonText,
        pdfStudioTheme,
        setPdfStudioTheme,
        pdfStudioMaxHeight,
        isLinkModalOpen,
        setIsLinkModalOpen,
        linkText,
        setLinkText,
        linkUrl,
        setLinkUrl,
        linkTarget,
        setLinkTarget,
        linkStyle,
        setLinkStyle,
        editingAnchorEl,
        setEditingAnchorEl,
        canvasMode,
        setCanvasMode,
        updateCanvasMode,
        pageBgColor,
        setPageBgColor,
        updatePageBgColor,
        // Methods
        openPdfStudio,
        isFrameStudioOpen,
        setIsFrameStudioOpen,
        openFrameStudio,
        frameStudioImageUrl,
        setFrameStudioImageUrl,
        openTableStudio,
        openDocStudio,
        openLinkModal,
        applyHyperlink,
        removeHyperlink,
        handleAddLink,
        handleAddImage,
        toggleNativeFullscreen,
        addTableRowAbove,
        addTableRowBelow,
        addTableColumnLeft,
        addTableColumnRight,
        deleteTableRow,
        deleteTableColumn,
        toggleHeaderCell,
        deleteEntireTable,
        execCommand,
        insertHTML,
        handleFormatBlock,
        insertParagraphAfterSelectedBlock,
        deleteSelectedBlock,
        applyBgToElement,
        updateBlockBgColor,
        selectParentBlock,
        openStudioForTargetImage,
        openStudioForSelectedImage,
        applyQuickImageResize,
        applyImageAlignment,
        deleteSelectedImage,
        insertComponent,
        syncIframeToState,
        toolboxComponents: TOOLBOX_COMPONENTS,
    };
}
