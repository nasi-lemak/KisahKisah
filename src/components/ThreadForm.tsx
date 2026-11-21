"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commentOnItem } from "@/app/contribute/actions";
import { toast } from "./Toaster";

export function ThreadForm({ itemId }: { itemId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await commentOnItem(itemId, body);
          if (r.error) return toast({ icon: "⚠️", title: r.error });
          setBody("");
          router.refresh();
        });
      }}
    >
      <input className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" aria-label="Message" maxLength={2000} />
      <button className="btn btn-ghost" disabled={pending || !body.trim()}>Send</button>
    </form>
  );
}
