"use client";

import { AdminShell } from "@/components/admin/layout/admin-shell";
import { CareersAdmin } from "@/components/admin/careers/CareersAdmin";
import { useAuth } from "@/contexts/auth-context";
import { API_URL } from "@/lib/config";

export default function CareersPage() {
  const { token } = useAuth();

  return (
    <AdminShell title="Careers & Applications">
      <CareersAdmin apiUrl={API_URL} token={token} />
    </AdminShell>
  );
}
