"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { ToastContainer } from "../ui/toast-container";

export interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  showSidebarToggle?: boolean;
  onRefresh?: () => void;
}

export function AdminShell({
  children,
  title = "School Administration",
  showSidebarToggle = true,
  onRefresh,
}: AdminShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#102a4c]/20 border-t-[#1a5d9c]" />
          <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Suspense fallback={<div className="w-[272px] bg-[#102a4c] h-screen" />}>
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onCloseMobile={() => setMobileOpen(false)}
            onRefresh={onRefresh}
          />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${
          sidebarCollapsed ? "md:ml-[76px]" : "md:ml-[272px]"
        }`}
      >
        <AdminHeader
          title={title}
          onMenuClick={() => setMobileOpen((v) => !v)}
          onToggleSidebar={showSidebarToggle ? () => setSidebarCollapsed((v) => !v) : undefined}
          sidebarCollapsed={sidebarCollapsed}
          onRefresh={onRefresh}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-7">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <AdminBreadcrumbs />
          </div>
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
