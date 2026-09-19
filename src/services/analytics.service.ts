import { prisma } from "@/lib/prisma";

// Baseline seed count: starts at 0 so first view is 1
const INITIAL_BASELINE = 0;

// In-memory cache for ultra-fast response without hammering PostgreSQL on every request
interface CacheEntry {
  views: number;
  lastFetchedAt: number;
}
const memoryCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 15_000; // 15 seconds read cache

/**
 * Increment view count for a specific page in PostgreSQL.
 * Updates in-memory cache immediately and persists to PostgreSQL.
 */
export async function incrementPageView(page = "landing") {
  try {
    const record = await prisma.pageView.upsert({
      where: { page },
      update: {
        views: {
          increment: 1,
        },
      },
      create: {
        page,
        views: (memoryCache[page]?.views ?? INITIAL_BASELINE) + 1,
      },
    });

    // Update in-memory cache
    memoryCache[page] = {
      views: record.views,
      lastFetchedAt: Date.now(),
    };

    return { page: record.page, views: record.views };
  } catch (error) {
    console.warn("[Analytics] Database unavailable, using fallback counter:", error);
    const fallbackCount = (memoryCache[page]?.views ?? INITIAL_BASELINE) + 1;
    memoryCache[page] = {
      views: fallbackCount,
      lastFetchedAt: Date.now(),
    };
    return { page, views: fallbackCount };
  }
}

/**
 * Retrieve current view count with 15s in-memory caching to avoid redundant DB queries.
 */
export async function getPageView(page = "landing") {
  const cached = memoryCache[page];
  const now = Date.now();

  // If cached and within TTL (15s), return memory cache instantly
  if (cached && now - cached.lastFetchedAt < CACHE_TTL_MS) {
    return { page, views: cached.views };
  }

  try {
    const record = await prisma.pageView.findUnique({
      where: { page },
    });

    const views = record ? record.views : (cached?.views ?? INITIAL_BASELINE);
    memoryCache[page] = { views, lastFetchedAt: now };

    return { page, views };
  } catch (error) {
    console.warn("[Analytics] Database unavailable, using cached fallback:", error);
    return { page, views: cached?.views ?? INITIAL_BASELINE };
  }
}

