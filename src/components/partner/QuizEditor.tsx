"use client";

import { useTransition } from "react";
import { deleteQuizQuestion, saveQuizQuestion } from "@/app/quiz-actions";
import { Notice, Submit, useKeptAction } from "../forms";

type Row = { id: number; question: string; options: string[]; answer: number; explanation: string };

function QuestionForm({ campaignId, q, n }: { campaignId: number; q?: Row; n: number }) {
  const [state, action, pending] = useKeptAction(saveQuizQuestion);
  const p = `q${q?.id ?? "new"}`;
  return (
    <form onSubmit={action} className="space-y-2 rounded-xl bg-black/20 p-3">
      <input type="hidden" name="campaign_id" value={campaignId} />
      {q && <input type="hidden" name="id" value={q.id} />}
      <label className="label" htmlFor={`${p}-question`}>Question {n}</label>
      <input id={`${p}-question`} name="question" className="input" defaultValue={q?.question} maxLength={200} required />
      <div className="grid gap-2 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <label key={i} className="flex items-center gap-2">
            <input type="radio" name="answer" value={i} defaultChecked={(q?.answer ?? 0) === i} aria-label={`Answer ${i + 1} is correct`} />
            <input name={`option${i}`} className="input" defaultValue={q?.options[i] ?? ""} maxLength={80} placeholder={i < 2 ? `Answer ${i + 1}` : `Answer ${i + 1} (optional)`} aria-label={`Answer ${i + 1}`} />
          </label>
        ))}
      </div>
      <input name="explanation" className="input" defaultValue={q?.explanation} maxLength={300} placeholder="Fun fact shown after answering (optional)" aria-label="Explanation" />
      <p className="text-xs text-muted">Tick the circle next to the right answer.</p>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-ghost">{q ? "Save question" : "Add question"}</Submit>
    </form>
  );
}

export function QuizEditor({ campaignId, rows, max, locked }: { campaignId: number; rows: Row[]; max: number; locked: boolean }) {
  const [pending, start] = useTransition();
  if (locked) {
    return (
      <ol className="space-y-1 text-sm">
        {rows.length === 0 && <li className="text-muted">No questions.</li>}
        {rows.map((r, i) => <li key={r.id}>{i + 1}. {r.question} <span className="text-muted">({r.options[r.answer]})</span></li>)}
      </ol>
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="space-y-1">
          <QuestionForm campaignId={campaignId} q={r} n={i + 1} />
          <button type="button" className="text-xs text-muted hover:text-red-300" disabled={pending} onClick={() => start(() => deleteQuizQuestion(campaignId, r.id))}>Remove question {i + 1}</button>
        </div>
      ))}
      {rows.length < max && <QuestionForm key={rows.length} campaignId={campaignId} n={rows.length + 1} />}
    </div>
  );
}
