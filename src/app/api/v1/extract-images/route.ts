export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/handler";
import { ok } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const rawUrl = body?.url?.trim();

  if (!rawUrl) {
    throw ApiError.badRequest("URL is required");
  }

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw ApiError.badRequest("Invalid URL protocol");
    }

    const res = await fetch(rawUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
      },
    });

    const contentType = res.headers.get("content-type") || "";

    // If it's already an image, return it directly
    if (contentType.startsWith("image/")) {
      return ok({
        title: "",
        mainImage: rawUrl,
        images: [rawUrl],
      });
    }

    const html = await res.text();

    // 1. Extract Page Title
    let title = "";
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/&[a-z0-9#]+;/gi, " ").trim();
      // Remove website branding suffix like " - DataFlair" or " | GeeksforGeeks"
      title = title.split(/ [-|–—] /)[0].trim();
    }

    const images: string[] = [];

    // 2. Extract OpenGraph Image
    const ogImageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const resolved = resolveUrl(ogImageMatch[1], rawUrl);
      if (resolved) images.push(resolved);
    }

    // 3. Extract Twitter Image
    const twitterImgMatch =
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+content=["'](.*?)["']\s+name=["']twitter:image["']/i);
    if (twitterImgMatch && twitterImgMatch[1]) {
      const resolved = resolveUrl(twitterImgMatch[1], rawUrl);
      if (resolved) images.push(resolved);
    }

    // 4. Extract <img> tags inside HTML
    const imgTagRegex = /<img\s+[^>]*src=["'](.*?)["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgTagRegex.exec(html)) !== null) {
      const src = match[1];
      if (src && !src.startsWith("data:") && !src.includes("gravatar") && !src.includes("tracking")) {
        const resolved = resolveUrl(src, rawUrl);
        // Filter out tiny icons and tracking pixels
        if (resolved && !isLikelyIcon(resolved)) {
          images.push(resolved);
        }
      }
    }

    // Deduplicate images
    const uniqueImages = Array.from(new Set(images));
    const mainImage = uniqueImages[0] || "";

    return ok({
      title,
      mainImage,
      images: uniqueImages.slice(0, 12),
    });
  } catch (err: any) {
    throw ApiError.badRequest(err?.message || "Failed to extract image from webpage");
  }
});

function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

function isLikelyIcon(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("favicon") ||
    lower.includes("logo") ||
    lower.includes("icon") ||
    lower.includes("pixel") ||
    lower.includes("avatar") ||
    lower.includes("badge") ||
    lower.endsWith(".ico")
  );
}
