/** Locale negotiation and message formatting. Pure, tested. */

export const LOCALES = [
  { code: "en", name: "English", flag: "🌏" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
const CODES = LOCALES.map((l) => l.code) as readonly string[];

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && CODES.includes(x);
}

/** Pick the best supported locale from an Accept-Language header (q-values respected; "fil" counts as Filipino). */
export function negotiate(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const prefs = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((p) => p.tag && p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of prefs) {
    const base = tag.split("-")[0];
    const code = base === "fil" ? "tl" : base === "in" ? "id" : base;
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

/** "Hello {name}" + {name: "Aisyah"} → "Hello Aisyah". Unknown placeholders are left visible. */
export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
