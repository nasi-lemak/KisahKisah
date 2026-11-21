# KisahKisah 📽️

> *Kisah* (Malay): a story, a tale. **Every film has a kisah.**

A social diary for **films and TV series** in the spirit of Letterboxd. **Southeast Asian cinema is in the spotlight, and the whole world is on the shelf**: anyone, anywhere, is welcome. Log what you watch, compare scores from Douban to Rotten Tomatoes, build catalogues, earn points (at the cinema too), collect avatars, themes and stickers, play mini games on people's reviews, join seasonal events, get your year back in **Kisah Rewind**, and hunt for hidden easter eggs.

## Features

| | |
|---|---|
| 🌏 **Global, SEA-first** | 7 world regions and 31 countries, 70+ films & series from Kuala Lumpur to Lagos. SEA titles, festivals and cinemas get first-class treatment. |
| 📺 **Films & TV series** | Series are first-class: browse tabs, "Created by", series badges, binge achievements, and they count in Rewind. |
| 📊 **Scores around the world** | Each title shows KisahKisah's score next to the platforms that matter for it (Watcha/Naver for Korea, Douban for China, AlloCiné for France, IMDb/RT/Metacritic/TMDB everywhere), all scaled to 100, plus a combined **World score**. Scores come from APIs (`npm run scores:sync` with OMDb/TMDB keys) or member reports, which need a proof link and are shown as a median. |
| ⏪ **Kisah Rewind** | A Spotify-Wrapped-style story for your year: titles, ≈hours, top genres, countries, favourite filmmaker, best-rated, busiest month, streak, a film-personality archetype and a top-% badge. Shareable URL plus a downloadable 1080×1920 card. |
| 🎪 **Events & limited drops** | A yearly calendar: Space Opera Day (May 4), Hantu Week, Lunar New Year, Hari Raya, Songkran, Mid-Autumn, Deepavali, SEA national days, the festive season and Rewind season. Each has free stickers, a limited theme, and bonus KP for logging matching titles; when it ends the items are vaulted. Includes a time machine (`/events?preview=2026-05-04`). |
| 📣 **Sponsored campaigns** | Studios can buy a launch as an event: themes, sticker packs, frames, banner, logging bonus, all labelled "Sponsored". Packages are on `/advertise` with lead capture; the full plan is in [`docs/PROMOTIONS.md`](docs/PROMOTIONS.md). A fictional demo campaign is always live. |
| 🎨 **Profiles like Discord Nitro + Steam** | Animated avatar decorations (orbiting lanterns, kucing ears, a spinning Wau Bulan kite), profile effects (fireflies, petals, monsoon rain), name styles (Songket gold shimmer, neon, rainbow), custom profile colours, animated banners that become a full-page background, Steam-style levels with badge shapes every 10 levels, badges, and showcases you pick and order: favourites, a drag-and-drop sticker board, rarest achievements, collection, featured review and stats. Hover anyone's name for their mini profile card. |
| 🖌️ **Profile Studio** | `/studio`: a live-preview editor where you can try on any item, owned or not, before buying. |
| 🏪 **Kedai (shop)** | Featured bundles priced by what you already own, rarity-glow cards that preview each item on *your* avatar and name, limited-time event drops, and the Vault. |
| 🏷️ **Stickers & themes** | Die-cut animated stickers for reactions on reviews and your profile sticker board, plus equippable app themes that recolour the whole site. |
| 📔 **Diary & reviews** | Log films with half-star ratings, likes, rewatches and dates. Write reviews with spoiler blur, likes and comment threads. |
| 🌏 **Regional review platforms** | Every film links to the platforms its *home audience* uses, searched by its original-script title: Watcha Pedia and Naver for Korean films, Douban and Maoyan for Chinese, Filmarks and Eiga.com for Japanese, MyDramaList for much of Asia, and local-language Wikipedia for SEA films. IMDb, Letterboxd and TMDB for everything. A JustWatch "where to watch" link is localised to your home country. |
| 🔗 **Cross-posting** | Attach links to your reviews on other platforms. Known hosts get a branded chip. |
| 🗂️ **Catalogues, shared like playlists** | Lists work like Spotify playlists: public, unlisted (link-only) or private; short share links (`/l/<code>`) with rich link-preview cards for WhatsApp, Telegram, LINE, X, Threads and Facebook; a scannable QR code; save others' catalogues; duplicate; collaborative catalogues with invited members; reorder; a ▶ "watch next" button and your progress through the list. |
| 🎞️ **Trilogies & collections** | Each film or series shows whether it's part of a trilogy, saga or shared universe: its position ("2 of 3"), every entry with what you've watched, release vs story order, and one-click "save as a catalogue". `/collections` lists them all. Series show seasons and whether they're still running. |
| 🛂 **Film Passport** | One global passport: every country you watch a title from gets a stamp with the date and the film that got you there. Pages are grouped by the 7 world regions, with your home region (from your home country) first. Global goals (Jalan-Jalan, Globetrotter, Around the World in 80 Films) sit alongside an optional Southeast Asia spotlight bonus anyone can earn. |
| 🪙 **Kisah Points (KP)** | Steam-style points for logging, reviewing, getting likes, commenting, daily check-ins, winning games and achievements. Every award is idempotent, so nothing can be farmed. |
| 🏪 **Kedai (shop)** | Spend KP on avatars (Harimau Malaya, Wayang Kulit, Naga…), animated frames (Batik, Songket, Night Market Neon), profile banners and titles. Some items are earn-only, unlocked through achievements and secrets. |
| 🧩 **Mini games on review pages** | Reviewers attach a game: **Teka Bintang** (guess my rating), **Kuiz** (trivia), **Emoji Riddle**, or **Popcorn Catch** (a 20-second canvas arcade game). Readers get one attempt each and win KP. Answers stay server-side. |
| 🎟️ **Cinema integration** | Link a cinema membership for automatic credit via a signed webhook, or claim points with an e-ticket code. Watching a local film in its home country earns ×2. Includes a demo box office to try it end to end. |
| 🏆 **Achievements** | 42 achievements, including *Globetrotter*, *Binge Mode* and *Festival Goer*, from *ASEAN Explorer* and *Hantu Hunter* to film-specific hidden ones. Some grant exclusive cosmetics. |
| 🥚 **Easter eggs** | Several hidden ones. Hints: try a famous cheat code, click things repeatedly, type the most important question in Asia, stay for the post-credits scene, and look for a tiny cup. Spoilers are in [`src/components/EasterEggs.tsx`](src/components/EasterEggs.tsx). |

