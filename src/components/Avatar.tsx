/**
 * SIPANDU - Avatar inisial (tanpa foto eksternal/Unsplash).
 * Menghindari menampilkan foto placeholder yang menyesatkan sebagai warga nyata.
 */
import React from "react";

const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-indigo-100 text-indigo-700",
];

function initials(nama?: string): string {
  if (!nama) return "?";
  const parts = nama.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(nama?: string): string {
  let h = 0;
  const s = nama || "?";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  nama,
  className = "w-10 h-10 rounded-xl",
}: {
  nama?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center font-bold text-sm shrink-0 ${colorFor(nama)} ${className}`}
      aria-label={nama || "Warga"}
      title={nama || "Warga"}
    >
      {initials(nama)}
    </div>
  );
}

export default Avatar;
