/**
 * Achievements. Pure definitions: `progress(stats)` returns [current, goal].
 * Event-only achievements (easter eggs) have no progress and are granted
 * directly by key.
 */
export type Stats = {
  filmsLogged: number;
  countries: number;
  seaCountries: number;
  byCountry: Record<string, number>;
  seaHorror: number;
  decades: number;
  rewatches: number;
  fiveStars: number;
  midnightLogs: number;
  reviews: number;
  longestReview: number;
  likesReceived: number;
  bigLists: number;
  cinemaVisits: number;
  cinemaChains: number;
  localCinemaVisits: number;
  gamesWon: number;
  following: number;
  itemsBought: number;
  legendaryOwned: number;
  eggsFound: number;
  loggedSlugs: Set<string>;
  regions: number;
  seriesLogged: number;
  eventsJoined: number;
  scoresReported: number;
  stickersGiven: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  hidden?: boolean;
  /** Item granted on unlock. */
  reward?: string;
  /** easter eggs are triggered from the client and verified by key */
  egg?: boolean;
  /** granted directly by a server action (no progress function) */
  manual?: boolean;
  progress?: (s: Stats) => [number, number];
};

const has = (slug: string) => (s: Stats): [number, number] => [s.loggedSlugs.has(slug) ? 1 : 0, 1];

