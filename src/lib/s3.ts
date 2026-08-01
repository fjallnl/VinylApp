import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const endpoint = process.env.S3_ENDPOINT;
const isR2Endpoint = endpoint?.includes(".r2.cloudflarestorage.com") ?? false;
const forcePathStyle = parseBoolean(process.env.S3_FORCE_PATH_STYLE) ?? !isR2Endpoint;

export const s3 = new S3Client({
  endpoint,
  region: process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle,
  // AWS SDK v3 ≥ 3.400 adds x-amz-checksum-crc32 to every PUT by default.
  // Cloudflare R2 (and MinIO) reject these extra headers with SignatureDoesNotMatch.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_SUPPORTED",
});

export const BUCKET = process.env.S3_BUCKET ?? "vinyl-covers";

export function coverUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL}/${key}`;
}

export async function getUploadUrl(key: string, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

