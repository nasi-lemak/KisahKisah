"use client";

import { useState } from "react";
import { submitCampaign, updateCampaignBrief } from "@/app/partner/actions";
import { scheduleCampaign } from "@/app/admin/actions";
import { Notice, Submit, useKeptAction } from "../forms";

type C = { markets?: string; id: number; title: string; tagline: string; synopsis: string; release_date: string | null; motif: string; country: string; color1: string; color2: string; starts_on: string | null; ends_on: string | null; featured?: string };

export function CampaignBriefForm({ c, countries, locked }: { c: C; countries: { code: string; name: string; flag: string }[]; locked: boolean }) {
  const [state, action, pending] = useKeptAction(updateCampaignBrief);
  const [v, setV] = useState({ title: c.title, tagline: c.tagline, motif: c.motif, color1: c.color1, color2: c.color2 });
  return (
    <form onSubmit={action} className="space-y-4">
      <fieldset disabled={locked} className="space-y-4">
        <input type="hidden" name="campaign_id" value={c.id} />
        {/* What fans will see on the banner strip */}
        <div className="overflow-hidden rounded-xl border border-line text-sm" style={{ background: `linear-gradient(90deg, ${v.color1}55, ${v.color2}33)` }}>
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-lg">{v.motif || "🎬"}</span>
            <b>{v.title || "Your title"}</b>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider">Sponsored</span>
            <span className="truncate text-muted">{v.tagline || "Your tagline appears here"}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
          <div>
            <label className="label" htmlFor="cb-title">Title</label>
            <input id="cb-title" name="title" className="input" defaultValue={c.title} onChange={(e) => setV({ ...v, title: e.target.value })} required maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="cb-motif">Icon</label>
            <input id="cb-motif" name="motif" className="input text-center text-xl" defaultValue={c.motif} onChange={(e) => setV({ ...v, motif: e.target.value })} maxLength={8} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="cb-tagline">Tagline (on the banner)</label>
          <input id="cb-tagline" name="tagline" className="input" defaultValue={c.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} maxLength={140} placeholder="In cinemas 12 March. Claim the limited stickers!" />
        </div>
        <div>
          <label className="label" htmlFor="cb-synopsis">Synopsis</label>
          <textarea id="cb-synopsis" name="synopsis" className="input min-h-20" defaultValue={c.synopsis} maxLength={600} />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="cb-release">Release date</label>
            <input id="cb-release" type="date" name="release_date" className="input" defaultValue={c.release_date ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="cb-country">Country of origin</label>
            <select id="cb-country" name="country" className="input" defaultValue={c.country}>
              {countries.map((x) => <option key={x.code} value={x.code}>{x.flag} {x.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cb-start">Preferred start</label>
            <input id="cb-start" type="date" name="starts_on" className="input" defaultValue={c.starts_on ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="cb-end">Preferred end</label>
            <input id="cb-end" type="date" name="ends_on" className="input" defaultValue={c.ends_on ?? ""} />
          </div>
        </div>
        <fieldset>
          <legend className="label">Markets: where fans will see it</legend>
          <div className="flex flex-wrap gap-1.5">
            <label className="chip cursor-pointer"><input type="checkbox" name="markets" value="GLOBAL" defaultChecked={(c.markets ?? "").split(",").includes("GLOBAL")} /> 🌏 Global</label>
            {countries.map((x) => (
              <label key={x.code} className="chip cursor-pointer">
                <input type="checkbox" name="markets" value={x.code} defaultChecked={(c.markets ?? "").split(",").includes(x.code)} /> {x.flag} {x.name}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Fans outside these countries won't see the banner or be able to claim the drops.</p>
        </fieldset>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="color" name="color1" defaultValue={c.color1} onChange={(e) => setV({ ...v, color1: e.target.value })} className="h-8 w-10 rounded border border-line bg-transparent" /> Main colour</label>
          <label className="flex items-center gap-2"><input type="color" name="color2" defaultValue={c.color2} onChange={(e) => setV({ ...v, color2: e.target.value })} className="h-8 w-10 rounded border border-line bg-transparent" /> Second colour</label>
        </div>
        <Notice state={state} />
        {!locked && <Submit pending={pending} className="btn btn-ghost">Save brief</Submit>}
      </fieldset>
    </form>
  );
}

export function SubmitCampaignForm({ id }: { id: number }) {
  const [state, action, pending] = useKeptAction(submitCampaign);
  return (
    <form onSubmit={action} className="space-y-3 text-sm">
      <input type="hidden" name="campaign_id" value={id} />
      <label className="flex gap-2"><input type="checkbox" name="licence" required /> We own this artwork or are licensed to use it, including any characters, logos and names, in these markets and dates.</label>
      <label className="flex gap-2"><input type="checkbox" name="disclosure" required /> We understand everything in this campaign is labelled “Sponsored”, and that sponsors can't influence ratings, reviews or scores.</label>
      <Notice state={state} />
      <Submit pending={pending}>📦 Submit campaign for review</Submit>
    </form>
  );
}

export function ScheduleForm({ c }: { c: C }) {
  const [state, action, pending] = useKeptAction(scheduleCampaign);
  return (
    <form onSubmit={action} className="space-y-3">
      <input type="hidden" name="campaign_id" value={c.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="sc-start">Starts</label>
          <input id="sc-start" type="date" name="starts_on" className="input" defaultValue={c.starts_on ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor="sc-end">Ends</label>
          <input id="sc-end" type="date" name="ends_on" className="input" defaultValue={c.ends_on ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor="sc-featured">Featured titles (slugs)</label>
          <input id="sc-featured" name="featured" className="input" defaultValue={c.featured ?? ""} placeholder="ola-bola-2016, mat-kilau-2022" />
        </div>
      </div>
      <Notice state={state} />
      <Submit pending={pending}>📅 Publish items & schedule</Submit>
    </form>
  );
}
