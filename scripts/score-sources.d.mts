export type ScoreRow = { platform: string; value: number; votes: number | null; url: string | null };
export function parseOmdb(json: unknown): ScoreRow[];
export function parseTmdb(json: unknown, kind: string): ScoreRow[];
