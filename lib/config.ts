/**
 * Centralized Application & Environment Configuration
 * Consolidates all environment variables, API endpoints, timeouts, and default site constants.
 */

// 1. Backend API Endpoint
const rawApiUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export const API_URL = rawApiUrl.replace(/([^:]\/)\/+/g, "$1");

// On server-side (Node.js SSR), resolve localhost to 127.0.0.1 to avoid Windows IPv6 (::1) lookup timeouts
export const API_SSR_BASE_URL = typeof window === "undefined"
  ? API_URL.replace("://localhost:5000", "://127.0.0.1:5000")
  : API_URL;

export const API_ROOT_URL = API_URL.replace(/\/v1\/?$/, "");

// 2. Client Website Domain
export const DOMAIN = (
  process.env.NEXT_PUBLIC_CLIENT_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://indian-public-school-app.vercel.app"
).replace(/\/+$/, "");

// 3. Application Metadata & Defaults
export const SITE_CONFIG = {
  name: "Indian Public School",
  shortName: "IPS",
  tagline: "Quality Education for a Brighter Future",
  description: "Official portal of Indian Public School, Sambalpur. School operations, admissions, and content management.",
  email: "info@indianpublicschool.in",
  phone: "+91 8114320555",
  address: "Main Road, Near RMC, Khetrajpur, Sambalpur, Odisha - 768006",
} as const;

// 4. Default Asset Paths
export const DEFAULT_ASSETS = {
  heroImage: "/assets/Settings/Home/Hero-5.png",
  logo: "/assets/Settings/Logos/IPSLogo.png",
  secondaryLogo: "/assets/Settings/Logos/AakashFoundationLogo.png",
  crestLogo: "/assets/Settings/Logos/IPSStandardLogo.png",
  popupImage: "/assets/Settings/Home/PopUp.jpg",
  introVideo: "/Videos/file_feszan.mp4",
  chairmanImage: "/assets/Settings/Home/Chairman.jpeg",
  directorImage: "/assets/Settings/Home/Director.jpeg",
  campusImage: "/assets/Settings/Home/hero-campus.png",
} as const;

// 5. Timeouts & Polling (in milliseconds)
export const TIMEOUTS = {
  api: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 6000,
  healthCheck: 3000,
  healthPollingInterval: 60000,
} as const;

// 6. Admin Authentication Keys & Cookies
export const AUTH_CONFIG = {
  tokenStorageKey: "ips_admin_token",
  sessionCookieName: "ips_admin_session",
  cookieMaxAge: 604800, // 7 days in seconds
} as const;

// 7. SEO & Verification
export const SEO_CONFIG = {
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "MEu__f_ieLX2bOc3aeCCHfzqtqwygpWDOGnq",
} as const;

export default {
  API_URL,
  API_SSR_BASE_URL,
  API_ROOT_URL,
  DOMAIN,
  SITE_CONFIG,
  DEFAULT_ASSETS,
  TIMEOUTS,
  AUTH_CONFIG,
  SEO_CONFIG,
};
