/**
 * SIPANDU - Dokumen cetak L-08 Daftar Hadir (terisolasi, A4).
 */
import React from "react";
import { PrintHeader, PrintFooter } from "./PrintHeader";

export interface L08Row {
  id: string;
  nama: string;
  kategori: string;
  waktu: string;
  statusVerifikasi: string;
}

interface LaporanL08PrintProps {
  bulan: string;
  printedAt: string;
  daftarHadir: L08Row[];
}

function labelVerifikasi(s: string): string {
  if (s === "valid") return "Valid";
  if (s === "diperiksa") return "Diperiksa";
  return "Draft";
}

export function LaporanL08Print({ bulan, printedAt, daftarHadir }: LaporanL08PrintProps) {
  return (
    <div className="print-sheet">
      <PrintHeader
        docCode="Formulir L-08 · Daftar Hadir Peserta Posyandu"
        docTitle="Daftar Hadir Peserta Posyandu (L-08)"
        meta={[
          { label: "Periode", value: bulan },
          { label: "Jumlah peserta", value: `${daftarHadir.length} orang` },
          { label: "Dicetak pada", value: printedAt },
        ]}
      />

      <div className="print-section">
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center", width: 36 }}>No</th>
              <th>Nama Peserta</th>
              <th>Kategori</th>
              <th style={{ textAlign: "center" }}>Waktu Hadir</th>
              <th style={{ textAlign: "center" }}>Status Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {daftarHadir.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Belum ada peserta tercatat hadir pada periode ini.
                </td>
              </tr>
            ) : (
              daftarHadir.map((p, i) => (
                <tr key={p.id || i}>
                  <td style={{ textAlign: "center" }}>{i + 1}</td>
                  <td>{p.nama}</td>
                  <td>{p.kategori}</td>
                  <td style={{ textAlign: "center" }}>{p.waktu}</td>
                  <td style={{ textAlign: "center" }}>{labelVerifikasi(p.statusVerifikasi)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PrintFooter text={`Daftar hadir ${bulan} · Dicetak dari SIPANDU pada ${printedAt} · SIPANDU Posyandu ILP Flamboyan RW 06`} />
    </div>
  );
}
