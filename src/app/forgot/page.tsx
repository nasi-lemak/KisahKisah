import Link from "next/link";
import { ForgotForm } from "@/components/AccountForms";

export const metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Lupa password?</h1>
        <p className="text-muted">We'll email you a link to choose a new one.</p>
      </div>
      <div className="card p-6"><ForgotForm /></div>
      <p className="text-center text-sm text-muted"><Link href="/login" className="text-saffron">← Back to sign in</Link></p>
    </div>
  );
}
