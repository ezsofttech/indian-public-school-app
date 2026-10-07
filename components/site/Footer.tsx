"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Award, Building2, Facebook, GraduationCap, Instagram, Linkedin, ShieldCheck, Sparkles, Youtube } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";
import { buildMenuHierarchy, DEFAULT_LOGO, DEFAULT_SECONDARY_LOGO, homeData, imageUrl, isBannerLogoUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { API_URL } from "@/lib/api-client";
import { openAdmissionModal } from "@/components/site/AdmissionApplicationModal";
import { SmartFileThumbnail } from "@/components/ui/SmartFileThumbnail";

interface ApiMenuItem {
  _id?: string;
  title: string;
  slug?: string;
  targetUrl?: string;
  linkUrl?: string;
  category?: string;
  isPublished?: boolean;
  order?: number;
  subItems?: ApiMenuItem[];
}

const KNOWN_SECTIONS = new Set([
  "about",
  "academics",
  "admissions",
  "infrastructure",
  "student-life",
  "gallery",
  "contact",
  "campus-life",
  "enquiry",
  "home",
]);

function normalizeHref(rawUrl?: string): string {
  const url = (rawUrl || "/").trim();
  if (!url || url === "/") return "/";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return url;
  }
  if (url.startsWith("/")) return url;
  if (url.startsWith("#")) return `/${url}`;
  if (KNOWN_SECTIONS.has(url.toLowerCase())) {
    return `/#${url.toLowerCase()}`;
  }
  return `/${url}`;
}

function getItemHref(item: ApiMenuItem): string {
  // If item has subItems, directly point to the first published child's link
  if (Array.isArray(item.subItems) && item.subItems.length > 0) {
    const publishedChild = item.subItems.find(
      (child) => child.isPublished !== false && Boolean(child.targetUrl?.trim() || child.linkUrl?.trim() || child.slug?.trim())
    );
    if (publishedChild) {
      return getItemHref(publishedChild);
    }
  }

  const explicitTarget = (item.targetUrl || item.linkUrl || "").trim();
  if (explicitTarget && explicitTarget !== "#") {
    return normalizeHref(explicitTarget);
  }

  const slugTarget = (item.slug || "/").trim();
  return normalizeHref(slugTarget);
}

const FIXED_FOOTER_COLUMNS = [
  {
    title: "Quick Links",
    links: [
      { title: "Home", href: "/" },
      { title: "About Us", href: "/#about" },
      { title: "Academics", href: "/#academics" },
      { title: "Admissions", href: "/admission" },
      { title: "Contact Us", href: "/#contact" },
    ],
  },
  {
    title: "Key Pages",
    links: [
      { title: "Chairman's Message", href: "/about/chairman-message" },
      { title: "Principal's Desk", href: "/about/principal-message" },
      { title: "Campus Life", href: "/#campus-life" },
      { title: "Gallery", href: "/#gallery" },
    ],
  },
  {
    title: "Important Links",
    links: [
      { title: "Enquiry", href: "/#enquiry" },
      { title: "Mandatory Disclosure", href: "/mandatory-disclosure" },
      { title: "Parent Portal", href: "/connectivity/parent-teacher-meeting" },
    ],
  },
];

const getFooterGridClass = (count: number) => {
  switch (count) {
    case 1:
      return "grid-cols-1 max-w-xs sm:ml-auto";
    case 2:
      return "grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-20 w-full max-w-2xl sm:ml-auto";
    case 3:
      return "grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 w-full";
    case 4:
      return "grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 w-full";
    case 5:
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full";
    default:
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 w-full";
  }
};

