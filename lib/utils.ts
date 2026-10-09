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

  // Extract relative path from Cloudinary full URL
  if (trimmed.includes('cloudinary.com')) {
    const match = trimmed.match(/\/(?:ips-education\/assets|assets)\/(.+)$/i);
    if (match && match[1]) {
      const cleanSubPath = match[1].replace(/^\/+/, '');
      return `/${cleanSubPath}`;
    }
  }

  let clean = trimmed.replace(/^https?:\/\/[^\/]+/i, '').replace(/^\/+/, '');
  if (clean.toLowerCase().startsWith('assets/')) {
    clean = clean.slice('assets/'.length);
  }
  return `/${clean}`;
}

/**
 * Resolves absolute or relative media/file paths to full URLs dynamically.
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
        fixedUrl = 'https://res.cloudinary.com/dnw7mgysa/image/upload/ips-education/assets/Settings/Logos/file_xpnvia.png';
      }

      if (!fixedUrl.includes('/upload/')) {
        const isVideo = fixedUrl.includes('/Videos/') || /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(fixedUrl);
        const isRaw = /\.(doc|docx|xls|xlsx|zip|txt|pdf)$/i.test(fixedUrl);
        const typePrefix = isVideo ? 'video/upload' : isRaw ? 'raw/upload' : 'image/upload';
        const rootFolder = getCloudinaryRootFolder();
        if (rootFolder && fixedUrl.includes(`/${rootFolder}/`)) {
          fixedUrl = fixedUrl.replace(`/${rootFolder}/`, `/${typePrefix}/${rootFolder}/`);
        }
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

  if (process.env.NEXT_PUBLIC_SERVE_LOCAL_ASSETS === 'true') {
    return `/assets/${cleanPath}`;
  }

  const rootFolder = getCloudinaryRootFolder();
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
    /\.(doc|docx|xls|xlsx|zip|txt|pdf)$/i.test(lowerPath)
  ) {
    resourcePrefix = 'raw/upload';
  }

  let finalCloudPath = cleanPath;
  if (rootFolder && !cleanPath.startsWith(`${rootFolder}/`)) {
    finalCloudPath = `${rootFolder}/${cleanPath}`;
  }

  return cloudinaryBase ? `${cloudinaryBase}/${resourcePrefix}/${finalCloudPath}` : `/${resourcePrefix}/${finalCloudPath}`;
}
