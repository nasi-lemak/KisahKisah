import { getAsset } from "@/lib/storage";

/** Serves uploaded artwork. Keys are content hashes, so responses are immutable. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const buf = await getAsset((await params).key);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
