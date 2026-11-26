import rawSchoolSettings from "@/public/collections/schoolsettings.json";

export interface StaticSchoolSettings {
  home?: any[];
  header?: any;
  footer?: any;
  whatsapp?: any;
  popupBanner?: any;
  site_logo?: any;
  certified_board?: any;
  trust_board?: any;
  academic_partner?: any;
  developer?: any;
  menuItems?: any[];
  menuitems?: any[];
  gallery?: any[];
  reviews?: any[];
  news?: any[];
  [key: string]: unknown;
}

export const staticSchoolSettings: StaticSchoolSettings = rawSchoolSettings as unknown as StaticSchoolSettings;
export const staticSiteData = staticSchoolSettings;

export default staticSchoolSettings;
