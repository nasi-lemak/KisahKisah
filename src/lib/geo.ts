import "server-only";
import { headers } from "next/headers";
import { currentUser } from "./auth";
import type { Audience } from "./events";

/**
 * Where is the viewer? Signed-in members: their home country (they chose it).
 * Everyone else: the country header set by the CDN/proxy in front of the app
 * (Cloudflare, Vercel, CloudFront…), configurable with GEO_HEADER.
 * Unknown viewers only see untargeted campaigns.
 */
const DEFAULT_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

export async function viewerCountry(): Promise<{ country: string | null; source: "profile" | "network" | null }> {
  const user = await currentUser();
  if (user?.home_country) return { country: user.home_country.toUpperCase(), source: "profile" };
  const h = await headers();
  const names = process.env.GEO_HEADER ? [process.env.GEO_HEADER.toLowerCase()] : DEFAULT_HEADERS;
  for (const n of names) {
    const v = h.get(n)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1") return { country: v, source: "network" };
  }
  return { country: null, source: null };
}

/** Staff see every campaign (with targeting badges); everyone else is filtered by country. */
export async function audience(): Promise<Audience> {
  const user = await currentUser();
  if (user && (user.role === "admin" || user.role === "staff")) return "all";
  return (await viewerCountry()).country;
}
