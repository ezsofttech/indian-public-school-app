import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Admin Console | Indian Public School",
  description: "School operations and website content management.",
};

export default function AdminPage() {
  return <AdminConsole initialSection="overview" />;
}
