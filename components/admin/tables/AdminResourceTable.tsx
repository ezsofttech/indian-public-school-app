"use client";

import { useState, useMemo, useEffect } from "react";
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
  LoaderCircle,
  UploadCloud,
  Check,
  X,
  Save,
  Crown,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { DEFAULT_LOGO, DEFAULT_SECONDARY_LOGO, imageUrl, isBannerLogoUrl } from "@/lib/site-data";
import { RecordItem, Resource, PaginationMeta, QueryParamsState } from "../types/admin.types";
import { API_URL } from "../config/admin.config";
import { isSuperAdminRole, itemId, formatValue, getPreviewUrl } from "../utils/admin.helpers";
import { MediaDetailDialog } from "../modals/MediaDetailDialog";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-12 text-center text-sm text-slate-400">{text}</div>;
}

export function MenuHierarchyFlow({
  items,
  onEdit,
  onDelete,
}: {
  items: RecordItem[];
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
}) {
  const itemMap = new Map<string, RecordItem & { children: any[] }>();

  items.forEach((item) => {
    const id = itemId(item);
    itemMap.set(id, { ...item, children: [] });
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
              <div className="flex items-center gap-1 shrink-0">
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
                  onClick={() => onDelete(root)}
                  className="rounded-lg p-1.5 text-red-300 hover:bg-white/10 hover:text-red-200"
                  title="Delete Root Item"
                >
                  <Trash2 size={15} />
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
                      <div className="flex items-center gap-1 shrink-0">
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
                          onClick={() => onDelete(sub)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete Sub Item"
                        >
                          <Trash2 size={14} />
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
                              <div className="flex items-center gap-1 shrink-0">
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
                                  onClick={() => onDelete(subSub)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  title="Delete Sub-item"
                                >
                                  <Trash2 size={13} />
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
    { label: "Status", key: "status", options: ["All", "Pending", "Approved", "Rejected"] },
  ],
  inquiries: [
    { label: "Status", key: "status", options: ["All", "New", "In Progress", "Contacted", "Resolved", "Closed"] },
  ],
  gallery: [
    { label: "Event Type", key: "eventType", options: ["All", "General", "Settings", "AdmissionDocuments", "Documents", "News", "Campus", "Events", "Sports", "Activities", "Hostel", "Arts", "Awareness", "Celebration", "Academic", "Infrastructure"] },
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

export function HeaderFooterSettingsCard({
  token,
  items,
  onSaveComplete,
}: {
  token: string;
  items: RecordItem[];
  onSaveComplete: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"logo" | "certified" | "trust" | "partner">("logo");
  const [galleryPickerField, setGalleryPickerField] = useState<"logoUrl" | "badgeUrl" | "trustLogoUrl" | "partnerLogoUrl" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const siteDsItem = useMemo(() => items.find((i) => i.key === "site_datasource"), [items]);
  const logoItem = useMemo(() => items.find((i) => i.key === "site_logo"), [items]);
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

  const [certifiedBoard, setCertifiedBoard] = useState({
    title: "CBSE Affiliated School",
    code: "Affiliation No. 1530211 | School Code: 53123",
    badgeUrl: "",
    description: "Affiliated to Central Board of Secondary Education, New Delhi",
    linkUrl: "/mandatory-disclosure",
    enabled: true,
  });

  const [trustBoard, setTrustBoard] = useState({
    trustName: "K.S. Dalmia Education Trust",
    regNo: "Established under KS Dalmia Education Trust",
    logoUrl: "",
    description: "Dedicated to character building, academic excellence, and holistic personality development.",
    linkUrl: "/about-us/school-establishment",
    enabled: true,
  });

  const [academicPartner, setAcademicPartner] = useState({
    title: "Aakash Institute Partner",
    subtitle: "Our Academic Partner",
    logoUrl: "/assets/Settings/Logos/AakashFoundationLogo.png",
    description: "Integrated coaching and foundation programs for NEET, IIT-JEE and competitive examinations.",
    linkUrl: "/academics/courses-offered",
    enabled: true,
  });

  const [fetchedDsValue, setFetchedDsValue] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadFullSettings = async () => {
      let rawDsVal: any = siteDsItem?.value;
      if (!rawDsVal) {
        try {
          const res = await axios.get(`${API_URL}/school-settings/key/site_datasource`);
          const itemData = res.data?.data ?? res.data;
          if (itemData?.value) {
            rawDsVal = itemData.value;
          }
        } catch {
          try {
            const res2 = await axios.get(`${API_URL}/regarding/datasource`);
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
      } else if (logoItem?.value) {
        let lVal = logoItem.value;
        if (typeof lVal === "string") { try { lVal = JSON.parse(lVal); } catch { } }
        if (lVal && typeof lVal === "object") setSiteLogo((prev) => ({ ...prev, ...(lVal as object) }));
      }

      const certVal = homeIdentity.certified_board || dsVal.certified_board;
      if (certVal && typeof certVal === "object") {
        setCertifiedBoard((prev) => ({ ...prev, ...(certVal as object) }));
      } else if (certItem?.value) {
        let cVal = certItem.value;
        if (typeof cVal === "string") { try { cVal = JSON.parse(cVal); } catch { } }
        if (cVal && typeof cVal === "object") setCertifiedBoard((prev) => ({ ...prev, ...(cVal as object) }));
      }

      const trustVal = homeIdentity.trust_board || dsVal.trust_board;
      if (trustVal && typeof trustVal === "object") {
        setTrustBoard((prev) => ({ ...prev, ...(trustVal as object) }));
      } else if (trustItem?.value) {
        let tVal = trustItem.value;
        if (typeof tVal === "string") { try { tVal = JSON.parse(tVal); } catch { } }
        if (tVal && typeof tVal === "object") setTrustBoard((prev) => ({ ...prev, ...(tVal as object) }));
      }

      const partnerVal = homeIdentity.academic_partner || dsVal.academic_partner;
      if (partnerVal && typeof partnerVal === "object") {
        setAcademicPartner((prev) => ({ ...prev, ...(partnerVal as object) }));
      } else if (partnerItem?.value) {
        let pVal = partnerItem.value;
        if (typeof pVal === "string") { try { pVal = JSON.parse(pVal); } catch { } }
        if (pVal && typeof pVal === "object") setAcademicPartner((prev) => ({ ...prev, ...(pVal as object) }));
      }
    };

    loadFullSettings();
    return () => { isMounted = false; };
  }, [siteDsItem, logoItem, certItem, trustItem, partnerItem]);

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

      const identityObj = {
        ...(firstHome.identity || {}),
        header: currentHeader,
        footer: currentFooter,
        site_logo: siteLogo,
        certified_board: certifiedBoard,
        trust_board: trustBoard,
        academic_partner: academicPartner,
      };
      firstHome.identity = identityObj;
      homeList[0] = firstHome;

      const finalVal = {
        ...currentDsVal,
        header: currentHeader,
        footer: currentFooter,
        site_logo: siteLogo,
        certified_board: certifiedBoard,
        trust_board: trustBoard,
        academic_partner: academicPartner,
        home: homeList,
      };

      await axios.post(
        `${API_URL}/school-settings`,
        {
          key: "site_datasource",
          category: "Content",
          description: "Full home page and website section layout configuration datasource",
          value: finalVal,
          isPublic: true,
          status: "Active",
        },
        { headers }
      );

      try {
        await axios.post(
          `${API_URL}/school-settings`,
          {
            key: "site_logo",
            category: "Branding",
            description: "School logo and header branding titles",
            value: siteLogo,
            isPublic: true,
            status: "Active",
          },
          { headers }
        );
      } catch (e) {
        console.warn("Syncing standalone site_logo skipped or failed:", e);
      }

      setMessage("Header & Footer identity settings saved successfully inside site_datasource!");
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
            Configure School Logo, Certified Board info, and Trust Board details. Applied automatically if present.
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
          <span><i className="bi bi-cloud-check-fill"></i> {message}</span>
          <button type="button" onClick={() => setMessage("")}><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 p-3.5 text-xs font-bold text-red-800 border border-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("logo")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "logo" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <UploadCloud size={15} /> School Logo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("certified")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "certified" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <Crown size={15} /> Certified Company Board
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trust")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "trust" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <ShieldCheck size={15} /> Trust Board
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("partner")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === "partner" ? "bg-[#102a4c] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <i className="bi bi-briefcase text-[14px]"></i> Academic Partner
        </button>
      </div>

      {/* Tab 1: Logo */}
      {activeTab === "logo" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Logo Image URL</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/... or /assets/logo.png"
                  value={siteLogo.logoUrl}
                  onChange={(e) => setSiteLogo((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("logoUrl")}
                  className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <UploadCloud size={14} /> Gallery
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Live Header Preview</span>
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-sm border border-slate-200 min-w-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(siteLogo.logoUrl || DEFAULT_LOGO)}
                alt="Main Logo"
                className="h-8 md:h-10 w-auto object-contain"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = imageUrl(DEFAULT_LOGO); }}
              />
              <div className="h-6 w-[1.5px] bg-slate-300 rounded-full" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(siteLogo.secondaryLogoUrl || DEFAULT_SECONDARY_LOGO)}
                alt="Aakash Foundation Logo"
                className="h-7 md:h-8 w-auto object-contain"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = imageUrl(DEFAULT_SECONDARY_LOGO); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Certified Board */}
      {activeTab === "certified" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Board Name / Title</label>
              <input
                type="text"
                value={certifiedBoard.title}
                onChange={(e) => setCertifiedBoard((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Affiliation Code / Registration</label>
              <input
                type="text"
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
                  value={certifiedBoard.badgeUrl}
                  onChange={(e) => setCertifiedBoard((p) => ({ ...p, badgeUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("badgeUrl")}
                  className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <UploadCloud size={14} /> Gallery
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Footer Certification Badge Preview</span>
            <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              {certifiedBoard.badgeUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl(certifiedBoard.badgeUrl)} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
                  CBSE
                </div>
              )}
              <div>
                <p className="font-bold text-xs text-[#102a4c]">{certifiedBoard.title}</p>
                <p className="text-[11px] text-slate-500">{certifiedBoard.code}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Trust Board */}
      {activeTab === "trust" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Trust Name</label>
              <input
                type="text"
                value={trustBoard.trustName}
                onChange={(e) => setTrustBoard((p) => ({ ...p, trustName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Registration / Sub-details</label>
              <input
                type="text"
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
                  value={trustBoard.logoUrl}
                  onChange={(e) => setTrustBoard((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("trustLogoUrl")}
                  className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <UploadCloud size={14} /> Gallery
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Footer Trust Badge Preview</span>
            <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              {trustBoard.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl(trustBoard.logoUrl)}
                  alt=""
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedLocal && trustBoard.logoUrl) {
                      target.dataset.triedLocal = "true";
                      target.src = trustBoard.logoUrl;
                    }
                  }}
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100 text-[#1a5d9c] font-bold text-xs">
                  TRUST
                </div>
              )}
              <div>
                <p className="font-bold text-xs text-[#102a4c]">{trustBoard.trustName}</p>
                <p className="text-[11px] text-slate-500">{trustBoard.regNo}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Academic Partner */}
      {activeTab === "partner" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Partner Title</label>
              <input
                type="text"
                value={academicPartner.title}
                onChange={(e) => setAcademicPartner((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Subtitle / Tagline</label>
              <input
                type="text"
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
                  value={academicPartner.logoUrl}
                  onChange={(e) => setAcademicPartner((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#1a5d9c]"
                />
                <button
                  type="button"
                  onClick={() => setGalleryPickerField("partnerLogoUrl")}
                  className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <UploadCloud size={14} /> Gallery
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Footer Academic Partner Badge Preview</span>
            <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              {academicPartner.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl(academicPartner.logoUrl)} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-100 text-[#1a5d9c] font-bold text-xs">
                  PARTNER
                </div>
              )}
              <div>
                <p className="font-bold text-xs text-[#102a4c]">{academicPartner.title}</p>
                <p className="text-[11px] text-slate-500">{academicPartner.subtitle}</p>
              </div>
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
  query,
  meta,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
  canCreate: canCreateProp = true,
  canEdit: canEditProp = true,
  canDelete: canDeleteProp = true,
  token,
}: {
  resource: Resource;
  items: RecordItem[];
  loading: boolean;
  query: QueryParamsState;
  meta: PaginationMeta | undefined;
  onQueryChange: (params: Partial<QueryParamsState>) => void;
  onCreate: () => void;
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  token?: string;
}) {
  const isMediaResource = resource.key === "gallery";
  const isMenuResource = resource.key === "menu-items";
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMediaResource ? "grid" : "list");
  const [menuViewMode, setMenuViewMode] = useState<"table" | "flow">("table");
  const [activeAlbum, setActiveAlbum] = useState<string>("All");
  const [detailItem, setDetailItem] = useState<RecordItem | null>(null);
  const [localSearch, setLocalSearch] = useState(query.search || "");

  useEffect(() => {
    setLocalSearch(query.search || "");
  }, [query.search]);

  const canCreate = canCreateProp && Object.keys(resource.inputs).length > 0;
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

  const handleSearchSubmit = () => {
    onQueryChange({ search: localSearch.trim(), page: 1 });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-bold text-[#102a4c]">{resource.label}</h2>
          <p className="mt-1 text-slate-500">{resource.description}</p>
        </div>
        {canCreate && (
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
              <span className="capitalize font-medium text-slate-600">{resource.label.toLowerCase()}</span>
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
                  if (e.key === "Enter") handleSearchSubmit();
                }}
                placeholder={`Search ${resource.label.toLowerCase()}...`}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs outline-none focus:border-[#1a5d9c] shadow-2xs"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch("");
                    onQueryChange({ search: "", page: 1 });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            {loading ? (
              <div className="py-16 text-center">
                <LoaderCircle className="mx-auto animate-spin text-[#1a5d9c]" />
              </div>
            ) : items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const mediaUrl = getMediaUrl(item);
                  return (
                    <div
                      key={itemId(item)}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:border-slate-300 hover:shadow-md"
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
                            className="rounded-xl bg-white/90 p-2 text-slate-800 shadow-md hover:bg-white hover:scale-105 transition"
                            title="Inspect item"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="rounded-xl bg-white/90 p-2 text-[#1a5d9c] shadow-md hover:bg-white hover:scale-105 transition"
                              title="Edit item"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="rounded-xl bg-white/90 p-2 text-red-600 shadow-md hover:bg-white hover:scale-105 transition"
                              title="Delete item"
                            >
                              <Trash2 size={16} />
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
              <Empty text={`No ${resource.label.toLowerCase()} found`} />
            )}
          </div>
        ) : isMenuResource && menuViewMode === "flow" ? (
          <MenuHierarchyFlow items={items} onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {resource.fields.map((field) => (
                    <th key={field} className="whitespace-nowrap px-5 py-3.5">
                      {field}
                    </th>
                  ))}
                  {(canEdit || canDelete || isMediaResource) && (
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={resource.fields.length + 1} className="py-16 text-center">
                      <LoaderCircle className="mx-auto animate-spin text-[#1a5d9c]" />
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const isSuperUser = resource.key === "users" && isSuperAdminRole(item.role);
                    const rowPreviewUrl = getPreviewUrl(item);
                    return (
                      <tr key={itemId(item)} className="transition hover:bg-slate-50/80">
                        {resource.fields.map((field) => {
                          const formatted = formatValue(field, item[field], item, items);
                          if (field === "role") {
                            return (
                              <td key={field} className="max-w-[200px] px-5 py-4 text-sm text-slate-700">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1a5d9c]">
                                  {formatted}
                                </span>
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
                        {(canEdit || canDelete || isMediaResource || rowPreviewUrl) && (
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
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c]"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => onEdit(item)}
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c]"
                                  title="Edit record"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {canDelete && (
                                isSuperUser ? (
                                  <button
                                    disabled
                                    className="rounded-lg p-2 text-slate-300 cursor-not-allowed"
                                    title="Super Admin accounts cannot be deleted"
                                  >
                                    <Lock size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onDelete(item)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                    title="Delete record"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={resource.fields.length + 1}>
                      <Empty text={`No ${resource.label.toLowerCase()} found`} />
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
        <MediaDetailDialog
          item={detailItem}
          resource={resource}
          onClose={() => setDetailItem(null)}
          onEdit={canEdit ? () => onEdit(detailItem) : undefined}
          onDelete={canDelete && !(resource.key === "users" && isSuperAdminRole(detailItem.role)) ? () => onDelete(detailItem) : undefined}
        />
      )}
    </div>
  );
}
