"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { DashboardOverview } from "@/components/admin/dashboard/dashboard-overview";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";
import { CareersAdmin } from "@/components/admin/careers/CareersAdmin";
import { PublicDisclosureAdmin } from "@/components/admin/public-disclosure/PublicDisclosureAdmin";
import { ThemeManagementTab } from "@/components/admin/tabs/ThemeManagementTab";
import { ResourceKey } from "./types/admin.types";
import { API_URL, resources } from "./config/admin.config";
import { useAuth } from "@/contexts/auth-context";

const routeByResource: Record<string, ResourceKey> = {
  student: "students",
  students: "students",
  staff: "staff",
  inquiry: "inquiries",
  inquiries: "inquiries",
  news: "news",
  gallery: "gallery",
  reviews: "reviews",
  settings: "school-settings",
  "school-settings": "school-settings",
  "menu-items": "menu-items",
  pages: "pages",
  users: "users",
};

export function AdminConsole({ initialSection = "" }: { initialSection?: string }) {
  const pathname = usePathname();
  const { token } = useAuth();

  const activeSection = useMemo(() => {
    const fromPath = pathname?.split("/")[2];
    return fromPath || initialSection || "overview";
  }, [pathname, initialSection]);

  if (activeSection === "overview" || activeSection === "dashboard") {
    return (
      <AdminShell title="Dashboard Overview">
        <DashboardOverview />
      </AdminShell>
    );
  }

  if (activeSection === "careers") {
    return (
      <AdminShell title="Careers & Applications">
        <CareersAdmin apiUrl={API_URL} token={token} />
      </AdminShell>
    );
  }

  if (activeSection === "theme") {
    return (
      <AdminShell title="Theme & Styling">
        <ThemeManagementTab token={token} />
      </AdminShell>
    );
  }

  if (activeSection === "public-disclosure") {
    return (
      <AdminShell title="Mandatory Public Disclosure">
        <PublicDisclosureAdmin apiUrl={API_URL} token={token} />
      </AdminShell>
    );
  }

  const mappedKey = routeByResource[activeSection] || (resources.some((r) => r.key === activeSection) ? (activeSection as ResourceKey) : null);

  if (mappedKey) {
    return <ResourcePageContainer resourceKey={mappedKey} />;
  }

  return (
    <AdminShell title="Dashboard Overview">
      <DashboardOverview />
    </AdminShell>
  );
}
