import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./password";
import { STARTER_ITEMS } from "./shop";

/** Demo community so the app feels alive on first run. Password for all: kisah123 */
const USERS = [
  { username: "aisyah", name: "Aisyah", country: "MY", bio: "Kopi peng, Joko Anwar marathons and crying at every Chiu Keng Guan film.", points: 1240, avatar: "av_tiger", frame: "fr_gold", banner: "bn_padi", title: "ti_popcorn", owns: ["av_tiger", "fr_gold", "bn_padi", "ti_popcorn"] },
  { username: "budi", name: "Budi Santoso", country: "ID", bio: "Horror is the national genre. Fight me.", points: 860, avatar: "av_komodo", frame: "fr_batik", banner: "bn_monsoon", title: null, owns: ["av_komodo", "fr_batik", "bn_monsoon"] },
  { username: "nong", name: "Nong Ploy", country: "TH", bio: "GDH apologist. Will cry at anything with a grandma in it.", points: 540, avatar: "av_elephant", frame: "fr_neon", banner: "bn_neon", title: "ti_subtitle", owns: ["av_elephant", "fr_neon", "bn_neon", "ti_subtitle"] },
  { username: "migs", name: "Migs Reyes", country: "PH", bio: "Cinemalaya kid. Heneral Luna changed my life.", points: 410, avatar: "av_jeepney", frame: null, banner: "bn_sunset", title: null, owns: ["av_jeepney", "bn_sunset"] },
  { username: "linh", name: "Linh Trần", country: "VN", bio: "Phở first, films second. Tết box office is my Olympics.", points: 330, avatar: "av_pho", frame: "fr_jade", banner: null, title: "ti_setia", owns: ["av_pho", "fr_jade", "ti_setia"] },
  { username: "weijie", name: "Wei Jie", country: "SG", bio: "NS survivor. Anthony Chen stan. Sub-titles always on.", points: 720, avatar: "av_boba", frame: null, banner: "bn_lantern", title: "ti_ninja", owns: ["av_boba", "bn_lantern", "ti_ninja"] },
  { username: "kurator", name: "KisahKisah Team", country: "MY", bio: "The people behind the Kedai. Demo staff account.", points: 0, avatar: "av_clapper", frame: null, banner: null, title: null, owns: [] },
  { username: "studio", name: "Kenyalang Pictures", country: "MY", bio: "Demo partner account: a fictional studio.", points: 0, avatar: "av_clapper", frame: null, banner: null, title: null, owns: [] },
  { username: "nadia", name: "Nadia Rahman", country: "MY", bio: "Demo artist account. Stickers, kawaii hantu and batik patterns.", points: 0, avatar: "av_lotus", frame: null, banner: null, title: null, owns: [] },
  { username: "camille", name: "Camille", country: "FR", bio: "Parisienne who fell for Southeast Asian cinema at Cannes. Apichatpong forever.", points: 380, avatar: "av_lotus", frame: null, banner: "bn_sunset", title: "ti_subtitle", owns: ["av_lotus", "bn_sunset", "ti_subtitle"] },
  { username: "tunde", name: "Tunde", country: "NG", bio: "Lagos. Nollywood, K-dramas and anything with a heist.", points: 290, avatar: "av_tuktuk", frame: null, banner: null, title: null, owns: ["av_tuktuk"] },
  { username: "jiwoo", name: "Ji-woo", country: "KR", bio: "Visiting from Seoul. Will defend Park Chan-wook in any court.", points: 950, avatar: "av_lantern", frame: "fr_songket", banner: null, title: null, owns: ["av_lantern", "fr_songket"] },
];

type GameSeed =
  | { type: "none" }
  | { type: "guess_rating" }
  | { type: "popcorn" }
  | { type: "trivia"; question: string; options: string[]; answer: number }
  | { type: "emoji"; emojis: string; film: string };

type ReviewSeed = {
  user: string; film: string; rating: number; body: string; daysAgo: number; spoiler?: boolean;
  game?: GameSeed; links?: string[];
};

