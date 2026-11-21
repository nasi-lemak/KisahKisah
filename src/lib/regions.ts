/**
 * Countries, regions and the review platforms that matter in each of them.
 *
 * KisahKisah puts Southeast Asia in the spotlight but is open to everyone.
 * Each country lists the platforms locals actually use to rate films; a film
 * from that country gets links to those platforms (searched by its original
 * title in its own script, which is how those sites index it).
 */

export type RegionId = "sea" | "east" | "south" | "europe" | "americas" | "mea" | "oceania";

/** Southeast Asia first, then everyone else. */
export const REGIONS: Record<RegionId, { name: string; blurb: string; icon: string }> = {
  sea: { name: "Southeast Asia", blurb: "Nusantara, Indochina & the Philippine isles", icon: "🌺" },
  east: { name: "East Asia", blurb: "Korea, Japan, China, Hong Kong & Taiwan", icon: "🏮" },
  south: { name: "South Asia", blurb: "India and neighbours", icon: "🪷" },
  europe: { name: "Europe", blurb: "From Cannes to Copenhagen", icon: "🏰" },
  americas: { name: "The Americas", blurb: "Hollywood, Mexico City, São Paulo & beyond", icon: "🌎" },
  mea: { name: "Middle East & Africa", blurb: "Tehran, Lagos, Cairo & more", icon: "🌍" },
  oceania: { name: "Oceania", blurb: "Australia, Aotearoa & the Pacific", icon: "🌊" },
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
  // Europe
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "europe", platforms: ["rottentomatoes", "metacritic"], currency: "GBP", pointsPerUnit: 5.7, justwatch: "uk" },
  { code: "FR", name: "France", flag: "🇫🇷", region: "europe", platforms: ["allocine", "senscritique"], currency: "EUR", pointsPerUnit: 4.9, justwatch: "fr" },
  { code: "DE", name: "Germany", flag: "🇩🇪", region: "europe", platforms: ["moviepilot", "wiki-de"], currency: "EUR", pointsPerUnit: 4.9, justwatch: "de" },
  { code: "ES", name: "Spain", flag: "🇪🇸", region: "europe", platforms: ["filmaffinity", "wiki-es"], currency: "EUR", pointsPerUnit: 4.9, justwatch: "es" },
  { code: "IT", name: "Italy", flag: "🇮🇹", region: "europe", platforms: ["wiki-it"], currency: "EUR", pointsPerUnit: 4.9, justwatch: "it" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", region: "europe", platforms: ["wiki-sv"], currency: "SEK", pointsPerUnit: 0.43, justwatch: "se" },
  // Americas
  { code: "US", name: "United States", flag: "🇺🇸", region: "americas", platforms: ["rottentomatoes", "metacritic"], currency: "USD", pointsPerUnit: 4.5, justwatch: "us" },
  { code: "CA", name: "Canada", flag: "🇨🇦", region: "americas", platforms: ["rottentomatoes"], currency: "CAD", pointsPerUnit: 3.3, justwatch: "ca" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", region: "americas", platforms: ["filmaffinity", "wiki-es"], currency: "MXN", pointsPerUnit: 0.25, justwatch: "mx" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", region: "americas", platforms: ["adorocinema", "wiki-pt"], currency: "BRL", pointsPerUnit: 0.8, justwatch: "br" },
  // Middle East & Africa
  { code: "IR", name: "Iran", flag: "🇮🇷", region: "mea", platforms: ["wiki-fa"], currency: "USD", pointsPerUnit: 4.5 },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", region: "mea", platforms: [], currency: "NGN", pointsPerUnit: 0.003 },
  // Oceania
  { code: "AU", name: "Australia", flag: "🇦🇺", region: "oceania", platforms: ["rottentomatoes"], currency: "AUD", pointsPerUnit: 3, justwatch: "au" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", region: "oceania", platforms: [], currency: "NZD", pointsPerUnit: 2.7, justwatch: "nz" },
];

export const COUNTRY_BY_CODE: Record<string, Country> = Object.assign(Object.create(null), Object.fromEntries(COUNTRIES.map((c) => [c.code, c])));

export function country(code: string | null | undefined): Country | undefined {
  return code ? COUNTRY_BY_CODE[code.toUpperCase()] : undefined;
}

export const SEA_CODES = COUNTRIES.filter((c) => c.region === "sea").map((c) => c.code);

export function regionOf(code: string): RegionId | undefined {
  return country(code)?.region;
}

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
  /** Rating scale, if the platform shows a score (10 = x/10, 5 = stars, 100 = % or /100). */
  scale?: 5 | 10 | 100;
  /** How to show the score: "/10", "★", "%" … */
  unit?: string;
  search: (q: string, film: FilmRef) => string;
};

