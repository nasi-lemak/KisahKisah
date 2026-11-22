import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { payloadSha256, signRequest } from "./s3-sign";

/**
 * Where uploaded artwork lives. Files are content-addressed, so a key never
 * changes meaning and can be cached forever.
 *
 * - Local disk (default): UPLOAD_DIR.
 * - S3-compatible (STORAGE=s3): AWS S3, Cloudflare R2, MinIO… via S3_BUCKET,
 *   S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and, for non-AWS, S3_ENDPOINT.
 */
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const KEY = /^[a-f0-9]{64}\.webp$/;

export function isAssetKey(key: string) {
  return KEY.test(key);
}

function s3() {
  if (process.env.STORAGE !== "s3") return null;
  const { S3_BUCKET: bucket, S3_REGION: region = "auto", S3_ACCESS_KEY_ID: id, S3_SECRET_ACCESS_KEY: secret, S3_ENDPOINT: endpoint, S3_PREFIX: prefix = "media/" } = process.env;
  if (!bucket || !id || !secret) throw new Error("STORAGE=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
  // Path-style for custom endpoints (R2, MinIO); virtual-hosted for AWS.
  const url = (key: string) => new URL(endpoint ? `${endpoint.replace(/\/$/, "")}/${bucket}/${prefix}${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${prefix}${key}`);
  return { url, region: endpoint && region === "auto" ? "auto" : region, id, secret };
}

async function s3Fetch(method: "GET" | "PUT" | "HEAD", key: string, body?: Buffer) {
  const c = s3()!;
  const url = c.url(key);
  const headers = signRequest({
    method, url, region: c.region, accessKeyId: c.id, secretAccessKey: c.secret,
    headers: body ? { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } : {},
    payloadHash: body ? payloadSha256(body) : undefined,
  });
  delete headers.host; // fetch sets it
  return fetch(url, { method, headers, body: body ? new Uint8Array(body) : undefined, signal: AbortSignal.timeout(15_000) });
}

export async function putAsset(buf: Buffer): Promise<string> {
  const key = `${createHash("sha256").update(buf).digest("hex")}.webp`;
  if (s3()) {
    if ((await s3Fetch("HEAD", key)).ok) return key;
    const res = await s3Fetch("PUT", key, buf);
    if (!res.ok) throw new Error(`Upload to storage failed (${res.status}).`);
    return key;
  }
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, key);
  try {
    await access(file);
  } catch {
    await writeFile(file, buf);
  }
  return key;
}

export async function getAsset(key: string): Promise<Buffer | null> {
  if (!isAssetKey(key)) return null;
  if (s3()) {
    const res = await s3Fetch("GET", key);
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  }
  try {
    return await readFile(path.join(DIR, key));
  } catch {
    return null;
  }
}

/** For the health check: can we reach storage? */
export async function storageHealthy(): Promise<boolean> {
  if (!s3()) {
    try {
      await mkdir(DIR, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
  try {
    const res = await s3Fetch("HEAD", "0".repeat(64) + ".webp");
    return res.status === 404 || res.ok; // 403 means bad credentials
  } catch {
    return false;
  }
}

export { mediaUrl } from "./custom-item-map";
