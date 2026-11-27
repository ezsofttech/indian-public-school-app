"use client";

import { AdminShell } from "@/components/admin/layout/admin-shell";
import { ThemeManagementTab } from "@/components/admin/tabs/ThemeManagementTab";
import { useAuth } from "@/contexts/auth-context";

export default function ThemePage() {
  const { token } = useAuth();

  return (
    <AdminShell title="Theme & Styling">
      <ThemeManagementTab token={token} />
    </AdminShell>
  );
}
