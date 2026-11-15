import { auth } from "@/lib/auth";
import { isDiscogsImageUrl } from "@/lib/discogs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new NextResponse(null, { status: 400 });

  if (!isDiscogsImageUrl(url)) {
    return new NextResponse(null, { status: 403 });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "error",
      headers: { "User-Agent": "VinylApp/1.0 +https://github.com/bergsj/VinylApp" },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  if (!res.ok) return new NextResponse(null, { status: res.status });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
