import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Page Management | Indian Public School",
  description: "Manage dynamic school pages and sections",
};

export default function PagesAdminPage() {
  return <ResourcePageContainer resourceKey="pages" />;
}
