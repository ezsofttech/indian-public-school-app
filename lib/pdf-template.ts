/**
 * pdf-template.ts
 *
 * Standalone, lightweight, reusable HTML/CSS document template engine
 * for Indian Public School official documents, disclosures, and reports.
 *
 * Features:
 * - Exact site-matched header: Official Banner Logo + Divider + Aakash Partner Logo
 * - Right-aligned official school address and contact block
 * - Official statutory CBSE Affiliation & School Code metadata banner
 * - Elegant, styled tables with auto-zebra striping and section ribbons
 * - Native @media print styling with page-break-inside protection for pixel-perfect PDF export via Ctrl + P.
 */

export interface PdfTemplateRowCell {
  text: string;
  link?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
}

export type PdfTemplateRow = (string | number | PdfTemplateRowCell)[];

export interface PdfTemplateSection {
  title: string;
  badge?: string;
  description?: string;
  columns?: string[];
  rows?: PdfTemplateRow[];
}

export interface PdfTemplateData {
  title: string;
  subtitle?: string;
  docNumber?: string;
  date?: string;
  schoolName?: string;
  affiliationNo?: string;
  schoolCode?: string;
  trustName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  showSecondaryLogo?: boolean;
  sections: PdfTemplateSection[];
}

export function generatePdfHtmlTemplate(data: PdfTemplateData): string {
  const {
    title,
    docNumber,
    date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    schoolName = "INDIAN PUBLIC SCHOOL",
    affiliationNo = "1530152",
    schoolCode = "15389",
    trustName = "The K.S. Dalmia Education Trust",
    address = "Main Road, Near RMC, Khetrajpur, Sambalpur, Odisha - 768006",
    phone = "+91 8114320555",
    email = "info@indianpublicschool.in",
    website = "https://ips-web.ezsoftapp.in",
    logoUrl = "/assets/Settings/Logos/IPSLogo.png",
    // secondaryLogoUrl = "/assets/Settings/Logos/AakashFoundationLogo.png",
    // showSecondaryLogo = true,
    sections = [],
  } = data;

  const sectionsHtml = sections
    .map((sec, sIdx) => {
      const badge = sec.badge || String(sIdx + 1);
      const cols = sec.columns || ["Sr.", "Information / Subject", "Details / Information", "Document Link"];
      const rows = sec.rows || [];

      const colHeadersHtml = cols
        .map((col, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === cols.length - 1;
          const align = isFirst || isLast ? "center" : "left";
          const width = isFirst ? "48px" : isLast ? "130px" : idx === 1 ? "240px" : "auto";
          return `<th style="text-align:${align}; width:${width};">${col}</th>`;
        })
        .join("");

      const rowsHtml =
        rows.length === 0
          ? `<tr><td colspan="${cols.length}" style="text-align:center; color:#64748b; font-style:italic; padding:12px;">No records listed under this section.</td></tr>`
          : rows
            .map((row, rIdx) => {
              const isEven = rIdx % 2 === 1;
              const bg = isEven ? "#f8fafc" : "#ffffff";
              const cellsHtml = row
                .map((cell, cIdx) => {
                  const isFirst = cIdx === 0;
                  const isLast = cIdx === row.length - 1;
                  const align = isFirst || isLast ? "center" : "left";

                  if (typeof cell === "object" && cell !== null) {
                    const text = cell.text || "VIEW";
                    const boldStyle = cell.bold ? "font-weight:600;" : "";
                    if (cell.link) {
                      return `<td style="text-align:${align}; ${boldStyle}">
                          <a href="${cell.link}" target="_blank" class="doc-badge" rel="noopener noreferrer" title="View Document">
                            <i class="bi bi-file-earmark-text"></i> ${text} <i class="bi bi-box-arrow-up-right link-ico"></i>
                          </a>
                        </td>`;
                    }
                    return `<td style="text-align:${align}; ${boldStyle}">${text}</td>`;
                  }

                  const val = cell !== undefined && cell !== null && String(cell).trim() !== "" ? String(cell) : "--";
                  const isSubject = cIdx === 1;
                  const isDocAttached = isLast && val !== "--";

                  if (isDocAttached) {
                    const isUrl = /^(\/|https?:\/\/|blob:)/i.test(val);
                    if (isUrl) {
                      return `<td style="text-align:center;">
                          <a href="${val}" target="_blank" class="doc-badge" rel="noopener noreferrer" title="View Document">
                            <i class="bi bi-file-earmark-text"></i> VIEW <i class="bi bi-box-arrow-up-right link-ico"></i>
                          </a>
                        </td>`;
                    }
                    return `<td style="text-align:center;">
                        <span class="doc-badge"><i class="bi bi-file-earmark-text"></i> ${val}</span>
                      </td>`;
                  }

                  return `<td style="text-align:${align}; ${isSubject ? "font-weight:600; color:#102a4c;" : ""}">${val}</td>`;
                })
                .join("");

              return `<tr style="background:${bg};">${cellsHtml}</tr>`;
            })
            .join("");

      return `
        <div class="section-card">
          <div class="section-header">
            <div class="section-badge">${badge}</div>
            <div class="section-title">${sec.title}</div>
          </div>
          ${sec.description ? `<div class="section-desc">${sec.description}</div>` : ""}
          <table class="data-table">
            <thead>
              <tr>${colHeadersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/">
  <title>${title} - ${schoolName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 14mm 10mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      tr, .section-card {
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .sheet {
      background: #ffffff;
      max-width: 850px;
      margin: 0 auto;
      padding: 24px 28px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    @media print {
      .sheet {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
    /* Top Decorative Stripe */
    .top-bar-navy {
      height: 4px;
      background: #102a4c;
      width: 100%;
    }
    .top-bar-gold {
      height: 2px;
      background: #c49c38;
      width: 100%;
      margin-bottom: 14px;
    }
    /* Header layout */
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 12px;
    }
    .header-logos {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-shrink: 0;
    }
    .logo-main {
      height: 46px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .logo-divider {
      width: 1.5px;
      height: 38px;
      background: #cbd5e1;
      border-radius: 2px;
    }
    .logo-sec {
      height: 40px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .header-address {
      text-align: right;
      font-size: 10px;
      color: #334155;
      line-height: 1.5;
    }
    .header-address .tel {
      font-weight: 500;
      color: #1e293b;
    }
    .header-address .email {
      color: #1a5d9c;
      font-weight: 500;
    }
    .header-address .web {
      color: #102a4c;
      font-weight: 700;
    }
    /* Dividing rule */
    .divider-rule {
      position: relative;
      margin: 8px 0 14px;
    }
    .rule-gold {
      height: 2px;
      background: #c49c38;
    }
    .rule-navy {
      height: 1px;
      background: #102a4c;
      margin-top: 1.5px;
    }
    /* Title Banner */
    .title-banner {
      background: #102a4c;
      border-left: 4px solid #c49c38;
      border-radius: 6px;
      padding: 9px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      color: #ffffff;
    }
    .title-banner h1 {
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
      color: #ffffff;
    }
    .title-banner .meta {
      font-size: 10px;
      color: #dbeafe;
      font-weight: 500;
      white-space: nowrap;
    }
    .title-banner .meta span {
      color: #fde047;
      font-weight: 700;
    }
    /* Section Card */
    .section-card {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .section-header {
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-badge {
      background: #102a4c;
      color: #c49c38;
      font-size: 10px;
      font-weight: 800;
      width: 22px;
      height: 20px;
      border-radius: 4px;
      display: grid;
      place-items: center;
      line-height: 1;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #102a4c;
    }
    .section-desc {
      padding: 6px 12px;
      font-size: 10px;
      color: #64748b;
      background: #fafafa;
      border-bottom: 1px solid #f1f5f9;
    }
    /* Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .data-table th {
      background: #102a4c;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.4px;
      padding: 8px 10px;
      border-right: 1px solid #1a5d9c;
    }
    .data-table th:last-child {
      border-right: none;
    }
    .data-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: middle;
    }
    .data-table td:last-child {
      border-right: none;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .doc-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #eff6ff;
      color: #1a5d9c;
      border: 1px solid #93c5fd;
      border-radius: 9999px;
      padding: 3px 10px;
      font-size: 10px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .doc-badge i {
      font-size: 11px;
      line-height: 1;
    }
    a.doc-badge {
      cursor: pointer;
    }
    a.doc-badge:hover {
      background: #1a5d9c;
      color: #ffffff;
      border-color: #102a4c;
      box-shadow: 0 2px 5px rgba(26, 93, 156, 0.25);
    }
    .doc-badge .link-ico {
      font-size: 8.5px;
      opacity: 0.8;
      display: inline-block;
      transition: transform 0.15s;
    }
    a.doc-badge:hover .link-ico {
      transform: translate(1px, -1px);
    }
    @media print {
      .doc-badge {
        color: #1a5d9c !important;
        border: 1px solid #93c5fd !important;
        background: #eff6ff !important;
      }
    }
    /* Footer */
    .doc-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1.5px solid #c49c38;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }
    .doc-footer strong {
      color: #102a4c;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Top accent lines -->
    <div class="top-bar-navy"></div>
    <div class="top-bar-gold"></div>

    <!-- Header: Left Logos + Right Address -->
    <header class="header-container">
      <div class="header-logos">
        <img src="${logoUrl}" alt="${schoolName}" class="logo-main" onerror="this.style.display='none'" />
        ${/* Aakash / Secondary Partner Logo - Temporarily commented out (Preserved for easy restoration)
        showSecondaryLogo && secondaryLogoUrl
          ? `<div class="logo-divider"></div>
               <img src="${secondaryLogoUrl}" alt="Educational Partner" class="logo-sec" onerror="this.style.display='none'" />`
          : ""
        */ ""}
      </div>
      <div class="header-address">
        <div>${address}</div>
        <div class="tel">Tel: ${phone}</div>
        <div class="email">${email}</div>
        <div class="web">${website}</div>
      </div>
    </header>

    <!-- Dividing double rule -->
    <div class="divider-rule">
      <div class="rule-gold"></div>
      <div class="rule-navy"></div>
    </div>

    <!-- Document Title Banner -->
    <div class="title-banner">
      <h1>${title}</h1>
      <div class="meta">
        CBSE Affiliation: <span>${affiliationNo}</span> &nbsp;|&nbsp;
        School Code: <span>${schoolCode}</span> &nbsp;|&nbsp;
        As on: ${date}
      </div>
    </div>

    <!-- Body Sections & Tables -->
    <main>
      ${sectionsHtml}
    </main>

    <!-- Official Document Footer -->
    <footer class="doc-footer">
      <div><strong>${schoolName}</strong> &bull; Official Statutory Publication</div>
      <div>CBSE Affiliation No. <strong>${affiliationNo}</strong> &bull; School Code: <strong>${schoolCode}</strong></div>
      <div>Issued: ${date}</div>
    </footer>
  </div>
</body>
</html>`;
}

export interface DisclosureSectionItem {
  srNo?: number | string;
  title: string;
  detail?: string;
  view?: {
    url?: string;
    label?: string;
  } | null;
}

export interface DisclosureSectionData {
  sectionTitle?: string;
  isPublished?: boolean;
  items?: DisclosureSectionItem[];
}

/**
 * Convenience helper specifically for Mandatory Disclosure data structure.
 */
export function generateDisclosureHtmlTemplate(opts: {
  sections: DisclosureSectionData[];
  schoolName?: string;
  affiliationNo?: string;
  schoolCode?: string;
  pageTitle?: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  showSecondaryLogo?: boolean;
}): string {
  const {
    sections,
    schoolName = "INDIAN PUBLIC SCHOOL",
    affiliationNo = "1530152",
    schoolCode = "15389",
    pageTitle = "Mandatory Public Disclosure (Appendix - IX)",
    logoUrl = "/assets/Settings/Logos/IPSLogo.png",
    secondaryLogoUrl = "/assets/Settings/Logos/AakashFoundationLogo.png",
    showSecondaryLogo = true,
  } = opts;

  // Map disclosure sections into template section format
  const mappedSections: PdfTemplateSection[] = sections
    .filter((sec) => sec.isPublished !== false)
    .map((sec, idx) => ({
      title: sec.sectionTitle || `Section ${idx + 1}`,
      badge: String(idx + 1),
      columns: ["Sr.", "Information / Subject", "Details / Information", "Document Link"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows: (sec.items || []).map((row: any, rIdx: number) => {
        let rawUrl = row.view?.url ? String(row.view.url).trim() : "";
        const label = row.view?.label?.trim() || "VIEW";
        const docCell = rawUrl
          ? {
              text: label,
              link: rawUrl,
            }
          : "--";

        return [
          String(row.srNo ?? rIdx + 1),
          row.title || "",
          row.detail || "--",
          docCell,
        ];
      }),
    }));

  return generatePdfHtmlTemplate({
    title: pageTitle,
    schoolName,
    affiliationNo,
    schoolCode,
    logoUrl,
    secondaryLogoUrl,
    showSecondaryLogo,
    sections: mappedSections,
  });
}
