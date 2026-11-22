import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Selamat kembali</h1>
        <p className="text-muted">Welcome back to your kisah.</p>
      </div>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-muted">
        <Link href="/forgot" className="text-saffron">Forgot your password?</Link>
      </p>
      <p className="text-center text-sm text-muted">
        New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-saffron">Create an account</Link>
      </p>
      <p className="text-center text-xs text-muted">Demo accounts: aisyah, budi, nong, migs, linh, weijie, jiwoo. Password: kisah123</p>
    </div>
  );
}
