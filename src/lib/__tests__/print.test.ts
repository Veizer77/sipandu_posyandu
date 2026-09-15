/**
 * Utilitas cetak terisolasi (src/lib/print.ts).
 * Hanya pemetaan murni yang diuji (tanpa DOM).
 */
import { describe, it, expect } from "vitest";
import { printTargetElementId, printDocument } from "@/lib/print";

describe("printTargetElementId", () => {
  it("tiga target dokumen punya ID portal berbeda", () => {
    expect(printTargetElementId("laporan-l01")).toBe("print-doc-laporan-l01");
    expect(printTargetElementId("laporan-l08")).toBe("print-doc-laporan-l08");
    expect(printTargetElementId("rekap-berita")).toBe("print-doc-rekap-berita");
  });
});

describe("printDocument di luar browser", () => {
  it("mengembalikan false tanpa melempar", () => {
    expect(printDocument("laporan-l01")).toBe(false);
  });
});
