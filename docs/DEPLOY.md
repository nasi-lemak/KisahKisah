# Deploying KisahKisah

KisahKisah is one Node 22 server with an embedded SQLite database. That's plenty for launch: SQLite in WAL mode handles thousands of reads per second on one machine, and Litestream gives continuous off-site backups. Move to Postgres when you need more than one app server (see the end).

## 1. Build and run

```bash
docker build -t kisahkisah .
docker run -p 3000:3000 --env-file .env -v kisah-data:/data kisahkisah
```

Or `docker compose up -d` (add `--profile backup` for Litestream). The image:
- builds Next.js as a self-contained server (`NEXT_OUTPUT=standalone`) and runs as a non-root user;
- keeps the database and local uploads on the `/data` volume (`DATABASE_PATH=/data/kisahkisah.db`, `UPLOAD_DIR=/data/uploads`);
- has a health check on `/api/health`, which returns 200 when the database and storage answer and 503 otherwise.

Without Docker: `npm ci && npm run build && npm start` on Node ≥ 22.13.

Any host that runs a container with a persistent volume works: Fly.io (volume + one machine), Railway, Render (disk), a VPS. Serverless platforms without a persistent disk don't suit SQLite.

## 2. Environment

Copy `.env.example`. The essentials for production:

| | |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your public URL (links in emails, share cards). |
| `CINEMA_WEBHOOK_SECRET` | Long random string. Also salts analytics. |
| `ADMIN_USERNAMES` | Who gets the admin. |
| `RESEND_API_KEY`, `MAIL_FROM` | Email: verification, password resets, reminders. |
| `CRON_SECRET` | Turns on scheduled jobs (below). |
| `TMDB_API_KEY` | Real posters, runtimes and title search. |
| `TRUST_PROXY=1` | Only behind your own load balancer or CDN, for per-IP rate limits. |
| `GEO_HEADER` | If your CDN's country header isn't one of the defaults. |
| `BILLING_*` | Your company details on order forms and invoices. |
| `DISABLE_DEMO_CINEMA=1` | **Required** once real points matter. |

Set `HSTS=0` only if you serve production over plain HTTP (you shouldn't).

## 3. Uploaded artwork on object storage

Set `STORAGE=s3` plus `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and:
- **Cloudflare R2:** `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`, `S3_REGION=auto`
- **AWS S3:** `S3_REGION=ap-southeast-1` (no endpoint)
- **MinIO / others:** `S3_ENDPOINT=https://minio.example.com`

Files go under `S3_PREFIX` (default `media/`) and are content-addressed, so they're written once and cached forever. The app still serves them at `/media/<hash>.webp` with immutable cache headers, so put a CDN in front of the site and they're served from the edge. Requests are signed with AWS Signature V4 (no SDK); the signer is tested against AWS's published example.

## 4. Scheduled jobs

Call `/api/cron` hourly with `Authorization: Bearer $CRON_SECRET` (GET or POST). It sends release-day reminders and clears expired sessions, reset links and rate-limit records. Running it twice is harmless. Options:
- GitHub Actions: a `schedule:` workflow with `curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" https://your.site/api/cron`
- Vercel / Render / Railway cron, or `cron` on the server.

Staff can also press **Run now** on the admin overview, which shows when each job last ran.

## 5. Backups

With `docker compose --profile backup up -d`, Litestream streams every database change to your bucket (`LITESTREAM_*` variables, see `litestream.yml`) and keeps 30 days of history. To restore onto a fresh volume:

```bash
litestream restore -o /data/kisahkisah.db s3://$LITESTREAM_BUCKET/kisahkisah
```

Test a restore before launch. Uploaded artwork on S3/R2 is already off the server; turn on bucket versioning for extra safety.

## 6. Launch checklist

- [ ] `DISABLE_DEMO_CINEMA=1`, real `CINEMA_WEBHOOK_SECRET`, `ADMIN_USERNAMES` set
- [ ] Demo accounts: start from an empty database (delete the file before first boot, then `ADMIN_USERNAMES` for your staff), or remove the seed in `src/lib/seed.ts`
- [ ] Email sends (register a test account) and `/admin/outbox` shows "sent"
- [ ] `/api/health` is green behind your load balancer
- [ ] Cron is calling `/api/cron` (admin overview shows recent runs)
- [ ] Litestream restore tested
- [ ] TMDB attribution visible in the footer; the TMDB terms accepted for your key
- [ ] Order-form terms (`DEFAULT_TERMS`) reviewed by counsel; `BILLING_*` filled in
- [ ] Translations reviewed by native speakers (`src/lib/i18n/messages.ts`)

## 7. When to move to Postgres

Move when you need more than one app server, zero-downtime deploys across machines, or heavy concurrent writes. The database layer is deliberately narrow: every query goes through `one`, `all`, `run` and `tx` in `src/lib/db.ts`, and the SQL is plain. The port:

1. Translate `src/lib/schema.ts` (mostly mechanical: `INTEGER PRIMARY KEY` → `bigserial`, `datetime('now')` → `now()`, `COLLATE NOCASE` → `citext` or `lower()` indexes, `INSERT OR IGNORE` → `ON CONFLICT DO NOTHING`).
2. Make the four helpers async (for example with `postgres` or `pg`) and add `await` at call sites. This is the bulk of the work, since node:sqlite is synchronous today and those helpers are called across the codebase.
3. Copy the data with `pgloader` from the SQLite file.
4. Keep `node:sqlite` for tests if you like; the pure modules (`*-core.ts`) don't touch the database.
