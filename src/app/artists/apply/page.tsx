import { requireUser } from "@/lib/auth";
import { ApplyForm } from "@/components/artists/ArtistForms";

export const metadata = { title: "Apply as an artist" };

export default async function ApplyPage() {
  await requireUser("/artists/apply");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Apply to the artist programme</h1>
      <p className="text-muted">Tell us about your work. Once approved you can claim paid briefs.</p>
      <div className="glass p-6"><ApplyForm /></div>
    </div>
  );
}
