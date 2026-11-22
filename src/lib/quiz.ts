import "server-only";
import { all, one } from "./db";
import type { QuizQuestion } from "./quiz-core";

export type QuizRow = QuizQuestion & { id: number; position: number };

export function quizFor(campaignId: number): QuizRow[] {
  return all<{ id: number; position: number; question: string; options: string; answer: number; explanation: string }>(
    "SELECT id, position, question, options, answer, explanation FROM campaign_quiz WHERE campaign_id = ? ORDER BY position, id", campaignId,
  ).map((r) => ({ ...r, options: JSON.parse(r.options) as string[] }));
}

/** What a fan's browser gets before playing: no answers, no explanations. */
export function publicQuiz(campaignId: number) {
  return quizFor(campaignId).map(({ question, options }) => ({ question, options }));
}

export function quizPlay(userId: number, campaignId: number) {
  return one<{ correct: number; total: number; points: number }>("SELECT correct, total, points FROM quiz_plays WHERE user_id = ? AND campaign_id = ?", userId, campaignId);
}

export function quizStats(campaignId: number) {
  const qs = quizFor(campaignId);
  const plays = all<{ correct: number; total: number; points: number; answers: string }>("SELECT correct, total, points, answers FROM quiz_plays WHERE campaign_id = ?", campaignId);
  const right = qs.map(() => 0);
  for (const p of plays) {
    const given = JSON.parse(p.answers) as number[];
    qs.forEach((q, i) => { if (given[i] === q.answer) right[i]++; });
  }
  return {
    plays: plays.length,
    perfect: plays.filter((p) => p.correct === p.total).length,
    avg: plays.length ? plays.reduce((a, p) => a + p.correct / p.total, 0) / plays.length : 0,
    points: plays.reduce((a, p) => a + p.points, 0),
    perQuestion: qs.map((q, i) => ({ question: q.question, rate: plays.length ? right[i] / plays.length : 0 })),
  };
}
