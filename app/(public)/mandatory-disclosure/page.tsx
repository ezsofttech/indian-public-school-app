import type { Metadata } from "next";
import { getOptionalApi, unwrapCollection } from "@/lib/api-client";
import { PublicDisclosureView, DisclosureSectionData } from "@/components/site/PublicDisclosureView";
import { getPageSeoMetadata } from "@/lib/seo";
import { staticDisclosureSections, staticDisclosureConfig } from "@/data/public-disclosure";

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Mandatory Disclosure | Indian Public School",
  description:
    "Official CBSE Mandatory Public Disclosure (Appendix IX), affiliation certificates, societies/trust documents, academic calendar, staff list, and infrastructure details of Indian Public School.",
  keywords: [
    "Mandatory Public Disclosure",
    "CBSE Disclosure",
    "Appendix IX",
    "Indian Public School Samastipur",
    "Affiliation Certificate",
    "NOC",
    "Building Safety Certificate",
    "Fire Safety Certificate",
    "School Infrastructure",
  ],
};

export default async function MandatoryDisclosurePage() {
  let sections: DisclosureSectionData[] = [];
  let config: {
    affiliationNo?: string;
    schoolCode?: string;
    showNotice?: boolean;
    complianceNote?: string;
  } | null = null;

  try {
    const [sectionsRes, configRes] = await Promise.all([
      getOptionalApi<DisclosureSectionData[] | { items: DisclosureSectionData[] }>(
        "/public-disclosure/sections",
        { publishedOnly: true },
        5000
      ),
      getOptionalApi<any>("/public-disclosure/config", undefined, 5000),
    ]);

    if (sectionsRes) {
      sections = unwrapCollection<DisclosureSectionData>(sectionsRes as any);
    }
    if (configRes) {
      config = (configRes as any)?.data ?? configRes;
    }
  } catch (err) {
    console.warn("[MandatoryDisclosurePage] Could not fetch disclosure data:", err);
  }

  // Gracefully fallback to static collection data from @/data if backend is offline, crashes, or times out
  if (sections.length === 0 && staticDisclosureSections.length > 0) {
    sections = staticDisclosureSections as unknown as DisclosureSectionData[];
  }
  if (!config && staticDisclosureConfig) {
    config = staticDisclosureConfig;
  }

  return (
    <main className="flex-1 bg-background text-foreground">
      <PublicDisclosureView
        initialSections={sections}
        affiliationNo={config?.affiliationNo}
        schoolCode={config?.schoolCode}
        showNotice={config?.showNotice}
        complianceNote={config?.complianceNote}
      />
    </main>
  );
}
