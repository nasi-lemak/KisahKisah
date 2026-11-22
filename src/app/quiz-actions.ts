"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { one, run, tx } from "@/lib/db";
import { activeOccurrence, today } from "@/lib/events";
import { award } from "@/lib/rewards";
import { campaignById, isOrgMember } from "@/lib/portal";
import { inMarkets } from "@/lib/reminders-core";
import { QUIZ_MAX_QUESTIONS, quizPoints, quizProblems, scoreQuiz } from "@/lib/quiz-core";
import { quizFor } from "@/lib/quiz";
import { campaignToEvent } from "@/lib/workflow";
import type { FormState } from "./actions";

async function editable(campaignId: number) {
  const user = await requireUser();
  const c = campaignById(campaignId);
  if (!c) return null;
  const staff = user.role === "staff" || user.role === "admin";
  if (!staff && !isOrgMember(c.org_id, user.id)) return null;
  // Partners edit while drafting the brief; staff can fix typos until the campaign goes live.
  if (!staff && c.status !== "brief") return null;
  if (staff && c.status === "scheduled" && one("SELECT 1 x FROM quiz_plays WHERE campaign_id = ?", c.id)) return null;
  return c;
}

export async function saveQuizQuestion(_: FormState, form: FormData): Promise<FormState> {
  const c = await editable(Number(form.get("campaign_id")));
  if (!c) return { error: "The quiz can't be edited right now." };
  const s = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const raw = [0, 1, 2, 3].map((i) => s(`option${i}`, 80));
  const answerRaw = Number(form.get("answer"));
  // Keep the marked answer pointing at the same text after blank options are dropped.
  const options = raw.filter(Boolean);
  const answer = raw[answerRaw] ? options.indexOf(raw[answerRaw]) : -1;
  const q = { question: s("question", 200), options, answer, explanation: s("explanation", 300) };
  const problems = quizProblems(q);
  if (problems.length) return { error: problems.join(" ") };
  const id = Number(form.get("id")) || 0;
  if (id) {
    run("UPDATE campaign_quiz SET question = ?, options = ?, answer = ?, explanation = ? WHERE id = ? AND campaign_id = ?", q.question, JSON.stringify(q.options), q.answer, q.explanation, id, c.id);
  } else {
    const n = one<{ n: number }>("SELECT COUNT(*) n FROM campaign_quiz WHERE campaign_id = ?", c.id)!.n;
    if (n >= QUIZ_MAX_QUESTIONS) return { error: `Up to ${QUIZ_MAX_QUESTIONS} questions.` };
    run("INSERT INTO campaign_quiz (campaign_id, position, question, options, answer, explanation) VALUES (?,?,?,?,?,?)", c.id, n, q.question, JSON.stringify(q.options), q.answer, q.explanation);
  }
  revalidatePath(`/partner/campaigns/${c.id}`);
  revalidatePath(`/admin/campaigns/${c.id}`);
  return { ok: id ? "Question updated." : "Question added." };
}

export async function deleteQuizQuestion(campaignId: number, id: number) {
  const c = await editable(campaignId);
  if (!c) return;
  run("DELETE FROM campaign_quiz WHERE id = ? AND campaign_id = ?", id, c.id);
  revalidatePath(`/partner/campaigns/${c.id}`);
  revalidatePath(`/admin/campaigns/${c.id}`);
}

export async function saveQuizReward(campaignId: number, form: FormData) {
  await requireStaff();
  const kp = Math.max(0, Math.min(100, Math.round(Number(form.get("quiz_reward")) || 0)));
  run("UPDATE campaigns SET quiz_reward = ? WHERE id = ?", kp, campaignId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export type QuizResult = { error?: string; correct?: number; total?: number; points?: number; review?: { answer: number; explanation: string; right: boolean }[] };

/** One play per fan per campaign, only while it's live and in their market. */
export async function playCampaignQuiz(campaignId: number, answers: number[]): Promise<QuizResult> {
  const user = await requireUser();
  const c = campaignById(campaignId);
  if (!c || c.status !== "scheduled" || !c.starts_on || !c.ends_on) return { error: "This quiz isn't running." };
  if (!activeOccurrence(campaignToEvent({ ...c, starts_on: c.starts_on, ends_on: c.ends_on }), today())) return { error: "This quiz isn't running right now." };
  if (!inMarkets(c.markets, user.home_country)) return { error: "This campaign isn't running in your country." };
  const qs = quizFor(c.id);
  if (!qs.length) return { error: "No questions yet." };
  const given = Array.isArray(answers) ? answers.slice(0, qs.length) : [];
  const score = scoreQuiz(qs.map((q) => q.answer), given);
  const points = quizPoints(score.correct, score.total, c.quiz_reward);
  const saved = tx(() => {
    const ins = run(
      "INSERT OR IGNORE INTO quiz_plays (user_id, campaign_id, correct, total, points, answers) VALUES (?,?,?,?,?,?)",
      user.id, c.id, score.correct, score.total, points, JSON.stringify(given),
    );
    if (Number(ins.changes) !== 1) return false;
    if (points) award(user.id, points, "quiz", `cmp:${c.id}`, `${c.title} Kuiz: ${score.correct}/${score.total}`);
    return true;
  });
  if (!saved) return { error: "You've already played this quiz." };
  revalidatePath(`/events/cmp-${c.id}`);
  return { correct: score.correct, total: score.total, points, review: qs.map((q, i) => ({ answer: q.answer, explanation: q.explanation, right: score.results[i] })) };
}
