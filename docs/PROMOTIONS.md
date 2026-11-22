# Promotion Packages & Events Plan

How KisahKisah makes money from film and series launches without turning into an ad wall.

> **Status:** draft plan. Prices are hypotheses to validate with the first pilot campaigns, not quotes.
> What's already built and what's still to build is listed in [§10](#10-whats-built-vs-whats-next).

---

## 1. The idea in one paragraph

Studios, distributors and streamers pay to launch a title **as a limited-time event**. Fans can claim or buy collectibles inside it: site themes, sticker packs, avatar frames and avatars. Fans opt in, show the items off on every review they write, and the items are **vaulted when the campaign ends**, so the scarcity is real. A Discord or Steam-style cosmetics economy becomes the ad unit. The house event calendar (Space Opera Day on May 4, Hantu Week, Lunar New Year, Hari Raya, Songkran…) keeps people coming back between sponsored campaigns. Each house event is also something a sponsor can buy into ("presented by…").

## 2. Why this beats a banner

| Banner ads | KisahKisah campaigns |
|---|---|
| Interruptive, ignored | Opt-in: fans *choose* to claim |
| Gone when you scroll | Stickers stay on reviews; themes and frames stay on profiles all campaign long |
| No urgency | Limited window, then vaulted; "returns next year" for house events |
| Hard to tie to tickets | Partner-cinema ticket bonus and release-day watchlist reminders |
| Brand-safety worries next to UGC | Sponsors are kept away from ratings, reviews and scores (see §7) |

## 3. Audience & positioning

- **Southeast Asia first.** SEA titles, platforms, festivals and cinemas get first-class treatment: local review-platform links, SEA events, local-film ×2 cinema points.
- **Open to the world.** Global catalogue, platforms (IMDb, Letterboxd, AlloCiné, FilmAffinity, Douban, Watcha…), and fan holidays like Space Opera Day and Halloween.
- **Buyers:** SEA distributors and studios (theatrical), regional streamers (series launches), international studios releasing into SEA, and festival and indie producers (subsidised tier).

## 4. What we can sell (inventory units)

| Unit | Where it shows | Built? |
|---|---|---|
| Sitewide banner strip | Under the header on every page | ✅ `EventBanner` |
| Campaign page | `/events/<id>`: hero, promo title card, drops, bonus, featured row | ✅ |
| Sticker pack (3–6) | Claimed into inventory and used as reactions on any review | ✅ |
| Site theme | Recolours the whole app for users who equip it | ✅ |
| Avatar frame / avatar / banner | Profile, reviews, comments, leaderboards | ✅ |
| Logging bonus | Extra KP for logging the promoted title or genre/country | ✅ (`bonus` in `events.ts`) |
| Featured row | Event page; home "events" row | ✅ |
| Official Kuiz (trivia) | Campaign page | 🔜 (exists on reviews) |
| Partner-cinema ticket bonus | Extra KP on tickets for the title | 🔜 (cinema module exists) |
| Release-day watchlist reminder | Notification to everyone who watchlisted it | 🔜 |
| Custom easter egg | Hidden interactive moment that unlocks an exclusive | 🔜 (per-campaign dev work) |
| Rewind slide (Dec only) | "Most-claimed campaign of the year" | 🔜 |

## 5. Packages

Public descriptions are in `src/lib/packages.ts` (rendered at `/advertise`). Prices below are **starting hypotheses** for one market cluster (e.g. MY+SG+BN).

| Package | Length | Includes | Price hypothesis (USD) | Who buys it |
|---|---|---|---|---|
| 🌱 **Indie Spotlight** | 7 days | Featured row, campaign page, free 3-sticker pack, trivia, wrap report | 300 – 800 (subsidised) | SEA indie & festival titles |
| 🎬 **Trailer Drop** | 7 days | + sitewide banner in chosen markets, 4-sticker pack, "notify me" reminder | 2,000 – 5,000 | Pre-release hype, 2–6 weeks out |
| 🎟️ **Premiere** *(lead product)* | 14 days | + limited theme, premium KP frame, logging bonus, cinema ticket bonus, launch-week event | 8,000 – 20,000 | Theatrical & streaming launches |
| 🐉 **Blockbuster Takeover** | 21–30 days | + opening-weekend takeover for everyone, legendary avatar, campaign achievement, custom easter egg, seasonal tie-in, account manager | 40,000+ (multi-market) | Tentpoles across SEA |

**Add-ons:** present a house event (e.g. a horror distributor sponsors Hantu Week), custom easter egg, series season pack (weekly sticker drops per episode), December Rewind placement, extra market clusters.

**How to validate pricing:**
1. Run 3–5 pilot campaigns at a discount in exchange for full data sharing and a case study.
2. Measure cost per claim, per watchlist add, per log of the title, and per partner-cinema ticket (§8).
3. Compare those costs with the buyer's current social and influencer cost per engagement (ask in the brief). Set the price where we're clearly better per engaged fan.
4. Re-price per market cluster. Audience size differs a lot between, e.g., Indonesia and Brunei.

### Free vs. KP-priced items

- **Free claims** (stickers, most themes) maximise reach. They're the main KPI for sponsors.
- **KP-priced premium items** (frames, legendary avatars) add scarcity and status, and act as a **points sink** that keeps the KP economy healthy.
- **KP has no cash value.** Sponsors never buy KP. A sponsor-funded *logging bonus* is a budgeted KP grant we control, capped per user (`maxLogs`).
- Event-exclusive items can't be bought outside their window. House-event items return each year; sponsored items normally don't. That "once only" scarcity is part of what a sponsor pays for.

## 6. The house event calendar

Runs all year, unsponsored by default, and every slot can be sold as a presenting sponsorship. Lunar/Islamic dates are **approximate** in code (`approximate: true`) and must be confirmed per year and market.

| When | Event | Bonus | Natural sponsor fit |
|---|---|---|---|
| Lunar NY (≈ late Jan – Feb, 15 days) | 🧧 Lunar New Year (incl. Tết, Seollal) | Family titles | CNY family comedies (MY/SG/CN/HK/TW/VN) |
| Feb 10–14 | 💌 Valentine's Week | Romance | Rom-coms, K-drama launches |
| Eid (≈ Mar, 7 days) | 🌙 Hari Raya Aidilfitri | SEA titles | Raya releases (MY/ID/BN) |
| Apr 13–15 | 💦 Songkran | Thai titles | Thai releases, GDH-style comedies |
| **May 4–5** | 🚀 **Space Opera Day** | Sci-fi | Sci-fi releases; official franchise branding only via licence (§7) |
| Jun 12 / Aug 9 / Aug 17 / Aug 31 / Sep 2 | National days PH / SG / ID / MY / VN | Local titles | National film agencies, local distributors |
| Mid-Autumn (≈ Sep–Oct, 5 days) | 🥮 Mid-Autumn | East & SEA titles | Animation & family |
| Oct 25–31 | 🎃 Hantu Week (Halloween, SEA style) | Horror | SEA horror (a huge regional genre) |
| Deepavali (≈ Oct–Nov, 5 days) | 🪔 Deepavali | Indian titles | Tamil/Hindi releases in MY/SG |
| Dec 1 – Jan 15 | ⏪ Kisah Rewind Season | n/a | Rewind placement add-on |
| Dec 20–26 | 🎄 Festive Season | Family | Holiday family films |

**Ideas for later:** Oscars week (prediction game), Busan / Cannes / Venice / Tokyo festival weeks, Ramadan "after-iftar" screenings, Children's Day, Pride month, World Cinema Day, anime season premieres.

## 7. Rules that protect the community (and the product)

1. **Disclosure.** Everything sponsored shows a "Sponsored" label: banner, cards, campaign page, Kedai strip. Follow each market's advertising standards.
2. **No pay-for-opinion. Ever.** Sponsors can't buy, boost, hide or remove ratings, reviews, comments, the KisahKisah score or "Scores around the world". Sponsored titles get no ranking boost in browse or search.
3. **Cosmetics only.** Sponsored items never give an advantage in games, leaderboards or achievements beyond their own campaign achievement.
4. **Frequency cap.** At most two sitewide banners at once (enforced in UI). House events never get pushed out entirely.
5. **IP & trademarks.** Sponsors supply **licensed** artwork and names. House events stay unbranded. For example, May 4 is "Space Opera Day", not an official franchise day. Official franchise names, logos, characters or quotes appear only in a campaign licensed by the rights holder. Have legal review taglines for each market.
6. **Kids & sensitive content.** Horror and mature-title campaigns follow the title's local rating. Don't feature them in family events.
7. **Data.** Sponsors get aggregated reports only, never personal data.

## 8. What we report

Tracked per campaign, reported mid-flight and at wrap:

- **Reach:** banner and card impressions, campaign page views, daily unique viewers, clicks and click-through, by day and by market
- **Engagement:** claims (`event_claims`), claim rate, KP purchases of premium items, items *equipped*, sticker reactions using campaign stickers (`review_stickers`)
- **Intent:** "notify me" sign-ups (by market), reminders delivered, watchlist adds\*
- **Conversion:** logs of the title, reviews (count + rating distribution, shown as-is), partner-cinema tickets with the campaign bonus (by cinema), bonus KP paid
- **Afterglow:** % still equipping the theme/frame 30 days later, sticker usage after vaulting

\* not built yet.

Reach is measured without cookies or personal data: daily aggregate counters plus a salted hash that rotates daily to count unique viewers. Do Not Track and Global Privacy Control are honoured, and bots are filtered out.

## 9. Sales & production workflow

1. **Inquiry** via `/advertise` (stored in `ad_inquiries`) → reply within 2 working days.
2. **Proposal**: package, markets, dates, price, mock-up made with the events time machine (`/events?preview=YYYY-MM-DD`).
3. **Booking**: ideally 4–6 weeks before release. Assets due 2 weeks before launch.
4. **Asset brief**:
   - Stickers: 3–6 × square PNG/SVG, 512 px, transparent background
   - Theme: 9 colour tokens (background, surface, raised, line, text, muted, accent, secondary, highlight), contrast-checked
   - Frame and avatar art; title card (title, tagline, synopsis, release date per market, motif/key art)
   - Bonus rules (which titles/genres/countries), featured titles
5. **Build:** items are created in **Admin → Items**: upload, automatic checks, preview, approve, publish, and attach to the campaign's event. Scheduling the campaign in **Admin → Campaigns** creates the event window. House events are made in **Admin → Events**.
6. **QA:** preview with the time machine, test claims on staging, check labels.
7. **Launch → mid-flight report → wrap report.**

## 10. What's built vs. what's next

**Built in this repo**

- Event engine: fixed, lunar-dated and one-off windows, year-wrapping, active/next occurrence, the time machine
- Limited-time offers (free or KP), vault, claims log, event logging bonuses with per-user caps
- Themes, sticker reactions, event frames, sponsored labelling, the `/advertise` page with lead capture
- Demo sponsored campaign (fictional film & studio) that is always live, for demos
- Unit tests for the calendar, offers and data integrity (`tests/core.test.ts`)

**Next, in priority order**

1. ~~Admin CMS for items with asset upload~~ **Built**: upload with automatic checks, live preview, approve → publish, event drops, retire (`/admin`, spec at `/specs`).
2. ~~Partner portal~~ **Built**: inquiry → partner team + invite → brief → upload slots → submit with licence confirmation → staff review → schedule as a sponsored event → report (`/partner`). Scheduled campaigns become events without code.
3. ~~Artist portal~~ **Built**: apply → briefs → claim → submit → feedback → accept → payout tracking (`/artists`).
4. ~~Geo-targeting by viewer country~~ **Built**: partners pick markets in the brief; banners, cards, bonuses and claims only reach those countries (member home country, or CDN country header for visitors).
5. ~~Impression and click tracking~~ **Built**: privacy-friendly impressions, daily viewers, clicks, CTR and page views in the campaign report, by day and country.
6. ~~Release-day reminders and the "notify me" button~~ **Built**: in-app and email on release day; sign-ups by country in the report.
7. ~~Partner-cinema ticket bonus wired to a campaign~~ **Built**: +% KP and an exclusive ticket-holder item on partner-cinema tickets for the linked title, during the campaign, in its markets; reported by cinema.
8. Official campaign Kuiz on event pages
9. ~~House events created in the admin~~ **Built**: yearly or one-off windows, logging bonuses, featured titles, markets, pause/resume and a live preview (`/admin/events`).
10. Contracts, invoicing, and confirming festival dates per market each year

## 11. Risks

| Risk | Mitigation |
|---|---|
| Community sees it as selling out | Strict rules in §7, opt-in only, house events outnumber sponsored ones |
| KP inflation from sponsored bonuses | Per-user caps, KP sinks (premium items), budget per campaign |
| Too few users for sponsors to care | Start with the Indie tier and SEA distributors; use pilots as case studies |
| IP/trademark complaints | Unbranded house events; licensed assets only in sponsored campaigns |
| Wrong festival dates | `approximate` flag + yearly confirmation step in ops checklist |
