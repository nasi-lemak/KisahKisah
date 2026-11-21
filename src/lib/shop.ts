/**
 * Cosmetics you can earn or buy with Kisah Points (KP), Steam-points style.
 * Items with `price: null` cannot be bought; they come from achievements
 * or hidden easter eggs.
 */
export type ItemType = "avatar" | "frame" | "banner" | "title" | "theme" | "sticker" | "effect" | "namestyle";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export type ShopItem = {
  id: string;
  type: ItemType;
  name: string;
  rarity: Rarity;
  price: number | null;
  description: string;
  /** avatar/sticker: emoji or "svg:<name>"; frame/banner: CSS class; title: the text; theme: data-theme key */
  value: string;
  /** Event-exclusive: only obtainable while that event (see events.ts) is running. */
  event?: string;
  /** Theme preview swatch [background, surface, accent]. */
  swatch?: [string, string, string];
  /** Gradient behind an avatar. */
  bg?: string;
  /** Avatar decorations: glyphs orbiting the avatar, one sitting on top, cat ears. */
  orbit?: string[];
  crown?: string;
  ears?: boolean;
  /** Profile effects: particle glyphs ("dot" = glowing firefly) and motion. */
  particles?: string[];
  motion?: "fall" | "rise" | "drift" | "streak" | "twinkle";
  /** Sticker animation. */
  anim?: "bounce" | "wobble" | "spin" | "pulse" | "float" | "shake";
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
  { id: "fr_gold", type: "frame", name: "Emas", rarity: "rare", price: 350, value: "frame-gold", crown: "✨", description: "24k, like a wedding in Penang." },
  { id: "fr_neon", type: "frame", name: "Night Market Neon", rarity: "rare", price: 400, value: "frame-neon", description: "Buzzing like a pasar malam sign." },
  { id: "fr_batik", type: "frame", name: "Batik", rarity: "epic", price: 650, value: "frame-batik", description: "Hand-drawn canting lines, in wax and dye." },
  { id: "fr_songket", type: "frame", name: "Songket", rarity: "legendary", price: 1200, value: "frame-songket", orbit: ["✨", "✨", "✨"], description: "Gold thread woven by hand, shimmering as you move." },
  { id: "fr_filmstrip", type: "frame", name: "35mm", rarity: "epic", price: null, value: "frame-filmstrip", crown: "🎞️", description: "For those who buy their tickets at the box office." },

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

  // ── Site themes (recolour the whole app for you) ──
  { id: "th_kopi", type: "theme", name: "Kopi Pagi", rarity: "rare", price: 250, value: "kopi", swatch: ["#120d09", "#281d16", "#d4a373"], description: "Warm browns of a morning kopitiam." },
  { id: "th_neon", type: "theme", name: "Neon Noir", rarity: "epic", price: 450, value: "neon", swatch: ["#0a0614", "#1d1433", "#ff2fd6"], description: "Rain-slicked streets and pink neon." },
  { id: "th_hyperspace", type: "theme", name: "Hyperspace", rarity: "epic", price: null, event: "space-opera-day", value: "hyperspace", swatch: ["#05070f", "#121a33", "#ffe81f"], description: "Punch it. A long time ago, in a theme far, far away." },
  { id: "th_hantu", type: "theme", name: "Hantu Night", rarity: "epic", price: null, event: "halloween", value: "hantu", swatch: ["#0d0a12", "#22192d", "#ff7a1a"], description: "Pumpkins, pontianaks and a very purple moon." },
  { id: "th_lantern", type: "theme", name: "Lantern Glow", rarity: "epic", price: null, event: "mid-autumn", value: "lantern", swatch: ["#140707", "#2b1310", "#ffb347"], description: "Mooncakes optional. Lanterns mandatory." },
  { id: "th_angpao", type: "theme", name: "Ang Pao", rarity: "epic", price: null, event: "lunar-new-year", value: "angpao", swatch: ["#160606", "#311111", "#ffd23f"], description: "Red and gold for a prosperous year of watching." },
  { id: "th_raya", type: "theme", name: "Raya Emerald", rarity: "epic", price: null, event: "hari-raya", value: "raya", swatch: ["#04140d", "#102c21", "#e6c35c"], description: "Pelita lights and songket gold." },
  { id: "th_songkran", type: "theme", name: "Songkran Splash", rarity: "epic", price: null, event: "songkran", value: "songkran", swatch: ["#041319", "#0d2e3b", "#36d6ff"], description: "You will get wet. Your UI too." },
  { id: "th_diya", type: "theme", name: "Diya Glow", rarity: "epic", price: null, event: "diwali", value: "diya", swatch: ["#12070f", "#2a1223", "#ffa62b"], description: "A thousand little lamps." },
  { id: "th_pine", type: "theme", name: "Festive Pine", rarity: "epic", price: null, event: "christmas", value: "pine", swatch: ["#06110b", "#13281c", "#ff4d4d"], description: "Even in 32°C, it's beginning to look a lot like Christmas." },
  { id: "th_hornbill", type: "theme", name: "Hornbill Orbit", rarity: "legendary", price: null, event: "orbit-of-the-hornbill", value: "hornbill", swatch: ["#0b0f0a", "#1c261a", "#ff9f1c"], description: "From the demo sponsor campaign for “Orbit of the Hornbill”." },

  // ── Stickers (slap them on reviews) ──
  { id: "st_popcorn", type: "sticker", anim: "bounce", name: "Nom Nom", rarity: "common", price: 0, starter: true, value: "🍿", description: "Grabbing popcorn for this thread." },
  { id: "st_cry", type: "sticker", anim: "shake", name: "Crying in the Club", rarity: "common", price: 0, starter: true, value: "😭", description: "Not okay. Never okay." },
  { id: "st_fire", type: "sticker", anim: "pulse", name: "Masterpiece", rarity: "common", price: 0, starter: true, value: "🔥", description: "This review goes hard." },
  { id: "st_mindblown", type: "sticker", anim: "wobble", name: "Plot Twist!", rarity: "common", price: 0, starter: true, value: "🤯", description: "Did NOT see that coming." },
  { id: "st_skull", type: "sticker", anim: "wobble", name: "I'm Dead", rarity: "common", price: 40, value: "💀", description: "Deceased. Laughed too hard." },
  { id: "st_sleep", type: "sticker", anim: "float", name: "Snoozefest", rarity: "common", price: 40, value: "😴", description: "Brave of you to sit through it." },
  { id: "st_chefkiss", type: "sticker", anim: "pulse", name: "Chef's Kiss", rarity: "common", price: 40, value: "🤌", description: "Perfection. No notes." },
  { id: "st_eyes", type: "sticker", anim: "shake", name: "Spoiler Eyes", rarity: "rare", price: 80, value: "🫣", description: "Peeking through my fingers." },
  { id: "st_durian", type: "sticker", anim: "spin", name: "Durian-Level Take", rarity: "rare", price: 120, value: "svg:durian", description: "Spiky, smelly, strangely beloved." },
  // event stickers
  { id: "st_rocket", type: "sticker", anim: "float", name: "Hyperdrive", rarity: "rare", price: null, event: "space-opera-day", value: "🚀", description: "Making the jump to lightspeed." },
  { id: "st_galaxy", type: "sticker", anim: "spin", name: "Galaxy Brain", rarity: "rare", price: null, event: "space-opera-day", value: "🌌", description: "A take from a galaxy far, far away." },
  { id: "st_robot", type: "sticker", anim: "bounce", name: "Beep Boop", rarity: "rare", price: null, event: "space-opera-day", value: "🤖", description: "Translation: “great review”." },
  { id: "st_pumpkin", type: "sticker", anim: "wobble", name: "Jack-o'-Lantern", rarity: "rare", price: null, event: "halloween", value: "🎃", description: "Spooky season approved." },
  { id: "st_ghost", type: "sticker", anim: "float", name: "Boo!", rarity: "rare", price: null, event: "halloween", value: "👻", description: "Hantu was here." },
  { id: "st_candle", type: "sticker", anim: "pulse", name: "Pelita Hantu", rarity: "rare", price: null, event: "halloween", value: "🕯️", description: "Don't blow it out." },
  { id: "st_angpao", type: "sticker", anim: "bounce", name: "Ang Pao", rarity: "rare", price: null, event: "lunar-new-year", value: "🧧", description: "Huat ah!" },
  { id: "st_dragon", type: "sticker", anim: "wobble", name: "Dragon Dance", rarity: "rare", price: null, event: "lunar-new-year", value: "🐉", description: "Gong xi fa cai!" },
  { id: "st_mandarin", type: "sticker", anim: "bounce", name: "Mandarin Oranges", rarity: "rare", price: null, event: "lunar-new-year", value: "🍊", description: "Two for luck." },
  { id: "st_crescent", type: "sticker", anim: "float", name: "Selamat Hari Raya", rarity: "rare", price: null, event: "hari-raya", value: "🌙", description: "Maaf zahir dan batin." },
  { id: "st_pelita", type: "sticker", anim: "pulse", name: "Pelita", rarity: "rare", price: null, event: "hari-raya", value: "🪔", description: "Lighting the way home." },
  { id: "st_water", type: "sticker", anim: "bounce", name: "Splash!", rarity: "rare", price: null, event: "songkran", value: "💦", description: "Sawasdee pee mai!" },
  { id: "st_watergun", type: "sticker", anim: "shake", name: "Water Gun", rarity: "rare", price: null, event: "songkran", value: "🔫", description: "Locked and loaded (with water)." },
  { id: "st_mooncake", type: "sticker", anim: "pulse", name: "Mooncake", rarity: "rare", price: null, event: "mid-autumn", value: "🥮", description: "Lotus paste, double yolk." },
  { id: "st_rabbit", type: "sticker", anim: "bounce", name: "Jade Rabbit", rarity: "rare", price: null, event: "mid-autumn", value: "🐇", description: "Pounding elixirs on the moon." },
  { id: "st_fireworks", type: "sticker", anim: "pulse", name: "Fireworks", rarity: "rare", price: null, event: "diwali", value: "🎆", description: "Shubh Deepavali!" },
  { id: "st_tree", type: "sticker", anim: "wobble", name: "Christmas Tree", rarity: "rare", price: null, event: "christmas", value: "🎄", description: "Tinsel on everything." },
  { id: "st_snow", type: "sticker", anim: "spin", name: "Tropical Snow", rarity: "rare", price: null, event: "christmas", value: "❄️", description: "The only snow SEA will ever see." },
  { id: "st_rewind", type: "sticker", anim: "spin", name: "Rewound", rarity: "epic", price: null, event: "rewind-season", value: "⏪", description: "I watched my year back." },
  { id: "st_hornbill", type: "sticker", anim: "float", name: "To the Moon", rarity: "epic", price: null, event: "orbit-of-the-hornbill", value: "🌕", description: "From the demo “Orbit of the Hornbill” campaign." },
  { id: "st_feather", type: "sticker", anim: "float", name: "Hornbill Feather", rarity: "epic", price: null, event: "orbit-of-the-hornbill", value: "🪶", description: "From the demo “Orbit of the Hornbill” campaign." },
  // event frames
  { id: "fr_hornbill", type: "frame", name: "Hornbill Halo", rarity: "legendary", price: null, event: "orbit-of-the-hornbill", value: "frame-hornbill", orbit: ["🪶", "🪶"], crown: "🌕", description: "Demo sponsor exclusive. Gone when the campaign ends." },
  { id: "fr_lightspeed", type: "frame", name: "Lightspeed", rarity: "legendary", price: null, event: "space-opera-day", value: "frame-lightspeed", orbit: ["🚀"], description: "Streaking starlight. One day a year." },
  // ── Avatar decorations (new) ──
  { id: "fr_bungaraya", type: "frame", name: "Bunga Raya", rarity: "epic", price: 600, value: "frame-bungaraya", orbit: ["🌺", "🌺", "🌺", "🌺"], description: "Malaysia's hibiscus, circling in full bloom." },
  { id: "fr_lanterns", type: "frame", name: "Lantern Parade", rarity: "epic", price: 700, value: "frame-lantern", orbit: ["🏮", "🏮", "🏮"], description: "Three lanterns on an endless night walk." },
  { id: "fr_kucing", type: "frame", name: "Kucing Ears", rarity: "rare", price: 350, value: "frame-kucing", ears: true, description: "Every kopitiam has a cat. Now you are the cat." },
  { id: "fr_kopi", type: "frame", name: "Kopi Steam", rarity: "rare", price: 300, value: "frame-kopi", crown: "☕", description: "Fresh from the kopitiam, still steaming." },
  { id: "fr_wau", type: "frame", name: "Wau Bulan", rarity: "legendary", price: 1400, value: "frame-wau", orbit: ["🪁", "✨"], crown: "🌙", description: "The moon kite of Kelantan, soaring round and round." },
  { id: "fr_durian", type: "frame", name: "Durian Orbit", rarity: "legendary", price: 1600, value: "frame-durian", orbit: ["svg:durian", "svg:durian", "svg:durian"], description: "Three kings of fruit in orbit. Neighbours not consulted." },

  // ── Profile effects (play over your profile card) ──
  { id: "ef_popcorn", type: "effect", name: "Popcorn Storm", rarity: "common", price: 150, value: "popcorn", particles: ["🍿"], motion: "rise", description: "The bucket overfloweth." },
  { id: "ef_petals", type: "effect", name: "Bunga Raya Breeze", rarity: "rare", price: 300, value: "petals", particles: ["🌺", "🌸"], motion: "fall", description: "Petals drifting down your profile." },
  { id: "ef_rain", type: "effect", name: "4pm Monsoon", rarity: "rare", price: 300, value: "rain", particles: ["💧"], motion: "streak", description: "Like clockwork, every afternoon." },
  { id: "ef_confetti", type: "effect", name: "Premiere Night", rarity: "rare", price: 350, value: "confetti", particles: ["🎊", "✨", "🎉"], motion: "fall", description: "Red carpet energy." },
  { id: "ef_lanterns", type: "effect", name: "Lantern Release", rarity: "epic", price: 600, value: "lanterns", particles: ["🏮"], motion: "rise", description: "Wishes floating up into the night." },
  { id: "ef_fireflies", type: "effect", name: "Kelip-Kelip", rarity: "epic", price: 650, value: "fireflies", particles: ["dot"], motion: "twinkle", description: "The fireflies of Kuala Selangor, blinking in sync." },
  { id: "ef_hyperspace", type: "effect", name: "Hyperspace Jump", rarity: "legendary", price: null, event: "space-opera-day", value: "hyperspace", particles: ["dash"], motion: "streak", description: "Punch it! Stars stretch into lines." },
  { id: "ef_bats", type: "effect", name: "Hantu Flight", rarity: "epic", price: null, event: "halloween", value: "bats", particles: ["🦇", "👻"], motion: "drift", description: "Something is flying around your profile." },
  { id: "ef_snow", type: "effect", name: "Tropical Snowfall", rarity: "epic", price: null, event: "christmas", value: "snow", particles: ["❄️", "•"], motion: "fall", description: "Finally, snow in Southeast Asia." },

  // ── Name styles (your display name, everywhere) ──
  { id: "ns_jade", type: "namestyle", name: "Jade", rarity: "common", price: 120, value: "ns-jade", description: "Cool green gradient." },
  { id: "ns_sunset", type: "namestyle", name: "Senja", rarity: "rare", price: 200, value: "ns-sunset", description: "Sunset at the beach, in letters." },
  { id: "ns_pelangi", type: "namestyle", name: "Pelangi", rarity: "rare", price: 300, value: "ns-pelangi", description: "A rainbow that never stops moving." },
  { id: "ns_batik", type: "namestyle", name: "Batik", rarity: "epic", price: 500, value: "ns-batik", description: "Your name, printed in wax-resist dye." },
  { id: "ns_neon", type: "namestyle", name: "Pasar Malam Neon", rarity: "epic", price: 450, value: "ns-neon", description: "Flickering like a night-market sign." },
  { id: "ns_songket", type: "namestyle", name: "Songket Gold", rarity: "legendary", price: 900, value: "ns-songket", description: "Woven gold thread that catches the light." },
  { id: "ns_hyperspace", type: "namestyle", name: "Hyperspace", rarity: "epic", price: null, event: "space-opera-day", value: "ns-hyperspace", description: "Glowing like a crawl in deep space." },
];

