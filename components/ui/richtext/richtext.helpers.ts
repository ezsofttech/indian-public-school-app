import * as XLSX from "xlsx";
import {
  normalizePdfUrl,
  getCloudinaryPdfThumbnailUrl,
  getCloudinaryInlineViewerUrl,
  getCleanUrl,
  isGoogleDocUrl,
  isGoogleSheetUrl,
  getDocumentViewerUrl,
} from "@/lib/file-preview";

export function parseCsvTo2DArray(text: string): string[][] {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/);
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let delimiter = ",";
    if (line.includes("\t")) delimiter = "\t";
    else if (line.includes(";") && !line.includes(",")) delimiter = ";";

    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, "g");
    const row: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      const val = match[1] !== undefined ? match[1] : match[2];
      row.push(val ? val.trim() : "");
    }
    if (row.length > 0) {
      result.push(row);
    }
  }

  return result;
}

export function parseExcelArrayBufferTo2DArray(buffer: ArrayBuffer): string[][] {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false, defval: "" });
    return rawData
      .filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== ""))
      .map((row) => (Array.isArray(row) ? row : []).map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : "")));
  } catch (e) {
    console.error("Failed to parse excel ArrayBuffer:", e);
    return [];
  }
}

export function formatCellContent(val: string, colName = ""): string {
  const trimmed = (val || "").trim();
  if (!trimmed) return "&nbsp;";

  const lower = trimmed.toLowerCase();
  const lowerCol = colName.toLowerCase();

  if (/^https?:\/\//i.test(trimmed) || ((lowerCol.includes("link") || lowerCol.includes("url") || lowerCol.includes("request")) && trimmed !== "&nbsp;")) {
    const hrefUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return `<a href="${hrefUrl}" target="_blank" rel="noopener noreferrer" style="background: #1a5d9c !important; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(26,93,156,0.2); white-space: nowrap;">${trimmed.length > 25 ? "View Request &rarr;" : `${trimmed} &rarr;`}</a>`;
  }

  if (
    lower === "completed" ||
    lower === "done" ||
    lower === "paid" ||
    lower === "passed" ||
    lower === "approved" ||
    lower === "resolved" ||
    lower === "active" ||
    lower === "success"
  ) {
    return `<span style="background: #dcfce7 !important; color: #15803d !important; border: 1px solid #86efac; font-weight: 800; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(21,128,61,0.1);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#16a34a;"></span>${trimmed}</span>`;
  }

  if (
    lower === "pending" ||
    lower === "in progress" ||
    lower === "working" ||
    lower === "ongoing" ||
    lower === "medium" ||
    lower === "draft" ||
    lower === "waiting"
  ) {
    return `<span style="background: #fef3c7 !important; color: #b45309 !important; border: 1px solid #fde68a; font-weight: 800; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(180,83,9,0.1);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#d97706;"></span>${trimmed}</span>`;
  }

  if (
    lower === "high" ||
    lower === "urgent" ||
    lower === "stuck" ||
    lower === "failed" ||
    lower === "critical" ||
    lower === "overdue" ||
    lower === "error" ||
    lower === "rejected" ||
    lower === "blocker"
  ) {
    return `<span style="background: #ffe4e6 !important; color: #be123c !important; border: 1px solid #fecdd3; font-weight: 800; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(190,18,60,0.1);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#e11d48;"></span>${trimmed}</span>`;
  }

  if (
    lower === "low" ||
    lower === "normal" ||
    lower === "info" ||
    lower === "open"
  ) {
    return `<span style="background: #dbeafe !important; color: #1d4ed8 !important; border: 1px solid #bfdbfe; font-weight: 800; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 1px 3px rgba(29,78,216,0.1);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#2563eb;"></span>${trimmed}</span>`;
  }

  if (/^\d{1,2}:\d{2}\s*(am|pm)?$/i.test(trimmed) || /^\d{2,4}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(trimmed)) {
    return `<span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #475569 !important; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: nowrap;">${trimmed}</span>`;
  }

  return trimmed;
}

