"use client";

import { useState, useEffect, useMemo } from "react";
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

export interface CustomField {
  key: string;
  label: string;
  value: string;
}

export interface ApplicationField {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "file" | "select" | "textarea";
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
  const [coverNote, setCoverNote] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [uploadingResume, setUploadingResume] = useState<boolean>(false);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    progress: 0,
    step: "preparing",
  });
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
      stageMessage: "Step 1/3: Reading resume payload & initializing server upload…",
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
        stageMessage: "Step 2/3: Transmitting resume document to Cloudinary CDN…",
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
              stageMessage:
                pct >= 95
                  ? "Step 3/3: Processing document & generating CDN link…"
                  : `Step 2/3: Transmitting resume (${pct}%)…`,
            }));
          }
        },
      });

      setResumeUploadStatus((prev) => ({
        ...prev,
        progress: 98,
        step: "processing",
        stageMessage: "Step 3/3: Generating secure document link…",
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
          stageMessage: "Upload complete! Resume attached.",
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setUploadingResume(false);
      setResumeUploadStatus({ isUploading: false, progress: 0, step: "preparing" });
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
        customAnswers,
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
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pt-24 pb-16">
      {/* Signature Indian Public School Hero Banner */}
      <section
        className="relative overflow-hidden mb-12 text-white"
        style={{ background: "var(--gradient-navy, linear-gradient(140deg, #102a4c, #1a5d9c))" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/50" />
        <div className="pointer-events-none absolute right-12 top-10 hidden h-64 w-64 rounded-full border-[32px] border-[var(--gold)]/15 lg:block" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-[var(--gold)] border border-white/20 shadow-xs"
            style={{ borderRadius: "var(--badge-radius, 9999px)" }}
          >
            <span>Join Our Educator Family</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-[var(--font-display)] text-white">
            Careers & Current Openings
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-blue-100 leading-relaxed">
            Build a rewarding career at Indian Public School. Explore our dynamic current job openings, review requirements, and submit your application online.
          </p>

          {/* Search Filter Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search openings by post name, qualification, or department..."
                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 shadow-xl border border-white/40 focus:outline-none focus:ring-4 focus:ring-[var(--gold)]/50 text-sm placeholder:text-slate-400 transition-all"
                style={{ borderRadius: "var(--btn-radius, 1rem)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Table Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--navy)] dark:text-white flex items-center gap-2 font-[var(--font-display)]">
              Open Positions ({filteredPosts.length})
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
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-11 h-11 object-cover border border-slate-200 dark:border-slate-700 shadow-2xs mx-auto"
                              style={{ borderRadius: "var(--logo-radius, 0.75rem)" }}
                            />
                          ) : (
                            <div
                              className="w-11 h-11 bg-[var(--navy)] text-[var(--gold)] font-extrabold flex items-center justify-center shadow-xs mx-auto text-xs border border-white/10"
                              style={{ borderRadius: "var(--logo-radius, 0.75rem)" }}
                            >
                              {post.title.substring(0, 2).toUpperCase()}
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--navy-deep)]/75 backdrop-blur-sm overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: "var(--card-radius, 1.5rem)" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--gold)]/15 text-[var(--navy)] font-bold text-[11px] border border-[var(--gold)]/30"
                  style={{ borderRadius: "var(--badge-radius, 9999px)" }}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Applying for Position
                </span>
                <h3 className="text-xl font-bold text-[var(--navy)] dark:text-white mt-1 font-[var(--font-display)]">
                  {selectedPost.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Qualification required: {selectedPost.qualification}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div
                className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs"
                style={{ borderRadius: "var(--card-radius, 1rem)" }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
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

                        {q.type === "textarea" ? (
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
                  Resume / CV File (PDF / Word)
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
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="Or paste Google Drive / Cloudinary resume URL"
                    className="flex-1 px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                  />
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

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  style={{ borderRadius: "var(--btn-radius, 0.75rem)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 font-bold bg-[var(--primary)] hover:bg-[var(--navy)] text-[var(--gold)] hover:text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
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