const REVIEWS: ReviewSeed[] = [
  { user: "aisyah", film: "ola-bola-2016", rating: 4.5, daysAgo: 1, body: "Watched this with my dad, who was actually at Merdeka Stadium in 1980. He said nothing for two hours and then just said \"betul\" at the end. That's a five-star review from him. The commentary scenes are pure goosebumps.",
    game: { type: "trivia", question: "Which tournament are the team trying to qualify for?", options: ["SEA Games", "1980 Olympics", "Asian Cup", "World Cup 1982"], answer: 1 } },
  { user: "budi", film: "satans-slaves-2017", rating: 5, daysAgo: 2, body: "The bell. THE BELL. I haven't slept properly since 2017. Joko Anwar understands that Indonesian horror is really about family obligation and grief. The ghosts are just the delivery mechanism.",
    game: { type: "guess_rating" }, links: ["https://letterboxd.com/budi/film/satans-slaves/"] },
  { user: "nong", film: "how-to-make-millions-2024", rating: 5, daysAgo: 3, body: "Brought tissues. Not enough tissues. Every Thai-Chinese grandchild in the cinema was quietly destroyed. Usha Seamkhum's performance as Amah is unbelievably restrained.",
    game: { type: "emoji", emojis: "👵🏻🥣💰🏠😭", film: "how-to-make-millions-2024" } },
  { user: "jiwoo", film: "decision-to-leave-2022", rating: 5, daysAgo: 4, body: "Park Chan-wook made a romance where every glance is evidence. The translation-app conversations are the most romantic thing I've seen on screen in years. Mountain/sea, collapsed into one.",
    game: { type: "trivia", question: "What does the detective suffer from?", options: ["Amnesia", "Insomnia", "Vertigo", "Colour blindness"], answer: 1 },
    links: ["https://pedia.watcha.com/ko-KR/contents/decision-to-leave"] },
  { user: "migs", film: "heneral-luna-2015", rating: 4.5, daysAgo: 5, body: "Bayan o sarili? John Arcilla shouting at the cabinet is the most cathartic thing in Philippine cinema. Required viewing for every Filipino, and honestly for everyone in the region with a colonial history.",
    game: { type: "popcorn" } },
  { user: "weijie", film: "ilo-ilo-2013", rating: 5, daysAgo: 6, body: "Every Singaporean 90s kid had a Teresa. Anthony Chen gets the small details exactly right: the Tamagotchi, the retrenchment letter, the HDB corridor heat. Quietly devastating.",
    game: { type: "guess_rating" } },
  { user: "linh", film: "dad-im-sorry-2021", rating: 4, daysAgo: 7, body: "Watched it during Tết with three generations of my family, and all three generations were crying at different scenes. Trấn Thành knows exactly which buttons to press, and I let him.",
    game: { type: "trivia", question: "What does the son do for a living?", options: ["Street food vendor", "YouTuber", "Motorbike mechanic", "Doctor"], answer: 1 } },
  { user: "aisyah", film: "tiger-stripes-2023", rating: 4, daysAgo: 8, body: "Body horror as a coming-of-age story for Malaysian girls. Amanda Nell Eu takes something everyone is too shy to talk about and makes it roar. The forest sequences are gorgeous.", spoiler: true,
    game: { type: "emoji", emojis: "👧🐯🌳🏫", film: "tiger-stripes-2023" } },
  { user: "budi", film: "the-raid-2011", rating: 4.5, daysAgo: 9, body: "Silat on screen like never before. Iko Uwais in a hallway with a stick is worth the ticket alone. The plot? There's a building. There are floors. That's all you need.", game: { type: "popcorn" } },
  { user: "jiwoo", film: "parasite-2019", rating: 5, daysAgo: 10, body: "Showed this to my Malaysian housemates and we spent the night arguing about stairs. That's the mark of a great film: it makes you look at architecture differently.", spoiler: true,
    game: { type: "guess_rating" }, links: ["https://letterboxd.com/jiwoo/film/parasite-2019/"] },
  { user: "nong", film: "bad-genius-2017", rating: 4.5, daysAgo: 11, body: "Who knew multiple-choice exams could be more tense than a heist film? The piano-finger cheating code is iconic. Every Asian student felt this in their bones.",
    game: { type: "trivia", question: "Lynn's cheating system relies on...", options: ["Hand signals based on piano chords", "Smartwatches", "Hidden earpieces", "Morse code tapping"], answer: 0 } },
  { user: "weijie", film: "in-the-mood-for-love-2000", rating: 5, daysAgo: 12, body: "Maggie Cheung's cheongsams deserve their own credit. Every frame is a postcard you'll never send. Rewatched it on a rainy afternoon and it felt like a memory of my own.",
    game: { type: "emoji", emojis: "🌹👗🍜🚬🌧️", film: "in-the-mood-for-love-2000" } },
  { user: "migs", film: "hello-love-goodbye-2019", rating: 4, daysAgo: 13, body: "For every OFW and every family that waved goodbye at NAIA. Kathryn and Alden are electric. The Hong Kong locations feel lived in, not touristy.", game: { type: "none" } },
  { user: "linh", film: "the-third-wife-2018", rating: 4, daysAgo: 15, body: "Beautiful and suffocating at the same time. The silk-worm imagery will stay with me. Not an easy watch, but an important one.", game: { type: "guess_rating" } },
  { user: "aisyah", film: "upin-ipin-keris-siamang-tunggal-2019", rating: 4, daysAgo: 16, body: "Betul betul betul! My nephews made me watch it twice. The animation is a huge leap and the gibbon is the real MVP. Malaysian animation boleh!",
    game: { type: "trivia", question: "What are Upin & Ipin's famous three words?", options: ["Boleh boleh boleh", "Betul betul betul", "Jom jom jom", "Lagi lagi lagi"], answer: 1 } },
  { user: "camille", film: "uncle-boonmee-2010", rating: 5, daysAgo: 3, body: "I saw this at Cannes the year it won the Palme d'Or and it changed what I thought cinema could be. Ghosts at the dinner table, a catfish princess, red-eyed monkey spirits: it's all so gentle. Now I'm working through every Southeast Asian film on this site.",
    game: { type: "guess_rating" }, links: ["https://www.senscritique.com/film/oncle_boonmee/"] },
  { user: "tunde", film: "squid-game-2021", rating: 4, daysAgo: 2, body: "Binged all of it in one weekend in Lagos with my cousins shouting at the screen. The marbles episode broke all of us. Nollywood, take notes: this is how you do a cliffhanger.",
    game: { type: "trivia", question: "Which game do players face in the first round?", options: ["Tug of war", "Red Light, Green Light", "Marbles", "Glass bridge"], answer: 1 } },
];

