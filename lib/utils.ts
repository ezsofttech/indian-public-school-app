import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const trimmed = str.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If it is an external URL that is NOT Cloudinary, preserve it cleanly
  if (isExternalUrl(trimmed) && !trimmed.includes('cloudinary.com')) {
    return formatHref(trimmed);
  }

  // Fast direct extraction from Cloudinary full URL
  if (trimmed.includes('cloudinary.com')) {
    const match = trimmed.match(/\/(?:ips-education\/assets|[a-zA-Z0-9_-]+\/assets|assets)\/(.+)$/i);
    if (match && match[1]) {
      const cleanSub = match[1].replace(/\.pdf\.pdf(?=($|\?|#))/gi, '.pdf').replace(/^\/+/, '');
      return `/${cleanSub}`;
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  let clean = trimmed.replace(/^https?:\/\/[^\/]+/i, '').replace(/^\/+/, '');
  clean = clean
    .replace(/^(?:(?:image|video|raw)\/upload\/)+/i, '')
    .replace(/^(?:[a-z]{1,4}_[a-zA-Z0-9_.-]+(?:,[a-z]{1,4}_[a-zA-Z0-9_.-]+)*\/)+/i, '')
    .replace(/^v\d+\//i, '')
    .replace(/^(?:ips-education|ips-edu|ips-school)\/(?:assets\/)?/i, '')
    .replace(/^[a-zA-Z0-9_-]+\/assets\//i, '')
    .replace(/^assets\//i, '')
    .replace(/\.pdf\.pdf(?=($|\?|#))/gi, '.pdf');

  return `/${clean}`;
}

/**
 * Generates a normalized, canonical deduplication key for an image or file asset.
 * Unifies relative paths, full Cloudinary URLs, transformed URLs, encoded URLs, and protocol variants.
 */
export function getCanonicalAssetKey(url?: any): string {
  if (!url) return '';
  try {
    const raw = extractStringUrl(url) || String(url);
    const decoded = decodeURIComponent(raw);
    const clean = toCleanRelativeAssetPath(decoded).toLowerCase().trim().replace(/^\/+/, '');
    const filename = clean.split('/').pop()?.split('?')[0] || clean;
    // For small numeric files like 1.jpg, keep directory path to avoid collision across different directories
    if (clean.includes('/') && filename.length <= 6 && /^\d+\./.test(filename)) {
      return clean;
    }
    return filename || clean;
  } catch {
    const raw = String(url || '');
    const clean = toCleanRelativeAssetPath(raw).toLowerCase().trim().replace(/^\/+/, '');
    const filename = clean.split('/').pop()?.split('?')[0] || clean;
    return filename || clean;
  }
}

/**
 * Resolves absolute or relative media/file paths to full URLs dynamically.
 */
export type MediaDeliveryPreset = 'default' | 'cloud';

export function getMediaDeliveryPreset(): MediaDeliveryPreset {
  return 'default';
}

export function setMediaDeliveryPreset(_preset: MediaDeliveryPreset): void {}

/**
 * Normalizes asset URLs:
 * - Complete URLs (HTTP/HTTPS) from backend API or JSON are preserved directly without discarding user updates.
 * - Cloudinary images get f_auto,q_auto optimization for maximum performance.
 * - Relative paths are cleanly formatted with a leading slash.
 */
export function getAssetUrl(url?: any): string {
  const str = extractStringUrl(url);
  if (!str) return '';
  const trimmed = str.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/') || trimmed.startsWith('api/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Complete HTTP/HTTPS URL (Cloudinary, external, etc.)
  // NEVER rewrite or discard the user-updated Cloudinary URL!
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('cloudinary.com')) {
      if (
        trimmed.includes('/image/upload/') &&
        !trimmed.includes('/image/upload/f_auto') &&
        !trimmed.includes('f_auto') &&
        !trimmed.includes('/raw/upload/') &&
        !/\.pdf($|\?|#)/i.test(trimmed) &&
        !trimmed.includes('pg_') &&
        !trimmed.includes('f_jpg')
      ) {
        return trimmed.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
      }
    }
    return trimmed;
  }

  // Relative path (e.g. /assets/Settings/..., /Videos/...)
  let cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');
  if (cleanPath.toLowerCase().startsWith('public/')) {
    cleanPath = cleanPath.slice('public/'.length).replace(/^\/+/, '');
  }

  return `/${cleanPath}`;
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

/**
 * Normalizes and restricts phone number inputs:
 * - Allows ONLY the country symbol '+' (at the start) and digits (0-9).
 * - Maximum 12 digits allowed.
 * - Disallows all letters, spaces, symbols, and special characters.
 */
export function formatPhoneNumber(val: string): string {
  if (!val) return "";
  const str = String(val);
  const startsWithPlus = str.trimStart().startsWith("+");
  // Extract all digits (0-9) and cap at 12 digits max
  const digits = str.replace(/\D/g, "").slice(0, 12);

  if (startsWithPlus) {
    return `+${digits}`;
  }
  return digits;
}

/**
 * Keydown handler to block non-digits and invalid characters before they are typed:
 * - Allows Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End, and Ctrl/Cmd shortcuts
 * - Allows '+' only as the first character (position 0)
 * - Allows 0-9 digits up to 12 digits total
 * - Blocks letters, spaces, and any other symbols
 */
export function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
  // Allow navigation & control keys
  if (
    [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(e.key) ||
    (e.ctrlKey || e.metaKey)
  ) {
    return;
  }

  const input = e.currentTarget;
  const currentVal = input.value || "";
  const selectionStart = input.selectionStart ?? currentVal.length;
  const selectionEnd = input.selectionEnd ?? currentVal.length;

  // Allow '+' only at position 0 and if not already present
  if (e.key === "+") {
    if (selectionStart === 0 && !currentVal.includes("+")) {
      return;
    }
    e.preventDefault();
    return;
  }

  // Only allow digits 0-9
  if (/^[0-9]$/.test(e.key)) {
    const existingDigits = currentVal.replace(/\D/g, "");
    const selectedText = currentVal.slice(selectionStart, selectionEnd);
    const removedDigits = selectedText.replace(/\D/g, "").length;
    const remainingDigits = existingDigits.length - removedDigits;

    if (remainingDigits >= 12) {
      e.preventDefault();
    }
    return;
  }

  // Block all letters, spaces, special symbols
  e.preventDefault();
}

/**
 * Checks if a form field represents a phone / contact number
 */
export function isPhoneField(fieldName: string): boolean {
  if (!fieldName) return false;
  const lower = fieldName.toLowerCase();
  return lower.includes("phone") || lower.includes("contact") || lower === "mobile";
}
