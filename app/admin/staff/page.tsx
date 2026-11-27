import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Staff Management | Indian Public School",
  description: "Faculty and employee directory",
};

export default function StaffPage() {
  return <ResourcePageContainer resourceKey="staff" />;
}