const COMMENTS: [string, number, string][] = [
  ["budi", 0, "Ola Bola made my Malaysian colleagues cry at the office screening 😂"],
  ["weijie", 0, "Your dad's review is the best review on this whole site."],
  ["aisyah", 1, "I made the mistake of watching this alone at 1am. Never again."],
  ["jiwoo", 1, "Joko Anwar's horror is basically Korean family melodrama with ghosts. I love it."],
  ["linh", 2, "Grandma films are my weakness too 😭"],
  ["nong", 3, "The ending at the beach… I'm still not okay."],
  ["aisyah", 4, "Bayan o sarili?! Chills."],
  ["migs", 5, "Teresa is the real hero of this movie."],
];

const LISTS = [
  { user: "aisyah", title: "Starter Pack: Southeast Asian Cinema", description: "One film per country to start your jalan-jalan around the region.", ranked: false,
    films: ["ola-bola-2016", "satans-slaves-2017", "bad-genius-2017", "heneral-luna-2015", "ilo-ilo-2013", "the-third-wife-2018", "the-missing-picture-2013", "the-long-walk-2019"] },
  { user: "budi", title: "Nusantara Nightmares", description: "Ranked: the scariest films from the archipelago (and next door).", ranked: true,
    films: ["satans-slaves-2017", "impetigore-2019", "shutter-2004", "tiger-stripes-2023", "agak-laen-2024"] },
  { user: "nong", title: "Films to Watch With Your Ah Ma", description: "Bring the whole family, and tissues.", ranked: false,
    films: ["how-to-make-millions-2024", "hi-mom-2021", "dad-im-sorry-2021", "yi-yi-2000", "shoplifters-2018"] },
  { user: "jiwoo", title: "Hallyu 101", description: "Where to begin with Korean cinema.", ranked: true,
    films: ["parasite-2019", "oldboy-2003", "train-to-busan-2016", "decision-to-leave-2022", "exhuma-2024"] },
];

