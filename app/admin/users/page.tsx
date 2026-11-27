import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Admin Users | Indian Public School",
  description: "Manage admin users, roles, and system permissions",
};

export default function UsersPage() {
  return <ResourcePageContainer resourceKey="users" />;
}
