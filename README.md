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
| `TMDB_API_KEY` | TMDB v3 key or v4 read token. Turns on real posters, runtimes, episodes and cast, **Admin → Catalogue**, and "add a missing title" from film search. Also used by `npm run scores:sync`. |
| `OMDB_API_KEY` | Optional, for `npm run scores:sync`. Respect each provider's terms. |
| `RESEND_API_KEY`, `MAIL_FROM` | Email delivery (verification, password resets, reminders). Without them, mail lands in the dev outbox at **Admin → Outbox**. |
| `CRON_SECRET` | Turns on `/api/cron`. Call it hourly with `Authorization: Bearer <secret>` (GET or POST) to send release reminders and clean up expired sessions and links. Staff can also press **Run now** on the admin overview. |
| `BILLING_NAME`, `BILLING_ADDRESS`, `BILLING_TAX_ID`, `BILLING_EMAIL`, `BILLING_BANK` | Your company details and bank instructions, printed on order forms and invoices. |
| `TOTP_KEY`, `REQUIRE_STAFF_2FA=1` | Encrypts authenticator secrets at rest (set a long random value), and makes two-step sign-in mandatory for staff. |
| `TRUST_PROXY=1` | Set only behind a proxy you control, so `X-Forwarded-For` can be used for per-IP rate limits. Without it, per-IP limits are skipped and per-account limits still apply. |
| `ADMIN_USERNAMES` | Comma-separated usernames given admin access (item editor, inquiries). |
| `UPLOAD_DIR` | Where uploaded artwork is stored (default `./data/uploads`). |
| `NEXT_PUBLIC_SITE_URL` | Public URL for share links and link-preview images. |
| `GEO_HEADER` | Request header holding the visitor's 2-letter country, for campaign targeting. If unset, `cf-ipcountry`, `x-vercel-ip-country`, `cloudfront-viewer-country` and `x-country-code` are tried. Signed-in members use their home country. |
| `ANALYTICS_SALT` | Salt for the daily-rotating hash that counts unique viewers. Defaults to one derived from `CINEMA_WEBHOOK_SECRET`. |
| `DISABLE_DEMO_CINEMA=1` | Hides the demo box office, which lets any signed-in user mint test tickets. Set this anywhere real points matter. |

## Languages

The interface comes in English, Bahasa Melayu, Bahasa Indonesia, ไทย, Tiếng Việt, Filipino and 한국어. The language is chosen from, in order: the picker in the footer or Settings (a cookie), the member's saved choice (it follows them to new devices), then the browser's `Accept-Language`. `<html lang>` follows it too.

Translated now: navigation, menus, footer, home, sign-in and sign-up, film and series pages (including the log and review form), events and event pages, the Kedai, and Settings. Dates on those pages follow the viewer's language. Strings live in `src/lib/i18n/messages.ts` (site chrome) and `src/lib/i18n/pages/<lang>.ts` (pages). Server components use `await getI18n()` (`t`, `locale`, `date`); client components use `useT()` and `useFormatDate()`. A unit test fails if any language is missing a key or a `{placeholder}`. **The translations are first drafts: have native speakers review them before launch.** Still in English: profiles, diary, catalogues, community, Rewind, the campaign Kuiz, the partner and artist portals, and the admin (staff-facing). Titles, event names and sponsor copy are content and stay as written.

## Safety & moderation

- **Report** any review, comment, catalogue or profile (⚑ Report): spam, harassment, hate, unmarked spoilers, sexual or violent content, copyright or piracy links, or something else. One report per member per item; 20 per hour.
- **Automatic first response:** once 3 different members report an item (`MOD_AUTO_HIDE`), it's hidden pending review. Spoiler reports only blur the review (mark it as a spoiler), never hide it.
- **Admin → Reports** groups open reports, most-reported first, with the content and the reporters' notes. Staff can **remove**, **restore**, **mark as spoiler**, **dismiss**, or **suspend** the author. Authors are told why their content was removed, and reporters are thanked when action is taken. Every decision goes in a moderation log shown under the queue.
- **Suspended** members are signed out, can't sign in (they see the reason) or post, and their reviews and comments disappear for everyone else.
- **Block** from any profile: you stop seeing each other's reviews and comments, they can't comment on your reviews, and follows end both ways.
- Hidden content stays visible to its author (with a notice) and to staff.

## Your data

