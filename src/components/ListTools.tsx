"use client";

import { useActionState, useState, useTransition } from "react";
import { addToList, inviteCollaborator, updateListDetails } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";
import { toast } from "./Toaster";
import { useT } from "./I18n";

/** Search the catalogue and add titles in place (owner or collaborators). */
export function AddTitles({ listId, films, inList }: { listId: number; films: { id: number; title: string; year: number; flag: string; kind: string }[]; inList: number[] }) {
  const [q, setQ] = useState("");
  const [added, setAdded] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const t = useT();
  const have = new Set([...inList, ...added]);
  const matches = q.trim().length < 2 ? [] : films.filter((f) => !have.has(f.id) && `${f.title} ${f.year}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  return (
    <div className="glass p-4">
      <label className="label" htmlFor="add-title">{t("lists.tools.addTitles")}</label>
      <input id="add-title" className="input" placeholder={t("lists.tools.search")} value={q} onChange={(e) => setQ(e.target.value)} />
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
                  toast({ icon: "➕", title: t("lists.tools.added", { title: f.title }) });
                })
              }
            >
              <span>{f.flag}</span>
              <span className="flex-1">{f.title} <span className="text-muted">({f.year}{f.kind === "series" ? ` · ${t("lists.tools.seriesSuffix")}` : ""})</span></span>
              <span className="font-semibold text-jade">{t("lists.tools.add")}</span>
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
  const t = useT();
  return (
    <details className="glass p-4">
      <summary className="cursor-pointer font-display font-bold">{t("lists.tools.settings")}</summary>
      <form onSubmit={action} className="mt-4 space-y-3">
        <input type="hidden" name="list_id" value={list.id} />
        <div>
          <label className="label" htmlFor="ls-title">{t("lists.form.name")}</label>
          <input id="ls-title" name="title" defaultValue={list.title} className="input" maxLength={120} required />
        </div>
        <div>
          <label className="label" htmlFor="ls-desc">{t("lists.form.description")}</label>
          <textarea id="ls-desc" name="description" defaultValue={list.description} className="input min-h-20" maxLength={1000} />
        </div>
        <fieldset>
          <legend className="label">{t("lists.form.visibility")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["public", t("lists.vis.public"), t("lists.tools.publicHint")],
              ["unlisted", t("lists.vis.unlisted"), t("lists.tools.unlistedHint")],
              ["private", t("lists.vis.private"), t("lists.tools.privateHint")],
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
          <label className="flex items-center gap-2"><input type="checkbox" name="ranked" defaultChecked={!!list.ranked} /> {t("lists.tools.ranked")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="collaborative" defaultChecked={!!list.collaborative} /> {t("lists.tools.collaborative")}</label>
        </div>
        <Notice state={state} />
        <Submit pending={pending}>{t("lists.tools.save")}</Submit>
      </form>
      <form action={invite} className="mt-5 space-y-2 border-t border-line pt-4">
        <input type="hidden" name="list_id" value={list.id} />
        <label className="label" htmlFor="ls-invite">{t("lists.tools.invite")}</label>
        <div className="flex gap-2">
          <input id="ls-invite" name="username" className="input" placeholder="@username" required />
          <Submit pending={invPending} className="btn btn-ghost">{t("lists.tools.inviteBtn")}</Submit>
        </div>
        <p className="text-xs text-muted">{t("lists.tools.inviteHint")}</p>
        <Notice state={invState} />
      </form>
    </details>
  );
}
