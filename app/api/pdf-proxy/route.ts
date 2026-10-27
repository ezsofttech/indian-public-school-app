import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Extract full url parameter cleanly without truncating at unencoded '&'
  const fullReqUrl = request.url;
  const match = fullReqUrl.match(/[?&]url=([^&]+.*)/);
  let rawUrl = match ? decodeURIComponent(match[1]) : new URL(fullReqUrl).searchParams.get("url");

  if (!rawUrl || !rawUrl.trim()) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl = rawUrl.trim();

  // If relative URL, resolve against current origin
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    const origin = request.nextUrl.origin;
    targetUrl = `${origin}${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;
  }

  // Build list of candidate URLs to handle Cloudinary raw vs image path variations and double-extension fallbacks
  const candidatesSet = new Set<string>();
  candidatesSet.add(targetUrl);

  if (targetUrl.includes("res.cloudinary.com")) {
    const rawToImage = targetUrl.includes("/raw/upload/")
      ? targetUrl.replace("/raw/upload/", "/image/upload/")
      : targetUrl.replace("/image/upload/", "/raw/upload/");
    candidatesSet.add(rawToImage);

    // Support migration from old niefrrkx cloud to active dnw7mgysa cloud
    if (targetUrl.includes("niefrrkx")) {
      const dnwVariant = targetUrl.replace(/niefrrkx/g, "dnw7mgysa");
      candidatesSet.add(dnwVariant);
      candidatesSet.add(
        dnwVariant.includes("/raw/upload/")
          ? dnwVariant.replace("/raw/upload/", "/image/upload/")
          : dnwVariant.replace("/image/upload/", "/raw/upload/")
      );
    }

    // Handle double-extension or missing extension variants
    if (targetUrl.includes(".pdf.pdf")) {
      const single = targetUrl.replace(/\.pdf\.pdf/g, ".pdf");
      candidatesSet.add(single);
      candidatesSet.add(single.includes("/raw/upload/") ? single.replace("/raw/upload/", "/image/upload/") : single.replace("/image/upload/", "/raw/upload/"));
      if (single.includes("niefrrkx")) {
        const dnwSingle = single.replace(/niefrrkx/g, "dnw7mgysa");
        candidatesSet.add(dnwSingle);
        candidatesSet.add(dnwSingle.includes("/raw/upload/") ? dnwSingle.replace("/raw/upload/", "/image/upload/") : dnwSingle.replace("/image/upload/", "/raw/upload/"));
      }
    } else if (/\.pdf($|\?|#)/i.test(targetUrl)) {
      const double = targetUrl.replace(/\.pdf(?=($|\?|#))/i, ".pdf.pdf");
      candidatesSet.add(double);
      candidatesSet.add(double.includes("/raw/upload/") ? double.replace("/raw/upload/", "/image/upload/") : double.replace("/image/upload/", "/raw/upload/"));
    }

    const cleanTarget = targetUrl.split("?")[0].split("#")[0];
    const extMatch = cleanTarget.match(/\.([a-z0-9]+)$/i);
    if (!extMatch) {
      ["pdf", "xlsx", "xls", "csv", "docx", "doc"].forEach((ext) => {
        candidatesSet.add(`${targetUrl}.${ext}`);
        if (targetUrl.includes("/image/upload/")) {
          candidatesSet.add(targetUrl.replace("/image/upload/", "/raw/upload/") + `.${ext}`);
        } else if (targetUrl.includes("/raw/upload/")) {
          candidatesSet.add(targetUrl.replace("/raw/upload/", "/image/upload/") + `.${ext}`);
        }
      });
    }
  }

  const candidates = Array.from(candidatesSet);

  try {
    let res: Response | null = null;

    for (const urlToTry of candidates) {
      try {
        const r = await fetch(urlToTry, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (r.ok) {
          res = r;
          break;
        }
      } catch {
        // Try next candidate URL
      }
    }

    if (!res || !res.ok) {
      console.warn(`Document Proxy remote fetch failed for target: ${targetUrl}`);
      return new NextResponse(`Failed to fetch file from remote server: ${res ? res.status : 404}`, {
        status: res ? res.status : 404,
      });
    }

    const rawType = res.headers.get("content-type") || "application/octet-stream";
    const contentType = rawType.includes("text/html") ? "application/octet-stream" : rawType;
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Document Proxy Internal Error for target:", targetUrl, err);
    return new NextResponse(`Document Proxy Error: ${err?.message || err}`, { status: 500 });
  }
}