const enc = encodeURIComponent;

const WIKI_LANGS: Record<string, string> = {
  ms: "Bahasa Melayu", id: "Bahasa Indonesia", th: "ภาษาไทย", tl: "Tagalog", vi: "Tiếng Việt",
  de: "Deutsch", es: "Español", it: "Italiano", sv: "Svenska", pt: "Português", fa: "فارسی",
};

const wikis: Record<string, Platform> = Object.fromEntries(
  Object.entries(WIKI_LANGS).map(([lang, label]) => [
    `wiki-${lang}`,
    {
      id: `wiki-${lang}`, name: `Wikipedia ${label}`, badge: `Wiki ${lang.toUpperCase()}`, color: "#6b7280",
      hosts: [`${lang}.wikipedia.org`], useOriginalTitle: true,
      search: (q: string) => `https://${lang}.wikipedia.org/w/index.php?search=${enc(q)}`,
    } satisfies Platform,
  ]),
);

export const PLATFORMS: Record<string, Platform> = {
  // --- Asia ---
  douban: {
    id: "douban", name: "Douban", badge: "豆瓣", color: "#2e963d", hosts: ["douban.com", "movie.douban.com", "m.douban.com"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://search.douban.com/movie/subject_search?search_text=${enc(q)}`,
  },
  maoyan: {
    id: "maoyan", name: "Maoyan", badge: "猫眼", color: "#e54847", hosts: ["maoyan.com", "www.maoyan.com", "m.maoyan.com"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://www.maoyan.com/query?kw=${enc(q)}`,
  },
  watcha: {
    id: "watcha", name: "Watcha Pedia", badge: "왓챠", color: "#ff2f6e", hosts: ["pedia.watcha.com", "watcha.com"], scale: 5, unit: "★",
    useOriginalTitle: true, search: (q) => `https://pedia.watcha.com/en-US/search?query=${enc(q)}`,
  },
  naver: {
    id: "naver", name: "Naver", badge: "네이버", color: "#03c75a", hosts: ["naver.com", "search.naver.com", "m.naver.com", "blog.naver.com"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://search.naver.com/search.naver?query=${enc(`영화 ${q}`)}`,
  },
  filmarks: {
    id: "filmarks", name: "Filmarks", badge: "Filmarks", color: "#ffd400", hosts: ["filmarks.com"], scale: 5, unit: "★",
    useOriginalTitle: true, search: (q) => `https://filmarks.com/search/movies?q=${enc(q)}`,
  },
  eiga: {
    id: "eiga", name: "Eiga.com", badge: "映画.com", color: "#0068b7", hosts: ["eiga.com"], scale: 5, unit: "★",
    useOriginalTitle: true, search: (q) => `https://eiga.com/search/${enc(q)}/`,
  },
  mydramalist: {
    id: "mydramalist", name: "MyDramaList", badge: "MDL", color: "#1675b6", hosts: ["mydramalist.com"], scale: 10, unit: "/10",
    useOriginalTitle: false, search: (q) => `https://mydramalist.com/search?q=${enc(q)}`,
  },
  // --- Europe & the Americas ---
  allocine: {
    id: "allocine", name: "AlloCiné", badge: "AlloCiné", color: "#fecc00", hosts: ["allocine.fr", "www.allocine.fr"], scale: 5, unit: "★",
    useOriginalTitle: true, search: (q) => `https://www.allocine.fr/rechercher/?q=${enc(q)}`,
  },
  senscritique: {
    id: "senscritique", name: "SensCritique", badge: "SC", color: "#11e26f", hosts: ["senscritique.com", "www.senscritique.com"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://www.senscritique.com/search?query=${enc(q)}`,
  },
  filmaffinity: {
    id: "filmaffinity", name: "FilmAffinity", badge: "FA", color: "#1c7bc0", hosts: ["filmaffinity.com", "www.filmaffinity.com"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://www.filmaffinity.com/es/search.php?stext=${enc(q)}`,
  },
  moviepilot: {
    id: "moviepilot", name: "Moviepilot", badge: "MP", color: "#f4645f", hosts: ["moviepilot.de", "www.moviepilot.de"], scale: 10, unit: "/10",
    useOriginalTitle: true, search: (q) => `https://www.moviepilot.de/suche?q=${enc(q)}`,
  },
  adorocinema: {
    id: "adorocinema", name: "AdoroCinema", badge: "Adoro", color: "#fecc00", hosts: ["adorocinema.com", "www.adorocinema.com"], scale: 5, unit: "★",
    useOriginalTitle: true, search: (q) => `https://www.adorocinema.com/pesquisar/?q=${enc(q)}`,
  },
  rottentomatoes: {
    id: "rottentomatoes", name: "Rotten Tomatoes", badge: "RT", color: "#fa320a", hosts: ["rottentomatoes.com", "www.rottentomatoes.com"], scale: 100, unit: "%",
    useOriginalTitle: false, search: (q) => `https://www.rottentomatoes.com/search?search=${enc(q)}`,
  },
  metacritic: {
    id: "metacritic", name: "Metacritic", badge: "MC", color: "#ffcc34", hosts: ["metacritic.com", "www.metacritic.com"], scale: 100, unit: "/100",
    useOriginalTitle: false, search: (q) => `https://www.metacritic.com/search/${enc(q)}/`,
  },
  // --- Global ---
  imdb: {
    id: "imdb", name: "IMDb", badge: "IMDb", color: "#f5c518", hosts: ["imdb.com", "www.imdb.com", "m.imdb.com"], scale: 10, unit: "/10",
    useOriginalTitle: false, search: (q, f) => `https://www.imdb.com/find/?q=${enc(f.year ? `${q} ${f.year}` : q)}`,
  },
  letterboxd: {
    id: "letterboxd", name: "Letterboxd", badge: "LB", color: "#00e054", hosts: ["letterboxd.com", "boxd.it"], scale: 5, unit: "★",
    useOriginalTitle: false, search: (q) => `https://letterboxd.com/search/films/${enc(q)}/`,
  },
  tmdb: {
    id: "tmdb", name: "TMDB", badge: "TMDB", color: "#01b4e4", hosts: ["themoviedb.org", "www.themoviedb.org"], scale: 10, unit: "/10",
    useOriginalTitle: false, search: (q) => `https://www.themoviedb.org/search?query=${enc(q)}`,
  },
  ...wikis,
};

export const GLOBAL_PLATFORMS = ["imdb", "letterboxd", "tmdb"];

export function platform(id: string): Platform | undefined {
  return Object.hasOwn(PLATFORMS, id) ? PLATFORMS[id] : undefined;
}

export type PlatformLink = { id: string; name: string; badge: string; color: string; url: string; local: boolean };

/** Review-platform links for a film: local ones first, then global. */
export function platformLinksFor(film: FilmRef & { country: string }): PlatformLink[] {
  const c = country(film.country);
  const local = c?.platforms ?? [];
  const ids = [...local, ...GLOBAL_PLATFORMS.filter((g) => !local.includes(g))];
  return ids
    .map((id) => platform(id))
    .filter((p): p is Platform => !!p)
    .map((p) => {
      const q = p.useOriginalTitle && film.originalTitle ? film.originalTitle : film.title;
      return { id: p.id, name: p.name, badge: p.badge, color: p.color, url: p.search(q, film), local: local.includes(p.id) };
    });
}

/** Platforms that show a score and are relevant for this film (local + global). */
export function scoringPlatformsFor(filmCountry: string): Platform[] {
  const local = country(filmCountry)?.platforms ?? [];
  const ids = [...local, ...GLOBAL_PLATFORMS.filter((g) => !local.includes(g))];
  return ids.map((id) => platform(id)).filter((p): p is Platform => !!p && !!p.scale);
}

/** Normalise any platform score to 0–100. */
export function normaliseScore(value: number, scale: number): number {
  return Math.max(0, Math.min(100, (value / scale) * 100));
}

/** "Where to watch" link localised to the viewer's home country. */
export function justWatchLink(title: string, viewerCountry?: string | null): string | null {
  const c = country(viewerCountry);
  const path = c?.justwatch ?? "us";
  return `https://www.justwatch.com/${path}/search?q=${enc(title)}`;
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
