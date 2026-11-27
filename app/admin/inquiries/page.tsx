import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Admission Enquiries | Indian Public School",
  description: "Admission leads and prospective family enquiries",
};

export default function InquiriesPage() {
  return <ResourcePageContainer resourceKey="inquiries" />;
}
