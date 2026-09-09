import React, { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useSipandu } from "@/lib/data-store";

export default function Laporan() {
  const { data } = useSipandu();
  const [bulan, setBulan] = useState("Agustus 2026");

  const anggotaList = data.anggota;
  // PRD F-08 / 35.1: hanya kunjungan berstatus Valid yang masuk laporan resmi
  const visits = useMemo(
    () => data.kunjunganAktif.filter((v: any) => v.status_verifikasi === "valid"),
    [data.kunjunganAktif]
  );
  const pendingCount = data.kunjunganAktif.filter((v: any) => v.status_verifikasi !== "valid").length;
  const anggotaMap = useMemo(() => new Map(anggotaList.map((a: any) => [a.id, a])), [anggotaList]);

  // I. Cakupan Kehadiran Sasaran (D/S)
  const cakupanDS = useMemo(() => {
    const cats = [
      { key: "bayi", label: "Bayi (0–11 Bulan)", note: "Memenuhi Target" },
      { key: "balita", label: "Balita (12–59 Bulan)", note: "Memenuhi Target" },
      { key: "ibu_hamil", label: "Ibu Hamil", note: "ANC Terpadu" },
      { key: "lansia", label: "Lansia (≥60 Tahun)", note: "Skrining PTM" },
      { key: "wus", label: "WUS (15–49 Tahun)", note: "Skrining Anemia" },
    ];

    return cats.map((c) => {
      const matchFn = (k: string) => k === c.key;
      const s = anggotaList.filter((a: any) => a.status_aktif && matchFn(a.kategori)).length;
      const d = visits.filter((v: any) => {
        const a = anggotaMap.get(v.anggota_id);
        return a && matchFn(a.kategori);
      }).length;
      const pct = s > 0 ? ((d / s) * 100).toFixed(1) : "0.0";
      return { k: c.label, s, d, pct, c: c.note };
    });
  }, [anggotaList, visits, anggotaMap]);

  // II. Status Pertumbuhan Balita Bulan Ini
  const statusGiziBalita = useMemo(() => {
    const balitaVisits = visits.filter((v: any) => {
      const a = anggotaMap.get(v.anggota_id);
      return a && (a.kategori === "bayi" || a.kategori === "balita");
    });
    const totalBalita = balitaVisits.length;

    let baik = 0;
    let kurang = 0;
    let buruk = 0;
    let lebih = 0;

    balitaVisits.forEach((v: any) => {
      const gizi = v.pengukuran?.status_gizi || "";
      const zbbu = v.pengukuran?.z_score_bbu;
      if (gizi.includes("Buruk") || (typeof zbbu === "number" && zbbu < -3)) {
        buruk++;
      } else if (gizi.includes("Kurang") || (typeof zbbu === "number" && zbbu < -2)) {
        kurang++;
      } else if (gizi.includes("Lebih") || gizi.includes("Obesitas") || (typeof zbbu === "number" && zbbu > 1)) {
        lebih++;
      } else {
        baik++;
      }
    });

    return [
      { s: "Gizi Baik (Normal)", j: baik, t: "Pertahankan, edukasi orang tua", total: totalBalita },
      { s: "Gizi Kurang", j: kurang, t: "PMT Pemulihan tinggi protein", total: totalBalita },
      { s: "Gizi Buruk", j: buruk, t: "Rujukan Puskesmas & Kunjungan Rumah", total: totalBalita },
      { s: "Risiko Gizi Lebih", j: lebih, t: "Konseling gizi seimbang", total: totalBalita },
    ];
  }, [visits, anggotaMap]);

  // III. Pelayanan Kesehatan
  const pelayanan = useMemo(() => {
    let vitA = 0;
    let pmt = 0;
    let imun = 0;
    let fe = 0;
    let rujukan = 0;

    visits.forEach((v: any) => {
      const p = v.pelayanan || {};
      if (p.vitamin_a) vitA++;
      if (p.pmt) pmt++;
      if (p.imunisasi && p.imunisasi.length > 0) imun++;
      if (p.tablet_fe) fe++;
      if (p.rujukan) rujukan++;
    });

    return [
      { j: "Kapsul Vitamin A", n: vitA, k: "Bulan Agustus: Vitamin A Balita" },
      { j: "PMT (Pemberian Makanan Tambahan)", n: pmt, k: "Kudapan bergizi lokal & biskuit" },
      { j: "Imunisasi Dasar Hari Ini", n: imun, k: "Diberikan sesuai jadwal imunisasi" },
      { j: "Tablet Fe (Tambah Darah)", n: fe, k: "Ibu Hamil & WUS" },
      { j: "Rujukan ke Puskesmas Junrejo", n: rujukan, k: "Balita 2T / Bumil KEK / Resiko Tinggi" },
    ];
  }, [visits]);

  const bidan = data.organisasi?.find((o: any) => o.jabatan === "bidan_desa") || {
    nama: "Bdn. Siti Aminah, S.Tr.Keb",
    nip_sip: "19850412 201001 2 021",
  };
  const ketua = data.organisasi?.find((o: any) => o.jabatan === "ketua_posyandu") || {
    nama: "Ibu Sri Wahyuni",
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Action Bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan Posyandu (L-01)</h1>
          <p className="text-sm text-gray-500">Laporan resmi teragregasi otomatis siap cetak / simpan PDF</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Periode:</label>
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold outline-none"
          >
            <option>Agustus 2026</option>
            <option>Juli 2026</option>
            <option>Juni 2026</option>
          </select>
        </div>
        <span className={`text-xs px-3 py-1 font-bold rounded-full ${pendingCount > 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
          Status Data: {visits.length} Valid{pendingCount > 0 ? ` · ${pendingCount} belum tervalidasi (tidak masuk laporan)` : " · Semua tervalidasi"}
        </span>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 font-semibold no-print">
          Tidak semua kunjungan berstatus Valid. Angka laporan di bawah hanya menghitung kunjungan tervalidasi Bidan.
        </div>
      )}
      {visits.length === 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 text-sm text-rose-900 font-semibold no-print">
          Tidak ada data valid untuk bulan ini. Minta Bidan untuk memverifikasi terlebih dahulu (alur: Draft → Diperiksa → Valid).
        </div>
      )}

      {/* Printable Document */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm printable-card max-w-4xl mx-auto text-gray-900">
        {/* Kop Surat Resmi */}
        <div className="kop-surat text-center pb-4 mb-6 border-b-2 border-gray-900">
          <div className="flex items-center justify-center gap-4 mb-1">
            <div className="w-16 h-16 rounded-full border-2 border-green-700 flex items-center justify-center text-green-700 text-2xl font-bold">
              ♥
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900 leading-tight">
                Pemerintah Kota Batu · Kecamatan Junrejo
              </h3>
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-gray-900 leading-tight">
                Pemerintah Desa Mojorejo
              </h2>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-green-700 leading-tight">
                Posyandu ILP Flamboyan RW 06
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Sekretariat: Balai RW 06 Desa Mojorejo, Kec. Junrejo, Kota Batu, Jawa Timur 65322
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold underline uppercase">Laporan Bulanan Pelayanan Posyandu ILP (L-01)</h2>
          <p className="text-xs text-gray-600 mt-1">
            Bulan: <strong>{bulan}</strong> · Tanggal Pelaksanaan: <strong>15 {bulan}</strong>
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase text-gray-800 mb-2">I. Cakupan Kehadiran Sasaran (D/S)</h4>
          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2 border-r border-gray-300">Kategori Sasaran</th>
                <th className="p-2 border-r border-gray-300 text-center">Sasaran (S)</th>
                <th className="p-2 border-r border-gray-300 text-center">Hadir (D)</th>
                <th className="p-2 border-r border-gray-300 text-center">Persentase (D/S)</th>
                <th className="p-2 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cakupanDS.map((r) => (
                <tr key={r.k}>
                  <td className="p-2 border-r border-gray-200 font-medium">{r.k}</td>
                  <td className="p-2 border-r border-gray-200 text-center">{r.s}</td>
                  <td className="p-2 border-r border-gray-200 text-center">{r.d}</td>
                  <td className="p-2 border-r border-gray-200 text-center font-bold">{r.pct}%</td>
                  <td className="p-2 text-center">{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase text-gray-800 mb-2">II. Status Pertumbuhan Balita Bulan Ini</h4>
          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2 border-r border-gray-300">Status Gizi (BB/U)</th>
                <th className="p-2 border-r border-gray-300 text-center">Jumlah Balita</th>
                <th className="p-2 border-r border-gray-300 text-center">Persentase</th>
                <th className="p-2 text-center">Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody>
              {statusGiziBalita.map((r) => {
                const pct = r.total > 0 ? ((r.j / r.total) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={r.s}>
                    <td className="p-2 border-r border-gray-200 font-medium">{r.s}</td>
                    <td className="p-2 border-r border-gray-200 text-center">{r.j}</td>
                    <td className="p-2 border-r border-gray-200 text-center">{pct}%</td>
                    <td className="p-2 text-center">{r.t}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase text-gray-800 mb-2">III. Pelayanan Kesehatan</h4>
          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2 border-r border-gray-300">Jenis Pelayanan</th>
                <th className="p-2 border-r border-gray-300 text-center">Jumlah</th>
                <th className="p-2 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {pelayanan.map((r) => (
                <tr key={r.j}>
                  <td className="p-2 border-r border-gray-200 font-medium">{r.j}</td>
                  <td className="p-2 border-r border-gray-200 text-center font-bold">{r.n}</td>
                  <td className="p-2 text-center">{r.k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs">
          <div>
            <p className="mb-16">Bidan Desa</p>
            <p className="font-bold border-t border-gray-900 pt-1">{bidan.nama}</p>
            <p className="text-gray-600">NIP. {bidan.nip_sip || "—"}</p>
          </div>
          <div>
            <p className="mb-16">Ketua Posyandu</p>
            <p className="font-bold border-t border-gray-900 pt-1">{ketua.nama}</p>
            <p className="text-gray-600">Posyandu ILP Flamboyan RW 06</p>
          </div>
        </div>
      </div>

      {/* H1: Katalog laporan L-01..L-08 (PRD F-09) — print per modul */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm no-print space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">Katalog Laporan (PRD F-09)</h3>
        <p className="text-xs text-gray-500">Gunakan tombol cetak di atas; pilih bagian yang ingin dicetak. L-01 dirender penuh di atas.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { kode: "L-01", nama: "Laporan Bulanan Posyandu", isi: "Semua komponen (render penuh di atas)" },
            { kode: "L-02", nama: "Laporan Sasaran", isi: "Tabel I — D/S per kategori" },
            { kode: "L-03", nama: "Laporan Pertumbuhan Balita", isi: "Tabel II — Naik/T/2T, stunting" },
            { kode: "L-04", nama: "Laporan Pelayanan", isi: "Tabel III — Vitamin A, PMT, Imunisasi, Fe" },
            { kode: "L-05", nama: "Laporan Ibu Hamil", isi: "Risiko bumil (lihat Dashboard Bidan)" },
            { kode: "L-06", nama: "Laporan Lansia", isi: "Risiko lansia (lihat Dashboard Bidan)" },
            { kode: "L-07", nama: "Rekapitulasi Kumulatif", isi: "Kuartal/tahun — butuh histori ≥3 bulan" },
            { kode: "L-08", nama: "Daftar Hadir", isi: "Sesi aktif — lihat Rekapitulasi Sesi" },
          ].map((l) => (
            <div key={l.kode} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{l.kode} — {l.nama}</p>
                <p className="text-[11px] text-gray-500">{l.isi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
