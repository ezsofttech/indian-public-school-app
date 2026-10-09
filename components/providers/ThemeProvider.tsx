"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  gold: string;
  goldSoft: string;
  navy: string;
  navyDeep: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  ring: string;
  gradientNavy: string;
  headerBg?: string;
  footerBg?: string;
  topbarBg?: string;
}

export interface ThemeTypography {
  fontDisplay: string;
  fontSans: string;
  baseFontSize: string;
}

export interface ThemeLayout {
  radius: string;
  headerStyle: string;
  heroStyle: string;
  cardStyle: string;
  btnShape?: string;
  btnRadius?: string;
  cardShape?: string;
  cardRadius?: string;
  logoShape?: string;
  logoRadius?: string;
  badgeShape?: string;
  badgeRadius?: string;
}

export interface ThemeConfig {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  portal?: string; // web, admin, both
  isPreset?: boolean;
  isActive?: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  customCss?: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  name: "Classic Navy & Gold",
  slug: "classic-navy-gold",
  description: "Default classic academic theme",
  portal: "web",
  isPreset: true,
  isActive: true,
  colors: {
    primary: "oklch(0.45 0.12 247.7)",
    primaryForeground: "oklch(0.985 0.005 250)",
    secondary: "oklch(0.962 0.01 250)",
    secondaryForeground: "oklch(0.27 0.075 265)",
    accent: "oklch(0.94 0.035 88)",
    accentForeground: "oklch(0.28 0.06 70)",
    gold: "oklch(0.79 0.125 84)",
    goldSoft: "oklch(0.92 0.06 88)",
    navy: "oklch(0.27 0.075 265)",
    navyDeep: "oklch(0.19 0.06 266)",
    background: "oklch(0.995 0.003 250)",
    foreground: "oklch(0.21 0.045 264)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.21 0.045 264)",
    border: "oklch(0.915 0.012 255)",
    input: "oklch(0.915 0.012 255)",
    ring: "oklch(0.79 0.125 84)",
    gradientNavy: "linear-gradient(140deg, oklch(0.22 0.06 266), oklch(0.45 0.12 247.7))",
  },
  typography: {
    fontDisplay: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    fontSans: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    baseFontSize: "16px",
  },
  layout: {
    radius: "0.9rem",
    headerStyle: "standard",
    heroStyle: "gradient",
    cardStyle: "shadow",
    btnShape: "pill",
    btnRadius: "9999px",
    cardShape: "rounded",
    cardRadius: "1rem",
    logoShape: "circle",
    logoRadius: "50%",
    badgeShape: "pill",
    badgeRadius: "9999px",
  },
  customCss: "",
};

interface ThemeContextType {
  activeTheme: ThemeConfig;
  previewTheme: ThemeConfig | null;
  setPreviewTheme: (theme: ThemeConfig | null) => void;
  refreshTheme: () => Promise<void>;
  applyThemeToDocument: (theme: ThemeConfig) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: DEFAULT_THEME,
  previewTheme: null,
  setPreviewTheme: () => {},
  refreshTheme: async () => {},
  applyThemeToDocument: () => {},
  isLoading: false,
});

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

