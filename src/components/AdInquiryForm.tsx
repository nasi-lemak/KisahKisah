"use client";

import { submitAdInquiry } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";

export function AdInquiryForm({ packages, markets }: { packages: { id: string; name: string }[]; markets: { code: string; name: string; flag: string }[] }) {
  const [state, action, pending] = useKeptAction(submitAdInquiry);
  if (state?.ok) return <Notice state={state} />;
  return (
    <form onSubmit={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">Studio / distributor</label>
          <input id="company" name="company" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="contact_name">Your name</label>
          <input id="contact_name" name="contact_name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="title">Film or series</label>
          <input id="title" name="title" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="release_date">Release date</label>
          <input id="release_date" name="release_date" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="package">Package</label>
          <select id="package" name="package" className="input" defaultValue="premiere">
            {packages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="unsure">Not sure yet</option>
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Markets</legend>
        <div className="flex flex-wrap gap-1.5">
          <label className="chip cursor-pointer"><input type="checkbox" name="markets" value="GLOBAL" /> 🌏 Global</label>
          {markets.map((m) => (
            <label key={m.code} className="chip cursor-pointer">
              <input type="checkbox" name="markets" value={m.code} /> {m.flag} {m.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="message">Anything else?</label>
        <textarea id="message" name="message" className="input min-h-24" placeholder="Campaign goals, assets you have, budget range…" />
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Send inquiry</Submit>
    </form>
  );
}
