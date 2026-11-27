import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { currentUser } from "../auth";
import { DEFAULT_LOCALE, format, formatDate, isLocale, negotiate, type Locale } from "./core";
import { MESSAGES, type MsgKey } from "./messages";

export const LOCALE_COOKIE = "kk_lang";

/** Chosen language (cookie, then account), else the browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const u = await currentUser();
  if (u && isLocale(u.locale)) return u.locale;
  return negotiate((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
});

export async function getT() {
  const locale = await getLocale();
  const dict = MESSAGES[locale];
  return (key: MsgKey, vars?: Record<string, string | number>) => format(dict[key] ?? MESSAGES.en[key], vars);
}

/** t() plus the locale and a date formatter, for pages that need all three. */
export async function getI18n() {
  const locale = await getLocale();
  const t = await getT();
  return { t, locale, date: (iso: string, style?: "long" | "short" | "medium") => formatDate(iso, locale, style) };
}
