/** Pure rules for the official campaign Kuiz. */

export const QUIZ_MAX_QUESTIONS = 5;

export type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string };

export function quizProblems(q: QuizQuestion): string[] {
  const out: string[] = [];
  if (q.question.trim().length < 8) out.push("Write a question (8+ characters).");
  if (q.question.length > 200) out.push("Keep the question under 200 characters.");
  const opts = q.options.map((o) => o.trim()).filter(Boolean);
  if (opts.length < 2 || opts.length > 4) out.push("Give 2 to 4 answers.");
  if (opts.some((o) => o.length > 80)) out.push("Keep each answer under 80 characters.");
  if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) out.push("Answers must all be different.");
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= opts.length) out.push("Mark which answer is correct.");
  return out;
}

/** Correct count; missing or out-of-range answers count as wrong. */
export function scoreQuiz(key: number[], given: unknown[]): { correct: number; total: number; results: boolean[] } {
  const results = key.map((k, i) => Number.isInteger(given[i]) && given[i] === k);
  return { correct: results.filter(Boolean).length, total: key.length, results };
}

/** Reward scales with the share of right answers; a perfect score earns a 25% bonus. */
export function quizPoints(correct: number, total: number, reward: number): number {
  if (!total || correct <= 0 || reward <= 0) return 0;
  const base = Math.round((reward * correct) / total);
  return correct === total ? Math.round(base * 1.25) : base;
}
