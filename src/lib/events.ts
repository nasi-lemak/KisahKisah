/**
 * Site events & sponsored campaigns (pure logic, no DB).
 *
 * House events follow the calendar: Space Opera Day on May 4, Halloween,
 * Lunar New Year, Hari Raya, Songkran, Mid-Autumn, Deepavali, national days…
 * Sponsored campaigns are the same shape plus a sponsor and a promoted
 * title, and are always labelled "Sponsored".
 *
 * During an occurrence, `offers` can be claimed free or bought for KP, and
 * logging matching titles earns a bonus. When it ends, the items are vaulted
 * until the next occurrence.
 */

export type DateRule =
  /** Same dates every year, "MM-DD". End may be before start (wraps into next year). */
  | { kind: "fixed"; start: string; end: string }
  /** Moves every year (lunar/Islamic calendars). Start date per year + duration. */
  | { kind: "dated"; starts: Record<number, string>; days: number }
  /** A one-off window with absolute dates. */
  | { kind: "once"; start: string; end: string };

export type Offer = { item: string; price: number };

export type Bonus = {
  label: string;
  points: number;
  /** Max bonus-earning logs per user per occurrence. */
  maxLogs: number;
  genres?: string[];
  countries?: string[];
  slugs?: string[];
};

export type PromoTitle = {
  title: string;
  tagline: string;
  motif: string;
  country: string;
  releaseDate: string;
  synopsis: string;
  /** If the title is already in the catalogue. */
  filmSlug?: string;
};

export type SiteEvent = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  kind: "house" | "sponsored";
  rule: DateRule;
  /** Gradient for banners and cards. */
  colors: [string, string];
  offers: Offer[];
  bonus?: Bonus;
  featured: string[]; // film slugs
  /** Countries this is especially for (shown as flags; still open to everyone). */
  spotlight?: string[];
  /** Targeting: only shown and claimable in these countries. Empty/undefined or "GLOBAL" = everywhere. */
  markets?: string[];
  sponsor?: { name: string; disclosure: string; url?: string };
  promo?: PromoTitle;
  /** Free text: what makes this event fun. */
  blurb: string;
  /** For "dated" rules: dates are estimates and should be confirmed each year. */
  approximate?: boolean;
  link?: { href: string; label: string };
};

// ── Dates (all YYYY-MM-DD, UTC) ────────────────────────────────────

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400_000);
}

export type Occurrence = { start: string; end: string };

/** The occurrence of `e` that starts in `year` (if any). */
export function occurrenceIn(e: SiteEvent, year: number): Occurrence | null {
  const r = e.rule;
  switch (r.kind) {
    case "fixed": {
      const start = `${year}-${r.start}`;
      const end = r.end >= r.start ? `${year}-${r.end}` : `${year + 1}-${r.end}`;
      return { start, end };
    }
    case "dated": {
      // Staff-confirmed dates (Admin → Events) win over the approximate dates in code.
      const o = DATE_OVERRIDES[e.id]?.[year];
      const s = o?.start ?? r.starts[year];
      return s ? { start: s, end: addDays(s, (o?.days ?? r.days) - 1) } : null;
    }
    case "once":
      return Number(r.start.slice(0, 4)) === year ? { start: r.start, end: r.end } : null;
  }
}

export function activeOccurrence(e: SiteEvent, date: string): Occurrence | null {
  const y = Number(date.slice(0, 4));
  for (const yr of [y - 1, y]) {
    const o = occurrenceIn(e, yr);
    if (o && o.start <= date && date <= o.end) return o;
  }
  return null;
}

export function nextOccurrence(e: SiteEvent, date: string): Occurrence | null {
  const y = Number(date.slice(0, 4));
  for (const yr of [y, y + 1, y + 2]) {
    const o = occurrenceIn(e, yr);
    if (o && o.start > date) return o;
  }
  return null;
}

// ── The calendar ───────────────────────────────────────────────────

