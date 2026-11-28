"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { playCampaignQuiz, type QuizResult } from "@/app/quiz-actions";
import { useT } from "./I18n";
import { Rich } from "./Rich";

type Q = { question: string; options: string[] };

export function CampaignQuiz({ campaignId, questions, reward, played }: { campaignId: number; questions: Q[]; reward: number; played: { correct: number; total: number; points: number } | null }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const t = useT();
  const i = answers.length;

  if (played && !result) {
    return <p className="text-sm"><Rich text={t("quiz.played")} nodes={{ score: <b>{played.correct}/{played.total}</b>, kp: <b className="text-saffron">{played.points} KP</b> }} /></p>;
  }
  if (result?.error) return <p className="text-sm text-red-300">{result.error}</p>;
  if (result) {
    return (
      <div className="space-y-3">
        <p className="font-display text-xl font-bold">{result.correct}/{result.total} · +{result.points} KP {result.correct === result.total ? "🏆" : ""}</p>
        <ol className="space-y-2 text-sm">
          {questions.map((q, k) => (
            <li key={k} className="rounded-lg bg-black/20 p-3">
              <div className="font-semibold">{result.review![k].right ? "✅" : "❌"} {q.question}</div>
              <div className="text-muted"><Rich text={t("quiz.answer")} nodes={{ answer: <span className="text-text">{q.options[result.review![k].answer]}</span> }} />{result.review![k].explanation ? ` · ${result.review![k].explanation}` : ""}</div>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  const q = questions[i];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{t("quiz.question", { n: Math.min(i + 1, questions.length), total: questions.length })}</span>
        <span>{t("quiz.upTo", { n: Math.round(reward * 1.25) })}</span>
      </div>
      <div className="h-1 overflow-hidden rounded bg-black/30"><div className="h-full bg-saffron transition-all" style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      {q ? (
        <>
          <div className="font-display text-lg font-bold">{q.question}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => (
              <button key={k} type="button" className="btn btn-ghost justify-start text-left" onClick={() => setAnswers([...answers, k])}>{o}</button>
            ))}
          </div>
        </>
      ) : (
        <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(async () => { setResult(await playCampaignQuiz(campaignId, answers)); router.refresh(); })}>
          {pending ? t("quiz.checking") : t("quiz.see")}
        </button>
      )}
    </div>
  );
}