Settings → **Your data**:
- **Download my data** gives a JSON file of the account and every row linked to it (reviews, diary, catalogues, comments, points, items, follows, reminders, quiz plays…). Passwords, sign-in secrets, tokens and the mail outbox are never included. Tables are read from the schema, so new features are covered automatically.
- **Delete my account** needs the username typed out, the password and (if on) a two-step code. All personal content goes, and the account row is anonymised ("Deleted member", no email, can't sign in, profile 404). The row is kept only so invoices, artist payouts and moderation records still add up. Members on a partner team with a live campaign are asked to hand it over first. A confirmation email is sent.

## Accounts & security

- **Sign-up** needs an email (never shown publicly). A confirmation link is emailed; confirming unlocks password resets by email and release reminders.
- **Passwords** are hashed with scrypt; common passwords and ones containing the username are refused.
- **Rate limits:** 5 failed sign-ins per account per 15 minutes (and 30 per IP with `TRUST_PROXY=1`), sign-ups and reset requests per IP, reset emails per account. Unknown usernames take as long to reject as wrong passwords, and "forgot password" answers the same whether or not an account exists.
- **Reset links** last 1 hour, work once, and are stored only as a hash. Resetting signs out every device and clears the lockout. Changing your password in **Settings** signs out other devices and emails you. **Sign out everywhere** is in Settings too.
- Sign in with username or email.
- **Two-step sign-in** (Settings): scan a QR code with any authenticator app (RFC 6238 codes, tested against the RFC's vectors), confirm a code, and save 10 single-use recovery codes. Sign-in then asks for a code after the password; codes can't be replayed, wrong codes count toward the account lockout, and a password reset still asks for the code. Secrets are encrypted at rest (AES-256-GCM, `TOTP_KEY`); recovery codes are stored hashed. Turning it on signs out other devices; turning it off needs the password and a code. Set `REQUIRE_STAFF_2FA=1` to make it mandatory for staff before they can use the admin.

## Real film & TV data (TMDB)

With `TMDB_API_KEY` set:
- **Admin → Catalogue → Match catalogue to TMDB** links the hand-made titles to TMDB (same title and year) and fills in posters, runtimes, episode counts and cast, 25 per run. Titles that don't match aren't re-checked for 30 days.
- **Film search** shows "Not here yet? From TMDB" results; any signed-in member can add one (20 per hour), which creates its page at once. Staff can search and import from the admin page.
- Posters load from TMDB's image CDN over the drawn poster, which shows if an image fails. Rewind uses real runtimes (one series log counts as one season) and only falls back to estimates for titles without them.
- The footer carries TMDB's required attribution.

## Adding cosmetics without code (admin)

Staff (`role = admin`, set with `ADMIN_USERNAMES`; the demo seed includes **kurator** / `kisah123`) get **🛠️ Admin** in the user menu:

1. **Upload artwork** for stickers, avatar decorations, avatars, banners and profile effects. Every file is checked automatically: format, size, dimensions or aspect ratio, transparency, animation, and for decorations that the centre "avatar hole" is see-through. Passing files are re-encoded to WebP with metadata stripped and stored by content hash (`UPLOAD_DIR`, served from `/media/<hash>.webp`).
2. **Colour-only items** (app themes, name styles, titles) need no upload. Themes and gradients get contrast checks.
3. **Preview** on a real profile card, in the shop and as a review sticker while you edit.
4. **Approve → Publish**: only items passing every check can be approved, and publishing is one click: no deploy. Attach an item to an event to make it a limited drop (free claim or KP). **Retire** removes it from sale; owners keep it. Editing a live item sends it back to draft for review.

Partners and artists follow the public spec page at `/specs`. Partner inquiries from `/advertise` appear in **Admin → Partner inquiries**.

For production, set `STORAGE=s3` to keep artwork on S3, R2 or MinIO (see `docs/DEPLOY.md`).

## Partner & artist portals

Everyone contributes through the same pipeline: upload → automatic checks → live preview → submit → staff review (comments and version history on every item) → approve → publish.

**Partners (studios, distributors, streamers)** at `/partner`
1. An inquiry arrives from `/advertise`. In **Admin → Inquiries**, *Set up partner & campaign* creates the partner team, a campaign with the right package, and an invite link.
2. The partner joins via the link, fills in the brief (title, tagline, synopsis, colours, preferred dates), and fills each upload slot their package includes (e.g. 4 stickers + theme + decoration for Premiere). They never set prices or publish.
3. They submit each item, then the campaign, confirming they hold the licence and accept the "Sponsored" label.
4. Staff review each item: approve, or request changes with a note the partner sees. When everything's approved, *Publish items & schedule* turns the campaign into a **sponsored event** with its own page, banner and limited drops for those dates. No code needed.
5. Both sides see a report: fans who claimed, items claimed, equipped right now, sticker uses, KP spent, plus **impressions, daily viewers, clicks, click-through and event page views**, by day and by country.

**Release reminders.** Sponsored events with a future release date, and catalogue titles with an upcoming release (from TMDB, including new seasons), show **🔔 Notify me**. On release day the scheduled job sends an in-app notification, plus an email to members with a confirmed address. Reminders more than 14 days late are dropped rather than sent. Partners see sign-ups, by country, and reminders sent in their report.

**Cinema ticket bonus.** Partners link their title's KisahKisah page in the brief. Staff set the commercial terms on the campaign: extra KP on partner-cinema tickets (a percentage of the normal ticket points) and an optional exclusive item. Ticket holders in the campaign's markets get them while it runs. That item is then removed from the free drops. The event and film pages advertise the bonus, and the report shows bonus tickets, KP paid, items given, and a breakdown by cinema.

**Official Kuiz.** In the brief, partners write up to 5 multiple-choice questions, each with an optional fun fact. Staff set the KP reward and can fix questions until the first play. While the campaign runs, fans in its markets play once: points scale with right answers, with a 25% bonus for a perfect score. Answers stay on the server until a fan submits. The report shows plays, average score, perfect scores, KP paid, and how many fans got each question right.

**Order forms & invoices.** On the campaign's admin page, *Create order* starts from the package's list price, set in `PACKAGE_PRICES` in `src/lib/billing-core.ts`. Staff then edit the lines, discount, tax (e.g. "SST 8%"), payment terms and validity, and send it. The partner adds billing details and signs with their name and title. The order is locked once signed, and editing a sent order sends it back to draft. Staff issue invoices as a percentage of the order (e.g. 50% deposit, then the balance), capped at what's left. Tax is split pro rata so the instalments add up exactly. Invoices are then marked paid with a reference, or voided. Order forms and invoices print or save cleanly as PDF at `/billing/<number>`, visible only to staff and the partner team. Numbers run per year (`KK-Q-2026-0001`, `KK-INV-2026-0001`). The terms in `DEFAULT_TERMS` are a template: have counsel review them for each market. Scheduling shows a warning if the order isn't signed; pilots can go ahead without one.

**Targeting.** In the brief, partners choose their markets (🌏 Global or specific countries). A targeted campaign's banner, cards, logging bonus and drops only appear for members whose home country is in those markets, or for signed-out visitors whose CDN country header matches. Everyone can still open the event page, but people outside the markets see a notice instead of claim buttons, and the server refuses their claims. Staff see everything.

**Privacy-friendly measurement.** Banners and cards count an impression when at least half is on screen for one second. Clicks and event page views are counted too. Only daily aggregate counters per event and country are stored. Unique viewers are counted with a salted hash that changes every day and is deleted after two days, so nobody can be followed across days. No cookies are set, and visitors with Do Not Track or Global Privacy Control turned on aren't counted. Bots are filtered out.

## Seasonal events without code (admin)

**Admin → Events** lists events made in the admin and the built-in calendar, with each event's next dates. *New event* takes a name, icon, colours, tagline and description, then:
- **When:** every year on the same dates (it can wrap into the new year), or a one-off window. Lunar and Islamic holidays move each year, so make them one-off and add next year's once the date is confirmed.
- **Logging bonus:** KP per title for chosen genres or countries, capped per member.
- **Featured titles** and **markets**: leave markets empty to run everywhere.

A live preview shows the banner, the card and the next occurrence. Saving takes effect at once, with no deploy. Untick *Enabled* to pause an event. Attach limited items to it from **Admin → Items**. Each event's page shows the same performance panel sponsors get.

**Artists** at `/artists`
1. Apply with a portfolio link; staff approve in **Admin → Artists & payouts**.
2. Staff post paid **briefs** (type, quantity, fee, due date, optional event) and approved artists are notified.
3. Artists claim a brief (up to 3 at a time), make each piece with the same editor (credit filled in automatically), and submit.
4. Staff approve the pieces, then *Accept & queue payment*; mark the payout paid with a transfer reference. Artists see status and payment history.

Demo accounts: **studio** (partner, with the *Pulau Hantu* campaign waiting for its brief), **nadia** (approved artist), **kurator** (staff). Password `kisah123`.

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

- Auth is username or email plus password (scrypt) with httpOnly session cookies, rate limits, email confirmation and resets (see Accounts & security). Server actions get Next's built-in origin checks. Two-step sign-in is optional for members and can be required for staff.
- SQLite fits a single instance; back it up continuously with Litestream. `docs/DEPLOY.md` covers Docker, object storage, cron, backups, the launch checklist and the Postgres migration path.
- Rewind hours use TMDB runtimes where linked, else estimates (2h per film, 8h per season).
- Lunar and Islamic festival dates in code are estimates. Confirm each year's real dates in **Admin → Events → Moving festivals**: confirmed dates replace the estimates everywhere (and can add years the code doesn't have), and the "approx." labels disappear.
- `scores:sync` is unit-tested against sample payloads but hasn't been run against the live OMDb/TMDB APIs from this environment.
- Ideas: translate the remaining pages, add French and Chinese, a "cinema date" social feature.
