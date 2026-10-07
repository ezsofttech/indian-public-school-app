"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import fallbackSiteData from "@/public/cloud-datasource.json";
import {
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  GalleryVerticalEnd,
  GraduationCap,
  ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  MessageSquareHeart,
  Pencil,
  Trash2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  UploadCloud,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  ExternalLink,
  Grid,
  List,
  Folder,
  Crown,
  Shield,
  UserCheck,
  Lock,
  Workflow,
  Save,
  GitBranch,
  ArrowUp,
  ArrowDown,
  Video,
  Music,
  File,
  ChevronLeft,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { RichTextBox } from "@/components/ui/RichTextBox";
import { CloudinaryGalleryModal, getFileType } from "@/components/admin/CloudinaryGalleryModal";
import { FileViewerModal } from "@/components/ui/FileViewerModal";
import { PdfCanvasThumbnail } from "@/components/ui/PdfCanvasThumbnail";
import { getCloudinaryPdfThumbnailUrl, isPdfFile, getCloudinaryInlineViewerUrl } from "@/lib/file-preview";
import { DEFAULT_LOGO, DEFAULT_CREST_LOGO, imageUrl } from "@/lib/site-data";
import { useInquiryNotifications } from "@/lib/hooks/useInquiryNotifications";
import { CareersAdmin } from "@/components/admin/careers/CareersAdmin";
import { ThemeManagementTab } from "@/components/admin/tabs/ThemeManagementTab";
import { useCareerNotifications } from "@/lib/hooks/useCareerNotifications";
import {
  RecordItem,
  ResourceKey,
  InputType,
  Resource,
  PaginationMeta,
  QueryParamsState,
  JwtPayload,
} from "./types/admin.types";
import {
  API_URL,
  resourcePath,
  resources,
  OPTIONAL_FIELDS,
  sectionNames,
  resourceSections,
  DEFAULT_QUERY,
} from "./config/admin.config";
import {
  parseJwt,
  isSuperAdminRole,
  isSubAdminRole,
  hasPermission,
  RoleBadge,
  isRequiredField,
  itemId,
  flattenMenuItems,
  asPaginatedPayload,
  asItems,
  getItemPhoto,
  formatValue,
  titleCase,
} from "./utils/admin.helpers";
import { RecordDialog } from "./modals/RecordDialog";
import { LoginDialog } from "./modals/LoginDialog";
import { ChangePasswordDialog } from "./modals/ChangePasswordDialog";
import { MediaDetailDialog } from "./modals/MediaDetailDialog";

import { Overview } from "./tabs/AdminOverviewTab";
import { ResourceView } from "./tables/AdminResourceTable";








export function AdminConsole() {
  const [active, setActive] = useState<ResourceKey | "overview">("overview");
  const [data, setData] = useState<Partial<Record<ResourceKey, RecordItem[]>>>({});
  const [metaData, setMetaData] = useState<Partial<Record<ResourceKey, PaginationMeta>>>({});
  const [queryParams, setQueryParams] = useState<Partial<Record<ResourceKey, QueryParamsState>>>({});
  const queryParamsRef = useRef(queryParams);
  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [saving, setSaving] = useState(false);





  const currentUser = useMemo(() => {
    if (!token) return null;
    return parseJwt(token);
  }, [token]);

  const isSuperAdmin = currentUser ? isSuperAdminRole(currentUser.role) : true;

  const allowedModules = useMemo(() => {
    if (!currentUser || isSuperAdmin) return ["*"];
    return currentUser.allowedModules || [];
  }, [currentUser, isSuperAdmin]);

  const canAccessResource = useCallback((resourceKey: ResourceKey): boolean => {
    return hasPermission(allowedModules, isSuperAdmin, resourceKey, "access");
  }, [isSuperAdmin, allowedModules]);

  const canUpdateResource = useCallback((resourceKey: ResourceKey): boolean => {
    return hasPermission(allowedModules, isSuperAdmin, resourceKey, "update");
  }, [isSuperAdmin, allowedModules]);

  const canDeleteResource = useCallback((resourceKey: ResourceKey): boolean => {
    return hasPermission(allowedModules, isSuperAdmin, resourceKey, "delete");
  }, [isSuperAdmin, allowedModules]);


  const fetchResource = useCallback(async (key: ResourceKey, overrideQuery?: Partial<QueryParamsState>) => {
    try {
      const defaultLimit = key === "gallery" ? 100 : DEFAULT_QUERY.limit;
      const currentQuery = {
        ...DEFAULT_QUERY,
        limit: defaultLimit,
        ...(queryParamsRef.current[key] || {}),
        ...(overrideQuery || {}),
      };

      const params: Record<string, unknown> = {
        page: currentQuery.page,
        limit: currentQuery.limit,
      };

      if (currentQuery.search.trim()) {
        params.search = currentQuery.search.trim();
      }
      if (currentQuery.sortBy) {
        params.sortBy = currentQuery.sortBy;
        params.sortOrder = currentQuery.sortOrder;
      }
      if (currentQuery.filterKey && currentQuery.filterValue && currentQuery.filterValue !== "All") {
        params[currentQuery.filterKey] = currentQuery.filterValue;
      }

      if (key === "menu-items") {
        params.flat = "true";
      }

      const response = await axios.get(`${API_URL}/${resourcePath[key]}`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const parsed = asPaginatedPayload(response.data, key);
      setData((previous) => ({ ...previous, [key]: parsed.items }));
      setMetaData((previous) => ({ ...previous, [key]: parsed.meta }));
      setQueryParams((previous) => ({ ...previous, [key]: currentQuery }));
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 404) && key === "users") {
        setToken("");
        window.localStorage.removeItem("ips_admin_token");
        document.cookie = "ips_admin_session=; Path=/; Max-Age=0; SameSite=Lax";
      }
      throw err;
    }
  }, [token]);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    const readable = resources.filter((resource) => (resource.key !== "users" || token) && canAccessResource(resource.key));
    const results = await Promise.allSettled(readable.map((resource) => fetchResource(resource.key)));
    const networkFailures = results.filter(
      (result) => result.status === "rejected" && (!axios.isAxiosError(result.reason) || !result.reason.response)
    ).length;
    if (readable.length > 0 && networkFailures === readable.length) {
      setError("Cannot connect to backend API server. Check that the API is running on http://localhost:5000.");
    }
    setLoading(false);
  }, [fetchResource, token, canAccessResource]);

  // Notification Hook (SOLID Architecture & Smart Load Optimization)
  const {
    unreadCount,
    unreadNotifications,
    isNotificationOpen: notificationOpen,
    setIsNotificationOpen: setNotificationOpen,
    markAsRead: markInquiryAsRead,
    markAllAsRead: markAllInquiriesAsRead,
    refreshNotifications: fetchUnreadNotifications,
  } = useInquiryNotifications(
    API_URL,
    token,
    data.inquiries as Record<string, unknown>[] | undefined,
    useCallback(() => {
      if (active === "inquiries") {
        void fetchResource("inquiries");
      }
    }, [active, fetchResource])
  );

  const careerNotifications = useCareerNotifications(API_URL, token);

  const notificationRef = useRef<HTMLDivElement>(null);
  const [publishedPages, setPublishedPages] = useState<RecordItem[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/pages/published`)
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.items) ? res.data.items : [];
        if (items.length > 0) setPublishedPages(items);
      })
      .catch(() => { });
  }, []);

  const combinedPages = useMemo(() => {
    const pageMap = new Map<string, RecordItem>();
    (((fallbackSiteData as any).pages as RecordItem[]) || []).forEach((p) => {
      const id = String(p.slug || p.targetUrl || p._id || p.publicId || "");
      if (id) pageMap.set(id, p);
    });
    (publishedPages || []).forEach((p) => {
      const id = String(p.slug || p.targetUrl || p._id || p.publicId || "");
      if (id) pageMap.set(id, p);
    });
    (data.pages || []).forEach((p) => {
      const id = String(p.slug || p.targetUrl || p._id || p.publicId || "");
      if (id) pageMap.set(id, p);
    });
    return Array.from(pageMap.values());
  }, [data.pages, publishedPages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen, setNotificationOpen]);

  useEffect(() => { setToken(window.localStorage.getItem("ips_admin_token") || ""); }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const current = resources.find((resource) => resource.key === active);
  const currentItems = useMemo(() => {
    if (!current) return [];
    return data[current.key] || [];
  }, [current, data]);

  const securedRequest = async (method: "post" | "patch" | "delete", path: string, body?: unknown) => {
    if (!token) { setLoginOpen(true); throw new Error("Please sign in to make changes."); }
    return axios({ method, url: `${API_URL}/${path}`, data: body, headers: { Authorization: `Bearer ${token}` } });
  };

  const save = async (values: Record<string, unknown>) => {
    if (!current) return;
    setSaving(true); setError("");
    try {
      if (current.key === "users") {
        const id = editing ? itemId(editing) : "";
        if (id) {
          const { _id, createdAt, updatedAt, __v, ...cleanValues } = values;
          await securedRequest("patch", `auth/users/${id}`, cleanValues);
        } else {
          await securedRequest("post", "auth/register", values);
        }
      } else {
        const { _id, createdAt, updatedAt, __v, ...rawPayload } = values;
        const payload: Record<string, unknown> = { ...rawPayload };
        if (current.key === "menu-items") {
          const title = String(payload.title || "").trim();
          const slug = String(payload.slug || "").trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `menu-${Date.now()}`;
          payload.slug = slug;
          if (editing?.menuId) {
            payload.menuId = String(editing.menuId);
          } else {
            payload.menuId = slug;
          }
          if (!payload.menuId) delete payload.menuId;
        }
        if (current.key === "pages") {
          const title = String(payload.title || "").trim();
          const slug = String(payload.slug || "").trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `page-${Date.now()}`;
          payload.slug = slug;
          if (!payload.targetUrl || String(payload.targetUrl).trim() === "") {
            payload.targetUrl = `/pages/${slug}`;
          }
        }
        const id = editing ? itemId(editing) : "";
        const path = current.key === "menu-items" && id ? `${current.key}/${id}` : editing ? `${current.key}/${id}` : current.key;
        await securedRequest(editing ? "patch" : "post", path, payload);
      }
      setFormOpen(false); setEditing(null); await fetchResource(current.key);
    } catch (reason) {
      if (axios.isAxiosError(reason)) {
        const data = reason.response?.data as { message?: string | string[] } | undefined;
        const msg = data?.message || reason.message;
        setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
        if (reason.response?.status === 404) {
          setFormOpen(false);
          setEditing(null);
          void fetchResource(current.key);
        }
      } else {
        setError(reason instanceof Error ? reason.message : "Unable to save this record.");
      }
    }
    finally { setSaving(false); }
  };

  const remove = async (item: RecordItem) => {
    if (!current) return;
    if (current.key === "users" && isSuperAdminRole(item.role)) {
      alert("Super Admin accounts cannot be deleted directly from the console for safety.");
      return;
    }
    if (!window.confirm("Delete this record? Associated Cloudinary files will also be removed.")) return;
    try {
      const id = itemId(item);
      const path = current.key === "users" ? `auth/users/${id}` : `${current.key}/${id}`;
      await securedRequest("delete", path);
      await fetchResource(current.key);
    } catch (reason) {
      if (axios.isAxiosError(reason)) {
        const data = reason.response?.data as { message?: string | string[] } | undefined;
        const msg = data?.message || reason.message;
        setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
        if (reason.response?.status === 404) {
          void fetchResource(current.key);
        }
      } else {
        setError(reason instanceof Error ? reason.message : "Unable to delete this record.");
      }
    }
  };

  const signOut = () => { window.localStorage.removeItem("ips_admin_token"); document.cookie = "ips_admin_session=; Path=/; Max-Age=0; SameSite=Lax"; window.location.assign("/admin/login"); };

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col bg-[#102a4c] px-4 py-5 text-slate-200 shadow-2xl transition-transform lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-8 flex items-center gap-3.5 rounded-2xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-md shadow-inner">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-md shrink-0 ring-2 ring-amber-400/50 overflow-hidden">
          <img
            src={imageUrl(DEFAULT_CREST_LOGO)}
            alt="IPS Shield Logo"
            className="h-full w-full object-contain mix-blend-multiply"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedLocal) {
                target.dataset.triedLocal = "true";
                target.src = "/assets/Settings/Logos/IPSStandardLogo.png";
              } else if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = "true";
                target.src = "/assets/Settings/Logos/IPSLogo.png";
              }
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-base font-extrabold text-white tracking-wide truncate">IPS Admin</p>
          </div>
          <p className="text-[11px] font-semibold text-blue-200/90 truncate">Indian Public School</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto">
        <button onClick={() => { setActive("overview"); setMobileMenu(false); }} className={`sidebar-link ${active === "overview" ? "sidebar-link-active" : ""}`}><LayoutDashboard size={18} /> Overview</button>
        {sectionNames.slice(1).map((section) => {
          const sectionResources = resources.filter((resource) => resourceSections[resource.key] === section && canAccessResource(resource.key));
          if (!sectionResources.length) return null;
          return (
            <div key={section}>
              <div className="mb-2 flex items-center justify-between px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">{section}</p>
                {section === "System" && <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-[#ffd983]"><Crown size={10} /> SUPER</span>}
              </div>
              <div className="space-y-1">
                {sectionResources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <button
                      key={resource.key}
                      onClick={() => { setActive(resource.key); setMobileMenu(false); }}
                      className={`sidebar-link ${active === resource.key ? "sidebar-link-active" : ""}`}
                    >
                      <Icon size={18} />
                      <span>{resource.label}</span>
                      {resource.key === "inquiries" && (data.inquiries?.length || 0) > 0 && (
                        <span className="ml-auto rounded-full bg-[#f4bd4f] px-2 py-0.5 text-[10px] font-bold text-[#102a4c]">
                          {data.inquiries?.length}
                        </span>
                      )}
                      {resource.key === "careers" && careerNotifications.unreadCount > 0 && (
                        <span className="ml-auto rounded-full bg-[#f4bd4f] px-2 py-0.5 text-[10px] font-bold text-[#102a4c]">
                          {careerNotifications.unreadCount}
                        </span>
                      )}
                      {resource.key === "users" && <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-300"><Crown size={11} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 pt-4 space-y-2">
        {token ? (
          <>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 border border-white/10">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-bold text-xs ${isSuperAdmin ? "bg-amber-400 text-[#102a4c]" : "bg-blue-200 text-[#102a4c]"}`}>
                {isSuperAdmin ? <Crown size={18} /> : <Shield size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{currentUser?.name || currentUser?.email || "Administrator"}</p>
                <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">{currentUser?.role || (isSuperAdmin ? "Super Admin" : "Sub Admin")}</p>
              </div>
            </div>
            <button onClick={() => setChangePasswordOpen(true)} className="sidebar-link w-full text-xs">
              <KeyRound size={16} /> Change password
            </button>
            <button onClick={signOut} className="sidebar-link w-full text-xs">
              <LogOut size={16} /> Sign out
            </button>
          </>
        ) : (
          <button onClick={() => setLoginOpen(true)} className="sidebar-link w-full">
            <LogIn size={18} /> Admin sign in
          </button>
        )}
      </div>
    </aside>
    {mobileMenu && <button aria-label="Close navigation" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" />}
    <section className="min-h-screen lg:pl-[272px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-[#f4f7fb] px-5 shadow-xs lg:px-9">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileMenu(true)} className="rounded-lg p-2 text-slate-600 lg:hidden"><Menu /></button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d69d26]">School administration</p>
            <h1 className="font-display text-xl font-bold text-[#102a4c]">{active === "overview" ? "Good morning, Administrator" : current?.label}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notificationRef}>
            {(() => {
              const totalUnread = unreadCount + careerNotifications.unreadCount;
              return (
                <>
                  <button
                    onClick={() => setNotificationOpen((prev) => !prev)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                    title="Notifications"
                  >
                    <Bell size={18} className="text-[#102a4c]" />
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white ring-2 ring-white animate-pulse">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover Dropdown */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-[#1a5d9c]" />
                          <h3 className="font-bold text-[#102a4c] text-sm">Notifications</h3>
                          {totalUnread > 0 && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {totalUnread} Unread
                            </span>
                          )}
                        </div>
                        {totalUnread > 0 && (
                          <button
                            onClick={async () => {
                              if (unreadCount > 0) await markAllInquiriesAsRead();
                              if (careerNotifications.unreadCount > 0) await careerNotifications.markAllAsRead();
                            }}
                            className="text-[11px] font-bold text-[#1a5d9c] hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-3 max-h-80 overflow-y-auto space-y-2 scrollbar-thin">
                        {/* Career Application Notifications */}
                        {careerNotifications.unreadNotifications.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 px-1">
                              Job Applications ({careerNotifications.unreadNotifications.length})
                            </div>
                            {careerNotifications.unreadNotifications.map((cApp) => {
                              const cId = String(cApp._id || cApp.id || cApp.publicId || "");
                              return (
                                <div
                                  key={cId}
                                  onClick={() => {
                                    setNotificationOpen(false);
                                    setActive("careers");
                                    void careerNotifications.markAsRead(cId);
                                  }}
                                  className="group flex flex-col gap-1 rounded-xl border border-amber-200 bg-[#fdf3da]/60 p-3 text-left transition hover:bg-amber-100/80 cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-[#102a4c] truncate">
                                      {String(cApp.fullName || "New Candidate")}
                                    </span>
                                    <span className="rounded-md bg-[#102a4c] text-[#f4bd4f] px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                                      {String(cApp.postTitle || "Career")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 font-mono">
                                    App Ref: {String(cApp.applicationNo || "APP-REF")}
                                  </p>
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>{String(cApp.email || cApp.phone || "")}</span>
                                    <span className="font-bold text-[#1a5d9c] group-hover:underline">Review candidate →</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inquiry Notifications */}
                        {unreadNotifications.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 px-1">
                              Enquiries ({unreadNotifications.length})
                            </div>
                            {unreadNotifications.map((inq) => {
                              const id = itemId(inq);
                              return (
                                <div
                                  key={id}
                                  onClick={() => {
                                    setNotificationOpen(false);
                                    setActive("inquiries");
                                    setEditing(inq);
                                    setFormOpen(true);
                                    void markInquiryAsRead(id);
                                  }}
                                  className="group flex flex-col gap-1 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-left transition hover:bg-blue-100/70 cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-[#102a4c] truncate">
                                      {String(inq.name || "New Applicant")}
                                    </span>
                                    <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                      {String(inq.inquiryType || "Admission")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-2">
                                    {String(inq.message || "No message body")}
                                  </p>
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                    <span>{inq.contact ? String(inq.contact) : String(inq.email || "")}</span>
                                    <span className="font-semibold text-blue-800 group-hover:underline">View details →</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {totalUnread === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            <Check size={24} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                            All notifications read! No pending items.
                          </div>
                        )}
                      </div>

                      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-around text-xs font-bold text-[#1a5d9c]">
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            setActive("careers");
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          Applications ({careerNotifications.unreadCount})
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            setActive("inquiries");
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          Enquiries ({unreadCount})
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <button
            onClick={() => {
              void refresh();
              void fetchUnreadNotifications();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Console Data"
          >
            <RefreshCw size={18} className="text-[#102a4c]" />
          </button>
          {token && (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 shadow-xs">
              <div className={`grid h-8 w-8 place-items-center rounded-full font-bold text-xs ${isSuperAdmin ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-blue-100 text-[#1a5d9c]"}`}>
                {isSuperAdmin ? <Crown size={15} className="text-amber-600 fill-amber-400" /> : <Shield size={15} />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#102a4c]">{currentUser?.name || "Administrator"}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{isSuperAdmin ? "Super Admin" : "Sub Admin"}</p>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="p-5 lg:p-9">{error && <div className="mb-5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><span>{error}</span><button onClick={() => setError("")}><X size={16} /></button></div>}{active === "overview" ? <Overview data={data} loading={loading} onNavigate={setActive} /> : active === "careers" ? <CareersAdmin apiUrl={API_URL} token={token} onRefreshNotifications={careerNotifications.refreshNotifications} /> : active === "theme" ? <ThemeManagementTab token={token} /> : current && <ResourceView resource={current} items={currentItems} loading={loading} query={queryParams[current.key] || DEFAULT_QUERY} meta={metaData[current.key]} onQueryChange={(newQuery) => void fetchResource(current.key, newQuery)} onCreate={() => { setEditing(null); setError(""); setFormOpen(true); }} onEdit={(item) => { setEditing(item); setError(""); setFormOpen(true); }} onDelete={remove} canCreate={canUpdateResource(current.key)} canEdit={canUpdateResource(current.key)} canDelete={canDeleteResource(current.key)} token={token} />}</div>
    </section>
    {formOpen && current && (
      <RecordDialog
        token={token}
        resource={current}
        record={editing}
        saving={saving}
        formError={error}
        allSectionPages={combinedPages}
        allMenuItems={data["menu-items"] || []}
        onClose={() => { setFormOpen(false); setEditing(null); setError(""); }}
        onClearError={() => setError("")}
        onSave={save}
      />
    )}
    {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} onLoggedIn={(accessToken) => { window.localStorage.setItem("ips_admin_token", accessToken); document.cookie = `ips_admin_session=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax; Max-Age=604800${location.protocol === "https:" ? "; Secure" : ""}`; setToken(accessToken); setLoginOpen(false); }} />}
    {changePasswordOpen && token && <ChangePasswordDialog token={token} onClose={() => setChangePasswordOpen(false)} />}
  </main>;
}