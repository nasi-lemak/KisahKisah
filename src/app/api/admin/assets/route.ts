import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { analyzeUpload } from "@/lib/analyze";
import { putAsset, mediaUrl } from "@/lib/storage";
import { SPECS, type UploadType } from "@/lib/asset-spec";

const MAX_UPLOAD = 4_000_000;

/** Staff upload: runs the automatic checks and stores a clean WebP if they pass. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || (user.role !== "staff" && user.role !== "admin")) return NextResponse.json({ error: "Staff only" }, { status: 403 });
  const form = await req.formData();
  const type = String(form.get("type") ?? "") as UploadType;
  const file = form.get("file");
  if (!Object.hasOwn(SPECS, type)) return NextResponse.json({ error: "Unknown item type" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: `Files must be under ${MAX_UPLOAD / 1_000_000} MB` }, { status: 413 });

  const { meta, result, webp } = await analyzeUpload(type, Buffer.from(await file.arrayBuffer()));
  if (!webp) return NextResponse.json({ ok: false, meta, result });
  const key = await putAsset(webp);
  run(
    "INSERT OR IGNORE INTO assets (key, original_name, type, format, width, height, frames, bytes, checks, uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
    key, file.name.slice(0, 200), type, meta.format, meta.width, meta.height, meta.frames, meta.bytes, JSON.stringify(result), user.id,
  );
  return NextResponse.json({ ok: true, key, url: mediaUrl(key), meta, result });
}
