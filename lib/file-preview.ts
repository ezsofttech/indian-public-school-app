import { getAssetUrl } from "./utils";

export function isCloudinaryUrl(url?: any): boolean {
  if (!url || typeof url !== "string") return false;
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
}

export function normalizePdfUrl(url?: any): string {
  if (!url) return "";
  if (typeof url !== "string") {
    if (typeof url === "object" && url !== null) {
      const extracted = url.url || url.src || url.path || url.secure_url;
      if (typeof extracted === "string") {
        url = extracted;
      } else {
        return "";
      }
    } else {
      return "";
    }
  }
  let clean = url.trim();

  // Convert legacy signed Cloudinary download API links to direct Cloudinary CDN URLs
  if (clean.includes("api.cloudinary.com") && clean.includes("download") && clean.includes("public_id=")) {
    try {
      const urlObj = new URL(clean);
      const publicId = urlObj.searchParams.get("public_id");
      const format = urlObj.searchParams.get("format") || "pdf";
      const pathParts = urlObj.pathname.split("/");
      const cloudIdx = pathParts.indexOf("v1_1");
      const cloudName = cloudIdx !== -1 ? pathParts[cloudIdx + 1] : "dnw7mgysa";

      if (publicId && cloudName) {
        const decodedPublicId = decodeURIComponent(publicId);
        const hasExt = decodedPublicId.toLowerCase().endsWith(`.${format.toLowerCase()}`);
        const finalPublicId = hasExt ? decodedPublicId : `${decodedPublicId}.${format}`;
        clean = `https://res.cloudinary.com/${cloudName}/image/upload/${finalPublicId}`;
      }
    } catch {
      // Ignore URL parse error and proceed with original clean string
    }
  }

  // ONLY for PDFs: If Cloudinary URL has raw/upload, map to image pipeline where inline PDF rendering is supported
  if (
    isPdfFile(clean) &&
    clean.includes("res.cloudinary.com") &&
    clean.includes("/raw/upload/")
  ) {
    clean = clean.replace("/raw/upload/", "/image/upload/");
  }

  // Non-PDF documents (.docx, .doc, .xlsx, .xls, .csv, .ppt, etc.) MUST remain in /raw/upload/
  if (!isPdfFile(clean) && clean.includes("res.cloudinary.com") && clean.includes("/image/upload/")) {
    clean = clean.replace("/image/upload/", "/raw/upload/");
  }

  if (clean.toLowerCase().endsWith(".pdf.pdf")) {
    clean = clean.substring(0, clean.length - 4);
  }
  return getAssetUrl(clean);
}

export function getCleanUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  return url.trim().split("?")[0].split("#")[0];
}

export function isPdfFile(url?: string | null, title?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lowercaseUrl = url.toLowerCase();
  const cleanTitle = (title || "").toLowerCase();

  if (
    lowercaseUrl.startsWith("blob:") ||
    lowercaseUrl.startsWith("data:application/pdf") ||
    lowercaseUrl.includes("application/pdf") ||
    cleanTitle.endsWith(".pdf")
  ) {
    return true;
  }

  const clean = lowercaseUrl.split("?")[0].split("#")[0];

  return (
    clean.endsWith(".pdf") ||
    lowercaseUrl.includes(".pdf") ||
    lowercaseUrl.includes("format=pdf") ||
    lowercaseUrl.includes("resource_type=pdf") ||
    lowercaseUrl.includes("/pdf-proxy")
  );
}

export function isDocumentFile(url?: string | null, title?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lowercaseUrl = url.toLowerCase();
  const clean = lowercaseUrl.split("?")[0].split("#")[0];

  return (
    isPdfFile(url, title) ||
    /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z)$/i.test(clean) ||
    lowercaseUrl.includes(".doc") ||
    lowercaseUrl.includes(".docx") ||
    lowercaseUrl.includes(".xls") ||
    lowercaseUrl.includes(".xlsx") ||
    clean.includes("/raw/upload/")
  );
}