const FAVORITES: Record<string, string[]> = {
  aisyah: ["ola-bola-2016", "the-journey-2014", "in-the-mood-for-love-2000", "spirited-away-2001"],
  budi: ["satans-slaves-2017", "the-raid-2011", "marlina-2017", "train-to-busan-2016"],
  nong: ["bad-genius-2017", "how-to-make-millions-2024", "pee-mak-2013", "your-name-2016"],
  jiwoo: ["decision-to-leave-2022", "parasite-2019", "oldboy-2003", "yi-yi-2000"],
  weijie: ["ilo-ilo-2013", "in-the-mood-for-love-2000", "yi-yi-2000", "perfect-days-2023"],
  migs: ["heneral-luna-2015", "four-sisters-and-a-wedding-2013"],
  linh: ["scent-of-green-papaya-1993", "dad-im-sorry-2021", "mai-2024"],
};

/** Extra diary entries (no review) so profiles have history. [user, film, rating, daysAgo] */
const EXTRA_LOGS: [string, string, number, number][] = [
  ["aisyah", "the-journey-2014", 5, 30], ["aisyah", "mat-kilau-2022", 3.5, 40], ["aisyah", "satans-slaves-2017", 4, 45], ["aisyah", "bad-genius-2017", 4.5, 50],
  ["aisyah", "in-the-mood-for-love-2000", 5, 60], ["aisyah", "spirited-away-2001", 5, 80], ["aisyah", "abang-adik-2023", 4.5, 20],
  ["budi", "impetigore-2019", 4.5, 25], ["budi", "agak-laen-2024", 4, 18], ["budi", "marlina-2017", 4.5, 33], ["budi", "shutter-2004", 4, 70], ["budi", "train-to-busan-2016", 4.5, 90],
  ["nong", "pee-mak-2013", 4, 20], ["nong", "shutter-2004", 3.5, 35], ["nong", "uncle-boonmee-2010", 3, 66], ["nong", "your-name-2016", 5, 100],
  ["jiwoo", "oldboy-2003", 5, 50], ["jiwoo", "exhuma-2024", 4, 22], ["jiwoo", "train-to-busan-2016", 4, 44], ["jiwoo", "yi-yi-2000", 5, 120],
  ["weijie", "ah-boys-to-men-2012", 3, 40], ["weijie", "crazy-rich-asians-2018", 3.5, 60], ["weijie", "perfect-days-2023", 5, 14],
  ["migs", "four-sisters-and-a-wedding-2013", 4, 30], ["migs", "breaking-bad-2008", 5, 12],
  // series
  ["aisyah", "upin-ipin-series-2007", 4, 9], ["aisyah", "squid-game-2021", 4, 75], ["aisyah", "crash-landing-on-you-2019", 4.5, 110],
  ["budi", "cigarette-girl-2023", 5, 15], ["budi", "dark-2017", 4.5, 60],
  ["nong", "girl-from-nowhere-2018", 4.5, 8], ["nong", "crash-landing-on-you-2019", 4, 95],
  ["jiwoo", "squid-game-2021", 4, 70], ["jiwoo", "midnight-diner-2009", 5, 30],
  ["weijie", "phua-chu-kang-1997", 4, 25], ["weijie", "fleabag-2016", 5, 55],
  ["linh", "someday-or-one-day-2019", 4.5, 40],
  // the world
  ["aisyah", "pans-labyrinth-2006", 4.5, 100], ["aisyah", "paddington-2-2017", 5, 140],
  ["camille", "amelie-2001", 4, 90], ["camille", "cinema-paradiso-1988", 5, 70], ["camille", "in-the-mood-for-love-2000", 5, 50], ["camille", "ilo-ilo-2013", 4.5, 20],
  ["camille", "the-third-wife-2018", 4, 25], ["camille", "a-separation-2011", 5, 110], ["camille", "roma-2018", 4.5, 130], ["camille", "dark-2017", 4, 33], ["camille", "fleabag-2016", 4.5, 44],
  ["tunde", "the-wedding-party-2016", 4.5, 60], ["tunde", "everything-everywhere-2022", 5, 40], ["tunde", "mad-max-fury-road-2015", 4.5, 80], ["tunde", "money-heist-2017", 4, 50],
  ["tunde", "city-of-god-2002", 5, 100], ["tunde", "star-wars-1977", 4, 120], ["tunde", "the-raid-2011", 4.5, 18], ["tunde", "breaking-bad-2008", 5, 140], ["linh", "scent-of-green-papaya-1993", 4.5, 28], ["linh", "mai-2024", 3.5, 21],
];

