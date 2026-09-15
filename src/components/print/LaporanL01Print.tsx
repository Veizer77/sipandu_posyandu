/**
 * SIPANDU - Dokumen cetak L-01 (terisolasi, A4).
 * Hanya dirender di portal .print-doc; tidak tampil di layar.
 */
import React from "react";
import { PrintHeader, PrintSignatures, PrintFooter } from "./PrintHeader";

export interface L01RowDS {
  k: string;
  s: number;
  d: number;
  pct: string;
  c: string;
}

export interface L01RowGizi {
  s: string;
  j: number;
  t: string;
  total: number;
}

export interface L01RowLayanan {
  j: string;
  n: number;
  k: string;
}

interface LaporanL01PrintProps {
  bulan: string;
  printedAt: string;
  statusLine: string;
  isDraft: boolean;
  sumberDataLabel: string;
  jumlahSesi: number;
  rentangTanggal: string;
  cakupanDS: L01RowDS[];
  statusGiziBalita: L01RowGizi[];
  pelayanan: L01RowLayanan[];
  bidanNama: string;
  bidanNip: string;
  ketuaNama: string;
}

export function LaporanL01Print({
  bulan,
  printedAt,
  statusLine,
  isDraft,
  sumberDataLabel,
  jumlahSesi,
  rentangTanggal,
  cakupanDS,
  statusGiziBalita,
  pelayanan,
  bidanNama,
  bidanNip,
  ketuaNama,
}: LaporanL01PrintProps) {
  return (
    <div className="print-sheet">
      <PrintHeader
        docCode="Formulir L-01 · Laporan Bulanan Pelayanan Posyandu ILP"
        docTitle="Laporan Bulanan Pelayanan Posyandu ILP (L-01)"
        meta={[
          { label: "Periode", value: bulan },
          { label: "Sumber data", value: sumberDataLabel },
          { label: "Sesi diagregat", value: `${jumlahSesi} sesi (${rentangTanggal})` },
          { label: "Status data", value: statusLine },
          { label: "Dicetak pada", value: printedAt },
        ]}
      />

      {isDraft && (
        <p className="print-note">
          Catatan: sebagian data belum divalidasi Bidan (status Draft/Diperiksa). Angka di bawah adalah
          rekapan data lapangan terkini.
        </p>
      )}

      <div className="print-section">
        <h4>I. Cakupan Kehadiran Sasaran (D/S)</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th>Kategori Sasaran</th>
              <th style={{ textAlign: "center" }}>Sasaran (S)</th>
              <th style={{ textAlign: "center" }}>Hadir (D)</th>
              <th style={{ textAlign: "center" }}>Persentase (D/S)</th>
              <th style={{ textAlign: "center" }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {cakupanDS.map((r) => (
              <tr key={r.k}>
                <td>{r.k}</td>
                <td style={{ textAlign: "center" }}>{r.s}</td>
                <td style={{ textAlign: "center" }}>{r.d}</td>
                <td style={{ textAlign: "center", fontWeight: 800 }}>{r.pct}%</td>
                <td style={{ textAlign: "center" }}>{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-section">
        <h4>II. Status Pertumbuhan Balita Bulan Ini</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th>Status Gizi (BB/U)</th>
              <th style={{ textAlign: "center" }}>Jumlah Balita</th>
              <th style={{ textAlign: "center" }}>Persentase</th>
              <th style={{ textAlign: "center" }}>Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {statusGiziBalita.map((r) => {
              const pct = r.total > 0 ? ((r.j / r.total) * 100).toFixed(1) : "0.0";
              return (
                <tr key={r.s}>
                  <td>{r.s}</td>
                  <td style={{ textAlign: "center" }}>{r.j}</td>
                  <td style={{ textAlign: "center" }}>{pct}%</td>
                  <td style={{ textAlign: "center" }}>{r.t}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="print-section">
        <h4>III. Pelayanan Kesehatan</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th>Jenis Pelayanan</th>
              <th style={{ textAlign: "center" }}>Jumlah</th>
              <th style={{ textAlign: "center" }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {pelayanan.map((r) => (
              <tr key={r.j}>
                <td>{r.j}</td>
                <td style={{ textAlign: "center", fontWeight: 800 }}>{r.n}</td>
                <td style={{ textAlign: "center" }}>{r.k}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PrintSignatures
        leftTitle="Bidan Desa"
        leftName={bidanNama}
        leftNote={`NIP. ${bidanNip}`}
        rightTitle="Ketua Posyandu"
        rightName={ketuaNama}
        rightNote="Posyandu ILP Flamboyan RW 06"
      />
      <PrintFooter text={`Dokumen ${bulan} · Dicetak dari SIPANDU pada ${printedAt} · SIPANDU Posyandu ILP Flamboyan RW 06`} />
    </div>
  );
}
