import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

/**
 * Where uploaded artwork lives. Local disk by default (UPLOAD_DIR). Files are
 * content-addressed, so a key never changes meaning and can be cached forever.
 * Swap this module for S3/R2 in production; nothing else needs to change.
 */
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const KEY = /^[a-f0-9]{64}\.webp$/;

export function isAssetKey(key: string) {
  return KEY.test(key);
}

export async function putAsset(buf: Buffer): Promise<string> {
  const key = `${createHash("sha256").update(buf).digest("hex")}.webp`;
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
  try {
    return await readFile(path.join(DIR, key));
  } catch {
    return null;
  }
}

export { mediaUrl } from "./custom-item-map";
