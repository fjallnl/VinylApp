import { auth } from "@/lib/auth";
import { getDiscogsRelease } from "@/lib/discogs";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const r = await getDiscogsRelease(Number(id));

    const primaryImage = r.images?.find((i) => i.type === "primary") ?? r.images?.[0];

    return NextResponse.json({
      title: r.title,
      artist: r.artists_sort,
      year: r.year,
      label: r.labels?.[0]?.name,
      catalogNumber: r.labels?.[0]?.catno,
      country: r.country,
      format: r.formats?.map((f) => [f.name, ...(f.descriptions ?? [])].join(" ")).join(", "),
      genre: [...(r.genres ?? []), ...(r.styles ?? [])].join(", "),
      coverUrl: primaryImage?.uri,
      tracks: r.tracklist?.map((t) => ({
        position: t.position,
        title: t.title,
        duration: t.duration,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "Discogs unavailable" }, { status: 502 });
  }
}