export function generateCustomTableHtml(data: {
  rows?: number;
  cols?: number;
  hasHeader?: boolean;
  zebra?: boolean;
  borderColor?: string;
  headerBg?: string;
  headerColor?: string;
  customData?: string[][];
}): string {
  const hasHeader = data.hasHeader !== false;
  const zebra = !!data.zebra;
  const borderColor = data.borderColor || "#cbd5e1";
  const headerBg = data.headerBg || "#102a4c";
  const headerColor = data.headerColor || "#ffffff";

  let grid: string[][] = [];
  if (data.customData && data.customData.length > 0) {
    grid = data.customData.filter((r) => Array.isArray(r) && r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));
  } else {
    const rCount = Math.max(1, Math.min(30, data.rows || 4));
    const cCount = Math.max(1, Math.min(15, data.cols || 4));

    grid = [];
    for (let r = 0; r < rCount; r++) {
      const row: string[] = [];
      for (let c = 0; c < cCount; c++) {
        if (r === 0 && hasHeader) {
          row.push(`Column Header ${c + 1}`);
        } else {
          row.push(`Row ${r} Item ${c + 1}`);
        }
      }
      grid.push(row);
    }
  }

  if (!grid || grid.length === 0) return "";

  const maxCols = Math.max(...grid.map((r) => r.length), 1);

  let headerRowIdx = -1;
  let maxNonEmptyInTop = 0;
  if (hasHeader) {
    for (let i = 0; i < Math.min(grid.length, 8); i++) {
      const count = grid[i].filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length;
      if (count > maxNonEmptyInTop && count >= 2) {
        maxNonEmptyInTop = count;
        headerRowIdx = i;
      }
    }
  }

  let outerHtml = `<div style="margin: 1.75rem 0; max-width: 100%; border-radius: 16px; border: 1px solid ${borderColor}; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04); background: #ffffff !important; overflow: hidden;">`;

  const processedRows = new Set<number>();

  if (headerRowIdx > 0) {
    for (let i = 0; i < headerRowIdx; i++) {
      if (processedRows.has(i)) continue;
      const row = grid[i];
      const nonEmpties = row.map((cell, idx) => ({ cell: String(cell || "").trim(), idx })).filter((item) => item.cell !== "");

      if (nonEmpties.length === 1) {
        const bannerTitle = nonEmpties[0].cell;
        outerHtml += `<div style="padding: 16px 24px; background: linear-gradient(135deg, ${headerBg}, #0f172a) !important; color: ${headerColor} !important; font-weight: 900; font-size: 1.15rem; text-align: center; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid rgba(255,255,255,0.15); text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${bannerTitle}</div>`;
        processedRows.add(i);
      } else if (i + 1 < headerRowIdx) {
        const nextRow = grid[i + 1];
        const nextNonEmpties = nextRow.filter((c) => c !== null && c !== undefined && String(c).trim() !== "");

        if (nonEmpties.length > 0 && nextNonEmpties.length > 0) {
          outerHtml += `<div style="display: flex; gap: 12px; flex-wrap: wrap; padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid ${borderColor};">`;
          nonEmpties.forEach((kpiItem) => {
            const label = kpiItem.cell;
            const val = String(nextRow[kpiItem.idx] || "").trim() || "0";
            outerHtml += `<div style="flex: 1; min-width: 140px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); border-left: 4px solid ${headerBg};">`;
            outerHtml += `<div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">${label}</div>`;
            outerHtml += `<div style="font-size: 1.35rem; font-weight: 900; color: #0f172a;">${val}</div>`;
            outerHtml += `</div>`;
          });
          outerHtml += `</div>`;
          processedRows.add(i);
          processedRows.add(i + 1);
        }
      }
    }
  }

  outerHtml += `<div style="overflow-x: auto;"><table style="width: 100%; min-width: 650px; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; font-family: inherit;">`;

  let columnHeaderNames: string[] = [];
  if (headerRowIdx >= 0) {
    const headerRow = grid[headerRowIdx];
    columnHeaderNames = headerRow.map((c) => String(c || "").trim());

    outerHtml += `<thead><tr style="background: linear-gradient(135deg, ${headerBg}, #1e293b) !important;">`;
    for (let c = 0; c < maxCols; c++) {
      const cellVal = (headerRow[c] || "").trim();
      const isFirstCol = c === 0;
      const isLastCol = c === maxCols - 1;
      outerHtml += `<th style="padding: 14px 18px; text-align: left; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: ${headerColor} !important; background-color: transparent !important; border-bottom: 2px solid rgba(255,255,255,0.15); border-right: ${isLastCol ? "none" : `1px solid rgba(255,255,255,0.08)`}; min-width: ${isFirstCol ? "60px" : "110px"}; white-space: nowrap;">${cellVal || "&nbsp;"}</th>`;
    }
    outerHtml += `</tr></thead>`;
  }

  outerHtml += `<tbody>`;
  const startRowIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  let bodyRowCounter = 0;

  for (let r = startRowIdx; r < grid.length; r++) {
    if (processedRows.has(r)) continue;

    const row = grid[r];
    const nonEmptyCells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "");

    const firstCellVal = String(row[0] || "").trim();
    const isExplicitBanner = nonEmptyCells.length === 1 && maxCols > 1 && (/^(=+|-{3,}|section:|category:|part\s+\d+|module\s+\d+)/i.test(firstCellVal));

    if (isExplicitBanner) {
      outerHtml += `<tr style="background-color: #f1f5f9 !important;">`;
      outerHtml += `<td colspan="${maxCols}" style="padding: 12px 18px; text-align: center; font-weight: 800; font-size: 0.9rem; letter-spacing: 0.03em; color: #1e293b !important; background-color: #f1f5f9 !important; border-bottom: 1px solid ${borderColor}; border-top: 1px solid ${borderColor};">${firstCellVal}</td>`;
      outerHtml += `</tr>`;
      continue;
    }

    bodyRowCounter++;
    const isEven = bodyRowCounter % 2 === 0;
    const rowBg = zebra && isEven ? "#f8fafc" : "#ffffff";
    const isLastRow = r === grid.length - 1;

    outerHtml += `<tr style="background-color: ${rowBg} !important;">`;
    for (let c = 0; c < maxCols; c++) {
      const cellVal = String(row[c] || "").trim();
      const colName = columnHeaderNames[c] || "";
      const isLastCol = c === maxCols - 1;

      let align = "left";
      if (/^\d+$/.test(cellVal) && cellVal.length <= 4) {
        align = "center";
      } else if (/^[₹$€£]?\s*[\d,]+(\.\d+)?%?$/.test(cellVal)) {
        align = "right";
      }

      const formattedHtml = formatCellContent(cellVal, colName);

      outerHtml += `<td style="padding: 12px 18px; text-align: ${align}; color: #334155 !important; background-color: ${rowBg} !important; border-bottom: ${isLastRow ? "none" : `1px solid ${borderColor}`}; border-right: ${isLastCol ? "none" : `1px solid ${borderColor}`}; min-width: ${c === 0 ? "60px" : "110px"}; line-height: 1.5;">${formattedHtml}</td>`;
    }
    outerHtml += `</tr>`;
  }

  outerHtml += `</tbody></table></div></div><p><br></p>`;
  return outerHtml;
}

