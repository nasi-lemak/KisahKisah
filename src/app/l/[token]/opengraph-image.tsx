import { ImageResponse } from "next/og";
import { listByToken, listItems } from "@/lib/queries";
import { posterHex } from "@/lib/poster";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A KisahKisah catalogue";

/** Link-preview card for shared catalogues (WhatsApp, Telegram, X, iMessage…). */
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const l = listByToken((await params).token);
  const visible = l && l.visibility !== "private";
  const items = visible ? listItems(l.id).slice(0, 4) : [];
  const [bg] = posterHex(items[0]?.slug ?? l?.title ?? "kisah");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: `linear-gradient(135deg, ${bg} 0%, #0e1014 70%)`, padding: 56, gap: 48, color: "#ece8e1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexWrap: "wrap", width: 420, height: 420, borderRadius: 24, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.5)", flexShrink: 0, background: "#171a21" }}>
          {(items.length ? items : [{ slug: "kisah", title: "KisahKisah" }]).map((it) => {
            const [a, b] = posterHex(it.slug);
            return (
              <div key={it.slug} style={{ width: items.length >= 2 ? 210 : 420, height: items.length >= 3 ? 210 : 420, display: "flex", alignItems: "flex-end", padding: 14, background: `linear-gradient(160deg, ${a}, ${b})`, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,.92)" }}>
                {it.title}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#f5a524", fontWeight: 700 }}>CATALOGUE</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.05, marginTop: 12 }}>{visible ? l!.title : "KisahKisah"}</div>
          {visible && <div style={{ display: "flex", fontSize: 30, marginTop: 20, color: "#c9ccd3" }}>{`by ${l!.display_name} · ${l!.item_count} titles`}</div>}
          <div style={{ display: "flex", marginTop: "auto", fontSize: 30, fontWeight: 800 }}>
            Kisah<span style={{ color: "#f5a524" }}>Kisah</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