const NATIONAL_DAYS: [string, string, string, string, string[]][] = [
  // [country, name, MM-DD, sticker-ish icon, colors]
  ["PH", "Araw ng Kalayaan", "06-12", "☀️", ["#0038a8", "#ce1126"]],
  ["SG", "National Day", "08-09", "🦁", ["#ef3340", "#f5f5f5"]],
  ["ID", "Hari Kemerdekaan", "08-17", "🦅", ["#ce1126", "#f5f5f5"]],
  ["MY", "Hari Merdeka", "08-31", "🐅", ["#010066", "#cc0001"]],
  ["VN", "Quốc khánh", "09-02", "⭐", ["#da251d", "#ffcd00"]],
];

/** A demo sponsored campaign that is always running, so the flow can be tried. */
function demoWindow(): { start: string; end: string } {
  const t = today();
  return { start: addDays(t, -3), end: addDays(t, 11) };
}

export function allEvents(): SiteEvent[] {
  return withExtras([...baseEvents(), ...EXTRA_EVENTS]);
}

function baseEvents(): SiteEvent[] {
  const demo = demoWindow();
  return [
    {
      id: "orbit-of-the-hornbill", kind: "sponsored", name: "Orbit of the Hornbill", icon: "🌕",
      tagline: "In cinemas soon. Claim the limited theme, frame & stickers.",
      rule: { kind: "once", ...demo }, colors: ["#ff9f1c", "#1c261a"],
      sponsor: { name: "Kenyalang Pictures (demo sponsor)", disclosure: "Sponsored · demo campaign with a fictional film and studio" },
      promo: {
        title: "Orbit of the Hornbill", tagline: "One village. One satellite. One very stubborn bird.", motif: "🛰️", country: "MY",
        releaseDate: addDays(demo.start, 10),
        synopsis: "When a Sarawak schoolgirl's homemade satellite actually reaches orbit, a rhinoceros hornbill decides it's coming too.",
      },
      offers: [{ item: "st_hornbill", price: 0 }, { item: "st_feather", price: 0 }, { item: "th_hornbill", price: 0 }, { item: "fr_hornbill", price: 150 }],
      bonus: { label: "Log a Malaysian title", points: 15, maxLogs: 3, countries: ["MY"] },
      featured: ["ola-bola-2016", "the-journey-2014", "abang-adik-2023", "tiger-stripes-2023"],
      spotlight: ["MY", "SG", "BN"],
      blurb: "A sample of a sponsored launch: a limited theme and stickers claimable free, a premium frame for KP, a Malaysian-cinema bonus, and a featured row. Everything disappears when the campaign ends.",
    },
    {
      id: "lunar-new-year", kind: "house", name: "Lunar New Year", icon: "🧧", tagline: "Gong xi fa cai! Chúc mừng năm mới! 새해 복 많이 받으세요!",
      rule: { kind: "dated", starts: { 2026: "2026-02-17", 2027: "2027-02-06", 2028: "2028-01-26" }, days: 15 }, approximate: true,
      colors: ["#c1121f", "#ffd23f"],
      offers: [{ item: "st_angpao", price: 0 }, { item: "st_dragon", price: 0 }, { item: "st_mandarin", price: 0 }, { item: "th_angpao", price: 120 }],
      bonus: { label: "Log a family film", points: 15, maxLogs: 3, genres: ["Family"] },
      featured: ["hi-mom-2021", "how-to-make-millions-2024", "dad-im-sorry-2021", "yi-yi-2000"], spotlight: ["CN", "HK", "TW", "SG", "MY", "VN", "KR"],
      blurb: "Fifteen days of reunion dinners, festive box office and family films. Tết and Seollal too.",
    },
    {
      id: "valentines", kind: "house", name: "Valentine's Week", icon: "💌", tagline: "Fall in love at the movies.",
      rule: { kind: "fixed", start: "02-10", end: "02-14" }, colors: ["#e63973", "#ffb3c6"],
      offers: [], bonus: { label: "Log a romance", points: 10, maxLogs: 3, genres: ["Romance"] },
      featured: ["in-the-mood-for-love-2000", "decision-to-leave-2022", "hello-love-goodbye-2019", "crash-landing-on-you-2019"],
      blurb: "Romance bonus all week. Slow-burn, rom-com or heartbreak: your call.",
    },
    {
      id: "hari-raya", kind: "house", name: "Hari Raya Aidilfitri", icon: "🌙", tagline: "Selamat Hari Raya, maaf zahir dan batin.",
      rule: { kind: "dated", starts: { 2026: "2026-03-20", 2027: "2027-03-10", 2028: "2028-02-27" }, days: 7 }, approximate: true,
      colors: ["#0b6e4f", "#e6c35c"],
      offers: [{ item: "st_crescent", price: 0 }, { item: "st_pelita", price: 0 }, { item: "th_raya", price: 120 }],
      bonus: { label: "Log a Southeast Asian title", points: 15, maxLogs: 3, countries: ["MY", "ID", "BN", "SG", "TH", "PH", "VN", "KH", "LA", "MM", "TL"] },
      featured: ["mat-kilau-2022", "ola-bola-2016", "upin-ipin-keris-siamang-tunggal-2019", "agak-laen-2024"], spotlight: ["MY", "ID", "BN", "SG"],
      blurb: "Balik kampung, ketupat and the big Raya movie releases.",
    },
    {
      id: "songkran", kind: "house", name: "Songkran", icon: "💦", tagline: "Sawasdee pee mai! The water fight is on.",
      rule: { kind: "fixed", start: "04-13", end: "04-15" }, colors: ["#00b4d8", "#ff7eb6"],
      offers: [{ item: "st_water", price: 0 }, { item: "st_watergun", price: 0 }, { item: "th_songkran", price: 120 }],
      bonus: { label: "Log a Thai title", points: 15, maxLogs: 3, countries: ["TH"] },
      featured: ["bad-genius-2017", "pee-mak-2013", "how-to-make-millions-2024", "girl-from-nowhere-2018"], spotlight: ["TH", "LA", "KH", "MM"],
      blurb: "Thai New Year. Also celebrated in Laos, Cambodia and Myanmar.",
    },
    {
      id: "space-opera-day", kind: "house", name: "Space Opera Day", icon: "🚀", tagline: "May 4th: galaxies far, far away and very close by.",
      rule: { kind: "fixed", start: "05-04", end: "05-05" }, colors: ["#05070f", "#ffe81f"],
      offers: [{ item: "st_rocket", price: 0 }, { item: "st_galaxy", price: 0 }, { item: "st_robot", price: 0 }, { item: "th_hyperspace", price: 0 }, { item: "ns_hyperspace", price: 0 }, { item: "ef_hyperspace", price: 250 }, { item: "fr_lightspeed", price: 300 }],
      bonus: { label: "Log a sci-fi title", points: 20, maxLogs: 3, genres: ["Sci-Fi"] },
      featured: ["star-wars-1977", "the-wandering-earth-2019", "everything-everywhere-2022", "the-long-walk-2019"],
      blurb: "The fan holiday for galaxies far, far away and very close by. Sci-fi from Hollywood to Beijing to Vientiane.",
    },
    ...NATIONAL_DAYS.map(([cc, name, date, icon, colors]): SiteEvent => ({
      id: `national-day-${cc.toLowerCase()}`, kind: "house", name: `${name}`, icon, tagline: `Celebrate cinema from ${cc === "PH" ? "the Philippines" : { SG: "Singapore", ID: "Indonesia", MY: "Malaysia", VN: "Vietnam" }[cc]}.`,
      rule: { kind: "fixed", start: date, end: date }, colors: [colors[0], colors[1]], offers: [],
      bonus: { label: "Log a local title", points: 20, maxLogs: 5, countries: [cc] }, featured: [], spotlight: [cc],
      blurb: "Double down on the national cinema: bonus KP for every local title you log today.",
      link: { href: `/films?country=${cc}`, label: "Browse local titles" },
    })),
    {
      id: "mid-autumn", kind: "house", name: "Mid-Autumn Festival", icon: "🥮", tagline: "Mooncakes, lanterns and moonlit movies.",
      rule: { kind: "dated", starts: { 2026: "2026-09-25", 2027: "2027-09-15", 2028: "2028-10-03" }, days: 5 }, approximate: true,
      colors: ["#7f1d1d", "#ffb347"],
      offers: [{ item: "st_mooncake", price: 0 }, { item: "st_rabbit", price: 0 }, { item: "th_lantern", price: 120 }],
      bonus: { label: "Log an East or Southeast Asian title", points: 10, maxLogs: 3, countries: ["CN", "HK", "TW", "VN", "SG", "MY", "KR", "JP"] },
      featured: ["your-name-2016", "spirited-away-2001", "someday-or-one-day-2019", "cape-no-7-2008"],
      blurb: "Hint: the kopitiam's lanterns glow a little brighter this week.",
    },
    {
      id: "halloween", kind: "house", name: "Hantu Week", icon: "🎃", tagline: "Halloween, Southeast Asian style: pontianak, pocong & friends.",
      rule: { kind: "fixed", start: "10-25", end: "10-31" }, colors: ["#ff7a1a", "#2d1b46"],
      offers: [{ item: "st_pumpkin", price: 0 }, { item: "st_ghost", price: 0 }, { item: "st_candle", price: 0 }, { item: "th_hantu", price: 150 }, { item: "ef_bats", price: 200 }],
      bonus: { label: "Log a horror title", points: 20, maxLogs: 4, genres: ["Horror"] },
      featured: ["satans-slaves-2017", "shutter-2004", "impetigore-2019", "exhuma-2024", "let-the-right-one-in-2008"],
      blurb: "Horror logs earn bonus KP all week. Survive the region's scariest.",
    },
    {
      id: "diwali", kind: "house", name: "Deepavali", icon: "🪔", tagline: "Happy Deepavali! Light up your watchlist.",
      rule: { kind: "dated", starts: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" }, days: 5 }, approximate: true,
      colors: ["#ff8c00", "#7a1f5c"],
      offers: [{ item: "st_fireworks", price: 0 }, { item: "th_diya", price: 120 }],
      bonus: { label: "Log an Indian title", points: 15, maxLogs: 3, countries: ["IN"] },
      featured: ["rrr-2022", "3-idiots-2009"], spotlight: ["IN", "MY", "SG"],
      blurb: "Celebrated across India, Malaysia, Singapore and the diaspora.",
    },
    {
      id: "rewind-season", kind: "house", name: "Kisah Rewind Season", icon: "⏪", tagline: "Your year in films & series is ready.",
      rule: { kind: "fixed", start: "12-01", end: "01-15" }, colors: ["#f5a524", "#19b38a"],
      offers: [{ item: "st_rewind", price: 0 }], featured: [],
      blurb: "Watch your year back, story-style, and share your card.",
      link: { href: "/rewind", label: "Open my Rewind" },
    },
    {
      id: "christmas", kind: "house", name: "Festive Season", icon: "🎄", tagline: "Tropical Christmas: 32°C and a snowy theme anyway.",
      rule: { kind: "fixed", start: "12-20", end: "12-26" }, colors: ["#1f6f3d", "#ff4d4d"],
      offers: [{ item: "st_tree", price: 0 }, { item: "st_snow", price: 0 }, { item: "th_pine", price: 120 }, { item: "ef_snow", price: 150 }],
      bonus: { label: "Log a family title", points: 10, maxLogs: 3, genres: ["Family"] },
      featured: ["paddington-2-2017", "spirited-away-2001", "four-sisters-and-a-wedding-2013"],
      blurb: "Comfort rewatches and family films with bonus KP.",
    },
  ];
}

/** Offers added from the admin (custom items attached to an event). */
const DATE_OVERRIDES: Record<string, Record<number, { start: string; days: number }>> = Object.create(null);

/** Confirmed dates for moving festivals, loaded from the database. */
export function registerDateOverrides(rows: { event_id: string; year: number; start: string; days: number }[]) {
  for (const k of Object.keys(DATE_OVERRIDES)) delete DATE_OVERRIDES[k];
  for (const r of rows) (DATE_OVERRIDES[r.event_id] ??= {})[r.year] = { start: r.start, days: r.days };
}

/** Is this event's date for that year still a guess? */
export function isApproximate(e: Pick<SiteEvent, "id" | "approximate">, year: number): boolean {
  return !!e.approximate && !DATE_OVERRIDES[e.id]?.[year];
}

const EXTRA_OFFERS: Record<string, Offer[]> = Object.create(null);

/** Events created outside code (scheduled partner campaigns). */
const EXTRA_EVENTS: SiteEvent[] = [];

export function registerExtraEvents(list: SiteEvent[]) {
  EXTRA_EVENTS.splice(0, EXTRA_EVENTS.length, ...list);
}

export function registerExtraOffers(map: Record<string, Offer[]>) {
  for (const k of Object.keys(EXTRA_OFFERS)) delete EXTRA_OFFERS[k];
  Object.assign(EXTRA_OFFERS, map);
}

function withExtras(list: SiteEvent[]): SiteEvent[] {
  return list.map((e) => (EXTRA_OFFERS[e.id]?.length ? { ...e, offers: [...e.offers, ...EXTRA_OFFERS[e.id].filter((o) => !e.offers.some((x) => x.item === o.item))] } : e));
}

export function eventById(id: string): SiteEvent | undefined {
  return allEvents().find((e) => e.id === id);
}

export type ActiveEvent = SiteEvent & { occurrence: Occurrence; daysLeft: number };

/** Who's looking: a country code, null when unknown, or "all" (staff / internal checks). */
export type Audience = string | null | "all";

export function isTargeted(e: Pick<SiteEvent, "markets">): boolean {
  return !!e.markets?.length && !e.markets.includes("GLOBAL");
}

/** Untargeted events are for everyone; targeted ones only for viewers in their markets. */
export function visibleTo(e: Pick<SiteEvent, "markets">, audience: Audience): boolean {
  if (audience === "all" || !isTargeted(e)) return true;
  return !!audience && e.markets!.includes(audience);
}

export function activeEvents(date = today(), audience: Audience = "all"): ActiveEvent[] {
  return allEvents()
    .filter((e) => visibleTo(e, audience))
    .map((e) => ({ e, o: activeOccurrence(e, date) }))
    .filter((x): x is { e: SiteEvent; o: Occurrence } => !!x.o)
    .map(({ e, o }) => ({ ...e, occurrence: o, daysLeft: daysBetween(date, o.end) }))
    .sort((a, b) => (a.kind === b.kind ? a.daysLeft - b.daysLeft : a.kind === "sponsored" ? -1 : 1));
}

export function upcomingEvents(date = today(), limit = 8, audience: Audience = "all"): (SiteEvent & { occurrence: Occurrence; daysUntil: number })[] {
  return allEvents()
    .filter((e) => visibleTo(e, audience))
    .filter((e) => !activeOccurrence(e, date))
    .map((e) => ({ e, o: nextOccurrence(e, date) }))
    .filter((x): x is { e: SiteEvent; o: Occurrence } => !!x.o)
    .map(({ e, o }) => ({ ...e, occurrence: o, daysUntil: daysBetween(date, o.start) }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

/** Which active events give a bonus for logging this title? */
export function bonusesFor(film: { slug: string; country: string; genres: string }, date = today(), audience: Audience = "all") {
  const genres = film.genres.split(",");
  return activeEvents(date, audience).filter((e) => {
    const b = e.bonus;
    if (!b) return false;
    return (
      (b.genres?.some((g) => genres.includes(g)) ?? false) ||
      (b.countries?.includes(film.country) ?? false) ||
      (b.slugs?.includes(film.slug) ?? false)
    );
  });
}

/** For an event-exclusive item: is it offered right now, and at what price? */
export function offerFor(itemId: string, date = today()): { event: ActiveEvent; price: number } | null {
  for (const e of activeEvents(date)) {
    const o = e.offers.find((x) => x.item === itemId);
    if (o) return { event: e, price: o.price };
  }
  return null;
}

/** When is a vaulted item next available? */
export function nextOfferFor(itemId: string, date = today()): { event: SiteEvent; start: string } | null {
  let best: { event: SiteEvent; start: string } | null = null;
  for (const e of allEvents()) {
    if (!e.offers.some((o) => o.item === itemId)) continue;
    const o = nextOccurrence(e, date);
    if (o && (!best || o.start < best.start)) best = { event: e, start: o.start };
  }
  return best;
}

/** Accept "YYYY-MM-DD" preview dates (the events "time machine"). */
export function parsePreviewDate(s: string | undefined | null): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10) === s ? s : null;
}
