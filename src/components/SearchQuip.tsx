/** Little replies to particular searches. More hidden fun. */
const QUIPS: [RegExp, string][] = [
  [/upin|ipin/i, "👦👦 Betul, betul, betul!"],
  [/durian/i, "🌳 No durians in the catalogue. Try clicking the logo instead…"],
  [/pontianak|hantu|ghost|langsuir/i, "🌙 Some ghosts only come out after midnight. Try logging a film then."],
  [/kopi|coffee|teh/i, "☕ The kopitiam is open. Look for the little cup at the bottom of the page."],
  [/konami|cheat/i, "🎮 ↑↑↓↓←→←→… you know the rest."],
  [/makan|food|lapar|hungry/i, "🍛 Sudah makan? Type it anywhere on the site."],
  [/jodoh|love/i, "💌 Your jodoh is out there. Maybe at a cinema."],
];

export function SearchQuip({ q }: { q: string }) {
  const hit = QUIPS.find(([re]) => re.test(q));
  if (!hit) return null;
  return <div className="card border-saffron/40 bg-saffron/5 px-4 py-2 text-sm">{hit[1]}</div>;
}
