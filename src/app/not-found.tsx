import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="text-6xl">🎞️</div>
      <h1 className="mt-4 font-display text-3xl font-bold">This reel is missing</h1>
      <p className="mt-2 text-muted">The projectionist looked everywhere. Maybe it was a deleted scene?</p>
      <Link href="/" className="btn btn-primary mt-6">Back to the lobby</Link>
    </div>
  );
}
