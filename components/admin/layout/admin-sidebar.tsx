"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  Briefcase,
  FileText,
  ImageIcon,
  FileCheck,
  MessageSquareHeart,
  Menu,
  Palette,
  Settings,
  ShieldCheck,
  KeyRound,
  LogOut,
  Crown,
  Shield,
  RotateCw,
} from "lucide-react";
import { adminNavSections, NavItem } from "../config/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import { DEFAULT_CREST_LOGO, imageUrl } from "@/lib/site-data";
import { useInquiryNotifications } from "@/lib/hooks/useInquiryNotifications";
import { useCareerNotifications } from "@/lib/hooks/useCareerNotifications";
import { API_URL } from "@/lib/config";

function NavIcon({ name, className = "h-4 w-4 shrink-0" }: { name?: string; className?: string }) {
  switch (name) {
    case "dashboard":
      return <LayoutDashboard className={className} />;
    case "students":
      return <GraduationCap className={className} />;
    case "staff":
      return <Users className={className} />;
    case "inquiries":
      return <ClipboardList className={className} />;
    case "careers":
      return <Briefcase className={className} />;
    case "news":
      return <FileText className={className} />;
    case "gallery":
      return <ImageIcon className={className} />;
    case "disclosure":
      return <FileCheck className={className} />;
    case "reviews":
      return <MessageSquareHeart className={className} />;
    case "pages":
      return <FileText className={className} />;
    case "menu":
      return <Menu className={className} />;
    case "theme":
      return <Palette className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "users":
      return <ShieldCheck className={className} />;
    case "password":
      return <KeyRound className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.aliases && item.aliases.some((alias) => pathname === alias || pathname.startsWith(alias + "/"))) {
    return true;
  }
  if (item.href !== "/admin" && item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/")) {
    return true;
  }
  return false;
}

export interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  onRefresh?: () => void;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  onRefresh,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, token, isSuperAdmin, canAccessResource, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Unread badge listeners
  const inquiryNotifications = useInquiryNotifications(API_URL, token);
  const careerNotifications = useCareerNotifications(API_URL, token);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefresh) {
      try {
        onRefresh();
      } catch (err) {
        console.error("Refresh error:", err);
      }
    }
    void inquiryNotifications.refreshNotifications();
    void careerNotifications.refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <aside
      className={`flex h-screen flex-col bg-[#102a4c] text-slate-200 border-r border-white/10 shadow-2xl transition-[width] duration-300 ease-in-out select-none ${
        collapsed ? "w-[76px]" : "w-[272px]"
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-white/10 ${collapsed ? "px-2.5" : "px-4"}`}>
        <div
          className={`flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 border border-white/10 backdrop-blur-md ${
            collapsed ? "justify-center p-2" : ""
          }`}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md ring-2 ring-amber-400/50 overflow-hidden">
            <img
              src={imageUrl(DEFAULT_CREST_LOGO)}
              alt="IPS Crest Logo"
              className="h-full w-full object-contain mix-blend-multiply"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedLocal) {
                  target.dataset.triedLocal = "true";
                  target.src = "/assets/Settings/Logos/IPSStandardLogo.png";
                }
              }}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-400">
                Indian Public School
              </p>
              <h2 className="truncate font-display text-sm font-bold text-white leading-tight">
                Admin Console
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {adminNavSections.map((section) => {
          // Filter section items based on permissions
          const visibleItems = section.items.filter((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.resourceKey && !canAccessResource(item.resourceKey)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.heading} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isItemActive(pathname, item);
                  let badgeCount = 0;
                  if (item.badgeKey === "inquiries") {
                    badgeCount = inquiryNotifications.unreadCount;
                  } else if (item.badgeKey === "careers") {
                    badgeCount = careerNotifications.unreadCount;
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                        collapsed ? "justify-center px-2 py-2.5" : ""
                      } ${
                        active
                          ? "bg-amber-400 text-[#102a4c] font-bold shadow-md shadow-amber-400/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <NavIcon
                          name={item.icon}
                          className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                            active ? "text-[#102a4c]" : "text-slate-300 group-hover:text-amber-300"
                          }`}
                        />
                        {collapsed && badgeCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-1 ring-white">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </div>

                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {badgeCount > 0 && (
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold shadow-xs ${
                                active
                                  ? "bg-[#102a4c] text-white"
                                  : "bg-red-500 text-white animate-pulse"
                              }`}
                            >
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                          {item.superAdminOnly && (
                            <span
                              className={`ml-auto shrink-0 ${
                                active ? "text-[#102a4c]" : "text-amber-300"
                              }`}
                              title="Super Admin Only"
                            >
                              <Crown size={12} />
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User & Footer Actions */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <div
          className={`flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 border border-white/10 ${
            collapsed ? "justify-center p-2" : ""
          }`}
        >
          <div
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-bold text-xs ${
              isSuperAdmin ? "bg-amber-400 text-[#102a4c]" : "bg-blue-300 text-[#102a4c]"
            }`}
          >
            {isSuperAdmin ? <Crown size={16} /> : <Shield size={16} />}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {user?.name || user?.email || "Administrator"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {user?.role || (isSuperAdmin ? "Super Admin" : "Sub Admin")}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Link
            href="/admin/change-password"
            onClick={onCloseMobile}
            title={collapsed ? "Change password" : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <KeyRound size={15} />
            {!collapsed && <span>Change Password</span>}
          </Link>

          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Sign out" : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
