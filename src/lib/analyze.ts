import "server-only";
import sharp, { type Metadata } from "sharp";
import { SPECS, validateAsset, type AssetMeta, type CheckResult, type UploadType } from "./asset-spec";

const ACCEPTED = new Set(["png", "webp", "gif", "jpeg"]);

/**
 * Inspect an upload, run the automatic checks, and produce a clean WebP
 * (metadata stripped, animation kept). Never trusts the file name or MIME type.
 */
export async function analyzeUpload(type: UploadType, input: Buffer): Promise<{ meta: AssetMeta; result: CheckResult; webp: Buffer | null }> {
  let raw: Metadata;
  try {
    raw = await sharp(input, { animated: true, limitInputPixels: 40_000_000 }).metadata();
  } catch {
    return {
      meta: { format: "unknown", width: 0, height: 0, bytes: input.length, hasAlpha: false, frames: 1 },
      result: { ok: false, checks: [{ label: "Readable image", pass: false, detail: "couldn't read this file as an image", level: "error" }] },
      webp: null,
    };
  }
  const format = raw.format ?? "unknown";
  const frames = raw.pages ?? 1;
  const width = raw.width ?? 0;
  const height = raw.pageHeight ?? raw.height ?? 0;
  const meta: AssetMeta = { format, width, height, bytes: input.length, hasAlpha: !!raw.hasAlpha, frames };

  if (!ACCEPTED.has(format)) {
    return { meta, result: validateAsset(type, meta), webp: null };
  }
  if (SPECS[type].avatarHole && width > 0 && height > 0) {
    // Check the centre (a square inside the avatar circle) is see-through on the first frame.
    const side = Math.floor(Math.min(width, height) * 0.5);
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .extract({ left: Math.floor((width - side) / 2), top: Math.floor((height - side) / 2), width: side, height: side })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let max = 0;
    for (let i = info.channels - 1; i < data.length; i += info.channels) if (data[i] > max) max = data[i];
    meta.holeAlphaMax = max;
  }
  const result = validateAsset(type, meta);
  const webp = result.ok
    ? await sharp(input, { animated: true, limitInputPixels: 40_000_000 }).webp({ quality: 92, alphaQuality: 100, effort: 4 }).toBuffer()
    : null;
  return { meta, result, webp };
}
