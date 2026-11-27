import rawMenuItems from "@/public/collections/menuitems.json";

export interface StaticMenuItem {
  _id?: string;
  publicId?: string;
  menuId?: string;
  title: string;
  slug?: string;
  targetUrl?: string;
  icon?: string;
  category?: string;
  level?: number;
  order?: number;
  parentId?: string | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const staticMenuItems: StaticMenuItem[] = (rawMenuItems as unknown as StaticMenuItem[]).filter(
  (item) => item.isPublished !== false
);

export default staticMenuItems;
