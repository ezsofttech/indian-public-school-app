import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Students Management | Indian Public School",
  description: "Admissions and student records",
};

export default function StudentsPage() {
  return <ResourcePageContainer resourceKey="students" />;
}
