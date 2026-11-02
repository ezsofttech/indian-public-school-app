"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Briefcase,
  Search,
  CheckCircle2,
  FileText,
  Upload,
  X,
  LoaderCircle,
  ArrowRight,
  GraduationCap,
  Award,
  Building,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Info,
} from "lucide-react";
import { API_URL } from "@/lib/api-client";
import { FileUploadProgressLoader, FileUploadStatus } from "@/components/ui/FileUploadProgressLoader";
import { getAssetUrl } from "@/lib/utils";
import { DEFAULT_HERO_IMAGE } from "@/lib/site-data";
import { CareerThumbnail } from "@/components/admin/careers/CareersAdmin";

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

export interface CareerPost {
  _id?: string;
  id?: string;
  title: string;
  qualification: string;
  image?: string;
  description?: string;
  customFields?: CustomField[];
  applicationFields?: ApplicationField[];
  isActive: boolean;
  createdAt?: string;
}

export function CareersView() {
  const [posts, setPosts] = useState<CareerPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Apply Modal State
  const [selectedPost, setSelectedPost] = useState<CareerPost | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [candidatePhoto, setCandidatePhoto] = useState<string>("");
  const [candidatePhotoPreview, setCandidatePhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
  const [coverNote, setCoverNote] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [uploadingResume, setUploadingResume] = useState<boolean>(false);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
  const [uploadingDynamicKey, setUploadingDynamicKey] = useState<string | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Success Confirmation Receipt Modal State
  const [successAppNo, setSuccessAppNo] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Fetch Career Openings
  const fetchOpenings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/careers?isActive=true`);
      const body = res.data;
      const list = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.items)
          ? body.items
          : Array.isArray(body)
            ? body
            : [];
      setPosts(list);
    } catch (err) {
      console.error("Failed to load active career openings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings();
  }, []);

  // Collect unique custom field labels across all posts to build dynamic table columns!
  const dynamicColumnKeys = useMemo(() => {
    const keysMap = new Map<string, string>();
    posts.forEach((p) => {
      if (Array.isArray(p.customFields)) {
        p.customFields.forEach((cf) => {
          if (cf.key && cf.label && !keysMap.has(cf.key)) {
            keysMap.set(cf.key, cf.label);
          }
        });
      }
    });
    return Array.from(keysMap.entries());
  }, [posts]);

  // Open Apply Modal
  const handleOpenApplyModal = (post: CareerPost) => {
    setSelectedPost(post);
    setFullName("");
    setEmail("");
    setPhone("");
    setCandidatePhoto("");
    setCandidatePhotoPreview("");
    setPhotoUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    setCoverNote("");
    setResumeUrl("");
    setCustomAnswers({});
    setErrorMsg("");
  };

  // Resume File Upload to API
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setErrorMsg("");

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setResumeUploadStatus({
      isUploading: true,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: file.type,
      previewUrl,
      progress: 5,
      step: "preparing",
      stageMessage: "Preparing resume…",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("album", "Resumes");
      formData.append("folder", "indian-public-school/assets/Resumes");

      setResumeUploadStatus((prev) => ({
        ...prev,
        progress: 15,
        step: "uploading",
        stageMessage: "Uploading resume…",
      }));

      const res = await axios.post(`${API_URL}/uploads/public`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setResumeUploadStatus((prev) => ({
              ...prev,
              progress: Math.min(pct, 95),
              step: pct >= 95 ? "processing" : "uploading",
              stageMessage: pct >= 95 ? "Processing resume…" : `Uploading resume (${pct}%)…`,
            }));
          }
        },
      });

      setResumeUploadStatus((prev) => ({
        ...prev,
        progress: 98,
        step: "processing",
        stageMessage: "Processing resume…",
      }));

      const body = res.data;
      const uploadedUrl =
        body?.data?.url ||
        body?.data?.fileUrl?.[0] ||
        body?.url ||
        (Array.isArray(body?.fileUrl) ? body.fileUrl[0] : null);

      if (uploadedUrl) {
        setResumeUrl(uploadedUrl);
        setResumeUploadStatus((prev) => ({
          ...prev,
          progress: 100,
          step: "done",
          stageMessage: "Resume uploaded successfully!",
        }));
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        throw new Error("Upload response did not return a valid URL.");
      }
    } catch (err: any) {
      console.error("Resume upload error:", err);
      const errMsg = "Failed to upload resume file. You can also paste a resume document URL directly.";
      setErrorMsg(errMsg);
      setResumeUploadStatus((prev) => ({
        ...prev,
        step: "error",
        errorMessage: errMsg,
        stageMessage: "Resume upload failed.",
      }));
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setUploadingResume(false);
      setResumeUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    }
  };

  // Candidate Photo Upload to API
  const handleCandidatePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg("");

    const previewUrl = URL.createObjectURL(file);
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setCandidatePhotoPreview(previewUrl);
    setPhotoUploadStatus({
      isUploading: true,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: file.type,
      previewUrl,
      progress: 10,
      step: "preparing",
      stageMessage: "Preparing photo…",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("album", "CandidatePhotos");
      formData.append("folder", "indian-public-school/assets/CareerApplications");

      setPhotoUploadStatus((prev) => ({
        ...prev,
        progress: 25,
        step: "uploading",
        stageMessage: "Uploading photo…",
      }));

      const res = await axios.post(`${API_URL}/uploads/public`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setPhotoUploadStatus((prev) => ({
              ...prev,
              progress: Math.min(pct, 95),
              step: pct >= 95 ? "processing" : "uploading",
              stageMessage: pct >= 95 ? "Processing photo…" : `Uploading photo (${pct}%)…`,
            }));
          }
        },
      });

      const body = res.data;
      const uploadedUrl =
        body?.data?.url ||
        body?.data?.fileUrl?.[0] ||
        body?.url ||
        (Array.isArray(body?.fileUrl) ? body.fileUrl[0] : null);

      if (uploadedUrl) {
        setCandidatePhoto(uploadedUrl);
        setPhotoUploadStatus((prev) => ({
          ...prev,
          progress: 100,
          step: "done",
          stageMessage: "Photo uploaded successfully!",
        }));
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        throw new Error("Upload did not return a valid photo URL.");
      }
    } catch (err: any) {
      console.error("Candidate photo upload failed:", err);
      const msg = "Failed to upload photo. You can paste a direct photo URL.";
      setErrorMsg(msg);
      setPhotoUploadStatus((prev) => ({
        ...prev,
        step: "error",
        errorMessage: msg,
      }));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setUploadingPhoto(false);
      setPhotoUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
    }
  };

  // Dynamic Question File / Image Upload
  const handleDynamicFileUpload = async (key: string, file: File) => {
    setUploadingDynamicKey(key);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("album", "CareerApplications");
      formData.append("folder", "indian-public-school/assets/CareerApplications");

      const res = await axios.post(`${API_URL}/uploads/public`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const body = res.data;
      const uploadedUrl =
        body?.data?.url ||
        body?.data?.fileUrl?.[0] ||
        body?.url ||
        (Array.isArray(body?.fileUrl) ? body.fileUrl[0] : null);

      if (uploadedUrl) {
        setCustomAnswers((prev) => ({ ...prev, [key]: uploadedUrl }));
      } else {
        throw new Error("Failed to receive uploaded file link");
      }
    } catch (err: any) {
      console.error("Dynamic file upload failed:", err);
      setErrorMsg(`Failed to upload file for question. Please try again or paste a link.`);
    } finally {
      setUploadingDynamicKey(null);
    }
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    const postId = selectedPost._id || selectedPost.id;
    if (!postId) return;

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg("Please fill in your Name, Email, and Phone number.");
      return;
    }

    if (uploadingPhoto || photoUploadStatus.isUploading) {
      setErrorMsg("Please wait for candidate photograph to finish uploading.");
      return;
    }

    if (!candidatePhoto.trim()) {
      setErrorMsg("Please upload your Candidate Photograph / Passport Photo.");
      return;
    }

    if (uploadingResume || resumeUploadStatus.isUploading) {
      setErrorMsg("Please wait for your resume file to finish uploading.");
      return;
    }

    if (!resumeUrl.trim()) {
      setErrorMsg("Please upload your Resume / CV file (PDF / Word).");
      return;
    }

    if (Array.isArray(selectedPost.applicationFields)) {
      for (const q of selectedPost.applicationFields) {
        if (q.required && (!customAnswers[q.key] || !customAnswers[q.key].trim())) {
          setErrorMsg(`Please answer required question: "${q.label}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        postId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        coverNote: coverNote.trim(),
        resumeUrl: resumeUrl.trim(),
        photoUrl: candidatePhoto.trim(),
        customAnswers: {
          ...customAnswers,
          ...(candidatePhoto ? { applicant_photo: candidatePhoto.trim() } : {}),
        },
      };

      const res = await axios.post(`${API_URL}/careers/apply`, payload);
      const data = res.data?.data || res.data;

      const appNo = data?.applicationNo || `APP-${new Date().getFullYear()}-SUBMITTED`;

      setSelectedPost(null);
      setSuccessAppNo(appNo);
    } catch (err: any) {
      console.error("Application submission failed:", err);
      setErrorMsg(
        err?.response?.data?.message || "Failed to submit application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.qualification.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pb-16">
      {/* Signature Indian Public School Hero Banner (Consistent with Dynamic Pages) */}
      <section
        className="relative overflow-hidden py-14 sm:py-18 text-white shadow-xl border-b-2 border-[var(--gold)]/40"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={getAssetUrl(DEFAULT_HERO_IMAGE)}
            alt="Careers"
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
                Careers
              </span>
            </div>
          </nav>

          <div className="mt-2 space-y-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md leading-tight font-[var(--font-display)]">
              Careers
            </h1>
          </div>
        </div>
      </section>

      {/* Main Dynamic Table Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Search Filter Bar */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search openings by post name, qualification, or department..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5d9c] text-xs placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--navy)] dark:text-white flex items-center gap-2 font-[var(--font-display)]">
              Open Positions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review vacancies below and click Apply in the last column to open the application form.
            </p>
          </div>
        </div>

        {/* Dynamic Table Card */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden"
          style={{ borderRadius: "var(--card-radius, 1.5rem)" }}
        >
          {loading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <LoaderCircle className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <span className="text-sm font-medium">Fetching current career openings...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 font-[var(--font-display)]">
                No active job openings matching your search
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check back soon or search for alternative keywords.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {/* Signature IPS Navy Header Bar */}
                  <tr className="bg-[var(--navy)] text-white text-xs font-bold uppercase tracking-wider font-[var(--font-display)]">
                    <th className="py-4 px-4 text-center w-16 border-r border-white/10">S.No</th>
                    <th className="py-4 px-4 w-20 text-center border-r border-white/10">Image</th>
                    <th className="py-4 px-5 border-r border-white/10">Name of Post</th>
                    <th className="py-4 px-5 border-r border-white/10">Qualification</th>

                    {/* DYNAMIC EXTRA COLUMNS DEFINED BY ADMIN */}
                    {dynamicColumnKeys.map(([key, label]) => (
                      <th key={key} className="py-4 px-5 border-r border-white/10">
                        {label}
                      </th>
                    ))}

                    <th className="py-4 px-5 text-center w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {filteredPosts.map((post, idx) => {
                    const id = post._id || post.id || String(idx);
                    const cfMap = new Map<string, string>();
                    if (Array.isArray(post.customFields)) {
                      post.customFields.forEach((cf) => cfMap.set(cf.key, cf.value));
                    }

                    return (
                      <tr
                        key={id}
                        className="hover:bg-[var(--primary)]/5 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* 1. S.No */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* 2. Image */}
                        <td className="py-4 px-4 text-center">
                          <CareerThumbnail
                            src={post.image}
                            title={post.title}
                            className="w-11 h-11 object-cover border border-slate-200 dark:border-slate-700 shadow-2xs mx-auto"
                            style={{ borderRadius: "var(--logo-radius, 0.75rem)" }}
                            fallbackClassName="w-11 h-11 bg-[var(--navy)] text-[var(--gold)] font-extrabold flex items-center justify-center shadow-xs mx-auto text-xs border border-white/10 shrink-0"
                          />
                        </td>

                        {/* 3. Name of Post */}
                        <td className="py-4 px-5 font-bold text-[var(--navy)] dark:text-white text-sm">
                          <div>{post.title}</div>
                          {post.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal line-clamp-1 mt-0.5">
                              {post.description}
                            </div>
                          )}
                        </td>

                        {/* 4. Qualification */}
                        <td className="py-4 px-5 font-medium text-slate-600 dark:text-slate-300">
                          {post.qualification}
                        </td>

                        {/* 5. DYNAMIC EXTRA COLUMNS */}
                        {dynamicColumnKeys.map(([key]) => {
                          const val = cfMap.get(key) || "-";
                          return (
                            <td key={key} className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                              <span
                                className="px-2.5 py-1 bg-[var(--gold)]/15 text-[var(--navy)] dark:bg-slate-800 dark:text-amber-300 font-bold text-[11px] border border-[var(--gold)]/30"
                                style={{ borderRadius: "var(--badge-radius, 9999px)" }}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        })}

                        {/* 6. Apply Action Button (Last Field) */}
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleOpenApplyModal(post)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--navy)] text-[var(--gold)] hover:text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                            style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE APPLICATION FORM MODAL */}
      {/* ========================================================= */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy-deep)]/75 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: "var(--card-radius, 1.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stable / Fixed Header */}
            <div className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex items-start justify-between gap-4">
              <div>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--gold)]/15 text-[var(--navy)] dark:text-amber-300 font-bold text-[11px] border border-[var(--gold)]/30"
                  style={{ borderRadius: "var(--badge-radius, 9999px)" }}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Applying for Position
                </span>
                <h3 className="text-xl font-bold text-[var(--navy)] dark:text-white mt-1.5 font-[var(--font-display)]">
                  {selectedPost.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Qualification required: {selectedPost.qualification}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitApplication} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
                {errorMsg && (
                  <div
                    className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs"
                    style={{ borderRadius: "var(--card-radius, 1rem)" }}
                  >
                    {errorMsg}
                  </div>
                )}

                {/* Applying for Position (Readonly / Disabled Input Field) */}
                <div>
                  <label className="block font-semibold text-[var(--navy)] dark:text-slate-200 mb-1">
                    Applying for Position
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={selectedPost.title}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed outline-none select-all shadow-2xs"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block font-semibold text-[var(--navy)] dark:text-slate-200 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition-all"
                      style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block font-semibold text-[var(--navy)] dark:text-slate-200 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 Mobile number"
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition-all"
                      style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-[var(--navy)] dark:text-slate-200 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition-all"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  />
                </div>

                {/* Candidate Photograph / Passport Image Field */}
                <div
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  style={{ borderRadius: "var(--card-radius, 1rem)" }}
                >
                  <label className="block font-semibold text-[var(--navy)] dark:text-slate-200">
                    Candidate Photograph / Passport Photo <span className="text-red-500">*</span>
                  </label>

                  {candidatePhoto ? (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <img
                        src={candidatePhotoPreview || getAssetUrl(candidatePhoto)}
                        alt="Candidate Photo Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 bg-slate-100 dark:bg-slate-800"
                        onError={(e) => {
                          if (candidatePhotoPreview && e.currentTarget.src !== candidatePhotoPreview) {
                            e.currentTarget.src = candidatePhotoPreview;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Photo Attached Successfully</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{candidatePhoto}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCandidatePhoto("");
                            setCandidatePhotoPreview("");
                          }}
                          className="text-[11px] text-red-500 hover:text-red-700 font-bold underline mt-1 cursor-pointer"
                        >
                          Remove & Re-upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[var(--primary)] bg-white dark:bg-slate-900 text-[var(--primary)] font-semibold cursor-pointer hover:bg-[var(--primary)]/10 transition-colors"
                        style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                      >
                        {uploadingPhoto ? (
                          <LoaderCircle className="w-4 h-4 animate-spin text-[var(--primary)]" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{uploadingPhoto ? "Uploading Photo..." : "Upload Photo (JPG/PNG)"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCandidatePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        disabled
                        readOnly
                        value={candidatePhoto}
                        placeholder="Candidate photo required * (upload photo using button above)"
                        className="flex-1 px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs cursor-not-allowed outline-none select-all"
                        style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                      />
                    </div>
                  )}

                  {photoUploadStatus.isUploading && (
                    <div className="pt-2">
                      <FileUploadProgressLoader status={photoUploadStatus} />
                    </div>
                  )}
                </div>

                {/* Cover Note */}
                <div>
                  <label className="block font-semibold text-[var(--navy)] dark:text-slate-200 mb-1">Cover Note / Brief Intro</label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Tell us briefly about your teaching experience, subjects, or why you want to join Indian Public School..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition-all"
                    style={{ borderRadius: "var(--card-radius, 0.75rem)" }}
                  />
                </div>

                {/* DYNAMIC APPLICATION FORM QUESTIONS DEFINED FOR THIS POST */}
                {Array.isArray(selectedPost.applicationFields) &&
                  selectedPost.applicationFields.length > 0 && (
                    <div
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                      style={{ borderRadius: "var(--card-radius, 1rem)" }}
                    >
                      <h4 className="font-bold text-[var(--navy)] dark:text-white text-xs font-[var(--font-display)]">
                        Additional Position Questions
                      </h4>
                      {selectedPost.applicationFields.map((q) => (
                        <div key={q.key}>
                          <label className="block font-semibold mb-1">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                          </label>

                          {q.type === "image" || q.type === "file" ? (
                            <div className="space-y-2">
                              {customAnswers[q.key] ? (
                                <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                  {q.type === "image" ||
                                  customAnswers[q.key].match(/\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i) ? (
                                    <img
                                      src={getAssetUrl(customAnswers[q.key])}
                                      alt={q.label}
                                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                                    />
                                  ) : (
                                    <FileText className="w-8 h-8 text-[#1a5d9c] shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>File Uploaded</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 truncate block font-mono">
                                      {customAnswers[q.key]}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomAnswers((prev) => {
                                          const next = { ...prev };
                                          delete next[q.key];
                                          return next;
                                        })
                                      }
                                      className="text-[11px] text-red-500 hover:text-red-700 underline font-semibold mt-0.5 cursor-pointer"
                                    >
                                      Remove & Replace
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <label
                                    className="flex items-center justify-center gap-2 px-3.5 py-2 border border-dashed border-[var(--primary)] bg-white dark:bg-slate-900 text-[var(--primary)] font-semibold cursor-pointer hover:bg-[var(--primary)]/10 transition-colors"
                                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                                  >
                                    {uploadingDynamicKey === q.key ? (
                                      <LoaderCircle className="w-4 h-4 animate-spin text-[var(--primary)]" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                    <span>
                                      {uploadingDynamicKey === q.key
                                        ? "Uploading..."
                                        : q.type === "image"
                                        ? `Upload ${q.label} Image`
                                        : `Upload ${q.label} Document`}
                                    </span>
                                    <input
                                      type="file"
                                      accept={q.type === "image" ? "image/*" : ".pdf,.doc,.docx,image/*"}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) void handleDynamicFileUpload(q.key, f);
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    disabled
                                    readOnly
                                    value={customAnswers[q.key] || ""}
                                    placeholder="No file attached (upload using button)"
                                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs cursor-not-allowed outline-none select-all"
                                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : q.type === "textarea" ? (
                            <textarea
                              rows={2}
                              required={q.required}
                              value={customAnswers[q.key] || ""}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.key]: e.target.value })
                              }
                              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                              style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                            />
                          ) : q.type === "select" && q.options ? (
                            <select
                              required={q.required}
                              value={customAnswers[q.key] || ""}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.key]: e.target.value })
                              }
                              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                              style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                            >
                              <option value="">Select option...</option>
                              {q.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={q.type || "text"}
                              required={q.required}
                              value={customAnswers[q.key] || ""}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.key]: e.target.value })
                              }
                              placeholder={`Enter ${q.label}`}
                              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                              style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Resume Document Upload / URL Attachment */}
                <div
                  className="p-4 bg-[var(--primary)]/5 dark:bg-slate-800/60 border border-[var(--primary)]/20 dark:border-slate-700 space-y-2"
                  style={{ borderRadius: "var(--card-radius, 1rem)" }}
                >
                  <label className="block font-bold text-[var(--navy)] dark:text-white">
                    Resume / CV File (PDF / Word) <span className="text-red-500">*</span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[var(--primary)] bg-white dark:bg-slate-900 text-[var(--primary)] font-semibold cursor-pointer hover:bg-[var(--primary)]/10 transition-colors"
                      style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                    >
                      {uploadingResume ? (
                        <LoaderCircle className="w-4 h-4 animate-spin text-[var(--primary)]" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{uploadingResume ? "Uploading Resume..." : "Upload Resume File"}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeFileUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      disabled
                      readOnly
                      value={resumeUrl}
                      placeholder="Resume file required * (upload using button above)"
                      className="flex-1 px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs cursor-not-allowed outline-none select-all"
                      style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                    />
                    {resumeUrl && (
                      <button
                        type="button"
                        onClick={() => setResumeUrl("")}
                        className="px-3 py-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/30 rounded-xl font-bold cursor-pointer text-xs shrink-0"
                        title="Remove attached resume"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {(resumeUploadStatus.isUploading || resumeUploadStatus.step === "done" || resumeUploadStatus.step === "error") && (
                    <div className="pt-2">
                      <FileUploadProgressLoader status={resumeUploadStatus} />
                    </div>
                  )}

                  {resumeUrl && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resume attached successfully!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons (Stable / Fixed footer) */}
              <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 font-bold bg-[var(--primary)] hover:bg-[var(--navy)] text-[var(--gold)] hover:text-white shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                >
                  {submitting ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{submitting ? "Submitting Application..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUCCESS CONFIRMATION RECEIPT MODAL */}
      {/* ========================================================= */}
      {successAppNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy-deep)]/75 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 text-center space-y-5 animate-in fade-in zoom-in duration-200"
            style={{ borderRadius: "var(--card-radius, 1.5rem)" }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--navy)] dark:text-white font-[var(--font-display)]">
                Application Submitted!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your application has been received successfully by the IPS HR recruitment team.
              </p>
            </div>

            {/* Application Reference ID Box */}
            <div
              className="p-4 bg-[var(--gold)]/10 dark:bg-amber-950/40 border border-[var(--gold)]/30 space-y-1"
              style={{ borderRadius: "var(--card-radius, 1rem)" }}
            >
              <span className="text-[11px] font-semibold text-[var(--navy)] dark:text-amber-400 uppercase tracking-wider">
                Application Reference Number
              </span>
              <div className="flex items-center justify-center gap-2 font-mono font-extrabold text-lg text-[var(--primary)] dark:text-white">
                <span>{successAppNo}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(successAppNo);
                    setCopiedRef(true);
                    setTimeout(() => setCopiedRef(false), 2000);
                  }}
                  className="p-1 text-[var(--primary)] hover:text-[var(--navy)] cursor-pointer"
                  title="Copy Reference ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedRef && (
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Reference ID copied to clipboard!
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Our recruitment team will review your application details and contact shortlisted candidates via email or phone.
            </p>

            <button
              onClick={() => setSuccessAppNo(null)}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--navy)] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              style={{ borderRadius: "var(--btn-radius, 1rem)" }}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
