import type { Metadata } from "next";
import { ResourcePageContainer } from "@/components/admin/ResourcePageContainer";

export const metadata: Metadata = {
  title: "Media Gallery | Indian Public School",
  description: "Campus media library and photo albums",
};

export default function GalleryPage() {
  return <ResourcePageContainer resourceKey="gallery" />;
}
