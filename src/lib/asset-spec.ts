/**
 * Artwork specs for uploaded cosmetics, and the automatic checks every upload
 * goes through. Pure, so it's unit-tested and shared by the API, the admin
 * editor and the published spec page that partners and artists follow.
 */
export type UploadType = "avatar" | "sticker" | "frame" | "banner" | "effect";

export type Spec = {
  label: string;
  recommended: string;
  formats: string[];
  maxBytes: number;
  /** Square canvas with side between min and max. */
  square?: { min: number; max: number };
  /** Width ÷ height, with a tolerance. */
  aspect?: { ratio: number; tolerance: number; minWidth: number; maxWidth: number };
  alpha: "required" | "optional";
  animated: "allowed" | "recommended" | "no";
  /** Decorations must leave the middle transparent so the avatar shows through. */
  avatarHole?: boolean;
  notes: string[];
};

export const SPECS: Record<UploadType, Spec> = {
  avatar: {
    label: "Avatar", recommended: "512 × 512 px", formats: ["png", "webp", "gif"], maxBytes: 600_000,
    square: { min: 256, max: 1024 }, alpha: "optional", animated: "allowed",
    notes: ["Shown in a circle: keep the face inside the centre circle, corners get cropped.", "Should still read at 24 px (comment size)."],
  },
  sticker: {
    label: "Sticker", recommended: "512 × 512 px", formats: ["png", "webp", "gif"], maxBytes: 500_000,
    square: { min: 256, max: 1024 }, alpha: "required", animated: "allowed",
    notes: ["Transparent background: we add the white die-cut outline and shadow.", "Animated stickers: loop seamlessly, 3 seconds or less."],
  },
  frame: {
    label: "Avatar decoration", recommended: "640 × 640 px", formats: ["png", "webp", "gif"], maxBytes: 1_000_000,
    square: { min: 480, max: 1280 }, alpha: "required", animated: "allowed", avatarHole: true,
    notes: ["The avatar sits in a transparent circle 80% of the canvas wide, centred (512 px on a 640 canvas).", "Decoration lives in the outer ring and may overlap the avatar edge a little."],
  },
  banner: {
    label: "Profile banner", recommended: "1500 × 500 px (3:1)", formats: ["png", "webp", "gif", "jpeg"], maxBytes: 2_000_000,
    aspect: { ratio: 3, tolerance: 0.04, minWidth: 1200, maxWidth: 3000 }, alpha: "optional", animated: "allowed",
    notes: ["Bottom-left 25% is covered by the avatar: keep key art away from it.", "Also used, dimmed and blurred, as the full-page profile background."],
  },
  effect: {
    label: "Profile effect", recommended: "1000 × 1200 px, looping", formats: ["webp", "gif", "png"], maxBytes: 2_500_000,
    aspect: { ratio: 1000 / 1200, tolerance: 0.25, minWidth: 600, maxWidth: 1600 }, alpha: "required", animated: "recommended",
    notes: ["Plays over the whole profile card: mostly transparent, with motion around the edges.", "Keep the centre-left clear where the name and bio sit."],
  },
};

export type AssetMeta = {
  format: string;
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  frames: number;
  /** Max alpha (0–255) found in the centre of the image; only measured for decorations. */
  holeAlphaMax?: number;
};

export type CheckResult = { ok: boolean; checks: { label: string; pass: boolean; detail: string; level: "error" | "warning" }[] };

const kb = (n: number) => `${Math.round(n / 1000)} KB`;

