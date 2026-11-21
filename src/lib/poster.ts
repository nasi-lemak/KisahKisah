/** Deterministic poster colours from a slug (shared by UI and link-preview images). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function posterHues(slug: string): [number, number] {
  const h = hash(slug);
  const hue = h % 360;
  return [hue, (hue + 35 + ((h >> 9) % 80)) % 360];
}

export function posterColors(slug: string): [string, string] {
  const [a, b] = posterHues(slug);
  return [`hsl(${a} 55% 32%)`, `hsl(${b} 65% 14%)`];
}

/** Same colours as hex (for renderers without hsl support). */
export function posterHex(slug: string): [string, string] {
  const [a, b] = posterHues(slug);
  return [hslToHex(a, 55, 32), hslToHex(b, 65, 14)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
