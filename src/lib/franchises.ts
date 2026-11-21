/**
 * Collections: trilogies, sagas, shared universes and companion titles.
 * Pure data. Every entry points at a catalogue slug so progress can be tracked.
 * `storyOrder` is given when the in-story chronology differs from release order.
 */
export type FranchiseKind = "Trilogy" | "Loose trilogy" | "Duology" | "Saga" | "Series" | "Universe";

export type FranchiseEntry = { slug: string; label: string; note?: string };

export type Franchise = {
  id: string;
  name: string;
  kind: FranchiseKind;
  blurb: string;
  entries: FranchiseEntry[]; // release order
  storyOrder?: string[];
};

export const FRANCHISES: Franchise[] = [
  {
    id: "vengeance-trilogy", name: "Park Chan-wook's Vengeance Trilogy", kind: "Loose trilogy",
    blurb: "Three standalone stories bound by one theme: what revenge does to the people who chase it.",
    entries: [
      { slug: "sympathy-for-mr-vengeance-2002", label: "I" },
      { slug: "oldboy-2003", label: "II" },
      { slug: "lady-vengeance-2005", label: "III" },
    ],
  },
  {
    id: "wkw-1960s", name: "Wong Kar-wai's 1960s Trilogy", kind: "Loose trilogy",
    blurb: "Characters, moods and room numbers drift between these three films about love just out of reach.",
    entries: [
      { slug: "days-of-being-wild-1990", label: "1" },
      { slug: "in-the-mood-for-love-2000", label: "2" },
      { slug: "2046-2004", label: "3", note: "Loosely continues In the Mood for Love" },
    ],
  },
  {
    id: "infernal-affairs", name: "Infernal Affairs", kind: "Trilogy",
    blurb: "Hong Kong's great cop-and-mole trilogy. Part II goes back to the beginning; Part III jumps between before and after.",
    entries: [
      { slug: "infernal-affairs-2002", label: "I" },
      { slug: "infernal-affairs-ii-2003", label: "II", note: "Prequel" },
      { slug: "infernal-affairs-iii-2003", label: "III", note: "Before and after Part I" },
    ],
    storyOrder: ["infernal-affairs-ii-2003", "infernal-affairs-2002", "infernal-affairs-iii-2003"],
  },
  {
    id: "star-wars-ot", name: "Star Wars: The Original Trilogy", kind: "Trilogy",
    blurb: "Episodes IV to VI, where it all started in 1977.",
    entries: [
      { slug: "star-wars-1977", label: "IV" },
      { slug: "empire-strikes-back-1980", label: "V" },
      { slug: "return-of-the-jedi-1983", label: "VI" },
    ],
  },
  {
    id: "godfather", name: "The Godfather Trilogy", kind: "Trilogy",
    blurb: "The Corleone family across three generations and three decades of filmmaking.",
    entries: [
      { slug: "the-godfather-1972", label: "I" },
      { slug: "the-godfather-part-ii-1974", label: "II", note: "Sequel and prequel at once" },
      { slug: "the-godfather-part-iii-1990", label: "III" },
    ],
  },
  {
    id: "mad-max", name: "Mad Max", kind: "Saga",
    blurb: "Five films across 45 years of George Miller's wasteland.",
    entries: [
      { slug: "mad-max-1979", label: "1" },
      { slug: "mad-max-2-1981", label: "2" },
      { slug: "mad-max-beyond-thunderdome-1985", label: "3" },
      { slug: "mad-max-fury-road-2015", label: "4" },
      { slug: "furiosa-2024", label: "5", note: "Prequel to Fury Road" },
    ],
    storyOrder: ["mad-max-1979", "mad-max-2-1981", "mad-max-beyond-thunderdome-1985", "furiosa-2024", "mad-max-fury-road-2015"],
  },
  {
    id: "train-to-busan", name: "Train to Busan Universe", kind: "Universe",
    blurb: "Yeon Sang-ho's outbreak, told in animation, on a train, and four years later.",
    entries: [
      { slug: "train-to-busan-2016", label: "1" },
      { slug: "seoul-station-2016", label: "★", note: "Animated prequel" },
      { slug: "peninsula-2020", label: "2", note: "Sequel" },
    ],
    storyOrder: ["seoul-station-2016", "train-to-busan-2016", "peninsula-2020"],
  },
  {
    id: "ne-zha", name: "Ne Zha", kind: "Duology",
    blurb: "China's record-breaking animated mythology, with Part 2 among the biggest animated films ever.",
    entries: [
      { slug: "ne-zha-2019", label: "1" },
      { slug: "ne-zha-2-2025", label: "2" },
    ],
  },
  {
    id: "wandering-earth", name: "The Wandering Earth", kind: "Duology",
    blurb: "Chinese sci-fi at planetary scale. The second film goes back to how it all began.",
    entries: [
      { slug: "the-wandering-earth-2019", label: "1" },
      { slug: "wandering-earth-ii-2023", label: "2", note: "Prequel" },
    ],
    storyOrder: ["wandering-earth-ii-2023", "the-wandering-earth-2019"],
  },
  {
    id: "satans-slaves", name: "Satan's Slaves", kind: "Series",
    blurb: "Indonesia's landmark horror: the 1980 original, Joko Anwar's reimagining, and its sequel.",
    entries: [
      { slug: "satans-slaves-1980", label: "1980", note: "The original" },
      { slug: "satans-slaves-2017", label: "2017", note: "Joko Anwar's reimagining" },
      { slug: "satans-slaves-2-2022", label: "2022", note: "Sequel to the 2017 film" },
    ],
  },
  {
    id: "the-raid", name: "The Raid", kind: "Duology",
    blurb: "Silat action that changed the genre. Part 2 picks up hours after Part 1 ends.",
    entries: [
      { slug: "the-raid-2011", label: "1" },
      { slug: "the-raid-2-2014", label: "2" },
    ],
  },
  {
    id: "ah-boys-to-men", name: "Ah Boys to Men", kind: "Series",
    blurb: "Singapore's National Service comedy franchise, from BMT to the Navy divers to reservist life.",
    entries: [
      { slug: "ah-boys-to-men-2012", label: "1" },
      { slug: "ah-boys-to-men-2-2013", label: "2" },
      { slug: "ah-boys-to-men-3-2015", label: "3", note: "New recruits" },
      { slug: "ah-boys-to-men-4-2017", label: "4" },
    ],
  },
  {
    id: "polis-evo", name: "Polis Evo", kind: "Trilogy",
    blurb: "Malaysia's buddy-cop action trilogy.",
    entries: [
      { slug: "polis-evo-2015", label: "1" },
      { slug: "polis-evo-2-2018", label: "2" },
      { slug: "polis-evo-3-2023", label: "3" },
    ],
  },
  {
    id: "hello-love", name: "Hello, Love", kind: "Duology",
    blurb: "Joy and Ethan, from Hong Kong to Canada.",
    entries: [
      { slug: "hello-love-goodbye-2019", label: "1" },
      { slug: "hello-love-again-2024", label: "2" },
    ],
  },
  {
    id: "paddington", name: "Paddington", kind: "Trilogy",
    blurb: "Marmalade, manners and the Brown family.",
    entries: [
      { slug: "paddington-2014", label: "1" },
      { slug: "paddington-2-2017", label: "2" },
      { slug: "paddington-in-peru-2024", label: "3" },
    ],
  },
  {
    id: "breaking-bad", name: "Breaking Bad Universe", kind: "Universe",
    blurb: "The series, its prequel spin-off, and the film epilogue.",
    entries: [
      { slug: "breaking-bad-2008", label: "Series" },
      { slug: "better-call-saul-2015", label: "Spin-off", note: "Mostly a prequel" },
      { slug: "el-camino-2019", label: "Film", note: "Epilogue" },
    ],
    storyOrder: ["better-call-saul-2015", "breaking-bad-2008", "el-camino-2019"],
  },
  {
    id: "someday-or-one-day", name: "Someday or One Day", kind: "Duology",
    blurb: "The Taiwanese time-loop romance and its big-screen follow-up.",
    entries: [
      { slug: "someday-or-one-day-2019", label: "Series" },
      { slug: "someday-or-one-day-movie-2022", label: "Film" },
    ],
  },
];

export const FRANCHISE_BY_ID: Record<string, Franchise> = Object.assign(Object.create(null), Object.fromEntries(FRANCHISES.map((f) => [f.id, f])));

/** Collections a title belongs to (a title can be in more than one). */
export function franchisesFor(slug: string): Franchise[] {
  return FRANCHISES.filter((f) => f.entries.some((e) => e.slug === slug));
}

/** How many collections has someone completed, given the slugs they've logged? */
export function completedFranchises(logged: Set<string>): Franchise[] {
  return FRANCHISES.filter((f) => f.entries.every((e) => logged.has(e.slug)));
}

/** Position of a title inside a collection, e.g. "2 of 3". */
export function positionIn(f: Franchise, slug: string): { index: number; total: number } | null {
  const i = f.entries.findIndex((e) => e.slug === slug);
  return i < 0 ? null : { index: i + 1, total: f.entries.length };
}
