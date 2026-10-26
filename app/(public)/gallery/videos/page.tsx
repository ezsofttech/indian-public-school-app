import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryVideosClient } from "@/components/site/GalleryVideosClient";
import { getPageSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageSeoMetadata("videos", "/gallery/videos", {
  title: "School Video Gallery & Campus Glimpses | Indian Public School",
  description:
    "Watch video highlights, campus tour, annual celebrations, sports tournaments, and student learning moments at Indian Public School Sambalpur.",
});

export default function GalleryVideosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background py-20 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">Loading Video Gallery...</p>
          </div>
        </div>
      }
    >
      <GalleryVideosClient />
    </Suspense>
  );
}
