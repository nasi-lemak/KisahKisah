"use client";

import { useRef, useState, useTransition } from "react";
import { saveStickerBoard } from "@/app/actions";
import { Sticker } from "./ui";
import { toast } from "./Toaster";

type Placed = { item_id: string; x: number; y: number; rot: number; scale: number; z: number };

/** Steam-style sticker showcase. Owners can drag, rotate, resize and layer stickers. */
export function StickerBoard({ initial, owned, editable }: { initial: Placed[]; owned: { id: string; name: string }[]; editable: boolean }) {
  const [items, setItems] = useState<Placed[]>(initial);
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; dx: number; dy: number } | null>(null);

  const update = (i: number, patch: Partial<Placed>) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const toPct = (clientX: number, clientY: number) => {
    const r = board.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  };

  const onDown = (i: number) => (e: React.PointerEvent) => {
    if (!editing) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toPct(e.clientX, e.clientY);
    drag.current = { i, dx: p.x - items[i].x, dy: p.y - items[i].y };
    setSel(i);
    const top = Math.max(0, ...items.map((x) => x.z)) + 1;
    update(i, { z: top });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toPct(e.clientX, e.clientY);
    update(drag.current.i, { x: Math.min(97, Math.max(3, p.x - drag.current.dx)), y: Math.min(95, Math.max(5, p.y - drag.current.dy)) });
  };
  const onUp = () => (drag.current = null);

  const add = (id: string) => {
    if (items.length >= 20) return toast({ icon: "🏷️", title: "Board is full (20 stickers max)" });
    const top = Math.max(0, ...items.map((x) => x.z)) + 1;
    setItems((xs) => [...xs, { item_id: id, x: 20 + Math.random() * 60, y: 25 + Math.random() * 50, rot: Math.round(Math.random() * 40 - 20), scale: 1, z: top }]);
    setSel(items.length);
  };

  const save = () =>
    start(async () => {
      const r = await saveStickerBoard(items);
      if (r?.error) toast({ icon: "⚠️", title: r.error });
      else {
        toast({ icon: "🏷️", title: "Sticker board saved" });
        setEditing(false);
        setSel(null);
      }
    });

  return (
    <div>
      <div ref={board} className="sticker-board" onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClick={(e) => e.target === board.current && setSel(null)}>
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            {editable ? "Your sticker board is empty. Hit Edit and start slapping." : "No stickers yet."}
          </div>
        )}
        {items.map((s, i) => (
          <div
            key={i}
            className={`board-item ${editing ? "editable" : ""} ${editing && sel === i ? "selected" : ""}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, zIndex: s.z, transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${s.scale})` }}
            onPointerDown={onDown(i)}
          >
            <Sticker id={s.item_id} size={46} animate={!editing} />
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex flex-wrap items-center gap-2 p-3">
          {!editing ? (
            <button className="btn btn-ghost py-1.5 text-sm" onClick={() => setEditing(true)}>✏️ Edit board</button>
          ) : (
            <>
              <button className="btn btn-primary py-1.5 text-sm" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save board"}</button>
              <button className="btn btn-ghost py-1.5 text-sm" onClick={() => { setItems(initial); setEditing(false); setSel(null); }}>Cancel</button>
              {sel !== null && items[sel] && (
                <div className="flex items-center gap-1 rounded-lg bg-raised px-2 py-1 text-sm">
                  <button className="px-1.5" title="Rotate left" onClick={() => update(sel, { rot: items[sel].rot - 15 })}>⟲</button>
                  <button className="px-1.5" title="Rotate right" onClick={() => update(sel, { rot: items[sel].rot + 15 })}>⟳</button>
                  <button className="px-1.5" title="Smaller" onClick={() => update(sel, { scale: Math.max(0.5, items[sel].scale - 0.15) })}>－</button>
                  <button className="px-1.5" title="Bigger" onClick={() => update(sel, { scale: Math.min(2.5, items[sel].scale + 0.15) })}>＋</button>
                  <button className="px-1.5 text-chili" title="Remove" onClick={() => { setItems((xs) => xs.filter((_, k) => k !== sel)); setSel(null); }}>🗑</button>
                </div>
              )}
              <div className="flex w-full flex-wrap gap-1.5 pt-1">
                <span className="w-full text-xs text-muted">Tap a sticker to add it, drag to place. Get more from events and the Kedai.</span>
                {owned.map((o) => (
                  <button key={o.id} onClick={() => add(o.id)} className="rounded-lg border border-line bg-raised p-1.5 transition hover:scale-110" title={o.name}>
                    <Sticker id={o.id} size={28} animate={false} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
