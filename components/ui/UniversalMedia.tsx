"use client";

import React, { useState, useMemo } from "react";
import {
  ImageIcon,
  Video,
  Music,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Download,
  AlertCircle,
  LoaderCircle,
  Eye,
} from "lucide-react";
import { cn, getAssetUrl } from "@/lib/utils";
import { isPdfFile, isDocumentFile, getPdfProxyUrl, getGoogleDocsViewerUrl } from "@/lib/file-preview";

export type MediaType = "image" | "video" | "audio" | "document" | "unknown";

export interface UniversalMediaProps {
  src: string;
  alt?: string;
  title?: string;
  type?: MediaType;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "video" | "square" | "4/3" | "3/4" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none";
  onMediaClick?: (src: string, detectedType: MediaType) => void;
  showCaption?: boolean;
  caption?: string;
  fallbackSrc?: string;
}

/**
 * Utility functions for YouTube & Vimeo video URL parsing
 */
export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function parseVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:vimeo\.com\/|video\/)(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function detectMediaType(url: string): MediaType {
  if (!url || typeof url !== "string") return "unknown";
  const cleanUrl = url.trim().toLowerCase().split("?")[0].split("#")[0];

  // YouTube / Vimeo Video Detection
  if (
    cleanUrl.includes("youtube.com") ||
    cleanUrl.includes("youtu.be") ||
    cleanUrl.includes("vimeo.com")
  ) {
    return "video";
  }

  // File Extension / Resource Type Detection
  if (
    /\.(mp4|webm|ogv|mkv|mov|avi|flv)$/i.test(cleanUrl) ||
    url.toLowerCase().includes("video/upload") ||
    url.toLowerCase().includes("resource_type=video")
  ) {
    return "video";
  }

  if (
    /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(cleanUrl) ||
    url.toLowerCase().includes("audio/upload")
  ) {
    return "audio";
  }

  if (isPdfFile(url) || isDocumentFile(url)) {
    return "document";
  }

  if (
    /\.(jpg|jpeg|png|webp|svg|gif|avif|ico|bmp)$/i.test(cleanUrl) ||
    url.toLowerCase().includes("image/upload") ||
    cleanUrl.startsWith("data:image/")
  ) {
    return "image";
  }

  // Default assumption for unknown HTTP links
  return "image";
}

const DEFAULT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80";

export function UniversalMedia({
  src,
  alt = "Media content",
  title,
  type,
  poster,
  autoPlay = false,
  loop = true,
  muted = true,
  controls = true,
  className,
  containerClassName,
  aspectRatio = "auto",
  objectFit = "cover",
  onMediaClick,
  showCaption = false,
  caption,
  fallbackSrc = DEFAULT_IMAGE_FALLBACK
}: UniversalMediaProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMutedAudio, setIsMutedAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const mediaType = useMemo(() => {
    return type && type !== "unknown" ? type : detectMediaType(src);
  }, [src, type]);

  React.useEffect(() => {
    if (mediaType === "video" && autoPlay && videoRef.current) {
      videoRef.current.muted = muted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Video autoplay prevented by browser policy
        });
      }
    }
  }, [mediaType, autoPlay, muted, src]);

  const youtubeId = useMemo(() => {
    return mediaType === "video" ? parseYouTubeVideoId(src) : null;
  }, [src, mediaType]);

  const vimeoId = useMemo(() => {
    return mediaType === "video" ? parseVimeoVideoId(src) : null;
  }, [src, mediaType]);

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "4/3"
      ? "aspect-4/3"
      : aspectRatio === "3/4"
      ? "aspect-3/4"
      : "";

  const fitClass =
    objectFit === "contain"
      ? "object-contain"
      : objectFit === "fill"
      ? "object-fill"
      : objectFit === "none"
      ? "object-none"
      : "object-cover";

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      void audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMutedAudio;
    setIsMutedAudio(!isMutedAudio);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Render YouTube Video Embed
  if (youtubeId) {
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=${
      autoPlay ? 1 : 0
    }&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${youtubeId}&controls=${
      controls ? 1 : 0
    }&rel=0`;

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-black shadow-md border border-slate-800 isolate",
          aspectClass || "aspect-video",
          containerClassName
        )}
        style={{ transform: "translateZ(0)", WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
      >
        <iframe
          src={embedUrl}
          title={title || alt}
          className={cn("h-full w-full border-0 rounded-[inherit]", className)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {showCaption && (caption || title) && (
          <div className="bg-slate-900/90 px-3 py-2 text-xs text-slate-200">
            {caption || title}
          </div>
        )}
      </div>
    );
  }

  // Render Vimeo Video Embed
  if (vimeoId) {
    const embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=${
      autoPlay ? 1 : 0
    }&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`;

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-black shadow-md border border-slate-800 isolate",
          aspectClass || "aspect-video",
          containerClassName
        )}
        style={{ transform: "translateZ(0)", WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
      >
        <iframe
          src={embedUrl}
          title={title || alt}
          className={cn("h-full w-full border-0 rounded-[inherit]", className)}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        {showCaption && (caption || title) && (
          <div className="bg-slate-900/90 px-3 py-2 text-xs text-slate-200">
            {caption || title}
          </div>
        )}
      </div>
    );
  }

  // Render HTML5 / Direct Video File
  if (mediaType === "video") {
    const validPoster = (poster && typeof poster === "string" && poster.trim().length > 0 && !isDocumentFile(poster)) ? poster.trim() : undefined;

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-md group isolate",
          aspectClass || "aspect-video",
          containerClassName
        )}
        style={{ transform: "translateZ(0)", WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
        onClick={() => onMediaClick?.(src, "video")}
      >
        <video
          ref={videoRef}
          src={src}
          poster={validPoster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          playsInline
          className={cn("h-full w-full rounded-[inherit]", fitClass, className)}
          aria-label={alt}
        >
          Your browser does not support playing this video format.
        </video>

        {onMediaClick && !controls && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg">
              <Play className="size-6 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {showCaption && (caption || title) && (
          <div className="bg-slate-900/90 px-3 py-2 text-xs text-slate-200">
            {caption || title}
          </div>
        )}
      </div>
    );
  }

  // Render Audio Player Card
  if (mediaType === "audio") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
          containerClassName
        )}
      >
        <audio
          ref={audioRef}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setAudioProgress(audioRef.current.currentTime);
              setAudioDuration(audioRef.current.duration || 0);
            }
          }}
          onEnded={() => setIsPlayingAudio(false)}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAudioToggle}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
            aria-label={isPlayingAudio ? "Pause Audio" : "Play Audio"}
          >
            {isPlayingAudio ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {title || alt || "Audio Recording"}
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {formatTime(audioProgress)} / {formatTime(audioDuration)}
              </span>
            </div>

            {/* Audio Scrub Bar */}
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              value={audioProgress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAudioProgress(val);
                if (audioRef.current) audioRef.current.currentTime = val;
              }}
              className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary dark:bg-slate-700"
            />
          </div>

          <button
            type="button"
            onClick={handleAudioMuteToggle}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isMutedAudio ? "Unmute" : "Mute"}
          >
            {isMutedAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <a
            href={src}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Download Audio File"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
    );
  }

  // Render PDF or Document Attachment Card
  if (mediaType === "document") {
    const isPdf = isPdfFile(src);
    const proxyUrl = getPdfProxyUrl(src);
    const googleViewer = getGoogleDocsViewerUrl(src);
    const docTitle = title || alt || src.split("/").pop() || "Document File";

    return (
      <div
        className={cn(
          "group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
          containerClassName
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary">
              {docTitle}
            </h4>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isPdf ? "PDF Document" : "Official Document"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onMediaClick && (
            <button
              type="button"
              onClick={() => onMediaClick(src, "document")}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
          )}

          <a
            href={proxyUrl || src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Open Document in New Tab"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    );
  }

  // Render Responsive Image (Default fallback)
  if (imageError && !fallbackSrc) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 p-4",
          aspectClass,
          containerClassName
        )}
      >
        <ImageIcon className="h-8 w-8 text-slate-400 shrink-0" />
      </div>
    );
  }

  const resolvedSrc = getAssetUrl(src) || src;
  const currentSrc = imageError ? (getAssetUrl(fallbackSrc) || fallbackSrc) : resolvedSrc;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
        aspectClass,
        containerClassName
      )}
      onClick={() => onMediaClick?.(currentSrc, "image")}
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-slate-200/80 dark:bg-slate-800/80 animate-pulse z-0" />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          fitClass,
          imageLoaded ? "opacity-100" : "opacity-0",
          onMediaClick ? "cursor-pointer" : "",
          className
        )}
      />

      {showCaption && (caption || title) && (
        <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 p-2 text-center text-xs text-white backdrop-blur-xs">
          {caption || title}
        </div>
      )}
    </div>
  );
}