export const ACHIEVEMENTS: Achievement[] = [
  // Watching
  { id: "first_kisah", name: "First Kisah", description: "Log your first film.", icon: "🎟️", points: 20, progress: (s) => [s.filmsLogged, 1] },
  { id: "kaki_wayang", name: "Kaki Wayang", description: "Log 25 films.", icon: "🍿", points: 150, reward: "ti_kaki", progress: (s) => [s.filmsLogged, 25] },
  { id: "sinephile", name: "Sinephile", description: "Log 100 films.", icon: "🏛️", points: 500, progress: (s) => [s.filmsLogged, 100] },
  { id: "jalan_jalan", name: "Jalan-Jalan", description: "Watch films from 5 different countries.", icon: "🧭", points: 60, progress: (s) => [s.countries, 5] },
  { id: "asean_explorer", name: "ASEAN Explorer", description: "Watch films from 5 Southeast Asian countries.", icon: "🗺️", points: 120, progress: (s) => [s.seaCountries, 5] },
  { id: "one_community", name: "One Vision, One Identity", description: "Watch films from 8 Southeast Asian countries.", icon: "🤝", points: 300, reward: "fr_batik", progress: (s) => [s.seaCountries, 8] },
  { id: "globetrotter", name: "Globetrotter", description: "Watch titles from 4 different world regions.", icon: "✈️", points: 100, progress: (s) => [s.regions, 4] },
  { id: "around_the_world", name: "Around the World in 80 Films", description: "Watch titles from 20 countries.", icon: "🎈", points: 400, progress: (s) => [s.countries, 20] },
  { id: "binge_mode", name: "Binge Mode", description: "Log 5 TV series.", icon: "📺", points: 60, progress: (s) => [s.seriesLogged, 5] },
  { id: "hallyu", name: "Riding the Hallyu", description: "Watch 5 Korean films.", icon: "🌊", points: 80, reward: "av_star", progress: (s) => [s.byCountry.KR ?? 0, 5] },
  { id: "hantu_hunter", name: "Hantu Hunter", description: "Survive 3 Southeast Asian horror films.", icon: "🕯️", points: 80, progress: (s) => [s.seaHorror, 3] },
  { id: "time_traveller", name: "Time Traveller", description: "Watch films from 4 different decades.", icon: "⏳", points: 60, progress: (s) => [s.decades, 4] },
  { id: "ulang_tayang", name: "Ulang Tayang", description: "Log a rewatch. Some kisah deserve a second telling.", icon: "🔁", points: 20, progress: (s) => [s.rewatches, 1] },
  { id: "bintang_lima", name: "Bintang Lima", description: "Give five films a perfect 5 stars.", icon: "⭐", points: 40, progress: (s) => [s.fiveStars, 5] },
  // Hidden film-specific
  { id: "betul_betul", name: "Betul Betul Betul", description: "Watch Upin & Ipin. Betul, betul, betul!", icon: "👦", points: 50, hidden: true, progress: has("upin-ipin-keris-siamang-tunggal-2019") },
  { id: "gol", name: "GOLLLL!", description: "Watch Ola Bola. Malaysia boleh!", icon: "⚽", points: 50, hidden: true, progress: has("ola-bola-2016") },
  { id: "pontianak_hours", name: "Pontianak Hours", description: "Log a film between midnight and 4am.", icon: "🌙", points: 60, hidden: true, reward: "av_ghost", progress: (s) => [s.midnightLogs, 1] },
  // Reviewing & community
  { id: "pengkritik", name: "Pengkritik", description: "Write your first review.", icon: "✍️", points: 25, progress: (s) => [s.reviews, 1] },
  { id: "critics_corner", name: "Critic's Corner", description: "Write 10 reviews.", icon: "📰", points: 120, progress: (s) => [s.reviews, 10] },
  { id: "long_form_lah", name: "Long-Form Lah", description: "Write a review of 600+ characters.", icon: "📜", points: 50, progress: (s) => [Math.min(s.longestReview, 600), 600] },
  { id: "crowd_favourite", name: "Crowd Favourite", description: "Receive 10 likes on your reviews.", icon: "❤️", points: 100, progress: (s) => [s.likesReceived, 10] },
  { id: "kurator", name: "Kurator", description: "Make a catalogue with at least 5 films.", icon: "🗂️", points: 50, progress: (s) => [s.bigLists, 1] },
  { id: "kawan_kawan", name: "Kawan-Kawan", description: "Follow 3 fellow film lovers.", icon: "👥", points: 30, progress: (s) => [s.following, 3] },
  // Cinema
  { id: "big_screen", name: "Big Screen Believer", description: "Earn points from your first cinema ticket.", icon: "🎞️", points: 50, reward: "fr_filmstrip", progress: (s) => [s.cinemaVisits, 1] },
  { id: "popcorn_loyalist", name: "Popcorn Loyalist", description: "Earn points from 5 cinema tickets.", icon: "🥤", points: 150, progress: (s) => [s.cinemaVisits, 5] },
  { id: "mall_hopper", name: "Mall Hopper", description: "Visit 3 different cinema chains.", icon: "🏬", points: 120, progress: (s) => [s.cinemaChains, 3] },
  { id: "sokong_lokal", name: "Sokong Lokal", description: "Watch a local film at a cinema in its home country.", icon: "💪", points: 80, progress: (s) => [s.localCinemaVisits, 1] },
  // Events, scores, stickers, Rewind
  { id: "festival_goer", name: "Festival Goer", description: "Join 3 events (claim an item or earn an event bonus).", icon: "🎪", points: 80, progress: (s) => [s.eventsJoined, 3] },
  { id: "score_scout", name: "Score Scout", description: "Report 5 scores from other platforms.", icon: "🔎", points: 50, progress: (s) => [s.scoresReported, 5] },
  { id: "sticker_happy", name: "Sticker Happy", description: "Slap stickers on 10 reviews.", icon: "🏷️", points: 40, progress: (s) => [s.stickersGiven, 10] },
  { id: "rewound", name: "Rewound", description: "Watch your Kisah Rewind.", icon: "⏪", points: 30, manual: true },
  // Games & shop
  { id: "game_on", name: "Game On", description: "Win a mini game on someone's review.", icon: "🎯", points: 20, progress: (s) => [s.gamesWon, 1] },
  { id: "arcade_legend", name: "Arcade Legend", description: "Win 10 review mini games.", icon: "🕹️", points: 150, reward: "av_trophy", progress: (s) => [s.gamesWon, 10] },
  { id: "big_spender", name: "Big Spender", description: "Buy 5 items from the Kedai.", icon: "🛍️", points: 60, progress: (s) => [s.itemsBought, 5] },
  { id: "collector", name: "Legendary Collector", description: "Own a legendary item.", icon: "💎", points: 100, progress: (s) => [s.legendaryOwned, 1] },
  // Easter eggs (hidden, client-triggered)
  { id: "egg_konami", name: "Cheat Code Champion", description: "Entered the ancient code.", icon: "🎮", points: 100, hidden: true, egg: true, reward: "av_gamepad" },
  { id: "egg_durian", name: "Durian Whisperer", description: "Made it rain durians.", icon: "🌧️", points: 75, hidden: true, egg: true, reward: "av_durian" },
  { id: "egg_makan", name: "Sudah Makan?", description: "Asked the most important question in Asia.", icon: "🍛", points: 40, hidden: true, egg: true },
  { id: "egg_kopitiam", name: "Kopitiam Regular", description: "Found the secret kopitiam.", icon: "☕", points: 60, hidden: true, egg: true, reward: "av_tehtarik" },
  { id: "egg_credits", name: "Post-Credits Scene", description: "Stayed until the very end.", icon: "🎬", points: 60, hidden: true, egg: true, reward: "bn_midnight" },
  { id: "egg_lantern", name: "Lantern Keeper", description: "Lit every lantern in the kopitiam.", icon: "🏮", points: 80, hidden: true, egg: true },
  { id: "egg_hunter", name: "Easter Egg Hunter", description: "Find 4 easter eggs.", icon: "🥚", points: 200, hidden: true, reward: "ti_hunter", progress: (s) => [s.eggsFound, 4] },
];

export const ACHIEVEMENT_BY_ID: Record<string, Achievement> = Object.assign(Object.create(null), Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])));

export const EGG_IDS = new Set(ACHIEVEMENTS.filter((a) => a.egg).map((a) => a.id));

/** Which (non-egg) achievements does this set of stats newly satisfy? */
export function satisfied(stats: Stats, already: Set<string>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (already.has(a.id) || !a.progress) return false;
    const [cur, goal] = a.progress(stats);
    return cur >= goal;
  });
}
