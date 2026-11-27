import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "News & Notices | Indian Public School",
  description: "School news, updates and announcements",
};

export default function NewsPage() {
  return <ResourcePageContainer resourceKey="news" />;
}
