"use client";

import { useActionState, useEffect, useState } from "react";
import { logFilm } from "@/app/actions";
import { Notice, Submit } from "./forms";

export function StarInput({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={value || ""} />
      <div className="flex text-3xl" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="relative inline-block w-8 cursor-pointer select-none text-center">
            <span className={shown >= i ? "text-saffron" : shown >= i - 0.5 ? "text-saffron/60" : "text-line"}>★</span>
            <button type="button" className="absolute inset-y-0 left-0 w-1/2" aria-label={`${i - 0.5} stars`} onMouseEnter={() => setHover(i - 0.5)} onClick={() => onChange(value === i - 0.5 ? 0 : i - 0.5)} />
            <button type="button" className="absolute inset-y-0 right-0 w-1/2" aria-label={`${i} stars`} onMouseEnter={() => setHover(i)} onClick={() => onChange(value === i ? 0 : i)} />
          </span>
        ))}
      </div>
      <span className="w-10 text-sm text-muted">{shown ? shown.toFixed(1) : "—"}</span>
    </div>
  );
}

const GAMES = [
  { id: "none", icon: "🚫", name: "No game" },
  { id: "guess_rating", icon: "⭐", name: "Teka Bintang", hint: "Readers guess your rating before it's revealed." },
  { id: "trivia", icon: "❓", name: "Kuiz", hint: "Ask a multiple-choice question about the film." },
  { id: "emoji", icon: "🧩", name: "Emoji Riddle", hint: "Describe any film in emojis. Readers guess which." },
  { id: "popcorn", icon: "🍿", name: "Popcorn Catch", hint: "Readers play a 20-second arcade game on your page." },
];

export function LogForm({ film, films, today }: { film: { id: number; title: string }; films: { id: number; title: string; year: number }[]; today: string }) {
  const [state, action, pending] = useActionState(logFilm, undefined);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [game, setGame] = useState("none");
  const [hour, setHour] = useState<number | "">("");
  const [answer, setAnswer] = useState(0);

  useEffect(() => setHour(new Date().getHours()), []);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="film_id" value={film.id} />
      <input type="hidden" name="local_hour" value={hour} />
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <span className="label">Rating</span>
          <StarInput name="rating" value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="label" htmlFor="watched_on">Watched on</label>
          <input id="watched_on" type="date" name="watched_on" defaultValue={today} max={today} className="input w-44" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="liked" /> ❤️ Liked
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="rewatch" /> 🔁 Rewatch
        </label>
      </div>

      <div>
        <label className="label" htmlFor="body">Review (optional, +15 KP)</label>
        <textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className="input min-h-36" placeholder={`What's your kisah with ${film.title}?`} maxLength={8000} />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="spoiler" /> Contains spoilers (readers scratch to reveal)
          </label>
          <span>{body.length >= 400 ? "✨ long-form bonus +10 KP" : `${body.length} chars`}</span>
        </div>
      </div>

      {body.trim() && (
        <>
          <div>
            <label className="label" htmlFor="links">Also posted on… (links, one per line)</label>
            <textarea id="links" name="links" className="input min-h-16 font-mono text-xs" placeholder={"https://movie.douban.com/…\nhttps://pedia.watcha.com/…\nhttps://letterboxd.com/…"} />
            <p className="mt-1 text-xs text-muted">Cross-post your review from Douban, Watcha, Filmarks, Letterboxd, IMDb or your blog.</p>
          </div>

          <div>
            <span className="label">Add a mini game to your review page</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {GAMES.map((g) => (
                <label key={g.id} className={`card cursor-pointer p-3 text-center text-sm transition ${game === g.id ? "border-saffron bg-saffron/10" : "hover:border-muted"}`}>
                  <input type="radio" name="game_type" value={g.id} checked={game === g.id} onChange={() => setGame(g.id)} className="sr-only" />
                  <div className="text-2xl">{g.icon}</div>
                  <div className="mt-1 font-semibold">{g.name}</div>
                </label>
              ))}
            </div>
            {GAMES.find((g) => g.id === game)?.hint && <p className="mt-2 text-xs text-muted">{GAMES.find((g) => g.id === game)?.hint}</p>}

            {game === "trivia" && (
              <div className="mt-3 space-y-2">
                <input name="trivia_question" className="input" placeholder="Your question" maxLength={200} required />
                <input type="hidden" name="trivia_answer" value={answer} />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" checked={answer === i} onChange={() => setAnswer(i)} aria-label={`Option ${i + 1} is correct`} />
                    <input name={`trivia_option_${i}`} className="input" placeholder={`Option ${i + 1}${answer === i ? " (correct answer)" : ""}`} maxLength={80} required />
                  </div>
                ))}
              </div>
            )}
            {game === "emoji" && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input name="emoji_clue" className="input text-xl" placeholder="🚄🧟‍♂️👨‍👧" maxLength={40} required />
                <select name="emoji_film" className="input" defaultValue={film.id} required>
                  {films.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.year})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {game === "guess_rating" && !rating && <p className="mt-2 text-xs text-saffron">Give a star rating above. That&apos;s what readers will guess!</p>}
          </div>
        </>
      )}

      <Notice state={state} />
      <Submit pending={pending}>{body.trim() ? "Publish review" : "Log film"}</Submit>
    </form>
  );
}
