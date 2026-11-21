# KisahKisah 📽️

> *Kisah* (Malay): a story, a tale. **Every film has a kisah.**

A social film diary in the spirit of Letterboxd, built **Southeast Asia first**. Anyone, anywhere, can use it. Log what you watch, review it, build catalogues, earn points (at the cinema too), collect avatars, play mini games on people's reviews, and hunt for hidden easter eggs.

## Features

| | |
|---|---|
| 📔 **Diary & reviews** | Log films with half-star ratings, likes, rewatches and dates. Write reviews with spoiler blur, likes and comment threads. |
| 🌏 **Regional review platforms** | Every film links to the platforms its *home audience* uses, searched by its original-script title: Watcha Pedia and Naver for Korean films, Douban and Maoyan for Chinese, Filmarks and Eiga.com for Japanese, MyDramaList for much of Asia, and local-language Wikipedia for SEA films. IMDb, Letterboxd and TMDB for everything. A JustWatch "where to watch" link is localised to your home country. |
| 🔗 **Cross-posting** | Attach links to your reviews on other platforms. Known hosts get a branded chip. |
| 🗂️ **Catalogues** | Ranked or unranked lists, top-4 favourites, watchlist, a monthly diary, and an ASEAN "passport" of countries you've watched. |
| 🪙 **Kisah Points (KP)** | Steam-style points for logging, reviewing, getting likes, commenting, daily check-ins, winning games and achievements. Every award is idempotent, so nothing can be farmed. |
| 🏪 **Kedai (shop)** | Spend KP on avatars (Harimau Malaya, Wayang Kulit, Naga…), animated frames (Batik, Songket, Night Market Neon), profile banners and titles. Some items are earn-only, unlocked through achievements and secrets. |
| 🧩 **Mini games on review pages** | Reviewers attach a game: **Teka Bintang** (guess my rating), **Kuiz** (trivia), **Emoji Riddle**, or **Popcorn Catch** (a 20-second canvas arcade game). Readers get one attempt each and win KP. Answers stay server-side. |
| 🎟️ **Cinema integration** | Link a cinema membership for automatic credit via a signed webhook, or claim points with an e-ticket code. Watching a local film in its home country earns ×2. Includes a demo box office to try it end to end. |
| 🏆 **Achievements** | 35 achievements, from *ASEAN Explorer* and *Hantu Hunter* to film-specific hidden ones. Some grant exclusive cosmetics. |
| 🥚 **Easter eggs** | Several hidden ones. Hints: try a famous cheat code, click things repeatedly, type the most important question in Asia, stay for the post-credits scene, and look for a tiny cup. Spoilers are in [`src/components/EasterEggs.tsx`](src/components/EasterEggs.tsx). |

## Quick start

Requires **Node 22.13+** (uses the built-in `node:sqlite`; no native modules, no DB server).

```bash
npm install
npm run dev          # http://localhost:3000
```

The database (`data/kisahkisah.db`) is created and seeded on first request with a catalogue of ~50 films and a small demo community.
Sign in as **aisyah**, **budi**, **nong**, **migs**, **linh**, **weijie** or **jiwoo**. The password for all is `kisah123`.

```bash
npm test             # unit tests (platform links, cinema points, signatures, ticket codes, achievements)
npm run lint         # TypeScript type-check
npm run build && npm start
npm run db:reset     # wipe the local DB; it re-seeds on next start
```

### Configuration

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `DATABASE_PATH` | SQLite file location (default `./data/kisahkisah.db`). |
| `CINEMA_WEBHOOK_SECRET` | HMAC secret shared with cinema partners. **Set this in production.** It also signs ticket-code checksums. |
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
    rewards.ts         Points ledger, item grants, achievement evaluation
    db.ts schema.ts seed.ts queries.ts auth.ts password.ts purchases.ts
tests/                 node:test unit tests
```

### Extending

- **Another country or platform:** add it to `COUNTRIES` / `PLATFORMS` in `regions.ts`. Films from that country pick it up automatically.
- **More films:** append to `CATALOG` (or wire up a TMDB import). Posters are generated from the slug, so no artwork is needed.
- **An achievement:** add an entry with a `progress(stats)` function to `achievements.ts`. Unlocks, points, rewards and toasts are handled for you.
- **A cosmetic:** add it to `ITEMS` in `shop.ts`. Frames and banners are CSS classes in `globals.css`.

## Notes & next steps

- Auth is username/password (scrypt) with httpOnly session cookies. Server actions get Next's built-in origin checks. There's no login rate limiting yet.
- SQLite fits a single instance. For scale, port `schema.ts` to Postgres; queries are plain SQL.
- Ideas: TMDB catalogue import, Bahasa/Thai/Vietnamese/Tagalog UI, a "cinema date" social feature, seasonal events (Hari Raya, Songkran, Tết, Mid-Autumn) with limited cosmetics.
