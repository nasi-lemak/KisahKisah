import Link from "next/link";
import { COUNTRIES } from "@/lib/regions";
import { RegisterForm } from "@/components/forms";

export const metadata = { title: "Join" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Start your kisah</h1>
        <p className="text-muted">Free forever. You get 100 KP and three starter avatars.</p>
      </div>
      <div className="card p-6">
        <RegisterForm countries={COUNTRIES} next={next} />
      </div>
      <p className="text-center text-sm text-muted">
        Already a member? <Link href="/login" className="font-semibold text-saffron">Sign in</Link>
      </p>
    </div>
  );
}
