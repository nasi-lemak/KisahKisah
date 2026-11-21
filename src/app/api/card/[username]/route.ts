import { NextResponse } from "next/server";
import { userByUsername } from "@/lib/auth";
import { cardData } from "@/lib/profile";

/** Mini profile card data for hover popouts. */
export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cardData(u), { headers: { "cache-control": "private, max-age=30" } });
}
