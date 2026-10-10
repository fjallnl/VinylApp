import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ALLOWED_HOSTS = ["i.discogs.com", "img.discogs.com"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new NextResponse(null, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse(null, { status: 403 });
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "VinylApp/1.0 +https://github.com/bergsj/VinylApp" },
  });

  if (!res.ok) return new NextResponse(null, { status: res.status });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
