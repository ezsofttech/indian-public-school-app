import React from "react";
import { Crown, Shield } from "lucide-react";
import { JwtPayload, ResourceKey, RecordItem, PaginationMeta } from "../types/admin.types";
import { OPTIONAL_FIELDS } from "../config/admin.config";
import { imageUrl } from "@/lib/site-data";

export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isSuperAdminRole(roleValue: unknown): boolean {
  const str = String(roleValue || "").toLowerCase().trim();
  return str.includes("super") || str === "super_admin" || str === "superadmin";
}

export function isSubAdminRole(roleValue: unknown): boolean {
  const str = String(roleValue || "").toLowerCase().trim();
  return str.includes("sub") || str === "sub_admin" || str === "subadmin" || str === "admin" || str.includes("school");
}

export function hasPermission(
  userModules: string[] | undefined,
  isSuper: boolean,
  resourceKey: ResourceKey,
  action: "access" | "update" | "delete"
): boolean {
  if (isSuper) return true;
  if (resourceKey === "careers") return true;
  if (!userModules) return true;
  if (userModules.includes("*")) return true;

  if (userModules.includes(`${resourceKey}:${action}`)) return true;
  if (userModules.includes(resourceKey)) return true;

  return false;
}

export function RoleBadge({ role }: { role: unknown }) {
  const r = String(role || "Sub Admin");
  if (isSuperAdminRole(r)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
        <Crown size={13} className="fill-amber-500 text-amber-600" />
        <span>Super Admin</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-bold text-[#1a5d9c]">
      <Shield size={13} className="text-[#1a5d9c]" />
      <span>Sub Admin</span>
    </span>
  );
}

export function isRequiredField(field: string, resourceKey: string, isEdit: boolean): boolean {
  if (field === "password" && isEdit) return false;
  return !OPTIONAL_FIELDS.has(field);
}

export function itemId(item: RecordItem): string {
  return String(item.publicId || item.id || item._id || item.menuId || "");
}

export function flattenMenuItems(list: RecordItem[]): RecordItem[] {
  const result: RecordItem[] = [];
  const visited = new Set<string>();

  function walk(item: RecordItem) {
    const id = itemId(item);
    if (!id || visited.has(id)) return;
    visited.add(id);
    const { subItems, children, ...rest } = item;
    result.push(rest as RecordItem);
    const subs = Array.isArray(subItems) ? subItems : Array.isArray(children) ? children : [];
    subs.forEach((sub: RecordItem) => walk(sub as RecordItem));
  }

  list.forEach((item) => walk(item));
  return result;
}

export function asPaginatedPayload(
  payload: unknown,
  resourceKey?: string
): { items: RecordItem[]; meta: PaginationMeta } {
  if (!payload || typeof payload !== "object") {
    return {
      items: [],
      meta: { page: 1, limit: 8, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    };
  }

  const pObj = payload as Record<string, unknown>;
  let items: RecordItem[] = [];

  if (Array.isArray(pObj.data)) {
    items = pObj.data as RecordItem[];
  } else if (Array.isArray(pObj.items)) {
    items = pObj.items as RecordItem[];
  } else if (pObj.data && typeof pObj.data === "object") {
    const dataObj = pObj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) {
      items = dataObj.items as RecordItem[];
    } else if (Array.isArray(dataObj.data)) {
      items = dataObj.data as RecordItem[];
    }
  } else if (Array.isArray(payload)) {
    items = payload as RecordItem[];
  }

  const metaObj = (pObj.meta && typeof pObj.meta === "object" ? pObj.meta : {}) as Record<string, unknown>;

  const total = typeof metaObj.total === "number" ? metaObj.total : items.length;
  const page = typeof metaObj.page === "number" ? metaObj.page : 1;
  const limit = typeof metaObj.limit === "number" ? metaObj.limit : (items.length || 8);
  const totalPages = typeof metaObj.totalPages === "number" ? metaObj.totalPages : Math.ceil(total / (limit || 1)) || 1;
  const hasNextPage = typeof metaObj.hasNextPage === "boolean" ? metaObj.hasNextPage : page < totalPages;
  const hasPrevPage = typeof metaObj.hasPrevPage === "boolean" ? metaObj.hasPrevPage : page > 1;

  if (resourceKey === "menu-items" || items.some((i) => Array.isArray(i.subItems) && i.subItems.length > 0)) {
    items = flattenMenuItems(items);
  }

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
}

export function asItems(payload: unknown, resourceKey?: string): RecordItem[] {
  return asPaginatedPayload(payload, resourceKey).items;
}

export function getItemPhoto(item?: RecordItem | null): string | null {
  if (!item) return null;
  const photo =
    item.profileImageUrl ||
    item.avatar ||
    item.photo ||
    item.image ||
    item.fileUrl ||
    item.src ||
    (Array.isArray(item.fileUrls) ? item.fileUrls[0] : null);
  if (typeof photo === "string" && photo.trim() && photo.startsWith("http")) {
    return imageUrl(photo.trim());
  }
  return null;
}

export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== "string") return "";
  let decoded = str;
  for (let i = 0; i < 3; i++) {
    if (
      decoded.includes("&lt;") ||
      decoded.includes("&gt;") ||
      decoded.includes("&quot;") ||
      decoded.includes("&#39;") ||
      decoded.includes("&amp;") ||
      decoded.includes("&nbsp;")
    ) {
      const next = decoded
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ");
      if (next === decoded) break;
      decoded = next;
    } else {
      break;
    }
  }
  return decoded;
}

