"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  addComment, buyItem, createList, dailyCheckin, demoIssueTicket, linkCinema, login, redeemTicket,
  register, toggleFavorite, updateProfile, type FormState,
} from "@/app/actions";
import { toast } from "./Toaster";
import { useT } from "./I18n";

/**
 * Like useActionState, but submits via onSubmit so React doesn't reset the
 * form's fields when the server answers with a validation error.
 */
export function useKeptAction(fn: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(fn, undefined);
  const [, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}

export function Notice({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="rounded-md border border-chili/40 bg-chili/10 px-3 py-2 text-sm text-red-300">{state.error}</p>;
  if (state.ok) return <p className="rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-sm text-emerald-300">{state.ok}</p>;
  return null;
}

export function Submit({ children, className = "btn btn-primary", pending }: { children: React.ReactNode; className?: string; pending?: boolean }) {
  return (
    <button className={className} disabled={pending}>
      {pending ? "…" : children}
    </button>
  );
}

// ── Auth ─────────────────────────────────────────────────────────────

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="username">{t("form.usernameOrEmail")}</label>
        <input id="username" name="username" className="input" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("form.password")}</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">{t("auth.signin")}</Submit>
    </form>
  );
}

export function RegisterForm({ countries, next }: { countries: { code: string; name: string; flag: string; region: string }[]; next: string }) {
  const [state, action, pending] = useKeptAction(register);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="username">{t("form.username")}</label>
          <input id="username" name="username" className="input" pattern="[a-zA-Z0-9_]{3,20}" autoComplete="username" required />
        </div>
        <div>
          <label className="label" htmlFor="display_name">{t("form.displayName")}</label>
          <input id="display_name" name="display_name" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">{t("form.email")}</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        <p className="mt-1 text-xs text-muted">{t("form.emailHint")}</p>
      </div>
      <div>
        <label className="label" htmlFor="password">{t("form.password")}</label>
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </div>
      <div>
        <label className="label" htmlFor="home_country">{t("form.homeCountry")}</label>
        <select id="home_country" name="home_country" className="input" defaultValue="MY">
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">{t("form.homeCountryHint")}</p>
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">{t("form.createAccount", { kp: 100 })}</Submit>
    </form>
  );
}

export function SettingsForm({ user, countries }: { user: { display_name: string; bio: string; home_country: string }; countries: { code: string; name: string; flag: string }[] }) {
  const [state, action, pending] = useKeptAction(updateProfile);
  return (
    <form onSubmit={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="display_name">Display name</label>
        <input id="display_name" name="display_name" defaultValue={user.display_name} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" defaultValue={user.bio} className="input min-h-24" maxLength={400} />
      </div>
      <div>
        <label className="label" htmlFor="home_country">Home country</label>
        <select id="home_country" name="home_country" defaultValue={user.home_country} className="input">
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Save</Submit>
    </form>
  );
}

// ── Community ────────────────────────────────────────────────────────

export function CommentForm({ reviewId }: { reviewId: number }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addComment(prev, fd);
    if (res?.ok) (document.getElementById("comment-body") as HTMLTextAreaElement | null)?.form?.reset();
    return res;
  }, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="review_id" value={reviewId} />
      <textarea id="comment-body" name="body" className="input min-h-20" placeholder="Add to the kisah… (+3 KP)" maxLength={1500} required />
      <div className="flex items-center gap-3">
        <Submit pending={pending}>Post comment</Submit>
        {state?.error && <span className="text-sm text-red-300">{state.error}</span>}
      </div>
    </form>
  );
}

export function FavoriteButton({ filmId, isFavorite }: { filmId: number; isFavorite: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className={`btn ${isFavorite ? "btn-primary" : "btn-ghost"} w-full justify-center`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavorite(filmId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
        })
      }
    >
      {isFavorite ? "★ In your top 4" : "☆ Add to top 4"}
    </button>
  );
}

// ── Shop ─────────────────────────────────────────────────────────────

