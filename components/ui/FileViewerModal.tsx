"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Eye,
  BookOpen,
  LoaderCircle,
  AlertCircle,
  Download,
  Printer
} from "lucide-react";
import {
  isPdfFile,
  isDocumentFile,
  isWordFile,
  isExcelFile,
  getDocumentViewerUrl,
  getCloudinaryPdfThumbnailUrl,
  getCloudinaryInlineViewerUrl,
  getGoogleDocsViewerUrl,
  getPdfProxyUrl,
  isCloudinaryUrl
} from "@/lib/file-preview";
import { getFileType } from "@/components/admin/CloudinaryGalleryModal";
import { UniversalMedia, detectMediaType } from "@/components/ui/UniversalMedia";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string | null;
  title?: string;
  initialMode?: "picture" | "reader";
  fileType?: string;
  htmlContent?: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

let pdfjsPromise: Promise<any> | null = null;

function loadPdfJsScript() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not found on window"));
      }
    };
    script.onerror = (err) => {
      pdfjsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

export function FileViewerModal({
  isOpen,
  onClose,
  url,
  title,
  initialMode,
  fileType: explicitFileType,
  htmlContent,
}: FileViewerModalProps) {
  const isHtml = Boolean(htmlContent || explicitFileType === "html");
  const isBlobOrData = Boolean(url && (url.startsWith("blob:") || url.startsWith("data:")));
  const isPdfDetected = !isHtml && (explicitFileType === "pdf" || isPdfFile(url ?? "", title));
  const htmlIframeRef = useRef<HTMLIFrameElement | null>(null);

  const handlePrintDocument = () => {
    try {
      const iframe = htmlIframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch (e) {
      console.warn("Iframe direct print fallback:", e);
    }

    if (htmlContent) {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        setTimeout(() => {
          printWin.focus();
          printWin.print();
        }, 300);
      }
    }
  };

  // Shortcut for Ctrl + P (Windows/Linux) and Cmd + P (Mac/iPad)
  useEffect(() => {
    if (!isOpen || !isHtml) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrintDocument();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isHtml, htmlContent]);

  // Default: PDFs open in reader, everything else in picture
  const resolvedInitialMode = initialMode ?? (isPdfDetected ? "reader" : "picture");
  const [activeTab, setActiveTab] = useState<"picture" | "reader">(resolvedInitialMode);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);

  // Blob & Fetch State
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [isFetchingPdf, setIsFetchingPdf] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Render State
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Reader Engine: 1 = Next.js Server PDF Proxy (Default), 2 = Local Blob Stream Reader, 3 = Google Reader
  const [readerEngine, setReaderEngine] = useState<1 | 2 | 3>(isBlobOrData ? 2 : 1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);

  // Track if we internally created a blob URL to revoke on cleanup
  const internalBlobUrlRef = useRef<string | null>(null);

  // Fetch PDF as ArrayBuffer and create local Blob URL when modal opens
  useEffect(() => {
    if (!isOpen || !url) {
      if (internalBlobUrlRef.current) {
        URL.revokeObjectURL(internalBlobUrlRef.current);
        internalBlobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
      setPdfBuffer(null);
      pdfDocRef.current = null;
      return;
    }

    const isCurrentPdf = explicitFileType === "pdf" || isPdfFile(url, title);
    const isBlob = url.startsWith("blob:") || url.startsWith("data:");

    setCurrentPage(1);
    setTotalPages(1);
    setZoomLevel(100);
    setFetchError(null);
    setReaderEngine(isBlob ? 2 : 1);
    setActiveTab(initialMode ?? (isCurrentPdf ? "reader" : "picture"));

    if (!isCurrentPdf) return;

    let isMounted = true;
    setIsFetchingPdf(true);

    if (url.startsWith("blob:")) {
      setPdfBlobUrl(url);
    }

    const targetUrl = isBlob ? url : getPdfProxyUrl(url);

    fetch(targetUrl)
      .then(async (res) => {
        if (!res.ok) {
          if (!isBlob) {
            console.warn(`Proxy fetch returned ${res.status}, falling back to direct stream...`);
            const fallbackUrl = getCloudinaryInlineViewerUrl(url);
            const directRes = await fetch(fallbackUrl);
            if (!directRes.ok) throw new Error(`Direct fetch status: ${directRes.status}`);
            return directRes.arrayBuffer();
          }
          throw new Error(`Direct fetch status: ${res.status}`);
        }
        return res.arrayBuffer();
      })
      .then(async (buffer) => {
        if (!isMounted) return;

        // Verify PDF magic header bytes (%PDF)
        const header = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
        const isPdfHeader =
          header.length >= 4 &&
          header[0] === 0x25 && // %
          header[1] === 0x50 && // P
          header[2] === 0x44 && // D
          header[3] === 0x46;   // F

        if (!isPdfHeader) {
          throw new Error("File content is not a valid PDF document");
        }

        setPdfBuffer(buffer);

        // Create Blob URL for browser iframe embedding if not already a blob URL
        if (!url.startsWith("blob:")) {
          const blob = new Blob([buffer], { type: "application/pdf" });
          const bUrl = URL.createObjectURL(blob);
          internalBlobUrlRef.current = bUrl;
          setPdfBlobUrl(bUrl);
        } else {
          setPdfBlobUrl(url);
        }

        // Load PDF.js document for Picture preview mode
        try {
          const pdfjsLib = await loadPdfJsScript();
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          const pdf = await loadingTask.promise;
          if (!isMounted) return;

          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
        } catch (pdfErr) {
          console.warn("PDF.js initialization notice:", pdfErr);
        } finally {
          if (isMounted) setIsFetchingPdf(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsFetchingPdf(false);
          setFetchError("Unable to stream PDF binary directly. You can open the document in a new tab.");
        }
      });

    return () => {
      isMounted = false;
      if (internalBlobUrlRef.current) {
        URL.revokeObjectURL(internalBlobUrlRef.current);
        internalBlobUrlRef.current = null;
      }
    };
  }, [isOpen, url, title, initialMode, explicitFileType]);

  // Render current page onto canvas
  useEffect(() => {
    if (!isOpen || !pdfDocRef.current || activeTab !== "picture") return;

    let isMounted = true;
    setIsRenderingPage(true);

    const renderPage = async () => {
      try {
        const pdf = pdfDocRef.current;
        const targetPageNum = Math.min(Math.max(1, currentPage), pdf.numPages);
        const page = await pdf.getPage(targetPageNum);
        if (!isMounted) return;

        const scale = (zoomLevel / 100) * 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext("2d");
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = { canvasContext: context, viewport };
            await page.render(renderContext).promise;
          }
        }
      } catch (e) {
        console.warn("PDF Page canvas render error:", e);
      } finally {
        if (isMounted) setIsRenderingPage(false);
      }
    };

    void renderPage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, currentPage, zoomLevel]);

  if (!isOpen || (!url && !htmlContent)) return null;

  const fileType = isHtml ? "document" : getFileType(url || "");
  const isPdf = !isHtml && (isPdfDetected || isPdfFile(url || "", title));
  const isWord = !isHtml && isWordFile(url || "", title);
  const isExcel = !isHtml && isExcelFile(url || "", title);
  const isDoc = !isHtml && (isDocumentFile(url || "", title) || isWord || isExcel);
  const displayName = title || (url ? url.split("/").pop() : "Document Print Preview") || "Document Print Preview";
  const pdfProxyStreamUrl = getPdfProxyUrl(url || "");
  const inlineUrl = getCloudinaryInlineViewerUrl(url || "", title);
  const googleViewerUrl = getGoogleDocsViewerUrl(url || "");
  const documentViewerUrl = getDocumentViewerUrl(url || "");
  const openUrl = (isWord || isExcel)
    ? documentViewerUrl
    : isPdf
    ? (isBlobOrData ? (url ?? "") : pdfProxyStreamUrl)
    : (inlineUrl || url || "");

  const handleCopyLink = () => {
    if (url) {
      void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const resetZoom = () => setZoomLevel(100);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl">

        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-5 py-3.5 backdrop-blur-xs shrink-0">

          {/* File Badge & Title */}
          <div className="flex items-center gap-3 min-w-0 max-w-md">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
              {fileType === "video" ? (
                <Video size={20} />
              ) : fileType === "audio" ? (
                <Music size={20} />
              ) : isPdf ? (
                <FileText size={20} className="text-red-400" />
              ) : isDoc ? (
                <FileText size={20} className="text-blue-400" />
              ) : (
                <ImageIcon size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-bold text-slate-100">{displayName}</h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-blue-400">
                  {isHtml ? "Document Preview" : isPdf ? "PDF Document" : fileType}
                </span>
              </div>
            </div>
          </div>

          {/* PDF View Mode Switcher */}
          {!isHtml && isPdf && (
            <div className="flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab("picture")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${activeTab === "picture"
                  ? "bg-[#1a5d9c] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Eye size={14} />
                <span>Picture Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reader")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${activeTab === "reader"
                  ? "bg-[#1a5d9c] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <BookOpen size={14} />
                <span>Interactive Reader</span>
              </button>
            </div>
          )}

          {/* Action Tools & Controls */}
          <div className="flex items-center gap-2">
            {/* If HTML template mode: render direct native Print & Open in New Window buttons */}
            {isHtml ? (
              <>
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm cursor-pointer"
                  title="Print or Save as PDF (Ctrl + P / Cmd + P)"
                >
                  <Printer size={15} />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (htmlContent) {
                      const printWin = window.open("", "_blank");
                      if (printWin) {
                        printWin.document.write(htmlContent);
                        printWin.document.close();
                        setTimeout(() => {
                          printWin.focus();
                          printWin.print();
                        }, 250);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                  title="Open in new window to print or save"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open New Tab</span>
                </button>
              </>
            ) : (
              <>
                {/* Zoom controls for Picture mode or Image */}
                {(fileType === "image" || (isPdf && activeTab === "picture")) && (
                  <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-800/60 px-2 py-1 border border-slate-700/50">
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="w-11 text-center text-xs font-mono text-slate-300 font-semibold">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={zoomIn}
                      className="rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="ml-1 rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                      title="Reset Zoom"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                  title="Copy file URL"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span className="hidden md:inline">{copied ? "Copied!" : "Copy Link"}</span>
                </button>

                {/* Download Action */}
                <a
                  href={url ?? ""}
                  download
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition cursor-pointer"
                  title="Download File"
                >
                  <Download size={14} />
                  <span className="hidden md:inline">Download</span>
                </a>

                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-blue-600/40 bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-600/30 transition"
                  title="Open in new browser page/tab"
                >
                  <ExternalLink size={14} />
                  <span>Open in New Page</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-1 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Viewing Canvas */}
        <div className="relative flex flex-1 overflow-hidden bg-slate-950 items-center justify-center p-2 sm:p-4">

          {/* HTML Document Print Preview Mode */}
          {isHtml && (
            <div className="relative h-full w-full flex items-center justify-center p-1 sm:p-2">
              <iframe
                ref={htmlIframeRef}
                srcDoc={htmlContent}
                className="h-full w-full rounded-2xl bg-white border-0 shadow-2xl"
                title={displayName}
              />
            </div>
          )}

          {/* PDF Picture Preview Mode */}
          {!isHtml && isPdf && activeTab === "picture" && (
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-auto scrollbar-thin">

              {(isFetchingPdf || isRenderingPage) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs text-slate-300 gap-2">
                  <LoaderCircle size={32} className="animate-spin text-blue-500" />
                  <p className="text-xs font-semibold">
                    {isFetchingPdf ? "Streaming PDF document..." : `Rendering Page ${currentPage} picture...`}
                  </p>
                </div>
              )}

              {fetchError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center max-w-md bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl">
                  <AlertCircle size={52} className="text-amber-400" />
                  <h3 className="font-bold text-lg text-slate-200">Streaming Interrupted</h3>
                  <p className="text-xs text-slate-400">{fetchError}</p>
                  <a
                    href={isBlobOrData ? (url ?? "") : pdfProxyStreamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
                  >
                    <ExternalLink size={15} /> Open in New Tab
                  </a>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
                  <canvas
                    ref={canvasRef}
                    className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                  />
                </div>
              )}

              {/* Page Controls for Picture Mode */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-2 border border-slate-800 shadow-2xl backdrop-blur-md text-white z-20">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-slate-200 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* PDF / Document Interactive Reader Mode */}
          {!isHtml && ((isPdf && activeTab === "reader") || (!isPdf && isDoc)) && (
            <div className="relative h-full w-full flex flex-col items-center justify-center">

              {/* Reader Engine Bar */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-1 text-[11px] shadow-lg backdrop-blur-md">
                <span className="font-bold text-slate-400 mr-1">Reader Engine:</span>
                {!isBlobOrData && (
                  <button
                    type="button"
                    onClick={() => setReaderEngine(1)}
                    className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${readerEngine === 1 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    Proxy Stream
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReaderEngine(2)}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${readerEngine === 2 || isBlobOrData ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                >
                  {isBlobOrData ? "Interactive Reader" : "Local Blob Reader"}
                </button>
                {!isBlobOrData && (
                  <button
                    type="button"
                    onClick={() => setReaderEngine(3)}
                    className={`px-2.5 py-0.5 rounded-md font-semibold transition cursor-pointer ${readerEngine === 3 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                  >
                    Google Reader
                  </button>
                )}
              </div>

              {isFetchingPdf && (readerEngine === 1 || readerEngine === 2 || isBlobOrData) ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                  <LoaderCircle size={32} className="animate-spin text-blue-500" />
                  <p className="text-xs font-semibold">Preparing interactive PDF reader stream...</p>
                </div>
              ) : (readerEngine === 2 || isBlobOrData) && (pdfBlobUrl || url) ? (
                <iframe
                  src={`${pdfBlobUrl || url}#toolbar=1`}
                  className="h-full w-full rounded-2xl bg-white border-0 shadow-2xl"
                  title="Interactive PDF Reader"
                />
              ) : readerEngine === 1 && !isBlobOrData ? (
                <iframe
                  src={`${pdfProxyStreamUrl}#toolbar=1`}
                  className="h-full w-full rounded-2xl bg-white border-0 shadow-2xl"
                  title="Proxy Stream PDF Reader"
                />
              ) : (
                <iframe
                  src={googleViewerUrl}
                  className="h-full w-full rounded-2xl border-0 bg-white shadow-2xl"
                  title="Google Docs Reader"
                />
              )}

            </div>
          )}

          {/* Standard Image Viewer */}
          {!isHtml && fileType === "image" && !isPdf && url && (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={displayName}
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-150 border border-slate-800"
              />
            </div>
          )}

          {/* Video Player (YouTube, Vimeo, HTML5 Video, Cloudinary Stream) */}
          {!isHtml && (fileType === "video" || (url ? detectMediaType(url) === "video" : false)) && (
            <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
              <UniversalMedia
                src={inlineUrl || (url ?? "")}
                alt={displayName}
                title={displayName}
                controls
                autoPlay
                aspectRatio="video"
                containerClassName="w-full max-w-4xl max-h-[82vh] rounded-2xl border border-slate-800 bg-black shadow-2xl"
              />
            </div>
          )}

          {/* Audio Player */}
          {!isHtml && fileType === "audio" && (
            <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-8 text-center max-w-lg bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl w-full">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/20">
                <Music size={40} className="animate-pulse" />
              </div>
              <div className="w-full">
                <UniversalMedia
                  src={inlineUrl || (url ?? "")}
                  title={displayName}
                  alt={displayName}
                  type="audio"
                  containerClassName="w-full"
                />
              </div>
            </div>
          )}

          {/* Word / Excel / Office Document Embedded Viewer */}
          {!isHtml && !isPdf && isDoc && url && (
            <div className="relative h-full w-full flex items-center justify-center p-1 sm:p-2">
              <iframe
                src={documentViewerUrl}
                className="h-full w-full rounded-2xl bg-white border-0 shadow-2xl"
                title={displayName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
