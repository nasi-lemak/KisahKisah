"use client";

import { useRef } from "react";
import { LOCALES, type Locale } from "@/lib/i18n/core";
import { setLocale } from "@/app/locale-actions";

/** Works without JavaScript (submit button) and switches instantly with it. */
export function LanguagePicker({ current, label, id = "lang-picker" }: { current: Locale; label: string; id?: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setLocale} className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs">🌐 {label}</label>
      <select id={id} name="locale" defaultValue={current} className="input w-auto py-1 text-xs" onChange={() => form.current?.requestSubmit()}>
        {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
      </select>
      <noscript><button className="chip">OK</button></noscript>
    </form>
  );
}
