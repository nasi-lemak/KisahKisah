import "server-only";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA, SCHEMA_NOTIFICATIONS, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4 } from "./schema";
import { CATALOG } from "./catalog";
import { STARTER_ITEMS } from "./shop";
import { seed } from "./seed";
import { checkAchievements } from "./rewards";

type Row = Record<string, unknown>;

let instance: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (instance) return instance;
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "kisahkisah.db");
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  d.exec(SCHEMA);
  d.exec(SCHEMA_NOTIFICATIONS);
  d.exec(SCHEMA_V2);
  d.exec(SCHEMA_V3);
  d.exec(SCHEMA_V4);
  // Seed exactly once, even if several build workers open the file together.
  let seeded = false;
  d.exec("BEGIN IMMEDIATE");
  try {
    migrate(d);
    syncCatalog(d);
    const { n } = d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    if (n === 0) {
      seed(d);
      seeded = true;
    }
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  instance = d;
  if (seeded) {
    // Give the demo community the achievements their history has earned, quietly.
    for (const { id } of d.prepare("SELECT id FROM users").all() as { id: number }[]) checkAchievements(id);
    d.exec("UPDATE notifications SET seen = 1");
  }
  return d;
}

function addColumn(d: DatabaseSync, table: string, column: string, definition: string) {
  const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/** Additive migrations for databases created by earlier versions. */
function migrate(d: DatabaseSync) {
  addColumn(d, "films", "kind", "TEXT NOT NULL DEFAULT 'film'");
  addColumn(d, "users", "theme_item", "TEXT");
  addColumn(d, "users", "effect_item", "TEXT");
  addColumn(d, "users", "namestyle_item", "TEXT");
  addColumn(d, "users", "accent1", "TEXT");
  addColumn(d, "users", "accent2", "TEXT");
  addColumn(d, "users", "showcases", "TEXT NOT NULL DEFAULT '[\"favorites\",\"stickers\",\"achievements\"]'");
  addColumn(d, "users", "pinned_review_id", "INTEGER");
  addColumn(d, "films", "seasons", "INTEGER");
  addColumn(d, "films", "status", "TEXT");
  addColumn(d, "lists", "visibility", "TEXT NOT NULL DEFAULT 'public'");
  addColumn(d, "lists", "share_token", "TEXT");
  addColumn(d, "lists", "collaborative", "INTEGER NOT NULL DEFAULT 0");
  addColumn(d, "lists", "updated_at", "TEXT");
  addColumn(d, "list_items", "added_by", "INTEGER");
  addColumn(d, "list_items", "added_at", "TEXT");
  d.exec("CREATE UNIQUE INDEX IF NOT EXISTS lists_share_token ON lists(share_token)");
}

/** Insert catalogue titles that aren't in the DB yet (new releases ship with code). */
function syncCatalog(d: DatabaseSync) {
  const ins = d.prepare(
    `INSERT INTO films (slug, kind, title, original_title, year, country, director, genres, motif, synopsis, seasons, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(slug) DO UPDATE SET kind = excluded.kind, seasons = excluded.seasons, status = excluded.status`,
  );
  for (const f of CATALOG) {
    ins.run(f.slug, f.kind ?? "film", f.title, f.originalTitle ?? null, f.year, f.country, f.director, f.genres.join(","), f.motif, f.synopsis, f.seasons ?? null, f.status ?? null);
  }
  // Every catalogue gets a short share token (used in /l/<token> links).
  d.exec("UPDATE lists SET share_token = lower(hex(randomblob(5))) WHERE share_token IS NULL");
  // Everyone gets newly added starter items (e.g. the starter sticker pack).
  const grant = d.prepare("INSERT OR IGNORE INTO inventory (user_id, item_id, source) SELECT id, ?, 'starter' FROM users");
  for (const it of STARTER_ITEMS) grant.run(it);
}

// node:sqlite returns null-prototype objects; React wants plain ones.
const plain = <T>(r: unknown): T => ({ ...(r as Row) }) as T;

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return db().prepare(sql).all(...params).map((r) => plain<T>(r));
}

export function one<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  const r = db().prepare(sql).get(...params);
  return r ? plain<T>(r) : undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return db().prepare(sql).run(...params);
}

/** Run fn inside a transaction (nested calls join the outer one). */
let depth = 0;
export function tx<T>(fn: () => T): T {
  const d = db();
  if (depth > 0) return fn();
  d.exec("BEGIN IMMEDIATE");
  depth++;
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  } finally {
    depth--;
  }
}
