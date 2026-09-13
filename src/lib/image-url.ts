/**
 * Utility to normalize and transform image URLs from various popular hosts
 * (Normal websites, Google Images search, Google Drive, Dropbox, GitHub, Imgur, Unsplash, Wikimedia)
 * into direct embeddable image streams that render reliably inside <img> tags.
 */

export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  // Remove surrounding quotes, parentheses or angle brackets if pasted with <http...> or "http..."
  url = url.replace(/^[<"'(]+|[>"')]+$/g, "").trim();

  // 1. Google Images Search Result (e.g. user copied link from Google Images search)
  // Example: https://www.google.com/imgres?imgurl=https%3A%2F%2Fexample.com%2Fdiagram.png&imgrefurl=...
  if (url.includes("google.") && url.includes("/imgres")) {
    try {
      const parsed = new URL(url);
      const directImg = parsed.searchParams.get("imgurl");
      if (directImg) {
        return decodeURIComponent(directImg);
      }
    } catch {}
  }

  // 1b. Google Redirect Link (google.com/url?q=...)
  if (url.includes("google.") && url.includes("/url")) {
    try {
      const parsed = new URL(url);
      const target = parsed.searchParams.get("q") || parsed.searchParams.get("url");
      if (target) {
        return decodeURIComponent(target);
      }
    } catch {}
  }

  // 2. Google Drive Links:
  // - https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
  // - https://drive.google.com/file/d/1a2b3c4d5e/view
  // - https://drive.google.com/open?id=1a2b3c4d5e
  // - https://drive.google.com/uc?id=1a2b3c4d5e
  const gDriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gDriveFileMatch && gDriveFileMatch[1]) {
    const fileId = gDriveFileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  const gDriveIdParamMatch = url.match(/drive\.google\.com\/(?:open|uc)\?.*?(?:id|export=view&id)=([a-zA-Z0-9_-]+)/i);
  if (gDriveIdParamMatch && gDriveIdParamMatch[1]) {
    const fileId = gDriveIdParamMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 3. Google Docs / Drawings
  const gDocsDrawingMatch = url.match(/docs\.google\.com\/drawings\/d\/([a-zA-Z0-9_-]+)/i);
  if (gDocsDrawingMatch && gDocsDrawingMatch[1]) {
    return `https://docs.google.com/drawings/d/${gDocsDrawingMatch[1]}/export/png`;
  }

  // 4. Dropbox:
  // - https://www.dropbox.com/s/xyz/photo.png?dl=0
  if (url.includes("dropbox.com")) {
    return url
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("dropbox.com", "dl.dropboxusercontent.com")
      .replace(/[?&]dl=[01]/g, "");
  }

  // 5. GitHub Blobs:
  // - https://github.com/user/repo/blob/main/img.png -> https://raw.githubusercontent.com/user/repo/main/img.png
  const ghBlobMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i);
  if (ghBlobMatch) {
    const [, user, repo, branch, filePath] = ghBlobMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`;
  }

  // 6. Imgur:
  // - https://imgur.com/abc123 -> https://i.imgur.com/abc123.png
  const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)$/i);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.png`;
  }

  // 7. Postimages:
  if (url.includes("postimg.cc/") && !url.includes("i.postimg.cc")) {
    const postimgMatch = url.match(/postimg\.cc\/([a-zA-Z0-9]+)/i);
    if (postimgMatch && postimgMatch[1]) {
      return `https://i.postimg.cc/${postimgMatch[1]}/image.png`;
    }
  }

  // 8. Unsplash photo page link (e.g. https://unsplash.com/photos/a-man-standing-xyz)
  const unsplashMatch = url.match(/unsplash\.com\/photos\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9_-]{10,})/i);
  if (unsplashMatch && unsplashMatch[1]) {
    return `https://images.unsplash.com/photo-${unsplashMatch[1]}?w=1200&auto=format&fit=crop&q=80`;
  }

  return url;
}

/**
 * Returns alternative fallback URLs (including local proxy and CDN mirrors)
 * to guarantee images load even if the external host blocks cross-origin requests.
 */
export function getFallbackImageUrls(rawUrl: string): string[] {
  const fallbacks: string[] = [];
  if (!rawUrl) return fallbacks;

  const normalized = normalizeImageUrl(rawUrl);

  // If it's a Google Drive link, extract file ID and add uc?export=download/view fallbacks
  const gDriveMatch =
    rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    rawUrl.match(/drive\.google\.com\/(?:open|uc)\?.*?(?:id|export=view&id)=([a-zA-Z0-9_-]+)/i) ||
    rawUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);

  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    fallbacks.push(`https://lh3.googleusercontent.com/d/${fileId}=w1600`);
    fallbacks.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
    fallbacks.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`);
  }

  // Add backend image proxy fallback for any external HTTP/HTTPS URL
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    fallbacks.push(`/api/v1/image-proxy?url=${encodeURIComponent(normalized)}`);
  }

  return Array.from(new Set(fallbacks));
}

/**
 * Checks if a string is a raw image URL (e.g. ends with image extension or common image hosting pattern)
 */
export function isRawImageUrl(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  // Direct image extensions
  if (/\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)(\?.*)?$/i.test(trimmed)) {
    return true;
  }

  // Known image CDNs and hosts
  if (
    trimmed.includes("images.unsplash.com") ||
    trimmed.includes("cloudinary.com") ||
    trimmed.includes("imgur.com") ||
    trimmed.includes("i.postimg.cc") ||
    trimmed.includes("googleusercontent.com") ||
    trimmed.includes("drive.google.com") ||
    trimmed.includes("s3.amazonaws.com") ||
    trimmed.includes("i.redd.it") ||
    trimmed.includes("media.licdn.com") ||
    trimmed.includes("/uploads/")
  ) {
    return true;
  }

  return false;
}
