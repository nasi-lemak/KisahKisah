/**
 * Countries, regions and the review platforms that matter in each of them.
 *
 * KisahKisah is Southeast-Asia-first, but any country can be added here.
 * Each country lists the platforms locals actually use to rate films; a film
 * from that country gets links to those platforms (searched by its original
 * title in its own script, which is how those sites index it).
 */

export type RegionId = "sea" | "east" | "south" | "world";

export const REGIONS: Record<RegionId, { name: string; blurb: string }> = {
  sea: { name: "Southeast Asia", blurb: "Nusantara, Indochina & the Philippine isles" },
  east: { name: "East Asia", blurb: "Korea, Japan, China, Hong Kong & Taiwan" },
  south: { name: "South Asia", blurb: "India and neighbours" },
  world: { name: "Rest of the world", blurb: "Everywhere else, lah" },
};

export type Country = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  region: RegionId;
  /** Review/rating platforms used locally (ids into PLATFORMS). */
  platforms: string[];
  /** ISO 4217 currency for cinema purchases. */
  currency: string;
  /** Roughly 1 point per ~USD 0.22 spent. Approximate on purpose. */
  pointsPerUnit: number;
  /** JustWatch locale path, if JustWatch operates there. */
  justwatch?: string;
};

export const COUNTRIES: Country[] = [
  // Southeast Asia
  { code: "MY", name: "Malaysia", flag: "🇲🇾", region: "sea", platforms: ["wiki-ms"], currency: "MYR", pointsPerUnit: 1, justwatch: "my" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", region: "sea", platforms: ["douban"], currency: "SGD", pointsPerUnit: 3.4, justwatch: "sg" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", region: "sea", platforms: ["wiki-id"], currency: "IDR", pointsPerUnit: 0.0003, justwatch: "id" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", region: "sea", platforms: ["wiki-th", "mydramalist"], currency: "THB", pointsPerUnit: 0.13, justwatch: "th" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", region: "sea", platforms: ["wiki-tl", "mydramalist"], currency: "PHP", pointsPerUnit: 0.08, justwatch: "ph" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", region: "sea", platforms: ["wiki-vi"], currency: "VND", pointsPerUnit: 0.00018, justwatch: "vn" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", region: "sea", platforms: [], currency: "USD", pointsPerUnit: 4.5 },
  { code: "LA", name: "Laos", flag: "🇱🇦", region: "sea", platforms: [], currency: "LAK", pointsPerUnit: 0.0002 },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", region: "sea", platforms: [], currency: "MMK", pointsPerUnit: 0.002 },
  { code: "BN", name: "Brunei", flag: "🇧🇳", region: "sea", platforms: ["wiki-ms"], currency: "BND", pointsPerUnit: 3.4 },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", region: "sea", platforms: [], currency: "USD", pointsPerUnit: 4.5 },
  // East Asia
  { code: "KR", name: "South Korea", flag: "🇰🇷", region: "east", platforms: ["watcha", "naver", "mydramalist"], currency: "KRW", pointsPerUnit: 0.0033, justwatch: "kr" },
  { code: "CN", name: "China", flag: "🇨🇳", region: "east", platforms: ["douban", "maoyan", "mydramalist"], currency: "CNY", pointsPerUnit: 0.62 },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", region: "east", platforms: ["douban", "mydramalist"], currency: "HKD", pointsPerUnit: 0.58, justwatch: "hk" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", region: "east", platforms: ["douban", "mydramalist"], currency: "TWD", pointsPerUnit: 0.14, justwatch: "tw" },
  { code: "JP", name: "Japan", flag: "🇯🇵", region: "east", platforms: ["filmarks", "eiga", "mydramalist"], currency: "JPY", pointsPerUnit: 0.03, justwatch: "jp" },
  // South Asia
  { code: "IN", name: "India", flag: "🇮🇳", region: "south", platforms: [], currency: "INR", pointsPerUnit: 0.054, justwatch: "in" },
  // World
  { code: "US", name: "United States", flag: "🇺🇸", region: "world", platforms: ["rottentomatoes"], currency: "USD", pointsPerUnit: 4.5, justwatch: "us" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "world", platforms: [], currency: "GBP", pointsPerUnit: 5.7, justwatch: "uk" },
  { code: "FR", name: "France", flag: "🇫🇷", region: "world", platforms: [], currency: "EUR", pointsPerUnit: 4.9, justwatch: "fr" },
];

