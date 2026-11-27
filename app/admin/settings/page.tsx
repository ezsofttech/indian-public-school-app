import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "School Settings | Indian Public School",
  description: "Global school configuration, branding, and contact details",
};

export default function SettingsPage() {
  return <ResourcePageContainer resourceKey="school-settings" />;
}
