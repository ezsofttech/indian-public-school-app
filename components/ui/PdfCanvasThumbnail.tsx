"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCloudinaryPdfThumbnailUrl, getPdfProxyUrl } from "@/lib/file-preview";

interface PdfCanvasThumbnailProps {
  url: string;
  className?: string;
  alt?: string;
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

export function PdfCanvasThumbnail({ url, className = "", alt = "PDF Page Preview" }: PdfCanvasThumbnailProps) {
  const [useCanvas, setUseCanvas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initialImgUrl = getCloudinaryPdfThumbnailUrl(url, 1, 600);

  useEffect(() => {
    if (!useCanvas || !url) return;

    let isMounted = true;
    setLoading(true);
    setError(false);

    loadPdfJsScript()
      .then(async (pdfjsLib) => {
        if (!isMounted) return;

        let pdfData: any;
        try {
          const proxyUrl = getPdfProxyUrl(url);
          const res = await fetch(proxyUrl);
          if (!res.ok) {
            throw new Error(`PDF proxy HTTP status ${res.status}`);
          }
          const buffer = await res.arrayBuffer();

          // Check for PDF magic header bytes (%PDF)
          const header = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
          const isPdfHeader =
            header.length >= 4 &&
            header[0] === 0x25 && // %
            header[1] === 0x50 && // P
            header[2] === 0x44 && // D
            header[3] === 0x46;   // F

          if (!isPdfHeader) {
            if (isMounted) {
              setLoading(false);
              setError(true);
            }
            return;
          }

          pdfData = { data: buffer };
        } catch {
          // Fall back to direct URL attempt if proxy fetch failed
          pdfData = { url, withCredentials: false };
        }

        const loadingTask = pdfjsLib.getDocument(pdfData);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 0.6 });
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
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [useCanvas, url]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 p-2 text-center text-white ${className}`}>
        <FileText size={28} className="text-red-400 mb-1" />
        <span className="text-[10px] font-bold text-red-200">PDF DOCUMENT</span>
      </div>
    );
  }

  if (useCanvas) {
    return (
      <div className={cn("relative flex items-center justify-center bg-slate-950 overflow-hidden", className)}>
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950 text-slate-400">
            <LoaderCircle size={18} className="animate-spin text-blue-400" />
          </div>
        )}
        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center bg-slate-950 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={initialImgUrl}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={() => {
          setTimeout(() => setUseCanvas(true), 0);
        }}
      />
    </div>
  );
}
