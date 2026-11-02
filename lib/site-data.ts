import { checkBackendHealth, getOptionalApi, unwrapCollection, unwrapSetting, type ApiRecord, type PaginatedData } from "@/lib/api-client";
import { formatHref, getAssetUrl, getCloudinaryRootFolder } from "@/lib/utils";
import fallbackSiteData from "@/public/cloud-datasource.json";

export const CLOUDINARY_ROOT_FOLDER = getCloudinaryRootFolder();
export const DEFAULT_HERO_IMAGE = "/assets/Settings/Home/Banner_1.jpg";
export const DEFAULT_LOGO = "/assets/Settings/Logos/IPSLogo.png";
export const DEFAULT_SECONDARY_LOGO = "/assets/Settings/Logos/AakashFoundationLogo.png";
export const DEFAULT_CREST_LOGO = "/assets/Settings/Logos/IPSStandardLogo.png";
export const DEFAULT_INTRO_VIDEO = "/Videos/IPSIntroVideo.mp4";

export type SiteRecord = ApiRecord;

export interface SiteLogoSetting {
  logoUrl?: string;
  secondaryLogoUrl?: string;
  showSecondaryLogo?: boolean;
  logoText?: string;
  logoSubText?: string;
  [key: string]: unknown;
}

export interface CertifiedBoardSetting {
  title?: string;
  subtitle?: string;
  code?: string;
  badgeUrl?: string;
  description?: string;
  linkUrl?: string;
  enabled?: boolean;
}

export interface TrustBoardSetting {
  trustName?: string;
  regNo?: string;
  logoUrl?: string;
  description?: string;
  linkUrl?: string;
  enabled?: boolean;
}

export interface AcademicPartnerSetting {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  description?: string;
  linkUrl?: string;
  enabled?: boolean;
}

export interface WhatsAppSetting {
  enabled?: boolean;
  phone?: string;
  agentName?: string;
  agentRole?: string;
  welcomeMessage?: string;
  presetMessages?: string[];
  position?: "bottom-left" | "bottom-right";
}

export interface PopupBannerSetting {
  enabled?: boolean;
  delaySeconds?: number;
  imageUrl?: string;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  enquiryButtonText?: string;
  closeButtonText?: string;
  onlyOncePerSession?: boolean;
  modalWidth?: "sm" | "md" | "lg" | "xl" | "full" | "custom";
  imageWidth?: number;
  imageMaxHeight?: number;
  imageFit?: "contain" | "cover" | "fill";
  imagePosition?: "center" | "top" | "bottom";
  aspectRatio?: "auto" | "16/9" | "16/10" | "4/3" | "1/1" | "3/2" | "2/1";
  bannerStyle?: "card" | "full-bleed" | "side-by-side" | "concept1" | "concept2" | "concept3" | "concept4";
  showInlineForm?: boolean;
  imageBorderRadius?: number;
  showImageZoomOnClick?: boolean;
}

export interface DeveloperSetting {
  name?: string;
  url?: string;
  label?: string;
  showBackendStatus?: boolean;
}

export interface ApiMenuItem {
  _id?: string;
  menuId?: string;
  title: string;
  slug?: string;
  targetUrl?: string;
  linkUrl?: string;
  parentId?: string | null;
  level?: number;
  category?: string;
  isPublished?: boolean;
  order?: number;
  subItems?: ApiMenuItem[];
  [key: string]: unknown;
}

