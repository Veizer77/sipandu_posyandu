import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { useSipandu } from "@/lib/data-store";
import { SIPANDU_SEED } from "@/lib/seedData";
import { normalizeImunisasiList } from "@/lib/meja2Logic";
import {
  resolveSumberLaporan,
  labelSumberLaporan,
  ringkasSesiPeriode,
  type SumberLaporan,
} from "@/lib/rekapLogic";
import { LaporanL01Print } from "@/components/print/LaporanL01Print";
import { LaporanL08Print } from "@/components/print/LaporanL08Print";
import { printDocument, printTargetElementId } from "@/lib/print";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function parsePeriode(periode: string): { tahun: number; bulanIdx: number } {
  const [nama, tahunStr] = periode.split(" ");
  return { tahun: Number(tahunStr) || new Date().getFullYear(), bulanIdx: NAMA_BULAN.indexOf(nama) };
}

/** Periksa apakah kunjungan termasuk dalam periode tertentu via tanggal sesi atau waktu hadir */
function visitMatchesPeriode(
  v: any,
  tahun: number,
  bulanIdx: number,
  jadwalMap: Map<string, any>
): boolean {
  // 1. Cek dari tanggal jadwal sesi terkait (paling akurat untuk pengelompokan sesi)
  const j = jadwalMap.get(v.jadwal_posyandu_id || v.jadwal_id);
  if (j?.tanggal) {
    const dj = new Date(`${j.tanggal}T00:00:00`);
    if (!isNaN(dj.getTime()) && dj.getFullYear() === tahun && dj.getMonth() === bulanIdx) {
      return true;
    }
  }
  // 2. Cek dari waktu hadir
  if (v.waktu_hadir) {
    const dw = new Date(v.waktu_hadir);
    if (!isNaN(dw.getTime()) && dw.getFullYear() === tahun && dw.getMonth() === bulanIdx) {
      return true;
    }
  }
  // 3. Cek dari created_at
  if (v.created_at) {
    const dc = new Date(v.created_at);
    if (!isNaN(dc.getTime()) && dc.getFullYear() === tahun && dc.getMonth() === bulanIdx) {
      return true;
    }
  }
  return false;
}

/** Bangun daftar opsi periode dari jadwal & data yang tersedia */
function buildAvailablePeriodes(jadwal: any[], visits: any[]): string[] {
  const set = new Set<string>();

  (jadwal || []).forEach((j: any) => {
    if (j?.tanggal) {
      const d = new Date(`${j.tanggal}T00:00:00`);
      if (!isNaN(d.getTime())) {
        set.add(`${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`);
      }
    }
  });

  (visits || []).forEach((v: any) => {
    if (v?.waktu_hadir) {
      const d = new Date(v.waktu_hadir);
      if (!isNaN(d.getTime())) {
        set.add(`${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`);
      }
    }
  });

  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    set.add(`${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`);
  }

  return Array.from(set).sort((a, b) => {
    const pa = parsePeriode(a);
    const pb = parsePeriode(b);
    if (pa.tahun !== pb.tahun) return pb.tahun - pa.tahun;
    return pb.bulanIdx - pa.bulanIdx;
  });
}

