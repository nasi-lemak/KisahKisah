import Link from "next/link";

export const metadata = { title: "Account deleted", robots: { index: false } };

export default function Goodbye() {
  return (
    <div className="mx-auto max-w-md space-y-4 pt-10 text-center">
      <div className="text-5xl">👋</div>
      <h1 className="font-display text-3xl font-bold">Your account is deleted</h1>
      <p className="text-muted">Your reviews, diary, catalogues, points and profile are gone. Terima kasih for your kisah. You're always welcome back.</p>
      <Link href="/" className="btn btn-ghost">Back to KisahKisah</Link>
    </div>
  );
}
