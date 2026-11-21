export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  home_country TEXT NOT NULL DEFAULT 'MY',
  points INTEGER NOT NULL DEFAULT 0,
  avatar_item TEXT NOT NULL DEFAULT 'av_popcorn',
  frame_item TEXT,
  banner_item TEXT,
  title_item TEXT,
  last_checkin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS films (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  year INTEGER NOT NULL,
  country TEXT NOT NULL,
  director TEXT NOT NULL,
  genres TEXT NOT NULL,
  motif TEXT NOT NULL,
  synopsis TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS films_country ON films(country);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  watched_on TEXT NOT NULL,
  rating REAL,
  liked INTEGER NOT NULL DEFAULT 0,
  rewatch INTEGER NOT NULL DEFAULT 0,
  cinema_chain TEXT,
  local_hour INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS logs_user ON logs(user_id, watched_on DESC);
CREATE INDEX IF NOT EXISTS logs_film ON logs(film_id);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  rating REAL,
  body TEXT NOT NULL,
  spoiler INTEGER NOT NULL DEFAULT 0,
  game_type TEXT NOT NULL DEFAULT 'none',
  game_config TEXT NOT NULL DEFAULT '{}',
  external_links TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS reviews_film ON reviews(film_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user ON reviews(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS review_likes (
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  ranked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS list_items (
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (list_id, film_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (user_id, film_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, film_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, followee_id)
);

-- Every point movement. (user_id, reason, ref) is unique so awards are idempotent.
CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, reason, ref)
);

CREATE TABLE IF NOT EXISTS inventory (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'shop',
  acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS game_plays (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  won INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, review_id)
);

CREATE TABLE IF NOT EXISTS cinema_links (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id TEXT NOT NULL,
  member_ref TEXT NOT NULL,
  linked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, chain_id),
  UNIQUE (chain_id, member_ref)
);

-- Tickets as known to the (demo) cinema side; redeemed_by is set once claimed.
CREATE TABLE IF NOT EXISTS cinema_tickets (
  code TEXT PRIMARY KEY,
  chain_id TEXT NOT NULL,
  film_id INTEGER REFERENCES films(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  redeemed_by INTEGER REFERENCES users(id),
  redeemed_at TEXT,
  points INTEGER
);

CREATE TABLE IF NOT EXISTS cinema_purchases (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id TEXT NOT NULL,
  ticket_ref TEXT NOT NULL,
  film_id INTEGER REFERENCES films(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  points INTEGER NOT NULL,
  local_bonus INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (chain_id, ticket_ref)
);
`;

export const SCHEMA_NOTIFICATIONS = /* sql */ `
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  seen INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, seen);
`;

export const SCHEMA_V2 = /* sql */ `
-- Scores from other platforms: synced from APIs, or reported by the community with a proof link.
CREATE TABLE IF NOT EXISTS external_scores (
  id INTEGER PRIMARY KEY,
  film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  value REAL NOT NULL,
  votes INTEGER,
  source TEXT NOT NULL,            -- 'api' | 'community'
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS external_scores_api ON external_scores(film_id, platform) WHERE source = 'api';
CREATE UNIQUE INDEX IF NOT EXISTS external_scores_user ON external_scores(film_id, platform, user_id) WHERE source = 'community';

-- Discord-style sticker reactions: one sticker per user per review.
CREATE TABLE IF NOT EXISTS review_stickers (
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sticker_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (review_id, user_id)
);

-- Limited-time items claimed or bought during an event occurrence.
CREATE TABLE IF NOT EXISTS event_claims (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  occurrence TEXT NOT NULL,        -- start date of the occurrence, e.g. 2026-05-04
  item_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, event_id, occurrence, item_id)
);

-- Leads from the /advertise page.
CREATE TABLE IF NOT EXISTS ad_inquiries (
  id INTEGER PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  release_date TEXT,
  markets TEXT NOT NULL,
  package TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const SCHEMA_V3 = /* sql */ `
-- Steam-style sticker board on profiles: stickers placed freely (x/y in %).
CREATE TABLE IF NOT EXISTS profile_stickers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  rot REAL NOT NULL DEFAULT 0,
  scale REAL NOT NULL DEFAULT 1,
  z INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS profile_stickers_user ON profile_stickers(user_id);
`;

export const SCHEMA_V4 = /* sql */ `
-- Spotify-style catalogue sharing
CREATE TABLE IF NOT EXISTS list_saves (
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (list_id, user_id)
);
CREATE TABLE IF NOT EXISTS list_collaborators (
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (list_id, user_id)
);
`;

export const SCHEMA_V5 = /* sql */ `
-- Uploaded artwork, content-addressed (key = sha256 + ".webp")
CREATE TABLE IF NOT EXISTS assets (
  key TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  frames INTEGER NOT NULL DEFAULT 1,
  bytes INTEGER NOT NULL,
  checks TEXT NOT NULL DEFAULT '{}',
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cosmetics created in the admin (no code change needed). status: draft → approved → live → retired
CREATE TABLE IF NOT EXISTS custom_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT 'rare',
  price INTEGER,
  event TEXT,
  event_price INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  asset_key TEXT REFERENCES assets(key),
  data TEXT NOT NULL DEFAULT '{}',
  artist TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
`;

export const SCHEMA_V6 = /* sql */ `
-- Partners (studios, distributors, streamers) and their people
CREATE TABLE IF NOT EXISTS orgs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS org_members (
  org_id INTEGER NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (org_id, user_id)
);
CREATE TABLE IF NOT EXISTS org_invites (
  token TEXT PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  used_by INTEGER REFERENCES users(id),
  used_at TEXT
);
-- A sponsored launch. status: brief → submitted → approved → scheduled (→ ended by date)
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  inquiry_id INTEGER REFERENCES ad_inquiries(id),
  title TEXT NOT NULL,
  package TEXT NOT NULL DEFAULT 'premiere',
  markets TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'brief',
  tagline TEXT NOT NULL DEFAULT '',
  synopsis TEXT NOT NULL DEFAULT '',
  release_date TEXT,
  motif TEXT NOT NULL DEFAULT '🎬',
  country TEXT NOT NULL DEFAULT 'MY',
  color1 TEXT NOT NULL DEFAULT '#f5a524',
  color2 TEXT NOT NULL DEFAULT '#1f232c',
  starts_on TEXT,
  ends_on TEXT,
  featured TEXT NOT NULL DEFAULT '',
  licence_confirmed INTEGER NOT NULL DEFAULT 0,
  licence_by INTEGER REFERENCES users(id),
  licence_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Artists
CREATE TABLE IF NOT EXISTS artist_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  portfolio_url TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  specialities TEXT NOT NULL DEFAULT '',
  payout_details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'applied',
  reviewed_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
-- Paid commissions. status: open → assigned → in_review → done (or cancelled)
CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  fee_amount INTEGER NOT NULL,
  fee_currency TEXT NOT NULL DEFAULT 'USD',
  due_on TEXT,
  event TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  claimed_at TEXT,
  completed_at TEXT
);
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY,
  brief_id INTEGER NOT NULL UNIQUE REFERENCES briefs(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

-- Feedback thread and version history on every item
CREATE TABLE IF NOT EXISTS item_comments (
  id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES custom_items(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL DEFAULT 'comment',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS item_versions (
  id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES custom_items(id) ON DELETE CASCADE,
  asset_key TEXT,
  data TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
