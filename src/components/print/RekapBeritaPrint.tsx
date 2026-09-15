/**
 * SIPANDU - Dokumen cetak Berita Acara Rekapitulasi Sesi (terisolasi, A4).
 * Satu-satunya output cetak Rekap; menggantikan blok .print-only inline.
 */
import React from "react";
import { PrintHeader, PrintSignatures, PrintFooter } from "./PrintHeader";
import type {
  AntropometriSummary,
  Meja3Summary,
  PelayananSummary,
} from "@/lib/rekapLogic";

export interface RekapSasaranRow {
  key: string;
  label: string;
  target: number;
  present: number;
  rate: number;
}

export interface RekapPenyuluhanRow {
  id: string;
  tema: string;
  jumlah: number;
  narasumber: string;
  metode: string;
  ringkasan: string;
}

export interface RekapHadirRow {
  id: string;
  nama: string;
  kategori: string;
  waktu: string;
  status: string;
}

export interface RekapFollowUpRow {
  id: string;
  nama: string;
  kategori: string;
  rt: string;
  kepalaKeluarga: string;
  tag: string;
  isPriority: boolean;
  rencanaStatus: string | null;
}

interface RekapBeritaPrintProps {
  tanggalLabel: string;
  tempat: string;
  temaSesi: string;
  statusSesi: string;
  sesiId: string;
  statusLaporan: string;
  hadirCount: number;
  sasaranHadirCount: number;
  umumHadirCount: number;
  totalSasaran: number;
  persenDS: number;
  tidakHadirCount: number;
  sasaranBreakdown: RekapSasaranRow[];
  antropometri: AntropometriSummary;
  meja3: Meja3Summary;
  pelayanan: PelayananSummary;
  penyuluhanSesi: RekapPenyuluhanRow[];
  followUp: RekapFollowUpRow[];
  daftarHadir: RekapHadirRow[];
  bidanNama: string;
  bidanNip: string;
  ketuaNama: string;
  printedAt: string;
}

function rencanaLabel(s: string | null): string {
  if (s === "terjadwal") return "Terjadwal KR";
  if (s === "selesai") return "KR Selesai";
  if (s === "dibatalkan") return "KR Batal";
  return "Belum dijadwalkan";
}

