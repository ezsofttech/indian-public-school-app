import { getSiteData } from "@/lib/site-data";
import { PublicLayoutClient } from "@/components/site/PublicLayoutClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteData = await getSiteData();
  return <PublicLayoutClient data={siteData}>{children}</PublicLayoutClient>;
}
