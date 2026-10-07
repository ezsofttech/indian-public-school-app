import type { Metadata } from "next";
import "./globals.css";
import { getBaseUrl, getSchoolJsonLd, getSeoSourceData } from "@/lib/seo";
import { getAssetUrl } from "@/lib/utils";
import { DEFAULT_LOGO } from "@/lib/site-data";

const baseUrl = getBaseUrl();
const seoData = getSeoSourceData();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: seoData.pages.home.title,
    template: `%s | ${seoData.name}`,
  },
  description: seoData.pages.home.description,
  keywords: seoData.pages.home.keywords,
  creator: seoData.name,
  publisher: seoData.name,
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: seoData.pages.home.title,
    description: seoData.pages.home.description,
    url: baseUrl,
    siteName: seoData.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: getAssetUrl(DEFAULT_LOGO),
        width: 800,
        height: 800,
        alt: `${seoData.name} Logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoData.pages.home.title,
    description: seoData.pages.home.description,
    images: [getAssetUrl(DEFAULT_LOGO)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: [
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "MEu__f_ieLX2bOc3aeCCHfzqtqwygpWDOGnq"
    ]
  },
};

import { Suspense } from "react";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = getSchoolJsonLd();

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased" data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var isAdmin = window.location.pathname.indexOf('/admin') === 0;
                var cached = localStorage.getItem(isAdmin ? 'ips_active_theme_admin' : 'ips_active_theme_web');
                if (cached) {
                  var theme = JSON.parse(cached);
                  var root = document.documentElement;
                  if (theme.colors) {
                    if (theme.colors.primary) root.style.setProperty('--primary', theme.colors.primary);
                    if (theme.colors.primaryForeground) root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
                    if (theme.colors.secondary) root.style.setProperty('--secondary', theme.colors.secondary);
                    if (theme.colors.secondaryForeground) root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
                    if (theme.colors.accent) root.style.setProperty('--accent', theme.colors.accent);
                    if (theme.colors.accentForeground) root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
                    if (theme.colors.gold) root.style.setProperty('--gold', theme.colors.gold);
                    if (theme.colors.goldSoft) root.style.setProperty('--gold-soft', theme.colors.goldSoft);
                    if (theme.colors.navy) root.style.setProperty('--navy', theme.colors.navy);
                    if (theme.colors.navyDeep) root.style.setProperty('--navy-deep', theme.colors.navyDeep);
                    if (theme.colors.background) root.style.setProperty('--background', theme.colors.background);
                    if (theme.colors.foreground) root.style.setProperty('--foreground', theme.colors.foreground);
                    if (theme.colors.card) root.style.setProperty('--card', theme.colors.card);
                    if (theme.colors.border) root.style.setProperty('--border', theme.colors.border);
                    if (theme.colors.input) root.style.setProperty('--input', theme.colors.input);
                    if (theme.colors.ring) root.style.setProperty('--ring', theme.colors.ring);
                    if (theme.colors.gradientNavy) root.style.setProperty('--gradient-navy', theme.colors.gradientNavy);
                  }
                  if (theme.layout) {
                    if (theme.layout.radius) root.style.setProperty('--radius', theme.layout.radius);
                    var btnRad = theme.layout.btnRadius || (theme.layout.btnShape === 'pill' ? '9999px' : theme.layout.btnShape === 'rounded' ? '0.75rem' : theme.layout.btnShape === 'soft' ? '0.375rem' : theme.layout.btnShape === 'sharp' ? '0px' : '9999px');
                    var cardRad = theme.layout.cardRadius || (theme.layout.cardShape === 'extra-rounded' ? '1.5rem' : theme.layout.cardShape === 'rounded' ? '1rem' : theme.layout.cardShape === 'soft' ? '0.5rem' : theme.layout.cardShape === 'sharp' ? '0px' : '1rem');
                    var logoRad = theme.layout.logoRadius || (theme.layout.logoShape === 'circle' ? '50%' : theme.layout.logoShape === 'rounded' ? '0.75rem' : theme.layout.logoShape === 'square' ? '0px' : theme.layout.logoShape === 'leaf' ? '9999px 0px 9999px 0px' : '50%');
                    var badgeRad = theme.layout.badgeRadius || (theme.layout.badgeShape === 'pill' ? '9999px' : theme.layout.badgeShape === 'soft' ? '0.375rem' : theme.layout.badgeShape === 'sharp' ? '0px' : '9999px');
                    root.style.setProperty('--btn-radius', btnRad);
                    root.style.setProperty('--card-radius', cardRad);
                    root.style.setProperty('--logo-radius', logoRad);
                    root.style.setProperty('--badge-radius', badgeRad);
                  }
                  if (theme.typography) {
                    var dFont = theme.typography.fontDisplay || '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
                    if (dFont.indexOf('Fraunces') !== -1 || dFont.indexOf('Georgia') !== -1 || dFont.indexOf('ui-serif') !== -1) {
                      dFont = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
                    }
                    var sFont = theme.typography.fontSans || '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
                    root.style.setProperty('--font-display', dFont);
                    root.style.setProperty('--font-sans', sFont);
                  }
                }
              } catch(e){}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}


