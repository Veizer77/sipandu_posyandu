import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format tanggal Indonesia: 15 Agustus 2026 */
export function formatTanggalIndo(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** Format tanggal singkat: 15/08/2026 */
export function formatTanggalSingkat(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Nama hari Indonesia dari string tanggal */
export function namaHariIndo(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
}

/** Format rupiah ringkas */
export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

/** Initials dari nama lengkap untuk avatar fallback */
export function initials(nama: string): string {
  return nama
    .replace(/[^A-Za-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Masking NIK sesuai PRD 39.2: tampil 6 digit pertama + *** + 2 digit terakhir */
export function maskNik(nik?: string | null): string {
  if (!nik) return "—";
  const digits = String(nik).replace(/\D/g, "");
  if (digits.length !== 16) return "NIK tidak valid";
  return `${digits.slice(0, 6)}******${digits.slice(-2)}`;
}
