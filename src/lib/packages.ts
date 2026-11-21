/**
 * Promotion packages sold to studios, distributors and streamers.
 * Shown on /advertise; the commercial plan lives in docs/PROMOTIONS.md.
 * Prices are intentionally not shown publicly ("from" ranges live in the
 * plan as hypotheses to validate).
 */
export type PromoPackage = {
  id: string;
  name: string;
  icon: string;
  duration: string;
  bestFor: string;
  includes: string[];
  highlight?: boolean;
};

export const PACKAGES: PromoPackage[] = [
  {
    id: "indie", name: "Indie Spotlight", icon: "🌱", duration: "7 days",
    bestFor: "Southeast Asian independent, festival & first-time filmmakers (subsidised)",
    includes: [
      "Featured row on the home page and the title's country page",
      "Campaign page with synopsis, release date & where to watch",
      "Free 3-sticker pack fans can claim",
      "Official Kuiz (trivia game) on the campaign page",
      "Post-campaign report: claims, watchlist adds, logs, sentiment",
    ],
  },
  {
    id: "trailer", name: "Trailer Drop", icon: "🎬", duration: "7 days",
    bestFor: "Building anticipation 2–6 weeks before release",
    includes: [
      "Everything in Indie Spotlight",
      "Sitewide banner strip in your chosen markets",
      "4-sticker pack, free to claim and limited time only",
      "“Notify me” watchlist button with a reminder on release day",
    ],
  },
  {
    id: "premiere", name: "Premiere", icon: "🎟️", duration: "14 days around release", highlight: true,
    bestFor: "Theatrical or streaming launches",
    includes: [
      "Everything in Trailer Drop",
      "Limited-edition site theme fans can equip",
      "Premium avatar frame sold for Kisah Points",
      "Logging bonus: fans earn extra KP for watching your title",
      "Ticket bonus with partner cinemas (co-funded)",
      "Launch-week event page with countdown",
    ],
  },
  {
    id: "blockbuster", name: "Blockbuster Takeover", icon: "🐉", duration: "21–30 days, multi-market",
    bestFor: "Tentpole releases across Southeast Asia and beyond",
    includes: [
      "Everything in Premiere",
      "Opening-weekend takeover: event banner and theme for everyone",
      "Legendary avatar + a campaign achievement",
      "A custom hidden easter egg tied to your title",
      "Tie-in with a seasonal event (e.g. Hantu Week, Lunar New Year)",
      "Dedicated account manager & mid-flight optimisation",
    ],
  },
];

export const ADD_ONS = [
  { name: "Event tie-in", detail: "Present a seasonal event: Hantu Week for horror, Space Opera Day for sci-fi, Lunar New Year for family films." },
  { name: "Custom easter egg", detail: "A hidden interactive moment (a secret code, a clickable prop) that unlocks an exclusive item." },
  { name: "Series season pack", detail: "For streamers: an episode-by-episode sticker drop across a season's run." },
  { name: "Rewind placement", detail: "December only. A sponsored “most-claimed campaign of the year” slide in Kisah Rewind." },
];

export const GUARDRAILS = [
  "Everything sponsored is labelled “Sponsored”.",
  "Sponsors can never buy ratings, reviews, scores or rankings, and can't remove negative reviews.",
  "Cosmetics only: sponsored items never give a gameplay advantage.",
  "At most two campaigns run sitewide at once, so the community comes first.",
  "Sponsors provide licensed artwork; we don't use third-party IP without permission.",
];
