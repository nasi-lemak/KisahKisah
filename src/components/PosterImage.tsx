"use client";

import { useState } from "react";
import { posterUrl } from "@/lib/tmdb-core";

/** A real poster over the drawn one; if it fails to load, the drawn poster shows through. */
export function PosterImage({ path, size }: { path: string; size: "w185" | "w342" | "w780" }) {
  const [failed, setFailed] = useState(false);
  const src = posterUrl(path, size);
  if (!src || failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />;
}
