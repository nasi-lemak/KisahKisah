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
