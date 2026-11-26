import rawGallery from "@/public/collections/gallery.json";

export interface StaticGalleryItem {
  _id?: string;
  publicId?: string;
  eventName?: string;
  eventType?: string;
  directory?: string;
  fileUrl: string;
  mimeType?: string;
  parentId?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const staticGalleryItems: StaticGalleryItem[] = (rawGallery as unknown as StaticGalleryItem[]).filter(
  (item) => !item.deletedAt && Boolean(item.fileUrl)
);

export function getStaticGalleryByCategory(category?: string): StaticGalleryItem[] {
  if (!category || category === "all") return staticGalleryItems;
  const normCat = category.toLowerCase().trim();
  return staticGalleryItems.filter(
    (item) =>
      item.eventType?.toLowerCase().trim() === normCat ||
      item.directory?.toLowerCase().trim() === normCat
  );
}

export default staticGalleryItems;
