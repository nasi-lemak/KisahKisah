import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { one, run } from "./db";

export const SESSION_COOKIE = "kk_session";
const SESSION_DAYS = 30;

export type User = {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  home_country: string;
  points: number;
  avatar_item: string;
  frame_item: string | null;
  banner_item: string | null;
  title_item: string | null;
  theme_item: string | null;
  effect_item: string | null;
  namestyle_item: string | null;
  accent1: string | null;
  accent2: string | null;
  showcases: string;
  pinned_review_id: number | null;
  role: "member" | "staff" | "admin";
  last_checkin: string | null;
  created_at: string;
  email: string | null;
  email_verified_at: string | null;
  locale: string | null;
  totp_enabled_at: string | null;
};

const USER_COLS = "u.id, u.username, u.display_name, u.bio, u.home_country, u.points, u.avatar_item, u.frame_item, u.banner_item, u.title_item, u.theme_item, u.effect_item, u.namestyle_item, u.accent1, u.accent2, u.showcases, u.pinned_review_id, u.role, u.last_checkin, u.created_at, u.email, u.email_verified_at, u.locale, u.totp_enabled_at";

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)", token, userId, expires.toISOString());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const u = one<User>(
    `SELECT ${USER_COLS} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`,
    token,
    new Date().toISOString(),
  );
  return u ?? null;
});

/** The signed-in user, or a redirect to the sign-in page. */
export async function requireUser(next = "/"): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export function userById(id: number): User | undefined {
  return one<User>(`SELECT ${USER_COLS} FROM users u WHERE u.id = ?`, id);
}

export function userByUsername(username: string): User | undefined {
  return one<User>(`SELECT ${USER_COLS} FROM users u WHERE u.username = ?`, username);
}

/** Staff-only pages and actions. */
export async function requireStaff(): Promise<User> {
  const u = await requireUser("/admin");
  if (u.role !== "staff" && u.role !== "admin") redirect("/");
  // With REQUIRE_STAFF_2FA=1, staff must turn on two-step sign-in before using the admin.
  if (process.env.REQUIRE_STAFF_2FA === "1" && !u.totp_enabled_at) redirect("/settings?need2fa=1#two-step");
  return u;
}

/** After a password change: sign out every other device. */
export async function revokeOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  run("DELETE FROM sessions WHERE user_id = ? AND token != ?", userId, token);
}

export function revokeAllSessions(userId: number) {
  run("DELETE FROM sessions WHERE user_id = ?", userId);
}
