import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCloudinaryRootFolder(): string {
  return (process.env.NEXT_PUBLIC_CLOUDINARY_ROOT_FOLDER || 'ips-education/assets').replace(/^\/+|\/+$/g, '');
}


function extractStringUrl(url: any): string | null {
  if (!url) return null;
  if (typeof url === 'string') return url;
  if (typeof url === 'object' && url !== null) {
    if (typeof url.url === 'string') return url.url;
    if (typeof url.src === 'string') return url.src;
    if (typeof url.path === 'string') return url.path;
    if (typeof url.secure_url === 'string') return url.secure_url;
  }
  return null;
}

/**
 * Checks whether a given URL is external (another page/domain, external protocol, or social/maps link).
 */
export function isExternalUrl(url?: any): boolean {
  if (!url) return false;
  let trimmed = String(url).trim();
  if (!trimmed) return false;

  // Accidental leading slashes before external protocol/domain: e.g. /https:/, /http:/, /www.
  trimmed = trimmed.replace(/^\/+(?=(?:https?:|\/\/|www\.|\w+\.\w+))/i, "");

  if (/^(?:https?:|\/\/|mailto:|tel:|sms:)/i.test(trimmed)) {
    return true;
  }

  // Domain-like patterns (e.g. maps.app.goo.gl/..., www.google.com, facebook.com/...)
  if (/^(?:www\.|maps\.app\.goo\.gl|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|in|co|edu|gov|gl|io|app|dev|me|ai|info)(?:\/|$|\?|#))/i.test(trimmed)) {
    return true;
  }

  return false;
}

const KNOWN_SITE_SECTIONS = new Set([
  "about",
  "academics",
  "admissions",
  "admission",
  "campus-life",
  "infrastructure",
  "gallery",
  "student-life",
  "enquiry",
  "contact",
  "home",
]);

/**
 * Formats any URL safely:
 * - If external (e.g., Google Maps, external website, mailto, tel), preserves it as an absolute URL and NEVER prepends `/` or current domain.
 * - Fixes malformed protocols (e.g., https:/ -> https://, /https:// -> https://).
 * - If relative internal path, ensures proper leading slash without duplicating.
 * - If section anchor (e.g., #about or "about"), properly formats as /#about.
 */
export function formatHref(url?: any, fallback = "/"): string {
  if (!url) return fallback;
  let trimmed = String(url).trim();
  if (!trimmed) return fallback;

  // Clean accidental leading slashes before external protocol or domain
  trimmed = trimmed.replace(/^\/+(?=(?:https?:|\/\/|www\.|\w+\.\w+))/i, "");

  // Fix single slash after protocol (e.g. https:/maps.app.goo.gl -> https://maps.app.goo.gl)
  trimmed = trimmed.replace(/^https?:\/+(?!\/)/i, (m) => (m.toLowerCase().startsWith("https") ? "https://" : "http://"));

  // Protocol-relative URL //example.com -> https://example.com
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // Absolute HTTP / HTTPS / Mailto / Tel
  if (/^(?:https?:|mailto:|tel:|sms:)/i.test(trimmed)) {
    return trimmed;
  }

  // External domain without protocol (e.g. maps.app.goo.gl/..., www.facebook.com, example.com/page)
  if (/^(?:www\.|maps\.app\.goo\.gl|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|in|co|edu|gov|gl|io|app|dev|me|ai|info)(?:\/|$|\?|#))/i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  // Internal hash/anchor: #about -> /#about
  if (trimmed.startsWith("#")) {
    return `/${trimmed}`;
  }

  // Known site section slug (e.g. "about" -> "/#about")
  if (KNOWN_SITE_SECTIONS.has(trimmed.toLowerCase())) {
    return `/#${trimmed.toLowerCase()}`;
  }

  // Internal path
  if (trimmed === "/gallery-album" || trimmed === "gallery-album") {
    return "/gallery/album";
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

/**
 * Normalizes full Cloudinary or local paths into clean relative paths like /Videos/IPSIntroVideo.mp4 or /Album/ClassRoom.webp
 */
export function toCleanRelativeAssetPath(url?: any): string {
  const str = extractStringUrl(url);
  if (!str) return '';
  let trimmed = str.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If it is an external URL that is NOT Cloudinary, preserve it cleanly
  if (isExternalUrl(trimmed) && !trimmed.includes('cloudinary.com')) {
    return formatHref(trimmed);
  }

  // Extract relative path from Cloudinary full URL
  if (trimmed.includes('cloudinary.com')) {
    const match = trimmed.match(/\/(?:ips-education\/assets|assets)\/(.+)$/i);
    if (match && match[1]) {
      trimmed = match[1];
    }
  }

  let clean = trimmed.replace(/^https?:\/\/[^\/]+/i, '').replace(/^\/+/, '');

  let prev = '';
  while (prev !== clean) {
    prev = clean;
    clean = clean
      .replace(/^(?:(?:image|video|raw)\/upload\/)+/i, '')
      .replace(/^(?:(?:f_auto(?:,q_auto)?|q_auto)\/)+/i, '')
      .replace(/^v\d+\//i, '')
      .replace(/^(?:ips-education|ips-edu|ips-school)\/(?:assets\/)?/i, '')
      .replace(/^[a-zA-Z0-9_-]+\/assets\//i, '')
      .replace(/^assets\//i, '');
  }

  clean = clean.replace(/\.pdf\.pdf(?=($|\?|#))/gi, '.pdf');
  return `/${clean}`;
}

/**
 * Resolves absolute or relative media/file paths to full URLs dynamically.
 */
export type MediaDeliveryPreset = 'default' | 'cloud';

export function getMediaDeliveryPreset(): MediaDeliveryPreset {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('ips_media_preset');
    if (local === 'cloud' || local === 'default') return local;
  }
  const envVal = (process.env.NEXT_PUBLIC_MEDIA_PRESET || 'default').toLowerCase().trim();
  return envVal === 'cloud' ? 'cloud' : 'default';
}

export function setMediaDeliveryPreset(preset: MediaDeliveryPreset): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ips_media_preset', preset);
    window.dispatchEvent(new Event('ips_media_preset_changed'));
  }
}

function isKnownLocalSettingsAsset(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, '/').replace(/^\/?(assets\/)?/, '');
  // Any file with Cloudinary generated id 'file_' is an uploaded asset in the cloud
  if (lower.includes('/file_') || lower.startsWith('file_')) return false;

  return (
    lower.startsWith('settings/logos/') ||
    lower.startsWith('settings/icons/') ||
    lower.startsWith('settings/home/banner_') ||
    lower.startsWith('settings/home/hero-campus') ||
    lower.startsWith('settings/home/chairman.jpeg') ||
    lower.startsWith('settings/home/director.jpeg') ||
    lower.startsWith('settings/home/principal.jpeg') ||
    lower.startsWith('settings/mandatory_disclosure')
  );
}

/**
 * Normalizes asset URLs:
 * - If preset is 'default': serves local assets (Settings/Logos/Home/Icons) locally from /assets/... first.
 * - If preset is 'cloud': serves from Cloudinary CDN.
 * - Always injects f_auto,q_auto optimization on Cloudinary images to minimize bandwidth.
 */
export function getAssetUrl(url?: any): string {
  const str = extractStringUrl(url);
  if (!str) return '';
  let trimmed = str
    .trim()
    .replace(/(?:assets\/Videos\/)+assets\/Videos\//gi, 'assets/Videos/')
    .replace(/(?:Videos\/)+Videos\//gi, 'Videos/');
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const preset = getMediaDeliveryPreset();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('cloudinary.com')) {
      let fixedUrl = trimmed
        .replace(/(?:assets\/Videos\/)+assets\/Videos\//gi, 'assets/Videos/')
        .replace(/(?:Videos\/)+Videos\//gi, 'Videos/');

      if (
        fixedUrl.toLowerCase().includes('aakashhealthfoundation') ||
        fixedUrl.toLowerCase().includes('aakash_foundation_logo') ||
        fixedUrl.toLowerCase().includes('aakashfoundationlogo') ||
        fixedUrl.toLowerCase().includes('file_xpnvia')
      ) {
        fixedUrl = 'https://res.cloudinary.com/dnw7mgysa/image/upload/ips-education/assets/Settings/Logos/AakashFoundationLogo.png';
      }

      // If preset is 'default', check if this is a Settings asset that is available locally
      if (preset === 'default') {
        const settingsMatch = fixedUrl.match(/\/(Settings\/[^?#]+)/i);
        if (settingsMatch && settingsMatch[1] && isKnownLocalSettingsAsset(settingsMatch[1])) {
          return `/assets/${settingsMatch[1]}`;
        }
      }

      // Collapse duplicate f_auto,q_auto and rootFolder occurrences
      const rootFolder = getCloudinaryRootFolder();
      fixedUrl = fixedUrl
        .replace(/(?:f_auto(?:,q_auto)?\/)+/gi, 'f_auto,q_auto/')
        .replace(/(?:ips-education\/assets\/)+/gi, `${rootFolder}/`)
        .replace(/f_auto,q_auto\/ips-education\/assets\/f_auto,q_auto\/ips-education\/assets\//gi, `f_auto,q_auto/${rootFolder}/`);

      if (!fixedUrl.includes('/upload/')) {
        const isVideo = fixedUrl.includes('/Videos/') || /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(fixedUrl);
        const isRaw = /\.(doc|docx|xls|xlsx|zip|txt|csv)$/i.test(fixedUrl);
        const typePrefix = isVideo ? 'video/upload' : isRaw ? 'raw/upload' : 'image/upload';
        if (rootFolder && fixedUrl.includes(`/${rootFolder}/`)) {
          fixedUrl = fixedUrl.replace(`/${rootFolder}/`, `/${typePrefix}/${rootFolder}/`);
        }
      }

      fixedUrl = fixedUrl.replace(/\.pdf\.pdf(?=($|\?|#))/gi, '.pdf');

      // Inject f_auto,q_auto for standard Cloudinary images to save bandwidth,
      // avoiding PDFs and explicit transformation chains like pg_ (PDF page preview) or f_jpg
      if (
        fixedUrl.includes('/image/upload/') &&
        !fixedUrl.includes('/image/upload/f_auto') &&
        !fixedUrl.includes('f_auto') &&
        !fixedUrl.includes('/raw/upload/') &&
        !/\.pdf($|\?|#)/i.test(fixedUrl) &&
        !fixedUrl.includes('pg_') &&
        !fixedUrl.includes('f_jpg')
      ) {
        fixedUrl = fixedUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
      }

      return fixedUrl;
    }
    return trimmed;
  }

  let cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');
  if (cleanPath.toLowerCase().startsWith('public/')) {
    cleanPath = cleanPath.slice('public/'.length).replace(/^\/+/, '');
  }
  if (cleanPath.toLowerCase().startsWith('assets/')) {
    cleanPath = cleanPath.slice('assets/'.length).replace(/^\/+/, '');
  }

  cleanPath = cleanPath
    .replace(/(?:assets\/Videos\/)+assets\/Videos\//gi, 'assets/Videos/')
    .replace(/(?:Videos\/)+Videos\//gi, 'Videos/');

  // Clean out any duplicate leading transformations, version tags, or root folder from relative paths
  const rootFolder = getCloudinaryRootFolder();
  let prevPath = '';
  while (prevPath !== cleanPath) {
    prevPath = cleanPath;
    cleanPath = cleanPath
      .replace(/^(?:(?:image|video|raw)\/upload\/)+/i, '')
      .replace(/^(?:(?:f_auto(?:,q_auto)?|q_auto)\/)+/i, '')
      .replace(/^v\d+\//i, '')
      .replace(/^(?:ips-education|ips-edu|ips-school)\/(?:assets\/)?/i, '')
      .replace(/^[a-zA-Z0-9_-]+\/assets\//i, '')
      .replace(/^assets\//i, '');
  }

  if (cleanPath.startsWith('Logos/')) {
    cleanPath = `Settings/${cleanPath}`;
  }

  if (
    cleanPath.toLowerCase().includes('aakashhealthfoundation') ||
    cleanPath.toLowerCase().includes('aakash_foundation_logo') ||
    cleanPath.toLowerCase().includes('aakashfoundationlogo') ||
    cleanPath.toLowerCase().includes('file_xpnvia')
  ) {
    cleanPath = 'Settings/Logos/AakashFoundationLogo.png';
  }

  // If preset is 'default', ONLY known bundled static assets are served locally from public/assets/Settings
  if (preset === 'default') {
    if (isKnownLocalSettingsAsset(cleanPath)) {
      return `/assets/${cleanPath}`;
    }

    if (process.env.NEXT_PUBLIC_SERVE_LOCAL_ASSETS === 'true') {
      return `/assets/${cleanPath}`;
    }
  }

  const lowerPath = cleanPath.toLowerCase();
  let resourcePrefix = 'image/upload';
  const cloudinaryBase = (process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL || 'https://res.cloudinary.com/dnw7mgysa').replace(/\/+$/, '');

  if (
    lowerPath.startsWith('video/upload/') ||
    lowerPath.startsWith('image/upload/') ||
    lowerPath.startsWith('raw/upload/')
  ) {
    return cloudinaryBase ? `${cloudinaryBase}/${cleanPath}` : `/${cleanPath}`;
  }

  if (
    lowerPath.includes('videos/') ||
    /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(lowerPath)
  ) {
    resourcePrefix = 'video/upload';
  } else if (
    /\.(doc|docx|xls|xlsx|zip|txt|csv)$/i.test(lowerPath)
  ) {
    resourcePrefix = 'raw/upload';
  }

  cleanPath = cleanPath.replace(/\.pdf\.pdf(?=($|\?|#))/gi, '.pdf');

  let finalCloudPath = cleanPath;
  if (rootFolder && !cleanPath.startsWith(`${rootFolder}/`)) {
    finalCloudPath = `${rootFolder}/${cleanPath}`;
  }

  // Auto-optimize image delivery via f_auto,q_auto
  const finalPrefix =
    resourcePrefix === 'image/upload' && !finalCloudPath.toLowerCase().endsWith('.pdf')
      ? 'image/upload/f_auto,q_auto'
      : resourcePrefix;

  return cloudinaryBase ? `${cloudinaryBase}/${finalPrefix}/${finalCloudPath}` : `/${finalPrefix}/${finalCloudPath}`;
}

/**
 * Ensures an external web link begins with https:// if a user omitted http:// or https://.
 * Fixes issues where entering "www.facebook.com/xyz" or "/www.facebook.com/xyz" results in
 * the browser navigating to relative paths on the current host domain.
 */
export function ensureExternalUrl(url?: any, fallback = ""): string {
  if (!url) return fallback;
  let trimmed = String(url).trim();
  if (!trimmed) return fallback;

  // Strip accidental leading slashes before domain or protocol
  if (/^\/+(?:https?:|\/\/|www\.|\w+\.\w+)/i.test(trimmed)) {
    trimmed = trimmed.replace(/^\/+/, "");
  }

  // Already an absolute URL or special protocol
  if (/^(?:https?:|\/\/|mailto:|tel:|sms:)/i.test(trimmed)) {
    return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  }

  // Relative internal path intentionally starting with / or # (without domain suffix)
  if ((trimmed.startsWith("/") || trimmed.startsWith("#")) && !/^(\/|#)+(?:www\.|\w+\.(com|org|net|in|co|edu|gov))/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

