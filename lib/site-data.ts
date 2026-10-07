import { getOptionalApi, unwrapCollection, unwrapSetting, type ApiRecord, type PaginatedData } from "@/lib/api-client";
import { getAssetUrl, getCloudinaryRootFolder } from "@/lib/utils";
import fallbackSiteData from "@/public/cloud-datasource.json";

export const CLOUDINARY_ROOT_FOLDER = getCloudinaryRootFolder();
export const DEFAULT_HERO_IMAGE = "/assets/Settings/Home/Banner_1.jpg";
export const DEFAULT_LOGO = "/Settings/Logos/IPSLogo.png";
export const DEFAULT_SECONDARY_LOGO = "https://res.cloudinary.com/dnw7mgysa/image/upload/ips-education/assets/Settings/Logos/file_xpnvia.png";
export const DEFAULT_CREST_LOGO = "/Settings/Logos/IPSStandardLogo.png";
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
  bannerStyle?: "card" | "full-bleed" | "side-by-side";
  imageBorderRadius?: number;
  showImageZoomOnClick?: boolean;
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
  whatsapp?: WhatsAppSetting;
  popupBanner?: PopupBannerSetting;
  [key: string]: unknown;
}

export async function getSiteData(): Promise<SiteData> {
  const fallback = fallbackSiteData as SiteData;
  const rawFallbackMenuitems = Array.isArray(fallback.menuItems)
    ? fallback.menuItems
    : Array.isArray(fallback.menuitems)
      ? fallback.menuitems
      : [];
  const fallbackMenuitemsTree = buildMenuHierarchy(rawFallbackMenuitems as SiteRecord[]);

  const [siteResponse, logoSettingResponse, newsResponse, galleryResponse, reviewsResponse, menuItemsResponse] = await Promise.all([
    getOptionalApi<SiteData | { value?: SiteData; _doc?: { value?: SiteData } }>("/regarding/datasource"),
    getOptionalApi<SiteLogoSetting | { value?: SiteLogoSetting }>("/school-settings/key/site_logo"),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/news", { limit: 10, page: 1, sortOrder: "desc" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/gallery", { limit: 50, page: 1, sortOrder: "desc" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/reviews", { limit: 12, page: 1, sortOrder: "desc" }),
    getOptionalApi<SiteRecord[] | PaginatedData<SiteRecord>>("/menu-items", { publishedOnly: "true" }),
  ]);
  const siteData = siteResponse ? unwrapSetting<SiteData>(siteResponse) : fallback;
  const dbLogoSetting = logoSettingResponse ? unwrapSetting<SiteLogoSetting>(logoSettingResponse) : null;
  const apiNews = unwrapCollection(newsResponse);
  const apiGallery = unwrapCollection(galleryResponse);
  const apiReviews = unwrapCollection(reviewsResponse);
  const apiMenuItems = unwrapCollection(menuItemsResponse);
  const fallbackGallery = Array.isArray(fallback.gallery)
    ? fallback.gallery as SiteRecord[]
    : [];
  const fallbackReviews = Array.isArray(fallback.reviews)
    ? fallback.reviews as SiteRecord[]
    : [];

  const finalMenuItems = apiMenuItems.length > 0
    ? buildMenuHierarchy(apiMenuItems)
    : fallbackMenuitemsTree;

  const siteLogoFromDb = (dbLogoSetting && typeof dbLogoSetting === "object" && dbLogoSetting.logoUrl)
    ? dbLogoSetting
    : (siteData.site_logo || (siteData.home?.[0]?.identity as any)?.site_logo);

  const homeList = Array.isArray(siteData.home) && siteData.home.length > 0 ? siteData.home : fallback.home;
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
    ...fallback,
    ...siteData,
    site_logo: siteLogoFromDb || fallback.site_logo,
    home: updatedHome,
    news: apiNews.length ? apiNews : fallback.news,
    galleryItems: apiGallery.length ? apiGallery : fallbackGallery,
    reviewsItems: apiReviews.length ? apiReviews : fallbackReviews,
    menuItems: finalMenuItems,
    menuitems: rawFallbackMenuitems as SiteRecord[],
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
        cleanPath.startsWith("javascript:")
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
        cleanPath.startsWith("javascript:")
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

  return processed;
}

export function imageUrls(record: SiteRecord): string[] {
  const value = record.fileUrls ?? record.fileUrl;
  if (!Array.isArray(value)) return imageUrl(value) ? [imageUrl(value)] : [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
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
  let rawImageUrl = pb.imageUrl !== undefined && text(pb.imageUrl).trim() !== "" ? text(pb.imageUrl) : "/assets/Settings/Home/POP_UP_IMAGE.jpeg";
  if (rawImageUrl.includes("Banner_8") || rawImageUrl.includes("file_") || !rawImageUrl.trim()) {
    rawImageUrl = "/assets/Settings/Home/POP_UP_IMAGE.jpeg";
  }
  const resolvedImageUrl = imageUrl(rawImageUrl) || getAssetUrl(rawImageUrl) || "/assets/Settings/Home/POP_UP_IMAGE.jpeg";
  const showTitle = pb.showTitle !== false;
  const title = showTitle ? (pb.title !== undefined ? text(pb.title) : "Admissions Open 2026–27") : "";
  const rawSubtitle = text(pb.subtitle) || "";
  const subtitle = rawSubtitle.toLowerCase().includes("enroll your child") ? "" : rawSubtitle;
  const enquiryButtonText = text(pb.enquiryButtonText) || "Enquiry Now";
  const closeButtonText = text(pb.closeButtonText) || "Close";
  const onlyOncePerSession = pb.onlyOncePerSession === true;
  const modalWidth = (["sm", "md", "lg", "xl", "full", "custom"].includes(pb.modalWidth || "") ? pb.modalWidth : "lg") as "sm" | "md" | "lg" | "xl" | "full" | "custom";
  const imageWidth = typeof pb.imageWidth === "number" ? pb.imageWidth : (Number(pb.imageWidth) || 600);
  const imageMaxHeight = typeof pb.imageMaxHeight === "number" ? pb.imageMaxHeight : (Number(pb.imageMaxHeight) || 400);
  const imageFit = (pb.imageFit === "contain" || pb.imageFit === "fill") ? pb.imageFit : "cover";
  const imagePosition = (pb.imagePosition === "top" || pb.imagePosition === "bottom") ? pb.imagePosition : "center";
  const aspectRatio = (["16/9", "16/10", "4/3", "1/1", "3/2", "2/1"].includes(pb.aspectRatio || "") ? pb.aspectRatio : "16/10") as "auto" | "16/9" | "16/10" | "4/3" | "1/1" | "3/2" | "2/1";
  const bannerStyle = (pb.bannerStyle === "card" || pb.bannerStyle === "side-by-side") ? pb.bannerStyle : "full-bleed";
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
    imageBorderRadius,
    showImageZoomOnClick,
  };
}