export default function Laporan() {
  const { data, activeSessionId } = useSipandu();

  // Merge seluruh kunjungan aktif + histori (dedup)
  const allVisits = useMemo(() => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const v of [...(data.kunjunganAktif || []), ...(data.kunjungan || [])]) {
      if (!v?.id || seen.has(v.id)) continue;
      seen.add(v.id);
      out.push(v);
    }
    return out;
  }, [data.kunjunganAktif, data.kunjungan]);

  const jadwalMap = useMemo(() => {
    const m = new Map<string, any>();
    (data.jadwal || []).forEach((j: any) => m.set(j.id, j));
    return m;
  }, [data.jadwal]);

  const periodeOptions = useMemo(
    () => buildAvailablePeriodes(data.jadwal, allVisits),
    [data.jadwal, allVisits]
  );

  // Default periode: prioritaskan bulan dari sesi aktif / arsip atau bulan yang ada datanya
  const [bulan, setBulan] = useState(() => {
    const targetJadwalId = activeSessionId || data.sesiArsipId;
    if (targetJadwalId) {
      const j = (data.jadwal || []).find((x: any) => x.id === targetJadwalId);
      if (j?.tanggal) {
        const d = new Date(`${j.tanggal}T00:00:00`);
        if (!isNaN(d.getTime())) return `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
      }
    }
    // Cari bulan pertama yang ada datanya
    const opts = buildAvailablePeriodes(data.jadwal, allVisits);
    const jMap = new Map((data.jadwal || []).map((x: any) => [x.id, x]));
    for (const p of opts) {
      const { tahun: th, bulanIdx: bi } = parsePeriode(p);
      const match = allVisits.some((v: any) => visitMatchesPeriode(v, th, bi, jMap));
      if (match) return p;
    }
    const now = new Date();
    return `${NAMA_BULAN[now.getMonth()]} ${now.getFullYear()}`;
  });

  const { tahun, bulanIdx } = parsePeriode(bulan);
  const anggotaList = data.anggota;
  const anggotaMap = useMemo(() => new Map(anggotaList.map((a: any) => [a.id, a])), [anggotaList]);

  // Info sesi dalam periode untuk header PDF (jejak audit: sesi mana saja yang diagregat).
  const sesiPeriode = useMemo(
    () => ringkasSesiPeriode(data.jadwal, tahun, bulanIdx),
    [data.jadwal, tahun, bulanIdx]
  );

  // Semua peserta yang hadir pada periode ini (Presensi riil)
  const allPeriode = useMemo(
    () => allVisits.filter((v: any) => visitMatchesPeriode(v, tahun, bulanIdx, jadwalMap)),
    [allVisits, tahun, bulanIdx, jadwalMap]
  );

  // Kunjungan yang valid (telah divalidasi Bidan)
  const validVisits = useMemo(
    () => allPeriode.filter((v: any) => v.status_verifikasi === "valid"),
    [allPeriode]
  );
  const pendingCount = allPeriode.length - validVisits.length;

  // Mode sumber data eksplisit: "terverifikasi" (resmi) atau "lapangan" (draft).
  // Default = terverifikasi bila ada data valid, else lapangan. SEMUA metrik
  // L-01 (D/S, gizi, pelayanan) memakai SATU sumber yang sama — tanpa campur.
  const [modeOverride, setModeOverride] = useState<SumberLaporan | null>(null);
  const modeEfektif: SumberLaporan = resolveSumberLaporan(validVisits.length, allPeriode.length, modeOverride);
  const visits = modeEfektif === "terverifikasi" ? validVisits : allPeriode;
  const isDraftReport = modeEfektif === "lapangan" && allPeriode.length > 0;
  const modeLabel = labelSumberLaporan(modeEfektif, validVisits.length, allPeriode.length);

  // L-08: Daftar Hadir riil — SELURUH peserta yang hadir pada sesi/periode ini
  const daftarHadir = useMemo(
    () =>
      allPeriode
        .map((v: any) => {
          const a = anggotaMap.get(v.anggota_id);
          return {
            id: v.id,
            nama: a?.nama || "—",
            kategori: a?.kategori || "—",
            waktu: v.waktu_hadir ? new Date(v.waktu_hadir).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—",
            statusVerifikasi: v.status_verifikasi || "draft",
          };
        })
        .sort((x: any, y: any) => x.nama.localeCompare(y.nama)),
    [allPeriode, anggotaMap]
  );

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
      const gizi = String(v.pengukuran?.status_gizi || "").toLowerCase();
      const zbbu = v.pengukuran?.z_score_bbu;
      if (gizi.includes("buruk") || (typeof zbbu === "number" && zbbu < -3)) {
        buruk++;
      } else if (gizi.includes("kurang") || (typeof zbbu === "number" && zbbu < -2)) {
        kurang++;
      } else if (gizi.includes("lebih") || gizi.includes("obesitas") || (typeof zbbu === "number" && zbbu > 2)) {
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
      if (normalizeImunisasiList(p).length > 0) imun++;
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

  const bidan = data.organisasi?.find((o: any) => o.jabatan === "bidan") || {
    nama: SIPANDU_SEED.persona.bidan,
    nip_sip: "19850412 201001 2 021",
  };
  const ketua = data.organisasi?.find((o: any) => o.jabatan === "ketua_pkk") || {
    nama: SIPANDU_SEED.persona.ketua_pkk,
  };

  const printedAt = useMemo(
    () =>
      new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );
  const statusLine = `${validVisits.length} Terverifikasi · ${allPeriode.length} Hadir di Sesi · Sumber: ${modeEfektif === "terverifikasi" ? "Terverifikasi" : "Lapangan"}`;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Action Bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <img
            src="/logo/logo_only.png"
            alt="Logo SIPANDU"
            className="h-10 w-10 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan Posyandu (L-01)</h1>
            <p className="text-sm text-gray-500">Laporan resmi teragregasi otomatis siap cetak / simpan PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => printDocument("laporan-l01")}
            title="Cetak hanya Laporan Bulanan L-01 (A4)"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak L-01
          </button>
          <button
            onClick={() => printDocument("laporan-l08")}
            title="Cetak hanya Daftar Hadir L-08 (A4)"
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-sky-200 text-sky-700 font-bold rounded-xl text-sm shadow-sm transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak L-08
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Periode:</label>
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold outline-none"
          >
            {periodeOptions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Sumber:</span>
          <button
            type="button"
            onClick={() => setModeOverride("terverifikasi")}
            disabled={validVisits.length === 0}
            title={validVisits.length === 0 ? "Belum ada kunjungan tervalidasi" : `Pakai ${validVisits.length} kunjungan tervalidasi`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${modeEfektif === "terverifikasi" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Terverifikasi ({validVisits.length})
          </button>
          <button
            type="button"
            onClick={() => setModeOverride("lapangan")}
            title={`Pakai seluruh ${allPeriode.length} kunjungan lapangan`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${modeEfektif === "lapangan" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Lapangan ({allPeriode.length})
          </button>
        </div>
        <span className={`text-xs px-3 py-1 font-bold rounded-full ${modeEfektif === "terverifikasi" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          L-01 dari: {modeLabel}
        </span>
      </div>

      {isDraftReport && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 font-semibold no-print">
          ⚠️ Mode Lapangan: angka L-01 di bawah memakai seluruh {allPeriode.length} kunjungan (termasuk yang belum divalidasi). Untuk angka resmi, pilih sumber Terverifikasi atau minta Bidan memvalidasi di menu Bidan &gt; Verifikasi.
        </div>
      )}
      {!isDraftReport && pendingCount > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 text-xs text-blue-900 font-semibold no-print">
          ℹ️ Mode Terverifikasi: L-01 di bawah hanya memakai {validVisits.length} kunjungan resmi. {pendingCount} kunjungan lainnya belum masuk hitungan — alihkan ke sumber Lapangan untuk melihat semuanya.
        </div>
      )}
      {allPeriode.length === 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 text-sm text-rose-900 font-semibold no-print">
          Tidak ada kunjungan tercatat pada {bulan}. Buka sesi posyandu di menu Jadwal Posyandu atau pilih periode lain pada pilihan di atas.
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

      {/* L-08: Daftar Hadir riil (printable) — SELURUH kehadiran periode (mode tidak memfilter) */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm printable-card max-w-4xl mx-auto text-gray-900 mt-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold underline uppercase">Daftar Hadir Peserta Posyandu (L-08)</h2>
          <p className="text-xs text-gray-600 mt-1">Periode: <strong>{bulan}</strong> · Seluruh kehadiran, status verifikasi per baris</p>
        </div>
        <table className="w-full text-xs text-left border border-gray-300">
          <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
            <tr>
              <th className="p-2 border-r border-gray-300 text-center w-10">No</th>
              <th className="p-2 border-r border-gray-300">Nama Peserta</th>
              <th className="p-2 border-r border-gray-300">Kategori</th>
              <th className="p-2 border-r border-gray-300 text-center">Waktu Hadir</th>
              <th className="p-2 text-center">Status Verifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {daftarHadir.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">
                  Belum ada peserta tercatat hadir pada periode ini.
                </td>
              </tr>
            ) : (
              daftarHadir.map((p: any, i: number) => (
                <tr key={p.id || i}>
                  <td className="p-2 border-r border-gray-200 text-center">{i + 1}</td>
                  <td className="p-2 border-r border-gray-200 font-medium">{p.nama}</td>
                  <td className="p-2 border-r border-gray-200">{p.kategori}</td>
                  <td className="p-2 border-r border-gray-200 text-center">{p.waktu}</td>
                  <td className="p-2 text-center font-semibold">
                    {p.statusVerifikasi === "valid" ? (
                      <span className="text-emerald-700">Valid ✓</span>
                    ) : p.statusVerifikasi === "diperiksa" ? (
                      <span className="text-amber-700">Diperiksa</span>
                    ) : (
                      <span className="text-slate-500">Draft</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dokumen cetak terisolasi L-01 dan L-08 (portal body, A4). */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="print-doc" id={printTargetElementId("laporan-l01")}>
            <LaporanL01Print
              bulan={bulan}
              printedAt={printedAt}
              statusLine={statusLine}
              isDraft={isDraftReport}
              sumberDataLabel={modeLabel}
              jumlahSesi={sesiPeriode.jumlah}
              rentangTanggal={sesiPeriode.rentang}
              cakupanDS={cakupanDS}
              statusGiziBalita={statusGiziBalita}
              pelayanan={pelayanan}
              bidanNama={bidan.nama}
              bidanNip={bidan.nip_sip || "—"}
              ketuaNama={ketua.nama}
            />
          </div>,
          document.body
        )}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="print-doc" id={printTargetElementId("laporan-l08")}>
            <LaporanL08Print bulan={bulan} printedAt={printedAt} daftarHadir={daftarHadir} />
          </div>,
          document.body
        )}

      {/* H1: Katalog laporan L-01..L-08 (PRD F-09) — print per modul */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm no-print space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">Katalog Laporan (PRD F-09)</h3>
        <p className="text-xs text-gray-500">Gunakan tombol cetak di atas; pilih bagian yang ingin dicetak. L-01 &amp; L-08 dirender penuh di atas.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { kode: "L-01", nama: "Laporan Bulanan Posyandu", isi: "Semua komponen (render penuh di atas)", tersedia: true },
            { kode: "L-02", nama: "Laporan Sasaran", isi: "Tabel I — D/S per kategori", tersedia: false },
            { kode: "L-03", nama: "Laporan Pertumbuhan Balita", isi: "Tabel II — Naik/T/2T, stunting", tersedia: false },
            { kode: "L-04", nama: "Laporan Pelayanan", isi: "Tabel III — Vitamin A, PMT, Imunisasi, Fe", tersedia: false },
            { kode: "L-05", nama: "Laporan Ibu Hamil", isi: "Risiko bumil (lihat Dashboard Bidan)", tersedia: false },
            { kode: "L-06", nama: "Laporan Lansia", isi: "Risiko lansia (lihat Dashboard Bidan)", tersedia: false },
            { kode: "L-07", nama: "Rekapitulasi Kumulatif", isi: "Kuartal/tahun — butuh histori ≥3 bulan", tersedia: false },
            { kode: "L-08", nama: "Daftar Hadir", isi: "Peserta sesi periode terpilih (render penuh di atas)", tersedia: true },
          ].map((l) => (
            <div key={l.kode} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{l.kode} — {l.nama}</p>
                <p className="text-[11px] text-gray-500">{l.isi}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${l.tersedia ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {l.tersedia ? "Tersedia" : "Segera hadir"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
