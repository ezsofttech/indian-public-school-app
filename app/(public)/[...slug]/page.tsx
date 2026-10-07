import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, ChevronRight, Download, ExternalLink, FileText, GraduationCap, Lock } from "lucide-react";
import datasource from "@/public/cloud-datasource.json";
import { DEFAULT_HERO_IMAGE, imageUrl, processHtmlAssetUrls } from "@/lib/site-data";
import { getAssetUrl } from "@/lib/utils";

type Content = Record<string, unknown>;

function asRecord(value: unknown): Content | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Content)
    : null;
}

function label(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeKey(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ALIAS_MAP: Record<string, string[]> = {
  // About
  missionvision: ["ourmission", "mission", "vision", "mission-vision", "our-mission"],
  corevalues: ["corevalue", "values", "core-values", "core-value"],
  directormessage: ["director-message", "director"],
  chairmanmessage: ["chairman-message", "chairman"],
  principalmessage: ["principal-message", "principal"],
  schoolestablishment: ["school-establishment", "establishment"],
  // Infrastructure
  infirmaryedical: ["infirmary-medical", "infirmary", "medical", "infirmary-edical"],
  sportroom: ["sports-room", "sports", "sport-room"],
  artcraftroom: ["art-craft", "art-craft-room", "craft-room"],
  musicdanceroom: ["music-dance", "music-dance-room"],
  hostels: ["hostel", "hostels"],
  // Admission
  admissionpolicy: ["policy", "admission-policy"],
  admissionprocedure: ["procedure", "admission-procedure"],
  requireddocuments: ["documents-required", "required-documents", "documents"],
  admissionform: ["registration-form", "admission-form", "form"],
  learningbasedactivity: ["learning-based-activity", "learning-activity"],
  // Academics
  coursesoffered: ["courses", "courses-offered", "curriculum"],
  streamallocationsubjectsoffered: ["stream-allocation", "stream-allocation-subjects-offered"],
  sociallearningprograms: ["social-learning", "social-learning-programs"],
  teachingmethodology: ["teaching-methodology", "methodology"],
  // Life Hostel
  lifeinhostel: ["life-in-hostel", "hostel-life", "life-ips", "lifeips"],
  ourhouses: ["our-houses", "houses"],
  competitions365days: ["competition-365-days", "competitions-365-days", "competitions", "competition"],
  ourlearningpartners: ["our-learning-partners", "learning-partners"],
  studentempowerment: ["student-empowerment", "empowerment"],
  // Connectivity
  parentsteachersmeeting: ["parents-teachers-meeting", "parent-teacher-meeting", "ptm"],
  societalengagementprograms: ["societal-engagement-programs", "societal-engagement"],
  busroute: ["bus-route", "bus-routes"],
  schoolapp: ["school-app", "app"],
  homevisit: ["home-visit"],
  // Downloads & Mandatory
  manadatorydisclosure: ["mandatory-disclosure", "disclosure", "mandatory-public-disclosure", "public-disclosure", "mandatory"],
  selfcertification: ["self-certification", "certificate-of-recognition", "cbse-affiliation", "building-safety-certificate", "fire-safety", "no-object-certificate", "population-certificate", "certificate-of-land", "parent-teacher-association"],
  watertesting: ["water-testing", "safe-drinking-sanitation-certificate"],
  generalinformation: ["general-information"],
  tc: ["transfer-certificate", "tc"],
  emergencycontact: ["emergency-contact", "emergency-contacts"],
  trustee: ["trustee", "trustees"],
  staffdirectory: ["staff-directory", "staff"],
  hostelbrochure: ["hostel-brochure", "brochures", "brochure"],
  careercounsellingbook: ["career-counselling-book", "career-counselling-guide", "counselling"],
};

function buildBreadcrumbs(slug: string[], pageTitle: string) {
  const items: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
  ];

  if (slug.length === 1) {
    const s = slug[0].toLowerCase();
    if (["curriculum", "syllabus", "academics", "courses"].includes(s)) {
      items.push({ label: "Academics", href: "/#academics" });
    } else if (["fee-structure", "procedure", "eligibility", "enrolment", "policy"].includes(s)) {
      items.push({ label: "Admission", href: "/#admissions" });
    } else if (["about", "mission", "vision", "chairman-message", "principal-message", "director-message"].includes(s)) {
      items.push({ label: "About Us", href: "/#about" });
    }
  } else {
    let acc = "";
    for (let i = 0; i < slug.length - 1; i++) {
      acc += `/${slug[i]}`;
      items.push({
        label: label(slug[i]),
        href: acc,
      });
    }
  }

  items.push({
    label: pageTitle,
    href: `/${slug.join("/")}`,
  });

  return items;
}

function resolvePageFromDatasource(slugArray: string[]): Content | null {
  if (!slugArray || slugArray.length === 0) return null;
  const fullPath = "/" + slugArray.join("/");
  const normFullPath = normalizeKey(fullPath);
  const lastSegment = slugArray.at(-1) || "";
  const normLastSeg = normalizeKey(lastSegment);

  // 0. Check top-level "pages" collection in datasource first (matches database format with textContent)
  if (Array.isArray((datasource as Content).pages)) {
    const pagesList = (datasource as Content).pages as Content[];
    const match = pagesList.find((p) => {
      if (!p || typeof p !== "object") return false;
      const s = normalizeKey(String(p.slug || ""));
      const u = normalizeKey(String(p.targetUrl || ""));
      return s === normLastSeg || s === normFullPath || u === normFullPath;
    });
    if (match) return match;
  }

  function cleanDoc(val: unknown, defaultTitle = ""): Content | null {
    if (!val) return null;
    if (Array.isArray(val)) {
      const first = val.find((x) => x && typeof x === "object" && !Array.isArray(x));
      return first
        ? { title: defaultTitle, ...(first as Content) }
        : { title: defaultTitle, content: val };
    }
    if (typeof val === "object") {
      return { title: defaultTitle, ...(val as Content) };
    }
    return { title: defaultTitle, description: [String(val)] };
  }

  // 1. Exact or normalized redirectUrl match anywhere in JSON
  function searchRedirect(val: unknown): Content | null {
    if (!val) return null;
    if (Array.isArray(val)) {
      for (const item of val) {
        const res = searchRedirect(item);
        if (res) return res;
      }
      return null;
    }
    if (typeof val === "object") {
      const rec = val as Content;
      if (
        typeof rec.redirectUrl === "string" &&
        (rec.redirectUrl === fullPath || normalizeKey(rec.redirectUrl) === normFullPath)
      ) {
        return rec;
      }
      for (const k of Object.keys(rec)) {
        const res = searchRedirect(rec[k]);
        if (res) return res;
      }
    }
    return null;
  }
  const redirectMatch = searchRedirect(datasource);
  if (redirectMatch) return redirectMatch;

  // 2. Direct key or alias match in datasource tree
  function searchTree(obj: unknown): Content | null {
    if (!obj || typeof obj !== "object") return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const res = searchTree(item);
        if (res) return res;
      }
      return null;
    }

    const rec = obj as Content;
    for (const [key, val] of Object.entries(rec)) {
      if (["identity", "header", "footer", "users", "staff", "students"].includes(key)) continue;
      const normK = normalizeKey(key);

      if (normK === normLastSeg || normK === normFullPath) {
        return cleanDoc(val, label(key));
      }

      for (const [canonKey, aliases] of Object.entries(ALIAS_MAP)) {
        if (
          normK === canonKey &&
          aliases.some((a) => normalizeKey(a) === normLastSeg || normalizeKey(a) === normFullPath)
        ) {
          return cleanDoc(val, label(key));
        }
      }

      if (val && typeof val === "object") {
        const childRes = searchTree(val);
        if (childRes) return childRes;
      }
    }
    return null;
  }

  const treeMatch = searchTree(datasource);
  if (treeMatch) return treeMatch;

  // 3. Category overview fallback if top-level section requested
  const categoryKeys: Record<string, string> = {
    about: "aboutUs",
    aboutus: "aboutUs",
    infrastructure: "infrastructure",
    admission: "admission",
    admissions: "admission",
    academics: "academics",
    lifehostel: "life-hostel",
    campuslife: "life-hostel",
    connectivity: "connectivity",
    download: "download",
    downloads: "download",
    mandatorydisclosure: "manadatory-disclosure",
    gallery: "gallery",
    other: "download",
  };

  const targetCategoryKey = categoryKeys[normLastSeg] || categoryKeys[normFullPath];
  if (targetCategoryKey && (datasource as Content)[targetCategoryKey]) {
    const categoryData = (datasource as Content)[targetCategoryKey];
    return {
      title: label(lastSegment),
      heading: label(lastSegment),
      description: [`Welcome to Indian Public School's ${label(lastSegment)} section. Explore the details below.`],
      cardItem: Array.isArray(categoryData) ? categoryData : Object.values(categoryData as Content),
    };
  }

  return null;
}