export const COUNTRY_BY_CODE: Record<string, Country> = Object.assign(Object.create(null), Object.fromEntries(COUNTRIES.map((c) => [c.code, c])));

export function country(code: string | null | undefined): Country | undefined {
  return code ? COUNTRY_BY_CODE[code.toUpperCase()] : undefined;
}

export const SEA_CODES = COUNTRIES.filter((c) => c.region === "sea").map((c) => c.code);

export type FilmRef = { title: string; originalTitle?: string | null; year?: number | null };

export type Platform = {
  id: string;
  name: string;
  /** Short label shown on the chip, e.g. "豆瓣". */
  badge: string;
  color: string;
  /** Hostnames we recognise when a user pastes a link to their review. */
  hosts: string[];
  /** Use the film's original-script title when searching (local platforms). */
  useOriginalTitle: boolean;
  search: (q: string, film: FilmRef) => string;
};

const enc = encodeURIComponent;

export const PLATFORMS: Record<string, Platform> = {
  // --- Regional ---
  douban: {
    id: "douban", name: "Douban", badge: "豆瓣", color: "#2e963d", hosts: ["douban.com", "movie.douban.com", "m.douban.com"],
    useOriginalTitle: true, search: (q) => `https://search.douban.com/movie/subject_search?search_text=${enc(q)}`,
  },
  maoyan: {
    id: "maoyan", name: "Maoyan", badge: "猫眼", color: "#e54847", hosts: ["maoyan.com", "www.maoyan.com", "m.maoyan.com"],
    useOriginalTitle: true, search: (q) => `https://www.maoyan.com/query?kw=${enc(q)}`,
  },
  watcha: {
    id: "watcha", name: "Watcha Pedia", badge: "왓챠", color: "#ff2f6e", hosts: ["pedia.watcha.com", "watcha.com"],
    useOriginalTitle: true, search: (q) => `https://pedia.watcha.com/en-US/search?query=${enc(q)}`,
  },
  naver: {
    id: "naver", name: "Naver", badge: "네이버", color: "#03c75a", hosts: ["naver.com", "search.naver.com", "m.naver.com", "blog.naver.com"],
    useOriginalTitle: true, search: (q) => `https://search.naver.com/search.naver?query=${enc(`영화 ${q}`)}`,
  },
  filmarks: {
    id: "filmarks", name: "Filmarks", badge: "Filmarks", color: "#ffd400", hosts: ["filmarks.com"],
    useOriginalTitle: true, search: (q) => `https://filmarks.com/search/movies?q=${enc(q)}`,
  },
  eiga: {
    id: "eiga", name: "Eiga.com", badge: "映画.com", color: "#0068b7", hosts: ["eiga.com"],
    useOriginalTitle: true, search: (q) => `https://eiga.com/search/${enc(q)}/`,
  },
  mydramalist: {
    id: "mydramalist", name: "MyDramaList", badge: "MDL", color: "#1675b6", hosts: ["mydramalist.com"],
    useOriginalTitle: false, search: (q) => `https://mydramalist.com/search?q=${enc(q)}`,
  },
  "wiki-ms": {
    id: "wiki-ms", name: "Wikipedia Bahasa Melayu", badge: "Wiki BM", color: "#6b7280", hosts: ["ms.wikipedia.org"],
    useOriginalTitle: true, search: (q) => `https://ms.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  "wiki-id": {
    id: "wiki-id", name: "Wikipedia Bahasa Indonesia", badge: "Wiki ID", color: "#6b7280", hosts: ["id.wikipedia.org"],
    useOriginalTitle: true, search: (q) => `https://id.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  "wiki-th": {
    id: "wiki-th", name: "Wikipedia ภาษาไทย", badge: "Wiki TH", color: "#6b7280", hosts: ["th.wikipedia.org"],
    useOriginalTitle: true, search: (q) => `https://th.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  "wiki-tl": {
    id: "wiki-tl", name: "Wikipedia Tagalog", badge: "Wiki TL", color: "#6b7280", hosts: ["tl.wikipedia.org"],
    useOriginalTitle: true, search: (q) => `https://tl.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  "wiki-vi": {
    id: "wiki-vi", name: "Wikipedia Tiếng Việt", badge: "Wiki VI", color: "#6b7280", hosts: ["vi.wikipedia.org"],
    useOriginalTitle: true, search: (q) => `https://vi.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  // --- Global ---
  imdb: {
    id: "imdb", name: "IMDb", badge: "IMDb", color: "#f5c518", hosts: ["imdb.com", "www.imdb.com", "m.imdb.com"],
    useOriginalTitle: false, search: (q, f) => `https://www.imdb.com/find/?q=${enc(f.year ? `${q} ${f.year}` : q)}`,
  },
  letterboxd: {
    id: "letterboxd", name: "Letterboxd", badge: "LB", color: "#00e054", hosts: ["letterboxd.com", "boxd.it"],
    useOriginalTitle: false, search: (q) => `https://letterboxd.com/search/films/${enc(q)}/`,
  },
  tmdb: {
    id: "tmdb", name: "TMDB", badge: "TMDB", color: "#01b4e4", hosts: ["themoviedb.org", "www.themoviedb.org"],
    useOriginalTitle: false, search: (q) => `https://www.themoviedb.org/search?query=${enc(q)}`,
  },
  rottentomatoes: {
    id: "rottentomatoes", name: "Rotten Tomatoes", badge: "RT", color: "#fa320a", hosts: ["rottentomatoes.com", "www.rottentomatoes.com"],
    useOriginalTitle: false, search: (q) => `https://www.rottentomatoes.com/search?search=${enc(q)}`,
  },
};

