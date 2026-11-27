import type { Metadata } from "next";
import { DOMAIN, SITE_CONFIG } from "@/lib/config";
import { getAssetUrl } from "@/lib/utils";
import { DEFAULT_LOGO } from "@/lib/site-data";

/**
 * Lightweight SEO utilities consuming centralized SITE_CONFIG and DOMAIN.
 * No redundant duplicate variables or phantom fallbacks.
 */

export interface SeoPageConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
}

export const getBaseUrl = (): string => DOMAIN;

// School Details (Derived directly from SITE_CONFIG)
export const SCHOOL_SCHEMA = {
  name: SITE_CONFIG.name,
  alternateName: SITE_CONFIG.shortName,
  slogan: SITE_CONFIG.tagline,
  description: SITE_CONFIG.description,
  foundingDate: "2009",
  affiliationNumber: SITE_CONFIG.affiliationNo,
  schoolCode: SITE_CONFIG.schoolCode,
  founder: {
    "@type": "Organization",
    name: "K.S. Dalmia Education Trust",
  },
  principal: {
    "@type": "Person",
    name: "Mr. Sachin Pathak",
    jobTitle: "Principal",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Main Road, Near RMC, Khetrajpur",
    addressLocality: "Sambalpur",
    addressRegion: "Odisha",
    postalCode: "768006",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 21.476947,
    longitude: 83.931785,
  },
  telephone: [SITE_CONFIG.phone, SITE_CONFIG.secondaryPhone],
  email: SITE_CONFIG.email,
  sameAs: [
    "https://www.facebook.com/IPSSBP",
    "https://www.instagram.com/indian_public_school_sambalpur",
    "https://www.youtube.com/@ipssbp",
  ],
  campusImages: [
    "/assets/campus-aerial.jpg",
    "/assets/hero-campus.jpg",
    "/assets/about-classroom.jpg",
    "/assets/facility-lab.jpg",
    "/assets/facility-computer.jpg",
    "/assets/facility-library.jpg",
    "/assets/facility-sports.jpg",
  ],
};

// Compact Page Metadata Dictionary
export const PAGE_SEO_MAP: Record<string, SeoPageConfig> = {
  home: {
    title: `${SITE_CONFIG.name} Sambalpur | CBSE School in Odisha`,
    description: SITE_CONFIG.description,
    keywords: [
      SITE_CONFIG.name,
      `${SITE_CONFIG.name} Sambalpur`,
      SITE_CONFIG.shortName,
      "CBSE School Sambalpur",
      "Best CBSE School in Sambalpur",
      "English Medium School Sambalpur",
      "Top School in Western Odisha",
    ],
    image: "/assets/hero-campus.jpg",
  },
  admission: {
    title: `School Admission 2026-27 | ${SITE_CONFIG.name} Sambalpur`,
    description:
      "Apply for admission at Indian Public School, Sambalpur for academic session 2026-27. View admission criteria, eligibility, and register online.",
    keywords: [
      "IPS Sambalpur admission",
      "School Admission 2026-27",
      "CBSE School Admission Sambalpur",
      "Online School Registration Odisha",
      "Class 11 Science Commerce Admission",
    ],
    image: "/assets/about-classroom.jpg",
  },
  academics: {
    title: `Academics | CBSE Curriculum Pre-Primary to Class XII | ${SITE_CONFIG.shortName}`,
    description:
      "Explore academic programs at Indian Public School covering Pre-Primary, Primary, Secondary, and Senior Secondary CBSE Science and Commerce streams.",
    keywords: [
      "CBSE curriculum Sambalpur",
      "Secondary education Sambalpur",
      "Senior secondary Science Commerce",
    ],
    image: "/assets/about-classroom.jpg",
  },
  infrastructure: {
    title: `Campus Infrastructure & Facilities | ${SITE_CONFIG.name}`,
    description:
      "State-of-the-art campus facilities: smart digital classrooms, advanced science and computer laboratories, library, and sports infrastructure.",
    keywords: [
      "school infrastructure Sambalpur",
      "digital smart classrooms",
      "science computer labs Sambalpur",
    ],
    image: "/assets/campus-aerial.jpg",
  },
  contact: {
    title: `Contact Us | ${SITE_CONFIG.name} Sambalpur`,
    description: `Contact Indian Public School in Khetrajpur, Sambalpur, Odisha. Address: ${SITE_CONFIG.address}. Phone: ${SITE_CONFIG.phone}.`,
    keywords: [
      "Indian Public School contact",
      "IPS Sambalpur phone number",
      "school address Khetrajpur Sambalpur",
    ],
    image: "/assets/campus-aerial.jpg",
  },
  careers: {
    title: `Careers & Teacher Recruitment | ${SITE_CONFIG.name}`,
    description:
      "Join our teaching and administrative faculty at Indian Public School, Sambalpur. View open job vacancies and application details.",
    keywords: ["teaching jobs Sambalpur", "teacher vacancy CBSE school Sambalpur"],
    image: "/assets/achievements.jpg",
  },
  gallery: {
    title: `Photo & Event Gallery | ${SITE_CONFIG.name}`,
    description:
      "Browse photographs of campus life, annual functions, sports days, and student achievements at Indian Public School Sambalpur.",
    keywords: ["IPS Sambalpur gallery", "school campus photos", "annual function events"],
    image: "/assets/facility-sports.jpg",
  },
  pressRelease: {
    title: `News & Press Releases | ${SITE_CONFIG.name}`,
    description:
      "Latest announcements, press releases, academic milestones, and student updates from Indian Public School, Sambalpur.",
    keywords: ["IPS Sambalpur news", "school press releases", "CBSE student achievements"],
    image: "/assets/achievements.jpg",
  },
};

