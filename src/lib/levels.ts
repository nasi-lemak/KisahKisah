/**
 * Steam-style profile levels from lifetime KP earned (spending never lowers
 * your level). Each decade of levels needs more XP per level and gets a new
 * badge shape; each level within a decade gets its own colour.
 */
export function xpForLevel(level: number): number {
  // XP to go from `level` to `level + 1`
  return 100 * (1 + Math.floor(level / 10));
}

export function levelFromXp(xp: number): { level: number; into: number; need: number; pct: number } {
  let level = 0;
  let left = Math.max(0, Math.floor(xp));
  while (left >= xpForLevel(level)) {
    left -= xpForLevel(level);
    level++;
  }
  const need = xpForLevel(level);
  return { level, into: left, need, pct: Math.round((left / need) * 100) };
}

const SHAPES = ["circle", "hexagon", "shield", "diamond", "star"] as const;
export type BadgeShape = (typeof SHAPES)[number];

const HUES = [0, 28, 45, 95, 160, 190, 215, 265, 300, 330];

export function levelStyle(level: number): { shape: BadgeShape; color: string; glow: boolean } {
  return {
    shape: SHAPES[Math.min(SHAPES.length - 1, Math.floor(level / 10))],
    color: `hsl(${HUES[level % 10]} 85% 60%)`,
    glow: level >= 20,
  };
}
