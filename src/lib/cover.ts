import { s3, BUCKET, deleteObject } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { isDiscogsImageUrl } from "@/lib/discogs";
import { MAX_COVER_BYTES, isCoverContentType, newCoverKey, sniffCoverContentType } from "@/lib/cover-key";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const FETCH_TIMEOUT_MS = 10_000;

async function readLimited(body: ReadableStream<Uint8Array>, maxBytes: number): Promise<Buffer> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Cover image too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/** Downloads a Discogs release image and stores it in the bucket under `<userId>/<uuid>.<ext>`. */
export async function downloadDiscogsCover(url: string, userId: string): Promise<string> {
  if (!isDiscogsImageUrl(url)) throw new Error("Not a Discogs image URL");

  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": process.env.DISCOGS_USER_AGENT ?? "VinylApp/1.0" },
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`Failed to fetch cover: ${res.status}`);

  const declaredType = res.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (!isCoverContentType(declaredType)) throw new Error(`Unsupported cover content type: ${declaredType}`);

  const declaredLength = Number(res.headers.get("content-length"));
  if (declaredLength > MAX_COVER_BYTES) throw new Error("Cover image too large");

  const buffer = await readLimited(res.body, MAX_COVER_BYTES);
  const contentType = sniffCoverContentType(buffer);
  if (!contentType) throw new Error("Cover is not a JPEG, PNG or WebP image");

  const key = newCoverKey(userId, contentType);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return key;
}

/**
 * Deletes cover objects that no record references anymore. Call this after the referencing
 * records were deleted or updated, so shared (legacy) keys are never removed from under another record.
 */
export async function deleteUnreferencedCovers(keys: (string | null | undefined)[]) {
  const unique = [...new Set(keys.filter((k): k is string => !!k))];
  if (unique.length === 0) return;

  const stillUsed = await prisma.record.findMany({
    where: { coverImage: { in: unique } },
    select: { coverImage: true },
    distinct: ["coverImage"],
  });
  const used = new Set(stillUsed.map((r) => r.coverImage));

  await Promise.all(
    unique
      .filter((key) => !used.has(key))
      .map((key) => deleteObject(key).catch((error) => console.error(`Failed to delete cover image: ${key}`, error))),
  );
}
