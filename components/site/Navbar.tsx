import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ArrowRight, ChevronDown, ChevronRight, ExternalLink, GraduationCap, Menu, Phone, Sparkles, X } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildMenuHierarchy, DEFAULT_LOGO, DEFAULT_SECONDARY_LOGO, getWhatsAppConfig, homeData, imageUrl, isBannerLogoUrl, text } from "@/lib/site-data";
import { useSiteData } from "@/components/site/SiteDataProvider";
import { openAdmissionModal } from "@/components/site/AdmissionApplicationModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Academics", href: "/#academics" },
  { label: "Admissions", href: "/#admissions" },
  { label: "Infrastructure", href: "/#infrastructure" },
  { label: "Student Life", href: "/#student-life" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Mandatory Disclosure", href: "/mandatory-disclosure" },
  { label: "Contact", href: "/#contact" },
];

interface ApiSubMenuItem {
  title: string;
  linkUrl?: string;
  targetUrl?: string;
  slug?: string;
  isPublished?: boolean;
  order?: number;
  subItems?: ApiSubMenuItem[];
}

interface ApiMenuItem {
  title: string;
  targetUrl?: string;
  slug?: string;
  isPublished?: boolean;
  order?: number;
  subItems?: ApiSubMenuItem[];
}

interface NavSubItem {
  title: string;
  linkUrl: string;
  subItems: NavSubItem[];
}

interface NavItem {
  label: string;
  href: string;
  subItems: NavSubItem[];
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.3,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gold"
      aria-hidden
    />
  );
}

