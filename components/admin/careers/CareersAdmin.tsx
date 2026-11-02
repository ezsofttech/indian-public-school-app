"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Search,
  SlidersHorizontal,
  RefreshCw,
  LoaderCircle,
  ExternalLink,
  UserCheck,
  UserX,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  X,
  UploadCloud,
  ListPlus,
  HelpCircle,
} from "lucide-react";
import { CloudinaryGalleryModal } from "@/components/admin/CloudinaryGalleryModal";
import { getAssetUrl } from "@/lib/utils";

export function CareerThumbnail({
  src,
  title,
  className = "w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs",
  fallbackClassName = "w-10 h-10 rounded-xl bg-[#102a4c] border border-white/10 text-[#f4bd4f] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0",
  style,
}: {
  src?: string;
  title: string;
  className?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
}) {
  const [hasError, setHasError] = useState(false);
  const initials = (title || "CP").trim().substring(0, 2).toUpperCase();
  const normalizedSrc = src ? getAssetUrl(src) : "";

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!normalizedSrc || hasError) {
    return (
      <div className={fallbackClassName} style={style} title={title}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={title}
      style={style}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

export interface CustomField {
  key: string;
  label: string;
  value: string;
}

export interface ApplicationField {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "file" | "image" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

export interface CareerPostRecord {
  _id?: string;
  id?: string;
  title: string;
  qualification: string;
  image?: string;
  description?: string;
  customFields?: CustomField[];
  applicationFields?: ApplicationField[];
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string;
}

export interface CareerApplicationRecord {
  _id?: string;
  id?: string;
  postId: string;
  postTitle: string;
  applicationNo: string;
  fullName: string;
  email: string;
  phone: string;
  coverNote?: string;
  resumeUrl?: string;
  photoUrl?: string;
  customAnswers?: Record<string, string>;
  isRead?: boolean;
  status: "PENDING" | "SHORTLISTED" | "REJECTED" | "HIRED";
  createdAt?: string;
}

interface CareersAdminProps {
  apiUrl: string;
  token?: string;
  onRefreshNotifications?: () => void;
}

export function CareersAdmin({ apiUrl, token, onRefreshNotifications }: CareersAdminProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "applications">("posts");

  // Posts State
  const [posts, setPosts] = useState<CareerPostRecord[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [postSearch, setPostSearch] = useState<string>("");
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<CareerPostRecord | null>(null);

  // Post Form State
  const [formTitle, setFormTitle] = useState<string>("");
  const [formQualification, setFormQualification] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formCustomFields, setFormCustomFields] = useState<CustomField[]>([]);
  const [formAppFields, setFormAppFields] = useState<ApplicationField[]>([]);
  const [savingPost, setSavingPost] = useState<boolean>(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
  const [updatingAppStatusId, setUpdatingAppStatusId] = useState<string | null>(null);

  // Gallery Modal for Image selection
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Applications State
  const [applications, setApplications] = useState<CareerApplicationRecord[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(true);
  const [appSearch, setAppSearch] = useState<string>("");
  const [appPostFilter, setAppPostFilter] = useState<string>("ALL");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<CareerApplicationRecord | null>(null);

  const getHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Load Posts
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get(`${apiUrl}/careers?isActive=all`, {
        headers: getHeaders(),
      });
      const data = res.data;
      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setPosts(list);
    } catch (err) {
      console.error("Failed to load career posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [apiUrl, getHeaders]);

  // Load Applications
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await axios.get(`${apiUrl}/careers/applications/all`, {
        headers: getHeaders(),
      });
      const data = res.data;
      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setApplications(list);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoadingApps(false);
    }
  }, [apiUrl, getHeaders]);

  useEffect(() => {
    fetchPosts();
    fetchApplications();
  }, [fetchPosts, fetchApplications]);

  // Direct Image Upload from Device
  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "careers/posts");
      const res = await axios.post(`${apiUrl}/uploads`, formData, {
        headers: {
          ...getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });
      const data = res.data?.data ?? res.data;
      const uploadedUrl = data?.url || data?.fileUrl || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : "");
      if (uploadedUrl) {
        setFormImage(uploadedUrl);
      }
    } catch (err: any) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "careers/posts");
        const res = await axios.post(`${apiUrl}/uploads/public`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = res.data?.data ?? res.data;
        const uploadedUrl = data?.url || data?.fileUrl || (Array.isArray(data?.fileUrl) ? data.fileUrl[0] : "");
        if (uploadedUrl) {
          setFormImage(uploadedUrl);
        }
      } catch (err2: any) {
        alert(`Failed to upload image: ${err?.response?.data?.message || err.message}`);
      }
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Open Create/Edit Post Modal
  const handleOpenPostModal = (post?: CareerPostRecord) => {
    if (post) {
      setEditingPost(post);
      setFormTitle(post.title || "");
      setFormQualification(post.qualification || "");
      setFormImage(post.image || "");
      setFormDescription(post.description || "");
      setFormIsActive(post.isActive ?? true);
      setFormCustomFields(post.customFields ? [...post.customFields] : []);
      setFormAppFields(post.applicationFields ? [...post.applicationFields] : []);
    } else {
      setEditingPost(null);
      setFormTitle("");
      setFormQualification("");
      setFormImage("");
      setFormDescription("");
      setFormIsActive(true);
      setFormCustomFields([
        { key: "experience", label: "Experience", value: "2+ Years" },
        { key: "department", label: "Department", value: "Academics" },
      ]);
      setFormAppFields([
        { key: "notice_period", label: "Notice Period", type: "text", required: true },
      ]);
    }
    setIsPostModalOpen(true);
  };

  // Add Dynamic Custom Field to Post
  const handleAddCustomField = () => {
    setFormCustomFields((prev) => [
      ...prev,
      { key: `field_${Date.now()}`, label: "New Field", value: "" },
    ]);
  };

  const handleUpdateCustomField = (index: number, key: keyof CustomField, val: string) => {
    setFormCustomFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setFormCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Dynamic Application Question to Post
  const handleAddAppField = () => {
    setFormAppFields((prev) => [
      ...prev,
      {
        key: `question_${Date.now()}`,
        label: "New Question",
        type: "text",
        required: false,
      },
    ]);
  };

  const handleUpdateAppField = (
    index: number,
    key: keyof ApplicationField,
    val: unknown
  ) => {
    setFormAppFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  const handleRemoveAppField = (index: number) => {
    setFormAppFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Career Post
  const handleSavePost = async () => {
    if (!formTitle.trim() || !formQualification.trim()) {
      alert("Please fill in Name of Post and Qualification.");
      return;
    }

    setSavingPost(true);
    try {
      const payload = {
        title: formTitle.trim(),
        qualification: formQualification.trim(),
        image: formImage.trim(),
        description: formDescription.trim(),
        isActive: formIsActive,
        customFields: formCustomFields.map((f) => ({
          key: f.key.trim().toLowerCase().replace(/\s+/g, "_"),
          label: f.label.trim(),
          value: f.value.trim(),
        })),
        applicationFields: formAppFields.map((q) => ({
          key: q.key.trim().toLowerCase().replace(/\s+/g, "_"),
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          options: q.options || [],
        })),
      };

      const postId = editingPost?._id || editingPost?.id;
      if (postId) {
        await axios.patch(`${apiUrl}/careers/${postId}`, payload, {
          headers: getHeaders(),
        });
      } else {
        await axios.post(`${apiUrl}/careers`, payload, {
          headers: getHeaders(),
        });
      }

      setIsPostModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      alert(`Error saving career post: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSavingPost(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this career post?")) return;
    setDeletingPostId(id);
    try {
      await axios.delete(`${apiUrl}/careers/${id}`, { headers: getHeaders() });
      fetchPosts();
    } catch (err: any) {
      alert(`Failed to delete post: ${err?.response?.data?.message || err.message}`);
    } finally {
      setDeletingPostId(null);
    }
  };

  // Toggle Post Active Status
  const handleTogglePostStatus = async (post: CareerPostRecord) => {
    const id = post._id || post.id;
    if (!id) return;
    try {
      await axios.patch(
        `${apiUrl}/careers/${id}`,
        { isActive: !post.isActive },
        { headers: getHeaders() }
      );
      fetchPosts();
    } catch (err: any) {
      alert(`Failed to toggle status: ${err?.response?.data?.message || err.message}`);
    }
  };

  // Application Status Change
  const handleUpdateAppStatus = async (
    id: string,
    newStatus: "PENDING" | "SHORTLISTED" | "REJECTED" | "HIRED"
  ) => {
    setUpdatingAppStatusId(id);
    try {
      await axios.patch(
        `${apiUrl}/careers/applications/${id}/status`,
        { status: newStatus },
        { headers: getHeaders() }
      );
      if (selectedApp && (selectedApp._id === id || selectedApp.id === id)) {
        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      fetchApplications();
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err: any) {
      alert(`Failed to update application status: ${err?.response?.data?.message || err.message}`);
    } finally {
      setUpdatingAppStatusId(null);
    }
  };

  // Delete Application
  const handleDeleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application record?")) return;
    setDeletingAppId(id);
    try {
      await axios.delete(`${apiUrl}/careers/applications/${id}`, {
        headers: getHeaders(),
      });
      if (selectedApp && (selectedApp._id === id || selectedApp.id === id)) {
        setSelectedApp(null);
      }
      fetchApplications();
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err: any) {
      alert(`Failed to delete application: ${err?.response?.data?.message || err.message}`);
    } finally {
      setDeletingAppId(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const q = postSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.qualification.toLowerCase().includes(q)
    );
  });

  const filteredApps = applications.filter((app) => {
    const q = appSearch.toLowerCase();
    const matchesSearch =
      app.fullName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      app.applicationNo.toLowerCase().includes(q) ||
      app.postTitle.toLowerCase().includes(q);

    const matchesPost = appPostFilter === "ALL" || app.postId === appPostFilter;
    const matchesStatus = appStatusFilter === "ALL" || app.status === appStatusFilter;

    return matchesSearch && matchesPost && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls & Tabs - IPS Navy (#102a4c) & Gold (#f4bd4f) Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#102a4c] text-[#f4bd4f] flex items-center justify-center shadow-md">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102a4c] dark:text-white font-display">
              Careers & Job Openings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage openings, dynamic table columns & candidate applications
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "posts"
                ? "bg-[#102a4c] text-[#f4bd4f] shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-[#102a4c] dark:hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Job Openings ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "applications"
                ? "bg-[#102a4c] text-[#f4bd4f] shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-[#102a4c] dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            Applications Hub ({applications.length})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: JOB OPENINGS LIST */}
      {/* ========================================================= */}
      {activeTab === "posts" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Header Controls */}
          <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 p-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs shrink-0">
                <span className="flex h-2 w-2 rounded-full bg-[#1a5d9c]"></span>
                <span>{filteredPosts.length}</span>
                <span className="capitalize font-medium text-slate-600">Openings</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Search openings..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs outline-none focus:border-[#1a5d9c] shadow-2xs"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {postSearch && (
                  <button
                    type="button"
                    onClick={() => setPostSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchPosts}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                title="Refresh Openings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPosts ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => handleOpenPostModal()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a5d9c] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-[#124c81] cursor-pointer"
              >
                <Plus size={15} /> Add Career Opening
              </button>
            </div>
          </div>

          {/* Posts Table */}
          {loadingPosts ? (
            <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-3">
              <LoaderCircle className="w-5 h-5 animate-spin text-[#1a5d9c]" />
              <span className="text-sm font-medium">Loading career openings...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">
                {postSearch ? `No career openings found matching "${postSearch}"` : "No career openings found"}
              </p>
              {postSearch ? (
                <button
                  type="button"
                  onClick={() => setPostSearch("")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Clear search
                </button>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Career Opening&quot; to create your first dynamic job post.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="whitespace-nowrap px-5 py-3.5 w-12 text-center">S.No</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Image</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Name of Post</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Qualification</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Dynamic Fields</th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-center">Status</th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.map((post, idx) => {
                    const id = post._id || post.id || String(idx);
                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-center text-slate-400 font-bold text-xs">
                          {idx + 1}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <CareerThumbnail
                            src={post.image}
                            title={post.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            fallbackClassName="w-10 h-10 rounded-xl bg-[#102a4c] border border-white/10 text-[#f4bd4f] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0"
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-[#102a4c] text-sm">
                          {post.title}
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 text-xs font-medium text-slate-600">
                          {post.qualification}
                        </td>
                        <td className="max-w-xs px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {post.customFields && post.customFields.length > 0 ? (
                              post.customFields.map((cf, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-[#fdf3da] text-[#b7790a] text-[10px] font-bold border border-amber-200/60"
                                >
                                  {cf.label}: {cf.value}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">Standard</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <div className="relative inline-flex items-center">
                            <select
                              value={post.isActive ? "Active" : "Closed"}
                              onChange={async (e) => {
                                const shouldBeActive = e.target.value === "Active";
                                if (shouldBeActive !== post.isActive) {
                                  await handleTogglePostStatus(post);
                                }
                              }}
                              className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none ${
                                post.isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                  : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                              }`}
                              title="Click to change status"
                            >
                              <option value="Active" className="text-slate-900 bg-white font-semibold">
                                Active
                              </option>
                              <option value="Closed" className="text-slate-900 bg-white font-semibold">
                                Closed
                              </option>
                            </select>
                            <span
                              className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                post.isActive
                                  ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                  : "bg-rose-500 shadow-xs shadow-rose-400"
                              }`}
                            />
                            <ChevronDown
                              size={12}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60 text-current"
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenPostModal(post)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c] cursor-pointer"
                              title="Edit Opening"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              disabled={deletingPostId === id}
                              onClick={() => handleDeletePost(id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 cursor-pointer"
                              title={deletingPostId === id ? "Deleting..." : "Delete Opening"}
                            >
                              {deletingPostId === id ? (
                                <LoaderCircle size={16} className="animate-spin text-red-600" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: APPLICATIONS HUB */}
      {/* ========================================================= */}
      {activeTab === "applications" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Header Controls */}
          <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 p-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs shrink-0">
                <span className="flex h-2 w-2 rounded-full bg-[#1a5d9c]"></span>
                <span>{filteredApps.length}</span>
                <span className="capitalize font-medium text-slate-600">Applications</span>
              </div>

              {/* Position Filter Dropdown */}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs shadow-2xs shrink-0">
                <SlidersHorizontal size={13} className="text-[#1a5d9c] shrink-0" />
                <span className="font-semibold text-slate-500 shrink-0">Position:</span>
                <select
                  value={appPostFilter}
                  onChange={(e) => setAppPostFilter(e.target.value)}
                  className="bg-transparent font-bold text-[#102a4c] outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">All Positions</option>
                  {posts.map((p) => {
                    const pid = p._id || p.id;
                    return (
                      <option key={pid} value={pid}>
                        {p.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs shadow-2xs shrink-0">
                <SlidersHorizontal size={13} className="text-[#1a5d9c] shrink-0" />
                <span className="font-semibold text-slate-500 shrink-0">Status:</span>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-[#102a4c] outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="HIRED">Hired</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs outline-none focus:border-[#1a5d9c] shadow-2xs"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {appSearch && (
                  <button
                    type="button"
                    onClick={() => setAppSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchApplications}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                title="Refresh Applications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Applications Table */}
          {loadingApps ? (
            <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-3">
              <LoaderCircle className="w-5 h-5 animate-spin text-[#1a5d9c]" />
              <span className="text-sm font-medium">Loading applications...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">
                {appSearch
                  ? `No applications received matching "${appSearch}"`
                  : "No applications received matching filters"}
              </p>
              {appSearch && (
                <button
                  type="button"
                  onClick={() => setAppSearch("")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#1a5d9c] shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="whitespace-nowrap px-5 py-3.5">Ref No</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Candidate</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Job Position</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Contact</th>
                    <th className="whitespace-nowrap px-5 py-3.5">Applied Date</th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-center">Status</th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => {
                    const id = app._id || app.id || "";
                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono font-bold text-xs text-[#1a5d9c]">
                          {app.applicationNo}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-[#102a4c] text-sm">
                          <div className="flex items-center gap-2.5">
                            {app.photoUrl ? (
                              <img
                                src={app.photoUrl}
                                alt={app.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#102a4c] text-[#f4bd4f] font-bold text-[11px] flex items-center justify-center shrink-0 border border-white/10">
                                {app.fullName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span>{app.fullName}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-700">
                          {app.postTitle}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs">
                          <div className="font-medium text-slate-700">{app.email}</div>
                          <div className="text-[11px] text-slate-400">{app.phone}</div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-400 text-xs">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <div className="relative inline-flex items-center">
                            <select
                              value={app.status}
                              disabled={updatingAppStatusId === id}
                              onChange={(e) =>
                                handleUpdateAppStatus(
                                  id,
                                  e.target.value as "PENDING" | "SHORTLISTED" | "REJECTED" | "HIRED"
                                )
                              }
                              className={`appearance-none cursor-pointer inline-flex items-center rounded-full pl-6 pr-6 py-1 text-xs font-bold border shadow-2xs transition outline-none disabled:opacity-50 ${
                                app.status === "HIRED"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                                  : app.status === "SHORTLISTED"
                                  ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100/80"
                                  : app.status === "REJECTED"
                                  ? "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80"
                              }`}
                              title="Click to update application status"
                            >
                              <option value="PENDING" className="text-slate-900 bg-white font-semibold">Pending</option>
                              <option value="SHORTLISTED" className="text-slate-900 bg-white font-semibold">Shortlisted</option>
                              <option value="REJECTED" className="text-slate-900 bg-white font-semibold">Rejected</option>
                              <option value="HIRED" className="text-slate-900 bg-white font-semibold">Hired</option>
                            </select>
                            <span
                              className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                app.status === "HIRED"
                                  ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                                  : app.status === "SHORTLISTED"
                                  ? "bg-blue-500 shadow-xs shadow-blue-400"
                                  : app.status === "REJECTED"
                                  ? "bg-rose-500 shadow-xs shadow-rose-400"
                                  : "bg-amber-500 shadow-xs shadow-amber-400"
                              }`}
                            />
                            {updatingAppStatusId === id ? (
                              <LoaderCircle
                                size={12}
                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-current"
                              />
                            ) : (
                              <ChevronDown
                                size={12}
                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60 text-current"
                              />
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#1a5d9c] cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              disabled={deletingAppId === id}
                              onClick={() => handleDeleteApp(id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 cursor-pointer"
                              title="Delete Record"
                            >
                              {deletingAppId === id ? (
                                <LoaderCircle size={16} className="animate-spin text-red-600" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT CAREER POST */}
      {/* ========================================================= */}
      {isPostModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsPostModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stable / Fixed Header */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-[#102a4c] dark:text-white flex items-center gap-2 font-display">
                <Briefcase className="w-5 h-5 text-[#1a5d9c]" />
                {editingPost ? "Edit Career Opening" : "Create Dynamic Career Opening"}
              </h3>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <label className="block font-semibold text-[#102a4c] dark:text-slate-200 mb-1">
                  Name of Post <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PGT Mathematics, Computer Teacher, Accountant"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1a5d9c]/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102a4c] dark:text-slate-200 mb-1">
                  Qualification Required <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formQualification}
                  onChange={(e) => setFormQualification(e.target.value)}
                  placeholder="e.g. M.Sc / M.A with B.Ed, minimum 3 years teaching experience"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1a5d9c]/40 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102a4c] dark:text-slate-200 mb-1">Post / Category Image</label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Image URL or pick from gallery / upload below"
                    className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#1a5d9c]/40 outline-none font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="px-3.5 py-2.5 bg-[#102a4c] text-[#f4bd4f] hover:bg-[#1a5d9c] hover:text-white transition-colors border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold shrink-0 shadow-xs text-xs"
                    title="Select media from Cloudinary gallery"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Gallery</span>
                  </button>
                  <label
                    className={`px-3.5 py-2.5 bg-white dark:bg-slate-800 text-[#102a4c] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold shrink-0 shadow-xs text-xs transition-colors ${
                      isUploadingImage ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    title="Upload image directly from computer"
                  >
                    {isUploadingImage ? (
                      <LoaderCircle className="w-4 h-4 animate-spin text-[#1a5d9c]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#1a5d9c]" />
                    )}
                    <span>{isUploadingImage ? "Uploading..." : "Upload File"}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDirectImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage("")}
                      className="px-2.5 py-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {formImage && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <CareerThumbnail
                      src={formImage}
                      title={formTitle || "Post Preview"}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                      fallbackClassName="w-12 h-12 rounded-lg bg-[#102a4c] border border-white/10 text-[#f4bd4f] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Image Attached</p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{formImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#102a4c] dark:text-slate-200 mb-1">Detailed Job Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Job roles, duties, key responsibilities..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1a5d9c]/40 outline-none"
                />
              </div>

              {/* DYNAMIC CUSTOM FIELDS FOR TABLE COLUMNS */}
              <div className="p-4 rounded-2xl bg-[#edf5fc] dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#102a4c] dark:text-white flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-[#1a5d9c]" />
                      Dynamic Custom Columns / Fields
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add extra fields displayed in the public careers table (e.g. Experience, Salary, Location)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-1.5 bg-[#1a5d9c] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#102a4c] transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Column Field
                  </button>
                </div>

                {formCustomFields.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No custom fields added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {formCustomFields.map((cf, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cf.label}
                          onChange={(e) =>
                            handleUpdateCustomField(idx, "label", e.target.value)
                          }
                          placeholder="Field Label (e.g. Experience)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-white dark:bg-slate-900 outline-none"
                        />
                        <input
                          type="text"
                          value={cf.value}
                          onChange={(e) =>
                            handleUpdateCustomField(idx, "value", e.target.value)
                          }
                          placeholder="Value (e.g. 3+ Years)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-white dark:bg-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DYNAMIC APPLICATION FORM QUESTIONS */}
              <div className="p-4 rounded-2xl bg-[#fdf3da]/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#102a4c] dark:text-white flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#b7790a]" />
                      Dynamic Application Form Questions
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Define questions candidates must answer when clicking "Apply"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAppField}
                    className="px-3 py-1.5 bg-[#102a4c] text-[#f4bd4f] rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#1a5d9c] hover:text-white transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Form Question
                  </button>
                </div>

                {formAppFields.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No custom application form questions added.</p>
                ) : (
                  <div className="space-y-2">
                    {formAppFields.map((q, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => handleUpdateAppField(idx, "label", e.target.value)}
                          placeholder="Question / Label"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-white dark:bg-slate-900 outline-none"
                        />
                        <select
                          value={q.type}
                          onChange={(e) => handleUpdateAppField(idx, "type", e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-white dark:bg-slate-900 outline-none font-medium"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="textarea">Textarea</option>
                          <option value="file">File / Document (PDF/Doc)</option>
                          <option value="image">Image / Photo Upload</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => handleUpdateAppField(idx, "required", e.target.checked)}
                            className="rounded border-slate-300 text-[#102a4c]"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveAppField(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-xs font-bold text-slate-700">Position Status</span>
                  <p className="text-[11px] text-slate-500">
                    {formIsActive ? "Active (Accepting applications on portal)" : "Closed (Applications closed)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex items-center rounded-full pl-6 pr-4 py-1.5 text-xs font-bold border shadow-2xs transition-all cursor-pointer ${
                    formIsActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                      : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80"
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                      formIsActive
                        ? "bg-emerald-500 shadow-xs shadow-emerald-400 animate-pulse"
                        : "bg-rose-500 shadow-xs shadow-rose-400"
                    }`}
                  />
                  <span>{formIsActive ? "Active" : "Closed"}</span>
                </button>
              </div>
            </div>

            {/* Stable / Fixed Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePost}
                disabled={savingPost}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#102a4c] hover:bg-[#1a5d9c] text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingPost ? <LoaderCircle className="w-4 h-4 animate-spin text-white" /> : <Briefcase className="w-4 h-4 text-[#f4bd4f]" />}
                <span>{savingPost ? (editingPost ? "Updating Opening..." : "Creating Opening...") : (editingPost ? "Update Opening" : "Create Opening")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CANDIDATE APPLICATION DETAILS */}
      {/* ========================================================= */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stable / Fixed Header */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#fdf3da] text-[#b7790a] border border-amber-200">
                  {selectedApp.applicationNo}
                </span>
                <h3 className="text-lg font-bold text-[#102a4c] dark:text-white mt-1 font-display">
                  {selectedApp.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400">Position Applied For</span>
                  <div className="font-bold text-[#102a4c] dark:text-white">
                    {selectedApp.postTitle}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Application Date</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedApp.createdAt
                      ? new Date(selectedApp.createdAt).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Email Address</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedApp.email}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Contact Number</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedApp.phone}
                  </div>
                </div>
              </div>

              {/* Candidate Photograph Preview if uploaded */}
              {selectedApp.photoUrl && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <img
                    src={getAssetUrl(selectedApp.photoUrl)}
                    alt={selectedApp.fullName}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-[#102a4c] dark:text-white text-xs">Candidate Photograph</h5>
                    <a
                      href={getAssetUrl(selectedApp.photoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#1a5d9c] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>View Full Image</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Cover Note */}
              {selectedApp.coverNote && (
                <div>
                  <h4 className="font-bold text-[#102a4c] dark:text-white mb-1">
                    Cover Letter / Statement
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                    {selectedApp.coverNote}
                  </div>
                </div>
              )}

              {/* Dynamic Answers */}
              {selectedApp.customAnswers &&
                Object.keys(selectedApp.customAnswers).length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#102a4c] dark:text-white mb-1.5">
                      Dynamic Form Answers
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(selectedApp.customAnswers).map(([k, v]) => {
                        const isImageUrl =
                          typeof v === "string" &&
                          (v.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i) ||
                            (v.startsWith("http") && v.includes("res.cloudinary.com")));
                        const isDocUrl =
                          typeof v === "string" &&
                          (v.match(/\.(pdf|doc|docx)($|\?)/i) || (v.startsWith("http") && !isImageUrl));

                        return (
                          <div
                            key={k}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-2"
                          >
                            <span className="font-semibold capitalize text-slate-600 dark:text-slate-400">
                              {k.replace(/_/g, " ")}:
                            </span>
                            {isImageUrl ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={getAssetUrl(v)}
                                  alt={k}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shadow-2xs bg-slate-100 dark:bg-slate-800"
                                />
                                <a
                                  href={getAssetUrl(v)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#1a5d9c] hover:underline flex items-center gap-1 font-bold"
                                >
                                  <span>View Image</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : isDocUrl ? (
                              <a
                                href={getAssetUrl(v)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#1a5d9c] hover:underline flex items-center gap-1 font-bold"
                              >
                                <span>Open Document Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="font-bold text-[#102a4c] dark:text-white break-all">{v}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Resume attachment */}
              <div>
                <h4 className="font-bold text-[#102a4c] dark:text-white mb-1.5">
                  Resume / CV Document
                </h4>
                {selectedApp.resumeUrl ? (
                  <a
                    href={getAssetUrl(selectedApp.resumeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102a4c] hover:bg-[#1a5d9c] text-white font-bold shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4 text-[#f4bd4f]" />
                    <span>View Resume Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No resume URL attached.</span>
                )}
              </div>
            </div>

            {/* Stable / Fixed Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Status:</span>
                <select
                  value={selectedApp.status}
                  onChange={(e) => {
                    const id = selectedApp._id || selectedApp.id || "";
                    handleUpdateAppStatus(
                      id,
                      e.target.value as "PENDING" | "SHORTLISTED" | "REJECTED" | "HIRED"
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="HIRED">HIRED</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#102a4c] hover:bg-[#1a5d9c] text-white cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloudinary Gallery Selection Modal */}
      {isGalleryOpen && (
        <CloudinaryGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelectImage={(url: string) => {
            setFormImage(url);
            setIsGalleryOpen(false);
          }}
        />
      )}
    </div>
  );
}