export function RekapBeritaPrint(props: RekapBeritaPrintProps) {
  const {
    tanggalLabel,
    tempat,
    temaSesi,
    statusSesi,
    sesiId,
    statusLaporan,
    hadirCount,
    sasaranHadirCount,
    umumHadirCount,
    totalSasaran,
    persenDS,
    tidakHadirCount,
    sasaranBreakdown,
    antropometri,
    meja3,
    pelayanan,
    penyuluhanSesi,
    followUp,
    daftarHadir,
    bidanNama,
    bidanNip,
    ketuaNama,
    printedAt,
  } = props;
  const prioritas = followUp.filter((f) => f.isPriority).length;

  return (
    <div className="print-sheet">
      <PrintHeader
        docCode="Berita Acara Rekapitulasi Pelaksanaan Posyandu ILP Hari H"
        docTitle="Berita Acara Rekapitulasi Pelaksanaan Posyandu ILP Hari H"
        meta={[
          { label: "Hari / Tanggal", value: tanggalLabel },
          { label: "Tempat", value: tempat },
          { label: "Tema sesi", value: temaSesi },
          { label: "Status sesi", value: statusSesi },
          { label: "ID Sesi", value: sesiId ? `${sesiId.slice(0, 8)}…` : "—" },
          { label: "Status laporan", value: statusLaporan },
          { label: "Jumlah sesi", value: "1 sesi" },
          { label: "Rentang tanggal", value: tanggalLabel },
          { label: "Dicetak pada", value: printedAt },
        ]}
      />

      <div className="print-section">
        <h4>I. Cakupan Kehadiran Sasaran (D/S)</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th>Kelompok Sasaran ILP</th>
              <th style={{ textAlign: "center" }}>Target (S)</th>
              <th style={{ textAlign: "center" }}>Hadir (D)</th>
              <th style={{ textAlign: "center" }}>Capaian D/S</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sasaranBreakdown.map((s) => (
              <tr key={s.key}>
                <td>{s.label}</td>
                <td style={{ textAlign: "center" }}>{s.target}</td>
                <td style={{ textAlign: "center", fontWeight: 800 }}>{s.present}</td>
                <td style={{ textAlign: "center", fontWeight: 800 }}>{s.rate}%</td>
                <td style={{ textAlign: "center" }}>{s.rate >= 85 ? "Memenuhi Target" : "Perlu Pendekatan"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total Sasaran Posyandu</td>
              <td style={{ textAlign: "center" }}>{totalSasaran}</td>
              <td style={{ textAlign: "center" }}>{sasaranHadirCount}</td>
              <td style={{ textAlign: "center" }}>{persenDS}%</td>
              <td style={{ textAlign: "center" }}>
                {persenDS >= 85 ? "Target Tercapai (≥85%)" : `${tidakHadirCount} Belum Hadir`}
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="print-note" style={{ marginTop: 6 }}>
          Hadir total {hadirCount} jiwa (sasaran {sasaranHadirCount}
          {umumHadirCount > 0 ? ` + ${umumHadirCount} masyarakat umum di luar D/S` : ""}).
        </p>
      </div>

      <div className="print-section">
        <h4>II. Rekapitulasi Pelayanan 5 Meja</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center", width: 56 }}>Meja</th>
              <th>Tahapan Layanan</th>
              <th style={{ textAlign: "center" }}>Capaian / Jumlah</th>
              <th>Rincian Hasil Layanan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: "center", fontWeight: 800 }}>1</td>
              <td>Registrasi &amp; Presensi</td>
              <td style={{ textAlign: "center", fontWeight: 800 }}>{hadirCount} Peserta</td>
              <td>
                {sasaranHadirCount} sasaran siklus hidup
                {umumHadirCount > 0 ? `, ${umumHadirCount} umum` : ""}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", fontWeight: 800 }}>2</td>
              <td>Pengukuran &amp; Antropometri Balita</td>
              <td style={{ textAlign: "center", fontWeight: 800 }}>{antropometri.diukur} Balita Diukur</td>
              <td>
                Gizi Baik: {antropometri.normal} · Gizi Kurang: {antropometri.giziKurang} · Gizi
                Buruk/2T: {antropometri.giziBuruk} · Stunting: {antropometri.stunting} · Gizi Lebih:{" "}
                {antropometri.berisikoLebih} · Belum Dihitung: {antropometri.belumDihitung}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", fontWeight: 800 }}>3</td>
              <td>Pencatatan Digital KMS</td>
              <td style={{ textAlign: "center", fontWeight: 800 }}>{meja3.adaCatatan} Tercatat</td>
              <td>
                Keluhan: {meja3.keluhan} · Temuan kader: {meja3.temuan} · Catatan kader: {meja3.catatanKader} ·
                Catatan Bidan: {meja3.catatanBidan}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", fontWeight: 800 }}>4</td>
              <td>Pelayanan Kesehatan &amp; Logistik</td>
              <td style={{ textAlign: "center", fontWeight: 800 }}>{pelayanan.rujukanList.length} Rujukan</td>
              <td>
                Vit A: {pelayanan.vitA} Kapsul · PMT: {pelayanan.pmt} Penerima · Imunisasi:{" "}
                {pelayanan.dosisCount} Dosis ({pelayanan.anakCount} Anak) · Tablet Fe: {pelayanan.fe} Penerima
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "center", fontWeight: 800 }}>5</td>
              <td>Edukasi &amp; Penyuluhan Kelompok</td>
              <td style={{ textAlign: "center", fontWeight: 800 }}>{penyuluhanSesi.length} Sesi Edukasi</td>
              <td>
                {penyuluhanSesi.length > 0
                  ? penyuluhanSesi.map((p) => `${p.tema} (${p.jumlah} peserta)`).join("; ")
                  : "Belum didokumentasikan"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-section">
        <h4>III. Rekapitulasi Rujukan ke Puskesmas</h4>
        {pelayanan.rujukanList.length === 0 ? (
          <p className="print-note">
            Tidak ada rujukan ke Fasilitas Kesehatan Tingkat Pertama (Puskesmas Junrejo) pada sesi ini.
          </p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ textAlign: "center", width: 32 }}>No</th>
                <th>Nama Peserta</th>
                <th>Kategori</th>
                <th>Alasan / Indikasi Klinis</th>
                <th style={{ textAlign: "center" }}>Fasilitas Rujukan</th>
              </tr>
            </thead>
            <tbody>
              {pelayanan.rujukanList.map((r, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "center" }}>{i + 1}</td>
                  <td>{r.nama}</td>
                  <td>{r.kategori}</td>
                  <td>{r.alasan || "Tidak dicatat"}</td>
                  <td style={{ textAlign: "center" }}>{r.tujuan || "Tidak dicatat"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="print-section">
        <h4>IV. Tindak Lanjut Sasaran Belum Hadir (Kunjungan Rumah)</h4>
        {followUp.length === 0 ? (
          <p className="print-note">
            Seluruh sasaran posyandu telah hadir lengkap (100% D/S). Tidak ada sasaran yang mangkir.
          </p>
        ) : (
          <>
            <p className="print-note" style={{ marginBottom: 6 }}>
              Terdapat <strong>{followUp.length} sasaran</strong> belum hadir (termasuk {prioritas} sasaran
              prioritas balita/bumil) untuk kunjungan rumah (sweeping) oleh kader.
            </p>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: 32 }}>No</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: "center" }}>RT</th>
                  <th>Status Rencana KR</th>
                </tr>
              </thead>
              <tbody>
                {followUp.map((f, i) => (
                  <tr key={f.id || i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td>
                      {f.nama}
                      {f.isPriority ? ` (${f.tag})` : ""}
                    </td>
                    <td>{f.kategori}</td>
                    <td style={{ textAlign: "center" }}>{f.rt}</td>
                    <td>{rencanaLabel(f.rencanaStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="print-section">
        <h4>V. Daftar Hadir Peserta Sesi Hari H</h4>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center", width: 32 }}>No</th>
              <th>Nama Peserta</th>
              <th>Kategori</th>
              <th style={{ textAlign: "center" }}>Waktu Hadir</th>
              <th style={{ textAlign: "center" }}>Status Alur Layanan</th>
            </tr>
          </thead>
          <tbody>
            {daftarHadir.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Belum ada peserta yang hadir pada sesi ini.
                </td>
              </tr>
            ) : (
              daftarHadir.map((k, i) => (
                <tr key={k.id || i}>
                  <td style={{ textAlign: "center" }}>{i + 1}</td>
                  <td>{k.nama}</td>
                  <td>{k.kategori}</td>
                  <td style={{ textAlign: "center" }}>{k.waktu}</td>
                  <td style={{ textAlign: "center" }}>{k.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PrintSignatures
        leftTitle="Bidan Desa Mojorejo"
        leftName={bidanNama}
        leftNote={`NIP. ${bidanNip}`}
        rightTitle="Ketua Posyandu ILP Flamboyan RW 06"
        rightName={ketuaNama}
        rightNote="Desa Mojorejo, Kec. Junrejo"
      />
      <PrintFooter text={`Berita acara sesi ${tanggalLabel} · Dicetak dari SIPANDU pada ${printedAt} · SIPANDU Posyandu ILP Flamboyan RW 06`} />
    </div>
  );
}
