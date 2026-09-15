/**
 * SIPANDU - Utilitas cetak terisolasi.
 * Setiap tombol cetak menandai SATU dokumen target via atribut body,
 * sehingga window.print() hanya mengeluarkan dokumen tersebut (bukan DOM aktif).
 */

export type PrintTarget = "laporan-l01" | "laporan-l08" | "rekap-berita";

/** ID elemen portal dokumen cetak untuk setiap target (murni, teruji). */
export function printTargetElementId(target: PrintTarget): string {
  return `print-doc-${target}`;
}

/**
 * Cetak satu dokumen terisolasi. Mengembalikan false bila bukan browser.
 * Atribut dibersihkan via afterprint + fallback timeout.
 */
export function printDocument(target: PrintTarget): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const el = document.getElementById(printTargetElementId(target));
  if (!el) return false;
  document.body.setAttribute("data-print-target", target);
  const cleanup = () => {
    if (document.body.getAttribute("data-print-target") === target) {
      document.body.removeAttribute("data-print-target");
    }
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 8000);
  window.print();
  return true;
}
