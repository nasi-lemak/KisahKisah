/**
 * Cosmetics you can earn or buy with Kisah Points (KP), Steam-points style.
 * Items with `price: null` cannot be bought; they come from achievements
 * or hidden easter eggs.
 */
export type ItemType = "avatar" | "frame" | "banner" | "title";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export type ShopItem = {
  id: string;
  type: ItemType;
  name: string;
  rarity: Rarity;
  price: number | null;
  description: string;
  /** avatar: emoji or "svg:<name>"; frame/banner: CSS class; title: the text */
  value: string;
  /** Gradient behind an avatar. */
  bg?: string;
  starter?: boolean;
};

export const RARITY_STYLE: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Common", color: "#9ca3af" },
  rare: { label: "Rare", color: "#38bdf8" },
  epic: { label: "Epic", color: "#c084fc" },
  legendary: { label: "Legendary", color: "#fbbf24" },
};

export const ITEMS: ShopItem[] = [
  // ── Avatars ──
  { id: "av_kopi", type: "avatar", name: "Kopi Cat", rarity: "common", price: 0, starter: true, value: "🐱", bg: "linear-gradient(135deg,#7c4a1e,#d4a373)", description: "Curled up on the kopitiam stool since 1965." },
  { id: "av_popcorn", type: "avatar", name: "Popcorn Kid", rarity: "common", price: 0, starter: true, value: "🍿", bg: "linear-gradient(135deg,#b91c1c,#fca5a5)", description: "Sweet, salty, or both? Yes." },
  { id: "av_clapper", type: "avatar", name: "Clapperboard", rarity: "common", price: 0, starter: true, value: "🎬", bg: "linear-gradient(135deg,#111827,#6b7280)", description: "Take one. Action!" },
  { id: "av_lotus", type: "avatar", name: "Sen the Lotus", rarity: "common", price: 60, value: "🪷", bg: "linear-gradient(135deg,#be185d,#fbcfe8)", description: "Rises from the mud, every single time." },
  { id: "av_pho", type: "avatar", name: "Phở Master", rarity: "common", price: 80, value: "🍜", bg: "linear-gradient(135deg,#92400e,#fde68a)", description: "Broth simmered for twelve hours. Like a Lav Diaz film." },
  { id: "av_boba", type: "avatar", name: "Boba Boss", rarity: "common", price: 80, value: "🧋", bg: "linear-gradient(135deg,#78350f,#fef3c7)", description: "50% sugar, 100% opinions." },
  { id: "av_satay", type: "avatar", name: "Satay Sensei", rarity: "common", price: 80, value: "🍢", bg: "linear-gradient(135deg,#9a3412,#fdba74)", description: "Extra kuah kacang, please." },
  { id: "av_mango", type: "avatar", name: "Mango Sticky", rarity: "common", price: 80, value: "🥭", bg: "linear-gradient(135deg,#ca8a04,#fef9c3)", description: "Khao niao mamuang supremacy." },
  { id: "av_tiger", type: "avatar", name: "Harimau Malaya", rarity: "rare", price: 250, value: "🐯", bg: "linear-gradient(135deg,#ea580c,#1c1917)", description: "Roars at every penalty shootout." },
  { id: "av_orangutan", type: "avatar", name: "Orang Hutan", rarity: "rare", price: 250, value: "🦧", bg: "linear-gradient(135deg,#9a3412,#166534)", description: "Person of the forest. Critic of the canopy." },
  { id: "av_elephant", type: "avatar", name: "Chang", rarity: "rare", price: 250, value: "🐘", bg: "linear-gradient(135deg,#475569,#cbd5e1)", description: "Never forgets a plot twist." },
  { id: "av_carabao", type: "avatar", name: "Kalabaw", rarity: "rare", price: 250, value: "🐃", bg: "linear-gradient(135deg,#365314,#a3e635)", description: "Hardworking. Watches three films a day." },
  { id: "av_tuktuk", type: "avatar", name: "Tuk-tuk Racer", rarity: "rare", price: 300, value: "🛺", bg: "linear-gradient(135deg,#0e7490,#fde047)", description: "Gets you to the 11pm screening by 10:58." },
  { id: "av_jeepney", type: "avatar", name: "Jeepney King", rarity: "rare", price: 300, value: "🚌", bg: "linear-gradient(135deg,#b91c1c,#facc15)", description: "Bayad po! Chrome, stickers and a full playlist." },
  { id: "av_komodo", type: "avatar", name: "Komodo", rarity: "epic", price: 600, value: "🦎", bg: "linear-gradient(135deg,#14532d,#a16207)", description: "An apex predator of hot takes." },
  { id: "av_lantern", type: "avatar", name: "Tanglung", rarity: "epic", price: 700, value: "🏮", bg: "linear-gradient(135deg,#7f1d1d,#f59e0b)", description: "Glows brighter during Mid-Autumn." },
  { id: "av_wayang", type: "avatar", name: "Wayang Kulit", rarity: "legendary", price: 1500, value: "🎭", bg: "linear-gradient(135deg,#1c1917,#b45309)", description: "The original cinema: shadows on a screen, a dalang and a story." },
  { id: "av_naga", type: "avatar", name: "Naga", rarity: "legendary", price: 2000, value: "🐉", bg: "linear-gradient(135deg,#064e3b,#22d3ee)", description: "Guardian of the Mekong. Never skips the credits." },
  // achievement & easter-egg exclusives
  { id: "av_ghost", type: "avatar", name: "Pontianak", rarity: "epic", price: null, value: "👻", bg: "linear-gradient(135deg,#0f172a,#e2e8f0)", description: "Unlocked by logging a film in the witching hours." },
  { id: "av_star", type: "avatar", name: "Hallyu Star", rarity: "epic", price: null, value: "🌟", bg: "linear-gradient(135deg,#db2777,#60a5fa)", description: "Awarded to those who rode the Korean wave." },
  { id: "av_gamepad", type: "avatar", name: "Cheat Coder", rarity: "legendary", price: null, value: "🎮", bg: "linear-gradient(135deg,#4c1d95,#22c55e)", description: "↑↑↓↓←→←→BA. You know what you did." },
  { id: "av_durian", type: "avatar", name: "Durian Knight", rarity: "legendary", price: null, value: "svg:durian", bg: "linear-gradient(135deg,#3f6212,#fde047)", description: "King of fruits. Banned from most hotel lobbies." },
  { id: "av_tehtarik", type: "avatar", name: "Teh Tarik Pro", rarity: "epic", price: null, value: "☕", bg: "linear-gradient(135deg,#78350f,#fed7aa)", description: "Pulled one metre high, never a drop spilled." },
  { id: "av_trophy", type: "avatar", name: "Arcade Legend", rarity: "epic", price: null, value: "🕹️", bg: "linear-gradient(135deg,#1e3a8a,#f472b6)", description: "Top of the review-page leaderboards." },

  // ── Frames ──
  { id: "fr_jade", type: "frame", name: "Jade Ring", rarity: "rare", price: 250, value: "frame-jade", description: "Cool green jade, polished smooth." },
  { id: "fr_gold", type: "frame", name: "Emas", rarity: "rare", price: 350, value: "frame-gold", description: "24k, like a wedding in Penang." },
  { id: "fr_neon", type: "frame", name: "Night Market Neon", rarity: "rare", price: 400, value: "frame-neon", description: "Buzzing like a pasar malam sign." },
  { id: "fr_batik", type: "frame", name: "Batik", rarity: "epic", price: 650, value: "frame-batik", description: "Hand-drawn canting lines, in wax and dye." },
  { id: "fr_songket", type: "frame", name: "Songket", rarity: "legendary", price: 1200, value: "frame-songket", description: "Gold thread woven by hand, shimmering as you move." },
  { id: "fr_filmstrip", type: "frame", name: "35mm", rarity: "epic", price: null, value: "frame-filmstrip", description: "For those who buy their tickets at the box office." },

  // ── Banners ──
  { id: "bn_sunset", type: "banner", name: "Senja di Pantai", rarity: "common", price: 100, value: "banner-sunset", description: "Sunset on the beach, sticky with sea salt." },
  { id: "bn_padi", type: "banner", name: "Sawah Padi", rarity: "rare", price: 250, value: "banner-padi", description: "Terraces of green that go on forever." },
  { id: "bn_monsoon", type: "banner", name: "Monsoon Season", rarity: "rare", price: 250, value: "banner-monsoon", description: "4pm. Like clockwork." },
  { id: "bn_neon", type: "banner", name: "Neon City", rarity: "epic", price: 500, value: "banner-neon", description: "Bangkok, Saigon, Manila: the city never sleeps." },
  { id: "bn_lantern", type: "banner", name: "Lantern Festival", rarity: "epic", price: 500, value: "banner-lantern", description: "A thousand wishes floating up." },
  { id: "bn_midnight", type: "banner", name: "Midnight Screening", rarity: "legendary", price: null, value: "banner-midnight", description: "Revealed only to those who stay for the post-credits scene." },

  // ── Titles ──
  { id: "ti_setia", type: "title", name: "Penonton Setia", rarity: "common", price: 80, value: "Penonton Setia", description: "Loyal viewer. Always shows up." },
  { id: "ti_subtitle", type: "title", name: "Subtitle Reader", rarity: "common", price: 80, value: "Subtitle Reader", description: "The one-inch barrier is nothing to you." },
  { id: "ti_popcorn", type: "title", name: "Popcorn Philosopher", rarity: "rare", price: 200, value: "Popcorn Philosopher", description: "Deep thoughts, buttered." },
  { id: "ti_ninja", type: "title", name: "Spoiler Ninja", rarity: "rare", price: 200, value: "Spoiler Ninja", description: "Knows the ending. Says nothing." },
  { id: "ti_tauke", type: "title", name: "Tauke Wayang", rarity: "legendary", price: 1500, value: "Tauke Wayang", description: "Practically owns the cinema." },
  { id: "ti_kaki", type: "title", name: "Kaki Wayang", rarity: "epic", price: null, value: "Kaki Wayang", description: "A true movie buff. Earned by logging 25 films." },
  { id: "ti_hunter", type: "title", name: "Easter Egg Hunter", rarity: "legendary", price: null, value: "Easter Egg Hunter", description: "Finds secrets the devs forgot they hid." },
];

export const ITEM_BY_ID: Record<string, ShopItem> = Object.assign(Object.create(null), Object.fromEntries(ITEMS.map((i) => [i.id, i])));
export const STARTER_ITEMS = ITEMS.filter((i) => i.starter).map((i) => i.id);
export const DEFAULT_AVATAR = "av_popcorn";
