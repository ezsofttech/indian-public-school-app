import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  ChevronRight,
  Plus,
  LayoutDashboard,
  Check,
  Cloud,
  HardDrive,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Cpu,
  ArrowUpRight,
} from "lucide-react";
import { RecordItem, ResourceKey } from "../types/admin.types";
import { itemId } from "../utils/admin.helpers";
import { API_URL } from "../config/admin.config";
import { getMediaDeliveryPreset, setMediaDeliveryPreset } from "@/lib/utils";

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-12 text-center text-sm text-slate-400">{text}</div>;
}

export function StructuredHomeSettingsView({ homeData }: { homeData: any }) {
  if (!homeData) return null;

  const header = homeData.identity?.header || homeData.header || {};
  const footer = homeData.identity?.footer || homeData.footer || {};
  const sections = homeData.sections || {};
  const hero = sections.hero || {};
  const banner = sections.banner || {};
  const quickCards = Array.isArray(sections.quickCards) ? sections.quickCards : [];

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-slate-50 p-4 shadow-xs">
      {/* Identity & Notice Bar */}
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-[#1a5d9c]">
              <LayoutDashboard size={15} />
            </span>
            <div>
              <h4 className="font-bold text-sm text-[#102a4c]">{header.logoText || "Indian Public School"}</h4>
              <p className="text-[11px] text-slate-400">{header.logoSubText || "School Identity & Header"}</p>
            </div>
          </div>
          {header.noticeText && (
            <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              Notice Active
            </span>
          )}
        </div>

        {header.noticeText && (
          <div className="mb-3 rounded-xl bg-[#102a4c] p-3 text-white shadow-xs">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#ffd983]">Banner Notice Text</p>
            <p className="text-xs font-semibold mt-0.5">{header.noticeText}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
          <div><span className="text-slate-400">Phone:</span> {header.phone || "—"}</div>
          <div><span className="text-slate-400">Email:</span> {header.email || "—"}</div>
          <div><span className="text-slate-400">CTA Button:</span> {header.ctaText || "—"}</div>
          <div><span className="text-slate-400">CTA Link:</span> {header.ctaUrl || "—"}</div>
        </div>
      </div>

      {/* Hero & Banner Section Card */}
      {(hero.title || banner.noticeTitle) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hero.title && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Hero Section</span>
              <p className="text-xs font-bold text-[#102a4c] mt-1 line-clamp-2">{hero.title}</p>
              {hero.subtitle && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{hero.subtitle}</p>}
            </div>
          )}

          {banner.noticeTitle && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Announcement Banner</span>
              <p className="text-xs font-bold text-slate-800 mt-1">{banner.noticeTitle}</p>
              {banner.noticeSubtitle && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{banner.noticeSubtitle}</p>}
            </div>
          )}
        </div>
      )}

      {/* Quick Cards Count */}
      {quickCards.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Quick Action Cards ({quickCards.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickCards.map((qc: any, idx: number) => (
              <span key={idx} className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-xs font-bold text-[#1a5d9c]">
                {qc.title || `Card #${idx + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Sections List */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Configured Home Sections ({Object.keys(sections).length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(sections).map((sKey) => (
            <span key={sKey} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              {sKey}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CloudinaryStorageCard({
  onNavigate,
}: {
  onNavigate?: (key: ResourceKey) => void;
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
      const res = await axios.get(`${API_URL}/uploads/storage`);
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

  // Allowed limit in GB (from provider plan limit, default 25 GB)
  const limitGB = Number(storage.credits?.limit || 25);

  // Storage used in bytes converted to GB
  const usedBytes = Number(storage.storage?.usedBytes || 0);
  const usedGB = usedBytes > 0
    ? usedBytes / (1024 * 1024 * 1024)
    : Number(storage.storage?.creditsUsage || 0);

  const usedGBFormatted = usedGB < 0.01 && usedGB > 0 ? "0.01" : usedGB.toFixed(2);
  const limitGBFormatted = limitGB.toFixed(0);
  const remainingGB = Math.max(0, limitGB - usedGB);
  const remainingGBFormatted = remainingGB.toFixed(2);

  const percentUsed = limitGB > 0 ? Math.min(100, (usedGB / limitGB) * 100) : 0;
  const percentRemaining = Math.max(0, 100 - percentUsed).toFixed(1);

  const isCritical = percentUsed >= 90;
  const isWarning = percentUsed >= 75 && !isCritical;

  const barColor = isCritical
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Icon & Used info in GB */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#1a5d9c]">
            <Cloud size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#102a4c]">Cloud Storage</h4>
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Used:</span>{" "}
              <span title={storage.storage?.usedFormatted || undefined} className="font-medium text-slate-800">
                {usedGBFormatted}/{limitGBFormatted} GB
              </span>
            </p>
          </div>
        </div>

        {/* Right: Remaining info & Refresh */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500">Remaining: </span>
            <span className={`text-xs font-bold ${isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-700"}`}>
              {remainingGBFormatted} GB ({percentRemaining}%)
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchStorage(true)}
            disabled={refreshing}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            title="Refresh storage usage"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(3, percentUsed))}%` }}
        />
      </div>
    </div>
  );
}

export function Overview({
  data,
  loading,
  onNavigate,
}: {
  data: Partial<Record<ResourceKey, RecordItem[]>>;
  loading: boolean;
  onNavigate: (key: ResourceKey) => void;
}) {
  const cards = [
    { key: "students" as const, label: "Students", icon: GraduationCap, tint: "bg-blue-50 text-blue-700" },
    { key: "staff" as const, label: "Staff members", icon: Users, tint: "bg-violet-50 text-violet-700" },
    { key: "inquiries" as const, label: "Open enquiries", icon: ClipboardList, tint: "bg-amber-50 text-amber-700" },
    { key: "news" as const, label: "News", icon: FileText, tint: "bg-emerald-50 text-emerald-700" },
  ];

  const actions = [
    { key: "students" as const, title: "Add student", text: "Create an enrolment record" },
    { key: "news" as const, title: "Publish news", text: "Share an important update" },
    { key: "gallery" as const, title: "Update gallery", text: "Add campus moments" },
  ];

  return (
    <div className="space-y-7">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, tint }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
              <Icon size={20} />
            </div>
            <p className="mt-5 text-3xl font-bold text-[#102a4c]">{loading ? "—" : data[key]?.length ?? 0}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <ChevronRight className="text-slate-300 transition group-hover:translate-x-1" size={17} />
            </div>
          </button>
        ))}
      </div>

      {/* Cloudinary & Media Storage Live Monitor */}
      <CloudinaryStorageCard onNavigate={onNavigate} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-[#102a4c]">Recent enquiries</h3>
              <p className="text-sm text-slate-500">Follow up with prospective families</p>
            </div>
            <button onClick={() => onNavigate("inquiries")} className="text-sm font-bold text-[#1a5d9c]">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {(data.inquiries || []).slice(0, 4).map((item) => (
              <div key={itemId(item)} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dce9f8] text-sm font-bold text-[#1a5d9c]">
                  {String(item.name || "?").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-700">{String(item.name || "New enquiry")}</p>
                  <p className="truncate text-xs text-slate-500">{String(item.inquiryType || "General inquiry")}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  {String(item.status || "Pending")}
                </span>
              </div>
            ))}
            {!loading && !data.inquiries?.length && <Empty text="No enquiries yet" />}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="font-display text-xl font-bold text-[#102a4c]">Quick actions</h3>
          <div className="mt-4 space-y-2">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => onNavigate(action.key)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#edf5fc]"
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
