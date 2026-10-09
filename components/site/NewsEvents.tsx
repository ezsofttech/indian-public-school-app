"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/site/Reveal";
import { firstSection, homeData, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { useFileViewer } from "@/components/ui/FileViewerContext";
import { isPdfFile, getCloudinaryInlineViewerUrl, normalizePdfUrl } from "@/lib/file-preview";

export interface NewsPost {
  id?: string;
  type: string;
  date: string;
  title: string;
  text: string;
  redirectUrl?: string;
  isNew?: boolean;
}

export function NewsEvents() {
  const siteData = useSiteData();
  const sec = firstSection(homeData(siteData), "section-10");
  const rawNewsList = siteData?.news || [];
  const { openFileViewer } = useFileViewer();

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map API news records
  const apiNewsItems: NewsPost[] = (rawNewsList || []).map((item: any, idx: number) => {
    const rawDate = item.createdAt ? new Date(item.createdAt) : undefined;
    const dateStr = rawDate
      ? rawDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "Recent";

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const isRecentDate = rawDate ? rawDate >= fourteenDaysAgo : idx < 3;

    return {
      id: item._id || item.id || `api-news-${idx}`,
      type: item.category || item.type || "Notice",
      date: dateStr,
      title: item.title || "School Notice",
      text: item.content || item.summary || item.description || "",
      redirectUrl: normalizePdfUrl(
        item.redirectUrl || item.linkUrl || item.imageUrl || item.attachmentUrl || item.fileUrl || ""
      ),
      isNew: item.isNew ?? isRecentDate,
    };
  });

  const filteredNotices = apiNewsItems;

  // Only enable continuous auto-scrolling flow if items cross the viewport window (> 3 items)
  const shouldScroll = filteredNotices.length > 3;
  const displayFeed = shouldScroll ? [...filteredNotices, ...filteredNotices] : filteredNotices;

  const handleManualScroll = (direction: "up" | "down") => {
    if (!scrollContainerRef.current) return;
    const amount = direction === "up" ? -180 : 180;
    scrollContainerRef.current.scrollBy({ top: amount, behavior: "smooth" });
  };

  return (
    <section className="bg-background py-16 lg:py-24 border-y border-border/60">
      {/* Slower bottom-to-top vertical scroll animation */}
      <style jsx>{`
        @keyframes slowNoticeScrollUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .slow-notice-flow {
          animation: slowNoticeScrollUp 75s linear infinite;
        }
        .slow-notice-flow.paused {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={text(sec?.badge, "Updates & Highlights")}
          title={text(sec?.title, "Latest from IPS")}
          description={text(
            sec?.description,
            "Official campus circulars, examination schedules, event alerts, and academic announcements."
          )}
        />

        {/* Clean & Plain Notice Board Frame */}
        <div className="mt-10 mx-auto max-w-4xl rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-row items-center justify-between border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground">IPS News &amp; Announcements</h3>

            {/* Manual Up / Down Controls (visible when scrollable) */}
            {shouldScroll && (
              <div className="flex items-center rounded-lg border border-border bg-secondary/50 px-1 py-0.5 text-xs text-muted-foreground">
                <button
                  onClick={() => handleManualScroll("up")}
                  className="px-2 py-0.5 hover:text-foreground transition-colors"
                  title="Scroll Up"
                >
                  ▲ Up
                </button>
                <span className="text-border">|</span>
                <button
                  onClick={() => handleManualScroll("down")}
                  className="px-2 py-0.5 hover:text-foreground transition-colors"
                  title="Scroll Down"
                >
                  ▼ Down
                </button>
              </div>
            )}
          </div>

          {/* Scrolling Feed Viewport */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`relative overflow-y-auto overflow-x-hidden p-1 pt-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${
              shouldScroll ? "h-[480px]" : "max-h-[480px]"
            }`}
          >
            {filteredNotices.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center p-8">
                <p className="text-sm font-semibold text-foreground">No news updates available</p>
              </div>
            ) : (
              <div className={`space-y-3.5 ${shouldScroll && !isPaused ? "slow-notice-flow" : ""}`}>
                {displayFeed.map((p, index) => {
                  const redirectUrl = p.redirectUrl ? String(p.redirectUrl).trim() : "";
                  const hasLink = Boolean(redirectUrl);
                  const isPdf = isPdfFile(redirectUrl);
                  const isExternal =
                    redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://");

                  const cardItem = (
                    <div
                      className={`group rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40 ${hasLink ? "cursor-pointer" : ""
                        }`}
                    >
                      {/* Meta Row: Type Badge + NEW Tag + Visit Symbol + Date */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            {p.type}
                          </span>

                          {p.isNew && (
                            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                              NEW
                            </span>
                          )}

                          {hasLink && (
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              Visit Link
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground font-medium">{p.date}</span>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {p.title}
                      </h4>

                      {/* Content Preview */}
                      {p.text && (
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {p.text}
                        </p>
                      )}

                      {/* Footer Action text */}
                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                        {hasLink ? (
                          <span className="font-semibold text-primary group-hover:underline">
                            {isPdf ? "View PDF Notice →" : "Visit Link →"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Official Notice</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          Ref #{((index % filteredNotices.length) + 1)}
                        </span>
                      </div>
                    </div>
                  );

                  if (hasLink) {
                    if (isPdf) {
                      return (
                        <div
                          key={`${p.id || p.title}-${index}`}
                          onClick={() => openFileViewer(redirectUrl, p.title)}
                          className="block no-underline"
                        >
                          {cardItem}
                        </div>
                      );
                    }
                    if (isExternal) {
                      const inlineTarget = getCloudinaryInlineViewerUrl(redirectUrl);
                      return (
                        <a
                          key={`${p.id || p.title}-${index}`}
                          href={inlineTarget}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block no-underline"
                        >
                          {cardItem}
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={`${p.id || p.title}-${index}`}
                        href={redirectUrl}
                        className="block no-underline"
                      >
                        {cardItem}
                      </Link>
                    );
                  }

                  return <div key={`${p.id || p.title}-${index}`}>{cardItem}</div>;
                })}
              </div>
            )}
          </div>

          {/* Footer Ribbon */}
          <div className="mt-3 border-t border-border pt-2.5 text-center text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing all {filteredNotices.length} news updates</span>
          </div>
        </div>
      </div>
    </section>
  );
}