export function AnnouncementBar() {
  const siteData = useSiteData();
  const home = homeData(siteData);
  const identity = (home.identity as Record<string, unknown>) ?? {};
  const headerConfig = (identity.header as Record<string, unknown>) ?? {};

  const noticeText = text(headerConfig.noticeText).trim() || "Admissions Open for Session 2026-27";

  return (
    <div className="surface-navy relative z-40 text-navy-foreground">
      <div className="container-page flex items-center justify-center gap-2 py-2.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="text-xs sm:text-sm font-semibold text-white/95">{noticeText}</span>
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const siteData = useSiteData();
  const rawMenuItems = (siteData?.menuItems && siteData.menuItems.length > 0)
    ? siteData.menuItems
    : (siteData?.menuitems && (siteData.menuitems as unknown[]).length > 0)
      ? siteData.menuitems
      : [];

  const initialMenuItems = buildMenuHierarchy(rawMenuItems as any[]) as ApiMenuItem[];

  const [dbMenuItems, setDbMenuItems] = useState<ApiMenuItem[]>(initialMenuItems);
  const [logoError, setLogoError] = useState(false);
  const [secondaryLogoError, setSecondaryLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<Record<string, boolean>>({});
  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"overflow" | "all">("overflow");

  const toggleMobileExpand = (key: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedMobile((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (initialMenuItems.length > 0 && dbMenuItems.length === 0) {
      setDbMenuItems(initialMenuItems);
    }
  }, [initialMenuItems, dbMenuItems.length]);

  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/menu-items`, { params: { publishedOnly: "true" } })
      .then((res) => {
        if (!isMounted) return;
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (list.length > 0) {
          setDbMenuItems(buildMenuHierarchy(list) as ApiMenuItem[]);
        }
      })
      .catch(() => {
        /* Fallback cleanly to siteData hierarchy */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const menuCardItems = homeData(siteData).menuCard;
  const legacyApiNav = Array.isArray(menuCardItems) ? (menuCardItems as Record<string, unknown>[]) : [];

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

  const normalizeHref = (rawUrl?: string): string => {
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
  };

  const mapSubItem = (s: ApiSubMenuItem): NavSubItem => {
    const rawUrl = s.linkUrl || s.targetUrl || s.slug || "/";
    const linkUrl = normalizeHref(rawUrl);
    const childSubItems = Array.isArray(s.subItems)
      ? s.subItems.map(mapSubItem).filter((c) => Boolean(c.title))
      : [];
    return {
      title: s.title,
      linkUrl,
      subItems: childSubItems,
    };
  };

  const navigation: NavItem[] = dbMenuItems.length
    ? dbMenuItems.map((item) => {
      const rawUrl = (item.targetUrl || item.slug || "/").trim();
      const href = normalizeHref(rawUrl);
      return {
        label: item.title,
        href,
        subItems: Array.isArray(item.subItems)
          ? item.subItems.map(mapSubItem).filter((s) => Boolean(s.title))
          : [],
      };
    })
    : legacyApiNav.length
      ? legacyApiNav.map((item) => ({
        label: text(item.heading),
        href: normalizeHref(text(item.redirectUrl, "/")),
        subItems: [] as NavSubItem[],
      }))
      : NAV.map((item) => ({ ...item, subItems: [] as NavSubItem[] }));

  const MAX_VISIBLE_NAV = 8;
  const hasNavOverflow = navigation.length > MAX_VISIBLE_NAV;
  const visibleNavigation = hasNavOverflow ? navigation.slice(0, 8) : navigation;
  const overflowNavigation = hasNavOverflow ? navigation.slice(8) : [];

  const handleNavClick = (href: string, e?: React.MouseEvent) => {
    setOpen(false);
    document.body.style.overflow = "";

    if (href.toLowerCase().includes("enquiry")) {
      if (e) e.preventDefault();
      openAdmissionModal();
      return;
    }

    if (href.includes("#")) {
      const hashIndex = href.indexOf("#");
      const hash = href.slice(hashIndex + 1);
      const targetPath = href.slice(0, hashIndex) || "/";

      const isCurrentPageHome =
        typeof window !== "undefined" &&
        (window.location.pathname === "/" || window.location.pathname === targetPath);

      if (isCurrentPageHome && hash) {
        const targetElement = document.getElementById(hash);
        if (targetElement) {
          if (e) e.preventDefault();
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: "smooth" });
            window.history.pushState(null, "", `/#${hash}`);
          }, 120);
        }
      }
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const homeIdentity = (homeData(siteData).identity as Record<string, unknown>) || {};
  const siteLogo = (siteData?.site_logo as Record<string, any>) || (homeIdentity.site_logo as Record<string, any>) || {};
  const headerConfig = (homeIdentity.header as Record<string, any>) || (siteData?.header as Record<string, any>) || {};
  const rawLogoUrl = (siteLogo.logoUrl ? String(siteLogo.logoUrl).trim() : "") || (headerConfig.logoUrl ? String(headerConfig.logoUrl).trim() : "") || DEFAULT_LOGO;
  const customLogoUrl = imageUrl(rawLogoUrl);
  const isBanner = isBannerLogoUrl(rawLogoUrl);
  const logoTitle = (siteLogo.logoText ? String(siteLogo.logoText).trim() : "") || (headerConfig.logoText ? String(headerConfig.logoText).trim() : "") || "Indian Public School";
  const logoSubtitle = (siteLogo.logoSubText ? String(siteLogo.logoSubText).trim() : "") || (headerConfig.logoSubText ? String(headerConfig.logoSubText).trim() : "") || "Learn · Lead · Inspire";

  const rawSecondaryLogoUrl = (siteLogo.secondaryLogoUrl ? String(siteLogo.secondaryLogoUrl).trim() : "") || (headerConfig.secondaryLogoUrl ? String(headerConfig.secondaryLogoUrl).trim() : "") || DEFAULT_SECONDARY_LOGO;
  const secondaryLogoUrl = imageUrl(rawSecondaryLogoUrl);
  const showSecondaryLogo = siteLogo.showSecondaryLogo !== false && headerConfig.showSecondaryLogo !== false;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-background/95 shadow-[0_4px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl py-1"
          : "border-b border-border/60 bg-background/90 shadow-soft backdrop-blur-md py-1.5"
      )}
    >
      <nav className="container-page flex h-16 sm:h-20 items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 transition-all duration-300 dark:bg-white/95 dark:px-3 dark:py-1.5 dark:rounded-2xl dark:border dark:border-white/20 dark:shadow-md dark:backdrop-blur-md">
          <Link href="/" onClick={(e) => handleNavClick("/", e)} className="group flex items-center gap-3 shrink-0">
            {customLogoUrl && !logoError ? (
              <img
                src={customLogoUrl}
                alt={logoTitle || "Indian Public School"}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedLocal) {
                    target.dataset.triedLocal = "true";
                    target.src = "/assets/Settings/Logos/IPSLogo.png";
                  } else {
                    setLogoError(true);
                  }
                }}
                className={cn(
                  "w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-[1.015]",
                  isBanner
                    ? "h-8 sm:h-9 lg:h-10 max-w-[150px] sm:max-w-[190px] lg:max-w-[220px]"
                    : "h-8 sm:h-9 lg:h-10 max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]"
                )}
              />
            ) : (
              <span
                className="grid size-10 place-items-center bg-primary text-primary-foreground shadow-soft transition-transform duration-300 group-hover:scale-105"
                style={{ borderRadius: "var(--logo-radius, 50%)" }}
              >
                <GraduationCap className="size-5" />
              </span>
            )}
          </Link>

          {showSecondaryLogo && secondaryLogoUrl && !secondaryLogoError && (
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="h-6 sm:h-7 w-[1.5px] bg-border dark:bg-slate-300/80 rounded-full shrink-0" aria-hidden="true" />
              <Link href="/#about" onClick={(e) => handleNavClick("/#about", e)} className="group flex items-center transition-all hover:opacity-95 shrink-0" title="Aakash Educational Partner / Foundation">
                <img
                  src={secondaryLogoUrl}
                  alt="Aakash Foundation"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedLocal) {
                      target.dataset.triedLocal = "true";
                      target.src = "/assets/Settings/Logos/AakashFoundationLogo.png";
                    } else {
                      setSecondaryLogoError(true);
                    }
                  }}
                  className="h-7 sm:h-8 lg:h-9 w-auto max-w-[100px] sm:max-w-[125px] lg:max-w-[145px] object-contain shrink-0 transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-xs"
                />
              </Link>
            </div>
          )}
        </div>

        <ul className="hidden items-center gap-1 xl:flex">
          {visibleNavigation.map((item, index) => {
            const isRightSide = index >= Math.floor(visibleNavigation.length / 2);

            return (
              <li key={`${item.href || "navigation-item"}-${index}`} className="group relative">
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className="relative flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <span className="relative">
                    {item.label}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                  </span>
                  {item.subItems.length > 0 && (
                    <ChevronDown size={13} className="text-muted-foreground transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {item.subItems.length > 0 && (
                  <div
                    className={cn(
                      "pointer-events-none absolute top-full pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
                      isRightSide ? "right-0" : "left-0"
                    )}
                  >
                    <div className="w-56 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                      {item.subItems.map((sub, sIdx) => {
                        const hasLevel3 = sub.subItems && sub.subItems.length > 0;
                        const targetHref = (sub.linkUrl === "/" && hasLevel3)
                          ? sub.subItems[0].linkUrl
                          : (sub.linkUrl || item.href);

                        return (
                          <div key={sIdx} className="group/sub relative">
                            <Link
                              href={targetHref}
                              onClick={(e) => handleNavClick(targetHref, e)}
                              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <span>{sub.title}</span>
                              {hasLevel3 && (
                                <ChevronRight
                                  size={13}
                                  className={cn(
                                    "text-muted-foreground transition-transform",
                                    isRightSide
                                      ? "rotate-180 group-hover/sub:-translate-x-0.5"
                                      : "group-hover/sub:translate-x-0.5"
                                  )}
                                />
                              )}
                            </Link>

                            {hasLevel3 && (
                              <div
                                className={cn(
                                  "pointer-events-none absolute top-0 opacity-0 transition-all duration-200 group-hover/sub:pointer-events-auto group-hover/sub:opacity-100",
                                  isRightSide ? "right-full pr-1.5" : "left-full pl-1.5"
                                )}
                              >
                                <div className="w-56 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                                  {sub.subItems.map((sub3, s3Idx) => {
                                    const sub3Href = sub3.linkUrl || targetHref;
                                    return (
                                      <Link
                                        key={s3Idx}
                                        href={sub3Href}
                                        onClick={(e) => handleNavClick(sub3Href, e)}
                                        className="block rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                                      >
                                        {sub3.title}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {hasNavOverflow && (
            <li className="relative">
              <button
                type="button"
                onClick={() => setMoreModalOpen(true)}
                className="grid size-9 place-items-center rounded-full border border-border/80 bg-background/80 text-foreground/80 transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:text-gold active:scale-95 cursor-pointer group shadow-2xs"
                aria-label="View additional pages"
                title="View additional pages"
              >
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" />
              </button>
            </li>
          )}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAdmissionModal()}
            className="hidden sm:inline-flex items-center justify-center text-[var(--primary-foreground)] cursor-pointer bg-[var(--primary)] hover:bg-[var(--navy)] px-4 py-2 text-xs font-bold transition-all hover:scale-105 shadow-xs"
            style={{ borderRadius: "var(--btn-radius, 9999px)" }}
          >
            <span>Enquiry</span>
          </button>
          <Link
            href="/contact-us"
            onClick={(e) => handleNavClick("/contact-us", e)}
            className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary xl:hidden"
            aria-label="Contact school"
          >
            <Phone className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full border border-border transition-colors hover:bg-secondary xl:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="size-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background/98 backdrop-blur-xl xl:hidden"
          >
            <motion.ul
              className="container-page grid gap-1.5 py-4 max-h-[80vh] overflow-y-auto"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.045 } } }}
            >
              {navigation.map((item, index) => {
                const itemKey = `item-${index}`;
                const hasSub = item.subItems.length > 0;
                const isExpanded = Boolean(expandedMobile[itemKey]);
                const isHashOrPlaceholder =
                  !item.href || item.href === "/" || item.href === "#" || item.href.includes("#");

                return (
                  <motion.li
                    key={`${item.href || "mobile-navigation-item"}-${index}`}
                    variants={{
                      hidden: { opacity: 0, x: -16 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="rounded-xl bg-secondary/30 border border-border/40 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5">
                      {hasSub && isHashOrPlaceholder ? (
                        <button
                          type="button"
                          onClick={(e) => toggleMobileExpand(itemKey, e)}
                          className="flex-1 text-left text-base font-semibold transition-colors hover:text-primary cursor-pointer flex items-center justify-between pr-2"
                        >
                          <span>{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={(e) => handleNavClick(item.href, e)}
                          className="flex-1 text-base font-semibold transition-colors hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      )}

                      {hasSub && (
                        <button
                          type="button"
                          onClick={(e) => toggleMobileExpand(itemKey, e)}
                          className="grid size-8 place-items-center rounded-lg border border-border/60 bg-background/80 text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          aria-label={`Toggle ${item.label} sub menu`}
                        >
                          <ChevronDown
                            size={16}
                            className={cn(
                              "transition-transform duration-300",
                              isExpanded && "rotate-180 text-primary",
                            )}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {hasSub && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden border-t border-border/50 bg-background/60 px-3 py-2 space-y-1.5"
                        >
                          {item.subItems.map((sub, sIdx) => {
                            const subKey = `sub-${index}-${sIdx}`;
                            const hasLevel3 = sub.subItems && sub.subItems.length > 0;
                            const isSubExpanded = Boolean(expandedMobile[subKey]);
                            const targetHref =
                              sub.linkUrl === "/" && hasLevel3
                                ? sub.subItems[0].linkUrl
                                : sub.linkUrl || item.href;

                            const isSubHashOrPlaceholder =
                              !targetHref || targetHref === "/" || targetHref === "#" || targetHref.includes("#");

                            return (
                              <div key={sIdx} className="rounded-lg bg-card/60 p-1.5 border border-border/40 space-y-1">
                                <div className="flex items-center justify-between px-2 py-1">
                                  {hasLevel3 && isSubHashOrPlaceholder ? (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleMobileExpand(subKey, e)}
                                      className="flex-1 text-left text-xs font-semibold text-foreground/90 transition-colors hover:text-primary cursor-pointer"
                                    >
                                      {sub.title}
                                    </button>
                                  ) : (
                                    <Link
                                      href={targetHref}
                                      onClick={(e) => handleNavClick(targetHref, e)}
                                      className="flex-1 text-xs font-semibold text-foreground/90 transition-colors hover:text-primary"
                                    >
                                      {sub.title}
                                    </Link>
                                  )}

                                  {hasLevel3 && (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleMobileExpand(subKey, e)}
                                      className="grid size-6 place-items-center rounded bg-secondary text-muted-foreground hover:text-primary cursor-pointer"
                                    >
                                      <ChevronDown
                                        size={13}
                                        className={cn(
                                          "transition-transform duration-200",
                                          isSubExpanded && "rotate-180 text-primary",
                                        )}
                                      />
                                    </button>
                                  )}
                                </div>

                                <AnimatePresence>
                                  {hasLevel3 && isSubExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden ml-2 pl-2 border-l border-primary/20 space-y-1 pt-1"
                                    >
                                      {sub.subItems.map((sub3, s3Idx) => {
                                        const sub3Href = sub3.linkUrl || targetHref;
                                        return (
                                          <Link
                                            key={s3Idx}
                                            href={sub3Href}
                                            onClick={(e) => handleNavClick(sub3Href, e)}
                                            className="block rounded-md px-2 py-1 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary"
                                          >
                                            {sub3.title}
                                          </Link>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
              <motion.li
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
                className="pt-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    document.body.style.overflow = "";
                    openAdmissionModal();
                  }}
                  className="flex w-full items-center justify-center cursor-pointer bg-[var(--primary)] hover:bg-[var(--navy)] text-[var(--primary-foreground)] font-bold py-2.5 text-sm transition-all"
                  style={{ borderRadius: "var(--btn-radius, 9999px)" }}
                >
                  Enquiry
                </button>
              </motion.li>
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog open={moreModalOpen} onOpenChange={setMoreModalOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-border/80 bg-background/98 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-border/50 text-left">
            <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
              Additional Pages & Resources
            </DialogTitle>
          </DialogHeader>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {overflowNavigation.map((item, idx) => (
              <div
                key={idx}
                className="group/card rounded-2xl border border-border/60 bg-card/50 p-4 transition-all duration-300 hover:border-gold/50 hover:bg-card hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        setMoreModalOpen(false);
                        handleNavClick(item.href, e);
                      }}
                      className="font-display text-sm font-bold text-foreground transition-colors hover:text-primary flex items-center gap-1.5 group-hover/card:text-primary"
                    >
                      <span>{item.label}</span>
                      <ExternalLink size={12} className="opacity-0 group-hover/card:opacity-100 text-gold transition-opacity" />
                    </Link>
                    {item.subItems.length > 0 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {item.subItems.length}
                      </span>
                    )}
                  </div>

                  {item.subItems.length > 0 ? (
                    <div className="space-y-1.5">
                      {item.subItems.map((sub, sIdx) => {
                        const hasLevel3 = sub.subItems && sub.subItems.length > 0;
                        const targetHref =
                          sub.linkUrl === "/" && hasLevel3
                            ? sub.subItems[0].linkUrl
                            : sub.linkUrl || item.href;

                        return (
                          <div key={sIdx} className="rounded-lg bg-background/70 p-2 border border-border/40 space-y-1">
                            <Link
                              href={targetHref}
                              onClick={(e) => {
                                setMoreModalOpen(false);
                                handleNavClick(targetHref, e);
                              }}
                              className="flex items-center justify-between text-xs font-semibold text-foreground/90 transition-colors hover:text-primary"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-gold" />
                                {sub.title}
                              </span>
                              {hasLevel3 && <ChevronRight size={12} className="text-muted-foreground" />}
                            </Link>

                            {hasLevel3 && (
                              <div className="pl-3.5 space-y-1 border-l border-gold/30 ml-1 pt-0.5">
                                {sub.subItems.map((sub3, s3Idx) => {
                                  const sub3Href = sub3.linkUrl || targetHref;
                                  return (
                                    <Link
                                      key={s3Idx}
                                      href={sub3Href}
                                      onClick={(e) => {
                                        setMoreModalOpen(false);
                                        handleNavClick(sub3Href, e);
                                      }}
                                      className="block text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary hover:translate-x-0.5"
                                    >
                                      • {sub3.title}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/70 italic py-1">Direct link</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

