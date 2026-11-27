"use client";

import { useEffect, useState } from "react";
import { logFilm } from "@/app/actions";
import { useT } from "./I18n";
import type { MsgKey } from "@/lib/i18n/messages";
import { Notice, Submit, useKeptAction } from "./forms";

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
  { id: "none", icon: "🚫", name: "", hint: null },
  { id: "guess_rating", icon: "⭐", name: "Teka Bintang", hint: "log.hintGuess" },
  { id: "trivia", icon: "❓", name: "Kuiz", hint: "log.hintTrivia" },
  { id: "emoji", icon: "🧩", name: "Emoji Riddle", hint: "log.hintEmoji" },
  { id: "popcorn", icon: "🍿", name: "Popcorn Catch", hint: "log.hintPopcorn" },
] as const satisfies readonly { id: string; icon: string; name: string; hint: MsgKey | null }[];

export function LogForm({ film, films, today }: { film: { id: number; title: string }; films: { id: number; title: string; year: number }[]; today: string }) {
  const [state, action, pending] = useKeptAction(logFilm);
  const t = useT();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [game, setGame] = useState("none");
  const [hour, setHour] = useState<number | "">("");
  const [answer, setAnswer] = useState(0);

  useEffect(() => setHour(new Date().getHours()), []);

  return (
    <form onSubmit={action} className="space-y-5">
      <input type="hidden" name="film_id" value={film.id} />
      <input type="hidden" name="local_hour" value={hour} />
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <span className="label">{t("log.rating")}</span>
          <StarInput name="rating" value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="label" htmlFor="watched_on">{t("log.watchedOn")}</label>
          <input id="watched_on" type="date" name="watched_on" defaultValue={today} max={today} className="input w-44" />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="liked" /> {t("log.liked")}
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="rewatch" /> {t("log.rewatch")}
        </label>
      </div>

      <div>
        <label className="label" htmlFor="body">{t("log.review")}</label>
        <textarea id="body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className="input min-h-36" placeholder={t("log.reviewPlaceholder", { title: film.title })} maxLength={8000} />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="spoiler" /> {t("log.spoilers")}
          </label>
          <span>{body.length >= 400 ? t("log.longBonus") : t("log.chars", { n: body.length })}</span>
        </div>
      </div>

      {body.trim() && (
        <>
          <div>
            <label className="label" htmlFor="links">{t("log.links")}</label>
            <textarea id="links" name="links" className="input min-h-16 font-mono text-xs" placeholder={"https://movie.douban.com/…\nhttps://pedia.watcha.com/…\nhttps://letterboxd.com/…"} />
            <p className="mt-1 text-xs text-muted">{t("log.linksHint")}</p>
          </div>

          <div>
            <span className="label">{t("log.game")}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {GAMES.map((g) => (
                <label key={g.id} className={`card cursor-pointer p-3 text-center text-sm transition ${game === g.id ? "border-saffron bg-saffron/10" : "hover:border-muted"}`}>
                  <input type="radio" name="game_type" value={g.id} checked={game === g.id} onChange={() => setGame(g.id)} className="sr-only" />
                  <div className="text-2xl">{g.icon}</div>
                  <div className="mt-1 font-semibold">{g.name || t("log.gameNone")}</div>
                </label>
              ))}
            </div>
            {(() => { const h = GAMES.find((g) => g.id === game)?.hint; return h ? <p className="mt-2 text-xs text-muted">{t(h)}</p> : null; })()}

            {game === "trivia" && (
              <div className="mt-3 space-y-2">
                <input name="trivia_question" className="input" placeholder={t("log.question")} maxLength={200} required />
                <input type="hidden" name="trivia_answer" value={answer} />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" checked={answer === i} onChange={() => setAnswer(i)} aria-label={t("log.optionCorrect", { n: i + 1 })} />
                    <input name={`trivia_option_${i}`} className="input" placeholder={answer === i ? t("log.optionCorrect", { n: i + 1 }) : t("log.option", { n: i + 1 })} maxLength={80} required />
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
            {game === "guess_rating" && !rating && <p className="mt-2 text-xs text-saffron">{t("log.giveRating")}</p>}
          </div>
        </>
      )}

      <Notice state={state} />
      <Submit pending={pending}>{body.trim() ? t("log.publish") : t("log.logFilm")}</Submit>
    </form>
  );
}