// Schema.org JSON-LD Generator
export const getSchoolJsonLd = () => {
  const baseUrl = getBaseUrl();
  const photos = SCHOOL_SCHEMA.campusImages.map((img) =>
    img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`
  );

  return {
    "@context": "https://schema.org",
    "@type": "School",
    "@id": `${baseUrl}/#school`,
    name: SCHOOL_SCHEMA.name,
    alternateName: SCHOOL_SCHEMA.alternateName,
    url: baseUrl,
    logo: getAssetUrl(DEFAULT_LOGO),
    image: photos[0] || `${baseUrl}/assets/campus-aerial.jpg`,
    photos,
    description: SCHOOL_SCHEMA.description,
    slogan: SCHOOL_SCHEMA.slogan,
    foundingDate: SCHOOL_SCHEMA.foundingDate,
    founder: SCHOOL_SCHEMA.founder,
    principal: SCHOOL_SCHEMA.principal,
    address: SCHOOL_SCHEMA.address,
    geo: SCHOOL_SCHEMA.geo,
    telephone: SCHOOL_SCHEMA.telephone,
    email: SCHOOL_SCHEMA.email,
    sameAs: SCHOOL_SCHEMA.sameAs,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "CBSE Affiliation Number",
        value: SCHOOL_SCHEMA.affiliationNumber,
      },
      {
        "@type": "PropertyValue",
        name: "School Code",
        value: SCHOOL_SCHEMA.schoolCode,
      },
    ],
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "CBSE Affiliation",
      educationalLevel: "School Education (K-12)",
      recognizedBy: {
        "@type": "Organization",
        name: "Central Board of Secondary Education",
        alternateName: "CBSE",
      },
      identifier: SCHOOL_SCHEMA.affiliationNumber,
    },
  };
};

// Next.js Metadata Generator
export const getPageSeoMetadata = (
  pageKey: keyof typeof PAGE_SEO_MAP | string,
  pathname: string,
  overrides?: Partial<Metadata>
): Metadata => {
  const baseUrl = getBaseUrl();
  const pageData = PAGE_SEO_MAP[pageKey] || {
    title: `${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)} | ${SITE_CONFIG.name}`,
    description: SITE_CONFIG.description,
    keywords: [SITE_CONFIG.name, SITE_CONFIG.shortName],
    image: "/assets/campus-aerial.jpg",
  };

  const canonicalUrl = `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const rawImg = pageData.image || "/assets/campus-aerial.jpg";
  const ogImageUrl = rawImg.startsWith("http")
    ? rawImg
    : `${baseUrl}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`;

  const baseMetadata: Metadata = {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${pageData.title} - ${SITE_CONFIG.name}`,
        },
        {
          url: getAssetUrl(DEFAULT_LOGO),
          width: 800,
          height: 800,
          alt: `${SITE_CONFIG.name} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageData.title,
      description: pageData.description,
      images: [ogImageUrl],
    },
  };

  if (!overrides) return baseMetadata;

  return {
    ...baseMetadata,
    ...overrides,
    openGraph: {
      ...baseMetadata.openGraph,
      ...overrides.openGraph,
    },
    twitter: {
      ...baseMetadata.twitter,
      ...overrides.twitter,
    },
  };
};

// Root layout compatibility bridge
export const staticSeoSource = {
  name: SITE_CONFIG.name,
  alternateName: SITE_CONFIG.shortName,
  description: SITE_CONFIG.description,
  url: DOMAIN,
  pages: PAGE_SEO_MAP,
  telephone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  founder: SCHOOL_SCHEMA.founder,
  address: SCHOOL_SCHEMA.address,
  geo: SCHOOL_SCHEMA.geo,
  sameAs: SCHOOL_SCHEMA.sameAs,
};

export const seoSource = staticSeoSource;
export const getSeoSourceData = () => staticSeoSource;
