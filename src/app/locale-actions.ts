"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { isLocale } from "@/lib/i18n/core";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export async function setLocale(form: FormData) {
  const locale = String(form.get("locale") ?? "");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  const user = await currentUser();
  if (user) run("UPDATE users SET locale = ? WHERE id = ?", locale, user.id);
  revalidatePath("/", "layout");
}
