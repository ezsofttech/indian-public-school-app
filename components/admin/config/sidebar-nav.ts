import { ResourceKey } from "../types/admin.types";

export type NavItem = {
  label: string;
  href: string;
  aliases?: string[];
  icon: string;
  resourceKey?: ResourceKey;
  badgeKey?: "inquiries" | "careers";
  superAdminOnly?: boolean;
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

export const adminNavSections: NavSection[] = [
  {
    heading: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        aliases: ["/admin"],
        icon: "dashboard",
      },
    ],
  },
  {
    heading: "School Administration",
    items: [
      {
        label: "Students",
        href: "/admin/students",
        aliases: ["/admin/student"],
        icon: "students",
        resourceKey: "students",
      },
      {
        label: "Staff Directory",
        href: "/admin/staff",
        icon: "staff",
        resourceKey: "staff",
      },
      {
        label: "Admission Enquiries",
        href: "/admin/inquiries",
        aliases: ["/admin/inquiry"],
        icon: "inquiries",
        resourceKey: "inquiries",
        badgeKey: "inquiries",
      },
      {
        label: "Careers & Jobs",
        href: "/admin/careers",
        icon: "careers",
        resourceKey: "careers",
        badgeKey: "careers",
      },
    ],
  },
  {
    heading: "Content & Media",
    items: [
      {
        label: "News & Notices",
        href: "/admin/news",
        icon: "news",
        resourceKey: "news",
      },
      {
        label: "Media Gallery",
        href: "/admin/gallery",
        icon: "gallery",
        resourceKey: "gallery",
      },
      {
        label: "Mandatory Disclosure",
        href: "/admin/public-disclosure",
        icon: "disclosure",
        resourceKey: "public-disclosure",
      },
      {
        label: "Reviews & Feedback",
        href: "/admin/reviews",
        icon: "reviews",
        resourceKey: "reviews",
      },
    ],
  },
  {
    heading: "Site Structure",
    items: [
      {
        label: "Page Management",
        href: "/admin/pages",
        icon: "pages",
        resourceKey: "pages",
      },
      {
        label: "Navigation Menus",
        href: "/admin/menu-items",
        icon: "menu",
        resourceKey: "menu-items",
      },
      {
        label: "Theme & Styling",
        href: "/admin/theme",
        icon: "theme",
        resourceKey: "theme",
      },
    ],
  },
  {
    heading: "System & Settings",
    items: [
      {
        label: "School Settings",
        href: "/admin/settings",
        aliases: ["/admin/school-settings"],
        icon: "settings",
        resourceKey: "school-settings",
      },
      {
        label: "User Management",
        href: "/admin/users",
        icon: "users",
        resourceKey: "users",
        superAdminOnly: true,
      },
      {
        label: "Change Password",
        href: "/admin/change-password",
        icon: "password",
      },
    ],
  },
];
