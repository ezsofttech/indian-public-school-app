import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryAlbumClient } from "@/components/site/GalleryAlbumClient";
import { DOMAIN } from "@/lib/config";

const baseUrl = DOMAIN;

export const metadata: Metadata = {
  title: "School Photo Albums | Indian Public School",
  description: "Explore photo albums, campus events, and celebrations at Indian Public School.",
  alternates: {
    canonical: `${baseUrl}/gallery`,
  },
};


export default function AlbumIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-20 text-center text-muted-foreground">Loading Photo Albums...</div>}>
      <GalleryAlbumClient mode="album" />
    </Suspense>
  );
}