## Quick start

Requires **Node 22.13+** (uses the built-in `node:sqlite`; no native modules, no DB server).

```bash
npm install
npm run dev          # http://localhost:3000
```

The database (`data/kisahkisah.db`) is created and seeded on first request with 70+ films & series and a small demo community from around the world.
Sign in as **aisyah**, **budi**, **nong**, **migs**, **linh**, **weijie**, **jiwoo**, **camille** or **tunde**. The password for all is `kisah123`.
Existing databases are migrated automatically, and new catalogue titles are added on boot.

```bash
npm test             # unit tests (platform links, cinema points, signatures, ticket codes, achievements)
npm run lint         # TypeScript type-check
npm run build && npm start
npm run db:reset     # wipe the local DB; it re-seeds on next start
OMDB_API_KEY=… TMDB_API_KEY=… npm run scores:sync   # pull IMDb/RT/Metacritic/TMDB scores (add -- --dry-run first)
```

### Configuration

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `DATABASE_PATH` | SQLite file location (default `./data/kisahkisah.db`). |
| `CINEMA_WEBHOOK_SECRET` | HMAC secret shared with cinema partners. **Set this in production.** It also signs ticket-code checksums. |
| `OMDB_API_KEY`, `TMDB_API_KEY` | Optional, for `npm run scores:sync`. Respect each provider's terms. |
| `DISABLE_DEMO_CINEMA=1` | Hides the demo box office, which lets any signed-in user mint test tickets. Set this anywhere real points matter. |

