import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Navigation Menus | Indian Public School",
  description: "Header navigation, dropdowns and footer links",
};

export default function MenuItemsPage() {
  return <ResourcePageContainer resourceKey="menu-items" />;
}