export function applyCssVars(theme: ThemeConfig, persist: boolean = true) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const colors = theme.colors || DEFAULT_THEME.colors;
  const layout = theme.layout || DEFAULT_THEME.layout;
  const typo = theme.typography || DEFAULT_THEME.typography;

  // Toggle .dark class on document root based on theme background lightness or slug
  const bgStr = (colors.background || "").toLowerCase();
  const themeName = (theme.name || "").toLowerCase();
  const themeSlug = (theme.slug || "").toLowerCase();

  const isDarkTheme =
    themeSlug.includes("dark") ||
    themeName.includes("dark") ||
    themeSlug.includes("night") ||
    themeSlug.includes("midnight") ||
    bgStr.includes("oklch(0.1") ||
    bgStr.includes("oklch(0.2") ||
    bgStr.includes("oklch(0.3") ||
    /^#(0|1|2|3)[0-9a-f]{5}$/i.test(bgStr);

  if (isDarkTheme) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  if (colors.primary) root.style.setProperty("--primary", colors.primary);
  if (colors.primaryForeground) root.style.setProperty("--primary-foreground", colors.primaryForeground);
  if (colors.secondary) root.style.setProperty("--secondary", colors.secondary);
  if (colors.secondaryForeground) root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
  if (colors.accent) root.style.setProperty("--accent", colors.accent);
  if (colors.accentForeground) root.style.setProperty("--accent-foreground", colors.accentForeground);
  if (colors.gold) root.style.setProperty("--gold", colors.gold);
  if (colors.goldSoft) root.style.setProperty("--gold-soft", colors.goldSoft);
  if (colors.navy) root.style.setProperty("--navy", colors.navy);
  if (colors.navyDeep) root.style.setProperty("--navy-deep", colors.navyDeep);
  if (colors.background) root.style.setProperty("--background", colors.background);
  if (colors.foreground) root.style.setProperty("--foreground", colors.foreground);
  if (colors.card) root.style.setProperty("--card", colors.card);
  if (colors.cardForeground) root.style.setProperty("--card-foreground", colors.cardForeground);
  if (colors.border) root.style.setProperty("--border", colors.border);
  if (colors.input) root.style.setProperty("--input", colors.input);
  if (colors.ring) root.style.setProperty("--ring", colors.ring);
  if (colors.gradientNavy) root.style.setProperty("--gradient-navy", colors.gradientNavy);

  if (layout.radius) root.style.setProperty("--radius", layout.radius);
  let displayFont = typo.fontDisplay;
  if (!displayFont || displayFont.includes("Fraunces") || displayFont.includes("Georgia") || displayFont.includes("ui-serif")) {
    displayFont = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
  }
  let sansFont = typo.fontSans;
  if (!sansFont) {
    sansFont = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
  }
  root.style.setProperty("--font-display", displayFont);
  root.style.setProperty("--font-sans", sansFont);

  // Shape Variables
  const btnRad = layout.btnRadius || (layout.btnShape === "pill" ? "9999px" : layout.btnShape === "rounded" ? "0.75rem" : layout.btnShape === "soft" ? "0.375rem" : layout.btnShape === "sharp" ? "0px" : "9999px");
  const cardRad = layout.cardRadius || (layout.cardShape === "extra-rounded" ? "1.5rem" : layout.cardShape === "rounded" ? "1rem" : layout.cardShape === "soft" ? "0.5rem" : layout.cardShape === "sharp" ? "0px" : "1rem");
  const logoRad = layout.logoRadius || (layout.logoShape === "circle" ? "50%" : layout.logoShape === "rounded" ? "0.75rem" : layout.logoShape === "square" ? "0px" : layout.logoShape === "leaf" ? "9999px 0px 9999px 0px" : "50%");
  const badgeRad = layout.badgeRadius || (layout.badgeShape === "pill" ? "9999px" : layout.badgeShape === "soft" ? "0.375rem" : layout.badgeShape === "sharp" ? "0px" : "9999px");

  root.style.setProperty("--btn-radius", btnRad);
  root.style.setProperty("--card-radius", cardRad);
  root.style.setProperty("--logo-radius", logoRad);
  root.style.setProperty("--badge-radius", badgeRad);

  let styleTag = document.getElementById("theme-custom-css") as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "theme-custom-css";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = theme.customCss || "";

  if (persist && typeof window !== "undefined") {
    try {
      const isAdminPage = window.location.pathname.startsWith("/admin");
      const key = isAdminPage ? "ips_active_theme_admin" : "ips_active_theme_web";
      localStorage.setItem(key, JSON.stringify(theme));
    } catch {}
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const isAdminPage = window.location.pathname.startsWith("/admin");
        const key = isAdminPage ? "ips_active_theme_admin" : "ips_active_theme_web";
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.colors) return parsed;
        }
      } catch {}
    }
    return DEFAULT_THEME;
  });
  const [previewTheme, setPreviewThemeState] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveTheme = useCallback(async () => {
    try {
      const isAdminPage = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const previewId = urlParams?.get("preview_theme_id");

      let themeData: ThemeConfig | null = null;

      if (previewId && !isAdminPage) {
        try {
          const previewRes = await axios.get(`${API_BASE}/theme/${previewId}`, { timeout: 4000 });
          if (previewRes.data) {
            themeData = previewRes.data.data || previewRes.data;
          }
        } catch {
          // fallback to default active theme if preview theme fetch fails
        }
      }

      if (!themeData) {
        const portalParam = isAdminPage ? "admin" : "web";
        const res = await axios.get(`${API_BASE}/theme/active?portal=${portalParam}`, { timeout: 4000 });
        if (res.data) {
          themeData = res.data.data || res.data;
        }
      }

      if (themeData && themeData.colors) {
        setActiveTheme(themeData);
        if (!previewTheme) {
          applyCssVars(themeData);
        }
      }
    } catch {
      // Keep default theme on network issue
      if (!previewTheme) {
        applyCssVars(DEFAULT_THEME, false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [previewTheme]);

  useEffect(() => {
    fetchActiveTheme();
  }, [fetchActiveTheme]);

  const setPreviewTheme = (theme: ThemeConfig | null) => {
    setPreviewThemeState(theme);
    if (theme) {
      applyCssVars(theme);
    } else {
      applyCssVars(activeTheme);
    }
  };

  const applyThemeToDocument = (theme: ThemeConfig) => {
    applyCssVars(theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        previewTheme,
        setPreviewTheme,
        refreshTheme: fetchActiveTheme,
        applyThemeToDocument,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
