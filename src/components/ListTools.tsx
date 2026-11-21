"use client";

import { useActionState, useState, useTransition } from "react";
import { addToList, inviteCollaborator, updateListDetails } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";
import { toast } from "./Toaster";

/** Search the catalogue and add titles in place (owner or collaborators). */
export function AddTitles({ listId, films, inList }: { listId: number; films: { id: number; title: string; year: number; flag: string; kind: string }[]; inList: number[] }) {
  const [q, setQ] = useState("");
  const [added, setAdded] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const have = new Set([...inList, ...added]);
  const matches = q.trim().length < 2 ? [] : films.filter((f) => !have.has(f.id) && `${f.title} ${f.year}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  return (
    <div className="glass p-4">
      <label className="label" htmlFor="add-title">Add titles</label>
      <input id="add-title" className="input" placeholder="Search films & series…" value={q} onChange={(e) => setQ(e.target.value)} />
      {matches.length > 0 && (
        <div className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
          {matches.map((f) => (
            <button
              key={f.id}
              disabled={pending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-raised"
              onClick={() =>
                start(async () => {
                  await addToList(listId, f.id);
                  setAdded((a) => [...a, f.id]);
                  toast({ icon: "➕", title: `Added ${f.title}` });
                })
              }
            >
              <span>{f.flag}</span>
              <span className="flex-1">{f.title} <span className="text-muted">({f.year}{f.kind === "series" ? " · series" : ""})</span></span>
              <span className="font-semibold text-jade">＋ Add</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Owner settings: details, who can see it, collaboration. */
export function ListSettings({ list }: { list: { id: number; title: string; description: string; visibility: string; ranked: number; collaborative: number } }) {
  const [state, action, pending] = useKeptAction(updateListDetails);
  const [invState, invite, invPending] = useActionState(inviteCollaborator, undefined);
  return (
    <details className="glass p-4">
      <summary className="cursor-pointer font-display font-bold">⚙️ Catalogue settings</summary>
      <form onSubmit={action} className="mt-4 space-y-3">
        <input type="hidden" name="list_id" value={list.id} />
        <div>
          <label className="label" htmlFor="ls-title">Name</label>
          <input id="ls-title" name="title" defaultValue={list.title} className="input" maxLength={120} required />
        </div>
        <div>
          <label className="label" htmlFor="ls-desc">Description</label>
          <textarea id="ls-desc" name="description" defaultValue={list.description} className="input min-h-20" maxLength={1000} />
        </div>
        <fieldset>
          <legend className="label">Who can see it</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["public", "🌏 Public", "On your profile and in search"],
              ["unlisted", "🔗 Unlisted", "Only people with the link"],
              ["private", "🔒 Private", "Just you and collaborators"],
            ].map(([v, label, hint]) => (
              <label key={v} className="flex cursor-pointer gap-2 rounded-xl border border-line p-3 text-sm has-[:checked]:border-saffron has-[:checked]:bg-saffron/10">
                <input type="radio" name="visibility" value={v} defaultChecked={list.visibility === v} />
                <span>
                  <b>{label}</b>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="ranked" defaultChecked={!!list.ranked} /> Ranked (numbered)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="collaborative" defaultChecked={!!list.collaborative} /> Collaborative</label>
        </div>
        <Notice state={state} />
        <Submit pending={pending}>Save settings</Submit>
      </form>
      <form action={invite} className="mt-5 space-y-2 border-t border-line pt-4">
        <input type="hidden" name="list_id" value={list.id} />
        <label className="label" htmlFor="ls-invite">Invite a collaborator</label>
        <div className="flex gap-2">
          <input id="ls-invite" name="username" className="input" placeholder="@username" required />
          <Submit pending={invPending} className="btn btn-ghost">Invite</Submit>
        </div>
        <p className="text-xs text-muted">Collaborators can add, remove and reorder titles, like a collaborative playlist.</p>
        <Notice state={invState} />
      </form>
    </details>
  );
}
