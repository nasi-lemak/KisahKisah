"use client";

import { useActionState, useState, useTransition } from "react";
import { confirmTwoFactor, disableTwoFactor, newRecoveryCodesAction, startTwoFactorSetup, verifySignIn, type CodesState, type SetupState } from "@/app/twofactor-actions";
import { Notice, Submit, useKeptAction } from "./forms";
import { useT } from "./I18n";

export function TwoFactorSignIn({ next }: { next: string }) {
  const [state, action, pending] = useKeptAction(verifySignIn);
  const t = useT();
  return (
    <form onSubmit={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="code">{t("twofa.code")}</label>
        <input id="code" name="code" className="input text-center font-mono text-2xl tracking-[0.4em]" inputMode="text" autoComplete="one-time-code" autoFocus required maxLength={12} />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary w-full justify-center">{t("twofa.verify")}</Submit>
    </form>
  );
}

function Codes({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-2 rounded-xl border border-saffron/50 bg-saffron/5 p-4">
      <p className="text-sm font-semibold">Save these recovery codes somewhere safe. Each works once if you lose your phone. They won&apos;t be shown again.</p>
      <ul className="grid grid-cols-2 gap-1 font-mono text-sm" aria-label="Recovery codes">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
      <button type="button" className="chip" onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}>Copy all</button>
    </div>
  );
}

export function TwoFactorSettings({ enabled, codesLeft, required }: { enabled: boolean; codesLeft: number; required: boolean }) {
  const [setup, setSetup] = useState<SetupState>(null);
  const [starting, start] = useTransition();
  const [confirmed, confirm, confirming] = useActionState<CodesState, FormData>(confirmTwoFactor, undefined);
  const [fresh, regenerate, regenerating] = useActionState<CodesState, FormData>(newRecoveryCodesAction, undefined);
  const [off, disable, disabling] = useKeptAction(disableTwoFactor);

  if (confirmed?.codes) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-300">✓ Two-step sign-in is on. Other devices were signed out.</p>
        <Codes codes={confirmed.codes} />
      </div>
    );
  }
  if (!enabled) {
    return (
      <div className="space-y-3 text-sm">
        {off?.ok && <Notice state={off} />}
        <p className="text-muted">Protect your account with a code from an authenticator app (Google Authenticator, 1Password, Authy…) whenever you sign in.{required ? " Staff accounts need this to use the admin." : ""}</p>
        {!setup && <button type="button" className="btn btn-primary" disabled={starting} onClick={() => start(async () => setSetup(await startTwoFactorSetup()))}>{starting ? "…" : "Set up two-step sign-in"}</button>}
        {setup && "error" in setup && <p className="text-red-300">{setup.error}</p>}
        {setup && "secret" in setup && (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="h-44 w-44 overflow-hidden rounded-xl bg-white p-2" aria-label="QR code for your authenticator app" dangerouslySetInnerHTML={{ __html: setup.qr }} />
            <div className="space-y-2">
              <p>1. Scan the QR code with your authenticator app, or enter this key:</p>
              <code className="block select-all break-all rounded bg-ink px-2 py-1 text-xs" data-testid="totp-secret">{setup.secret}</code>
              <p>2. Type the 6-digit code it shows:</p>
              <form action={confirm} className="flex gap-2">
                <input name="code" className="input w-36 text-center font-mono text-lg tracking-widest" inputMode="numeric" autoComplete="one-time-code" aria-label="Code from your app" required maxLength={6} />
                <Submit pending={confirming}>Turn on</Submit>
              </form>
              {confirmed?.error && <p className="text-red-300">{confirmed.error}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-4 text-sm">
      <p><span className="chip border-jade py-0 text-xs text-jade">✓ on</span> <span className="text-muted">{codesLeft} recovery code{codesLeft === 1 ? "" : "s"} left.</span></p>
      {fresh?.codes ? <Codes codes={fresh.codes} /> : (
        <form action={regenerate} className="flex flex-wrap items-end gap-2">
          <div><label className="label" htmlFor="rc-code">Code from your app</label><input id="rc-code" name="code" className="input w-36 py-1.5 font-mono" inputMode="numeric" required maxLength={6} /></div>
          <Submit pending={regenerating} className="btn btn-ghost">New recovery codes</Submit>
          {fresh?.error && <p className="w-full text-red-300">{fresh.error}</p>}
        </form>
      )}
      {!required && (
        <details>
          <summary className="cursor-pointer text-muted">Turn off two-step sign-in</summary>
          <form onSubmit={disable} className="mt-2 flex flex-wrap items-end gap-2">
            <div><label className="label" htmlFor="off-pw">Password</label><input id="off-pw" name="password" type="password" className="input py-1.5" autoComplete="current-password" required /></div>
            <div><label className="label" htmlFor="off-code">Code or recovery code</label><input id="off-code" name="code" className="input w-40 py-1.5 font-mono" required /></div>
            <Submit pending={disabling} className="btn btn-ghost">Turn off</Submit>
            <div className="w-full"><Notice state={off} /></div>
          </form>
        </details>
      )}
    </div>
  );
}
