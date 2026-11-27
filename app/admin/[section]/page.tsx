import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { DashboardOverview } from "@/components/admin/dashboard/dashboard-overview";
import { CareersAdmin } from "@/components/admin/careers/CareersAdmin";
import { PublicDisclosureAdmin } from "@/components/admin/public-disclosure/PublicDisclosureAdmin";
import { ThemeManagementTab } from "@/components/admin/tabs/ThemeManagementTab";
import { ResourceKey } from "@/components/admin/types/admin.types";
import { API_URL } from "@/lib/config";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Admin Panel | Indian Public School",
  description: "School operations and website content management.",
};

const routeMap: Record<string, ResourceKey> = {
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

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section === "overview" || section === "dashboard") {
    return (
      <AdminShell title="Dashboard Overview">
        <DashboardOverview />
      </AdminShell>
    );
  }

  if (routeMap[section]) {
    return <ResourcePageContainer resourceKey={routeMap[section]} />;
  }

  if (section === "careers") {
    return (
      <AdminShell title="Careers & Applications">
        <CareersAdmin apiUrl={API_URL} />
      </AdminShell>
    );
  }

  if (section === "public-disclosure") {
    return (
      <AdminShell title="Mandatory Public Disclosure">
        <PublicDisclosureAdmin apiUrl={API_URL} />
      </AdminShell>
    );
  }

  if (section === "theme") {
    return (
      <AdminShell title="Theme & Styling">
        <ThemeManagementTab />
      </AdminShell>
    );
  }

  // Fallback to legacy AdminConsole
  return <AdminConsole initialSection={section} />;
}
