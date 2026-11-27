"use client";

import { AdminShell } from "@/components/admin/layout/admin-shell";
import { PublicDisclosureAdmin } from "@/components/admin/public-disclosure/PublicDisclosureAdmin";
import { useAuth } from "@/contexts/auth-context";
import { API_URL } from "@/lib/config";

export default function PublicDisclosurePage() {
  const { token } = useAuth();

  return (
    <AdminShell title="Mandatory Public Disclosure">
      <PublicDisclosureAdmin apiUrl={API_URL} token={token} />
    </AdminShell>
  );
}
