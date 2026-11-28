"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { changeEmail, changePassword, confirmEmail, deleteMyAccount, requestPasswordReset, resendVerification, resetPassword } from "@/app/account-actions";
import type { FormState } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";
import { useT } from "./I18n";

export function ForgotForm() {
  const [state, action, pending] = useKeptAction(requestPasswordReset);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="who">{t("account.who")}</label>
        <input id="who" name="who" className="input" autoComplete="username" required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">{t("account.sendReset")}</Submit>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useKeptAction(resetPassword);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">{t("account.newPassword")}</label>
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </div>
      <div>
        <label className="label" htmlFor="confirm">{t("account.again")}</label>
        <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">{t("account.setPassword")}</Submit>
    </form>
  );
}

export function ConfirmEmailButton({ token }: { token: string }) {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, start] = useTransition();
  const t = useT();
  if (state?.ok) {
    return (
      <div className="space-y-3">
        <Notice state={state} />
        <Link href="/" className="btn btn-primary w-full justify-center">{t("account.continue")}</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <Notice state={state} />
      <button className="btn btn-primary w-full justify-center" disabled={pending} onClick={() => start(async () => setState(await confirmEmail(token)))}>
        {pending ? t("account.confirming") : t("account.confirmEmail")}
      </button>
    </div>
  );
}

export function EmailSettings({ email, verified }: { email: string | null; verified: boolean }) {
  const [state, action, pending] = useKeptAction(changeEmail);
  const [resent, setResent] = useState<FormState>(undefined);
  const [sending, start] = useTransition();
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{t("account.email")}</span>
        <b>{email ?? t("account.noEmail")}</b>
        {email && (verified ? <span className="chip border-jade py-0 text-xs text-jade">{t("account.confirmed")}</span> : <span className="chip border-saffron py-0 text-xs text-saffron">{t("account.notConfirmed")}</span>)}
        {email && !verified && (
          <button type="button" className="text-xs text-saffron underline" disabled={sending} onClick={() => start(async () => setResent(await resendVerification()))}>
            {sending ? t("account.sending") : t("account.resend")}
          </button>
        )}
      </div>
      <Notice state={resent} />
      <form onSubmit={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="new-email">{email ? t("account.newEmail") : t("account.emailLabel")}</label>
          <input id="new-email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="email-pw">{t("account.currentPassword")}</label>
          <input id="email-pw" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        <Submit pending={pending} className="btn btn-ghost">{t("account.saveEmail")}</Submit>
      </form>
      <Notice state={state} />
    </div>
  );
}

export function PasswordSettings() {
  const [state, action, pending] = useKeptAction(changePassword);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="pw-current">{t("account.currentPassword")}</label>
        <input id="pw-current" name="current" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pw-new">{t("account.newPassword")}</label>
          <input id="pw-new" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </div>
        <div>
          <label className="label" htmlFor="pw-confirm">{t("account.again")}</label>
          <input id="pw-confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </div>
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-ghost">{t("account.changePassword")}</Submit>
    </form>
  );
}

export function DeleteAccountForm({ username, twoFactor }: { username: string; twoFactor: boolean }) {
  const [state, action, pending] = useKeptAction(deleteMyAccount);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-2 text-sm">
      <p className="text-muted">{t("account.deleteWarning")}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <div><label className="label" htmlFor="del-confirm">{t("account.typeUsername", { username })}</label><input id="del-confirm" name="confirm" className="input py-1.5" autoComplete="off" required /></div>
        <div><label className="label" htmlFor="del-pw">{t("account.password")}</label><input id="del-pw" name="password" type="password" className="input py-1.5" autoComplete="current-password" required /></div>
        {twoFactor && <div><label className="label" htmlFor="del-code">{t("account.authCode")}</label><input id="del-code" name="code" className="input py-1.5 font-mono" required /></div>}
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn border border-chili/60 text-red-300 hover:bg-chili/20">{t("account.delete")}</Submit>
    </form>
  );
}
