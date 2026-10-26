import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryAlbumClient } from "@/components/site/GalleryAlbumClient";
import { getPageSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageSeoMetadata("gallery-album", "/gallery/album", {
  title: "School Photo Albums & Picture Gallery | Indian Public School",
  description:
    "Explore campus photos, picture albums, celebrations, sports activities, and student life at Indian Public School Sambalpur.",
});

export default function GalleryAlbumRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background py-20 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">Loading Photo Albums...</p>
          </div>
        </div>
      }
    >
      <GalleryAlbumClient mode="album" />
    </Suspense>
  );
}
