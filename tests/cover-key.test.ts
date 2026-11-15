// Run with: npx tsx --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedCoverKey,
  isCoverContentType,
  isOwnedCoverKey,
  newCoverKey,
  sniffCoverContentType,
} from "../src/lib/cover-key";
import { isDiscogsImageUrl } from "../src/lib/discogs";

const USER = "cmuser123";
const OTHER = "cmother456";

test("newCoverKey produces an owned key with the right extension", () => {
  const key = newCoverKey(USER, "image/webp");
  assert.match(key, /^cmuser123\/[0-9a-f-]{36}\.webp$/);
  assert.ok(isOwnedCoverKey(key, USER));
  assert.ok(!isOwnedCoverKey(key, OTHER));
});

test("isCoverContentType only allows jpeg, png and webp", () => {
  assert.ok(isCoverContentType("image/jpeg"));
  assert.ok(isCoverContentType("image/png"));
  assert.ok(isCoverContentType("image/webp"));
  assert.ok(!isCoverContentType("image/svg+xml"));
  assert.ok(!isCoverContentType("text/html"));
  assert.ok(!isCoverContentType("toString"));
});

test("isAllowedCoverKey", () => {
  const own = newCoverKey(USER, "image/jpeg");
  const foreign = newCoverKey(OTHER, "image/jpeg");
  assert.ok(isAllowedCoverKey(null, USER));
  assert.ok(isAllowedCoverKey(undefined, USER));
  assert.ok(isAllowedCoverKey(own, USER));
  assert.ok(!isAllowedCoverKey(foreign, USER));
  // Legacy keys only when unchanged
  assert.ok(isAllowedCoverKey("1712345678901.jpg", USER, "1712345678901.jpg"));
  assert.ok(!isAllowedCoverKey("1712345678901.jpg", USER, null));
  assert.ok(!isAllowedCoverKey(`${USER}/../x.jpg`, USER));
  assert.ok(!isAllowedCoverKey(`${USER}/${crypto.randomUUID()}.svg`, USER));
});

test("sniffCoverContentType", () => {
  assert.equal(sniffCoverContentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffCoverContentType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(sniffCoverContentType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffCoverContentType(new TextEncoder().encode("<svg xmlns=")), null);
  assert.equal(sniffCoverContentType(new Uint8Array([])), null);
});

test("isDiscogsImageUrl", () => {
  assert.ok(isDiscogsImageUrl("https://i.discogs.com/abc/rs:fit/g:sm/q:90/h:600/w:600/R-1.jpeg"));
  assert.ok(isDiscogsImageUrl("https://img.discogs.com/x.jpg"));
  assert.ok(!isDiscogsImageUrl("http://i.discogs.com/x.jpg"));
  assert.ok(!isDiscogsImageUrl("https://i.discogs.com:8443/x.jpg"));
  assert.ok(!isDiscogsImageUrl("https://user@i.discogs.com/x.jpg"));
  assert.ok(!isDiscogsImageUrl("https://i.discogs.com.evil.example/x.jpg"));
  assert.ok(!isDiscogsImageUrl("http://minio:9000/vinyl-covers/x"));
  assert.ok(!isDiscogsImageUrl("not a url"));
});
