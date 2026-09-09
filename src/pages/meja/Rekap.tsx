/**
 * SIPANDU - Rekapitulasi Sesi Posyandu Hari H
 * Audit & Redesign sesuai PRD v3.0.0 (Alur 5 Meja Lengkap & Evaluasi Sesi)
 */
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Pill,
  Baby,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Calendar,
  MapPin,
  AlertOctagon,
  ShieldCheck,
  X,
  FileCheck,
  TrendingUp,
  Apple
} from "lucide-react";
import { MejaStepper } from "@/components/meja/MejaShared";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { formatTanggalIndo, namaHariIndo } from "@/lib/utils";

export default function Rekap() {
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const { data, tutupSesiHariH } = useSipandu();
  const navigate = useNavigate();

  const [showTutupModal, setShowTutupModal] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState<Record<string, boolean>>({});

  const sesiAktif = data.jadwal.find((j: any) => j.status === "aktif");
  const tanggalSesi = sesiAktif?.tanggal ? new Date(`${sesiAktif.tanggal}T00:00:00`) : new Date();

  // Presensi & Sasaran Keseluruhan
  const totalSasaran = data.anggota.filter((a: any) => a.status_aktif && a.kategori !== "umum").length;
  const listHadir = data.kunjunganAktif;
  const hadirCount = listHadir.length;
  const tidakHadirCount = Math.max(0, totalSasaran - hadirCount);
  const persenDS = totalSasaran > 0 ? Math.round((hadirCount / totalSasaran) * 100) : 0;

  // Meja 1: Breakdown Kehadiran per Kategori Sasaran
  const sasaranBreakdown = useMemo(() => {
    const presentMemberIds = new Set(listHadir.map((k: any) => k.anggota_id));
    const activeMembers = data.anggota.filter((a: any) => a.status_aktif);

    const categories = [
      { key: "balita", label: "Bayi & Balita (0–59 bln)", match: (k: string) => k === "bayi" || k === "balita", badge: "bg-amber-100 text-amber-800" },
      { key: "ibu_hamil", label: "Ibu Hamil", match: (k: string) => k === "ibu_hamil", badge: "bg-rose-100 text-rose-800" },
      { key: "wus", label: "Usia Subur / Produktif (WUS/PUS)", match: (k: string) => k === "usia_produktif" || k === "wus" || k === "pus" || k === "remaja", badge: "bg-purple-100 text-purple-800" },
      { key: "lansia", label: "Lanjut Usia (Lansia)", match: (k: string) => k === "lansia", badge: "bg-teal-100 text-teal-800" },
    ];

    return categories.map((cat) => {
      const target = activeMembers.filter((a: any) => cat.match(a.kategori)).length;
      const present = activeMembers.filter((a: any) => cat.match(a.kategori) && presentMemberIds.has(a.id)).length;
      const rate = target > 0 ? Math.round((present / target) * 100) : 0;
      return { ...cat, target, present, rate };
    });
  }, [data.anggota, listHadir]);

  // Meja 2: Status Antropometri & Pertumbuhan Balita
  const antropometriSummary = useMemo(() => {
    let diukur = 0;
    let normal = 0;
    let giziKurang = 0;
    let giziBuruk = 0;
    let berisikoLebih = 0;
    let stunting = 0;

    listHadir.forEach((k: any) => {
      const p = k.pengukuran;
      if (p && (p.berat_badan || p.tinggi_badan)) {
        diukur++;
        const zBBU = p.z_score_bbu;
        const zTBU = p.z_score_tbu;

        if (zBBU !== undefined && zBBU !== null) {
          if (zBBU < -3) giziBuruk++;
          else if (zBBU < -2) giziKurang++;
          else if (zBBU > 2) berisikoLebih++;
          else normal++;
        } else {
          normal++;
        }

        if (zTBU !== undefined && zTBU !== null && zTBU < -2) {
          stunting++;
        }
      }
    });

    return { diukur, normal, giziKurang, giziBuruk, berisikoLebih, stunting };
  }, [listHadir]);

  // Meja 3 & 4: Rekapitulasi Pelayanan, Logistik & Rujukan
  const pelayananSummary = useMemo(() => {
    let vitA = 0;
    let pmt = 0;
    let imunisasi = 0;
    let fe = 0;
    let cacing = 0;
    const rujukanList: Array<{ nama: string; kategori: string; alasan: string; tujuan: string }> = [];

    listHadir.forEach((k: any) => {
      const a = data.anggota.find((m: any) => m.id === k.anggota_id);
      const p = k.pelayanan;
      if (p) {
        if (p.vitamin_a) vitA++;
        if (p.pmt) pmt++;
        if (p.imunisasi && p.imunisasi.length > 0) imunisasi += p.imunisasi.length;
        if (p.tablet_fe) fe++;
        if (p.obat_cacing) cacing++;
        if (p.rujukan && a) {
          rujukanList.push({
            nama: a.nama,
            kategori: a.kategori,
            alasan: p.alasan_rujukan || "Hasil pemeriksaan memerlukan observasi Puskesmas",
            tujuan: p.tujuan_rujukan || "Puskesmas Mojorejo",
          });
        }
      }
    });

    return { vitA, pmt, imunisasi, fe, cacing, rujukanList };
  }, [listHadir, data.anggota]);

  // Meja 5: Rekap Penyuluhan Kelompok Sesi Ini
  const penyuluhanSesi = useMemo(() => {
    const activeJadwalId = sesiAktif?.id;
    return (data.penyuluhan || []).filter(
      (p: any) => !activeJadwalId || p.jadwal_posyandu_id === activeJadwalId || p.jadwal_id === activeJadwalId
    );
  }, [data.penyuluhan, sesiAktif]);

  // Follow-up: Sasaran yang Tidak Hadir
  const followUp = useMemo(() => {
    const presentIds = new Set(listHadir.map((k: any) => k.anggota_id));
    return data.anggota
      .filter((a: any) => a.status_aktif && a.kategori !== "umum" && !presentIds.has(a.id))
      .map((a: any) => {
        const kel = data.keluarga.find((k: any) => k.id === a.keluarga_id);
        const isAnak = a.kategori === "bayi" || a.kategori === "balita";
        const isBumil = a.kategori === "ibu_hamil";
        return {
          id: a.id,
          nama: a.nama,
          kategori: a.kategori,
          rt: kel ? kel.rt : "01",
          kepalaKeluarga: kel ? kel.nama_kepala_keluarga : "—",
          isPriority: isAnak || isBumil,
          tag: isAnak ? "PRIORITAS BALITA" : isBumil ? "PRIORITAS BUMIL" : "Absen Hari H",
        };
      })
      .sort((a: any, b: any) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
  }, [data.anggota, listHadir, data.keluarga]);

  function handleScheduleVisit(id: string, nama: string) {
    setScheduledVisits((prev) => ({ ...prev, [id]: true }));
    showToast(`Rencana kunjungan rumah untuk ${nama} berhasil dijadwalkan pada Agenda Kader ILP.`, "success");
  }

  async function handleTutupSesi() {
    if (!sesiAktif) {
      showToast("Tidak ada sesi aktif untuk ditutup.", "warning");
      return;
    }
    await tutupSesiHariH(sesiAktif.id);
    setShowTutupModal(false);
    showToast("Sesi Posyandu resmi ditutup! Seluruh kunjungan telah diarsipkan ke Laporan Bulanan L-01.", "success");
    navigate(`${rolePrefix}/laporan`);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={6} />

      {/* Header Sesi Aktif & Twin KPI Box (Serasi 100% dengan Meja 1-5) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Sesi Hari H Aktif — Rekapitulasi Alur 5 Meja
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rekapitulasi Lengkap Sesi Hari H</h1>
          <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{namaHariIndo(tanggalSesi)}, {formatTanggalIndo(tanggalSesi)}</span>
            <span>•</span>
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{sesiAktif?.tempat || "Balai RW 06 Desa Mojorejo"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-emerald-700 font-bold uppercase">Hadir (D)</span>
            <p className="text-lg font-bold text-emerald-800 leading-none mt-0.5">{hadirCount} Jiwa</p>
          </div>
          <div className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-sky-700 font-bold uppercase">Capaian D/S</span>
            <p className="text-lg font-bold text-sky-800 leading-none mt-0.5">{persenDS}%</p>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <Link
              to="/laporan"
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" /> Format L-01
            </Link>
            <button
              onClick={() => setShowTutupModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-2"
            >
              <Lock className="w-4 h-4" /> Tutup Sesi
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Sasaran (S)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-gray-900">{totalSasaran}</h3>
            <span className="text-xs text-gray-500 font-medium">Jiwa RW 06</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gray-400 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Hadir Dilayani (D)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-emerald-600">{hadirCount}</h3>
            <span className="text-xs text-emerald-600 font-medium">Peserta Masuk</span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, persenDS)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Belum Hadir</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-amber-600">{tidakHadirCount}</h3>
            <span className="text-xs text-amber-600 font-medium">Perlu Kunjungan</span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalSasaran > 0 ? (tidakHadirCount / totalSasaran) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Capaian D/S Sesi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-sky-600">{persenDS}%</h3>
            <span className="text-xs text-sky-600 font-medium">Target &ge; 85%</span>
          </div>
          <div className="w-full bg-sky-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full" style={{ width: `${Math.min(100, persenDS)}%` }} />
          </div>
        </div>
      </div>

      {/* Grid Alur Meja 1 to 5 Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meja 1: Presensi per Sasaran */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">M1</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 1: Registrasi & Presensi Sasaran</h3>
                <p className="text-xs text-gray-500">Tingkat kehadiran per kelompok siklus hidup ILP</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              {hadirCount}/{totalSasaran} Jiwa
            </span>
          </div>

          <div className="space-y-3">
            {sasaranBreakdown.map((s) => (
              <div key={s.key} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-gray-900">{s.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.badge}`}>
                      {s.present} dari {s.target}
                    </span>
                  </div>
                  <div className="w-48 sm:w-64 bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, s.rate)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{s.rate}%</span>
                  <p className="text-[10px] text-gray-400">Cakupan</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meja 2: Status Pertumbuhan & Antropometri Balita */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">M2</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 2: Pengukuran & Antropometri (Kemenkes)</h3>
                <p className="text-xs text-gray-500">Distribusi status gizi & stunting balita yang diukur</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {antropometriSummary.diukur} Selesai Diukur
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Gizi Baik</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{antropometriSummary.normal}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Z-Score Normal</p>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Gizi Kurang</span>
              <p className="text-xl font-bold text-amber-800 mt-1">{antropometriSummary.giziKurang}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">-3 s/d -2 SD</p>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Gizi Buruk / 2T</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{antropometriSummary.giziBuruk}</p>
              <p className="text-[10px] text-rose-600 mt-0.5">&lt; -3 SD (Kritis)</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-[10px] font-bold text-red-700 uppercase">Risiko Stunting</span>
              <p className="text-xl font-bold text-red-800 mt-1">{antropometriSummary.stunting}</p>
              <p className="text-[10px] text-red-600 mt-0.5">TB/U &lt; -2 SD</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Gizi Lebih</span>
              <p className="text-xl font-bold text-purple-800 mt-1">{antropometriSummary.berisikoLebih}</p>
              <p className="text-[10px] text-purple-600 mt-0.5">&gt; +2 SD</p>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Belum Diukur</span>
              <p className="text-xl font-bold text-gray-800 mt-1">{Math.max(0, hadirCount - antropometriSummary.diukur)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Dalam Antrean</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meja 3 & 4 Logistik + Meja 5 Penyuluhan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meja 3 & 4: Pelayanan & Rujukan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">M3-4</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 3 & 4: Pelayanan Kesehatan, Imunisasi & PMT</h3>
                <p className="text-xs text-gray-500">Logistik intervensi gizi & rujukan medis Puskesmas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
              <Pill className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Vitamin A</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.vitA} Dosis</h4>
            </div>
            <div className="p-3 bg-green-50/60 border border-green-100 rounded-xl text-center">
              <Apple className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">PMT Lokal</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.pmt} Paket</h4>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
              <Baby className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Imunisasi</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.imunisasi} Suntik</h4>
            </div>
            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
              <HeartHandshake className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Tablet Fe</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.fe} Bumil</h4>
            </div>
          </div>

          {/* Rujukan List */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-500" /> Rujukan Faskes Tingkat Pertama (FKTP)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {pelayananSummary.rujukanList.length} Rujukan
              </span>
            </div>

            {pelayananSummary.rujukanList.length === 0 ? (
              <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl text-center">
                Tidak ada peserta yang memerlukan rujukan darurat/Puskesmas pada sesi ini.
              </p>
            ) : (
              <div className="space-y-2">
                {pelayananSummary.rujukanList.map((r, i) => (
                  <div key={i} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{r.nama}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">
                          {r.kategori}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{r.alasan}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-700 whitespace-nowrap">{r.tujuan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meja 5: Edukasi & Penyuluhan Kelompok */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">M5</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 5: Edukasi & Penyuluhan Kelompok</h3>
                <p className="text-xs text-gray-500">Dokumentasi sesi KIE dan penyuluhan kesehatan bersama</p>
              </div>
            </div>
            <Link to={`${rolePrefix}/meja5`} className="text-xs font-bold text-teal-600 hover:text-teal-700">
              Buka Meja 5 &rarr;
            </Link>
          </div>

          {penyuluhanSesi.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">Belum Ada Sesi Edukasi Didokumentasikan</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Catat topik edukasi Kemenkes ILP di Meja 5 sebelum menutup sesi.</p>
              <Link to={`${rolePrefix}/meja5`} className="mt-3 inline-block px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">
                Catat Materi di Meja 5
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {penyuluhanSesi.map((p: any) => (
                <div key={p.id} className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-gray-900">{p.tema}</h4>
                    <span className="px-2 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded-md whitespace-nowrap">
                      {p.jumlah_peserta ?? p.jumlah ?? 0} Hadir
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed break-words">{p.ringkasan}</p>
                  <div className="flex items-center justify-between text-[11px] text-teal-800 font-medium pt-1 border-t border-teal-100">
                    <span>Narasumber: <b>{p.narasumber}</b></span>
                    <span>Metode: {p.metode || "Ceramah"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sasaran Absen & Follow-up Kunjungan Rumah */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Sasaran Belum Hadir — Rencana Tindak Lanjut Kunjungan Rumah
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Kemenkes mewajibkan kader melakukan kunjungan rumah untuk balita & ibu hamil yang mangkir sesi Posyandu.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-full text-xs">
            {followUp.length} Sasaran Perlu Dikonfirmasi
          </span>
        </div>

        {followUp.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-900">Seluruh Sasaran Telah Hadir (100% D/S)!</p>
            <p className="text-xs text-emerald-700 mt-1">Tidak ada sasaran yang mangkir pada sesi Posyandu hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {followUp.map((f: any) => {
              const isScheduled = Boolean(scheduledVisits[f.id]);
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    f.isPriority ? "bg-rose-50/50 border-rose-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-gray-900">{f.nama}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.isPriority ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {f.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      KK: {f.kepalaKeluarga} • <b>RT {f.rt}</b>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Kategori: {f.kategori.toUpperCase()}</p>
                  </div>

                  <button
                    onClick={() => handleScheduleVisit(f.id, f.nama)}
                    disabled={isScheduled}
                    className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isScheduled
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : f.isPriority
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                        : "bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                    }`}
                  >
                    {isScheduled ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terjadwal Kunjungan
                      </>
                    ) : (
                      "Jadwalkan Kunjungan Rumah"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Tutup Sesi */}
      {showTutupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowTutupModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Tutup Sesi Hari H</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Anda akan menutup sesi Posyandu <b>{namaHariIndo(tanggalSesi)}, {formatTanggalIndo(tanggalSesi)}</b>. Seluruh
                antrean aktif ({hadirCount} kunjungan) akan diarsipkan menjadi riwayat resmi posyandu dan diteruskan ke
                Laporan Bulanan L-01.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Peserta Hadir Terlayani:</span>
                <span className="font-bold text-emerald-600">{hadirCount} Jiwa</span>
              </div>
              <div className="flex justify-between">
                <span>Rencana Kunjungan Rumah:</span>
                <span className="font-bold text-amber-600">{followUp.length} Sasaran</span>
              </div>
              <div className="flex justify-between">
                <span>Kasus Rujukan Puskesmas:</span>
                <span className="font-bold text-rose-600">{pelayananSummary.rujukanList.length} Kasus</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTutupModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTutupSesi}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Ya, Tutup Sesi Resmi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

