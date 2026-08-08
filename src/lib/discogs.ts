const BASE = "https://api.discogs.com";

function headers() {
  const h: Record<string, string> = {
    "User-Agent": process.env.DISCOGS_USER_AGENT ?? "VinylApp/1.0",
  };
  if (process.env.DISCOGS_TOKEN) {
    h["Authorization"] = `Discogs token=${process.env.DISCOGS_TOKEN}`;
  }
  return h;
}

export interface DiscogsRelease {
  id: number;
  title: string;
  artists_sort: string;
  year: number;
  labels: { name: string; catno: string }[];
  genres: string[];
  styles: string[];
  country: string;
  formats: { name: string; descriptions: string[] }[];
  images: { type: string; uri: string; uri150: string }[];
  tracklist: { position: string; title: string; duration: string }[];
  barcodes?: { type: string; value: string }[];
}

type DiscogsSearchOptions = {
  perPage?: number;
  enrichMissingThumbs?: boolean;
};

type DiscogsSearchResult = {
  id: number;
  title: string;
  year: string;
  label: string[];
  genre: string[];
  style: string[];
  country: string;
  thumb: string;
  cover_image: string;
  format: string[];
  catno?: string;
};

type DiscogsReleaseImageResponse = {
  images?: { type?: string; uri?: string; uri150?: string }[];
};

async function getReleaseThumb(id: number): Promise<string | null> {
  const res = await fetch(`${BASE}/releases/${id}`, {
    headers: headers(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const release = (await res.json()) as DiscogsReleaseImageResponse;
  const primaryImage = release.images?.find((image) => image.type === "primary") ?? release.images?.[0];
  return primaryImage?.uri150 ?? primaryImage?.uri ?? null;
}

export async function searchDiscogs(query: string, options?: DiscogsSearchOptions) {
  const perPage = options?.perPage ?? 10;
  const enrichMissingThumbs = options?.enrichMissingThumbs ?? true;
  const url = `${BASE}/database/search?q=${encodeURIComponent(query)}&type=release&format=Vinyl&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Discogs search failed: ${res.status}`);
  const data = await res.json();
  const results = data.results as DiscogsSearchResult[];

  if (!enrichMissingThumbs) return results;

  const missingThumbResults = results.filter((result) => !result.thumb);
  if (missingThumbResults.length === 0) return results;

  const thumbLookups = await Promise.allSettled(
    missingThumbResults.map(async (result) => ({ id: result.id, thumb: await getReleaseThumb(result.id) })),
  );

  const thumbById = new Map<number, string>();
  for (const lookup of thumbLookups) {
    if (lookup.status === "fulfilled" && lookup.value.thumb) {
      thumbById.set(lookup.value.id, lookup.value.thumb);
    }
  }

  return results.map((result) => ({
    ...result,
    thumb: result.thumb || thumbById.get(result.id) || "",
  }));
}

export async function searchDiscogsBarcode(barcode: string) {
  const url = `${BASE}/database/search?barcode=${encodeURIComponent(barcode)}&type=release&format=Vinyl&per_page=5`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Discogs barcode search failed: ${res.status}`);
  const data = await res.json();
  return data.results as { id: number; title: string; year: string; thumb: string }[];
}

export async function getDiscogsRelease(id: number): Promise<DiscogsRelease> {
  const res = await fetch(`${BASE}/releases/${id}`, {
    headers: headers(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Discogs release fetch failed: ${res.status}`);
  return res.json();
}
