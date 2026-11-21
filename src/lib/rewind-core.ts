/** Pure Rewind helpers (no DB), unit-tested in tests/. */

/** Hours are estimated: we don't track runtimes per title yet. */
export const EST_HOURS = { film: 2, series: 8 };

export type Archetype = { id: string; name: string; emoji: string; blurb: string };

export function pickArchetype(x: {
  total: number; horror: number; series: number; korean: number; sea: number; countries: number; regions: number;
  cinema: number; reviews: number; midnight: number; avgRating: number | null;
}): Archetype {
  const share = (n: number) => (x.total ? n / x.total : 0);
  if (x.total === 0) return { id: "blank", name: "The Blank Reel", emoji: "🎞️", blurb: "Your story is waiting to be written." };
  if (share(x.horror) >= 0.3) return { id: "hantu", name: "The Hantu Hunter", emoji: "👻", blurb: "Pontianak, pocong, possessed dolls: you've seen them all and slept with the lights on." };
  if (share(x.series) >= 0.5) return { id: "binge", name: "The Binge Monarch", emoji: "📺", blurb: "“Just one more episode” is your love language." };
  if (share(x.korean) >= 0.35) return { id: "hallyu", name: "The Hallyu Heart", emoji: "💜", blurb: "Your heart beats in Korean. Saranghae, cinema." };
  if (x.regions >= 4 || x.countries >= 8) return { id: "globe", name: "The Globetrotter", emoji: "✈️", blurb: "Your passport is stamped from Lagos to Lisbon to Luang Prabang." };
  if (share(x.sea) >= 0.6) return { id: "local", name: "The Local Hero", emoji: "🌺", blurb: "Sokong filem tempatan! Southeast Asian cinema has no bigger fan." };
  if (x.cinema >= 5) return { id: "bigscreen", name: "The Big Screen Believer", emoji: "🎟️", blurb: "Streaming is fine, but you live for the cinema." };
  if (share(x.reviews) >= 0.6) return { id: "critic", name: "The Critic", emoji: "✍️", blurb: "You don't just watch. You have Thoughts™." };
  if (x.midnight >= 3) return { id: "owl", name: "The Night Owl", emoji: "🦉", blurb: "Your best screenings start after midnight." };
  if (x.avgRating !== null && x.avgRating >= 4.3) return { id: "optimist", name: "The Optimist", emoji: "🌈", blurb: "Every film is a five-star film if you believe." };
  if (x.avgRating !== null && x.avgRating <= 2.8) return { id: "tough", name: "The Tough Crowd", emoji: "🧐", blurb: "Five stars? Earn them." };
  return { id: "wanderer", name: "The Curious Wanderer", emoji: "🧭", blurb: "A little of everything, a lot of curiosity." };
}

export function longestStreak(dates: string[]): number {
  const days = [...new Set(dates)].sort().map((d) => Date.parse(`${d}T00:00:00Z`) / 86400_000);
  let best = 0, cur = 0;
  for (let i = 0; i < days.length; i++) {
    cur = i > 0 && days[i] - days[i - 1] === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
  }
  return best;
}

