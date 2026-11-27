import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { pendingChallenge } from "@/lib/twofactor";
import { TwoFactorSignIn } from "@/components/TwoFactor";

export const metadata = { title: "Two-step sign-in", robots: { index: false } };

export default async function VerifySignIn({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  if (!(await pendingChallenge())) redirect(`/login?next=${encodeURIComponent(next)}`);
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div className="text-center">
        <div className="text-5xl">🔐</div>
        <h1 className="mt-2 font-display text-3xl font-bold">{t("twofa.title")}</h1>
        <p className="text-muted">{t("twofa.prompt")}</p>
      </div>
      <div className="card p-6"><TwoFactorSignIn next={next} /></div>
      <p className="text-center text-sm"><Link href="/login" className="text-saffron">{t("twofa.back")}</Link></p>
    </div>
  );
}
