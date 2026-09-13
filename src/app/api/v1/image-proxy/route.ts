export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    let resolvedUrl = targetUrl;
    const parsed = new URL(resolvedUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    let response = await fetch(resolvedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
    }

    let contentType = response.headers.get("content-type") || "";

    // If the URL returned HTML (e.g. user passed a blog post URL), extract og:image or first image
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const ogMatch =
        html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i) ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<img\s+[^>]*src=["']([^"']+\.(?:png|jpg|jpeg|webp|svg))[^"']*["']/i);

      if (ogMatch && ogMatch[1]) {
        try {
          resolvedUrl = new URL(ogMatch[1], targetUrl).href;
          response = await fetch(resolvedUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
          });
          contentType = response.headers.get("content-type") || "image/jpeg";
        } catch {}
      }
    }

    const finalContentType = contentType.startsWith("image/") ? contentType : "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": finalContentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new NextResponse(`Image proxy error: ${error?.message || "Unknown"}`, { status: 500 });
  }
}
