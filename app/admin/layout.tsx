import type { Metadata } from "next";
import { AdminOfflineGuard } from "@/components/admin/admin-offline-guard";

export const metadata: Metadata = {
  title: "Admin Panel | Indian Public School",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="light" data-admin-panel className="admin-scope admin-theme min-h-screen text-[#0f172a] bg-[#f7fbff]">
      <AdminOfflineGuard>
        {children}
      </AdminOfflineGuard>
    </div>
  );
}