export function validateAsset(type: UploadType, m: AssetMeta): CheckResult {
  const s = SPECS[type];
  const checks: CheckResult["checks"] = [];
  const add = (label: string, pass: boolean, detail: string, level: "error" | "warning" = "error") => checks.push({ label, pass, detail, level });

  add("File type", s.formats.includes(m.format), s.formats.includes(m.format) ? m.format.toUpperCase() : `${m.format.toUpperCase()} isn't accepted; use ${s.formats.join(", ").toUpperCase()}`);
  add("File size", m.bytes <= s.maxBytes, m.bytes <= s.maxBytes ? `${kb(m.bytes)} (max ${kb(s.maxBytes)})` : `${kb(m.bytes)} is over the ${kb(s.maxBytes)} limit`);

  if (s.square) {
    const sq = m.width === m.height;
    add("Square canvas", sq, sq ? `${m.width} × ${m.height}` : `${m.width} × ${m.height} must be square (recommended ${s.recommended})`);
    const inRange = m.width >= s.square.min && m.width <= s.square.max;
    add("Dimensions", inRange, inRange ? `within ${s.square.min}–${s.square.max} px` : `${m.width} px is outside ${s.square.min}–${s.square.max} px (recommended ${s.recommended})`);
  }
  if (s.aspect) {
    const r = m.width / m.height;
    const okR = Math.abs(r - s.aspect.ratio) / s.aspect.ratio <= s.aspect.tolerance;
    add("Aspect ratio", okR, okR ? `${m.width} × ${m.height}` : `${m.width} × ${m.height} should be about ${s.recommended}`);
    const okW = m.width >= s.aspect.minWidth && m.width <= s.aspect.maxWidth;
    add("Width", okW, okW ? `${m.width} px` : `${m.width} px is outside ${s.aspect.minWidth}–${s.aspect.maxWidth} px`);
  }
  if (s.alpha === "required") add("Transparent background", m.hasAlpha, m.hasAlpha ? "has transparency" : "needs a transparent background (PNG/WebP with alpha)");
  if (s.animated === "no" && m.frames > 1) add("Static image", false, "animation isn't supported for this type");
  if (s.animated === "recommended") add("Animated", m.frames > 1, m.frames > 1 ? `${m.frames} frames` : "static image: effects look best animated", "warning");
  else if (m.frames > 1) add("Animated", true, `${m.frames} frames`, "warning");
  if (s.avatarHole) {
    const clear = (m.holeAlphaMax ?? 255) <= 24;
    add("Avatar hole", clear, clear ? "centre is transparent, so the avatar shows through" : "the centre must be transparent so the avatar shows through");
  }
  return { ok: checks.every((c) => c.pass || c.level === "warning"), checks };
}

// ── Colour checks for themes and name styles ─────────────────────────

export const THEME_TOKENS = ["ink", "surface", "raised", "line", "text", "muted", "saffron", "jade", "lotus"] as const;
export type ThemeTokens = Record<(typeof THEME_TOKENS)[number], string>;

export const THEME_TOKEN_LABELS: Record<(typeof THEME_TOKENS)[number], string> = {
  ink: "Page background", surface: "Cards", raised: "Raised panels", line: "Borders", text: "Text",
  muted: "Secondary text", saffron: "Accent (buttons)", jade: "Secondary accent", lotus: "Highlight",
};

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio between two hex colours (1–21). */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

const BUTTON_TEXT = "#1a1205";

export function validateTheme(t: Partial<ThemeTokens>): CheckResult {
  const checks: CheckResult["checks"] = [];
  const add = (label: string, pass: boolean, detail: string, level: "error" | "warning" = "error") => checks.push({ label, pass, detail, level });
  const missing = THEME_TOKENS.filter((k) => !t[k] || !HEX.test(t[k]!));
  add("All 9 colours set", missing.length === 0, missing.length ? `missing or invalid: ${missing.join(", ")}` : "complete");
  if (missing.length) return { ok: false, checks };
  const th = t as ThemeTokens;
  const pair = (label: string, a: string, b: string, min: number, level: "error" | "warning" = "error") => {
    const r = contrast(a, b);
    add(label, r >= min, `${r}:1 (needs ${min}:1)`, level);
  };
  pair("Text on background", th.text, th.ink, 4.5);
  pair("Text on cards", th.text, th.surface, 4.5);
  pair("Secondary text on cards", th.muted, th.surface, 3);
  pair("Button text on accent", BUTTON_TEXT, th.saffron, 4.5);
  pair("Accent on background", th.saffron, th.ink, 3, "warning");
  return { ok: checks.every((c) => c.pass || c.level === "warning"), checks };
}

export function validateGradient(stops: string[]): CheckResult {
  const checks: CheckResult["checks"] = [];
  const valid = stops.length >= 2 && stops.length <= 4 && stops.every((s) => HEX.test(s));
  checks.push({ label: "2–4 colours", pass: valid, detail: valid ? `${stops.length} stops` : "use 2 to 4 hex colours", level: "error" });
  if (valid) {
    const worst = Math.min(...stops.map((s) => contrast(s, "#0e1014")));
    checks.push({ label: "Readable on dark", pass: worst >= 3, detail: `darkest stop ${worst}:1 against the page (needs 3:1)`, level: "error" });
  }
  return { ok: checks.every((c) => c.pass), checks };
}
