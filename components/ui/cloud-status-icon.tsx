"use client";

import React, { useCallback, useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api/health";

export type BackendConnectionStatus = "checking" | "online" | "offline";

interface CloudStatusIconProps {
  isHindi?: boolean;
  className?: string;
  iconClassName?: string;
  showTooltip?: boolean;
}

export function CloudStatusIcon({
  isHindi = false,
  className = "",
  iconClassName = "",
  showTooltip = true,
}: CloudStatusIconProps) {
  const [status, setStatus] = useState<BackendConnectionStatus>("checking");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [activeSource, setActiveSource] = useState<string>("");

  const verifyHealth = useCallback(async (isManual = false) => {
    if (isManual) {
      setStatus("checking");
    }
    try {
      const result = await checkBackendHealth(undefined, 3000, isManual);
      if (result.online) {
        setStatus("online");
        if (result.data?.viewCount !== undefined) {
          setVisitorCount(result.data.viewCount);
        }
        if (result.source) {
          setActiveSource(result.source);
        }
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  }, []);

  // Initial check on mount + periodic refresh every 60 seconds
  useEffect(() => {
    let isMounted = true;

    void checkBackendHealth().then((result) => {
      if (!isMounted) return;
      if (result.online) {
        setStatus("online");
        if (result.data?.viewCount !== undefined) {
          setVisitorCount(result.data.viewCount);
        }
        if (result.source) {
          setActiveSource(result.source);
        }
      } else {
        setStatus("offline");
      }
    }).catch(() => {
      if (isMounted) setStatus("offline");
    });

    const intervalId = window.setInterval(() => {
      void verifyHealth();
    }, 60000);

    const handleWindowOnline = () => {
      void verifyHealth(true);
    };
    const handleWindowOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", handleWindowOnline);
    window.addEventListener("offline", handleWindowOffline);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("online", handleWindowOnline);
      window.removeEventListener("offline", handleWindowOffline);
    };
  }, [verifyHealth]);

  const tooltipText = (() => {
    if (status === "online") {
      const sourceSuffix = activeSource ? ` (${activeSource})` : "";
      const countSuffix =
        visitorCount !== null
          ? isHindi
            ? ` • कुल विज़िट: ${visitorCount}`
            : ` • Total Visits: ${visitorCount}`
          : "";
      return isHindi
        ? `सर्वर कनेक्टेड (ऑनलाइन)${sourceSuffix}${countSuffix}`
        : `Backend Online (Connected)${sourceSuffix}${countSuffix}`;
    }
    if (status === "offline") {
      return isHindi
        ? "सर्वर डिस्कनेक्टेड (ऑफलाइन)"
        : "Backend Offline (Disconnected)";
    }
    return isHindi ? "सर्वर जांच जारी..." : "Checking backend connection...";
  })();

  const isOnline = status === "online";
  const isOffline = status === "offline";

  return (
    <button
      type="button"
      onClick={() => void verifyHealth(true)}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
      role="status"
      className={`group relative inline-flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded ${className}`}
    >
      {/* Cloud React Icon */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 transition-all duration-300 ${
          isOnline
            ? "text-emerald-400 fill-emerald-400/25 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]"
            : isOffline
            ? "text-orange-500 fill-orange-500/25 drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]"
            : "text-slate-400 fill-slate-400/20 animate-pulse"
        } ${iconClassName}`}
        aria-hidden="true"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>

      {/* Screen reader announcement */}
      <span className="sr-only">{tooltipText}</span>
    </button>
  );
}

export default CloudStatusIcon;