export const ITEM_BY_ID: Record<string, ShopItem> = Object.assign(Object.create(null), Object.fromEntries(ITEMS.map((i) => [i.id, i])));
export const STARTER_ITEMS = ITEMS.filter((i) => i.starter).map((i) => i.id);
export const DEFAULT_AVATAR = "av_popcorn";

/** Themed bundles: everything in one go, cheaper than buying separately. */
export type Bundle = { id: string; name: string; blurb: string; items: string[]; price: number; colors: [string, string] };

export const BUNDLES: Bundle[] = [
  { id: "bd_kampung", name: "Kampung Days", blurb: "Padi fields, fireflies and a carabao who's seen it all.", items: ["av_carabao", "fr_bungaraya", "ef_fireflies", "bn_padi", "ns_jade"], price: 1300, colors: ["#14532d", "#a3e635"] },
  { id: "bd_pasarmalam", name: "Pasar Malam", blurb: "Satay smoke, neon signs and lanterns overhead.", items: ["av_satay", "fr_neon", "ef_lanterns", "bn_neon", "ns_neon"], price: 1700, colors: ["#4c1d95", "#ff2fd6"] },
  { id: "bd_royalty", name: "Panggung Royalty", blurb: "For the ones who own the cinema (or act like it).", items: ["av_wayang", "fr_songket", "ef_confetti", "ns_songket", "ti_tauke"], price: 4200, colors: ["#78350f", "#fde68a"] },
];

export function bundlePrice(b: Bundle, owned: Set<string>): number {
  const value = (id: string) => ITEM_BY_ID[id]?.price ?? 0;
  const total = b.items.reduce((a, id) => a + value(id), 0) || 1;
  const missing = b.items.filter((id) => !owned.has(id)).reduce((a, id) => a + value(id), 0);
  return Math.round((b.price * missing) / total);
}