export const GLOBAL_PLATFORMS = ["imdb", "letterboxd", "tmdb"];

export type PlatformLink = { id: string; name: string; badge: string; color: string; url: string; local: boolean };

/** Review-platform links for a film: local ones first, then global. */
export function platformLinksFor(film: FilmRef & { country: string }): PlatformLink[] {
  const c = country(film.country);
  const local = c?.platforms ?? [];
  const ids = [...local, ...GLOBAL_PLATFORMS.filter((g) => !local.includes(g))];
  return ids
    .map((id) => (Object.hasOwn(PLATFORMS, id) ? PLATFORMS[id] : undefined))
    .filter((p): p is Platform => !!p)
    .map((p) => {
      const q = p.useOriginalTitle && film.originalTitle ? film.originalTitle : film.title;
      return { id: p.id, name: p.name, badge: p.badge, color: p.color, url: p.search(q, film), local: local.includes(p.id) };
    });
}

/** "Where to watch" link localised to the viewer's home country. */
export function justWatchLink(title: string, viewerCountry?: string | null): string | null {
  const c = country(viewerCountry) ?? COUNTRY_BY_CODE.MY;
  if (!c.justwatch) return null;
  return `https://www.justwatch.com/${c.justwatch}/search?q=${enc(title)}`;
}

/** Identify which platform a pasted review URL belongs to. */
export function identifyPlatform(url: string): { id: string | null; name: string; color: string; badge: string } | null {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    host = u.hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const p of Object.values(PLATFORMS)) {
    if (p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return { id: p.id, name: p.name, color: p.color, badge: p.badge };
    }
  }
  const bare = host.replace(/^www\./, "");
  return { id: null, name: bare, color: "#6b7280", badge: bare.split(".")[0] };
}
