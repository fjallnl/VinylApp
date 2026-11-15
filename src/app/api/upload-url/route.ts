import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/lib/s3";
import { MAX_COVER_BYTES, isCoverContentType, newCoverKey } from "@/lib/cover-key";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const size = Number(searchParams.get("size"));

  if (!type || !isCoverContentType(type)) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed" }, { status: 400 });
  }
  if (!Number.isInteger(size) || size <= 0) return NextResponse.json({ error: "Missing or invalid size" }, { status: 400 });
  if (size > MAX_COVER_BYTES) return NextResponse.json({ error: "Image is too large (max 10 MB)" }, { status: 400 });

  // The server picks the key so clients can't overwrite other objects in the bucket.
  const key = newCoverKey(session.user.id, type);
  const url = await getUploadUrl(key, type, size);
  return NextResponse.json({ url, key });
}