export function generateWordCardHtml(data: {
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  theme?: "light" | "dark" | "banner" | "badge";
}): string {
  const isGDoc = isGoogleDocUrl(data.url);
  const docsViewerUrl = getDocumentViewerUrl(data.url);
  const cleanUrl = isGDoc ? data.url : (getCleanUrl(data.url) || data.url);
  const title = data.title?.trim() || (isGDoc ? "Google Document" : "Official Word Document");
  const subtitle = data.subtitle?.trim() || (isGDoc ? "Google Docs Document (Interactive Preview)" : "Word Document / Google Doc");
  const buttonText = data.buttonText?.trim() || (isGDoc ? "Open Google Doc" : "View Document");
  const theme = data.theme || "light";

  if (theme === "badge") {
    return `<a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #dbeafe !important; color: #1e40af !important; border: 1px solid #bfdbfe; font-weight: 700; padding: 0.55rem 1.25rem; border-radius: 9999px; font-size: 0.875rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin: 8px 0; box-shadow: 0 2px 6px rgba(30, 64, 175, 0.15);">${title} &rarr;</a><p><br></p>`;
  }

  if (theme === "banner") {
    return `<div style="margin: 16px 0; border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 20px; background: #ffffff !important; color: #0f172a !important; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06); flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: #dbeafe !important; color: #1d4ed8 !important; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; flex-shrink: 0;">${isGDoc ? "GDOC" : "DOCX"}</div>
        <div style="min-width: 0;">
          <div style="font-weight: 800; color: #0f172a !important; font-size: 0.95rem; line-height: 1.3; background: transparent !important;">${title}</div>
          <div style="font-size: 0.8rem; color: #64748b !important; margin-top: 2px;">${subtitle} &bull; Click to View / Open</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #1e40af !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(30, 64, 175, 0.25); white-space: nowrap;">${buttonText} &rarr;</a>
        ${!isGDoc ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #f1f5f9 !important; color: #334155 !important; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; white-space: nowrap;">Download File</a>` : ""}
      </div>
    </div><p><br></p>`;
  }

  if (theme === "dark") {
    return `<div style="margin: 20px 0; border: 1px solid #1e3a8a; border-radius: 20px; overflow: hidden; background: #0f172a !important; box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);">
      <div style="padding: 16px 22px; background: #1e293b !important; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #2563eb !important; color: #ffffff !important; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${isGDoc ? "Google Doc" : "Word Document"}</span>
          <span style="color: #f8fafc !important; font-weight: 700; font-size: 0.95rem;">${title}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #38bdf8 !important; color: #0f172a !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">${buttonText} &rarr;</a>
          ${!isGDoc ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #334155 !important; color: #f8fafc !important; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none;">Download</a>` : ""}
        </div>
      </div>
      <div style="padding: 16px 22px; background: #020617 !important; color: #94a3b8 !important; font-size: 0.85rem;">${subtitle}</div>
    </div><p><br></p>`;
  }

  return `<div style="margin: 20px 0; border: 1px solid #bfdbfe; border-radius: 20px; overflow: hidden; background: #ffffff !important; box-shadow: 0 4px 20px -4px rgba(30, 64, 175, 0.08);">
    <div style="padding: 16px 22px; background: #eff6ff !important; border-bottom: 1px solid #dbeafe; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: #2563eb !important; color: #ffffff !important; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.85rem;">${isGDoc ? "GDOC" : "DOC"}</div>
        <div>
          <div style="color: #1e3a8a !important; font-weight: 800; font-size: 1rem; background: transparent !important;">${title}</div>
          <div style="color: #64748b !important; font-size: 0.8rem; margin-top: 2px;">${subtitle}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #1d4ed8 !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(29, 78, 216, 0.25);">${buttonText} &rarr;</a>
        ${!isGDoc ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #ffffff !important; color: #1e3a8a !important; border: 1px solid #bfdbfe; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none;">Download</a>` : ""}
      </div>
    </div>
  </div><p><br></p>`;
}

export function generateExcelCardHtml(data: {
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  theme?: "light" | "dark" | "banner" | "badge";
}): string {
  const isGSheet = isGoogleSheetUrl(data.url);
  const docsViewerUrl = getDocumentViewerUrl(data.url);
  const cleanUrl = isGSheet ? data.url : (getCleanUrl(data.url) || data.url);
  const title = data.title?.trim() || (isGSheet ? "Google Spreadsheet" : "Official Excel Spreadsheet");
  const subtitle = data.subtitle?.trim() || (isGSheet ? "Google Sheets Spreadsheet (Interactive Preview)" : "Excel Worksheet / Google Sheet");
  const buttonText = data.buttonText?.trim() || (isGSheet ? "Open Google Sheet" : "View Spreadsheet");
  const theme = data.theme || "light";

  if (theme === "badge") {
    return `<a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #dcfce7 !important; color: #15803d !important; border: 1px solid #bbf7d0; font-weight: 700; padding: 0.55rem 1.25rem; border-radius: 9999px; font-size: 0.875rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin: 8px 0; box-shadow: 0 2px 6px rgba(21, 128, 61, 0.15);">${title} &rarr;</a><p><br></p>`;
  }

  if (theme === "banner") {
    return `<div style="margin: 16px 0; border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 20px; background: #ffffff !important; color: #0f172a !important; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06); flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: #dcfce7 !important; color: #15803d !important; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; flex-shrink: 0;">${isGSheet ? "SHEET" : "XLSX"}</div>
        <div style="min-width: 0;">
          <div style="font-weight: 800; color: #0f172a !important; font-size: 0.95rem; line-height: 1.3; background: transparent !important;">${title}</div>
          <div style="font-size: 0.8rem; color: #64748b !important; margin-top: 2px;">${subtitle} &bull; Click to View / Open</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #15803d !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(21, 128, 61, 0.25); white-space: nowrap;">${buttonText} &rarr;</a>
        ${!isGSheet ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #f1f5f9 !important; color: #334155 !important; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; white-space: nowrap;">Download Sheet</a>` : ""}
      </div>
    </div><p><br></p>`;
  }

  if (theme === "dark") {
    return `<div style="margin: 20px 0; border: 1px solid #166534; border-radius: 20px; overflow: hidden; background: #0f172a !important; box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);">
      <div style="padding: 16px 22px; background: #1e293b !important; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #16a34a !important; color: #ffffff !important; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">${isGSheet ? "Google Sheet" : "Excel Spreadsheet"}</span>
          <span style="color: #f8fafc !important; font-weight: 700; font-size: 0.95rem;">${title}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #4ade80 !important; color: #052e16 !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">${buttonText} &rarr;</a>
          ${!isGSheet ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #334155 !important; color: #f8fafc !important; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none;">Download</a>` : ""}
        </div>
      </div>
      <div style="padding: 16px 22px; background: #020617 !important; color: #94a3b8 !important; font-size: 0.85rem;">${subtitle}</div>
    </div><p><br></p>`;
  }

  return `<div style="margin: 20px 0; border: 1px solid #bbf7d0; border-radius: 20px; overflow: hidden; background: #ffffff !important; box-shadow: 0 4px 20px -4px rgba(21, 128, 61, 0.08);">
    <div style="padding: 16px 22px; background: #f0fdf4 !important; border-bottom: 1px solid #dcfce7; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: #16a34a !important; color: #ffffff !important; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.85rem;">${isGSheet ? "SHEET" : "XLS"}</div>
        <div>
          <div style="color: #14532d !important; font-weight: 800; font-size: 1rem; background: transparent !important;">${title}</div>
          <div style="color: #64748b !important; font-size: 0.8rem; margin-top: 2px;">${subtitle}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #15803d !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(21, 128, 61, 0.25);">${buttonText} &rarr;</a>
        ${!isGSheet ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: #ffffff !important; color: #14532d !important; border: 1px solid #bbf7d0; padding: 8px 14px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none;">Download</a>` : ""}
      </div>
    </div>
  </div><p><br></p>`;
}

export function generateWordEmbedHtml(data: {
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  height?: number;
}): string {
  const isGDoc = isGoogleDocUrl(data.url);
  const docsViewerUrl = getDocumentViewerUrl(data.url);
  const cleanUrl = isGDoc ? data.url : (getCleanUrl(data.url) || data.url);
  const title = data.title?.trim() || (isGDoc ? "Google Document View" : "Word Document Interactive Viewer");
  const subtitle = data.subtitle?.trim() || (isGDoc ? "Google Docs Live Interactive Document" : "Word Document (.docx / .doc)");
  const buttonText = data.buttonText?.trim() || "Open Fullscreen Viewer";
  const iframeHeight = data.height || 550;

  return `<div style="margin: 24px 0; border: 1px solid #93c5fd; border-radius: 20px; overflow: hidden; background: #0f172a !important; box-shadow: 0 10px 30px -5px rgba(30, 58, 138, 0.25);">
    <div style="padding: 14px 20px; background: #1e3a8a !important; border-bottom: 1px solid #2563eb; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: #3b82f6 !important; color: #ffffff !important; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; flex-shrink: 0;">${isGDoc ? "GDOC" : "DOCX"}</div>
        <div style="min-width: 0;">
          <div style="color: #ffffff !important; font-weight: 800; font-size: 0.95rem; line-height: 1.2; background: transparent !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
          <div style="color: #93c5fd !important; font-size: 0.75rem; margin-top: 2px;">${subtitle}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #ffffff !important; color: #1e3a8a !important; padding: 7px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); white-space: nowrap;">${buttonText} &rarr;</a>
        ${!isGDoc ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.15) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); padding: 7px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; text-decoration: none; white-space: nowrap;">Download File</a>` : ""}
      </div>
    </div>
    <div style="position: relative; width: 100%; height: ${iframeHeight}px; background: #ffffff !important;">
      <iframe src="${docsViewerUrl}" title="${title}" style="width: 100%; height: 100%; border: 0; display: block;" allowfullscreen="true"></iframe>
    </div>
  </div><p><br></p>`;
}

export function generateExcelEmbedHtml(data: {
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  height?: number;
}): string {
  const isGSheet = isGoogleSheetUrl(data.url);
  const docsViewerUrl = getDocumentViewerUrl(data.url);
  const cleanUrl = isGSheet ? data.url : (getCleanUrl(data.url) || data.url);
  const title = data.title?.trim() || (isGSheet ? "Google Spreadsheet View" : "Excel Spreadsheet Interactive Viewer");
  const subtitle = data.subtitle?.trim() || (isGSheet ? "Google Sheets Live Interactive Sheet" : "Excel Worksheet (.xlsx / .csv)");
  const buttonText = data.buttonText?.trim() || "Open Fullscreen View";
  const iframeHeight = data.height || 550;

  return `<div style="margin: 24px 0; border: 1px solid #86efac; border-radius: 20px; overflow: hidden; background: #0f172a !important; box-shadow: 0 10px 30px -5px rgba(20, 83, 45, 0.25);">
    <div style="padding: 14px 20px; background: #14532d !important; border-bottom: 1px solid #16a34a; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: #22c55e !important; color: #ffffff !important; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; flex-shrink: 0;">${isGSheet ? "SHEET" : "XLSX"}</div>
        <div style="min-width: 0;">
          <div style="color: #ffffff !important; font-weight: 800; font-size: 0.95rem; line-height: 1.2; background: transparent !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
          <div style="color: #bbf7d0 !important; font-size: 0.75rem; margin-top: 2px;">${subtitle}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <a href="${docsViewerUrl}" target="_blank" rel="noopener noreferrer" style="background: #ffffff !important; color: #14532d !important; padding: 7px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); white-space: nowrap;">${buttonText} &rarr;</a>
        ${!isGSheet ? `<a href="${cleanUrl}" download target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.15) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.3); padding: 7px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; text-decoration: none; white-space: nowrap;">Download Sheet</a>` : ""}
      </div>
    </div>
    <div style="position: relative; width: 100%; height: ${iframeHeight}px; background: #ffffff !important;">
      <iframe src="${docsViewerUrl}" title="${title}" style="width: 100%; height: 100%; border: 0; display: block;" allowfullscreen="true"></iframe>
    </div>
  </div><p><br></p>`;
}

export function generatePdfCardHtml(data: {
  url: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  theme?: "light" | "dark" | "banner" | "badge";
  maxHeight?: number;
}): string {
  const cleanUrl = normalizePdfUrl(data.url);
  const inlineUrl = getCloudinaryInlineViewerUrl(cleanUrl);
  const pdfPicUrl = getCloudinaryPdfThumbnailUrl(cleanUrl, 1, 1000);
  const title = data.title?.trim() || "Official PDF Document";
  const subtitle = data.subtitle?.trim() || "";
  const buttonText = data.buttonText?.trim() || "Open Document";
  const theme = data.theme || "light";
  const maxHeight = data.maxHeight || 420;

  if (theme === "badge") {
    return `<a href="${inlineUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fecaca; font-weight: 700; padding: 0.55rem 1.25rem; border-radius: 9999px; font-size: 0.875rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin: 8px 0; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.15);">${title} &rarr;</a><p><br></p>`;
  }

  if (theme === "banner") {
    return `<div style="margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px 20px; background: #ffffff !important; color: #0f172a !important; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06); flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 14px; min-width: 0;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: #fee2e2 !important; color: #dc2626 !important; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; flex-shrink: 0;">PDF</div>
        <div style="min-width: 0;">
          <div style="font-weight: 800; color: #0f172a !important; font-size: 0.95rem; line-height: 1.3; background: transparent !important;">${title}</div>
          ${subtitle ? `<div style="font-size: 0.8rem; color: #64748b !important; margin-top: 2px;">${subtitle}</div>` : `<div style="font-size: 0.75rem; color: #dc2626 !important; font-weight: 600; margin-top: 2px;">PDF Document &bull; Click to View / Download</div>`}
        </div>
      </div>
      <a href="${inlineUrl}" target="_blank" rel="noopener noreferrer" style="background: #1a5d9c !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(26, 93, 156, 0.25); white-space: nowrap;">${buttonText} &rarr;</a>
    </div><p><br></p>`;
  }

  if (theme === "dark") {
    return `<div style="margin: 20px 0; border: 1px solid #334155; border-radius: 20px; overflow: hidden; background: #0f172a !important; box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);">
      <div style="padding: 14px 20px; background: #1e293b !important; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #ef4444 !important; color: #ffffff !important; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">PDF Document</span>
          <span style="color: #f8fafc !important; font-weight: 700; font-size: 0.9rem;">${title}</span>
        </div>
        <a href="${inlineUrl}" target="_blank" rel="noopener noreferrer" style="background: #38bdf8 !important; color: #0f172a !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);">${buttonText} &rarr;</a>
      </div>
      ${subtitle ? `<div style="padding: 10px 20px; background: #020617 !important; color: #94a3b8 !important; font-size: 0.8rem; border-bottom: 1px solid #1e293b;">${subtitle}</div>` : ""}
      <div style="padding: 20px; text-align: center; background: #020617 !important; display: flex; justify-content: center; align-items: center;">
        <img src="${pdfPicUrl}" alt="${title}" style="max-height: ${maxHeight}px; width: auto; max-width: 100%; border-radius: 8px; border: 1px solid #334155; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.5); display: block; margin: 0 auto;" />
      </div>
    </div><p><br></p>`;
  }

  return `<div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background: #ffffff !important; box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.08);">
    <div style="padding: 14px 20px; background: #f8fafc !important; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">PDF Document</span>
        <span style="color: #0f172a !important; font-weight: 700; font-size: 0.9rem; background: transparent !important;">${title}</span>
      </div>
      <a href="${inlineUrl}" target="_blank" rel="noopener noreferrer" style="background: #1a5d9c !important; color: #ffffff !important; padding: 8px 18px; border-radius: 10px; font-size: 0.825rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(26, 93, 156, 0.25);">${buttonText} &rarr;</a>
    </div>
    ${subtitle ? `<div style="padding: 10px 20px; background: #ffffff !important; color: #64748b !important; font-size: 0.8rem; border-bottom: 1px solid #f1f5f9;">${subtitle}</div>` : ""}
    <div style="padding: 20px; text-align: center; background: #f1f5f9 !important; display: flex; justify-content: center; align-items: center;">
      <img src="${pdfPicUrl}" alt="${title}" style="max-height: ${maxHeight}px; width: auto; max-width: 100%; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.12); display: block; margin: 0 auto;" />
    </div>
  </div><p><br></p>`;
}

export function getComponentHtmlSnippet(type: string): string {
    switch (type) {
        case "customTable":
            return generateCustomTableHtml({ rows: 4, cols: 4, hasHeader: true, zebra: true });
        case "wordCard":
            return generateWordCardHtml({ url: "https://example.com/document.docx", title: "Official Word Document", theme: "light" });
        case "excelCard":
            return generateExcelCardHtml({ url: "https://example.com/spreadsheet.xlsx", title: "Official Excel Spreadsheet", theme: "light" });
        case "csvTable":
            return generateCustomTableHtml({ rows: 5, cols: 4, hasHeader: true, zebra: true, headerBg: "#059669" });
        case "ctaBanner":
            return `<section style="background: linear-gradient(135deg, #102a4c 0%, #1a5d9c 100%); color: #ffffff; padding: 2rem; border-radius: 1.25rem; margin-bottom: 2rem; box-shadow: 0 10px 20px -5px rgba(16,42,76,0.25);">
  <h3 style="font-size: 1.5rem; font-weight: 800; margin-top: 0; margin-bottom: 0.5rem; color: #ffffff;">Need Assistance or Have Questions?</h3>
  <p style="font-size: 1rem; color: #e2e8f0; margin-bottom: 1.25rem; line-height: 1.6;">Our admissions & administrative team is ready to guide you through every step of the process.</p>
  <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
    <a href="/contact" style="background-color: #f4bd4f; color: #102a4c; font-weight: 700; padding: 0.65rem 1.35rem; border-radius: 0.75rem; text-decoration: none; display: inline-block;">Contact Us Now &rarr;</a>
    <a href="/admission" style="background-color: rgba(255,255,255,0.15); color: #ffffff; font-weight: 700; padding: 0.65rem 1.35rem; border-radius: 0.75rem; text-decoration: none; display: inline-block;">Apply Online &rarr;</a>
  </div>
</section><p><br></p>`;
        case "quickLinksGrid":
            return `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 1.25rem; border-radius: 1rem;">
    <h4 style="font-size: 1.1rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Admissions 2026–27</h4>
    <p style="font-size: 0.875rem; color: #64748b; margin: 0 0 1rem 0;">Online application process and eligibility criteria.</p>
    <a href="/admission" style="color: #1a5d9c; font-weight: 700; text-decoration: none; font-size: 0.9rem;">Go to Admissions &rarr;</a>
  </div>
  <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 1.25rem; border-radius: 1rem;">
    <h4 style="font-size: 1.1rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Curriculum & Academics</h4>
    <p style="font-size: 0.875rem; color: #64748b; margin: 0 0 1rem 0;">CBSE syllabus, examination structure & faculty.</p>
    <a href="/academics" style="color: #1a5d9c; font-weight: 700; text-decoration: none; font-size: 0.9rem;">View Academics &rarr;</a>
  </div>
  <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 1.25rem; border-radius: 1rem;">
    <h4 style="font-size: 1.1rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Mandatory Disclosure</h4>
    <p style="font-size: 0.875rem; color: #64748b; margin: 0 0 1rem 0;">Official CBSE affiliation certificates & NOCs.</p>
    <a href="/mandatory-public-disclosure" style="color: #1a5d9c; font-weight: 700; text-decoration: none; font-size: 0.9rem;">View Disclosures &rarr;</a>
  </div>
</div><p><br></p>`;
        case "hero":
            return `<section style="background-color: #102a4c; color: #ffffff; padding: 2.5rem; border-radius: 1.5rem; margin-bottom: 2rem; box-shadow: 0 10px 25px -5px rgba(16,42,76,0.3);">
  <span style="background-color: rgba(255,255,255,0.15); color: #ffd983; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
    CBSE ADMISSIONS OPEN 2026–27
  </span>
  <h1 style="font-size: 2.5rem; font-weight: 800; margin-top: 1rem; margin-bottom: 0.75rem; line-height: 1.2; color: #ffffff;">
    Where Curiosity Meets Excellence
  </h1>
  <p style="font-size: 1.125rem; color: #e2e8f0; margin-bottom: 1.5rem; max-width: 42rem; line-height: 1.6;">
    Empowering young minds with knowledge, character, creativity and confidence for a global future.
  </p>
  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
    <a href="/about" style="background-color: #f4bd4f; color: #102a4c; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; display: inline-block;">Explore Our School &rarr;</a>
    <a href="/admission" style="background-color: rgba(255,255,255,0.15); color: #ffffff; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; display: inline-block;">Apply for Admission &rarr;</a>
  </div>
  <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.875rem; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 1rem;">
    <span>&#10003; CBSE Affiliated</span>
    <span>&#10003; Smart Classrooms</span>
    <span>&#10003; 100% Individual Care</span>
  </div>
</section><p><br></p>`;
        case "slider":
            return `<section style="position: relative; overflow: hidden; border-radius: 1.5rem; margin-bottom: 2rem; background-color: #0f172a;">
  <img src="" alt="Campus Banner" style="width: 100%; height: 360px; object-fit: cover; opacity: 0.85; display: block;" />
  <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; background: linear-gradient(transparent, rgba(15,23,42,0.95)); color: #ffffff;">
    <h2 style="font-size: 2rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #ffffff;">Modern Campus Infrastructure</h2>
    <p style="margin: 0; font-size: 1rem; color: #e2e8f0; max-width: 36rem;">State-of-the-art science labs, digital libraries, and world-class athletic facilities.</p>
  </div>
</section><p><br></p>`;
        case "features":
            return `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
  <div style="border: 1px solid #e2e8f0; background-color: #ffffff; padding: 1.5rem; border-radius: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="width: 48px; height: 48px; background-color: #eff6ff; color: #1a5d9c; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 1rem;"><i class="bi bi-mortarboard-fill"></i></div>
    <h3 style="font-size: 1.25rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Academic Rigour</h3>
    <p style="font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0;">Comprehensive CBSE curriculum designed for interactive learning, critical thinking, and competitive excellence.</p>
  </div>
  <div style="border: 1px solid #e2e8f0; background-color: #ffffff; padding: 1.5rem; border-radius: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="width: 48px; height: 48px; background-color: #f0fdf4; color: #166534; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 1rem;"><i class="bi bi-trophy-fill"></i></div>
    <h3 style="font-size: 1.25rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Sports & Co-Curricular</h3>
    <p style="font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0;">Nurturing physical stamina, sportsmanship, performing arts, and leadership skills in every student.</p>
  </div>
  <div style="border: 1px solid #e2e8f0; background-color: #ffffff; padding: 1.5rem; border-radius: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="width: 48px; height: 48px; background-color: #fffbeb; color: #b45309; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 1rem;"><i class="bi bi-shield-check"></i></div>
    <h3 style="font-size: 1.25rem; font-weight: 700; color: #102a4c; margin: 0 0 0.5rem 0;">Safe & Inclusive Campus</h3>
    <p style="font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0;">24/7 CCTV surveillance, GPS-enabled transport, and dedicated student counseling support.</p>
  </div>
</div><p><br></p>`;
        case "principal":
            return `<section style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 1.5rem; padding: 2rem; margin-bottom: 2rem; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
  <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80" alt="Principal Profile" style="width: 130px; height: 130px; border-radius: 1rem; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
  <div style="flex: 1; min-width: 240px;">
    <span style="color: #1a5d9c; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Principal's Welcome</span>
    <h3 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0.25rem 0 0.75rem 0;">Building Leaders of Tomorrow</h3>
    <p style="font-size: 0.95rem; color: #475569; line-height: 1.7; font-style: italic; margin: 0 0 1rem 0;">
      "Our promise is simple yet profound: to nurture every student's potential in a safe, inspiring environment where curiosity is celebrated every day."
    </p>
    <p style="font-weight: 700; color: #1e293b; margin: 0;">Dr. S. K. Sharma — <span style="font-weight: 400; color: #64748b;">Principal, Indian Public School</span></p>
  </div>
</section><p><br></p>`;
        case "stats":
            return `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; background-color: #102a4c; color: #ffffff; padding: 1.75rem; border-radius: 1.25rem; text-align: center;">
  <div>
    <div style="font-size: 2.25rem; font-weight: 900; color: #f4bd4f;">1500+</div>
    <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Active Students</div>
  </div>
  <div>
    <div style="font-size: 2.25rem; font-weight: 900; color: #f4bd4f;">85+</div>
    <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Expert Teachers</div>
  </div>
  <div>
    <div style="font-size: 2.25rem; font-weight: 900; color: #f4bd4f;">100%</div>
    <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">CBSE Board Result</div>
  </div>
  <div>
    <div style="font-size: 2.25rem; font-weight: 900; color: #f4bd4f;">25+</div>
    <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Years Experience</div>
  </div>
</div><p><br></p>`;
        case "contact":
            return `<div style="border: 1px solid #e2e8f0; background-color: #ffffff; padding: 1.75rem; border-radius: 1.25rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <h3 style="font-size: 1.35rem; font-weight: 800; color: #102a4c; margin: 0 0 1rem 0;">Get In Touch With Us</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; color: #334155; font-size: 0.95rem;">
    <div><strong><i class="bi bi-geo-alt-fill me-1 text-primary"></i> Address:</strong> Main Highway Road, IPS Campus, Knowledge City</div>
    <div><strong><i class="bi bi-telephone-fill me-1 text-primary"></i> Phone:</strong> +91 98765 43210 / 011-2345678</div>
    <div><strong><i class="bi bi-envelope-fill me-1 text-primary"></i> Email:</strong> info@indianpublicschool.edu.in</div>
    <div><strong><i class="bi bi-clock-fill me-1 text-primary"></i> Office Hours:</strong> Mon - Sat (8:00 AM - 4:00 PM)</div>
  </div>
</div><p><br></p>`;
        case "testimonials":
            return `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 1.25rem;">
    <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.5rem;">★★★★★</div>
    <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; font-style: italic; margin: 0 0 1rem 0;">"The teachers at Indian Public School genuinely care about each child. My daughter has blossomed into a confident public speaker."</p>
    <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">Ramesh Verma — <span style="font-weight: 400; color: #64748b;">Parent (Class V)</span></div>
  </div>
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 1.25rem;">
    <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.5rem;">★★★★★</div>
    <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; font-style: italic; margin: 0 0 1rem 0;">"State of the art labs and incredible sports facilities. IPS prepared me for top engineering college entrance exams!"</p>
    <div style="font-size: 0.875rem; font-weight: 700; color: #0f172a;">Ananya Roy — <span style="font-weight: 400; color: #64748b;">Alumni Batch 2024</span></div>
  </div>
</div><p><br></p>`;
        case "disclosureTable":
            return `<div style="margin-bottom: 2rem; overflow-x: auto;">
  <h3 style="font-size: 1.25rem; font-weight: 800; color: #102a4c; margin: 0 0 0.75rem 0;">Mandatory Public Disclosure Documents</h3>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 0.9rem;">
    <thead>
      <tr style="background-color: #102a4c; color: #ffffff;">
        <th style="padding: 10px 14px; text-align: left;">S.No</th>
        <th style="padding: 10px 14px; text-align: left;">Document / Information</th>
        <th style="padding: 10px 14px; text-align: center;">Download Link</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: bold;">1</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px;">CBSE Affiliation Grant Letter</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; text-align: center;"><a href="#" style="background: #1a5d9c; color: #fff; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: bold;">PDF View</a></td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: bold;">2</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px;">Society / Trust Registration Certificate</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; text-align: center;"><a href="#" style="background: #1a5d9c; color: #fff; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: bold;">PDF View</a></td>
      </tr>
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: bold;">3</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px;">No Objection Certificate (NOC)</td>
        <td style="border: 1px solid #cbd5e1; padding: 10px 14px; text-align: center;"><a href="#" style="background: #1a5d9c; color: #fff; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: bold;">PDF View</a></td>
      </tr>
    </tbody>
  </table>
</div><p><br></p>`;
        case "info":
            return `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; margin: 16px 0; color: #1e40af;"><strong><i class="bi bi-info-circle-fill me-1"></i> Notice:</strong> Type your notice or announcement details here.</div><p><br></p>`;
        case "success":
            return `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 18px; border-radius: 8px; margin: 16px 0; color: #166534;"><strong><i class="bi bi-check-circle-fill me-1"></i> Highlight:</strong> Type your positive achievement or update here.</div><p><br></p>`;
        case "warning":
            return `<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 16px 0; color: #92400e;"><strong><i class="bi bi-exclamation-triangle-fill me-1"></i> Alert:</strong> Type urgent notice or deadline alert here.</div><p><br></p>`;
        case "card":
            return `<div style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 20px; border-radius: 16px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><h3 style="margin-top:0; color:#0f172a;">Card Title</h3><p style="margin-bottom:0; color:#334155;">Type inside this rounded card container.</p></div><p><br></p>`;
        case "badge":
            return `<span style="background-color: #1a5d9c; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin: 0 4px;">Pill Badge</span> `;
        case "grid":
            return `<div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0;"><div style="flex: 1; min-width: 240px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;"><h4 style="margin-top:0; color:#0f172a;">Column 1 Title</h4><p style="margin-bottom:0; color:#475569;">Column 1 details...</p></div><div style="flex: 1; min-width: 240px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;"><h4 style="margin-top:0; color:#0f172a;">Column 2 Title</h4><p style="margin-bottom:0; color:#475569;">Column 2 details...</p></div></div><p><br></p>`;
        default:
            return "";
    }
}

