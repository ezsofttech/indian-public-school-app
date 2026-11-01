"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FileCheck,
  FileText,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Building2,
  Users,
  BookOpen,
  Award,
  ShieldCheck,
  Printer,
  X,
  Filter,
  Layers,
  Eye,
  Loader2,
} from "lucide-react";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { getAssetUrl, isExternalUrl } from "@/lib/utils";
import { isPdfFile, isDocumentFile } from "@/lib/file-preview";
import { getSectionBadge } from "@/lib/sequence-serializer";
import { DEFAULT_HERO_IMAGE, DEFAULT_CREST_LOGO, DEFAULT_SECONDARY_LOGO, homeData, imageUrl, isBannerLogoUrl } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { generateDisclosureHtmlTemplate } from "@/lib/pdf-template";

export interface DisclosureViewData {
  label?: string;
  type?: "PDF" | "LINK";
  url: string;
  openInNewTab?: boolean;
}

export interface DisclosureRowData {
  rowId?: string;
  srNo: number | string;
  title: string;
  detail?: string;
  view?: DisclosureViewData | null;
  order?: number;
}

export interface DisclosureSectionData {
  _id?: string;
  id?: string;
  publicId?: string;
  sectionKey: string;
  sectionTitle: string;
  order: number;
  isPublished: boolean;
  items: DisclosureRowData[];
}

interface PublicDisclosureViewProps {
  initialSections: DisclosureSectionData[];
  schoolName?: string;
  affiliationNo?: string;
  schoolCode?: string;
  showNotice?: boolean;
  complianceNote?: string;
  pageTitle?: string;
}

