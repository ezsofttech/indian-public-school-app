import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { DashboardOverview } from "@/components/admin/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard Overview | Indian Public School",
  description: "School operations and dashboard overview.",
};

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard Overview">
      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-slate-500">
            Loading dashboard overview...
          </div>
        }
      >
        <DashboardOverview />
      </Suspense>
    </AdminShell>
  );
}