function strings(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  return [];
}

function media(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(media);
  if (typeof value === "string" && /^(https?:\/\/|\/)/.test(value))
    return [value];
  return [];
}

function contentText(page: Content): string[] {
  return [page.description, page.content, page["sub-title"], page.subHeading, page.heading]
    .flatMap(strings)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function contentMedia(page: Content): string[] {
  return [page.fileUrl, page.fileUrls, page.image, page.images]
    .flatMap(media)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function childCards(page: Content): Content[] {
  const candidates = [page.cardItem, page.list, page.content, page.steps];
  return candidates.flatMap((candidate) =>
    Array.isArray(candidate)
      ? candidate
        .map(asRecord)
        .filter((item): item is Content => item !== null)
      : [],
  );
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  return [];
}

const API_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

export const dynamic = "force-dynamic";

async function fetchDbPage(slugArray: string[]): Promise<Content | null> {
  const lastSegment = slugArray.at(-1) || "";
  const fullPath = slugArray.join("/");
  const candidates = [lastSegment, fullPath, `pages/${lastSegment}`];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const res = await fetch(`${API_URL}/pages/slug/${encodeURIComponent(candidate)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const doc = json?.data ?? json;
        if (doc && doc.title) return doc as Content;
      }
    } catch {
      // fallback cleanly
    }
  }
  return null;
}

async function resolvePage(slug: string[]): Promise<Content | null> {
  const dbPage = await fetchDbPage(slug);
  if (dbPage) return dbPage;
  return resolvePageFromDatasource(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await resolvePage(slug);
  const title =
    typeof page?.title === "string"
      ? page.title
      : typeof page?.heading === "string"
        ? page.heading
        : label(slug.at(-1) ?? "Indian Public School");
  return { title: `${title} | Indian Public School` };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await resolvePage(slug);

  if (page && (page.isPublished === false || page.isPublished === "false")) {
    return (
      <main className="container-page py-24 min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <Lock size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Page Not Accessible</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            This school information page is currently not published or is not accessible. Please contact administration for assistance.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#1a5d9c] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#102a4c]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fallbackTitle = label(slug.at(-1) ?? "School information");
  const activePage: Content = page || {
    title: fallbackTitle,
    heading: fallbackTitle,
    description: [
      `Welcome to Indian Public School's ${fallbackTitle} section. For complete information, schedules, and guidance, please visit our main campus or reach out to our administration office.`,
    ],
  };

  const title =
    typeof activePage.title === "string"
      ? activePage.title
      : typeof activePage.heading === "string"
        ? activePage.heading
        : fallbackTitle;

  const description = contentText(activePage);
  if (description.length === 0) {
    description.push(
      `Welcome to Indian Public School's ${title} section. For complete details, schedules, and admissions info, please visit our campus or contact our administration.`,
    );
  }

  const images = contentMedia(activePage).filter((url) =>
    /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i.test(url),
  );
  const documentUrls = contentMedia(activePage).filter(
    (url) => !/\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i.test(url),
  );
  const directFileUrl = typeof activePage.fileUrl === "string" ? activePage.fileUrl : "";
  if (directFileUrl && !documentUrls.includes(directFileUrl) && !images.includes(directFileUrl)) {
    documentUrls.push(directFileUrl);
  }

  const cards = childCards(activePage);
  const bulletItems = stringList(activePage.list);
  const rawHtmlContent = typeof activePage.textContent === "string" ? activePage.textContent : "";
  const htmlContent = processHtmlAssetUrls(rawHtmlContent);
  const breadcrumbs = buildBreadcrumbs(slug, title);

  const rawBannerImg =
    typeof activePage?.heroImage === "string" && activePage.heroImage
      ? (activePage.heroImage as string)
      : typeof activePage?.bannerImage === "string" && activePage.bannerImage
        ? (activePage.bannerImage as string)
        : typeof activePage?.image === "string" && activePage.image
          ? (activePage.image as string)
          : DEFAULT_HERO_IMAGE;
  const bannerImg = imageUrl(rawBannerImg);

  return (
    <main className="flex-1">
      <section
        className="relative overflow-hidden py-14 sm:py-18 text-white shadow-xl border-b-2 border-[var(--gold)]/40"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImg}
            alt={title}
            className="h-full w-full object-cover object-center filter brightness-[0.35] contrast-[1.15] opacity-60 scale-105 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--gold)]/20 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-90" />
        </div>

        <div className="container-page relative z-10 max-w-5xl flex flex-col items-start gap-4">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex flex-wrap items-center gap-2.5 border border-[var(--gold)]/40 bg-slate-950/80 px-5 py-2 text-xs font-semibold text-white/95 shadow-2xl backdrop-blur-md sm:text-sm"
            style={{ borderRadius: "var(--badge-radius, 9999px)" }}
          >
            <GraduationCap className="size-4 text-[var(--gold)] shrink-0 mr-0.5" />
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="inline-flex items-center gap-2.5">
                  {idx > 0 && <span className="text-[var(--gold)] font-extrabold text-xs sm:text-sm">*</span>}
                  {isLast ? (
                    <span className="font-bold text-[var(--gold)] drop-shadow-sm">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-[var(--gold)] hover:underline text-white/80"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-2 space-y-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md leading-tight font-[var(--font-display)]">
              {title}
            </h1>
          </div>
        </div>
      </section>

      <section className="container-page py-12 lg:py-20">
        {htmlContent ? (
          <div
            className="mx-auto max-w-4xl prose prose-slate prose-lg max-w-none space-y-6 text-slate-800 leading-relaxed font-sans dynamic-page-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="mx-auto max-w-4xl space-y-5 text-base leading-relaxed text-slate-700 sm:text-lg">
            {description.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Document Download & Viewer Cards */}
        {documentUrls.length > 0 && (
          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {documentUrls.map((docUrl, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-500/10 via-background to-primary/5 p-5 shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="grid size-12 place-items-center rounded-xl bg-gold/20 text-gold shrink-0">
                    <FileText className="size-6 text-[#1a5d9c]" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {title} — Official Document
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Official PDF document / attachment from Indian Public School
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--navy)] px-5 py-2.5 text-xs font-bold text-[var(--primary-foreground)] shadow-soft transition-all"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  >
                    <Download size={14} />
                    View / Download Document
                    <ExternalLink size={12} className="opacity-80" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bullet point features/list */}
        {bulletItems.length > 0 && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="size-5 text-gold" /> Key Highlights & Details
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {bulletItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 size-2 rounded-full bg-gold shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Media Images */}
        {images.length > 0 && (
          <div className="mx-auto mt-12 max-w-4xl grid gap-5 sm:grid-cols-2">
            {images.map((src, index) => (
              <img
                key={src}
                src={imageUrl(src)}
                alt={`${title} ${index + 1}`}
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft transition-transform duration-300 hover:scale-[1.02]"
              />
            ))}
          </div>
        )}

        {/* Sub-sections & Child Cards */}
        {cards.length > 0 && (
          <div className="mx-auto mt-12 max-w-4xl grid gap-6 md:grid-cols-2">
            {cards.map((card, index) => {
              const cardTitle =
                typeof card.title === "string"
                  ? card.title
                  : typeof card.heading === "string"
                    ? card.heading
                    : `Feature ${index + 1}`;
              const cardSubTitle = typeof card["sub-title"] === "string" ? card["sub-title"] : "";
              const cardDesc = contentText(card);
              const cardList = stringList(card.list);

              return (
                <article
                  key={`${cardTitle}-${index}`}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        {index + 1}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{cardTitle}</h2>
                    </div>
                    {Boolean(cardSubTitle) && (
                      <p className="mt-1 text-xs font-semibold text-gold">{cardSubTitle}</p>
                    )}
                    {cardDesc.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className="mt-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {cardList.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
                        {cardList.map((li, lIdx) => (
                          <li key={lIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <ChevronRight size={13} className="text-gold shrink-0 mt-0.5" />
                            <span>{li}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