/**
 * Returns an internal Next.js PDF proxy URL so CORS and Content-Disposition headers
 * are handled server-side seamlessly for any external/Cloudinary PDF file.
 * Returns local blob: and data: URLs unmodified.
 */
export function getPdfProxyUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = normalizePdfUrl(url);
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/api/pdf-proxy")
  ) {
    return trimmed;
  }
  return `/api/pdf-proxy?url=${encodeURIComponent(trimmed)}`;
}

/**
 * Generates a high-quality JPG picture thumbnail URL for Cloudinary PDFs.
 * Page parameter specifies which PDF page to render as a picture (default page 1).
 */
export function getCloudinaryPdfThumbnailUrl(url?: string | null, page = 1, width = 800): string {
  if (!url) return "";
  let trimmed = normalizePdfUrl(url);

  if (isCloudinaryUrl(trimmed)) {
    if (trimmed.includes("res.cloudinary.com/niefrrkx")) {
      trimmed = trimmed.replace("res.cloudinary.com/niefrrkx", "res.cloudinary.com/dnw7mgysa");
    }

    let cdnUrl = trimmed;
    // Map any Cloudinary raw upload of PDFs to the image pipeline where page previews are rendered
    if (cdnUrl.includes("/raw/upload/")) {
      cdnUrl = cdnUrl.replace("/raw/upload/", "/image/upload/");
    }

    if (cdnUrl.includes("/image/upload/")) {
      const parts = cdnUrl.split("/image/upload/");
      const transformation = `pg_${page},f_jpg,w_${width},q_auto,c_limit/`;
      let rest = parts[1];
      // Strip any previous transformation if rest already had one
      rest = rest.replace(/^(?:pg_\d+[^/]*\/)+/i, "").replace(/^(?:f_auto,q_auto\/)+/i, "");
      // Clean duplicate .pdf.pdf if present
      rest = rest.replace(/\.pdf\.pdf(?=($|\?|#))/gi, ".pdf");
      // Replace .pdf with .jpg so the URL delivers an image format for browser <img> tags
      rest = rest.replace(/\.pdf(?=($|\?|#))/gi, ".jpg");
      return `${parts[0]}/image/upload/${transformation}${rest}`;
    }
  }

  if (isPdfFile(trimmed)) {
    return `/api/pdf-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Returns a robust viewer URL that guarantees inline browser rendering without 404s.
 * Direct Cloudinary URLs use the /image/upload/ pipeline which renders PDFs inline natively in browsers.
 */
export function getCloudinaryInlineViewerUrl(url?: string | null): string {
  if (!url) return "";
  const clean = normalizePdfUrl(url);

  if (isCloudinaryUrl(clean)) {
    let viewerUrl = clean;

    // ONLY PDFs support Cloudinary's /image/upload/ pipeline for inline browser viewing
    if (isPdfFile(clean)) {
      if (viewerUrl.includes("/raw/upload/")) {
        viewerUrl = viewerUrl.replace("/raw/upload/", "/image/upload/");
      }
      // Clean duplicate .pdf.pdf
      viewerUrl = viewerUrl.replace(/\.pdf\.pdf(?=($|\?|#))/gi, ".pdf");
      // Strip any image transformations (e.g. pg_1, f_jpg) so the actual full PDF is served
      viewerUrl = viewerUrl.replace(/\/image\/upload\/(?:(?:pg_\d+|f_\w+|w_\d+|c_\w+|q_\w+)[,/]*)+\//i, "/image/upload/");
    } else {
      // Non-PDF documents (.docx, .doc, .xlsx, .xls, .csv, .ppt, etc.) MUST remain in /raw/upload/
      if (viewerUrl.includes("/image/upload/")) {
        viewerUrl = viewerUrl.replace("/image/upload/", "/raw/upload/");
      }
    }
    return viewerUrl;
  }

  // Non-Cloudinary or internal PDFs route through Next.js pdf-proxy
  if (isPdfFile(clean)) {
    return getPdfProxyUrl(clean);
  }
  return clean;
}

export function getAbsoluteFileUrl(url?: string | null): string {
  if (!url) return "";
  const clean = getCloudinaryInlineViewerUrl(url);
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    const relativePath = clean.startsWith("/") ? clean : `/${clean}`;
    return `${window.location.origin}${relativePath}`;
  }
  return clean;
}

/**
 * Returns an embedded Google Docs / Office Online Viewer URL suitable for rendering inside an <iframe> or opening in new tab.
 */
export function getGoogleDocsViewerUrl(url?: string | null): string {
  if (!url) return "";
  const fullUrl = getAbsoluteFileUrl(url);
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
}

export function isWordFile(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lowercaseUrl = url.toLowerCase();
  const clean = lowercaseUrl.split("?")[0].split("#")[0];
  return (
    clean.endsWith(".doc") ||
    clean.endsWith(".docx") ||
    lowercaseUrl.includes(".doc") ||
    lowercaseUrl.includes(".docx") ||
    lowercaseUrl.includes("format=doc") ||
    lowercaseUrl.includes("format=docx") ||
    lowercaseUrl.includes("docs.google.com/document")
  );
}

export function isExcelFile(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lowercaseUrl = url.toLowerCase();
  const clean = lowercaseUrl.split("?")[0].split("#")[0];
  return (
    clean.endsWith(".xls") ||
    clean.endsWith(".xlsx") ||
    clean.endsWith(".csv") ||
    lowercaseUrl.includes(".xls") ||
    lowercaseUrl.includes(".xlsx") ||
    lowercaseUrl.includes(".csv") ||
    lowercaseUrl.includes("format=xls") ||
    lowercaseUrl.includes("format=xlsx") ||
    lowercaseUrl.includes("format=csv") ||
    lowercaseUrl.includes("docs.google.com/spreadsheets")
  );
}

export function isGoogleDocUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.toLowerCase().includes("docs.google.com/document");
}

export function isGoogleSheetUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.toLowerCase().includes("docs.google.com/spreadsheets");
}

export function getGoogleDocEmbedUrl(url?: string | null): string {
  if (!url) return "";
  if (isGoogleDocUrl(url)) {
    let clean = url.trim();
    if (clean.includes("/preview")) return clean;
    clean = clean.replace(/\/(edit|view|pub|mobilebasic).*$/i, "");
    clean = clean.replace(/\/$/, "");
    return `${clean}/preview`;
  }
  return getGoogleDocsViewerUrl(url);
}

export function getGoogleSheetEmbedUrl(url?: string | null): string {
  if (!url) return "";
  if (isGoogleSheetUrl(url)) {
    let clean = url.trim();
    if (clean.includes("/preview") || clean.includes("/pubhtml")) return clean;
    clean = clean.replace(/\/(edit|view|pub|pubhtml).*$/i, "");
    clean = clean.replace(/\/$/, "");
    return `${clean}/preview`;
  }
  return getGoogleDocsViewerUrl(url);
}

export function getOfficeViewerUrl(url?: string | null): string {
  if (!url) return "";
  const fullUrl = getAbsoluteFileUrl(url);
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
}

export function getDocumentViewerUrl(url?: string | null): string {
  if (!url) return "";
  if (isGoogleDocUrl(url)) return getGoogleDocEmbedUrl(url);
  if (isGoogleSheetUrl(url)) return getGoogleSheetEmbedUrl(url);
  // Google Docs Viewer reliably previews Word (.docx, .doc), Excel (.xlsx, .xls, .csv), and PPT
  // without Microsoft Office Online's strict "File not found" authentication blocks
  if (isWordFile(url) || isExcelFile(url)) {
    return getGoogleDocsViewerUrl(url);
  }
  return getGoogleDocsViewerUrl(url);
}


