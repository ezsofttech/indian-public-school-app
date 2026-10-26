"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import {
  SlidersHorizontal,
  List,
  Workflow,
  Grid,
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  Lock,
  Folder,
  GitBranch,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LoaderCircle,
  UploadCloud,
  Check,
  X,
  Save,
  Crown,
  ShieldCheck,
  ExternalLink,
  Image,
  RotateCcw,
  Power,
  Award,
  Building2,
  GraduationCap,
  EyeOff,
} from "lucide-react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { DEFAULT_LOGO, DEFAULT_SECONDARY_LOGO, imageUrl, isBannerLogoUrl } from "@/lib/site-data";
import { RecordItem, Resource, PaginationMeta, QueryParamsState } from "../types/admin.types";
import { API_URL, resourcePath } from "../config/admin.config";
import { asPaginatedPayload, isSuperAdminRole, itemId, formatValue, getPreviewUrl } from "../utils/admin.helpers";
import { MediaDetailDialog } from "../modals/MediaDetailDialog";
import { HomePreviewModal } from "../modals/HomePreviewModal";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";
import { FileUploadProgressLoader, FileUploadStatus } from "@/components/ui/FileUploadProgressLoader";
import { toCleanRelativeAssetPath, formatHref } from "@/lib/utils";

function Empty({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium text-slate-500">{text}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function MenuHierarchyFlow({
  items,
  onEdit,
  onDelete,
  deletingId,
  onTogglePublished,
}: {
  items: RecordItem[];
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
  deletingId?: string | null;
  onTogglePublished?: (item: RecordItem, isPublished: boolean) => Promise<void> | void;
}) {
  const itemMap = new Map<string, RecordItem & { children: any[] }>();

  items.forEach((item) => {
    const id = itemId(item);
    const node = { ...item, children: [] };
    itemMap.set(id, node);
    if (item._id) itemMap.set(String(item._id), node);
    if (item.id) itemMap.set(String(item.id), node);
    if (item.menuId) itemMap.set(String(item.menuId), node);
    if (item.publicId) itemMap.set(String(item.publicId), node);
    if (item.slug) itemMap.set(String(item.slug), node);
  });

  const roots: any[] = [];

  items.forEach((item) => {
    const id = itemId(item);
    const node = itemMap.get(id);
    const parentId =
      typeof item.parentId === "object" && item.parentId && "_id" in (item.parentId as object)
        ? String((item.parentId as RecordItem)._id)
        : String(item.parentId || "");

    if (parentId && itemMap.has(parentId)) {
      itemMap.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50/50">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Workflow className="text-[#1a5d9c]" size={18} />
          <h3 className="text-sm font-bold text-[#102a4c]">Website Navigation Hierarchy & Flow Connectivity Wire</h3>
        </div>
        <p className="text-xs font-semibold text-slate-500">Visual Parent-Child Connectivity Map (3 Levels)</p>
      </div>

      <div className="space-y-6">
        {roots.map((root) => (
          <div key={itemId(root)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            {/* Level 1 Root Item Node */}
            <div className="flex items-center justify-between gap-3 bg-[#102a4c] text-white p-3.5 rounded-xl shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <Folder size={18} className="fill-amber-400 text-amber-400 shrink-0" />
                <span className="font-bold text-sm truncate">{String(root.title || "Untitled")}</span>
                <span className="rounded-full bg-blue-500/30 border border-blue-300/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-200">
                  Level 1 (Root)
                </span>
                {root.children.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold">
                    <GitBranch size={11} /> {root.children.length} sub-items attached
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">(No sub-items)</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onTogglePublished && (
                  <div className="relative inline-flex items-center">
                    <select
                      value={root.isPublished !== false && String(root.isPublished) !== "false" ? "Published" : "Draft"}
                      onChange={(e) => onTogglePublished(root, e.target.value === "Published")}
                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-5 pr-5 py-0.5 text-[10px] font-bold border shadow-2xs transition outline-none ${
                        root.isPublished !== false && String(root.isPublished) !== "false"
                          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                          : "border-rose-400/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                      }`}
                      title="Click to change published status"
                    >
                      <option value="Published" className="text-slate-900 bg-white font-semibold">Published</option>
                      <option value="Draft" className="text-slate-900 bg-white font-semibold">Draft</option>
                    </select>
                    <span className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${
                      root.isPublished !== false && String(root.isPublished) !== "false" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                    }`} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(root)}
                  className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white"
                  title="Edit Root Item"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingId)}
                  onClick={() => onDelete(root)}
                  className="rounded-lg p-1.5 text-red-300 hover:bg-white/10 hover:text-red-200 disabled:opacity-50 cursor-pointer"
                  title={deletingId === itemId(root) ? "Deleting..." : "Delete Root Item"}
                >
                  {deletingId === itemId(root) ? (
                    <LoaderCircle size={15} className="animate-spin text-red-300" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </div>

            {/* Level 2 Sub-items Branch Wire */}
            {root.children.length > 0 && (
              <div className="mt-3.5 ml-4 pl-4 border-l-2 border-dashed border-blue-400 space-y-3">
                {root.children.map((sub: any) => (
                  <div key={itemId(sub)} className="relative">
                    <div className="absolute -left-4 top-4 h-0.5 w-4 bg-blue-400"></div>
                    <div className="flex items-center justify-between gap-3 bg-blue-50/80 border border-blue-200/80 p-3 rounded-xl">
                      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                        <FileText size={16} className="text-[#1a5d9c] shrink-0" />
                        <span className="font-bold text-xs text-slate-800 truncate">{String(sub.title || "Untitled")}</span>
                        <span className="rounded-full bg-blue-100 text-[#1a5d9c] px-2 py-0.5 text-[10px] font-bold">
                          Level 2 (Sub-item)
                        </span>
                        {sub.children.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 text-[10px] font-bold">
                            <GitBranch size={11} /> {sub.children.length} sub-items
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onTogglePublished && (
                          <div className="relative inline-flex items-center">
                            <select
                              value={sub.isPublished !== false && String(sub.isPublished) !== "false" ? "Published" : "Draft"}
                              onChange={(e) => onTogglePublished(sub, e.target.value === "Published")}
                              className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-5 pr-5 py-0.5 text-[10px] font-bold border shadow-2xs transition outline-none ${
                                sub.isPublished !== false && String(sub.isPublished) !== "false"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                  : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                              }`}
                              title="Click to change published status"
                            >
                              <option value="Published" className="text-slate-900 bg-white font-semibold">Published</option>
                              <option value="Draft" className="text-slate-900 bg-white font-semibold">Draft</option>
                            </select>
                            <span className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${
                              sub.isPublished !== false && String(sub.isPublished) !== "false" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                            }`} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(sub)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 hover:text-[#1a5d9c]"
                          title="Edit Sub Item"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(deletingId)}
                          onClick={() => onDelete(sub)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                          title={deletingId === itemId(sub) ? "Deleting..." : "Delete Sub Item"}
                        >
                          {deletingId === itemId(sub) ? (
                            <LoaderCircle size={14} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Level 3 Sub-sub-items Branch Wire */}
                    {sub.children.length > 0 && (
                      <div className="mt-2.5 ml-4 pl-4 border-l-2 border-dashed border-emerald-400 space-y-2">
                        {sub.children.map((subSub: any) => (
                          <div key={itemId(subSub)} className="relative">
                            <div className="absolute -left-4 top-3.5 h-0.5 w-4 bg-emerald-400"></div>
                            <div className="flex items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                                <span className="font-semibold text-xs text-slate-800 truncate">{String(subSub.title || "Untitled")}</span>
                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                                  Level 3 (Sub-item)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {onTogglePublished && (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={subSub.isPublished !== false && String(subSub.isPublished) !== "false" ? "Published" : "Draft"}
                                      onChange={(e) => onTogglePublished(subSub, e.target.value === "Published")}
                                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-5 pr-5 py-0.5 text-[10px] font-bold border shadow-2xs transition outline-none ${
                                        subSub.isPublished !== false && String(subSub.isPublished) !== "false"
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                          : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                                      }`}
                                      title="Click to change published status"
                                    >
                                      <option value="Published" className="text-slate-900 bg-white font-semibold">Published</option>
                                      <option value="Draft" className="text-slate-900 bg-white font-semibold">Draft</option>
                                    </select>
                                    <span className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${
                                      subSub.isPublished !== false && String(subSub.isPublished) !== "false" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                    }`} />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onEdit(subSub)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
                                  title="Edit Sub-item"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  disabled={Boolean(deletingId)}
                                  onClick={() => onDelete(subSub)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                                  title={deletingId === itemId(subSub) ? "Deleting..." : "Delete Sub-item"}
                                >
                                  {deletingId === itemId(subSub) ? (
                                    <LoaderCircle size={13} className="animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {roots.length === 0 && <Empty text="No menu items configured." />}
      </div>
    </div>
  );
}

export const RESOURCE_FILTERS: Record<string, { label: string; key: string; options: string[] }[]> = {
  students: [
    { label: "Grade", key: "grade", options: ["All", "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"] },
    { label: "Status", key: "status", options: ["All", "Active", "Inactive", "Graduated", "Transferred"] },
  ],
  staff: [
    { label: "Department", key: "department", options: ["All", "Teaching", "Administration", "Sports", "Support", "Management"] },
    { label: "Role", key: "role", options: ["All", "Teacher", "Principal", "Vice Principal", "Headmaster", "Staff", "Admin"] },
  ],
  news: [
    { label: "Category", key: "category", options: ["All", "Academic", "Sports", "Events", "General", "Announcement"] },
  ],
  pages: [
    { label: "Status", key: "isPublished", options: ["All", "Published", "Draft"] },
  ],
  "menu-items": [
    { label: "Status", key: "isPublished", options: ["All", "Published", "Draft"] },
    { label: "Category", key: "category", options: ["All", "Header", "Footer", "Quick Links", "Sidebar"] },
  ],
  reviews: [
    { label: "Status", key: "isApproved", options: ["All", "Approved", "Pending"] },
  ],
  inquiries: [
    { label: "Status", key: "status", options: ["All", "New", "In Progress", "Contacted", "Resolved", "Closed"] },
  ],
  gallery: [
    { label: "Event Type", key: "eventType", options: ["All", "General", "Settings", "Icons", "Logos", "Home", "AdmissionDocuments", "Documents", "News", "Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Awareness", "Celebration", "Academic", "Infrastructure"] },
    {
      label: "Directory",
      key: "directory",
      options: [
        "All",
        "Album",
        "Album/Events",
        "Album/Hostel",
        "Album/Infrastructure",
        "Album/Empowerment",
        "Album/Competitions",
        "Album/Partners",
        "Album/Achievements",
        "Album/Reviews",
        "Album/Awareness",
        "PressRelease",
        "Settings/Logos",
        "Settings/Home",
        "Settings/Icons",
        "Documents/General",
        "Documents/Admission",
        "Student",
        "Staff",
        "Videos",
      ],
    },
  ],
  "school-settings": [
    { label: "Status", key: "status", options: ["All", "Active", "Inactive"] },
    { label: "Category", key: "category", options: ["All", "Content", "Header", "Footer", "General"] },
  ],
  users: [
    { label: "Status", key: "status", options: ["All", "ACTIVE", "INACTIVE", "SUSPENDED"] },
    { label: "Role", key: "role", options: ["All", "Super Admin", "Admin", "Sub Admin"] },
  ],
};

interface PageOption {
  title: string;
  url: string;
  group: string;
}

function ActionLinkPicker({
  value,
  onChange,
  availablePages,
  placeholder = "e.g. /academics/courses-offered",
  label = "Action Link URL",
}: {
  value: string;
  onChange: (val: string) => void;
  availablePages: PageOption[];
  placeholder?: string;
  label?: string;
}) {
  const matchedPage = useMemo(() => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return null;
    const cleanTrimmed = trimmed.replace(/\/+$/, "");
    return (
      availablePages.find((p) => p.url === trimmed) ||
      availablePages.find((p) => p.url.replace(/\/+$/, "") === cleanTrimmed) ||
      availablePages.find((p) => {
        try {
          return formatHref(p.url) === formatHref(trimmed);
        } catch {
          return false;
        }
      }) ||
      null
    );
  }, [value, availablePages]);

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return false;
    const cleanTrimmed = trimmed.replace(/\/+$/, "");
    return !availablePages.some(
      (p) =>
        p.url === trimmed ||
        p.url.replace(/\/+$/, "") === cleanTrimmed ||
        formatHref(p.url) === formatHref(trimmed)
    );
  });

  useEffect(() => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      setIsCustomMode(false);
      return;
    }
    const cleanTrimmed = trimmed.replace(/\/+$/, "");
    const matchesPreset = availablePages.some(
      (p) =>
        p.url === trimmed ||
        p.url.replace(/\/+$/, "") === cleanTrimmed ||
        formatHref(p.url) === formatHref(trimmed)
    );
    if (!matchesPreset) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
    }
  }, [value, availablePages]);

  const selectValue = useMemo(() => {
    if (isCustomMode) return "__custom__";
    if (matchedPage) return matchedPage.url;
    return "";
  }, [isCustomMode, matchedPage]);

  const groupedPages = useMemo(() => {
    const groups: Record<string, PageOption[]> = {};
    availablePages.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, [availablePages]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsCustomMode(false);
            }}
            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            title="Clear Action Link"
          >
            <Trash2 size={11} /> Clear Link
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={selectValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__custom__") {
              setIsCustomMode(true);
            } else if (val === "") {
              setIsCustomMode(false);
              onChange("");
            } else {
              setIsCustomMode(false);
              onChange(val);
            }
          }}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-xs font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100 shadow-2xs cursor-pointer"
        >
          <option value="">-- Choose destination page / route --</option>
          {Object.entries(groupedPages).map(([groupName, pages]) => (
            <optgroup key={groupName} label={groupName}>
              {pages.map((p) => (
                <option key={p.url} value={p.url}>
                  {p.title} ({p.url})
                </option>
              ))}
            </optgroup>
          ))}
          <optgroup label="Custom / External">
            <option value="__custom__">Custom URL / External Link (Manual typing)</option>
          </optgroup>
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          disabled={!isCustomMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition font-mono ${
            !isCustomMode
              ? "border-slate-200 bg-slate-100/90 text-slate-600 cursor-not-allowed select-all"
              : "border-slate-300 bg-white text-slate-800 focus:border-[#1a5d9c] focus:ring-2 focus:ring-blue-100"
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-0.5">
        {!isCustomMode && matchedPage ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
            <Check size={11} className="text-emerald-600" />
            <span>Active Destination: <strong>{matchedPage.title}</strong> ({matchedPage.url})</span>
          </span>
        ) : !isCustomMode && value ? (
          <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
            <Check size={11} className="text-blue-600" />
            <span>Target Route: <strong className="font-mono">{value}</strong></span>
          </span>
        ) : !isCustomMode && !value ? (
          <span className="text-slate-400">Select a page above to set destination link.</span>
        ) : (
          <span className="text-amber-700 font-medium">Custom mode enabled: Enter any internal route or external URL.</span>
        )}

        {isCustomMode ? (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              if (matchedPage) onChange(matchedPage.url);
            }}
            className="font-semibold text-[#1a5d9c] hover:underline cursor-pointer ml-auto"
          >
            Choose from page list instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className="font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer ml-auto"
          >
            Type custom URL
          </button>
        )}
      </div>
    </div>
  );
}

export function HeaderFooterSettingsCard({
  token,
  items,
  onSaveComplete,
  allMenuItems,
}: {
  token: string;
  items: RecordItem[];
  onSaveComplete: () => void;
  allMenuItems?: RecordItem[];
}) {
  const [activeTab, setActiveTab] = useState<"logo" | "certified" | "trust" | "partner">("logo");
  const [galleryPickerField, setGalleryPickerField] = useState<"logoUrl" | "secondaryLogoUrl" | "badgeUrl" | "trustLogoUrl" | "partnerLogoUrl" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingSetting, setUploadingSetting] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });

  const [publishedPages, setPublishedPages] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPages = async () => {
      try {
        const res = await axios.get(`${API_URL}/pages/published`);
        const parsed = asPaginatedPayload(res.data);
        if (Array.isArray(parsed.items) && isMounted) {
          const list: { title: string; url: string }[] = [];
          parsed.items.forEach((p: any) => {
            const rawUrl = String(p.targetUrl || (p.slug ? `/pages/${p.slug}` : "")).trim();
            if (rawUrl) {
              const url = rawUrl.startsWith("/") || rawUrl.startsWith("http") ? rawUrl : `/${rawUrl}`;
              list.push({
                title: String(p.title || p.heading || rawUrl).trim(),
                url,
              });
            }
          });
          setPublishedPages(list);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchPages();
    return () => {
      isMounted = false;
    };
  }, []);

  const brandingPageOptions: PageOption[] = useMemo(() => {
    const list: PageOption[] = [
      // Primary Academic & School Pages
      { title: "Academics & Courses Offered", url: "/academics/courses-offered", group: "Important Pages" },
      { title: "Mandatory Public Disclosure", url: "/mandatory-disclosure", group: "Important Pages" },
      { title: "School Establishment & Trust", url: "/about-us/school-establishment", group: "Important Pages" },
      { title: "CBSE Affiliation Details", url: "/about-us/affiliation", group: "Important Pages" },
      { title: "Student Admissions", url: "/admission", group: "Important Pages" },
      { title: "Career Opportunities", url: "/careers", group: "Important Pages" },
      { title: "Pictures & Photo Albums", url: "/gallery/album", group: "Important Pages" },
      { title: "Photo & Picture Gallery", url: "/gallery", group: "Important Pages" },
      { title: "Video Gallery", url: "/gallery/videos", group: "Important Pages" },
      { title: "Contact Us", url: "/contact-us", group: "Important Pages" },
      { title: "CBSE Official Portal (cbse.gov.in)", url: "https://www.cbse.gov.in", group: "Important Pages" },

      // In-page sections
      { title: "Home Page (Top)", url: "/", group: "Website Sections" },
      { title: "About Us (Section)", url: "/#about", group: "Website Sections" },
      { title: "Academics (Section)", url: "/#academics", group: "Website Sections" },
      { title: "Admissions (Section)", url: "/#admissions", group: "Website Sections" },
      { title: "Infrastructure (Section)", url: "/#infrastructure", group: "Website Sections" },
      { title: "Student Life (Section)", url: "/#student-life", group: "Website Sections" },
      { title: "Gallery (Section)", url: "/#gallery", group: "Website Sections" },
      { title: "Contact Us (Section)", url: "/#contact", group: "Website Sections" },
    ];

    const seenUrls = new Set<string>(list.map((i) => i.url));

    // Dynamic Published Pages
    publishedPages.forEach((p) => {
      if (!seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        list.push({
          title: p.title,
          url: p.url,
          group: "Published CMS Pages",
        });
      }
    });

    // Navigation Menu Items
    if (Array.isArray(allMenuItems) && allMenuItems.length > 0) {
      allMenuItems.forEach((item: any) => {
        const isPublished = item.isPublished !== false && String(item.isPublished) !== "false";
        if (!isPublished) return;
        const rawUrl = String(item.targetUrl || item.linkUrl || item.redirectUrl || item.href || (item.slug ? `/${item.slug}` : "")).trim();
        if (!rawUrl) return;
        const url = rawUrl.startsWith("/") || rawUrl.startsWith("http") ? rawUrl : `/${rawUrl}`;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          list.push({
            title: String(item.title || item.heading || url).trim(),
            url,
            group: "Navigation Menu",
          });
        }
      });
    }

    return list;
  }, [publishedPages, allMenuItems]);

  const handleDirectSettingFileUpload = async (
    targetField: "logoUrl" | "secondaryLogoUrl" | "badgeUrl" | "trustLogoUrl" | "partnerLogoUrl",
    file: File
  ) => {
    setUploadingSetting(targetField);
    setError("");

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setUploadStatus({
      isUploading: true,
      field: targetField,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: file.type,
      previewUrl,
      progress: 5,
      step: "preparing",
      stageMessage: "Preparing upload…",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("album", "Settings");
      formData.append("folder", "Settings/Logos");

      setUploadStatus((prev) => ({
        ...prev,
        progress: 15,
        step: "uploading",
        stageMessage: "Uploading logo…",
      }));

      const res = await axios.post(`${API_URL}/uploads`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadStatus((prev) => ({
              ...prev,
              progress: Math.min(pct, 95),
              step: pct >= 95 ? "processing" : "uploading",
              stageMessage: pct >= 95 ? "Processing logo…" : `Uploading logo (${pct}%)…`,
            }));
          }
        },
      });

      setUploadStatus((prev) => ({
        ...prev,
        progress: 98,
        step: "processing",
        stageMessage: "Processing logo…",
      }));

      const data = res.data?.data ?? res.data;
      const rawUrl = data?.url || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : data?.fileUrl);
      if (!rawUrl) throw new Error("No URL returned from upload response.");

      const cleanUrl = toCleanRelativeAssetPath(rawUrl);

      if (targetField === "logoUrl") setSiteLogo((p) => ({ ...p, logoUrl: cleanUrl }));
      else if (targetField === "secondaryLogoUrl") setSiteLogo((p) => ({ ...p, secondaryLogoUrl: cleanUrl }));
      else if (targetField === "badgeUrl") setCertifiedBoard((p) => ({ ...p, badgeUrl: cleanUrl }));
      else if (targetField === "trustLogoUrl") setTrustBoard((p) => ({ ...p, logoUrl: cleanUrl }));
      else if (targetField === "partnerLogoUrl") setAcademicPartner((p) => ({ ...p, logoUrl: cleanUrl }));

      setUploadStatus((prev) => ({
        ...prev,
        progress: 100,
        step: "done",
        stageMessage: "Upload complete!",
      }));

      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err: any) {
      console.error("Setting logo upload failed:", err);
      const errMsg = axios.isAxiosError(err)
        ? String(err.response?.data?.message || err.message)
        : "Failed to upload setting logo.";
      setError(errMsg);
      setUploadStatus((prev) => ({
        ...prev,
        step: "error",
        errorMessage: errMsg,
        stageMessage: "Upload failed.",
      }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setUploadingSetting(null);
      setUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    }
  };

  const DEFAULT_CERTIFIED_BOARD = {
    title: "CBSE Affiliated School",
    subtitle: "Board Affiliation",
    code: "Affiliation No. 1530211 | School Code: 53123",
    badgeUrl: "",
    description: "Affiliated to Central Board of Secondary Education, New Delhi",
    linkUrl: "/mandatory-disclosure",
    buttonText: "View Affiliation Details",
    enabled: true,
  };

  const DEFAULT_TRUST_BOARD = {
    trustName: "K.S. Dalmia Education Trust",
    regNo: "Established under KS Dalmia Education Trust",
    logoUrl: "",
    description: "Dedicated to character building, academic excellence, and holistic personality development.",
    linkUrl: "/about-us/school-establishment",
    buttonText: "Learn About Trust",
    enabled: true,
  };

  const DEFAULT_ACADEMIC_PARTNER = {
    title: "Aakash Institute Partner",
    subtitle: "Our Academic Partner",
    logoUrl: "/assets/Settings/Logos/AakashFoundationLogo.png",
    description: "Integrated coaching and foundation programs for NEET, IIT-JEE and competitive examinations.",
    linkUrl: "/academics/courses-offered",
    buttonText: "Explore Courses",
    enabled: true,
  };

  const siteDsItem = useMemo(() => items.find((i) => i.key === "site_datasource"), [items]);
  const certItem = useMemo(() => items.find((i) => i.key === "certified_board"), [items]);
  const trustItem = useMemo(() => items.find((i) => i.key === "trust_board"), [items]);
  const partnerItem = useMemo(() => items.find((i) => i.key === "academic_partner"), [items]);

  const [siteLogo, setSiteLogo] = useState({
    logoUrl: "/Settings/Logos/IPSLogo.png",
    secondaryLogoUrl: "/Settings/Logos/AakashFoundationLogo.png",
    showSecondaryLogo: true,
    logoText: "",
    logoSubText: "",
  });

  const [certifiedBoard, setCertifiedBoard] = useState(DEFAULT_CERTIFIED_BOARD);
  const [trustBoard, setTrustBoard] = useState(DEFAULT_TRUST_BOARD);
  const [academicPartner, setAcademicPartner] = useState(DEFAULT_ACADEMIC_PARTNER);

  const [fetchedDsValue, setFetchedDsValue] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadFullSettings = async () => {
      let rawDsVal: any = siteDsItem?.value;
      if (!rawDsVal) {
        try {
          const res = await axios.get(`${API_URL}/school-settings/key/site_datasource?t=${Date.now()}`);
          const itemData = res.data?.data ?? res.data;
          if (itemData?.value) {
            rawDsVal = itemData.value;
          }
        } catch {
          try {
            const res2 = await axios.get(`${API_URL}/regarding/datasource?t=${Date.now()}`);
            rawDsVal = res2.data?.data ?? res2.data;
          } catch {
            // Keep default fallback
          }
        }
      }

      if (typeof rawDsVal === "string") {
        try {
          rawDsVal = JSON.parse(rawDsVal);
        } catch {
          rawDsVal = {};
        }
      }

      const dsVal = (rawDsVal && typeof rawDsVal === "object") ? rawDsVal : {};
      if (isMounted) setFetchedDsValue(dsVal);

      const homeIdentity = (Array.isArray(dsVal.home) ? dsVal.home[0]?.identity : dsVal.identity) || {};

      const logoVal = homeIdentity.site_logo || dsVal.site_logo;
      if (logoVal && typeof logoVal === "object") {
        setSiteLogo((prev) => ({ ...prev, ...(logoVal as object) }));
      }

      const certVal: any = homeIdentity.certified_board || dsVal.certified_board;
      if (certVal && typeof certVal === "object") {
        setCertifiedBoard((prev) => ({ ...prev, ...(certVal as object), enabled: certVal.enabled !== false }));
      } else if (certItem?.value) {
        let cVal: any = certItem.value;
        if (typeof cVal === "string") { try { cVal = JSON.parse(cVal); } catch { } }
        if (cVal && typeof cVal === "object") {
          setCertifiedBoard((prev) => ({ ...prev, ...(cVal as object), enabled: cVal.enabled !== false }));
        }
      }

      const trustVal: any = homeIdentity.trust_board || dsVal.trust_board;
      if (trustVal && typeof trustVal === "object") {
        setTrustBoard((prev) => ({ ...prev, ...(trustVal as object), enabled: trustVal.enabled !== false }));
      } else if (trustItem?.value) {
        let tVal: any = trustItem.value;
        if (typeof tVal === "string") { try { tVal = JSON.parse(tVal); } catch { } }
        if (tVal && typeof tVal === "object") {
          setTrustBoard((prev) => ({ ...prev, ...(tVal as object), enabled: tVal.enabled !== false }));
        }
      }

      const partnerVal: any = homeIdentity.academic_partner || dsVal.academic_partner;
      if (partnerVal && typeof partnerVal === "object") {
        setAcademicPartner((prev) => ({ ...prev, ...(partnerVal as object), enabled: partnerVal.enabled !== false }));
      } else if (partnerItem?.value) {
        let pVal: any = partnerItem.value;
        if (typeof pVal === "string") { try { pVal = JSON.parse(pVal); } catch { } }
        if (pVal && typeof pVal === "object") {
          setAcademicPartner((prev) => ({ ...prev, ...(pVal as object), enabled: pVal.enabled !== false }));
        }
      }
    };

    loadFullSettings();
    return () => { isMounted = false; };
  }, [siteDsItem, certItem, trustItem, partnerItem]);

  const saveSettings = async () => {
    if (!token) {
      setError("Please sign in to save identity settings.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const currentDsVal = fetchedDsValue || (typeof siteDsItem?.value === "string" ? JSON.parse(siteDsItem.value) : siteDsItem?.value) || {};
      const homeList = Array.isArray(currentDsVal.home) ? [...currentDsVal.home] : [{}];
      const firstHome = { ...(homeList[0] || {}) };

      const currentHeader = { ...(firstHome.identity?.header || currentDsVal.header || {}) };
      const currentFooter = { ...(firstHome.identity?.footer || currentDsVal.footer || {}) };

      if (siteLogo.logoUrl !== undefined) {
        currentHeader.logoUrl = siteLogo.logoUrl;
        currentFooter.logoUrl = siteLogo.logoUrl;
      }
      currentHeader.logoText = siteLogo.logoText || "";
      currentFooter.logoText = siteLogo.logoText || "";
      currentHeader.logoSubText = siteLogo.logoSubText || "";
      currentFooter.logoSubText = siteLogo.logoSubText || "";

      const certToSave = {
        ...certifiedBoard,
        enabled: Boolean(certifiedBoard.enabled),
      };
      delete (certToSave as any).status;

      const trustToSave = {
        ...trustBoard,
        enabled: Boolean(trustBoard.enabled),
      };
      delete (trustToSave as any).status;

      const partnerToSave = {
        ...academicPartner,
        enabled: Boolean(academicPartner.enabled),
      };
      delete (partnerToSave as any).status;

      const identityObj = {
        ...(firstHome.identity || {}),
        header: currentHeader,
        footer: currentFooter,
        site_logo: siteLogo,
        certified_board: certToSave,
        trust_board: trustToSave,
        academic_partner: partnerToSave,
      };
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const finalVal = {
        ...currentDsVal,
        header: currentHeader,
        footer: currentFooter,
        site_logo: siteLogo,
        certified_board: certToSave,
        trust_board: trustToSave,
        academic_partner: partnerToSave,
        home: homeList,
      };

      await axios.post(
        `${API_URL}/school-settings`,
        {
          key: "site_datasource",
          category: "Content",
          description: "Full home page and website section layout configuration datasource",
          value: finalVal,
          status: "Active",
        },
        { headers }
      );

      setFetchedDsValue(finalVal);

      try {
        await axios.post(
          `${API_URL}/school-settings`,
          {
            key: "site_logo",
            category: "Branding",
            description: "School logo and header branding titles",
            value: siteLogo,
            status: "Active",
          },
          { headers }
        );
      } catch (e) {
        console.warn("Syncing standalone site_logo skipped or failed:", e);
      }

      if (certItem) {
        try {
          await axios.post(
            `${API_URL}/school-settings`,
            {
              key: "certified_board",
              category: "Footer",
              description: "Board Affiliation footer card",
              value: certToSave,
              status: certToSave.enabled ? "Active" : "Inactive",
            },
            { headers }
          );
        } catch { }
      }

      if (trustItem) {
        try {
          await axios.post(
            `${API_URL}/school-settings`,
            {
              key: "trust_board",
              category: "Footer",
              description: "Trust Board footer card",
              value: trustToSave,
              status: trustToSave.enabled ? "Active" : "Inactive",
            },
            { headers }
          );
        } catch { }
      }

      if (partnerItem) {
        try {
          await axios.post(
            `${API_URL}/school-settings`,
            {
              key: "academic_partner",
              category: "Footer",
              description: "Academic Partner footer card",
              value: partnerToSave,
              status: partnerToSave.enabled ? "Active" : "Inactive",
            },
            { headers }
          );
        } catch { }
      }

      setMessage("Settings saved successfully! Footer identity cards updated.");
      onSaveComplete();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message || err.message;
        setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
      } else {
        setError("Failed to save identity settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              Identity Setup
            </span>
            <h3 className="font-display text-xl font-bold text-[#102a4c]">Header & Footer Branding Settings</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure, Activate, Inactivate, or Clear Board Affiliation info, Trust Board details, and Academic Partner.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveSettings}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#124c81] disabled:opacity-60 cursor-pointer shrink-0"
        >
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? "Saving..." : "Save Identity Settings"}</span>
        </button>
      </div>

      {message && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span><i className="bi bi-cloud-check-fill mr-1.5"></i> {message}</span>
          <button type="button" onClick={() => setMessage("")}><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-800 border border-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Tabs Switcher with Status Badges */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("logo")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "logo" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Image size={15} /> School Logo & Header
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("certified")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "certified" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Award size={15} />
          <span>Board Affiliation</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              certifiedBoard.enabled
                ? activeTab === "certified"
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : activeTab === "certified"
                ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            {certifiedBoard.enabled ? "Active" : "Inactive"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trust")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "trust" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShieldCheck size={15} />
          <span>Trust Board</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trustBoard.enabled
                ? activeTab === "trust"
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : activeTab === "trust"
                ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            {trustBoard.enabled ? "Active" : "Inactive"}
          </span>
        </button>
        {/* Academic Partner Tab - Commented out as requested (Preserved for easy restoration)
        <button
          type="button"
          onClick={() => setActiveTab("partner")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "partner" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <i className="bi bi-briefcase text-[14px]"></i>
          <span>Academic Partner</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              academicPartner.enabled
                ? activeTab === "partner"
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : activeTab === "partner"
                ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            {academicPartner.enabled ? "Active" : "Inactive"}
          </span>
        </button>
        */}
      </div>

      {(uploadStatus.isUploading || uploadStatus.step === "done" || uploadStatus.step === "error") && (
        <div className="mt-4">
          <FileUploadProgressLoader status={uploadStatus} />
        </div>
      )}

      {/* Tab 1: Logo & Header Branding */}
      {activeTab === "logo" && (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 items-center">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Primary Logo Image (Banner / IPS Logo)</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="/Settings/Logos/IPSLogo.png or BannerLogo.png"
                  value={siteLogo.logoUrl}
                  onChange={(e) => setSiteLogo((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-medium outline-none text-slate-500 cursor-not-allowed select-all"
                />
                <label className="inline-flex cursor-pointer items-center gap-1 shrink-0 rounded-xl bg-[#1a5d9c] px-3 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shadow-xs">
                  {uploadingSetting === "logoUrl" ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  <span>{uploadingSetting === "logoUrl" ? "Uploading…" : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleDirectSettingFileUpload("logoUrl", file);
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("logoUrl")}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Image size={14} className="text-amber-500" />
                  <span>Gallery</span>
                </button>
                {Boolean(siteLogo.logoUrl) && (
                  <button
                    type="button"
                    title="Remove primary logo"
                    onClick={() => setSiteLogo((p) => ({ ...p, logoUrl: "" }))}
                    className="inline-flex items-center p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Official school branding emblem or horizontal banner logo displayed across the navigation bar and footer.
              </p>
            </div>

            {/* Secondary / Foundation Logo Image - Commented out as requested (Preserved for easy restoration)
            <div>
              <label className="block text-xs font-bold text-slate-700">Secondary / Foundation Logo Image</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="/Settings/Logos/AakashFoundationLogo.png"
                  value={siteLogo.secondaryLogoUrl}
                  onChange={(e) => setSiteLogo((p) => ({ ...p, secondaryLogoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-medium outline-none text-slate-500 cursor-not-allowed select-all"
                />
                <label className="inline-flex cursor-pointer items-center gap-1 shrink-0 rounded-xl bg-[#1a5d9c] px-3 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shadow-xs">
                  {uploadingSetting === "secondaryLogoUrl" ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  <span>{uploadingSetting === "secondaryLogoUrl" ? "Uploading…" : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleDirectSettingFileUpload("secondaryLogoUrl", file);
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("secondaryLogoUrl")}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Image size={14} className="text-amber-500" />
                  <span>Gallery</span>
                </button>
                {Boolean(siteLogo.secondaryLogoUrl) && (
                  <button
                    type="button"
                    title="Remove secondary logo"
                    onClick={() => setSiteLogo((p) => ({ ...p, secondaryLogoUrl: "" }))}
                    className="inline-flex items-center p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={siteLogo.showSecondaryLogo !== false}
                  onChange={(e) => setSiteLogo((p) => ({ ...p, showSecondaryLogo: e.target.checked }))}
                  className="h-4 w-4 rounded-md border-slate-300 text-[#1a5d9c] focus:ring-[#1a5d9c]"
                />
                Show Secondary / Foundation Logo in Header
              </label>
            </div>
            */}
          </div>

          <div className="flex flex-col justify-center space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 sm:p-6 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Header Logo Branding Preview</span>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-center gap-3 overflow-x-auto min-h-[72px]">
              <div className="flex items-center justify-center gap-3 shrink-0">
                {siteLogo.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl(siteLogo.logoUrl)}
                    alt="Primary Logo Preview"
                    className="h-10 max-h-12 w-auto object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes("IPSLogo.png")) {
                        target.src = "https://res.cloudinary.com/dnw7mgysa/image/upload/ips-education/assets/Settings/Logos/IPSLogo.png";
                      }
                    }}
                  />
                ) : (
                  <div className="font-bold text-sm text-[#102a4c]">
                    {siteLogo.logoText || "Indian Public School"}
                  </div>
                )}

                {/* Secondary Logo Preview - Commented out as requested
                {siteLogo.showSecondaryLogo !== false && siteLogo.secondaryLogoUrl && (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="h-7 w-[1.5px] bg-slate-200 rounded-full" />
                    <img
                      src={imageUrl(siteLogo.secondaryLogoUrl)}
                      alt="Secondary Logo Preview"
                      className="h-8 max-h-10 w-auto object-contain"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes("AakashFoundationLogo.png")) {
                          target.src = "https://res.cloudinary.com/dnw7mgysa/image/upload/ips-education/assets/Settings/Logos/AakashFoundationLogo.png";
                        }
                      }}
                    />
                  </div>
                )}
                */}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic text-center sm:text-left">
              This preview shows how your site logo banner will appear in the main navigation bar.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Board Affiliation */}
      {activeTab === "certified" && (
        <div className="mt-5 space-y-4">
          {/* Card Control Bar: Active/Inactive Switch & Delete/Restore Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCertifiedBoard((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  certifiedBoard.enabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
                title="Toggle Active / Inactive status"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    certifiedBoard.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${certifiedBoard.enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-xs font-bold text-slate-800">
                  {certifiedBoard.enabled ? "Card Status: Active (Visible in Footer)" : "Card Status: Inactive / Disabled (Hidden from Footer)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCertifiedBoard({ ...DEFAULT_CERTIFIED_BOARD })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                title="Restore original CBSE defaults"
              >
                <RotateCcw size={13} />
                <span>Restore Default</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear and disable Board Affiliation card from footer?")) {
                    setCertifiedBoard({
                      title: "",
                      subtitle: "",
                      code: "",
                      badgeUrl: "",
                      description: "",
                      linkUrl: "",
                      buttonText: "",
                      enabled: false,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                title="Clear content and disable card"
              >
                <Trash2 size={13} />
                <span>Clear / Delete Card</span>
              </button>
            </div>
          </div>

          {!certifiedBoard.enabled && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
              <EyeOff size={16} className="text-amber-700 shrink-0" />
              <span>
                <strong>Card is Inactive / Disabled:</strong> This badge will <strong>not</strong> be displayed on the public website footer. Toggle the switch above to make it Active.
              </span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Category Label / Badge Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Board Affiliation or Affiliation & Accreditation"
                  value={certifiedBoard.subtitle || ""}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, subtitle: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Board Name / Title</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE Affiliated School"
                  value={certifiedBoard.title}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Affiliation Code / Registration</label>
                <input
                  type="text"
                  placeholder="e.g. Affiliation No. 1530211 | School Code: 53123"
                  value={certifiedBoard.code}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, code: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Badge Icon / Logo Image</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload or choose from gallery"
                    value={certifiedBoard.badgeUrl}
                    onChange={(e) => setCertifiedBoard((p) => ({ ...p, badgeUrl: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-medium outline-none text-slate-500 cursor-not-allowed select-all"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1 shrink-0 rounded-xl bg-[#1a5d9c] px-3 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shadow-xs">
                    {uploadingSetting === "badgeUrl" ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>{uploadingSetting === "badgeUrl" ? "Uploading…" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleDirectSettingFileUpload("badgeUrl", file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setGalleryPickerField("badgeUrl")}
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <Image size={14} className="text-amber-500" />
                    <span>Gallery</span>
                  </button>
                  {Boolean(certifiedBoard.badgeUrl) && (
                    <button
                      type="button"
                      title="Clear badge logo"
                      onClick={() => setCertifiedBoard((p) => ({ ...p, badgeUrl: "" }))}
                      className="inline-flex items-center p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Affiliated to Central Board of Secondary Education, New Delhi"
                  value={certifiedBoard.description}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Action Button Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. View Affiliation Details"
                  value={certifiedBoard.buttonText || ""}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, buttonText: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <ActionLinkPicker
                label="Action Link URL"
                value={certifiedBoard.linkUrl}
                onChange={(val) => setCertifiedBoard((p) => ({ ...p, linkUrl: val }))}
                availablePages={brandingPageOptions}
                placeholder="e.g. /mandatory-disclosure or https://www.cbse.gov.in"
              />
            </div>

            {/* Live Footer Preview */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Eye size={14} /> Live Footer Card Preview
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    certifiedBoard.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {certifiedBoard.enabled ? "Visible in Footer" : "Hidden (Inactive)"}
                </span>
              </div>

              <div
                className={`relative flex items-start gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xs transition ${
                  !certifiedBoard.enabled ? "opacity-50 grayscale" : "border-amber-400/30"
                }`}
              >
                {!certifiedBoard.enabled && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-950/75 p-3 text-center backdrop-blur-2xs">
                    <EyeOff size={22} className="text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-rose-200">Card Currently Inactive</span>
                    <button
                      type="button"
                      onClick={() => setCertifiedBoard((p) => ({ ...p, enabled: true }))}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <Power size={11} /> Activate Card
                    </button>
                  </div>
                )}

                <div className="size-14 rounded-xl bg-white/10 p-1.5 shrink-0 flex items-center justify-center">
                  {certifiedBoard.badgeUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imageUrl(certifiedBoard.badgeUrl)} alt="" className="size-full object-contain" />
                  ) : (
                    <div className="grid size-11 place-items-center rounded-lg bg-amber-400/20 text-amber-300 font-bold text-xs">
                      <Award size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                      {certifiedBoard.subtitle || "Board Affiliation"}
                    </span>
                    <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                  </div>
                  <h4 className="mt-0.5 text-sm font-semibold text-white truncate">
                    {certifiedBoard.title || "(No Title Set)"}
                  </h4>
                  {Boolean(certifiedBoard.code) && (
                    <p className="mt-0.5 text-xs font-medium text-amber-300/90 truncate">
                      {certifiedBoard.code}
                    </p>
                  )}
                  {Boolean(certifiedBoard.description) && (
                    <p className="mt-1 text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {certifiedBoard.description}
                    </p>
                  )}
                  {Boolean(certifiedBoard.linkUrl) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                        {certifiedBoard.buttonText || "View Affiliation Details"} &rarr;
                      </span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-amber-200/90 border border-white/10">
                        Target: {certifiedBoard.linkUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-white/50 italic">
                Shows exact layout &amp; design as rendered in the website footer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Trust Board */}
      {activeTab === "trust" && (
        <div className="mt-5 space-y-4">
          {/* Card Control Bar: Active/Inactive Switch & Delete/Restore Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTrustBoard((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  trustBoard.enabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
                title="Toggle Active / Inactive status"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    trustBoard.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${trustBoard.enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-xs font-bold text-slate-800">
                  {trustBoard.enabled ? "Card Status: Active (Visible in Footer)" : "Card Status: Inactive / Disabled (Hidden from Footer)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrustBoard({ ...DEFAULT_TRUST_BOARD })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                title="Restore original Trust Board defaults"
              >
                <RotateCcw size={13} />
                <span>Restore Default</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear and disable Trust Board card from footer?")) {
                    setTrustBoard({
                      trustName: "",
                      regNo: "",
                      logoUrl: "",
                      description: "",
                      linkUrl: "",
                      buttonText: "",
                      enabled: false,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                title="Clear content and disable card"
              >
                <Trash2 size={13} />
                <span>Clear / Delete Card</span>
              </button>
            </div>
          </div>

          {!trustBoard.enabled && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
              <EyeOff size={16} className="text-amber-700 shrink-0" />
              <span>
                <strong>Card is Inactive / Disabled:</strong> This badge will <strong>not</strong> be displayed on the public website footer. Toggle the switch above to make it Active.
              </span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Trust Name</label>
                <input
                  type="text"
                  placeholder="e.g. K.S. Dalmia Education Trust"
                  value={trustBoard.trustName}
                  onChange={(e) => setTrustBoard((p) => ({ ...p, trustName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Registration / Sub-details</label>
                <input
                  type="text"
                  placeholder="e.g. Established under KS Dalmia Education Trust"
                  value={trustBoard.regNo}
                  onChange={(e) => setTrustBoard((p) => ({ ...p, regNo: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Trust Logo Image</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload or choose from gallery"
                    value={trustBoard.logoUrl}
                    onChange={(e) => setTrustBoard((p) => ({ ...p, logoUrl: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-medium outline-none text-slate-500 cursor-not-allowed select-all"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1 shrink-0 rounded-xl bg-[#1a5d9c] px-3 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shadow-xs">
                    {uploadingSetting === "trustLogoUrl" ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>{uploadingSetting === "trustLogoUrl" ? "Uploading…" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleDirectSettingFileUpload("trustLogoUrl", file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setGalleryPickerField("trustLogoUrl")}
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <Image size={14} className="text-amber-500" />
                    <span>Gallery</span>
                  </button>
                  {Boolean(trustBoard.logoUrl) && (
                    <button
                      type="button"
                      title="Clear trust logo"
                      onClick={() => setTrustBoard((p) => ({ ...p, logoUrl: "" }))}
                      className="inline-flex items-center p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dedicated to character building, academic excellence, and holistic personality development."
                  value={trustBoard.description}
                  onChange={(e) => setTrustBoard((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Action Button Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Learn About Trust"
                  value={trustBoard.buttonText || ""}
                  onChange={(e) => setTrustBoard((p) => ({ ...p, buttonText: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <ActionLinkPicker
                label="Action Link URL"
                value={trustBoard.linkUrl}
                onChange={(val) => setTrustBoard((p) => ({ ...p, linkUrl: val }))}
                availablePages={brandingPageOptions}
                placeholder="e.g. /about-us/school-establishment"
              />
            </div>

            {/* Live Footer Preview */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Eye size={14} /> Live Footer Card Preview
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    trustBoard.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {trustBoard.enabled ? "Visible in Footer" : "Hidden (Inactive)"}
                </span>
              </div>

              <div
                className={`relative flex items-start gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xs transition ${
                  !trustBoard.enabled ? "opacity-50 grayscale" : "border-amber-400/30"
                }`}
              >
                {!trustBoard.enabled && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-950/75 p-3 text-center backdrop-blur-2xs">
                    <EyeOff size={22} className="text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-rose-200">Card Currently Inactive</span>
                    <button
                      type="button"
                      onClick={() => setTrustBoard((p) => ({ ...p, enabled: true }))}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <Power size={11} /> Activate Card
                    </button>
                  </div>
                )}

                <div className="size-14 rounded-xl bg-white/10 p-1.5 shrink-0 flex items-center justify-center">
                  {trustBoard.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imageUrl(trustBoard.logoUrl)} alt="" className="size-full object-contain" />
                  ) : (
                    <div className="grid size-11 place-items-center rounded-lg bg-amber-400/20 text-amber-300 font-bold text-xs">
                      <Building2 size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">Trust Board</span>
                    <Building2 size={14} className="text-amber-400 shrink-0" />
                  </div>
                  <h4 className="mt-0.5 text-sm font-semibold text-white truncate">
                    {trustBoard.trustName || "(No Trust Name Set)"}
                  </h4>
                  {Boolean(trustBoard.regNo) && (
                    <p className="mt-0.5 text-xs font-medium text-amber-300/90 truncate">
                      {trustBoard.regNo}
                    </p>
                  )}
                  {Boolean(trustBoard.description) && (
                    <p className="mt-1 text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {trustBoard.description}
                    </p>
                  )}
                  {Boolean(trustBoard.linkUrl) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                        {trustBoard.buttonText || "Learn About Trust"} &rarr;
                      </span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-amber-200/90 border border-white/10">
                        Target: {trustBoard.linkUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-white/50 italic">
                Shows exact layout &amp; design as rendered in the website footer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Academic Partner - Commented out as requested (Preserved for easy restoration) */}
      {false && activeTab === "partner" && (
        <div className="mt-5 space-y-4">
          {/* Card Control Bar: Active/Inactive Switch & Delete/Restore Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAcademicPartner((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  academicPartner.enabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
                title="Toggle Active / Inactive status"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    academicPartner.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${academicPartner.enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-xs font-bold text-slate-800">
                  {academicPartner.enabled ? "Card Status: Active (Visible in Footer)" : "Card Status: Inactive / Disabled (Hidden from Footer)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAcademicPartner({ ...DEFAULT_ACADEMIC_PARTNER })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                title="Restore original Academic Partner defaults"
              >
                <RotateCcw size={13} />
                <span>Restore Default</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear and disable Academic Partner card from footer?")) {
                    setAcademicPartner({
                      title: "",
                      subtitle: "",
                      logoUrl: "",
                      description: "",
                      linkUrl: "",
                      buttonText: "",
                      enabled: false,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                title="Clear content and disable card"
              >
                <Trash2 size={13} />
                <span>Clear / Delete Card</span>
              </button>
            </div>
          </div>

          {!academicPartner.enabled && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
              <EyeOff size={16} className="text-amber-700 shrink-0" />
              <span>
                <strong>Card is Inactive / Disabled:</strong> This badge will <strong>not</strong> be displayed on the public website footer. Toggle the switch above to make it Active.
              </span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Partner Title</label>
                <input
                  type="text"
                  placeholder="e.g. Aakash Institute Partner"
                  value={academicPartner.title}
                  onChange={(e) => setAcademicPartner((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Our Academic Partner"
                  value={academicPartner.subtitle}
                  onChange={(e) => setAcademicPartner((p) => ({ ...p, subtitle: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Partner Logo Image</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload or choose from gallery"
                    value={academicPartner.logoUrl}
                    onChange={(e) => setAcademicPartner((p) => ({ ...p, logoUrl: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-medium outline-none text-slate-500 cursor-not-allowed select-all"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1 shrink-0 rounded-xl bg-[#1a5d9c] px-3 py-2 text-xs font-bold text-white hover:bg-[#102a4c] transition shadow-xs">
                    {uploadingSetting === "partnerLogoUrl" ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>{uploadingSetting === "partnerLogoUrl" ? "Uploading…" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleDirectSettingFileUpload("partnerLogoUrl", file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setGalleryPickerField("partnerLogoUrl")}
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <Image size={14} className="text-amber-500" />
                    <span>Gallery</span>
                  </button>
                  {Boolean(academicPartner.logoUrl) && (
                    <button
                      type="button"
                      title="Clear partner logo"
                      onClick={() => setAcademicPartner((p) => ({ ...p, logoUrl: "" }))}
                      className="inline-flex items-center p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Integrated coaching and foundation programs for NEET, IIT-JEE and competitive examinations."
                  value={academicPartner.description}
                  onChange={(e) => setAcademicPartner((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">Action Button Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Explore Courses"
                  value={academicPartner.buttonText || ""}
                  onChange={(e) => setAcademicPartner((p) => ({ ...p, buttonText: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
              </div>
              <ActionLinkPicker
                label="Action Link URL"
                value={academicPartner.linkUrl}
                onChange={(val) => setAcademicPartner((p) => ({ ...p, linkUrl: val }))}
                availablePages={brandingPageOptions}
                placeholder="e.g. /academics/courses-offered"
              />
              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a5d9c] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#124c81] transition cursor-pointer disabled:opacity-60"
                >
                  {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{saving ? "Saving Changes…" : "Save Changes"}</span>
                </button>
              </div>
            </div>

            {/* Live Footer Preview */}
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Eye size={14} /> Live Footer Card Preview
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    academicPartner.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {academicPartner.enabled ? "Visible in Footer" : "Hidden (Inactive)"}
                </span>
              </div>

              <div
                className={`relative flex items-start gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xs transition ${
                  !academicPartner.enabled ? "opacity-50 grayscale" : "border-amber-400/30"
                }`}
              >
                {!academicPartner.enabled && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-950/75 p-3 text-center backdrop-blur-2xs">
                    <EyeOff size={22} className="text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-rose-200">Card Currently Inactive</span>
                    <button
                      type="button"
                      onClick={() => setAcademicPartner((p) => ({ ...p, enabled: true }))}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <Power size={11} /> Activate Card
                    </button>
                  </div>
                )}

                <div className="size-14 rounded-xl bg-white/10 p-1.5 shrink-0 flex items-center justify-center">
                  {academicPartner.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imageUrl(academicPartner.logoUrl)} alt="" className="size-full object-contain" />
                  ) : (
                    <div className="grid size-11 place-items-center rounded-lg bg-amber-400/20 text-amber-300 font-bold text-xs">
                      <GraduationCap size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                      {academicPartner.subtitle || "Our Academic Partner"}
                    </span>
                    <i className="bi bi-briefcase text-amber-400 text-[14px]"></i>
                  </div>
                  <h4 className="mt-0.5 text-sm font-semibold text-white truncate">
                    {academicPartner.title || "(No Partner Title Set)"}
                  </h4>
                  {Boolean(academicPartner.description) && (
                    <p className="mt-1 text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {academicPartner.description}
                    </p>
                  )}
                  {Boolean(academicPartner.linkUrl) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                        {academicPartner.buttonText || "Explore Courses"} &rarr;
                      </span>
                      <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-amber-200/90 border border-white/10">
                        Target: {academicPartner.linkUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-white/50 italic">
                Shows exact layout &amp; design as rendered in the website footer.
              </p>
            </div>
          </div>
        </div>
      )}

      {galleryPickerField && (
        <CloudinaryGalleryModal
          isOpen={Boolean(galleryPickerField)}
          onClose={() => setGalleryPickerField(null)}
          onSelectImage={(url: string) => {
            if (galleryPickerField === "logoUrl") setSiteLogo((p) => ({ ...p, logoUrl: url }));
            if (galleryPickerField === "badgeUrl") setCertifiedBoard((p) => ({ ...p, badgeUrl: url }));
            if (galleryPickerField === "trustLogoUrl") setTrustBoard((p) => ({ ...p, logoUrl: url }));
            if (galleryPickerField === "partnerLogoUrl") setAcademicPartner((p) => ({ ...p, logoUrl: url }));
            setGalleryPickerField(null);
          }}
        />
      )}
    </div>
  );
}

export function ResourceView({
  resource,
  items,
  loading,
  isSearching: isSearchingProp,
  deletingId,
  query,
  meta,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
  canCreate: canCreateProp = true,
  canEdit: canEditProp = true,
  canDelete: canDeleteProp = true,
  allMenuItems,
  token,
}: {
  resource: Resource;
  items: RecordItem[];
  loading: boolean;
  isSearching?: boolean;
  deletingId?: string | null;
  query: QueryParamsState;
  meta: PaginationMeta | undefined;
  onQueryChange: (params: Partial<QueryParamsState>) => Promise<void> | void;
  onCreate: () => void;
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  allMenuItems?: RecordItem[];
  token?: string;
}) {
  const isMediaResource = resource.key === "gallery";
  const isMenuResource = resource.key === "menu-items";
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMediaResource ? "grid" : "list");
  const [menuViewMode, setMenuViewMode] = useState<"table" | "flow">("table");
  const [activeAlbum, setActiveAlbum] = useState<string>("All");
  const [detailItem, setDetailItem] = useState<RecordItem | null>(null);
  const [localSearch, setLocalSearch] = useState(query.search || "");
  const [internalSearching, setInternalSearching] = useState(false);
  const isSearching = Boolean(isSearchingProp || internalSearching);

  useEffect(() => {
    if (detailItem && !items.some((i) => itemId(i) === itemId(detailItem))) {
      setDetailItem(null);
    }
  }, [items, detailItem]);

  // Sync localSearch when switching between different resources
  useEffect(() => {
    setLocalSearch(query.search || "");
  }, [resource.key]);

  // Sync when search is cleared externally
  useEffect(() => {
    if (!query.search && localSearch !== "") {
      setLocalSearch("");
    }
  }, [query.search]);

  // Create new control is commented out for reviews as they are submitted publicly from the website
  const canCreate = canCreateProp && Object.keys(resource.inputs).length > 0 && resource.key !== "reviews";
  const canEdit = canEditProp && Object.keys(resource.inputs).length > 0;
  const canDelete = canDeleteProp;

  const filtersConfig = RESOURCE_FILTERS[resource.key] || [];

  const totalItems = meta?.total ?? items.length;
  const currentPage = meta?.page ?? query.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const limit = meta?.limit ?? query.limit ?? 8;
  const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endItem = Math.min(currentPage * limit, totalItems);

  const getMediaUrl = (item: RecordItem): string => {
    const val =
      item.fileUrl ||
      item.fileUrls ||
      item.url ||
      item.secure_url ||
      item.path ||
      item.attachmentUrl ||
      item.avatar ||
      item.src;
    let raw = "";
    if (Array.isArray(val)) {
      raw = String(val[0] || "");
    } else {
      raw = String(val || "");
    }
    if (!raw) {
      return "";
    }
    return imageUrl(raw);
  };

  const handleSearchSubmit = useCallback(async (customValue?: string) => {
    const val = typeof customValue === "string" ? customValue : localSearch;
    setInternalSearching(true);
    try {
      await onQueryChange({ search: val.trim(), page: 1 });
    } finally {
      setInternalSearching(false);
    }
  }, [localSearch, onQueryChange]);

  const handleClearSearch = useCallback(async () => {
    setLocalSearch("");
    setInternalSearching(true);
    try {
      await onQueryChange({ search: "", page: 1 });
    } finally {
      setInternalSearching(false);
    }
  }, [onQueryChange]);

  // Debounced live search: auto-searches after 450ms of user typing without breaking input flow
  useEffect(() => {
    const activeSearch = (query.search || "").trim();
    const currentInput = localSearch.trim();

    if (currentInput === activeSearch) {
      return;
    }

    const timer = setTimeout(() => {
      void handleSearchSubmit(localSearch);
    }, 450);

    return () => clearTimeout(timer);
  }, [localSearch, query.search, handleSearchSubmit]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#102a4c]">{resource.label}</h2>
          <p className="mt-1 text-slate-500">{resource.description}</p>
        </div>
        {/* Create new control - commented out for reviews page */}
        {canCreate && resource.key !== "reviews" && (
          <button
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a5d9c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#124c81] cursor-pointer"
          >
            <Plus size={17} /> {resource.key === "school-settings" ? "Add / Edit Setting" : `Add ${resource.label.endsWith("s") ? resource.label.slice(0, -1) : resource.label}`}
          </button>
        )}
      </div>

      {resource.key === "school-settings" && (
        <HeaderFooterSettingsCard
          token={token || ""}
          items={items}
          onSaveComplete={() => onQueryChange({})}
          allMenuItems={allMenuItems}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Header Controls */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 p-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Count Badge & Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs shrink-0">
              <span className="flex h-2 w-2 rounded-full bg-[#1a5d9c]"></span>
              <span>{totalItems}</span>
              <span className="capitalize font-medium text-slate-600">
                {query.search ? `found for "${query.search}"` : resource.label.toLowerCase()}
              </span>
            </div>

            {filtersConfig.map((filter) => {
              const currentValue = query.filterKey === filter.key ? query.filterValue || "All" : "All";
              return (
                <div
                  key={filter.key}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs shadow-2xs transition hover:border-slate-300 focus-within:border-[#1a5d9c] shrink-0"
                >
                  <SlidersHorizontal size={13} className="text-[#1a5d9c] shrink-0" />
                  <span className="font-semibold text-slate-500 shrink-0">{filter.label}:</span>
                  <select
                    value={currentValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "All") {
                        onQueryChange({ filterKey: undefined, filterValue: undefined, page: 1 });
                      } else {
                        onQueryChange({ filterKey: filter.key, filterValue: val, page: 1 });
                      }
                    }}
                    className="bg-transparent font-bold text-[#102a4c] outline-none cursor-pointer pr-1"
                  >
                    {filter.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Right: Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearchSubmit();
                  }
                }}
                placeholder={`Search ${resource.label.toLowerCase()}...`}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs outline-none shadow-2xs transition-all focus:border-[#1a5d9c] focus:ring-1 focus:ring-[#1a5d9c]/30"
              />
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1a5d9c] transition cursor-pointer"
                title="Search"
              >
                <Search size={14} />
              </button>
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {isMediaResource && (
              <div className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50/90 p-1 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${viewMode === "grid" ? "bg-white text-[#1a5d9c] shadow-2xs border border-blue-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <Grid size={14} /> Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${viewMode === "list" ? "bg-white text-[#1a5d9c] shadow-2xs border border-blue-200" : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <List size={14} /> Table
                </button>
              </div>
            )}

            {isMenuResource && (
              <div className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50/90 p-1 shrink-0">
                <button
                  onClick={() => setMenuViewMode("table")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${menuViewMode === "table" ? "bg-white text-[#1a5d9c] shadow-2xs border border-blue-200" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <List size={14} /> Table View
                </button>
                <button
                  onClick={() => setMenuViewMode("flow")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${menuViewMode === "flow" ? "bg-white text-[#1a5d9c] shadow-2xs border border-blue-200" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Workflow size={14} /> Hierarchy Wire Flow
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content View */}
        {viewMode === "grid" && isMediaResource ? (
          <div className="p-6">
            {(loading || isSearching) ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5">
                <LoaderCircle className="mx-auto animate-spin text-[#1a5d9c]" size={26} />
                <span className="text-xs font-semibold text-slate-500">
                  {localSearch.trim() || query.search
                    ? `Searching ${resource.label.toLowerCase()}…`
                    : `Loading ${resource.label.toLowerCase()}…`}
                </span>
              </div>
            ) : items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const mediaUrl = getMediaUrl(item);
                  return (
                    <div
                      key={itemId(item)}
                      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:border-slate-300 hover:shadow-md ${
                        deletingId === itemId(item) ? "opacity-50 pointer-events-none ring-2 ring-red-300" : ""
                      }`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                        <SmartFileThumbnail
                          url={mediaUrl}
                          alt={String(item.eventName || item.title || item.name || "Asset")}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 transition group-hover:opacity-100 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="rounded-xl bg-white/90 p-2 text-slate-800 shadow-md hover:bg-white hover:scale-105 transition cursor-pointer"
                            title="Inspect item"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && (
                            <button
                              disabled={Boolean(deletingId)}
                              onClick={() => onEdit(item)}
                              className="rounded-xl bg-white/90 p-2 text-[#1a5d9c] shadow-md hover:bg-white hover:scale-105 transition disabled:opacity-40 cursor-pointer"
                              title="Edit item"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              disabled={Boolean(deletingId)}
                              onClick={() => onDelete(item)}
                              className={`rounded-xl bg-white/90 p-2 shadow-md transition ${
                                deletingId === itemId(item)
                                  ? "text-red-600 cursor-wait ring-1 ring-red-300"
                                  : "text-red-600 hover:bg-white hover:scale-105 disabled:opacity-40 cursor-pointer"
                              }`}
                              title={deletingId === itemId(item) ? "Deleting item..." : "Delete item"}
                            >
                              {deletingId === itemId(item) ? (
                                <LoaderCircle size={16} className="animate-spin text-red-600" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="truncate text-xs font-bold text-[#102a4c]">
                          {String(item.eventName || item.title || item.name || item.originalname || "Untitled Asset")}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {String(item.eventType || item.category || "General")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                text={
                  query.search
                    ? `No ${resource.label.toLowerCase()} found matching "${query.search}"`
                    : `No ${resource.label.toLowerCase()} found`
                }
                actionLabel={query.search ? "Clear search" : undefined}
                onAction={query.search ? handleClearSearch : undefined}
              />
            )}
          </div>
        ) : isMenuResource && menuViewMode === "flow" ? (
          (loading || isSearching) ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5">
              <LoaderCircle className="mx-auto animate-spin text-[#1a5d9c]" size={26} />
              <span className="text-xs font-semibold text-slate-500">
                Searching navigation menu…
              </span>
            </div>
          ) : (
            <MenuHierarchyFlow
              items={allMenuItems && allMenuItems.length > 0 ? allMenuItems : items}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
              onTogglePublished={canEdit ? async (item, isPub) => {
                try {
                  await axios.patch(
                    `${API_URL}/${resourcePath[resource.key]}/${itemId(item)}`,
                    { isPublished: isPub },
                    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                  );
                  onQueryChange({});
                } catch (err) {
                  console.error("Failed to update isPublished", err);
                }
              } : undefined}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {resource.fields.map((field) => (
                    <th
                      key={field}
                      className={`whitespace-nowrap px-5 py-3.5 ${
                        field === "status" || field === "isPublished" || field === "isActive" || field === "isApproved" ? "text-center" : ""
                      }`}
                    >
                      {field === "isPublished" ? "Published" : field === "isActive" ? "Status" : field === "isApproved" ? "Approval" : field}
                    </th>
                  ))}
                  {(canEdit || canDelete || isMediaResource) && (
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(loading || isSearching) ? (
                  <tr>
                    <td colSpan={resource.fields.length + 1} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <LoaderCircle className="mx-auto animate-spin text-[#1a5d9c]" size={26} />
                        <span className="text-xs font-semibold text-slate-500">
                          {localSearch.trim() || query.search
                            ? `Searching ${resource.label.toLowerCase()}…`
                            : `Loading ${resource.label.toLowerCase()}…`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const isSuperUser = resource.key === "users" && isSuperAdminRole(item.role);
                    const rowPreviewUrl = getPreviewUrl(item);
                    return (
                      <tr
                        key={itemId(item)}
                        className={`transition ${
                          deletingId === itemId(item) ? "bg-red-50/40 opacity-50 pointer-events-none" : "hover:bg-slate-50/80"
                        }`}
                      >
                        {resource.fields.map((field) => {
                          const allContextItems =
                            resource.key === "menu-items" && allMenuItems && allMenuItems.length > 0
                              ? allMenuItems
                              : items;
                          const formatted = formatValue(field, item[field], item, allContextItems);
                          if (field === "role") {
                            return (
                              <td key={field} className="max-w-[200px] px-5 py-4 text-sm text-slate-700">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1a5d9c]">
                                  {formatted}
                                </span>
                              </td>
                            );
                          }

                          if (field === "name") {
                            const avatarUrl = item.avatar || item.profileImageUrl || item.photo;
                            return (
                              <td key={field} className="max-w-[240px] px-5 py-4 text-sm text-slate-900 font-bold">
                                <div className="flex items-center gap-2.5">
                                  {avatarUrl ? (
                                    <img
                                      src={imageUrl(String(avatarUrl))}
                                      alt={String(item.name || "Avatar")}
                                      className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : resource.key === "students" || resource.key === "staff" ? (
                                    <div className="h-8 w-8 rounded-full bg-[#102a4c] text-[#f4bd4f] font-bold text-[11px] flex items-center justify-center shrink-0 border border-white/10">
                                      {String(item.name || "").substring(0, 2).toUpperCase() || "?"}
                                    </div>
                                  ) : null}
                                  <span className="truncate">{formatted}</span>
                                </div>
                              </td>
                            );
                          }

                          if (field === "status") {
                            const statusStr = String(item[field] || "Active");
                            const sLower = statusStr.toLowerCase();
                            const isAct = sLower === "active" || sLower === "published" || sLower === "approved";
                            const isMid = sLower === "on leave" || sLower === "in progress" || sLower === "pending";
                            const isOff = sLower === "inactive" || sLower === "draft" || sLower === "closed" || sLower === "rejected";

                            const statusOptions = resource.options?.status || (
                              resource.key === "students"
                                ? ["Active", "Inactive"]
                                : resource.key === "staff"
                                ? ["Active", "On Leave", "Inactive"]
                                : []
                            );

                            return (
                              <td key={field} className="whitespace-nowrap px-5 py-4 text-center">
                                {canEdit && statusOptions.length > 0 ? (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={statusStr}
                                      onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        try {
                                          await axios.patch(
                                            `${API_URL}/${resourcePath[resource.key]}/${itemId(item)}`,
                                            { status: newStatus },
                                            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                          );
                                          onQueryChange({});
                                        } catch (err) {
                                          console.error("Failed to update status", err);
                                        }
                                      }}
                                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none ${
                                        isAct
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                          : isMid
                                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80"
                                          : isOff
                                          ? "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                      }`}
                                      title="Click to change status"
                                    >
                                      {statusOptions.map((opt) => (
                                        <option key={opt} value={opt} className="text-slate-900 bg-white font-semibold">
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                    <span
                                      className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                        isAct
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : isMid
                                          ? "bg-amber-500 shadow-xs shadow-amber-400"
                                          : isOff
                                          ? "bg-rose-500 shadow-xs shadow-rose-400"
                                          : "bg-slate-400"
                                      }`}
                                    />
                                    <ChevronDown
                                      size={12}
                                      className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
                                        isAct ? "text-emerald-600" : isMid ? "text-amber-600" : isOff ? "text-rose-600" : "text-slate-500"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs tracking-wide ${
                                      isAct
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : isMid
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : isOff
                                        ? "border-rose-200 bg-rose-50 text-rose-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${
                                        isAct
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : isMid
                                          ? "bg-amber-500 shadow-xs shadow-amber-400"
                                          : isOff
                                          ? "bg-rose-500 shadow-xs shadow-rose-400"
                                          : "bg-slate-400"
                                      }`}
                                    />
                                    <span>{statusStr}</span>
                                  </span>
                                )}
                              </td>
                            );
                          }

                          if (field === "isPublished") {
                            const isPub = item[field] === true || String(item[field]) === "true";
                            const pubStr = isPub ? "Published" : "Draft";

                            return (
                              <td key={field} className="whitespace-nowrap px-5 py-4 text-center">
                                {canEdit ? (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={pubStr}
                                      onChange={async (e) => {
                                        const newPublished = e.target.value === "Published";
                                        try {
                                          await axios.patch(
                                            `${API_URL}/${resourcePath[resource.key]}/${itemId(item)}`,
                                            { isPublished: newPublished },
                                            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                          );
                                          onQueryChange({});
                                        } catch (err) {
                                          console.error("Failed to update isPublished", err);
                                        }
                                      }}
                                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none ${
                                        isPub
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                          : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                                      }`}
                                      title="Click to change published status"
                                    >
                                      <option value="Published" className="text-slate-900 bg-white font-semibold">
                                        Published
                                      </option>
                                      <option value="Draft" className="text-slate-900 bg-white font-semibold">
                                        Draft
                                      </option>
                                    </select>
                                    <span
                                      className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                        isPub
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-rose-500 shadow-xs shadow-rose-400"
                                      }`}
                                    />
                                    <ChevronDown
                                      size={12}
                                      className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
                                        isPub ? "text-emerald-600" : "text-rose-600"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs tracking-wide ${
                                      isPub
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-rose-200 bg-rose-50 text-rose-800"
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${
                                        isPub
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-rose-500 shadow-xs shadow-rose-400"
                                      }`}
                                    />
                                    <span>{pubStr}</span>
                                  </span>
                                )}
                              </td>
                            );
                          }

                          if (field === "isActive") {
                            const isAct = item[field] === true || String(item[field]) === "true" || String(item[field]).toLowerCase() === "active";
                            const actStr = isAct ? "Active" : "Inactive";

                            return (
                              <td key={field} className="whitespace-nowrap px-5 py-4 text-center">
                                {canEdit ? (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={actStr}
                                      onChange={async (e) => {
                                        const newActive = e.target.value === "Active";
                                        try {
                                          await axios.patch(
                                            `${API_URL}/${resourcePath[resource.key]}/${itemId(item)}`,
                                            { isActive: newActive },
                                            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                          );
                                          onQueryChange({});
                                        } catch (err) {
                                          console.error("Failed to update isActive", err);
                                        }
                                      }}
                                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none ${
                                        isAct
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                          : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                                      }`}
                                      title="Click to change status"
                                    >
                                      <option value="Active" className="text-slate-900 bg-white font-semibold">
                                        Active
                                      </option>
                                      <option value="Inactive" className="text-slate-900 bg-white font-semibold">
                                        Inactive
                                      </option>
                                    </select>
                                    <span
                                      className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                        isAct
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-rose-500 shadow-xs shadow-rose-400"
                                      }`}
                                    />
                                    <ChevronDown
                                      size={12}
                                      className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
                                        isAct ? "text-emerald-600" : "text-rose-600"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs tracking-wide ${
                                      isAct
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-rose-200 bg-rose-50 text-rose-800"
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${
                                        isAct
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-rose-500 shadow-xs shadow-rose-400"
                                      }`}
                                    />
                                    <span>{actStr}</span>
                                  </span>
                                )}
                              </td>
                            );
                          }

                          if (field === "isApproved") {
                            const isApp = item[field] === true || String(item[field]) === "true";
                            const appStr = isApp ? "Approved" : "Pending";

                            return (
                              <td key={field} className="whitespace-nowrap px-5 py-4 text-center">
                                {canEdit ? (
                                  <div className="relative inline-flex items-center">
                                    <select
                                      value={appStr}
                                      onChange={async (e) => {
                                        const newApproved = e.target.value === "Approved";
                                        try {
                                          await axios.patch(
                                            `${API_URL}/${resourcePath[resource.key]}/${itemId(item)}`,
                                            { isApproved: newApproved },
                                            { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                          );
                                          onQueryChange({});
                                        } catch (err) {
                                          console.error("Failed to update isApproved", err);
                                        }
                                      }}
                                      className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none ${
                                        isApp
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                          : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80"
                                      }`}
                                      title="Click to change approval status"
                                    >
                                      <option value="Approved" className="text-slate-900 bg-white font-semibold">
                                        Approved
                                      </option>
                                      <option value="Pending" className="text-slate-900 bg-white font-semibold">
                                        Pending
                                      </option>
                                    </select>
                                    <span
                                      className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                        isApp
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-amber-500 shadow-xs shadow-amber-400"
                                      }`}
                                    />
                                    <ChevronDown
                                      size={12}
                                      className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${
                                        isApp ? "text-emerald-600" : "text-amber-600"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs tracking-wide ${
                                      isApp
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${
                                        isApp
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                          : "bg-amber-500 shadow-xs shadow-amber-400"
                                      }`}
                                    />
                                    <span>{appStr}</span>
                                  </span>
                                )}
                              </td>
                            );
                          }

                          return (
                            <td key={field} className="max-w-[220px] px-5 py-4 text-sm text-slate-600">
                              <span
                                className={
                                  field === "isRead"
                                    ? `rounded-full px-2.5 py-1 text-xs font-bold ${item[field]
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                                    }`
                                    : typeof item[field] === "boolean"
                                      ? `rounded-full px-2.5 py-1 text-xs font-bold ${item[field] ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                      }`
                                      : ""
                                }
                              >
                                {formatted}
                              </span>
                            </td>
                          );
                        })}
                        {(() => {
                          if (!canEdit && !canDelete && !isMediaResource && !rowPreviewUrl) {
                            return null;
                          }

                          return (
                            <td className="whitespace-nowrap px-5 py-4">
                              <div className="flex items-center justify-end gap-1">
                              {rowPreviewUrl && (
                                <a
                                  href={rowPreviewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                  title="Preview live page in new tab"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                              <button
                                onClick={() => setDetailItem(item)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c] cursor-pointer"
                                title={item.key === "site_datasource" ? "Preview complete home site layout" : "View details"}
                              >
                                <Eye size={16} />
                              </button>
                              {canEdit && (
                                <button
                                  disabled={Boolean(deletingId)}
                                  onClick={() => onEdit(item)}
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c] disabled:opacity-40 cursor-pointer"
                                  title="Edit record"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {canDelete && (
                                (isSuperUser || (resource.key === "school-settings" && item.key === "site_datasource")) ? (
                                  <button
                                    disabled
                                    className="rounded-lg p-2 text-slate-300 cursor-not-allowed"
                                    title={resource.key === "school-settings" ? "Core site datasource setting cannot be deleted" : "Super Admin accounts cannot be deleted"}
                                  >
                                    <Lock size={16} />
                                  </button>
                                ) : (
                                  <button
                                    disabled={Boolean(deletingId)}
                                    onClick={() => onDelete(item)}
                                    className={`rounded-lg p-2 transition ${
                                      deletingId === itemId(item)
                                        ? "bg-red-50 text-red-600 cursor-wait ring-1 ring-red-300"
                                        : "text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 cursor-pointer"
                                    }`}
                                    title={deletingId === itemId(item) ? "Deleting record..." : "Delete record"}
                                  >
                                    {deletingId === itemId(item) ? (
                                      <LoaderCircle size={16} className="animate-spin text-red-600" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        );
                      })()}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={resource.fields.length + 1}>
                      <Empty
                        text={
                          query.search
                            ? `No ${resource.label.toLowerCase()} found matching "${query.search}"`
                            : `No ${resource.label.toLowerCase()} found`
                        }
                        actionLabel={query.search ? "Clear search" : undefined}
                        onAction={query.search ? handleClearSearch : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination Toolbar */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            <span>
              Showing {startItem}–{endItem} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={limit}
                onChange={(e) => onQueryChange({ limit: Number(e.target.value), page: 1 })}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500 (All)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={meta ? !meta.hasPrevPage : currentPage <= 1}
              onClick={() => onQueryChange({ page: Math.max(1, currentPage - 1) })}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={15} /> Previous
            </button>

            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#102a4c] shadow-2xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={meta ? !meta.hasNextPage : currentPage >= totalPages}
              onClick={() => onQueryChange({ page: currentPage + 1 })}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {detailItem && (
        detailItem.key === "site_datasource" ? (
          <HomePreviewModal onClose={() => setDetailItem(null)} />
        ) : (
          <MediaDetailDialog
            item={detailItem}
            resource={resource}
            isDeleting={Boolean(deletingId && detailItem && deletingId === itemId(detailItem))}
            onClose={() => setDetailItem(null)}
            onEdit={canEdit ? () => onEdit(detailItem) : undefined}
            onDelete={canDelete && !(resource.key === "users" && isSuperAdminRole(detailItem.role)) ? () => onDelete(detailItem) : undefined}
          />
        )
      )}
    </div>
  );
}
