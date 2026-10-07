"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn, getAssetUrl } from "@/lib/utils";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-data";

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  skeletonClassName?: string;
  showSkeleton?: boolean;
}

export function SmartImage({
  src,
  alt = "",
  className,
  containerClassName,
  fallbackSrc = DEFAULT_HERO_IMAGE,
  skeletonClassName,
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}: SmartImageProps & { containerClassName?: string }) {
  const resolveSrc = (source?: string | object): string => {
    if (!source) return fallbackSrc;
    let s = "";
    if (typeof source === "string") s = source;
    else if (typeof source === "object" && "src" in source && typeof (source as { src: string }).src === "string") {
      s = (source as { src: string }).src;
    } else {
      s = String(source);
    }
    return getAssetUrl(s) || s || fallbackSrc;
  };

  const initialSrc = resolveSrc(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(resolveSrc(src));
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth === 0) {
        if (!hasError && currentSrc !== fallbackSrc) {
          setHasError(true);
          setCurrentSrc(fallbackSrc);
        } else {
          setIsLoaded(true);
        }
      } else {
        setIsLoaded(true);
      }
    }
  }, [currentSrc, fallbackSrc, hasError]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    } else {
      setIsLoaded(true);
    }
    if (onError) onError(e);
  };

  return (
    <div className={cn("relative overflow-hidden bg-slate-900/20", containerClassName)}>
      {/* Skeleton Pulse / Fallback Backdrop while image is loading */}
      {showSkeleton && !isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 animate-pulse z-0",
            skeletonClassName
          )}
        />
      )}

      <img
        {...props}
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300 ease-out z-10",
          isLoaded ? "opacity-100" : "opacity-90",
          className
        )}
      />
    </div>
  );
}

