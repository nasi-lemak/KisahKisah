"use client";

import { createContext, useContext } from "react";
import { format, formatDate, type Locale } from "@/lib/i18n/core";
import type { Messages, MsgKey } from "@/lib/i18n/messages";

const Ctx = createContext<{ locale: Locale; messages: Messages } | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>;
}

/** Translate in client components. Falls back to the key if used outside the provider. */
export function useT() {
  const c = useContext(Ctx);
  return (key: MsgKey, vars?: Record<string, string | number>) => format(c?.messages[key] ?? key, vars);
}

export function useLocale(): Locale {
  return useContext(Ctx)?.locale ?? "en";
}

export function useFormatDate() {
  const locale = useLocale();
  return (iso: string, style?: "long" | "short" | "medium") => formatDate(iso, locale, style);
}
