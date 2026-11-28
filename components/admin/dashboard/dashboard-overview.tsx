"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import http from "@/lib/http";
import {
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  ChevronRight,
  Plus,
} from "lucide-react";
import { RecordItem, ResourceKey } from "../types/admin.types";
import { itemId, asItems, asPaginatedPayload } from "../utils/admin.helpers";
import { API_URL } from "../config/admin.config";
import { useAuth } from "@/contexts/auth-context";
import { RefreshCw } from "lucide-react";

export function CloudinaryStorageCard({
  onNavigate,
}: {
  onNavigate?: (key: ResourceKey | string) => void;
}) {
  const [storage, setStorage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await http.get(`${API_URL}/uploads/storage`);
      const payload = res.data?.data || res.data;
      if (payload && payload.provider) {
        setStorage(payload);
      } else {
        setError("Unable to read storage usage payload");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load storage details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  if (loading && !storage) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!storage || error) {
    return null;
  }
  if (storage.provider === "local") {
    return null;
  }

  const creditUsed = Number(storage.credits?.usage || 0);
  const creditLimit = Number(storage.credits?.limit || 25);
  const creditRemaining = Number(storage.credits?.remaining ?? Math.max(0, creditLimit - creditUsed));
  const percentUsed = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;
  const storageUsed = storage.storage?.usedFormatted || "0 B";
  const storageUsedBytes = Number(storage.storage?.usedBytes || 0);
  const storageLimitBytes = creditLimit > 0 ? creditLimit * 1024 * 1024 * 1024 : 25 * 1024 * 1024 * 1024;
  const storageRemainingBytes = Math.max(0, storageLimitBytes - storageUsedBytes);
  const formatStorageGb = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb <= 0) return "0 GB";
    if (gb < 0.01) return "<0.01 GB";
    return `${gb.toFixed(2)} GB`;
  };
  const storedFilesCount = Number(storage.resources?.total ?? storage.resources?.objects ?? storage.objects?.usage ?? 0);
  const isCritical = percentUsed >= 90;
  const isWarning = percentUsed >= 70 && !isCritical;

  const barColor = isCritical
    ? "bg-rose-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d7e4ef] bg-white p-5 shadow-xs transition hover:border-[#1f6fa8] hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 border border-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              Cloudinary Media CDN
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {storage.plan || "Free Tier"}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#6b7c8f]">
            Cloudinary Storage & Credits
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#143046]">
              {storedFilesCount > 0 ? storedFilesCount : "—"}
            </span>
            <span className="text-xs font-medium text-[#6b7c8f]">stored files</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStorage(true)}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-xs transition hover:bg-slate-50 hover:text-[#1f6fa8] disabled:opacity-50 cursor-pointer"
            title="Refresh Cloudinary usage"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-[#1f6fa8]" : ""} />
          </button>
          <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-[#edf2f7] pt-3 text-xs text-[#6b7c8f] space-y-2">
        <div className="flex items-center justify-between">
          <span>Credits:</span>
          <span className="font-semibold text-[#143046]">
            {creditRemaining.toFixed(2)} / {creditLimit} Left ({percentUsed.toFixed(1)}% used)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(3, percentUsed))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>Used: {storageUsedBytes > 0 ? formatStorageGb(storageUsedBytes) : storageUsed}</span>
          <span className="font-medium text-emerald-600">
            {formatStorageGb(storageRemainingBytes)} Free
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview({
  onNavigateAction,
}: {
  onNavigateAction?: (key: ResourceKey | string) => void;
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({
    students: 0,
    staff: 0,
    inquiries: 0,
    news: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState<RecordItem[]>([]);

  const handleNavigate = useCallback(
    (key: string) => {
      if (onNavigateAction) {
        onNavigateAction(key);
      } else {
        router.push(`/admin/${key}`);
      }
    },
    [onNavigateAction, router],
  );

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const [studentsRes, staffRes, inqRes, newsRes] = await Promise.allSettled([
        http.get(`${API_URL}/students?limit=1`, { headers }),
        http.get(`${API_URL}/staff?limit=1`, { headers }),
        http.get(`${API_URL}/inquiries?limit=4&sortBy=createdAt&sortOrder=desc`, { headers }),
        http.get(`${API_URL}/news?limit=1`, { headers }),
      ]);

      const newCounts: Record<string, number> = {
        students: 0,
        staff: 0,
        inquiries: 0,
        news: 0,
      };

      if (studentsRes.status === "fulfilled") {
        const p = asPaginatedPayload(studentsRes.value.data);
        newCounts.students = p?.meta?.total ?? asItems(studentsRes.value.data).length;
      }
      if (staffRes.status === "fulfilled") {
        const p = asPaginatedPayload(staffRes.value.data);
        newCounts.staff = p?.meta?.total ?? asItems(staffRes.value.data).length;
      }
      if (newsRes.status === "fulfilled") {
        const p = asPaginatedPayload(newsRes.value.data);
        newCounts.news = p?.meta?.total ?? asItems(newsRes.value.data).length;
      }
      if (inqRes.status === "fulfilled") {
        const p = asPaginatedPayload(inqRes.value.data);
        newCounts.inquiries = p?.meta?.total ?? asItems(inqRes.value.data).length;
        setRecentInquiries(p?.items ?? asItems(inqRes.value.data));
      }

      setCounts(newCounts);
    } catch (err) {
      console.warn("Failed to fetch dashboard counts:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchDashboardStats();
  }, [fetchDashboardStats]);

  const cards = [
    {
      key: "students",
      label: "Students",
      icon: GraduationCap,
      tint: "bg-blue-50 text-blue-700",
      count: counts.students,
    },
    {
      key: "staff",
      label: "Staff members",
      icon: Users,
      tint: "bg-violet-50 text-violet-700",
      count: counts.staff,
    },
    {
      key: "inquiries",
      label: "Open enquiries",
      icon: ClipboardList,
      tint: "bg-amber-50 text-amber-700",
      count: counts.inquiries,
    },
    {
      key: "news",
      label: "News announcements",
      icon: FileText,
      tint: "bg-emerald-50 text-emerald-700",
      count: counts.news,
    },
  ];

  const actions = [
    { key: "students", title: "Add student", text: "Create an enrolment record" },
    { key: "news", title: "Publish news", text: "Share an important update" },
    { key: "gallery", title: "Update gallery", text: "Add campus moments" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="overflow-hidden rounded-2xl bg-[#102a4c] p-5 sm:p-7 text-white shadow-xl relative">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#ffd983]">
            Operations at a glance
          </span>
          <h2 className="mt-3 sm:mt-4 font-display text-xl sm:text-3xl font-bold leading-tight">
            Everything your school needs, in one calm workspace.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-5 sm:leading-6 text-blue-100">
            Manage people, public content and day-to-day communication from the same dashboard.
          </p>
        </div>
        <div className="pointer-events-none absolute right-12 top-24 hidden h-52 w-52 rounded-full border-[32px] border-[#f4bd4f]/20 lg:block" />
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, tint, count }) => (
          <button
            key={key}
            onClick={() => handleNavigate(key)}
            className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
              <Icon size={20} />
            </div>
            <p className="mt-5 text-3xl font-bold text-[#102a4c]">
              {loading ? "—" : count}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <ChevronRight
                className="text-slate-300 transition group-hover:translate-x-1"
                size={17}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Cloudinary & Media Storage Live Monitor (Matches amid-ngo-dev exact card style) */}
      <CloudinaryStorageCard onNavigate={(k) => handleNavigate(k)} />

      {/* Recent Enquiries & Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#102a4c]">
                Recent enquiries
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Follow up with prospective families
              </p>
            </div>
            <button
              onClick={() => handleNavigate("inquiries")}
              className="text-xs sm:text-sm font-bold text-[#1a5d9c] hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recentInquiries.slice(0, 4).map((item) => (
              <div
                key={itemId(item)}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dce9f8] text-sm font-bold text-[#1a5d9c]">
                  {String(item.name || "?").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-700">
                    {String(item.name || "New enquiry")}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {String(item.inquiryType || "General inquiry")}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  {String(item.status || "Pending")}
                </span>
              </div>
            ))}
            {!loading && recentInquiries.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-400">
                No enquiries recorded yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#102a4c]">
            Quick actions
          </h3>
          <div className="mt-4 space-y-2">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleNavigate(action.key)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#edf5fc] cursor-pointer"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#fdf3da] text-[#b7790a]">
                  <Plus size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{action.title}</p>
                  <p className="text-xs text-slate-500">{action.text}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