export function Footer() {
  const siteData = useSiteData();
  const homeIdentity = (homeData(siteData).identity as Record<string, unknown>) || {};
  const footerConfig = (homeIdentity.footer as Record<string, unknown>) || (siteData.footer as Record<string, unknown>) || {};
  const contact = (siteData["contact-us"] as Record<string, unknown>) ?? {};
  const addressObj = (contact.Address as Record<string, unknown>) ?? {};
  const fallbackAddress = [addressObj.address, addressObj.district, addressObj.state, addressObj["Post-Office"]]
    .map((v) => text(v))
    .filter(Boolean)
    .join(", ");
  const fallbackPhone = Array.isArray(contact.phone) ? text(contact.phone[0]) : text(contact.phone);
  const socialsObj = (contact["social-media"] as Record<string, unknown>) ?? {};

  const addressText =
    text(footerConfig.address) ||
    fallbackAddress ||
    "Main Road, Near RMC, Khetrajpur, Sambalpur, Odisha - 768006";

  const phoneText = text(footerConfig.phone) || fallbackPhone || "+91 8114320555";
  const emailText = text(footerConfig.email) || text(contact.email) || "info@indianpublicschool.in";
  const brandTitle = text(footerConfig.logoText) || "Indian Public School";
  const brandSubTitle = text(footerConfig.logoSubText) || "Learn · Lead · Inspire";
  const aboutText =
    text(footerConfig.aboutText) ||
    text(contact.title, "A co-educational CBSE school committed to academic excellence, strong character and genuine care for every child.");
  const copyrightText =
    text(footerConfig.copyright) ||
    `© ${new Date().getFullYear()} Indian Public School. All rights reserved.`;

  const configuredColumns =
    Array.isArray(footerConfig.columns) && footerConfig.columns.length > 0
      ? (footerConfig.columns as any[])
      : Array.isArray((siteData.footer as any)?.columns) && (siteData.footer as any).columns.length > 0
        ? ((siteData.footer as any).columns as any[])
        : FIXED_FOOTER_COLUMNS;

  const footerColumns = configuredColumns;

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: text(footerConfig.facebook) || text(socialsObj.facebook, "https://facebook.com") },
    { icon: Instagram, label: "Instagram", href: text(footerConfig.instagram) || text(socialsObj.instagram, "https://instagram.com") },
    { icon: Youtube, label: "YouTube", href: text(footerConfig.youtube) || text(socialsObj.youtube, "https://youtube.com") },
    { icon: Linkedin, label: "LinkedIn", href: text(footerConfig.linkedin) || text(socialsObj.linkedin, "https://linkedin.com") },
  ];

  const headerConfig = (homeIdentity.header as Record<string, any>) || (siteData?.header as Record<string, any>) || {};
  const siteLogo = (siteData?.site_logo as Record<string, any>) || (homeIdentity.site_logo as Record<string, any>) || {};
  const rawLogoUrl = (siteLogo.logoUrl ? String(siteLogo.logoUrl).trim() : "") || text(footerConfig.logoUrl) || (headerConfig.logoUrl ? String(headerConfig.logoUrl).trim() : "") || DEFAULT_LOGO;
  const customLogoUrl = imageUrl(rawLogoUrl);
  const isBanner = isBannerLogoUrl(rawLogoUrl);
  const displayBrandTitle = (siteLogo.logoText ? String(siteLogo.logoText).trim() : "") || text(footerConfig.logoText) || (headerConfig.logoText ? String(headerConfig.logoText).trim() : "") || brandTitle;
  const displayBrandSubTitle = (siteLogo.logoSubText ? String(siteLogo.logoSubText).trim() : "") || text(footerConfig.logoSubText) || (headerConfig.logoSubText ? String(headerConfig.logoSubText).trim() : "") || brandSubTitle;

  const rawSecondaryLogoUrl = (siteLogo.secondaryLogoUrl ? String(siteLogo.secondaryLogoUrl).trim() : "") || text(footerConfig.secondaryLogoUrl) || (headerConfig.secondaryLogoUrl ? String(headerConfig.secondaryLogoUrl).trim() : "") || DEFAULT_SECONDARY_LOGO;
  const secondaryLogoUrl = imageUrl(rawSecondaryLogoUrl);
  const showSecondaryLogo = siteLogo.showSecondaryLogo !== false && (footerConfig as any).showSecondaryLogo !== false;

  const certifiedBoard = (homeIdentity.certified_board as Record<string, unknown>) || (siteData?.certified_board as Record<string, unknown>) || (footerConfig.certified_board as Record<string, unknown>) || {};
  const certifiedEnabled = certifiedBoard.enabled !== false && Boolean(certifiedBoard.title || certifiedBoard.badgeUrl || certifiedBoard.code);

  const trustBoard = (homeIdentity.trust_board as Record<string, unknown>) || (siteData?.trust_board as Record<string, unknown>) || (footerConfig.trust_board as Record<string, unknown>) || {};
  const trustEnabled = trustBoard.enabled !== false && Boolean(trustBoard.trustName || trustBoard.logoUrl || trustBoard.regNo);

  const academicPartner = (homeIdentity.academic_partner as Record<string, unknown>) || (siteData?.academic_partner as Record<string, unknown>) || (footerConfig.academic_partner as Record<string, unknown>) || {};
  const partnerEnabled = academicPartner.enabled !== false && Boolean(academicPartner.title || academicPartner.logoUrl);

  return (
    <footer className="surface-navy pt-16 pb-8">
      <div className="container-page">
        {(certifiedEnabled || trustEnabled || partnerEnabled) && (
          <div className="mb-12 grid gap-6 border-b border-navy-foreground/15 pb-10 sm:grid-cols-2 lg:grid-cols-3">
            {certifiedEnabled && (
              <Reveal>
                <div className="flex items-start gap-4 rounded-2xl border border-navy-foreground/20 bg-white/5 p-5 backdrop-blur-xs transition-colors hover:border-gold/30 h-full">
                  <SmartFileThumbnail
                    url={certifiedBoard.badgeUrl ? imageUrl(String(certifiedBoard.badgeUrl)) : null}
                    alt={String(certifiedBoard.title || "Certified Board")}
                    className="size-14 rounded-xl object-contain bg-white/10 p-1.5 shrink-0"
                    fallbackIcon={
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
                        <Award className="size-6" />
                      </div>
                    }
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold tracking-wider text-gold uppercase">Certified Company Board</span>
                      <ShieldCheck size={14} className="text-gold" />
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-navy-foreground">
                      {String(certifiedBoard.title || "CBSE Affiliated School")}
                    </h4>
                    {Boolean(certifiedBoard.code) && (
                      <p className="mt-0.5 text-xs font-medium text-gold/90">
                        {String(certifiedBoard.code)}
                      </p>
                    )}
                    {Boolean(certifiedBoard.description) && (
                      <p className="mt-1 text-xs text-navy-foreground/70 leading-relaxed">
                        {String(certifiedBoard.description)}
                      </p>
                    )}
                    {Boolean(certifiedBoard.linkUrl) && (
                      <Link href={String(certifiedBoard.linkUrl)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold transition-transform hover:translate-x-1">
                        View Affiliation Details &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {trustEnabled && (
              <Reveal delay={0.1}>
                <div className="flex items-start gap-4 rounded-2xl border border-navy-foreground/20 bg-white/5 p-5 backdrop-blur-xs transition-colors hover:border-gold/30 h-full">
                  <SmartFileThumbnail
                    url={trustBoard.logoUrl ? imageUrl(String(trustBoard.logoUrl)) : null}
                    alt={String(trustBoard.trustName || "Trust Board")}
                    className="size-14 rounded-xl object-contain bg-white/10 p-1.5 shrink-0"
                    fallbackIcon={
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
                        <Building2 className="size-6" />
                      </div>
                    }
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold tracking-wider text-gold uppercase">Trust Board</span>
                      <Building2 size={14} className="text-gold" />
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-navy-foreground">
                      {String(trustBoard.trustName || "K.S. Dalmia Education Trust")}
                    </h4>
                    {Boolean(trustBoard.regNo) && (
                      <p className="mt-0.5 text-xs font-medium text-gold/90">
                        {String(trustBoard.regNo)}
                      </p>
                    )}
                    {Boolean(trustBoard.description) && (
                      <p className="mt-1 text-xs text-navy-foreground/70 leading-relaxed">
                        {String(trustBoard.description)}
                      </p>
                    )}
                    {Boolean(trustBoard.linkUrl) && (
                      <Link href={String(trustBoard.linkUrl) || "https://www.cbse.gov.in"} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold transition-transform hover:translate-x-1">
                        Learn About Trust &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {partnerEnabled && (
              <Reveal delay={0.2}>
                <div className="flex items-start gap-4 rounded-2xl border border-navy-foreground/20 bg-white/5 p-5 backdrop-blur-xs transition-colors hover:border-gold/30 h-full">
                  <SmartFileThumbnail
                    url={academicPartner.logoUrl ? imageUrl(String(academicPartner.logoUrl)) : null}
                    alt={String(academicPartner.title || "Academic Partner")}
                    className="size-14 rounded-xl object-contain bg-white/10 p-1.5 shrink-0"
                    fallbackIcon={
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
                        <GraduationCap className="size-6" />
                      </div>
                    }
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold tracking-wider text-gold uppercase">
                        {String(academicPartner.subtitle || "Our Academic Partner")}
                      </span>
                      <i className="bi bi-briefcase text-gold text-[14px]"></i>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-navy-foreground">
                      {String(academicPartner.title || "Aakash Institute Partner")}
                    </h4>
                    {Boolean(academicPartner.description) && (
                      <p className="mt-1 text-xs text-navy-foreground/70 leading-relaxed">
                        {String(academicPartner.description)}
                      </p>
                    )}
                    {Boolean(academicPartner.linkUrl) && (
                      <Link href={String(academicPartner.linkUrl)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold transition-transform hover:translate-x-1">
                        Explore Courses &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] items-start">
          <Reveal>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/95 p-2 sm:p-2.5 shadow-xs border border-white/15 backdrop-blur-xs transition-transform duration-300 hover:scale-[1.015]">
                <img
                  src={customLogoUrl || "/assets/Settings/Logos/IPSLogo.png"}
                  alt={displayBrandTitle || "Indian Public School"}
                  className="h-8 sm:h-9 md:h-10 w-auto max-w-[150px] sm:max-w-[180px] object-contain shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedLocal) {
                      target.dataset.triedLocal = "true";
                      target.src = "/assets/Settings/Logos/IPSLogo.png";
                    }
                  }}
                />
                {showSecondaryLogo && secondaryLogoUrl && (
                  <>
                    <div className="h-6 sm:h-7 w-[1.5px] bg-slate-300/80 rounded-full shrink-0" aria-hidden="true" />
                    <img
                      src={secondaryLogoUrl}
                      alt="Aakash Foundation"
                      className="h-7 sm:h-8 md:h-9 w-auto max-w-[100px] sm:max-w-[125px] object-contain shrink-0"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedLocal) {
                          target.dataset.triedLocal = "true";
                          target.src = "/assets/Settings/Logos/AakashFoundationLogo.png";
                        }
                      }}
                    />
                  </>
                )}
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-foreground/70">
              {aboutText}
            </p>
            <p className="mt-4 text-xs text-navy-foreground/50 leading-relaxed">
              {addressText} · {phoneText} · {emailText}
            </p>
            <ul className="mt-6 flex gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border border-navy-foreground/20 text-navy-foreground transition-all hover:-translate-y-1 hover:bg-gold hover:text-gold-foreground"
                  >
                    <Icon className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className={`grid ${getFooterGridClass(footerColumns.length)}`}>
            {footerColumns.map((col, i) => (
              <Reveal key={`${col.title}-${i}`} delay={i * 0.05}>
                <h3 className="text-sm font-semibold tracking-wider text-gold uppercase">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((linkItem: any, idx: number) => (
                    <li key={`${linkItem.title}-${idx}`}>
                      <Link
                        href={linkItem.href}
                        onClick={(e) => {
                          if (linkItem.href?.toLowerCase().includes("enquiry") || linkItem.title?.toLowerCase().includes("enquiry")) {
                            e.preventDefault();
                            openAdmissionModal();
                          }
                        }}
                        className="text-sm text-navy-foreground/70 transition-colors hover:text-navy-foreground"
                      >
                        {linkItem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy-foreground/15 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-navy-foreground/60">
            {copyrightText}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { title: "Privacy Policy", href: "/privacy-policy" },
              { title: "Terms of Use", href: "/terms" },
              { title: "Sitemap", href: "/sitemap" },
              { title: "Mandatory Disclosure", href: "/mandatory-disclosure" },
            ].map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-xs text-navy-foreground/60 transition-colors hover:text-gold"
                >
                  {item.title}
                </Link>
              </li>
            ))}
            <li key="Admin Panel Link">
              <Link
                href="/admin"
                title="Admin Panel"
                className="inline-flex items-center gap-1.5 text-xs text-navy-foreground/60 transition-colors hover:text-gold"
              >
                <i className="bi bi-person-gear text-xs text-gold" />
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
