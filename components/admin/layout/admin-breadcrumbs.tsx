"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "Dashboard",
  dashboard: "Overview",
  students: "Students",
  student: "Students",
  staff: "Staff Directory",
  inquiries: "Admission Enquiries",
  inquiry: "Admission Enquiries",
  careers: "Careers & Jobs",
  news: "News & Notices",
  gallery: "Media Gallery",
  reviews: "Reviews & Feedback",
  "public-disclosure": "Mandatory Disclosure",
  pages: "Page Management",
  "menu-items": "Navigation Menus",
  theme: "Theme & Styling",
  settings: "School Settings",
  "school-settings": "School Settings",
  users: "User Management",
  "change-password": "Change Password",
  login: "Login",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const rawSegments = pathname.split("/").filter(Boolean);
  const segments =
    rawSegments.length === 2 && rawSegments[0] === "admin" && rawSegments[1] === "dashboard"
      ? ["admin"]
      : rawSegments;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + rawSegments.slice(0, index + 1).join("/");
    const label = labelMap[segment] ?? segment.replace(/-/g, " ");
    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-slate-400 hover:text-[#1a5d9c] transition"
            title="Admin Home"
          >
            <Home size={13} />
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-slate-300" />
            {crumb.isLast ? (
              <span className="font-bold capitalize text-[#102a4c]">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="capitalize hover:text-[#1a5d9c] transition">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
