import "server-only";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA, SCHEMA_NOTIFICATIONS } from "./schema";
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
  // Seed exactly once, even if several build workers open the file together.
  let seeded = false;
  d.exec("BEGIN IMMEDIATE");
  try {
    const { n } = d.prepare("SELECT COUNT(*) AS n FROM films").get() as { n: number };
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
