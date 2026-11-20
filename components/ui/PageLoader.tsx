"use client";

import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  variant?: "full" | "inline" | "skeleton";
  className?: string;
}

export function PageLoader({
  message = "Loading Indian Public School content...",
  variant = "full",
  className,
}: PageLoaderProps) {
  const dark = className?.includes("bg-slate-900") ?? false;
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-8 text-[var(--navy)]", className)}>
        <div
          className="relative flex size-10 items-center justify-center bg-[var(--navy)] text-[var(--gold)] shadow-md"
          style={{ borderRadius: "var(--logo-radius, 50%)" }}
        >
          <div
            className="absolute inset-0 border-2 border-[var(--gold)]/40 border-t-[var(--gold)] animate-spin"
            style={{ borderRadius: "var(--logo-radius, 50%)" }}
          />
          <GraduationCap className="size-5 text-[var(--gold)]" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-[65vh] flex flex-col items-center justify-center p-6 text-center",
        variant === "full" && "w-full flex-1",
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-7">
        {/* Outer glowing pulsing aura */}
        <div className="absolute size-24 rounded-full bg-[var(--gold)]/20 blur-xl animate-pulse" />
        
        {/* Rotating golden accent ring */}
        <div
          className="absolute size-20 rounded-full border-2 border-transparent border-t-[var(--gold)] border-r-[var(--gold)] animate-spin"
          style={{ animationDuration: "1.2s" }}
        />
        
        {/* Counter-rotating inner ring */}
        <div
          className="absolute size-16 rounded-full border-2 border-transparent border-b-[var(--primary)] border-l-[var(--navy)] animate-spin"
          style={{ animationDuration: "1.8s", animationDirection: "reverse" }}
        />

        {/* Center School Badge Container */}
        <div
          className="relative z-10 grid size-9.5 place-items-center text-white shadow-md border border-[var(--gold)]/50 transition-all duration-300"
          style={{
            background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))",
            borderRadius: "var(--logo-radius, 50%)",
          }}
        >
          <GraduationCap className="size-5 text-[var(--gold)] animate-bounce" style={{ animationDuration: "2s" }} />
        </div>
      </div>

      {/* School Name Tag */}
      <div
        className={cn(
          "inline-flex items-center gap-1.5 border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] shadow-xs mb-3",
          dark ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--navy)]"
        )}
        style={{ borderRadius: "var(--badge-radius, 9999px)" }}
      >
        Indian Public School
      </div>

      <h3 className={cn("text-lg sm:text-xl font-bold tracking-tight font-[var(--font-display)]", dark ? "text-white" : "text-slate-800")}>
        {message}
      </h3>
      <p className={cn("mt-2 text-sm max-w-sm leading-relaxed", dark ? "text-slate-300/80" : "text-slate-500")}>
        Preparing official school documents, schedules, and academic information...
      </p>

      {/* Progress Dots */}
      <div className="mt-5 flex items-center gap-2">
        <span className="size-2 rounded-full bg-[var(--navy)] animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="size-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="size-2 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// Education Page Skeleton placeholder component
export function EducationPageSkeleton() {
  return (
    <div className="w-full flex-1 animate-pulse">
      {/* Banner Skeleton */}
      <div className="relative overflow-hidden bg-slate-900 py-12 text-white">
        <div className="container-page max-w-5xl space-y-4">
          <div className="h-7 w-48 rounded-full bg-slate-800" />
          <div className="h-10 w-3/4 max-w-md rounded-xl bg-slate-800" />
          <div className="h-4 w-1/2 rounded-lg bg-slate-800/60" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container-page py-12 max-w-5xl space-y-8">
        {/* Info Grid Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
              <div className="size-10 rounded-xl bg-slate-200" />
              <div className="h-5 w-1/2 rounded-lg bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Main Content Body Skeleton */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm">
          <div className="h-8 w-1/3 rounded-xl bg-slate-200" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-11/12 rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="h-48 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
