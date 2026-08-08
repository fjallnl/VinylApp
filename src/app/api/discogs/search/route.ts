import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitLimit, getRateLimitWindowMs } from "@/lib/rate-limit";
import { searchDiscogs } from "@/lib/discogs";
import { NextResponse } from "next/server";

type SearchPayload = {
  results: Array<{
    id: number;
    title: string;
    year: string;
    country: string;
    label: string;
    catalogNumber?: string | null;
    thumb: string;
  }>;
};

type CachedResponse = {
  expiresAt: number;
  payload: SearchPayload;
};

const SEARCH_LIMIT = getRateLimitLimit("DISCOGS_SEARCH_RATE_LIMIT", 20);
const SEARCH_WINDOW_MS = getRateLimitWindowMs("DISCOGS_SEARCH_RATE_LIMIT_WINDOW_SECONDS", 60);
const SEARCH_CACHE_TTL_MS = getRateLimitWindowMs("DISCOGS_SEARCH_CACHE_SECONDS", 90);

const globalForDiscogsSearch = globalThis as unknown as {
  discogsSearchCache?: Map<string, CachedResponse>;
};

const searchCache = globalForDiscogsSearch.discogsSearchCache ?? new Map<string, CachedResponse>();

if (!globalForDiscogsSearch.discogsSearchCache) {
  globalForDiscogsSearch.discogsSearchCache = searchCache;
}

function normalizeQuery(rawValue: string) {
  return rawValue.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = normalizeQuery(searchParams.get("q") ?? "");

  if (q.length < 3) return NextResponse.json({ results: [] });

  const userId = session.user.id;
  const rateLimit = checkRateLimit(`discogs-search:${userId}`, SEARCH_LIMIT, SEARCH_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many search requests", retryAfterSeconds: rateLimit.retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const now = Date.now();
  const cached = searchCache.get(q);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload);
  }

  try {
    const results = await searchDiscogs(q, { perPage: 5, enrichMissingThumbs: false });
    const payload = {
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        year: r.year,
        country: r.country,
        label: r.label?.[0] ?? "",
        catalogNumber: r.catno,
        thumb: r.thumb,
      })),
    };

    searchCache.set(q, { payload, expiresAt: now + SEARCH_CACHE_TTL_MS });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Discogs unavailable" }, { status: 502 });
  }
}
