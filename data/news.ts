import rawNews from "@/public/collections/news.json";

export interface StaticNewsItem {
  _id?: string;
  publicId?: string;
  title: string;
  redirectUrl?: string;
  isPublished?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export const staticNews: StaticNewsItem[] = (rawNews as unknown as StaticNewsItem[]).filter(
  (item) => item.isPublished !== false
);

export default staticNews;
