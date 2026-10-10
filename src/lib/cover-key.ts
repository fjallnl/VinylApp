// Pure helpers for cover object keys and accepted image types (no Node/S3 imports).

export const COVER_CONTENT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type CoverContentType = keyof typeof COVER_CONTENT_TYPES;

export const MAX_COVER_BYTES = 10 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const OWNED_KEY_SUFFIX = new RegExp(`^${UUID}\\.(jpg|png|webp)$`);

export function isCoverContentType(type: string): type is CoverContentType {
  return Object.hasOwn(COVER_CONTENT_TYPES, type);
}

/** New-style key: `<userId>/<uuid>.<ext>`. Legacy keys (`<timestamp>.jpg`) are no longer generated. */
export function newCoverKey(userId: string, contentType: CoverContentType): string {
  return `${userId}/${crypto.randomUUID()}.${COVER_CONTENT_TYPES[contentType]}`;
}

export function isOwnedCoverKey(key: string, userId: string): boolean {
  const prefix = `${userId}/`;
  return key.startsWith(prefix) && OWNED_KEY_SUFFIX.test(key.slice(prefix.length));
}

/**
 * A record may only point at a cover the user uploaded themselves, or keep the key it already has
 * (which keeps legacy `<timestamp>.jpg` keys working).
 */
export function isAllowedCoverKey(key: string | null | undefined, userId: string, currentKey?: string | null): boolean {
  if (key == null) return true;
  if (currentKey != null && key === currentKey) return true;
  return isOwnedCoverKey(key, userId);
}

/** Detects the image type from magic bytes; returns null for anything that isn't JPEG, PNG or WebP. */
export function sniffCoverContentType(bytes: Uint8Array): CoverContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}