export function buildMenuHierarchy(flatItems: any[]): ApiMenuItem[] {
  if (!Array.isArray(flatItems) || flatItems.length === 0) return [];

  const alreadyNested = flatItems.some(
    (item) => Array.isArray(item.subItems) && item.subItems.length > 0
  );
  if (alreadyNested) {
    return flatItems as ApiMenuItem[];
  }

  const validItems = flatItems.filter((item) => {
    if (item.isPublished === false) return false;
    if (item.category && String(item.category).toLowerCase() !== "header") return false;
    return true;
  });

  validItems.sort((a, b) => {
    const levelA = Number(a.level) || 1;
    const levelB = Number(b.level) || 1;
    if (levelA !== levelB) return levelA - levelB;
    const orderA = Number(a.order) || 0;
    const orderB = Number(b.order) || 0;
    return orderA - orderB;
  });

  const nodeMap = new Map<string, ApiMenuItem>();
  const idToNodeMap = new Map<string, ApiMenuItem>();

  validItems.forEach((item) => {
    const targetUrl =
      item.targetUrl ||
      item.linkUrl ||
      item.redirectUrl ||
      (item.slug ? `/${item.slug}` : "/");

    const node: ApiMenuItem = {
      _id: String(item._id || item.menuId || item.id),
      menuId: item.menuId ? String(item.menuId) : undefined,
      slug: item.slug ? String(item.slug) : undefined,
      title: String(item.title || item.heading || ""),
      targetUrl,
      linkUrl: targetUrl,
      order: Number(item.order) || 0,
      level: Number(item.level) || 1,
      isPublished: item.isPublished !== false,
      subItems: [],
    };

    const nodeKey = String(item._id || item.menuId);
    nodeMap.set(nodeKey, node);
    if (item._id) idToNodeMap.set(String(item._id), node);
    if (item.menuId) idToNodeMap.set(String(item.menuId), node);
    if (item.slug) idToNodeMap.set(String(item.slug), node);
  });

  const rootNodes: ApiMenuItem[] = [];

  validItems.forEach((item) => {
    const nodeKey = String(item._id || item.menuId);
    const node = nodeMap.get(nodeKey);
    if (!node) return;

    const parentIdStr = item.parentId ? String(item.parentId).trim() : null;
    if (parentIdStr) {
      const parentNode = idToNodeMap.get(parentIdStr);
      if (parentNode && parentNode !== node) {
        parentNode.subItems!.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

export interface SiteData {
  home: SiteRecord[];
  news?: SiteRecord[];
  galleryItems?: SiteRecord[];
  reviewsItems?: SiteRecord[];
  menuItems?: SiteRecord[];
  menuitems?: SiteRecord[];
  site_logo?: SiteLogoSetting;
  certified_board?: CertifiedBoardSetting;
  trust_board?: TrustBoardSetting;
  academic_partner?: AcademicPartnerSetting;
  developer?: DeveloperSetting;
  backendConnected?: boolean;
  whatsapp?: WhatsAppSetting;
  popupBanner?: PopupBannerSetting;
  [key: string]: unknown;
}

export async function getSiteData(): Promise<SiteData> {
  const isHealthy = await checkBackendHealth();

  if (!isHealthy) {
    // Backend NOT attached -> apply fallback
    const fallback = fallbackSiteData as SiteData;
    const rawFallbackMenuitems = Array.isArray(fallback.menuItems)
      ? fallback.menuItems
      : Array.isArray(fallback.menuitems)
        ? fallback.menuitems
        : [];
    const fallbackMenuitemsTree = buildMenuHierarchy(rawFallbackMenuitems as SiteRecord[]);
    const fallbackGallery = Array.isArray(fallback.gallery)
      ? (fallback.gallery as SiteRecord[])
      : [];
    const fallbackReviews = Array.isArray(fallback.reviews)
      ? (fallback.reviews as SiteRecord[])
      : [];

    return {
      ...fallback,
      backendConnected: false,
      developer: (fallback.developer as DeveloperSetting) || {
        name: "EZ Softech",
        url: "https://ezsoftapp.in",
        label: "Crafted by",
        showBackendStatus: true,
      },
      site_logo: fallback.site_logo,
      home: fallback.home || [],
      news: fallback.news || [],
      galleryItems: fallbackGallery,
      reviewsItems: fallbackReviews,
      menuItems: fallbackMenuitemsTree,
      menuitems: rawFallbackMenuitems as SiteRecord[],
    };
  }

  // Backend IS attached -> DO NOT apply fallback!
  const [
    siteResponse,
    logoSettingResponse,
    newsResponse,
    galleryResponse,
    reviewsResponse,
    menuItemsResponse,
  ] = await Promise.all([
    getOptionalApi<SiteData | { value?: SiteData; _doc?: { value?: SiteData } }>("/regarding/datasource"),
    getOptionalApi<SiteLogoSetting | { value?: SiteLogoSetting }>("/school-settings/key/site_logo"),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/news", { limit: 20, page: 1, sortOrder: "desc" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/gallery", { limit: 500, page: 1, sortOrder: "desc" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/reviews", { limit: 50, page: 1, sortOrder: "desc", isApproved: "true" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/menu-items", { publishedOnly: "true" }),
  ]);

  const siteData = siteResponse ? unwrapSetting<SiteData>(siteResponse) : ({} as SiteData);
  const dbLogoSetting = logoSettingResponse ? unwrapSetting<SiteLogoSetting>(logoSettingResponse) : null;
  const apiNews = unwrapCollection(newsResponse);
  const apiGallery = unwrapCollection(galleryResponse);
  const apiReviews = unwrapCollection(reviewsResponse);
  const apiMenuItems = unwrapCollection(menuItemsResponse);

  const menuList = apiMenuItems.length > 0
    ? apiMenuItems
    : (Array.isArray(siteData.menuitems) ? siteData.menuitems : []);
  const finalMenuItems = buildMenuHierarchy(menuList);

  const siteLogoFromDb = (dbLogoSetting && typeof dbLogoSetting === "object" && dbLogoSetting.logoUrl)
    ? dbLogoSetting
    : (siteData.site_logo || (siteData.home?.[0]?.identity as any)?.site_logo);

  const homeList = Array.isArray(siteData.home) ? siteData.home : [];
  const updatedHome = homeList.map((item, idx) => {
    if (idx === 0 && siteLogoFromDb) {
      const currentIdentity = (item.identity as Record<string, unknown>) || {};
      const currentHeader = (currentIdentity.header as Record<string, unknown>) || {};
      const currentFooter = (currentIdentity.footer as Record<string, unknown>) || {};
      return {
        ...item,
        identity: {
          ...currentIdentity,
          header: {
            ...currentHeader,
            ...(siteLogoFromDb.logoUrl ? { logoUrl: siteLogoFromDb.logoUrl } : {}),
            ...(siteLogoFromDb.logoText ? { logoText: siteLogoFromDb.logoText } : {}),
            ...(siteLogoFromDb.logoSubText ? { logoSubText: siteLogoFromDb.logoSubText } : {}),
          },
          footer: {
            ...currentFooter,
            ...(siteLogoFromDb.logoUrl ? { logoUrl: siteLogoFromDb.logoUrl } : {}),
            ...(siteLogoFromDb.logoText ? { logoText: siteLogoFromDb.logoText } : {}),
            ...(siteLogoFromDb.logoSubText ? { logoSubText: siteLogoFromDb.logoSubText } : {}),
          },
          site_logo: siteLogoFromDb,
        },
      };
    }
    return item;
  });

  return {
    ...siteData,
    backendConnected: true,
    developer: (siteData.developer as DeveloperSetting) || {
      name: "EZ Softech",
      url: "https://ezsoftapp.in",
      label: "Crafted by",
      showBackendStatus: true,
    },
    site_logo: siteLogoFromDb || siteData.site_logo,
    home: updatedHome,
    news: apiNews,
    galleryItems: apiGallery,
    reviewsItems: apiReviews,
    menuItems: finalMenuItems,
    menuitems: menuList as SiteRecord[],
  };
}

export function homeData(siteData: SiteData): SiteRecord {
  return siteData.home?.[0] ?? {};
}

export function firstSection(home: SiteRecord, key: string): SiteRecord {
  const section = home[key];
  return Array.isArray(section) ? ((section[0] as SiteRecord) ?? {}) : {};
}

export function sectionItems(home: SiteRecord, key: string): SiteRecord[] {
  const section = home[key];
  return Array.isArray(section) ? (section as SiteRecord[]) : [];
}

export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function isBannerLogoUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase().trim();
  return lower.includes("ipslogo") || lower.includes("bannerlogo") || lower.includes("banner_logo") || lower.includes("banner");
}

export function imageUrl(value: unknown): string {
  if (typeof value === "string") {
    let url = value.trim();
    if (!url) return "";
    if (
      url === "/assets/Logos/IPSLOGO.png" ||
      url === "/assets/IPSLOGO.png" ||
      url === "assets/Logos/IPSLOGO.png" ||
      url.includes("file_dzw3mb.png") ||
      url.includes("BannerLogo.png")
    ) {
      url = DEFAULT_LOGO;
    }
    return getAssetUrl(url);
  }
  if (Array.isArray(value)) {
    const found = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
    return found ? imageUrl(found) : "";
  }
  return "";
}

export function processHtmlAssetUrls(html?: string | null): string {
  if (!html || typeof html !== "string") return "";

  let processed = html.replace(
    /\bsrc=["']([^"']+)["']/gi,
    (match, path) => {
      const cleanPath = (path || "").trim();
      if (!cleanPath) return match;
      if (cleanPath.includes("cloudinary.com")) {
        const fullUrl = imageUrl(cleanPath);
        return `src="${fullUrl}"`;
      }
      if (
        cleanPath.startsWith("http://") ||
        cleanPath.startsWith("https://") ||
        cleanPath.startsWith("data:") ||
        cleanPath.startsWith("blob:") ||
        cleanPath.startsWith("javascript:") ||
        cleanPath.startsWith("/api/") ||
        cleanPath.startsWith("api/")
      ) {
        return match;
      }
      const fullUrl = imageUrl(cleanPath);
      return `src="${fullUrl}"`;
    }
  );

  processed = processed.replace(
    /\bhref=["']([^"']+)["']/gi,
    (match, path) => {
      const cleanPath = (path || "").trim();
      if (!cleanPath) return match;
      if (cleanPath.includes("cloudinary.com")) {
        const fullUrl = imageUrl(cleanPath);
        return `href="${fullUrl}"`;
      }
      if (
        cleanPath.startsWith("http://") ||
        cleanPath.startsWith("https://") ||
        cleanPath.startsWith("data:") ||
        cleanPath.startsWith("blob:") ||
        cleanPath.startsWith("#") ||
        cleanPath.startsWith("mailto:") ||
        cleanPath.startsWith("tel:") ||
        cleanPath.startsWith("javascript:") ||
        cleanPath.startsWith("/api/") ||
        cleanPath.startsWith("api/")
      ) {
        return match;
      }
      const lower = cleanPath.toLowerCase();
      const isMediaLink =
        /\.(jpg|jpeg|png|webp|svg|gif|avif|mp4|webm|pdf|doc|docx|xls|xlsx|zip)($|\?|#)/i.test(lower) ||
        lower.includes("/assets/") ||
        lower.includes("/uploads/") ||
        lower.includes("/album/") ||
        lower.includes("/documents/");

      if (isMediaLink) {
        const fullUrl = imageUrl(cleanPath);
        return `href="${fullUrl}"`;
      }
      return match;
    }
  );

  // Replace known offline domain broken assets
  processed = processed.replace(
    /\bsrc=["']https?:\/\/(?:www\.)?indianpublicschool\.in\/admin\/uploads\/images\/1633327180270chairmain[^"']*["']/gi,
    'src="/assets/Settings/Home/Chairman.jpeg"'
  );
  processed = processed.replace(
    /\bsrc=["']https?:\/\/(?:www\.)?indianpublicschool\.in\/admin\/uploads\/images\/1632135409542director[^"']*["']/gi,
    'src="/assets/Settings/Home/Director.jpeg"'
  );
  processed = processed.replace(
    /\bsrc=["']https?:\/\/(?:www\.)?indianpublicschool\.in\/admin\/uploads\/images\/1633335421791download[^"']*["']/gi,
    'src="/assets/Settings/Home/hero-campus.png"'
  );
  processed = processed.replace(
    /\bhref=["']https?:\/\/(?:www\.)?indianpublicschool\.in\/index\.php\/Home\/blog_details\/[^"']*["']/gi,
    'href="/campus/connectivity/blog"'
  );

  // Clean inspect-element and browser-specific artifacts that break styling
  processed = processed.replace(/scrollbar-color:\s*[^;]+;?/gi, "");
  processed = processed.replace(/scrollbar-width:\s*[^;]+;?/gi, "");
  processed = processed.replace(/border:\s*0px solid oklch\([^)]+\);?/gi, "");
  processed = processed.replace(/color:\s*lab\([^)]+\)\s*rgba\([^)]+\);?/gi, "");

  // Normalize non-standard oklch colors on container elements
  processed = processed.replace(/background-color:\s*oklch\([^)]+\);?/gi, "");
  processed = processed.replace(/color:\s*oklch\(0\.21[^)]+\);?/gi, "");

  // Fix ips-principal-teachers conflicting light gradient with white text
  processed = processed.replace(
    /(class=["'][^"']*ips-principal-teachers[^"']*["'][^>]*style=["'][^"']*)color:\s*rgb\(255,\s*255,\s*255\)\s*!important;?\s*/gi,
    "$1"
  );
  processed = processed.replace(
    /(class=["'][^"']*ips-principal-teachers[^"']*["'][^>]*style=["'][^"']*)background-color:\s*rgb\(16,\s*42,\s*76\)\s*!important;?\s*/gi,
    "$1"
  );

  // Strip hardcoded fixed root wrapper backgrounds that cause white-on-white text in dark mode
  processed = processed.replace(
    /(class=["'][^"']*(?:wysiwyg-page-wrapper|ips-principal-content|ips-chairman-page|ips-director-content)[^"']*["'][^>]*style=["'][^"']*)background(?:-color)?:\s*(?:#ffffff|rgb\(255,\s*255,\s*255\)|white|#f8fafc);?/gi,
    "$1"
  );

  // Normalize ips-principal rigid inline paddings, min-widths, and empty blurs that cause mobile blowout
  if (processed.includes("ips-principal")) {
    processed = processed
      .replace(/width:\s*min\(1100px,\s*100%\s*-\s*40px\);?/gi, "width: 100%; box-sizing: border-box;")
      .replace(/padding:\s*65px\s+0px\s+85px;?/gi, "padding: 0;")
      .replace(/max-width:\s*980px;?/gi, "max-width: 100%;")
      .replace(/padding:\s*2\.5rem;?/gi, "padding: 1.5rem 1.25rem; box-sizing: border-box; width: 100%;")
      .replace(/<div\s+class=["']ips-chairman-bg\s+ips-chairman-bg-left["']><\/div>/gi, "")
      .replace(/(class=["'][^"']*ips-principal-layout[^"']*["'][^>]*style=["'][^"']*)height:\s*[\d.]+px;?\s*/gi, "$1")
      .replace(/(class=["'][^"']*ips-principal-layout[^"']*["'][^>]*style=["'][^"']*)width:\s*[\d.]+px;?\s*/gi, "$1")
      .replace(/(class=["'][^"']*ips-principal-right[^"']*["'][^>]*style=["'][^"']*)float:\s*[^;]+;?\s*/gi, "$1")
      .replace(/(class=["'][^"']*ips-principal-right[^"']*["'][^>]*style=["'][^"']*)display:\s*inline-block;?\s*/gi, "$1")
      .replace(/(class=["'][^"']*ips-principal-right[^"']*["'][^>]*style=["'][^"']*)margin:\s*[^;]+;?\s*/gi, "$1");

    // Automatically heal and group loose content after profile into a structured right column
    if (processed.includes("</aside>") && !processed.includes("ips-principal-right")) {
      const asideCloseIdx = processed.indexOf("</aside>");
      if (asideCloseIdx !== -1) {
        const beforeAside = processed.slice(0, asideCloseIdx + 8);
        const afterAside = processed.slice(asideCloseIdx + 8);
        const layoutCloseIdx = afterAside.lastIndexOf("</div>");
        if (layoutCloseIdx !== -1) {
          const contentToWrap = afterAside.slice(0, layoutCloseIdx).trim();
          const closingTags = afterAside.slice(layoutCloseIdx);
          processed = `${beforeAside}\n    <div class="ips-principal-right">\n${contentToWrap}\n    </div>\n${closingTags}`;
        }
      }
    }
  }

  // =========================================================
  // UNIVERSAL DYNAMIC TABLE PROCESSOR
  // Works on ANY table copied from WordPad, Word, Web, or CMS
  // =========================================================
  if (processed.includes("<table")) {
    processed = processed.replace(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi, (tableMatch, tableAttrs, tableInner) => {
      // 1. Strip rigid pixel width and min-width styles from table
      let cleanAttrs = tableAttrs.replace(/style=["']([^"']*)["']/i, (_: string, styleContent: string) => {
        const cleanedStyle = styleContent
          .replace(/width:\s*[\d.]+px;?/gi, "width: 100%;")
          .replace(/min-width:\s*[\d.]+px;?/gi, "min-width: 0;")
          .replace(/text-align:\s*center;?/gi, "text-align: left;");
        return `style="${cleanedStyle}"`;
      });

      // 2. Extract column headers from thead or first tr
      const headerMatches: string[] = [];
      const theadMatch = tableInner.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i);
      const headerSource = theadMatch ? theadMatch[1] : (tableInner.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1] || "");

      const thRegex = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
      let thMatch: RegExpExecArray | null;
      while ((thMatch = thRegex.exec(headerSource)) !== null) {
        const cleanHeader = (thMatch[1] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        headerMatches.push(cleanHeader);
      }

      // If no th found, check if first row has td as headers
      if (headerMatches.length === 0 && !theadMatch) {
        const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch: RegExpExecArray | null;
        while ((tdMatch = tdRegex.exec(headerSource)) !== null) {
          const cleanHeader = (tdMatch[1] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          headerMatches.push(cleanHeader);
        }
      }

      // 3. Attach data-label attributes and clean rigid inline colors from all tbody cells for dynamic card rendering
      let enhancedInner = tableInner.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi, (rowMatch: string, rowAttrs: string, rowInner: string) => {
        // Skip if this is the header row inside thead
        if (theadMatch && tableInner.indexOf(rowMatch) < (theadMatch.index || 0) + theadMatch[0].length && tableInner.indexOf(rowMatch) >= (theadMatch.index || 0)) {
          return rowMatch;
        }

        let cellIndex = 0;
        const enhancedCells = rowInner.replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi, (cellMatch: string, cellAttrs: string, cellContent: string) => {
          const isFirstCell = cellIndex === 0;
          const label = headerMatches[cellIndex] || `Item ${cellIndex + 1}`;
          cellIndex++;

          // Clean rigid inline color and background-color so mobile card header and zebra themes render with proper contrast
          let cleanCellAttrs = cellAttrs.replace(/style=["']([^"']*)["']/i, (_: string, styleContent: string) => {
            let cleaned = styleContent
              .replace(/\b(?:background-color|background|color)\s*:\s*[^;]+;?/gi, "")
              .replace(/;\s*;/g, ";")
              .trim();
            return `style="${cleaned}"`;
          });

          if (isFirstCell) {
            const cleanHeaderContent = cellContent
              .replace(/\bcolor:\s*[^;"]+;?/gi, "")
              .replace(/<font\b[^>]*color=["'][^"']*["']/gi, "<font");
            let mergedAttrs = cleanCellAttrs;
            if (/class=["']([^"']*)["']/i.test(mergedAttrs)) {
              mergedAttrs = mergedAttrs.replace(/class=["']([^"']*)["']/i, 'class="$1 ips-table-card-header"');
            } else {
              mergedAttrs = `class="ips-table-card-header" ${mergedAttrs}`;
            }
            return `<td ${mergedAttrs}>${cleanHeaderContent}</td>`;
          }
          if (!cleanCellAttrs.includes("data-label=")) {
            return `<td data-label="${label.replace(/"/g, '&quot;')}" ${cleanCellAttrs}>${cellContent}</td>`;
          }
          return `<td ${cleanCellAttrs}>${cellContent}</td>`;
        });

        return `<tr${rowAttrs}>${enhancedCells}</tr>`;
      });

      return `<div class="ips-table-responsive-wrapper overflow-x-auto w-full my-4"><table${cleanAttrs}>${enhancedInner}</table></div>`;
    });
  }

  // Scoped layout adjustments for legacy HTML
  if (processed.includes("ips-chairman")) {
    processed = processed
      .replace(
        /\.ips-chairman-layout\s*\{\s*grid-template-columns:\s*1fr;/g,
        `.ips-chairman-layout {\n    display: flex;\n    flex-direction: column;\n    grid-template-columns: 1fr;`
      )
      .replace(
        /\.ips-chairman-profile-wrapper\s*\{\s*position:\s*relative;\s*top:\s*auto;\s*\}/g,
        `.ips-chairman-profile-wrapper {\n    position: relative;\n    top: auto;\n    grid-column: auto;\n    grid-row: auto;\n    order: 1;\n  }\n\n  .ips-chairman-message {\n    grid-column: auto;\n    grid-row: auto;\n    order: 2;\n  }`
      );
  }

  if (processed.includes("ips-director")) {
    processed = processed
      .replace(
        /\.ips-director-layout\s*\{\s*grid-template-columns:\s*1fr;/g,
        `.ips-director-layout {\n    display: flex;\n    flex-direction: column;\n    grid-template-columns: 1fr;`
      )
      .replace(
        /\.ips-director-profile-wrapper\s*\{\s*position:\s*relative;\s*top:\s*auto;\s*\}/g,
        `.ips-director-profile-wrapper {\n    position: relative;\n    top: auto;\n    grid-column: auto;\n    grid-row: auto;\n    order: 1;\n  }\n\n  .ips-director-message {\n    grid-column: auto;\n    grid-row: auto;\n    order: 2;\n  }`
      );
  }

  // Chairman & Director Closing Cards & Name Cards High-Contrast
  processed = processed.replace(
    /class=["']([^"']*(?:ips-chairman-closing|ips-director-closing|ips-chairman-name-card|ips-director-name-card|ips-principal-name-card)[^"']*)["']/gi,
    (match, existingClasses) => {
      if (existingClasses.includes("not-prose")) return match;
      return `class="${existingClasses} not-prose"`;
    }
  );

  // Strip dark inline colors and ensure pure white text inside dark closing cards and name cards
  processed = processed.replace(
    /(<div\b[^>]*class=["'][^"']*(?:ips-chairman-closing|ips-director-closing|ips-chairman-name-card|ips-director-name-card|ips-principal-name-card)[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/gi,
    (match, openTag, innerHtml, closeTag) => {
      let clean = innerHtml
        .replace(/\bcolor:\s*(?:#1e293b|#334155|#0f172a|rgb\(30,\s*41,\s*59\)|rgb\(51,\s*65,\s*85\)|rgba?\(0,\s*0,\s*0[^)]*\)|#000000|#000|black);?/gi, "color: #ffffff;")
        .replace(/\bopacity:\s*0\.\d+;?/gi, "opacity: 1;")
        .replace(/<font\b[^>]*color=["'](?:#1e293b|#334155|#000|black)["'][^>]*>/gi, '<font color="#ffffff">');
      return `${openTag}${clean}${closeTag}`;
    }
  );

  // Strip dark colors inside sections or blocks with blue/navy background
  processed = processed.replace(
    /(<(?:section|div)\b[^>]*style=["'][^"']*(?:#102a4c|#082a52|#123b70|rgb\(8,\s*42,\s*82\)|rgb\(16,\s*42,\s*76\)|rgb\(13,\s*50,\s*96\))[^"']*["'][^>]*>)([\s\S]*?)(<\/(?:section|div)>)/gi,
    (match, openTag, innerHtml, closeTag) => {
      let clean = innerHtml
        .replace(/\bcolor:\s*(?:#1e293b|#334155|#0f172a|rgb\(30,\s*41,\s*59\)|rgb\(51,\s*65,\s*85\)|rgba?\(0,\s*0,\s*0[^)]*\)|#000000|#000|black);?/gi, "color: #ffffff;")
        .replace(/<font\b[^>]*color=["'](?:#1e293b|#334155|#000|black)["'][^>]*>/gi, '<font color="#ffffff">');
      return `${openTag}${clean}${closeTag}`;
    }
  );

  processed = processed.replace(
    /<p([^>]*class=["'][^"']*(?:ips-chairman-closing-sub|ips-director-closing-sub)[^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      let cleanAttrs = attrs
        .replace(/\bcolor:\s*[^;"]+;?/gi, "")
        .replace(/\bopacity:\s*[^;"]+;?/gi, "");
      if (cleanAttrs.includes("style=")) {
        return `<p${cleanAttrs.replace(/style=["']([^"']*)["']/i, 'style="$1; color: #ffffff !important; opacity: 1 !important;"')}>`;
      }
      return `<p${cleanAttrs} style="color: #ffffff !important; opacity: 1 !important;">`;
    }
  );

  processed = processed.replace(
    /<p([^>]*class=["'][^"']*(?:ips-chairman-closing-main|ips-director-closing-main)[^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      let cleanAttrs = attrs
        .replace(/\bcolor:\s*[^;"]+;?/gi, "")
        .replace(/\bopacity:\s*[^;"]+;?/gi, "");
      if (cleanAttrs.includes("style=")) {
        return `<p${cleanAttrs.replace(/style=["']([^"']*)["']/i, 'style="$1; color: #ffffff !important; opacity: 1 !important;"')}>`;
      }
      return `<p${cleanAttrs} style="color: #ffffff !important; opacity: 1 !important;">`;
    }
  );

  processed = processed.replace(
    /(\.ips-(?:chairman|director)-closing-sub\s*\{[^}]*?color:\s*)[^;}]+(;|\s*\})/gi,
    `$1#ffffff !important$2`
  );
  processed = processed.replace(
    /(\.ips-(?:chairman|director)-closing-main\s*\{[^}]*?color:\s*)[^;}]+(;|\s*\})/gi,
    `$1#ffffff !important$2`
  );

  if (processed.includes("ips-principal")) {
    processed = processed.replace(
      /(class=["'][^"']*ips-principal-content[^"']*["'][^>]*style=["'][^"']*)padding:\s*65px\s+0px\s+85px;?/gi,
      `$1padding: 0;`
    );
    processed = processed.replace(
      /(class=["'][^"']*ips-principal-content[^"']*["'][^>]*style=["'][^"']*)background-color:\s*[^;"]+;?/gi,
      `$1background-color: transparent;`
    );
    processed = processed.replace(
      /(class=["'][^"']*ips-principal-teachers[^"']*["'][^>]*style=["'][^"']*background-color:\s*rgb\(16,\s*42,\s*76\)[^"']*["'][\s\S]*?<h2[^>]*style=["'][^"']*)color:\s*rgb\(8,\s*42,\s*82\);?/gi,
      `$1color: #ffffff;`
    );
    processed = processed.replace(
      /(class=["'][^"']*ips-principal-teachers[^"']*["'][^>]*style=["'][^"']*background-color:\s*rgb\(16,\s*42,\s*76\)[^"']*["'][\s\S]*?<p[^>]*style=["'][^"']*)color:\s*rgb\(102,\s*112,\s*133\);?/gi,
      `$1color: #e2e8f0;`
    );
  }

  return processed;
}

export function imageUrls(record: SiteRecord): string[] {
  const value = record.fileUrls ?? record.fileUrl;
  if (!Array.isArray(value)) {
    const single = imageUrl(value);
    return single ? [single] : [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => imageUrl(item))
    .filter((url): url is string => Boolean(url));
}

export interface OfficeTimingItem {
  days: string;
  hours: string;
}

export function getOfficeTimingsList(
  contactData: Record<string, unknown> | undefined,
  footerConfig: Record<string, unknown> | undefined
): OfficeTimingItem[] {
  const office = (contactData?.["office-timings"] as Record<string, unknown>) ?? {};
  const entries = Object.entries(office).filter(
    ([_, v]) => typeof v === "string" && (v as string).trim() !== ""
  );

  if (entries.length > 0) {
    return entries.map(([days, hours]) => ({ days, hours: String(hours) }));
  }

  const footerHours = typeof footerConfig?.officeHours === "string" ? footerConfig.officeHours.trim() : "";
  if (footerHours) {
    if (footerHours.includes("|")) {
      return footerHours.split("|").map((part) => {
        const [d, h] = part.split(":");
        return { days: d?.trim() || "Hours", hours: h?.trim() || part.trim() };
      });
    }
    return [{ days: "Office Hours", hours: footerHours }];
  }

  return [
    { days: "Monday-Friday", hours: "7:30 AM - 5:00 PM" },
    { days: "Saturday", hours: "9:00 AM - 1:00 PM" },
    { days: "Sunday", hours: "8:00 AM - 2:00 PM" },
  ];
}

export const DEFAULT_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3712.3925860272975!2d83.9512879!3d21.4923374!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a211639e7ebccc3%3A0x3c5638a16fbf6b23!2sIndian%20Public%20School%2C%20Sambalpur!5e0!3m2!1sen!2sin!4v1793179521051!5m2!1sen!2sin";

export const DEFAULT_MAP_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Indian+Public+School,+Sambalpur";

export function getMapDirectionsUrl(contactData?: Record<string, unknown> | null): string {
  if (!contactData) return DEFAULT_MAP_DIRECTIONS_URL;
  const rawLink = text(contactData["google-map-link"]).trim();

  // If link is empty, or points to the known invalid/broken CID or stale place data
  if (
    !rawLink ||
    rawLink.includes("4347716949010217763") ||
    rawLink.includes("place//") ||
    rawLink.includes("0x3a211639e7ebccc3")
  ) {
    return DEFAULT_MAP_DIRECTIONS_URL;
  }

  return formatHref(rawLink, DEFAULT_MAP_DIRECTIONS_URL);
}

export function getMapEmbedUrl(contactData?: Record<string, unknown> | null): string {
  if (!contactData) return DEFAULT_MAP_EMBED_URL;
  const embedMarkup = text(contactData["google-map-embed-link"]).trim();
  const configuredEmbedUrl =
    embedMarkup.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1] ||
    (embedMarkup.startsWith("http://") || embedMarkup.startsWith("https://") ? embedMarkup : "");

  // If a valid custom embed URL is present and not the old broken bounding box
  if (configuredEmbedUrl && !configuredEmbedUrl.includes("!5e1!")) {
    return configuredEmbedUrl;
  }

  // Fallback to coordinates if customized and not the old incorrect coords
  const mapCoordinates = (contactData.map as Record<string, unknown>) ?? {};
  const latitude = text(mapCoordinates.latitude).match(/-?\d+(?:\.\d+)?/)?.[0];
  const longitude = text(mapCoordinates.longitude).match(/-?\d+(?:\.\d+)?/)?.[0];

  if (latitude && longitude && latitude !== "21.4653" && longitude !== "83.9757") {
    // If it points to the Sambalpur campus coordinates, return the verified Place embed URL
    if (latitude.startsWith("21.49") && longitude.startsWith("83.95")) {
      return DEFAULT_MAP_EMBED_URL;
    }
    return `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  }

  return DEFAULT_MAP_EMBED_URL;
}

export function getWhatsAppConfig(siteData?: SiteData | null): Required<WhatsAppSetting> {
  const home = siteData?.home?.[0] as SiteRecord | undefined;
  const identityObj = (home?.identity as SiteRecord | undefined) ?? {};
  const wa = (identityObj?.whatsapp as WhatsAppSetting | undefined) ?? (siteData?.whatsapp as WhatsAppSetting | undefined) ?? {};

  const phone = text(wa.phone) || "+91 97351 81684";
  const enabled = wa.enabled !== false;
  const agentName = text(wa.agentName) || "IPS Admissions & Support";
  const agentRole = text(wa.agentRole) || "Official Helpdesk";
  const welcomeMessage = text(wa.welcomeMessage) || "Hello! Welcome to Indian Public School. How can we assist you with admissions or campus details today?";
  const presetMessages = Array.isArray(wa.presetMessages) && wa.presetMessages.length > 0
    ? wa.presetMessages.map((m) => String(m))
    : ["Admission Inquiry", "Fee Structure", "Schedule Campus Visit", "General Query"];
  const position = wa.position === "bottom-right" ? "bottom-right" : "bottom-left";

  return {
    enabled,
    phone,
    agentName,
    agentRole,
    welcomeMessage,
    presetMessages,
    position,
  };
}

export function getPopupBannerConfig(siteData?: SiteData | null): Required<PopupBannerSetting> {
  const home = siteData?.home?.[0] as SiteRecord | undefined;
  const identityObj = (home?.identity as SiteRecord | undefined) ?? {};
  const pb = {
    ...((siteData?.popupBanner as PopupBannerSetting | undefined) ?? {}),
    ...((identityObj?.popupBanner as PopupBannerSetting | undefined) ?? {}),
  };

  const enabled = pb.enabled !== false;
  const delaySeconds = typeof pb.delaySeconds === "number" ? pb.delaySeconds : (Number(pb.delaySeconds) || 1);
  let rawImageUrl = pb.imageUrl !== undefined && text(pb.imageUrl).trim() !== "" ? text(pb.imageUrl).trim() : "/assets/Settings/Home/Banner_1.jpg";
  if (rawImageUrl.includes("Banner_8") || !rawImageUrl.trim()) {
    rawImageUrl = "/assets/Settings/Home/Banner_1.jpg";
  }
  const resolvedImageUrl = imageUrl(rawImageUrl) || getAssetUrl(rawImageUrl) || rawImageUrl || "/assets/Settings/Home/Banner_1.jpg";
  const showTitle = pb.showTitle !== false;
  const rawTitle = pb.title !== undefined ? text(pb.title).trim() : "";
  const title = showTitle ? (rawTitle !== "" ? rawTitle : "Enquiry") : "";
  const subtitle = text(pb.subtitle).trim();
  const enquiryButtonText = text(pb.enquiryButtonText) || "Enquiry Now";
  const closeButtonText = text(pb.closeButtonText) || "Close";
  const onlyOncePerSession = pb.onlyOncePerSession === true;
  const modalWidth = (["sm", "md", "lg", "xl", "full", "custom"].includes(pb.modalWidth || "") ? pb.modalWidth : "lg") as "sm" | "md" | "lg" | "xl" | "full" | "custom";
  const imageWidth = typeof pb.imageWidth === "number" ? pb.imageWidth : (Number(pb.imageWidth) || 600);
  const imageMaxHeight = typeof pb.imageMaxHeight === "number" ? pb.imageMaxHeight : (Number(pb.imageMaxHeight) || 400);
  const imageFit = (pb.imageFit === "contain" || pb.imageFit === "fill") ? pb.imageFit : "cover";
  const imagePosition = (pb.imagePosition === "top" || pb.imagePosition === "bottom") ? pb.imagePosition : "center";
  const aspectRatio = (["16/9", "16/10", "4/3", "1/1", "3/2", "2/1"].includes(pb.aspectRatio || "") ? pb.aspectRatio : "16/10") as "auto" | "16/9" | "16/10" | "4/3" | "1/1" | "3/2" | "2/1";
  let rawStyle: string = pb.bannerStyle || "concept1";
  if (rawStyle === "concept5") rawStyle = "concept3";
  if (rawStyle === "concept6") rawStyle = "concept4";
  const bannerStyle = (["card", "full-bleed", "side-by-side", "concept1", "concept2", "concept3", "concept4"].includes(rawStyle) ? rawStyle : "concept1") as "card" | "full-bleed" | "side-by-side" | "concept1" | "concept2" | "concept3" | "concept4";
  const showInlineForm = pb.showInlineForm === true || bannerStyle === "concept3";
  const imageBorderRadius = typeof pb.imageBorderRadius === "number" ? pb.imageBorderRadius : (Number(pb.imageBorderRadius) || 24);
  const showImageZoomOnClick = pb.showImageZoomOnClick !== false;

  return {
    enabled,
    delaySeconds,
    imageUrl: resolvedImageUrl,
    showTitle,
    title,
    subtitle,
    enquiryButtonText,
    closeButtonText,
    onlyOncePerSession,
    modalWidth,
    imageWidth,
    imageMaxHeight,
    imageFit,
    imagePosition,
    aspectRatio,
    bannerStyle,
    showInlineForm,
    imageBorderRadius,
    showImageZoomOnClick,
  };
}

/**
 * Builds a complete self-contained HTML document for device preview frames (Mobile 390px, Tablet 768px, Desktop).
 * Rendering inside an iframe allows CSS @media queries to trigger authentically.
 */
export function buildPagePreviewDoc(htmlContent?: string | null): string {
  const content = processHtmlAssetUrls(htmlContent || "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    body {
      padding: 0;
    }
    img, video, iframe {
      max-width: 100%;
      height: auto;
    }
    a {
      color: #1a5d9c;
      text-decoration: underline;
    }

    /* Desktop Layout: Ensure sticky profile pins beside speech so left column is NEVER blank */
    @media (min-width: 1025px) {
      .ips-chairman-page,
      .ips-director-page,
      .ips-principal-page,
      .ips-principal-content,
      .wysiwyg-page-wrapper {
        overflow: visible !important;
      }
      .ips-chairman-layout,
      .ips-director-layout,
      .ips-principal-layout {
        display: grid !important;
        grid-template-columns: 360px minmax(0, 1fr) !important;
        gap: 40px !important;
        align-items: start !important;
        height: auto !important;
        min-height: 0 !important;
      }
      .ips-chairman-profile-wrapper,
      .ips-director-profile-wrapper,
      .ips-principal-profile-wrapper,
      .ips-principal-profile {
        grid-column: 1 !important;
        grid-row: 1 !important;
        position: sticky !important;
        top: 90px !important;
        align-self: start !important;
        z-index: 10 !important;
        max-width: 360px !important;
        width: 100% !important;
        margin: 0 !important;
      }
      .ips-chairman-message,
      .ips-director-message,
      .ips-principal-main,
      .ips-principal-right {
        grid-column: 2 !important;
        grid-row: 1 !important;
        min-width: 0 !important;
        width: 100% !important;
        float: none !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 1.25rem !important;
      }
      .ips-principal-right > * {
        margin: 0 !important;
      }
      .ips-principal-layout > :not(.ips-principal-profile):not(.ips-principal-profile-wrapper):not(.ips-principal-feature):not(.ips-principal-features-full) {
        grid-column: 2 !important;
      }
      .ips-principal-layout > .ips-principal-feature,
      .ips-principal-layout > .ips-principal-features-full,
      .ips-principal-feature {
        grid-column: 1 / -1 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    }

    /* Mobile & Tablet Layout Stacking (Prevents empty 2nd column / blank preview) */
    @media (max-width: 1024px) {
      .ips-chairman-layout,
      .ips-director-layout,
      .ips-principal-layout {
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
        width: 100% !important;
      }
      .ips-chairman-profile-wrapper,
      .ips-director-profile-wrapper,
      .ips-principal-profile-wrapper,
      .ips-principal-profile {
        order: 1 !important;
        position: static !important;
        width: 100% !important;
        max-width: 380px !important;
        margin: 0 auto !important;
        grid-column: auto !important;
        grid-row: auto !important;
      }
      .ips-chairman-message,
      .ips-director-message,
      .ips-principal-main {
        order: 2 !important;
        width: 100% !important;
        grid-column: auto !important;
        grid-row: auto !important;
      }
      .ips-principal-pillars {
        grid-template-columns: 1fr !important;
      }
      .ips-chairman-container,
      .ips-director-container,
      .ips-principal-container {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    }

    /* Profile Card Shared Components (Chairman, Director, Principal) */
    .ips-chairman-profile,
    .ips-director-profile,
    .ips-principal-profile {
      position: relative !important;
      max-width: 380px !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
    }

    .ips-chairman-profile-decoration,
    .ips-director-profile-decoration,
    .ips-principal-profile-decoration {
      position: absolute !important;
      width: 100px !important;
      height: 100px !important;
      left: -12px !important;
      top: -12px !important;
      border-top: 4px solid var(--gold, #F4C430) !important;
      border-left: 4px solid var(--gold, #F4C430) !important;
      border-radius: 28px 0 0 0 !important;
      pointer-events: none !important;
      z-index: 1 !important;
    }

    .ips-chairman-image-box,
    .ips-director-image-box,
    .ips-principal-image-box {
      position: relative !important;
      z-index: 2 !important;
      overflow: hidden !important;
      padding: 16px !important;
      border: 1px solid #e4eaf2 !important;
      border-radius: 28px !important;
      background: #ffffff !important;
      box-shadow: 0 14px 40px rgba(8, 42, 82, 0.1) !important;
      box-sizing: border-box !important;
    }

    .ips-chairman-image-box img,
    .ips-director-image-box img,
    .ips-principal-image-box img,
    .ips-principal-image {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      max-height: 400px !important;
      aspect-ratio: 3/4 !important;
      object-fit: cover !important;
      border-radius: 20px !important;
      margin: 0 !important;
      box-shadow: none !important;
    }

    .ips-chairman-name-card,
    .ips-director-name-card,
    .ips-principal-name-card {
      position: relative !important;
      z-index: 4 !important;
      margin: -32px 18px 0 !important;
      padding: 22px 18px !important;
      border-radius: 19px !important;
      background: linear-gradient(135deg, #082A52, #123B70) !important;
      text-align: center !important;
      box-shadow: 0 14px 30px rgba(8, 42, 82, 0.22) !important;
      color: #ffffff !important;
      box-sizing: border-box !important;
    }

    .ips-chairman-name-card h2,
    .ips-director-name-card h2,
    .ips-principal-name-card h2 {
      margin: 0 !important;
      color: #ffffff !important;
      font-size: 20px !important;
      font-weight: 800 !important;
      letter-spacing: -0.2px !important;
    }

    .ips-chairman-name-line,
    .ips-director-name-line,
    .ips-principal-name-line {
      width: 44px !important;
      height: 3px !important;
      margin: 10px auto !important;
      border-radius: 10px !important;
      background: var(--gold, #F4C430) !important;
    }

    .ips-chairman-designation,
    .ips-director-designation,
    .ips-principal-designation {
      margin: 6px 0 0 !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.8px !important;
    }

    .ips-chairman-school,
    .ips-director-school,
    .ips-principal-school {
      margin: 5px 0 0 !important;
      color: #ffffff !important;
      font-size: 13px !important;
      font-weight: 500 !important;
    }

    .ips-chairman-mini-grid,
    .ips-director-mini-grid,
    .ips-principal-mini-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 10px !important;
      margin-top: 18px !important;
    }

    .ips-chairman-mini-card,
    .ips-director-mini-card,
    .ips-principal-mini-card {
      padding: 11px 6px !important;
      border: 1px solid #dce8f6 !important;
      border-radius: 14px !important;
      background: #ffffff !important;
      text-align: center !important;
      box-shadow: 0 5px 14px rgba(8, 42, 82, 0.05) !important;
    }

    .ips-chairman-mini-card span,
    .ips-director-mini-card span,
    .ips-principal-mini-card span {
      display: block !important;
      color: #082A52 !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }

    @media (max-width: 768px) {
      .ips-ap-main-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
      }
      .ips-ap-image-card img {
        max-height: 280px !important;
        width: 100% !important;
        object-fit: cover !important;
      }
      .ips-ap-flow-steps {
        grid-template-columns: 1fr !important;
        gap: 1.5rem !important;
      }
    }

    /* Blog: Consistent 16:9 aspect-ratio & card framing */
    .board-exam-blog {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      background: transparent !important;
    }
    .board-exam-blog .blog-banner {
      width: 100% !important;
      border-radius: 1.25rem !important;
      overflow: hidden !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
      margin: 0 0 2rem !important;
      background: #f1f5f9 !important;
      border: 1px solid #e2e8f0 !important;
    }
    .board-exam-blog .blog-banner img {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      aspect-ratio: 16 / 9 !important;
      max-height: 480px !important;
      object-fit: cover !important;
      object-position: center !important;
      border-radius: 1.25rem !important;
    }
    @media (max-width: 768px) {
      .board-exam-blog .blog-banner img {
        max-height: 240px !important;
        aspect-ratio: 16 / 9 !important;
        object-fit: cover !important;
      }
    }

    /* Principal Message layout normalization & blank space elimination */
    .ips-principal-content {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      background-color: transparent !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .ips-principal-container,
    .ips-principal-main {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    .ips-principal-content .ips-chairman-hero {
      padding: 0 !important;
      margin: 0 0 1.25rem 0 !important;
      background: transparent !important;
    }
    .ips-principal-content .ips-chairman-hero h1 {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
    }
    .ips-principal-content .ips-chairman-hero h1 section,
    .ips-principal-quote {
      margin: 0 0 1.5rem 0 !important;
      padding: 1.5rem 2rem !important;
      border-radius: 1.25rem !important;
      background: #102a4c !important;
      color: #ffffff !important;
      font-size: 1.15rem !important;
      font-style: italic !important;
      line-height: 1.7 !important;
      box-shadow: 0 8px 24px -4px rgba(16, 42, 76, 0.2) !important;
    }
    .ips-principal-quote,
    .ips-principal-quote * {
      color: #ffffff !important;
    }
    .ips-principal-pillar-icon {
      font-size: 2rem !important;
      margin-bottom: 0.75rem !important;
      line-height: 1 !important;
    }
    .ips-principal-welcome {
      margin-top: 1.25rem !important;
      padding: 1.5rem 1.75rem !important;
      border: 1px solid #dce7f5 !important;
      border-radius: 1.25rem !important;
      background: #ffffff !important;
      box-shadow: 0 4px 20px rgba(8, 42, 82, 0.05) !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .ips-principal-text {
      margin-top: 1.25rem !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .ips-principal-text p {
      margin-bottom: 0.85rem !important;
      line-height: 1.8 !important;
      color: #475569 !important;
    }
    .ips-principal-pillars {
      margin-top: 1.5rem !important;
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 1.25rem !important;
    }
    .ips-principal-pillar {
      padding: 1.5rem 1.25rem !important;
      border: 1px solid #dce6f2 !important;
      border-radius: 1.25rem !important;
      background: #ffffff !important;
      box-shadow: 0 4px 20px rgba(8, 42, 82, 0.05) !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .ips-principal-feature {
      margin-top: 1.25rem !important;
      padding: 1.5rem 1.75rem !important;
      border: 1px solid #dce6f2 !important;
      border-radius: 1.25rem !important;
      background: #ffffff !important;
      box-shadow: 0 4px 20px rgba(8, 42, 82, 0.05) !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .ips-chairman-content,
    .ips-director-content {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
    }
    .ips-chairman-container,
    .ips-director-container {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    .ips-chairman-closing,
    .ips-director-closing {
      width: 100% !important;
      max-width: 100% !important;
      margin: 2rem 0 0 !important;
      box-sizing: border-box !important;
    }
    @media (max-width: 768px) {
      .ips-principal-pillars {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
      }
    }

    /* Principal Message feature cards contrast in preview */
    .ips-principal-teachers {
      background-image: linear-gradient(135deg, #eef6ff, #f7fbff) !important;
      color: #1e293b !important;
    }
    .ips-principal-teachers h2 {
      color: #082a52 !important;
    }
    .ips-principal-teachers p {
      color: #475569 !important;
    }
    .ips-principal-students h2 {
      color: #082a52 !important;
    }
    .ips-principal-students p {
      color: #475569 !important;
    }

    /* Closing cards strictly on Chairman and Director messages */
    .ips-chairman-closing,
    .ips-chairman-closing *,
    .ips-director-closing,
    .ips-director-closing *,
    .ips-chairman-closing p,
    .ips-director-closing p,
    .ips-chairman-closing p *,
    .ips-director-closing p * {
      color: #ffffff !important;
    }

    .ips-chairman-closing-sub,
    .ips-chairman-closing-sub *,
    .ips-director-closing-sub,
    .ips-director-closing-sub *,
    .ips-chairman-closing p.ips-chairman-closing-sub,
    .ips-director-closing p.ips-director-closing-sub {
      color: #ffffff !important;
      opacity: 1 !important;
    }

    .ips-chairman-closing-main,
    .ips-director-closing-main {
      color: #ffffff !important;
    }

    .ips-chairman-closing,
    .ips-director-closing {
      width: 100% !important;
      max-width: 100% !important;
      margin: 2.5rem 0 0 !important;
      box-sizing: border-box !important;
    }

    /* Content styling: ensure blog and custom cards stay readable with dark text */
    .board-exam-blog,
    .board-exam-blog p,
    .board-exam-blog h1,
    .board-exam-blog h2,
    .board-exam-blog h3,
    .board-exam-blog h4,
    .board-exam-blog td,
    .wysiwyg-frame-card h3,
    .wysiwyg-frame-card h4,
    .wysiwyg-frame-card p,
    .wysiwyg-frame-bulk-collection h3,
    .wysiwyg-frame-bulk-collection h4,
    .wysiwyg-frame-bulk-collection p {
      color: #1e293b !important;
    }

    /* Desktop Table Presentation (> 768px) */
    @media (min-width: 769px) {
      table {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border-radius: 1rem !important;
        overflow: hidden !important;
        box-shadow: 0 4px 20px rgba(8, 42, 82, 0.06) !important;
        border: 1px solid #e2e8f0 !important;
        background-color: #ffffff !important;
        margin: 1.5rem 0 !important;
      }
      table thead th {
        background: #082a52 !important;
        background-color: #082a52 !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        font-size: 0.95rem !important;
        padding: 1rem 1.5rem !important;
        border: none !important;
        border-bottom: 2px solid #1a5d9c !important;
        text-align: left !important;
      }
      table tbody tr:nth-child(odd) td {
        background-color: #ffffff !important;
      }
      table tbody tr:nth-child(even) td {
        background-color: #f8fafc !important;
      }
      table tbody tr:hover td {
        background-color: #f1f5f9 !important;
      }
      table td {
        color: #1e293b !important;
        border: none !important;
        border-bottom: 1px solid #e2e8f0 !important;
        padding: 1.15rem 1.5rem !important;
        font-size: 0.95rem !important;
        line-height: 1.65 !important;
        text-align: left !important;
        vertical-align: top !important;
      }
      table tbody tr:last-child td {
        border-bottom: none !important;
      }
      table tbody tr td:first-child,
      table tbody tr td.ips-table-card-header,
      table tbody tr td:first-child *,
      table tbody tr td.ips-table-card-header * {
        color: #082a52 !important;
        font-weight: 800 !important;
        background: transparent !important;
      }
    }

    /* Universal Responsive Table Cards on viewports <= 768px */
    @media (max-width: 768px) {
      table {
        display: block !important;
        width: 100% !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 1rem 0 !important;
      }
      thead {
        display: none !important;
      }
      tbody {
        display: flex !important;
        flex-direction: column !important;
        gap: 1rem !important;
        width: 100% !important;
      }
      tr {
        display: flex !important;
        flex-direction: column !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 1rem !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
        overflow: hidden !important;
        padding: 0 !important;
      }
      td:first-child,
      td.ips-table-card-header,
      td:first-child *,
      td.ips-table-card-header * {
        display: flex !important;
        align-items: center !important;
        background: linear-gradient(135deg, #082a52 0%, #123b70 100%) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        padding: 0.75rem 1rem !important;
        border-bottom: 2px solid #f4c430 !important;
      }
      td:not(:first-child) {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.25rem !important;
        padding: 0.75rem 1rem !important;
        border-bottom: 1px dashed #e2e8f0 !important;
        font-size: 0.875rem !important;
        color: #334155 !important;
      }
      td:last-child {
        border-bottom: none !important;
      }
      td[data-label]:not(:first-child)::before {
        content: attr(data-label);
        display: block !important;
        font-size: 0.75rem !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: #1a5d9c !important;
        margin-bottom: 2px !important;
      }
    }
  </style>
</head>
<body class="dynamic-page-content">
  ${content}
</body>
</html>`;
}



