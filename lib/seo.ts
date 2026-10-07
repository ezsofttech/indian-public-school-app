import type { Metadata } from "next";
import seoSource from "@/public/seo-source.json";
import { getAssetUrl } from "@/lib/utils";
import { DEFAULT_LOGO } from "@/lib/site-data";

export interface SeoPageConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
}

export const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_CLIENT_URL || seoSource.url || "https://indian-public-school-app.vercel.app";
};

export const getSeoSourceData = () => {
  return seoSource;
};

export const getSchoolJsonLd = () => {
  const baseUrl = getBaseUrl();
  const rawSeo = seoSource as Record<string, any>;
  const imagesList: string[] = Array.isArray(rawSeo.image)
    ? rawSeo.image
    : Array.isArray(rawSeo.images)
    ? rawSeo.images
    : [];
  const campusImages = imagesList.map((img: string) =>
    img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`
  );

  return {
    "@context": "https://schema.org",
    "@type": "School",
    name: seoSource.name,
    alternateName: seoSource.alternateName,
    url: baseUrl,
    logo: getAssetUrl(DEFAULT_LOGO),
    image: campusImages.length > 0 ? campusImages[0] : `${baseUrl}/assets/campus-aerial.jpg`,
    photos: campusImages,
    description: seoSource.description,
    slogan: seoSource.slogan,
    foundingDate: seoSource.foundingDate,
    founder: seoSource.founder,
    address: seoSource.address,
    geo: seoSource.geo,
    telephone: [seoSource.telephone, "+91 97351 81684"],
    email: seoSource.email,
    sameAs: seoSource.sameAs,
    additionalProperty: seoSource.additionalProperty,
    hasCredential: seoSource.hasCredential,
    aggregateRating: rawSeo.aggregateRating,
    review: rawSeo.review,
    amenityFeature: seoSource.amenityFeature,
    openingHours: rawSeo.openingHours,
    openingHoursSpecification: seoSource.openingHoursSpecification,
    offers: seoSource.offers,
    hasOfferCatalog: seoSource.hasOfferCatalog,
  };
};

export const getPageSeoMetadata = (
  pageKey: keyof typeof seoSource.pages | string,
  pathname: string,
  overrides?: Partial<Metadata>
): Metadata => {
  const baseUrl = getBaseUrl();
  const rawSeo = seoSource as Record<string, any>;
  const pagesConfig = seoSource.pages as Record<string, SeoPageConfig>;
  const pageData = pagesConfig[pageKey] || {
    title: `${pageKey.charAt(0).toUpperCase() + pageKey.slice(1)} | ${seoSource.name}`,
    description: seoSource.description,
    keywords: rawSeo.keywords,
    image: "/assets/campus-aerial.jpg",
  };

  const canonicalUrl = `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

  const defaultKeywords = Array.isArray(rawSeo.keywords) ? rawSeo.keywords : [];
  const pageKeywords = Array.isArray(pageData.keywords) ? pageData.keywords : [];
  const mergedKeywords = Array.from(new Set([...pageKeywords, ...defaultKeywords]));

  const rawImgUrl = pageData.image || "/assets/campus-aerial.jpg";
  const ogImageUrl = rawImgUrl.startsWith("http")
    ? rawImgUrl
    : `${baseUrl}${rawImgUrl.startsWith("/") ? "" : "/"}${rawImgUrl}`;

  const baseMetadata: Metadata = {
    title: pageData.title,
    description: pageData.description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      url: canonicalUrl,
      siteName: seoSource.name,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${pageData.title} - ${seoSource.name}`,
        },
        {
          url: getAssetUrl(DEFAULT_LOGO),
          width: 800,
          height: 800,
          alt: `${seoSource.name} Logo`,
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

  return {
    ...baseMetadata,
    ...overrides,
    openGraph: {
      ...baseMetadata.openGraph,
      ...overrides?.openGraph,
    },
    twitter: {
      ...baseMetadata.twitter,
      ...overrides?.twitter,
    },
  };
};
