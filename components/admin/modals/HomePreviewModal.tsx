"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Home,
  Maximize2,
  Minimize2,
  ZoomIn,
} from "lucide-react";

export function HomePreviewModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoomLevel, setZoomLevel] = useState<number>(85); // Default 85% scale for desktop to fit cleanly
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const getWidthClass = () => {
    if (isMaximized) return "w-[98vw] max-w-none h-[96vh]";
    switch (device) {
      case "mobile":
        return "max-w-[440px] h-[92vh]";
      case "tablet":
        return "max-w-[840px] h-[92vh]";
      default:
        return "w-full max-w-[1400px] h-[92vh]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`flex ${getWidthClass()} flex-col overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-slate-700/80 transition-all duration-300`}
      >
        {/* Modal Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-3 text-white gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Home size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Live Layout
                </span>
                <h3 className="font-display text-base font-bold text-white">Complete Home Site Layout Preview</h3>
              </div>
              <p className="text-[11px] text-slate-400">Live preview of home site layout &amp; datasource</p>
            </div>
          </div>

          {/* Device Responsive & Scale Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Device Toggle */}
            <div className="flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  device === "desktop" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Desktop View"
              >
                <Monitor size={14} /> <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice("tablet")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  device === "tablet" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Tablet View (800px)"
              >
                <Tablet size={14} /> <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  device === "mobile" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Mobile View (400px)"
              >
                <Smartphone size={14} /> <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Desktop Zoom Scale Toggle */}
            {device === "desktop" && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700">
                <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ZoomIn size={12} /> Scale:
                </span>
                {[100, 85, 75, 65].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setZoomLevel(level)}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                      zoomLevel === level ? "bg-amber-500 text-slate-950 font-extrabold" : "text-slate-300 hover:text-white"
                    }`}
                    title={`Scale desktop preview to ${level}%`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            )}

            {/* Maximize Window Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition border border-slate-700 cursor-pointer"
              title={isMaximized ? "Restore Normal Modal Size" : "Maximize Preview Window"}
            >
              {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setIframeKey((prev) => prev + 1);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition border border-slate-700 cursor-pointer"
              title="Refresh Preview"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-blue-400" : ""} />
            </button>

            {/* Open External Site */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition shrink-0"
              title="Open full home page in new browser tab"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Open Live Site</span>
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition border border-slate-700 cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Frame Body */}
        <div className="relative flex-1 w-full overflow-auto bg-slate-950 flex flex-col items-center justify-start p-2">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-3">
              <RefreshCw size={28} className="animate-spin text-blue-400" />
              <p className="text-xs font-bold tracking-wider text-slate-300">Rendering Complete Home Page Preview...</p>
            </div>
          )}

          <div
            style={{
              width: device === "desktop" ? `${(100 / zoomLevel) * 100}%` : device === "tablet" ? "800px" : "400px",
              height: device === "desktop" ? `${(100 / zoomLevel) * 100}%` : "100%",
              transform: device === "desktop" && zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : "none",
              transformOrigin: "top center",
            }}
            className="rounded-2xl border border-slate-800 bg-white overflow-hidden shadow-inner transition-all duration-300 shrink-0 min-h-[600px]"
          >
            <iframe
              key={iframeKey}
              src="/"
              title="Complete Home Layout Preview"
              onLoad={() => setLoading(false)}
              className="h-full w-full border-none bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