export function PublicDisclosureView({
  initialSections,
  schoolName = "INDIAN PUBLIC SCHOOL",
  affiliationNo = "330833",
  schoolCode = "65830",
  showNotice = true,
  complianceNote = "Fields marked [Enter details] and document links are awaiting the school's verified information.",
  pageTitle = "Mandatory Disclosure",
}: PublicDisclosureViewProps) {
  const siteData = useSiteData();
  const homeIdentity = (homeData(siteData).identity as Record<string, unknown>) || {};
  const siteLogo = (siteData?.site_logo as Record<string, any>) || (homeIdentity.site_logo as Record<string, any>) || {};
  const headerConfig = (homeIdentity.header as Record<string, any>) || (siteData?.header as Record<string, any>) || {};

  const bannerLogo = (siteLogo.logoUrl ? String(siteLogo.logoUrl).trim() : "") ||
    (headerConfig.logoUrl ? String(headerConfig.logoUrl).trim() : "") ||
    "/assets/Settings/Logos/IPSLogo.png";

  const rawSecLogo = (siteLogo.secondaryLogoUrl ? String(siteLogo.secondaryLogoUrl).trim() : "") ||
    (headerConfig.secondaryLogoUrl ? String(headerConfig.secondaryLogoUrl).trim() : "") ||
    DEFAULT_SECONDARY_LOGO;

  const showSec = siteLogo.showSecondaryLogo !== false && headerConfig.showSecondaryLogo !== false;

  const [sections] = useState<DisclosureSectionData[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Default all expanded
    const initial: Record<string, boolean> = {};
    for (const sec of initialSections) {
      initial[sec.sectionKey] = true;
    }
    return initial;
  });

  // Modal preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrint = useCallback(() => {
    try {
      const html = generateDisclosureHtmlTemplate({
        sections,
        schoolName,
        affiliationNo,
        schoolCode,
        pageTitle,
        logoUrl: imageUrl(bannerLogo) || "/assets/Settings/Logos/IPSLogo.png",
        secondaryLogoUrl: imageUrl(rawSecLogo) || DEFAULT_SECONDARY_LOGO,
        showSecondaryLogo: showSec,
      });
      setPreviewUrl(null);
      setPreviewHtml(html);
      setPreviewTitle(`${schoolName} - ${pageTitle}`);
    } catch (err) {
      console.error("Failed to generate document print template:", err);
    }
  }, [sections, schoolName, affiliationNo, schoolCode, pageTitle, bannerLogo, rawSecLogo, showSec]);

  const allExpanded = useMemo(() => {
    return sections.length > 0 && sections.every((s) => expandedSections[s.sectionKey] !== false);
  }, [sections, expandedSections]);

  const toggleAllSections = () => {
    const nextState = !allExpanded;
    const update: Record<string, boolean> = {};
    for (const s of sections) {
      update[s.sectionKey] = nextState;
    }
    setExpandedSections(update);
  };

  // Filter published sections
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => sec.isPublished !== false);
  }, [sections]);


  return (
    <div className="flex-1 bg-background text-foreground min-h-screen">
      {/* Signature Indian Public School Hero Banner (Consistent with Dynamic Pages) */}
      <section
        className="relative overflow-hidden py-14 sm:py-18 text-white shadow-xl border-b-2 border-[var(--gold)]/40"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={getAssetUrl(DEFAULT_HERO_IMAGE)}
            alt={pageTitle}
            className="h-full w-full object-cover object-center filter brightness-[0.35] contrast-[1.15] opacity-60 scale-105 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--gold)]/20 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-90" />
        </div>

        <div className="container-page relative z-10 max-w-7xl flex flex-col items-start gap-4">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex flex-wrap items-center gap-2.5 border border-[var(--gold)]/40 bg-slate-950/80 px-5 py-2 text-xs font-semibold text-white/95 shadow-2xl backdrop-blur-md sm:text-sm"
            style={{ borderRadius: "var(--badge-radius, 9999px)" }}
          >
            <GraduationCap className="size-4 text-[var(--gold)] shrink-0 mr-0.5" />
            <div className="inline-flex items-center gap-2.5">
              <Link
                href="/"
                className="transition-colors hover:text-[var(--gold)] hover:underline text-white/80"
              >
                Home
              </Link>
            </div>
            <span className="text-[var(--gold)] font-extrabold text-xs sm:text-sm">*</span>
            <div className="inline-flex items-center gap-2.5">
              <span className="font-bold text-[var(--gold)] drop-shadow-sm">
                {pageTitle}
              </span>
            </div>
          </nav>

          <div className="mt-2 space-y-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md leading-tight font-[var(--font-display)]">
              {pageTitle}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container-page py-10 lg:py-16 max-w-7xl space-y-8">
        {/* Statutory Compliance Notice Bar (Theme-managed, responsive & dynamic) */}
        {showNotice && (
          <div
            className="relative overflow-hidden border border-border border-l-4 border-l-primary bg-card text-card-foreground p-3.5 sm:p-4 shadow-2xs"
            style={{ borderRadius: "var(--card-radius, 0.75rem)" }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="size-4" />
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  CBSE Affiliation No.{" "}
                  <span className="font-bold text-primary">
                    {affiliationNo || "330833"}
                  </span>
                </span>
                <span className="text-primary font-bold mx-2">·</span>
                <span className="font-semibold text-foreground">
                  School Code{" "}
                  <span className="font-bold text-primary">
                    {schoolCode || "65830"}
                  </span>
                </span>
                {complianceNote && (
                  <>
                    <span className="text-muted-foreground/60 mx-1.5 sm:mx-2">·</span>
                    <span className="font-normal text-muted-foreground">
                      {complianceNote}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Actions & Summary Toolbar Bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 border border-border bg-card text-card-foreground p-4 shadow-xs print:hidden"
          style={{ borderRadius: "var(--card-radius, 1rem)" }}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
              <FileCheck className="size-4.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground">
                Official CBSE Mandatory Disclosures
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start shrink-0">
            <button
              type="button"
              onClick={toggleAllSections}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-border bg-card text-card-foreground hover:bg-muted/70 px-3.5 py-2 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              style={{ borderRadius: "var(--btn-radius, 9999px)" }}
            >
              <ChevronDown
                size={14}
                className={`text-primary transition-transform duration-200 ${allExpanded ? "rotate-180" : ""
                  }`}
              />
              <span>{allExpanded ? "Collapse All" : "Expand All"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              style={{ borderRadius: "var(--btn-radius, 9999px)" }}
              title="Open document preview to print or save as PDF"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Disclosure Sections Accordion / Cards */}
        {filteredSections.length === 0 ? (
          <div
            className="border border-dashed border-border bg-card text-card-foreground p-12 text-center space-y-3"
            style={{ borderRadius: "var(--card-radius, 1rem)" }}
          >
            <FileText className="mx-auto size-10 text-muted-foreground/60" />
            <h3 className="text-base font-bold text-foreground">No Disclosures Found</h3>
            <p className="text-xs text-muted-foreground">
              Public disclosure information will be updated shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSections.map((sec, secIdx) => {
              const isExpanded = expandedSections[sec.sectionKey] !== false;

              return (
                <article
                  key={sec.sectionKey || secIdx}
                  id={sec.sectionKey}
                  className="overflow-hidden border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300"
                  style={{ borderRadius: "var(--card-radius, 1rem)" }}
                >
                  {/* Section Title Header */}
                  <header
                    onClick={() => toggleSection(sec.sectionKey)}
                    className="flex cursor-pointer items-center justify-between border-b border-border text-white select-none transition-all hover:brightness-105 shadow-xs p-4 sm:p-5"
                    style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className="grid size-10 place-items-center bg-white/15 text-white font-black font-mono text-sm shadow-md ring-2 ring-white/20 shrink-0"
                        style={{ borderRadius: "var(--badge-radius, 0.75rem)" }}
                      >
                        {getSectionBadge(sec.sectionTitle, secIdx)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight font-[var(--font-display)] break-words sm:truncate">
                          {sec.sectionTitle}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`grid size-9 place-items-center bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-all duration-300 shadow-2xs ${isExpanded ? "rotate-180" : ""
                          }`}
                        style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </header>

                  {/* Section Items */}
                  {isExpanded && (
                    <div className="bg-card text-card-foreground">
                      {/* Subtle accent rule below header */}
                      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/40 to-transparent" />

                      {sec.items.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                          No records listed under this section yet.
                        </div>
                      ) : (
                        <>
                          {/* Mobile Card Layout (Visible only on small screens < 640px) */}
                          <div className="block sm:hidden divide-y divide-border/60">
                            {sec.items.map((row, rowIdx) => {
                              const hasDetail = Boolean(row.detail && row.detail.trim());
                              const hasDoc = Boolean(row.view && row.view.url);
                              const rawUrl = row.view?.url || "";
                              const resolvedUrl = getAssetUrl(rawUrl) || rawUrl;
                              const isExternalWeb =
                                row.view?.type === "LINK" &&
                                !isPdfFile(rawUrl) &&
                                !isDocumentFile(rawUrl) &&
                                isExternalUrl(rawUrl);

                              return (
                                <div key={row.rowId || rowIdx} className="p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className="inline-flex size-6 shrink-0 items-center justify-center bg-secondary text-secondary-foreground font-mono text-[11px] font-bold border border-border shadow-2xs mt-0.5"
                                      style={{ borderRadius: "var(--badge-radius, 0.375rem)" }}
                                    >
                                      {row.srNo ?? rowIdx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs font-bold text-foreground leading-snug">
                                        {row.title}
                                      </h4>
                                      {hasDetail && (
                                        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                                          {row.detail}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {hasDoc && (
                                    <div className="pt-1">
                                      {isExternalWeb ? (
                                        <a
                                          href={resolvedUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs transition-all"
                                        >
                                          <FileText size={14} />
                                          <span>{row.view?.label || "VIEW DOCUMENT"}</span>
                                          <ExternalLink size={12} className="opacity-80" />
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPreviewUrl(resolvedUrl);
                                            setPreviewTitle(row.title || "Mandatory Disclosure Document");
                                          }}
                                          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                                        >
                                          <FileText size={14} />
                                          <span>{row.view?.label || "VIEW DOCUMENT"}</span>
                                          <Eye size={13} className="opacity-80" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop / Tablet Table Layout (Hidden on mobile < 640px) */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b-2 border-border bg-muted/60 text-foreground text-[11px] font-extrabold uppercase tracking-wider font-[var(--font-display)]">
                                  <th className="py-3.5 px-3 text-center w-16 sm:w-20 border-r border-border">
                                    Sr.
                                  </th>
                                  <th className="py-3.5 px-4 sm:px-5 w-2/5 sm:w-1/3 min-w-[220px] border-r border-border">
                                    Information / Subject
                                  </th>
                                  <th className="py-3.5 px-4 sm:px-5 border-r border-border">
                                    Details / Information
                                  </th>
                                  <th className="py-3.5 px-4 text-center w-36 sm:w-44 min-w-[140px]">
                                    Document
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border text-xs">
                                {sec.items.map((row, rowIdx) => {
                                  const hasDetail = Boolean(row.detail && row.detail.trim());
                                  const hasDoc = Boolean(row.view && row.view.url);
                                  const rawUrl = row.view?.url || "";
                                  const resolvedUrl = getAssetUrl(rawUrl) || rawUrl;
                                  const isExternalWeb =
                                    row.view?.type === "LINK" &&
                                    !isPdfFile(rawUrl) &&
                                    !isDocumentFile(rawUrl) &&
                                    isExternalUrl(rawUrl);

                                  return (
                                    <tr
                                      key={row.rowId || rowIdx}
                                      className="even:bg-muted/30 hover:bg-muted/70 transition-colors"
                                    >
                                      {/* Serial Number */}
                                      <td className="py-4 px-3 text-center border-r border-border align-middle">
                                        <span
                                          className="inline-flex size-7 items-center justify-center bg-secondary text-secondary-foreground font-mono text-xs font-bold border border-border shadow-2xs"
                                          style={{ borderRadius: "var(--badge-radius, 0.5rem)" }}
                                        >
                                          {row.srNo ?? rowIdx + 1}
                                        </span>
                                      </td>

                                      {/* Row Title */}
                                      <td className="py-4 px-4 sm:px-5 border-r border-border align-middle">
                                        <span className="font-semibold text-foreground text-xs sm:text-[13px] leading-snug">
                                          {row.title}
                                        </span>
                                      </td>

                                      {/* Text Detail */}
                                      <td className="py-4 px-4 sm:px-5 border-r border-border align-middle">
                                        {hasDetail ? (
                                          <p className="whitespace-pre-line text-muted-foreground text-xs sm:text-[13px] font-sans leading-relaxed">
                                            {row.detail}
                                          </p>
                                        ) : (
                                          <span className="text-muted-foreground/40 font-mono text-sm select-none">—</span>
                                        )}
                                      </td>

                                      {/* Document Action Button */}
                                      <td className="py-4 px-4 text-center align-middle">
                                        {hasDoc ? (
                                          <div className="inline-flex justify-center">
                                            {isExternalWeb ? (
                                              <a
                                                href={resolvedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-primary/20 group cursor-pointer"
                                                style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                                              >
                                                <FileText size={13} className="text-primary-foreground/90 group-hover:scale-110 transition-transform" />
                                                <span>{row.view?.label || "VIEW"}</span>
                                                <ExternalLink size={11} className="text-primary-foreground/70 group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-transform" />
                                              </a>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setPreviewUrl(resolvedUrl);
                                                  setPreviewTitle(row.title || "Mandatory Disclosure Document");
                                                }}
                                                className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border border-primary/20 group cursor-pointer"
                                                style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                                              >
                                                <FileText size={13} className="text-primary-foreground/90 group-hover:scale-110 transition-transform" />
                                                <span>{row.view?.label || "VIEW"}</span>
                                                <Eye size={12} className="text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground/40 font-mono text-sm select-none">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* PDF / Document Viewer Modal */}
      {Boolean(previewUrl || previewHtml) && (
        <FileViewerModal
          isOpen={Boolean(previewUrl || previewHtml)}
          onClose={() => {
            setPreviewUrl(null);
            setPreviewHtml(null);
          }}
          url={previewUrl}
          htmlContent={previewHtml ?? undefined}
          title={previewTitle || "Mandatory Disclosure Document"}
        />
      )}
    </div>
  );
}