## Cinema partner API

Partners POST purchases for members who've linked their membership number:

```http
POST /api/cinema/webhook
X-Kisah-Timestamp: 1767225600
X-Kisah-Signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>">
Content-Type: application/json

{ "chain": "LPD", "memberRef": "LP123456", "ticketRef": "T-0001",
  "amount": 18.50, "currency": "MYR", "filmSlug": "ola-bola-2016" }
```

- Signatures are compared in constant time. Requests more than 5 minutes old are rejected.
- `(chain, ticketRef)` is unique, so retries and replays never double-credit.
- Unlinked members get `202 ignored`. A wrong currency for the chain's country gets `422`.
- Points come to ≈1 KP per USD 0.22, × chain promo multiplier, × 2 for a local film, capped at 400 per ticket.

The bundled chains (Layar Perdana, Bintang Cineplex, Chao Phraya Screens…) are **fictional demo partners**. To add a real chain, add it to `CHAINS` in `src/lib/cinema.ts` and, if they verify e-tickets via API rather than webhook, swap the lookup in `redeemTicketCode` (`src/lib/purchases.ts`) for a call to their API.

## Project layout

```
src/
  app/                 Next.js App Router pages + server actions (actions.ts)
    api/cinema/webhook Partner webhook
    kopitiam/          🤫
  components/          UI: posters, avatars, forms, games, easter eggs, toasts
  lib/
    regions.ts         Countries, regions, review platforms & link builders
    catalog.ts         Starter film catalogue
    achievements.ts    Achievement definitions (pure)
    shop.ts            Cosmetic items
    cinema.ts          Chains, points maths, webhook signatures, ticket codes (pure)
    games.ts           Mini-game rules & server-side judging
    events.ts          Event calendar, sponsored campaigns, offers, bonuses (pure)
    packages.ts        Advertising packages shown on /advertise
    scores.ts          Scores around the world (API + community median)
    rewind.ts          Kisah Rewind stats (+ rewind-core.ts, pure)
    rewards.ts         Points ledger, item grants, achievement evaluation
    db.ts schema.ts seed.ts queries.ts auth.ts password.ts purchases.ts
tests/                 node:test unit tests
```

### Extending

- **Another country or platform:** add it to `COUNTRIES` / `PLATFORMS` in `regions.ts`. Films from that country pick it up automatically.
- **More films:** append to `CATALOG` (or wire up a TMDB import). Posters are generated from the slug, so no artwork is needed.
- **An achievement:** add an entry with a `progress(stats)` function to `achievements.ts`. Unlocks, points, rewards and toasts are handled for you.
- **A cosmetic:** add it to `ITEMS` in `shop.ts`. Frames and banners are CSS classes in `globals.css`; themes are `[data-theme]` blocks there.
- **An event or sponsored campaign:** add an entry to `allEvents()` in `events.ts` with its date rule, offers (free or KP), bonus and featured titles. Give event-exclusive items `event: "<id>"`. A test checks every offer and featured title exists.

## Notes & next steps

- Auth is username/password (scrypt) with httpOnly session cookies. Server actions get Next's built-in origin checks. There's no login rate limiting yet.
- SQLite fits a single instance. For scale, port `schema.ts` to Postgres; queries are plain SQL.
- Rewind hours are estimates (2h per film, 8h per series) until runtimes and episode counts are tracked.
- Lunar/Islamic festival dates are approximate and flagged in code. Confirm them yearly.
- `scores:sync` is unit-tested against sample payloads but hasn't been run against the live OMDb/TMDB APIs from this environment.
- Ideas: TMDB catalogue import with real posters and runtimes, a localised UI (Bahasa, Thai, Vietnamese, Tagalog, Korean, French…), an admin CMS for campaigns, geo-targeting, a "cinema date" social feature.
