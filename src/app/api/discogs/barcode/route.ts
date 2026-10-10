import { auth } from "@/lib/auth";
import { searchDiscogsBarcode } from "@/lib/discogs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") ?? "";

  try {
    const results = await searchDiscogsBarcode(code);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Discogs unavailable" }, { status: 502 });
  }
}
