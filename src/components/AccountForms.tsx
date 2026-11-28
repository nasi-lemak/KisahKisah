"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { changeEmail, changePassword, confirmEmail, deleteMyAccount, requestPasswordReset, resendVerification, resetPassword } from "@/app/account-actions";
import type { FormState } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";

export function ForgotForm() {
  const [state, action, pending] = useKeptAction(requestPasswordReset);
  return (
    <form onSubmit={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="who">Username or email</label>
        <input id="who" name="who" className="input" autoComplete="username" required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">Email me a reset link</Submit>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useKeptAction(resetPassword);
  return (
    <form onSubmit={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Type it again</label>
        <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">Set new password</Submit>
    </form>
  );
}

export function ConfirmEmailButton({ token }: { token: string }) {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, start] = useTransition();
  if (state?.ok) {
    return (
      <div className="space-y-3">
        <Notice state={state} />
        <Link href="/" className="btn btn-primary w-full justify-center">Continue</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <Notice state={state} />
      <button className="btn btn-primary w-full justify-center" disabled={pending} onClick={() => start(async () => setState(await confirmEmail(token)))}>
        {pending ? "Confirming…" : "Confirm my email"}
      </button>
    </div>
  );
}

export function EmailSettings({ email, verified }: { email: string | null; verified: boolean }) {
  const [state, action, pending] = useKeptAction(changeEmail);
  const [resent, setResent] = useState<FormState>(undefined);
  const [sending, start] = useTransition();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Email:</span>
        <b>{email ?? "none yet"}</b>
        {email && (verified ? <span className="chip border-jade py-0 text-xs text-jade">✓ confirmed</span> : <span className="chip border-saffron py-0 text-xs text-saffron">not confirmed</span>)}
        {email && !verified && (
          <button type="button" className="text-xs text-saffron underline" disabled={sending} onClick={() => start(async () => setResent(await resendVerification()))}>
            {sending ? "Sending…" : "Resend link"}
          </button>
        )}
      </div>
      <Notice state={resent} />
      <form onSubmit={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="new-email">{email ? "New email" : "Email"}</label>
          <input id="new-email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="email-pw">Current password</label>
          <input id="email-pw" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        <Submit pending={pending} className="btn btn-ghost">Save email</Submit>
      </form>
      <Notice state={state} />
    </div>
  );
}

export function PasswordSettings() {
  const [state, action, pending] = useKeptAction(changePassword);
  return (
    <form onSubmit={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="pw-current">Current password</label>
        <input id="pw-current" name="current" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pw-new">New password</label>
          <input id="pw-new" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </div>
        <div>
          <label className="label" htmlFor="pw-confirm">Type it again</label>
          <input id="pw-confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </div>
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-ghost">Change password</Submit>
    </form>
  );
}

export function DeleteAccountForm({ username, twoFactor }: { username: string; twoFactor: boolean }) {
  const [state, action, pending] = useKeptAction(deleteMyAccount);
  return (
    <form onSubmit={action} className="space-y-2 text-sm">
      <p className="text-muted">This deletes your reviews, comments, diary, catalogues, watchlist, points and items, and can&apos;t be undone. Download your data first if you want a copy.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div><label className="label" htmlFor="del-confirm">Type “{username}”</label><input id="del-confirm" name="confirm" className="input py-1.5" autoComplete="off" required /></div>
        <div><label className="label" htmlFor="del-pw">Password</label><input id="del-pw" name="password" type="password" className="input py-1.5" autoComplete="current-password" required /></div>
        {twoFactor && <div><label className="label" htmlFor="del-code">Authenticator code</label><input id="del-code" name="code" className="input py-1.5 font-mono" required /></div>}
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn border border-chili/60 text-red-300 hover:bg-chili/20">Delete my account</Submit>
    </form>
  );
}
