import rawDisclosureSections from "@/public/collections/publicdisclosuresections.json";
import rawDisclosureConfigs from "@/public/collections/publicdisclosureconfigs.json";

export interface StaticDisclosureItem {
  key?: string;
  label: string;
  documentUrl?: string;
  fileUrl?: string;
  value?: string;
  info?: string;
  order?: number;
  [key: string]: unknown;
}

export interface StaticDisclosureSection {
  _id?: string;
  publicId?: string;
  sectionKey: string;
  sectionTitle: string;
  order?: number;
  isPublished?: boolean;
  items?: StaticDisclosureItem[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface StaticDisclosureConfig {
  _id?: string;
  affiliationNo?: string;
  schoolCode?: string;
  showNotice?: boolean;
  complianceNote?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export const staticDisclosureSections: StaticDisclosureSection[] = (
  rawDisclosureSections as unknown as StaticDisclosureSection[]
).filter((section) => section.isPublished !== false);

export const staticDisclosureConfigs: StaticDisclosureConfig[] =
  rawDisclosureConfigs as unknown as StaticDisclosureConfig[];

export const staticDisclosureConfig: StaticDisclosureConfig | null =
  staticDisclosureConfigs.length > 0 ? staticDisclosureConfigs[0] : null;

export default staticDisclosureSections;
