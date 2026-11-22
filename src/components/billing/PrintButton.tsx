"use client";

export function PrintButton() {
  return <button type="button" className="rounded-lg bg-[#15171c] px-4 py-2 text-sm font-semibold text-white" onClick={() => window.print()}>Print or save as PDF</button>;
}
