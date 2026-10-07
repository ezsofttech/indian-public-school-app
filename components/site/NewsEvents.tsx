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

const DEFAULT_NOTICES: NewsPost[] = [
  {
    id: "default-1",
    type: "Circular",
    date: "06 Oct 2026",
    title: "Class X & XII CBSE Board Examination Timetable SEP 2026",
    text: "Official date sheet, exam center guidelines, and admit card verification schedule for secondary & senior secondary students.",
    redirectUrl: "/mandatory-disclosure",
    isNew: true,
  },
  {
    id: "default-2",
    type: "Event",
    date: "04 Oct 2026",
    title: "Inter-House Athletics Meet & Annual Sports Festival 2026",
    text: "Four houses compete across track, field and relay challenges followed by prize distribution ceremony at school stadium.",
    redirectUrl: "/life-in-hostel",
    isNew: true,
  },
  {
    id: "default-3",
    type: "Admission",
    date: "01 Oct 2026",
    title: "Admission Open for Session 2026–27 (Nursery to Class IX)",
    text: "Online registration forms are open. Parents can also collect prospectus forms from campus administration counters.",
    redirectUrl: "/admission",
    isNew: true,
  },
  {
    id: "default-4",
    type: "Notice",
    date: "28 Sep 2026",
    title: "Parent-Teacher Meeting (PTM) for Term-I Performance Review",
    text: "Mandatory interactive feedback session for Grade VI to XII parents with respective subject teachers and mentors.",
    redirectUrl: "/parents-teachers-meeting",
    isNew: false,
  },
  {
    id: "default-5",
    type: "Academic",
    date: "25 Sep 2026",
    title: "Annual Science & STEM Robotics Exhibition Showcase",
    text: "Student teams present working prototypes on clean energy, water filtration, smart automation, and artificial intelligence.",
    redirectUrl: "/academics",
    isNew: false,
  },
  {
    id: "default-6",
    type: "Update",
    date: "20 Sep 2026",
    title: "Inauguration of Smart Coding & Robotics Workstation Lab",
    text: "New maker lab setup equipped with modern computing hardware and robotics kits for Grade IV and above.",
    redirectUrl: "/infrastructure",
    isNew: false,
  },
  {
    id: "default-7",
    type: "Notice",
    date: "18 Sep 2026",
    title: "Quarter-II Tuition & Transport Fee Payment Notice",
    text: "Parents are requested to settle Quarter-II dues online via student ERP portal or school accounts counter.",
    redirectUrl: "/fee-structure",
    isNew: false,
  },
  {
    id: "default-8",
    type: "Olympiad",
    date: "15 Sep 2026",
    title: "National Mathematics & Science Olympiad Registration",
    text: "Enrollment drive open for students of Class III to XII interested in appearing for competitive Olympiads.",
    redirectUrl: "/competitions-365-days",
    isNew: false,
  },
  {
    id: "default-9",
    type: "Circular",
    date: "10 Sep 2026",
    title: "School Transport Route Optimization & Bus Safety Audit",
    text: "Updated bus route timings and GPS safety features for student transit across Sambalpur regions.",
    redirectUrl: "/bus-route",
    isNew: false,
  },
  {
    id: "default-10",
    type: "Achievement",
    date: "05 Sep 2026",
    title: "IPS Recognized as Top CBSE School in Regional Academic Survey",
    text: "School awarded top honors for scholastic performance, sports facilities, and holistic student growth.",
    redirectUrl: "/press-release",
    isNew: false,
  },
];

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

  // Combine DB items with fallback items to guarantee at least 10 items
  const combinedList: NewsPost[] = [...apiNewsItems];
  if (combinedList.length < 10) {
    DEFAULT_NOTICES.forEach((fallback) => {
      if (
        combinedList.length < 10 &&
        !combinedList.some(
          (ex) => ex.title.toLowerCase().trim() === fallback.title.toLowerCase().trim()
        )
      ) {
        combinedList.push(fallback);
      }
    });
  }

  const filteredNotices = combinedList;

  // Duplicate items for continuous smooth bottom-to-top loop
  const displayFeed = filteredNotices.length > 0 ? [...filteredNotices, ...filteredNotices] : [];

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

            {/* Manual Up / Down Controls */}
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
          </div>

          {/* Scrolling Feed Viewport */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative h-[480px] overflow-y-auto overflow-x-hidden p-1 pt-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          >
            {filteredNotices.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <p className="text-sm font-semibold text-foreground">No news updates available</p>
              </div>
            ) : (
              <div className={`space-y-3.5 ${isPaused ? "" : "slow-notice-flow"}`}>
                {displayFeed.map((p, index) => {
                  const redirectUrl = p.redirectUrl ? String(p.redirectUrl).trim() : "";
                  const hasLink = Boolean(redirectUrl);
                  const isPdf = isPdfFile(redirectUrl);
                  const isExternal =
                    redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://");

                  const cardItem = (
                    <div
                      className={`group rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40 ${
                        hasLink ? "cursor-pointer" : ""
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
