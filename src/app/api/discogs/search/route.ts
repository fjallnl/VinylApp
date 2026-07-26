import { auth } from "@/lib/auth";
import { searchDiscogs } from "@/lib/discogs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  try {
    const results = await searchDiscogs(q);
    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        title: r.title,
        year: r.year,
        catalogNumber: r.catno,
        thumb: r.thumb,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "Discogs unavailable" }, { status: 502 });
  }
}
