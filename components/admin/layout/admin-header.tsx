"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  PanelLeft,
  Bell,
  RefreshCw,
  Crown,
  Shield,
  KeyRound,
  LogOut,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useInquiryNotifications } from "@/lib/hooks/useInquiryNotifications";
import { useCareerNotifications } from "@/lib/hooks/useCareerNotifications";
import { API_URL } from "@/lib/config";

export interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onRefresh?: () => void;
}

export function AdminHeader({
  title,
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed,
  onRefresh,
}: AdminHeaderProps) {
  const router = useRouter();
  const { user, token, isSuperAdmin, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const inquiryNotifications = useInquiryNotifications(API_URL, token);
  const careerNotifications = useCareerNotifications(API_URL, token);

  const totalUnread = inquiryNotifications.unreadCount + careerNotifications.unreadCount;

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (onRefresh) {
        onRefresh();
      }
      await inquiryNotifications.refreshNotifications();
      await careerNotifications.refreshNotifications();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[64px] sm:h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-3.5 sm:px-6 py-2 sm:py-0 shadow-2xs">
      {/* Left side: Navigation triggers and Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 mr-2 sm:mr-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        {/* Desktop sidebar toggle button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-[#102a4c] transition cursor-pointer md:flex items-center justify-center"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={18} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#d69d26] truncate leading-tight">
            School Administration
          </p>
          <h1 className="font-display text-sm sm:text-lg md:text-xl font-bold text-[#102a4c] truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Notifications, Refresh, User profile & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationOpen((prev) => !prev)}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#102a4c] transition cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={17} className="text-[#102a4c]" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-600 text-[9px] sm:text-[10px] font-extrabold text-white ring-2 ring-white animate-pulse">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in duration-150">
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
                    type="button"
                    onClick={async () => {
                      if (inquiryNotifications.unreadCount > 0) {
                        await inquiryNotifications.markAllAsRead();
                      }
                      if (careerNotifications.unreadCount > 0) {
                        await careerNotifications.markAllAsRead();
                      }
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
                            router.push("/admin/careers");
                            void careerNotifications.markAsRead(cId);
                          }}
                          className="group flex flex-col gap-1 rounded-xl border border-amber-200 bg-[#fdf3da]/60 p-3 text-left transition hover:bg-amber-100/80 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#102a4c] truncate">
                              {String(cApp.fullName || "New Candidate")}
                            </span>
                            <span className="rounded-md bg-[#102a4c] text-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                              {String(cApp.postTitle || "Career")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-mono">
                            App Ref: {String(cApp.applicationNo || "APP-REF")}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{String(cApp.email || cApp.phone || "")}</span>
                            <span className="font-bold text-[#1a5d9c] group-hover:underline">
                              Review candidate →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Admission Enquiry Notifications */}
                {inquiryNotifications.unreadNotifications.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 px-1">
                      Admission Inquiries ({inquiryNotifications.unreadNotifications.length})
                    </div>
                    {inquiryNotifications.unreadNotifications.map((inq) => {
                      const inqId = String(inq._id || inq.id || inq.publicId || "");
                      return (
                        <div
                          key={inqId}
                          onClick={() => {
                            setNotificationOpen(false);
                            router.push("/admin/inquiries");
                            void inquiryNotifications.markAsRead(inqId);
                          }}
                          className="group flex flex-col gap-1 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-left transition hover:bg-blue-100/80 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#102a4c] truncate">
                              {String(inq.name || "Prospective Student")}
                            </span>
                            <span className="rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                              {String(inq.inquiryType || "Enquiry")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {String(inq.message || "New admission inquiry received.")}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{String(inq.contact || inq.email || "")}</span>
                            <span className="font-bold text-[#1a5d9c] group-hover:underline">
                              View inquiry →
                            </span>
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
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    router.push("/admin/careers");
                  }}
                  className="hover:underline cursor-pointer"
                >
                  Applications ({careerNotifications.unreadCount})
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    router.push("/admin/inquiries");
                  }}
                  className="hover:underline cursor-pointer"
                >
                  Enquiries ({inquiryNotifications.unreadCount})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          title="Refresh Data"
          aria-label="Refresh data"
        >
          <RefreshCw
            size={16}
            className={`text-[#102a4c] ${refreshing ? "animate-spin" : ""}`}
          />
        </button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 sm:pr-3 shadow-2xs">
            <div
              className={`grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full font-bold text-xs ${
                isSuperAdmin
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-blue-100 text-[#1a5d9c]"
              }`}
            >
              {isSuperAdmin ? (
                <Crown size={15} className="text-amber-600 fill-amber-400" />
              ) : (
                <Shield size={15} />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#102a4c] truncate max-w-[120px]">
                {user.name || user.email || "Administrator"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isSuperAdmin ? "Super Admin" : "Sub Admin"}
              </p>
            </div>
          </div>
        )}

        {/* Change password link */}
        <Link
          href="/admin/change-password"
          className="hidden md:flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102a4c] shadow-2xs hover:bg-slate-50 hover:text-[#1a5d9c] transition"
          title="Change Password"
        >
          <KeyRound size={14} className="text-[#1a5d9c]" />
          <span>Password</span>
        </Link>

        {/* Logout button */}
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-xl bg-[#102a4c] px-3 sm:px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#1a5d9c] cursor-pointer"
          title="Sign Out"
        >
          <span className="hidden sm:inline">Sign Out</span>
          <span className="sm:hidden"><LogOut size={14} /></span>
        </button>
      </div>
    </header>
  );
}
