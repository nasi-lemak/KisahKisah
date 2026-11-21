import "server-only";
import { all } from "./db";
import type { Review } from "./queries";

/**
 * Mini games a reviewer can attach to their review page. Readers play once
 * per review; winners earn KP. Answers never leave the server until played.
 */
export type GameType = "none" | "trivia" | "guess_rating" | "emoji" | "popcorn";

export const GAME_INFO: Record<Exclude<GameType, "none">, { name: string; icon: string; blurb: string; reward: number }> = {
  guess_rating: { name: "Teka Bintang", icon: "⭐", blurb: "Readers guess your star rating before it's revealed.", reward: 10 },
  trivia: { name: "Kuiz", icon: "❓", blurb: "Write a multiple-choice question about the film.", reward: 10 },
  emoji: { name: "Emoji Riddle", icon: "🧩", blurb: "Describe any film in emojis; readers pick which one.", reward: 12 },
  popcorn: { name: "Popcorn Catch", icon: "🍿", blurb: "A 20-second arcade game: catch popcorn, dodge durians.", reward: 15 },
};

export const POPCORN_TARGET = 25;
export const POPCORN_MAX_SCORE = 120; // more than this in 20s is not humanly possible

export type PublicGame =
  | { type: "trivia"; question: string; options: string[] }
  | { type: "guess_rating" }
  | { type: "emoji"; emojis: string; options: { id: number; title: string; year: number }[] }
  | { type: "popcorn"; target: number };

type Config = { question?: string; options?: string[]; answer?: number; emojis?: string; filmId?: number };

function parse(r: Pick<Review, "game_config">): Config {
  try {
    return JSON.parse(r.game_config) as Config;
  } catch {
    return {};
  }
}

/** Deterministic PRNG so the emoji options are stable for a given review. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function emojiOptions(reviewId: number, filmId: number) {
  const films = all<{ id: number; title: string; year: number }>("SELECT id, title, year FROM films ORDER BY id");
  const rand = rng(reviewId * 9973 + filmId);
  const others = films.filter((f) => f.id !== filmId).sort(() => rand() - 0.5).slice(0, 3);
  const answer = films.find((f) => f.id === filmId);
  const opts = answer ? [...others, answer] : others;
  return opts.sort(() => rand() - 0.5);
}

export function publicGame(r: Review): PublicGame | null {
  const c = parse(r);
  switch (r.game_type) {
    case "trivia":
      return c.question && c.options ? { type: "trivia", question: c.question, options: c.options } : null;
    case "guess_rating":
      return r.rating ? { type: "guess_rating" } : null;
    case "emoji":
      return c.emojis && c.filmId ? { type: "emoji", emojis: c.emojis, options: emojiOptions(r.id, c.filmId) } : null;
    case "popcorn":
      return { type: "popcorn", target: POPCORN_TARGET };
    default:
      return null;
  }
}

export type Verdict = { won: boolean; score: number; points: number; message: string; reveal?: string | number };

export function judge(r: Review, answer: number): Verdict {
  const c = parse(r);
  switch (r.game_type) {
    case "trivia": {
      const won = answer === c.answer;
      return { won, score: won ? 1 : 0, points: won ? GAME_INFO.trivia.reward : 0, message: won ? "Betul! Spot on." : "Alamak, not quite.", reveal: c.answer };
    }
    case "guess_rating": {
      const diff = Math.abs(answer - (r.rating ?? 0));
      const won = diff <= 0.5;
      const points = diff === 0 ? GAME_INFO.guess_rating.reward : won ? Math.round(GAME_INFO.guess_rating.reward / 2) : 0;
      return {
        won, score: Math.round((5 - diff) * 2), points,
        message: diff === 0 ? "Exactly right! Are you a mind reader?" : won ? "So close, half a star off!" : "Not even close, lah.",
        reveal: r.rating ?? 0,
      };
    }
    case "emoji": {
      const won = answer === c.filmId;
      return { won, score: won ? 1 : 0, points: won ? GAME_INFO.emoji.reward : 0, message: won ? "You cracked the riddle!" : "Nope! Better luck next time.", reveal: c.filmId };
    }
    case "popcorn": {
      const score = Math.max(0, Math.min(POPCORN_MAX_SCORE, Math.floor(answer)));
      const won = score >= POPCORN_TARGET;
      const points = won ? Math.min(GAME_INFO.popcorn.reward + Math.floor((score - POPCORN_TARGET) / 10), 25) : Math.floor(score / 10);
      return { won, score, points, message: won ? `${score} popcorn! Sedap!` : `${score} popcorn. You needed ${POPCORN_TARGET}.` };
    }
    default:
      throw new Error("This review has no game.");
  }
}

/** Build a stored config from the review form. Throws a friendly error on bad input. */
export function configFromForm(type: string, form: FormData): { type: GameType; config: Config } {
  const s = (k: string) => String(form.get(k) ?? "").trim();
  switch (type) {
    case "trivia": {
      const question = s("trivia_question").slice(0, 200);
      const options = [0, 1, 2, 3].map((i) => s(`trivia_option_${i}`).slice(0, 80));
      const answer = Number(s("trivia_answer"));
      if (!question || options.some((o) => !o)) throw new Error("A quiz needs a question and four options.");
      if (![0, 1, 2, 3].includes(answer)) throw new Error("Pick which option is correct.");
      return { type, config: { question, options, answer } };
    }
    case "emoji": {
      const emojis = s("emoji_clue").slice(0, 40);
      const filmId = Number(s("emoji_film"));
      if (!emojis || !filmId) throw new Error("An emoji riddle needs emojis and the film they describe.");
      return { type, config: { emojis, filmId } };
    }
    case "guess_rating":
    case "popcorn":
      return { type, config: {} };
    default:
      return { type: "none", config: {} };
  }
}