const FOLLOWS: [string, string][] = [
  ["camille", "aisyah"], ["camille", "nong"], ["tunde", "budi"], ["tunde", "jiwoo"], ["aisyah", "camille"],
  ["aisyah", "budi"], ["aisyah", "nong"], ["aisyah", "jiwoo"], ["budi", "aisyah"], ["nong", "aisyah"], ["jiwoo", "weijie"],
  ["weijie", "aisyah"], ["migs", "aisyah"], ["linh", "nong"], ["linh", "aisyah"],
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
}

function dateTimeAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString().replace("T", " ").slice(0, 19);
}

export function seed(d: DatabaseSync) {
  // Films are inserted by syncCatalog() in db.ts before seeding.
  const filmId = (slug: string) => (d.prepare("SELECT id FROM films WHERE slug = ?").get(slug) as { id: number }).id;

  const hash = hashPassword("kisah123");
  const uid: Record<string, number> = {};
  const insUser = d.prepare(
    "INSERT INTO users (username, display_name, password_hash, bio, home_country, points, avatar_item, frame_item, banner_item, title_item, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  );
  const insInv = d.prepare("INSERT OR IGNORE INTO inventory (user_id, item_id, source) VALUES (?,?,?)");
  const insLedger = d.prepare("INSERT OR IGNORE INTO points_ledger (user_id, delta, reason, ref, label, created_at) VALUES (?,?,?,?,?,?)");
  USERS.forEach((u, i) => {
    const r = insUser.run(u.username, u.name, hash, u.bio, u.country, u.points, u.avatar, u.frame, u.banner, u.title, dateTimeAgo(200 - i * 10));
    const id = Number(r.lastInsertRowid);
    uid[u.username] = id;
    for (const it of STARTER_ITEMS) insInv.run(id, it, "starter");
    for (const it of u.owns) insInv.run(id, it, "shop");
    insLedger.run(id, u.points, "seed", "opening-balance", "Founding member bonus", dateTimeAgo(200 - i * 10));
  });

  d.prepare("UPDATE users SET role = 'admin' WHERE username = 'kurator'").run();

  // Demo partner team with a campaign at the brief stage, and a demo approved artist with open briefs.
  const org = Number(d.prepare("INSERT INTO orgs (name) VALUES (?)").run("Kenyalang Pictures (demo)").lastInsertRowid);
  d.prepare("INSERT INTO org_members (org_id, user_id) VALUES (?,?)").run(org, uid.studio);
  d.prepare(
    "INSERT INTO campaigns (org_id, title, package, markets, tagline, synopsis, release_date, motif, country, color1, color2) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).run(org, "Pulau Hantu", "trailer", "MY,SG,ID", "Some islands should stay uninhabited.", "Five friends on a cheap island getaway find out why the boatman wouldn't stay the night. (Fictional demo campaign.)", null, "🏝️", "MY", "#0f766e", "#111827");
  d.prepare("INSERT INTO artist_profiles (user_id, portfolio_url, bio, specialities, payout_details, status, reviewed_at) VALUES (?,?,?,?,?, 'approved', datetime('now'))")
    .run(uid.nadia, "https://example.com/nadia-portfolio", "Illustrator from Ipoh. Cute-scary is my thing.", "sticker,frame", "DuitNow: demo");
  const brief = d.prepare("INSERT INTO briefs (title, description, item_type, quantity, fee_amount, fee_currency, due_on, event, created_by) VALUES (?,?,?,?,?,?,?,?,?)");
  brief.run("Hantu Week 2027 sticker pack", "Four cute-but-creepy Southeast Asian ghosts: pontianak, pocong, toyol, penanggal. Readable at 24px, bold outlines, transparent background.", "sticker", 4, 40000, "USD", null, "halloween", uid.kurator);
  brief.run("Lunar New Year avatar decorations", "Two decorations: lanterns and mandarin oranges orbiting, red and gold. Keep the centre clear for the avatar.", "frame", 2, 120000, "MYR", null, "lunar-new-year", uid.kurator);

  // Nitro/Steam-style customisation for the demo community
  const COSMETICS: Record<string, { frame: string; effect?: string; namestyle?: string; a1: string; a2: string; showcases: string[]; board?: [string, number, number, number][] }> = {
    aisyah: { frame: "fr_bungaraya", effect: "ef_petals", namestyle: "ns_sunset", a1: "#fb923c", a2: "#db2777", showcases: ["favorites", "stickers", "achievements", "review"],
      board: [["st_fire", 14, 40, -12], ["st_cry", 30, 62, 10], ["st_popcorn", 48, 35, -6], ["st_mindblown", 66, 58, 14], ["st_durian", 84, 38, -18]] },
    budi: { frame: "fr_batik", effect: "ef_rain", namestyle: "ns_batik", a1: "#b45309", a2: "#19b38a", showcases: ["favorites", "review", "stickers", "stats"],
      board: [["st_skull", 22, 45, -10], ["st_eyes", 50, 55, 8], ["st_fire", 76, 42, -4]] },
    nong: { frame: "fr_neon", effect: "ef_lanterns", namestyle: "ns_neon", a1: "#ff2fd6", a2: "#22d3ee", showcases: ["stickers", "favorites", "collection"],
      board: [["st_cry", 18, 50, -14], ["st_chefkiss", 42, 40, 6], ["st_popcorn", 64, 60, -8], ["st_mindblown", 84, 45, 12]] },
    jiwoo: { frame: "fr_songket", effect: "ef_fireflies", namestyle: "ns_songket", a1: "#fde68a", a2: "#b45309", showcases: ["favorites", "achievements", "collection", "stats"] },
    weijie: { frame: "fr_kucing", effect: "ef_popcorn", namestyle: "ns_jade", a1: "#34d399", a2: "#0e7490", showcases: ["favorites", "stickers", "stats"],
      board: [["st_sleep", 30, 50, -10], ["st_popcorn", 60, 48, 12]] },
    camille: { frame: "fr_lanterns", effect: "ef_confetti", namestyle: "ns_pelangi", a1: "#a78bfa", a2: "#6d28d9", showcases: ["review", "favorites", "stats"] },
    tunde: { frame: "fr_kopi", namestyle: "ns_sunset", a1: "#f59e0b", a2: "#b91c1c", showcases: ["favorites", "stats", "achievements"] },
  };
  const setLook = d.prepare("UPDATE users SET frame_item = ?, effect_item = ?, namestyle_item = ?, accent1 = ?, accent2 = ?, showcases = ? WHERE id = ?");
  const insBoard = d.prepare("INSERT INTO profile_stickers (user_id, item_id, x, y, rot, scale, z) VALUES (?,?,?,?,?,?,?)");
  for (const [u, c] of Object.entries(COSMETICS)) {
    for (const it of [c.frame, c.effect, c.namestyle, ...(c.board ?? []).map((b) => b[0])]) if (it) insInv.run(uid[u], it, "shop");
    setLook.run(c.frame, c.effect ?? null, c.namestyle ?? null, c.a1, c.a2, JSON.stringify(c.showcases), uid[u]);
    (c.board ?? []).forEach(([it, x, y, rot], i) => insBoard.run(uid[u], it, x, y, rot, 1 + (i % 3) * 0.15, i));
  }

  const insLog = d.prepare(
    "INSERT INTO logs (user_id, film_id, watched_on, rating, liked, rewatch, cinema_chain, local_hour, created_at) VALUES (?,?,?,?,?,0,?,20,?)",
  );
  const insReview = d.prepare(
    "INSERT INTO reviews (user_id, film_id, rating, body, spoiler, game_type, game_config, external_links, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  const reviewIds: number[] = [];
  for (const r of REVIEWS) {
    const fid = filmId(r.film);
    insLog.run(uid[r.user], fid, daysAgo(r.daysAgo), r.rating, r.rating >= 4.5 ? 1 : 0, null, dateTimeAgo(r.daysAgo));
    const { type, ...config } = r.game ?? { type: "none" };
    const cfg = type === "emoji" ? { emojis: (config as { emojis: string }).emojis, filmId: filmId((config as { film: string }).film) } : config;
    const res = insReview.run(uid[r.user], fid, r.rating, r.body, r.spoiler ? 1 : 0, type, JSON.stringify(cfg), JSON.stringify(r.links ?? []), dateTimeAgo(r.daysAgo));
    reviewIds.push(Number(res.lastInsertRowid));
  }
  for (const [u, film, rating, ago] of EXTRA_LOGS) {
    insLog.run(uid[u], filmId(film), daysAgo(ago), rating, rating >= 5 ? 1 : 0, null, dateTimeAgo(ago));
  }

  const insLike = d.prepare("INSERT OR IGNORE INTO review_likes (review_id, user_id) VALUES (?,?)");
  reviewIds.forEach((rid, i) => {
    USERS.forEach((u, j) => {
      if ((i * 7 + j * 3) % 4 !== 0 && REVIEWS[i].user !== u.username) insLike.run(rid, uid[u.username]);
    });
  });

  // Sticker reactions with the free starter pack
  const insSticker = d.prepare("INSERT OR IGNORE INTO review_stickers (review_id, user_id, sticker_id) VALUES (?,?,?)");
  const starterStickers = ["st_fire", "st_cry", "st_mindblown", "st_popcorn"];
  reviewIds.forEach((rid, i) => {
    USERS.forEach((u, j) => {
      if ((i + j) % 3 === 0 && REVIEWS[i].user !== u.username) insSticker.run(rid, uid[u.username], starterStickers[(i * 2 + j) % 4]);
    });
  });

  const insComment = d.prepare("INSERT INTO comments (review_id, user_id, body, created_at) VALUES (?,?,?,?)");
  COMMENTS.forEach(([u, ri, body], i) => insComment.run(reviewIds[ri], uid[u], body, dateTimeAgo(REVIEWS[ri].daysAgo - 0.2 - i * 0.01)));

  const insList = d.prepare("INSERT INTO lists (user_id, title, description, ranked, created_at, share_token, visibility) VALUES (?,?,?,?,?, lower(hex(randomblob(5))), 'public')");
  const insItem = d.prepare("INSERT INTO list_items (list_id, film_id, position) VALUES (?,?,?)");
  LISTS.forEach((l, i) => {
    const lid = Number(insList.run(uid[l.user], l.title, l.description, l.ranked ? 1 : 0, dateTimeAgo(20 + i)).lastInsertRowid);
    l.films.forEach((f, pos) => insItem.run(lid, filmId(f), pos));
  });

  // Spotify-style social: saves, a collaborative catalogue, an unlisted one
  const listId = (title: string) => (d.prepare("SELECT id FROM lists WHERE title = ?").get(title) as { id: number }).id;
  const insSave = d.prepare("INSERT OR IGNORE INTO list_saves (list_id, user_id) VALUES (?,?)");
  for (const [title, savers] of [
    ["Starter Pack: Southeast Asian Cinema", ["budi", "nong", "migs", "linh", "camille", "tunde"]],
    ["Nusantara Nightmares", ["aisyah", "jiwoo", "camille"]],
    ["Films to Watch With Your Ah Ma", ["aisyah", "linh", "weijie"]],
    ["Hallyu 101", ["tunde", "nong"]],
  ] as [string, string[]][]) for (const u of savers) insSave.run(listId(title), uid[u]);
  d.prepare("UPDATE lists SET collaborative = 1 WHERE id = ?").run(listId("Starter Pack: Southeast Asian Cinema"));
  d.prepare("INSERT OR IGNORE INTO list_collaborators (list_id, user_id) VALUES (?,?)").run(listId("Starter Pack: Southeast Asian Cinema"), uid.budi);
  d.prepare("UPDATE list_items SET added_by = (SELECT user_id FROM lists WHERE id = list_items.list_id)").run();

  const insFav = d.prepare("INSERT INTO favorites (user_id, film_id, position) VALUES (?,?,?)");
  for (const [u, films] of Object.entries(FAVORITES)) films.forEach((f, i) => insFav.run(uid[u], filmId(f), i));

  const insFollow = d.prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?,?)");
  for (const [a, b] of FOLLOWS) insFollow.run(uid[a], uid[b]);

  const insWatch = d.prepare("INSERT OR IGNORE INTO watchlist (user_id, film_id) VALUES (?,?)");
  insWatch.run(uid.aisyah, filmId("exhuma-2024"));
  insWatch.run(uid.aisyah, filmId("rrr-2022"));
  insWatch.run(uid.budi, filmId("tiger-stripes-2023"));

  // Demo accounts have verified example addresses so reminders and resets can be tried.
  d.exec("UPDATE users SET email = username || '@example.com', email_verified_at = datetime('now') WHERE email IS NULL");
}