export function BuyButton({ itemId, price, affordable }: { itemId: string; price: number; affordable: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-primary w-full justify-center py-1.5 text-sm"
      disabled={pending || !affordable}
      title={affordable ? undefined : "Not enough KP yet"}
      onClick={() =>
        start(async () => {
          const r = await buyItem(itemId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
          if (r?.ok) toast({ icon: "🛍️", title: r.ok, body: "Equip it from your inventory." });
        })
      }
    >
      {pending ? "…" : `🪙 ${price.toLocaleString()}`}
    </button>
  );
}

export function CheckinButton({ done }: { done: boolean }) {
  const [pending, start] = useTransition();
  const [isDone, setDone] = useState(done);
  return (
    <button
      className={`btn ${isDone ? "btn-ghost" : "btn-jade"}`}
      disabled={pending || isDone}
      onClick={() =>
        start(async () => {
          const r = await dailyCheckin();
          setDone(true);
          if (r?.ok) toast({ icon: "📅", title: "Daily check-in", body: r.ok });
        })
      }
    >
      {isDone ? "✓ Checked in today" : "📅 Daily check-in +10 KP"}
    </button>
  );
}

// ── Catalogues ───────────────────────────────────────────────────────

type PickFilm = { id: number; title: string; year: number; country: string; flag: string };

export function ListBuilder({ films, preselect }: { films: PickFilm[]; preselect?: number }) {
  const [state, action, pending] = useKeptAction(createList);
  const [chosen, setChosen] = useState<number[]>(preselect ? [preselect] : []);
  const [q, setQ] = useState("");
  const byId = new Map(films.map((f) => [f.id, f]));
  const matches = films.filter((f) => !chosen.includes(f.id) && (!q || `${f.title} ${f.year}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 8);
  const move = (i: number, d: number) =>
    setChosen((c) => {
      const n = [...c];
      const j = i + d;
      if (j < 0 || j >= n.length) return c;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <form onSubmit={action} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Name</label>
          <input id="title" name="title" className="input" placeholder="e.g. Films that taste like teh tarik" required maxLength={120} />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" className="input min-h-24" maxLength={1000} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ranked" /> Ranked list (order matters)
        </label>
        <div>
          <label className="label" htmlFor="visibility">Who can see it</label>
          <select id="visibility" name="visibility" className="input" defaultValue="public">
            <option value="public">🌏 Public: on your profile and in search</option>
            <option value="unlisted">🔗 Unlisted: only people with the link</option>
            <option value="private">🔒 Private: just you</option>
          </select>
        </div>
        {chosen.map((id) => (
          <input key={id} type="hidden" name="film" value={id} />
        ))}
        <Notice state={state} />
        <Submit pending={pending}>Create catalogue (+10 KP)</Submit>
      </div>
      <div className="space-y-3">
        <label className="label" htmlFor="picker">Add films</label>
        <input id="picker" className="input" placeholder="Search the catalogue…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="card divide-y divide-line">
          {matches.map((f) => (
            <button type="button" key={f.id} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-raised" onClick={() => setChosen((c) => [...c, f.id])}>
              <span>{f.flag}</span>
              <span className="flex-1">{f.title} <span className="text-muted">({f.year})</span></span>
              <span className="text-jade">+ add</span>
            </button>
          ))}
          {matches.length === 0 && <div className="px-3 py-2 text-sm text-muted">No matches.</div>}
        </div>
        <div className="label mt-4">In this catalogue ({chosen.length})</div>
        <ol className="space-y-1">
          {chosen.map((id, i) => {
            const f = byId.get(id)!;
            return (
              <li key={id} className="card flex items-center gap-2 px-3 py-1.5 text-sm">
                <span className="w-5 text-muted">{i + 1}.</span>
                <span className="flex-1">{f.flag} {f.title}</span>
                <button type="button" className="text-muted hover:text-text" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button type="button" className="text-muted hover:text-text" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button type="button" className="text-chili" onClick={() => setChosen((c) => c.filter((x) => x !== id))} aria-label="Remove">×</button>
              </li>
            );
          })}
        </ol>
      </div>
    </form>
  );
}

// ── Cinemas ──────────────────────────────────────────────────────────

type Chain = { id: string; name: string; currency: string; flag: string };

export function LinkCinemaForm({ chains }: { chains: Chain[] }) {
  const [state, action, pending] = useKeptAction(linkCinema);
  return (
    <form onSubmit={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="chain" className="input" required defaultValue="">
          <option value="" disabled>Choose cinema…</option>
          {chains.map((c) => (
            <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
          ))}
        </select>
        <input name="member_ref" className="input uppercase" placeholder="Membership no." required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-ghost">Link membership</Submit>
    </form>
  );
}

export function RedeemForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, action, pending] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await redeemTicket(p, fd);
    if (r?.ok) toast({ icon: "🎟️", title: "Ticket claimed!", body: r.ok, kind: "achievement" });
    return r;
  }, undefined);
  return (
    <form action={action} className="space-y-3">
      <input name="code" defaultValue={initialCode} key={initialCode} className="input font-mono text-lg tracking-widest uppercase" placeholder="LPD-XXXXXX-XX" required />
      <Notice state={state} />
      <Submit pending={pending}>Claim points</Submit>
    </form>
  );
}

export function DemoBoxOffice({ chains, films }: { chains: Chain[]; films: { id: number; title: string; flag: string }[] }) {
  const [state, action, pending] = useKeptAction(demoIssueTicket);
  const [chain, setChain] = useState(chains[0]?.id ?? "");
  const cur = chains.find((c) => c.id === chain);
  return (
    <div className="space-y-4">
      <form onSubmit={action} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_0.8fr_auto]">
        <select name="chain" className="input" value={chain} onChange={(e) => setChain(e.target.value)}>
          {chains.map((c) => (
            <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
          ))}
        </select>
        <select name="film_id" className="input" defaultValue="">
          <option value="">(no specific film)</option>
          {films.map((f) => (
            <option key={f.id} value={f.id}>{f.flag} {f.title}</option>
          ))}
        </select>
        <div className="relative">
          <input name="amount" type="number" step="0.01" min="0.01" className="input pr-12" placeholder="Price" required />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{cur?.currency}</span>
        </div>
        <Submit pending={pending} className="btn btn-ghost">Buy ticket</Submit>
      </form>
      {state?.error && <Notice state={state} />}
      {state?.ok && (
        <div className="rounded-lg border border-dashed border-saffron/60 bg-saffron/5 p-4">
          <div className="text-xs uppercase tracking-widest text-muted">Your e-ticket code</div>
          <div className="mt-1 font-mono text-2xl tracking-widest text-saffron">{state.ok}</div>
          <p className="mt-2 text-sm text-muted">Now claim it below, just as you would with a real receipt.</p>
          <div className="mt-3">
            <RedeemForm initialCode={state.ok} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SignInPrompt({ what, next }: { what: string; next: string }) {
  return (
    <div className="card p-5 text-center text-sm">
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-saffron hover:underline">Sign in</Link>{" "}
      or{" "}
      <Link href="/register" className="font-semibold text-saffron hover:underline">join</Link> to {what}.
    </div>
  );
}
