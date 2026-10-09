import type { Metadata } from "next";
import { Suspense } from "react";
import { PressReleaseClient } from "@/components/site/PressReleaseClient";
import { getPageSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageSeoMetadata("pressRelease", "/press-release");



export default function PressReleasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background py-20 text-center text-muted-foreground font-sans">
          Loading Press Releases...
        </div>
      }
    >
      <PressReleaseClient />
    </Suspense>
  );
}
