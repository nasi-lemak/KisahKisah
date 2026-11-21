"use client";

import { applyAsArtist } from "@/app/artists/actions";
import { createBrief } from "@/app/admin/actions";
import { Notice, Submit, useKeptAction } from "../forms";

const TYPES = [["sticker", "Stickers"], ["frame", "Avatar decorations"], ["avatar", "Avatars"], ["banner", "Banners"], ["effect", "Profile effects"], ["theme", "App themes"], ["namestyle", "Name styles"]];

export function ApplyForm() {
  const [state, action, pending] = useKeptAction(applyAsArtist);
  return (
    <form onSubmit={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="ap-url">Portfolio link</label>
        <input id="ap-url" name="portfolio_url" type="url" className="input" placeholder="https://www.behance.net/you" required />
      </div>
      <div>
        <label className="label" htmlFor="ap-bio">About you</label>
        <textarea id="ap-bio" name="bio" className="input min-h-24" placeholder="Your style, where you're based, what you love drawing…" maxLength={1000} />
      </div>
      <fieldset>
        <legend className="label">What do you make?</legend>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(([v, l]) => (
            <label key={v} className="chip cursor-pointer"><input type="checkbox" name="specialities" value={v} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="ap-pay">How should we pay you?</label>
        <input id="ap-pay" name="payout_details" className="input" placeholder="e.g. Wise / PayPal email / DuitNow ID (only staff see this)" maxLength={300} />
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Send application</Submit>
    </form>
  );
}

export function BriefForm({ events }: { events: { id: string; name: string; icon: string }[] }) {
  const [state, action, pending] = useKeptAction(createBrief);
  return (
    <form onSubmit={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="label" htmlFor="br-title">Title</label>
          <input id="br-title" name="title" className="input" placeholder="Hantu Week 2027 sticker pack" required maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="br-type">Item type</label>
          <select id="br-type" name="item_type" className="input">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="br-desc">What we're looking for</label>
        <textarea id="br-desc" name="description" className="input min-h-24" placeholder="Mood, references, must-haves, what to avoid…" maxLength={3000} />
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        <div>
          <label className="label" htmlFor="br-qty">How many</label>
          <input id="br-qty" name="quantity" type="number" min={1} max={12} defaultValue={4} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="br-fee">Fee (total)</label>
          <input id="br-fee" name="fee" type="number" min={1} step="0.01" className="input" placeholder="400" required />
        </div>
        <div>
          <label className="label" htmlFor="br-cur">Currency</label>
          <select id="br-cur" name="currency" className="input">{["USD", "MYR", "SGD", "IDR", "THB", "PHP", "VND", "EUR"].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div>
          <label className="label" htmlFor="br-due">Due</label>
          <input id="br-due" name="due_on" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="br-event">For event</label>
          <select id="br-event" name="event" className="input">
            <option value="">Kedai (no event)</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
          </select>
        </div>
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Post brief</Submit>
    </form>
  );
}