export function getPreviewUrl(item: RecordItem): string | null {
  if (!item || typeof item !== "object") return null;
  if (item.key === "site_logo") {
    let logoVal = item.value;
    if (typeof logoVal === "string") {
      try {
        logoVal = JSON.parse(logoVal);
      } catch {}
    }
    if (logoVal && typeof logoVal === "object" && (logoVal as Record<string, any>).logoUrl) {
      return imageUrl((logoVal as Record<string, any>).logoUrl);
    }
  }
  if (item.key === "site_datasource") {
    return "/";
  }
  if (typeof item.slug === "string" && item.slug.trim()) {
    const s = item.slug.trim();
    if (s === "home" || s === "/") return "/";
    return s.startsWith("/") ? s : `/${s}`;
  }
  if (typeof item.targetUrl === "string" && item.targetUrl.trim()) {
    return item.targetUrl.trim();
  }
  if (typeof item.path === "string" && item.path.trim()) {
    const p = item.path.trim();
    return p.startsWith("/") ? p : `/${p}`;
  }
  if (typeof item.url === "string" && item.url.trim() && item.url.startsWith("/")) {
    return item.url.trim();
  }
  if (typeof item.linkUrl === "string" && item.linkUrl.trim() && item.linkUrl.startsWith("/")) {
    return item.linkUrl.trim();
  }
  return null;
}

export function formatValue(field: string, value: unknown, item?: RecordItem, allItems: RecordItem[] = []) {
  if (field === "isRead") {
    return value === true ? "Read" : "Unread";
  }
  if (value === null || value === undefined || value === "") return "—";

  if (field === "name" && item?.message && typeof item.message === "string") {
    const studentMatch = item.message.match(/STUDENT DETAILS:\s*[\r\n]+Name:\s*([^\r\n]+)/i);
    if (studentMatch && studentMatch[1]) {
      const sName = studentMatch[1].trim();
      const rawName = String(value).trim();
      if (sName.toLowerCase() !== rawName.toLowerCase() && !rawName.toLowerCase().includes(sName.toLowerCase())) {
        return `${sName} (Parent: ${rawName})`;
      }
      return sName;
    }
  }

  if (field === "level") {
    return `Level ${String(value)}`;
  }
  if (field === "parentId") {
    if (item?.parentTitle) return String(item.parentTitle);
    if (typeof item?.parent === "object" && item.parent && "title" in (item.parent as object)) {
      return String((item.parent as Record<string, unknown>).title);
    }
    if (typeof value === "object" && value !== null && "title" in (value as object)) {
      return String((value as Record<string, unknown>).title);
    }
    if (value && allItems.length > 0) {
      const parentIdStr = typeof value === "object" && value && "_id" in (value as object)
        ? String((value as RecordItem)._id)
        : String(value);
      const parentItem = allItems.find((i) => itemId(i) === parentIdStr || String(i._id) === parentIdStr || String(i.menuId) === parentIdStr || String(i.slug) === parentIdStr);
      if (parentItem?.title) return String(parentItem.title);
    }
    return value ? `Parent (${String(value).slice(-6)})` : "—";
  }
  if (field === "createdAt" || field === "updatedAt" || field.toLowerCase().endsWith("at") || field.toLowerCase().endsWith("date")) {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  }

  if (typeof value === "boolean") return value ? "Published" : "Draft";
  if (Array.isArray(value)) return `${value.length} asset${value.length === 1 ? "" : "s"}`;

  if (typeof value === "string") {
    const decoded = decodeHtmlEntities(value).trim();
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return decoded.split("/").pop() || decoded;
    }
    if (
      decoded.includes("<") &&
      decoded.includes(">") &&
      (/<[a-z][\s\S]*>/i.test(decoded) ||
        decoded.includes("<div") ||
        decoded.includes("<p") ||
        decoded.includes("<section") ||
        decoded.includes("<span") ||
        decoded.includes("<table") ||
        decoded.includes("<center") ||
        decoded.includes("<img"))
    ) {
      const clean = decoded.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
      return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean || "Rich UI Layout Content";
    }
  }

  if (field === "value" || typeof value === "object" || (typeof value === "string" && (value.trim().startsWith("{") || value.trim().startsWith("[")))) {
    let parsed: any = value;
    if (typeof value === "string") {
      try { parsed = JSON.parse(value); } catch { parsed = null; }
    }
    if (parsed && typeof parsed === "object") {
      if (parsed.home && Array.isArray(parsed.home)) {
        const h = parsed.home[0] || {};
        const notice = h.identity?.header?.noticeText || h.header?.noticeText || "";
        return notice ? `Home Site Layout (Notice: "${notice.slice(0, 24)}...")` : "Home Site Layout & Sections";
      }
      return "Configured Settings";
    }
  }
  if (typeof value === "string") {
    const decoded = decodeHtmlEntities(value).trim();
    if (decoded.length > 42) return `${decoded.slice(0, 42)}…`;
    return decoded;
  }
  if (typeof value === "object") return "Configured";
  return String(value);
}

export function titleCase(value: string) {
  if (value === "inquiryType" || value === "enquirieType") return "Enquiry Type";
  if (value === "profileImageUrl") return "Student Profile Photo (Cloudinary)";
  if (value === "marksheetUrl") return "Previous Year Marksheet (Cloudinary)";
  if (value === "parentId") return "Parent Item (Hierarchy)";
  if (value === "targetUrl") return "Target Redirect URL";
  if (value === "textContent") return "Page Rich Content (HTML/Text)";
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
