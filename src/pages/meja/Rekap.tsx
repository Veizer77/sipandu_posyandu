/**
 * SIPANDU - Rekapitulasi Sesi Posyandu Hari H
 *
 * PERBAIKAN AUDIT REKAP (REKAP-AUDIT.md):
 * - RK-001: listHadir session-scoped (merged aktif+history, dedup).
 * - RK-002/RK-035: arsip hanya visit sesi yang ditutup + dedup (di store).
 * - RK-004/RK-005: tutup gagal = error + tetap di halaman; isClosing guard.
 * - RK-006/RK-007: rujukan canonical; kosong = "Tidak dicatat" (tanpa fiksi).
 * - RK-008/RK-009/RK-025: antropometri HANYA balita; z null = "Belum Dihitung".
 * - RK-010/RK-011: imunisasi dosis + anak unik; normalisasi boundary.
 * - RK-012/RK-013/RK-022: guard tanpa sesi (arsip read-only) + multi-session block.
 * - RK-014: denominator D/S global standar Kemenkes + label diperjelas.
 * - RK-015: rencana KR persist DB (status Terjadwal/Selesai/Batal).
 * - RK-016/RK-033: checklist kelengkapan + tutup paksa eksplisit.
 * - RK-021: link laporan pakai role prefix. RK-027: tombol print.
 * - RK-023/RK-024/RK-026: label KPI jujur; bar = % hadir; satuan akurat.
 * - RK-028/RK-029/RK-030: map memoized + grup kategori canonical.
 * - RK-031: section ringkasan Meja 3.
 */
import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Pill,
  Baby,
  HeartHandshake,
  Sparkles,
  Calendar,
  MapPin,
  AlertOctagon,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  Apple,
  Printer,
} from "lucide-react";
import { SIPANDU_SEED } from "@/lib/seedData";
import { MejaStepper } from "@/components/meja/MejaShared";
import { TutupSesiModal } from "@/components/meja/TutupSesiModal";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { formatTanggalIndo, namaHariIndo } from "@/lib/utils";
import { getAllSessionVisits } from "@/lib/meja1Logic";
import { getPenyuluhanSesi } from "@/lib/meja5Logic";
import {
  SASARAN_GROUPS,
  buildAnggotaMap,
  presentMemberIds,
  summarizeAntropometri,
  summarizePelayanan,
  summarizeMeja3,
  buildTutupChecklist,
  countSasaranGlobal,
  countSasaranHadir,
  buildFollowUpList,
  labelStatusAlur,
} from "@/lib/rekapLogic";
import { RekapBeritaPrint } from "@/components/print/RekapBeritaPrint";
import { printDocument, printTargetElementId } from "@/lib/print";

export default function Rekap() {
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const {
    data,
    activeSessionId,
    tutupSesiHariH,
    jadwalkanKunjunganRumah,
    updateStatusRencana,
  } = useSipandu();
  const navigate = useNavigate();

  const [showTutupModal, setShowTutupModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const isClosingRef = useRef(false);

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;
  const sesiAktif = (data.jadwal || []).find((j: any) => j.id === activeSessionId) || null;
  // RK-022: arsip read-only sesi terakhir yang ditutup.
  const sesiArsip = !sesiAktif && data.sesiArsipId
    ? (data.jadwal || []).find((j: any) => j.id === data.sesiArsipId) || null
    : null;
  const viewSessionId = activeSessionId || (sesiArsip ? sesiArsip.id : null);
  const isArchive = !sesiAktif && Boolean(sesiArsip);
  const sesiView = sesiAktif || sesiArsip;
  const tanggalSesi = sesiView?.tanggal ? new Date(`${sesiView.tanggal}T00:00:00`) : new Date();

  // RK-001: HANYA visit sesi yang dibuka (merged aktif + history, dedup).
  const listHadir = useMemo(
    () => getAllSessionVisits(data.kunjunganAktif, data.kunjungan, viewSessionId),
    [data.kunjunganAktif, data.kunjungan, viewSessionId]
  );
  const hadirCount = listHadir.length;

  // RK-028: map memoized.
  const anggotaById = useMemo(() => buildAnggotaMap(data.anggota), [data.anggota]);
  const keluargaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.keluarga || []).forEach((k: any) => {
      if (k?.id) m.set(k.id, k);
    });
    return m;
  }, [data.keluarga]);

  // RK-014: denominator global standar Kemenkes (label diperjelas di UI).
  const totalSasaran = useMemo(() => countSasaranGlobal(data.anggota), [data.anggota]);
  const presentIds = useMemo(() => presentMemberIds(listHadir), [listHadir]);
  const { sasaran: sasaranHadirCount, umum: umumHadirCount } = useMemo(
    () => countSasaranHadir(data.anggota, presentIds),
    [data.anggota, presentIds]
  );
  const tidakHadirCount = Math.max(0, totalSasaran - sasaranHadirCount);
  const persenDS = totalSasaran > 0 ? Math.min(100, Math.round((sasaranHadirCount / totalSasaran) * 100)) : 0;

  // Meja 1: breakdown per grup kategori canonical (RK-029/RK-030).
  const sasaranBreakdown = useMemo(() => {
    const activeMembers = (data.anggota || []).filter((a: any) => a?.status_aktif);
    return SASARAN_GROUPS.map((cat) => {
      const target = activeMembers.filter((a: any) => cat.match(String(a.kategori || ""))).length;
      const present = activeMembers.filter(
        (a: any) => cat.match(String(a.kategori || "")) && presentIds.has(a.id)
      ).length;
      const rate = target > 0 ? Math.round((present / target) * 100) : 0;
      return { ...cat, target, present, rate };
    });
  }, [data.anggota, presentIds]);

  // Meja 2: antropometri balita (RK-008/RK-009/RK-025).
  const antropometriSummary = useMemo(
    () => summarizeAntropometri(listHadir, anggotaById as any),
    [listHadir, anggotaById]
  );

  // Meja 3 & 4: pelayanan + rujukan + ringkasan Meja 3 (RK-006/007/009/010/011/031).
  const pelayananSummary = useMemo(
    () => summarizePelayanan(listHadir, anggotaById as any),
    [listHadir, anggotaById]
  );
  const meja3Summary = useMemo(() => summarizeMeja3(listHadir), [listHadir]);

  const bidan = (data.organisasi || []).find((o: any) => o.jabatan === "bidan") || {
    nama: SIPANDU_SEED.persona.bidan,
    nip_sip: null,
  };
  const ketua = (data.organisasi || []).find((o: any) => o.jabatan === "ketua_pkk") || {
    nama: SIPANDU_SEED.persona.ketua_pkk,
  };

  // Meja 5 sesi ini.
  const penyuluhanSesi = useMemo(
    () => getPenyuluhanSesi(data.penyuluhan, viewSessionId),
    [data.penyuluhan, viewSessionId]
  );

  // Follow-up absen + status rencana DB (RK-015).
  const followUp = useMemo(
    () => buildFollowUpList(data.anggota, keluargaById as any, presentIds),
    [data.anggota, keluargaById, presentIds]
  );
  const rencanaByAnggota = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of data.rencanaKunjungan || []) {
      if (r?.anggota_id && !m.has(r.anggota_id)) m.set(r.anggota_id, r);
    }
    return m;
  }, [data.rencanaKunjungan]);

  // RK-016/RK-033: checklist kelengkapan tutup sesi.
  const checklist = useMemo(
    () => buildTutupChecklist(listHadir, penyuluhanSesi.length),
    [listHadir, penyuluhanSesi]
  );

  const printedAt = useMemo(
    () => new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    []
  );

  // Baris daftar hadir untuk dokumen cetak (nama + label status stabil).
  const daftarHadirCetak = useMemo(
    () =>
      listHadir.map((k: any) => {
        const a = anggotaById.get(k.anggota_id);
        return {
          id: k.id,
          nama: a?.nama || "—",
          kategori: a?.kategori || "—",
          waktu: k.waktu_hadir
            ? new Date(k.waktu_hadir).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            : "—",
          status: labelStatusAlur(k.status_alur),
        };
      }),
    [listHadir, anggotaById]
  );

  const rencanaStatusMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [anggotaId, r] of rencanaByAnggota.entries()) {
      if (r?.status) m[anggotaId] = r.status;
    }
    return m;
  }, [rencanaByAnggota]);

  const tanggalLabelCetak = `${namaHariIndo(tanggalSesi)}, ${formatTanggalIndo(tanggalSesi)}`;

  async function handleScheduleVisit(id: string, nama: string) {
    try {
      const { action } = await jadwalkanKunjunganRumah(id, `Absen sesi ${formatTanggalIndo(tanggalSesi)}`);
      showToast(
        action === "existed"
          ? `Rencana kunjungan rumah untuk ${nama} sudah tercatat sebelumnya.`
          : `Rencana kunjungan rumah untuk ${nama} tersimpan dan terlihat lintas sesi.`,
        action === "existed" ? "info" : "success"
      );
    } catch {
      // Toast error sudah dari store.
    }
  }

  async function handleStatusRencana(id: string, status: "selesai" | "dibatalkan", nama: string) {
    try {
      await updateStatusRencana(id, status);
      showToast(
        status === "selesai"
          ? `Kunjungan rumah ke ${nama} ditandai selesai.`
          : `Rencana kunjungan rumah ke ${nama} dibatalkan.`,
        "success"
      );
    } catch {
      // Toast error sudah dari store.
    }
  }

  async function handleTutupSesi() {
    if (!sesiAktif || isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setCloseError(null);
    try {
      // RK-004: gagal = error + tetap di halaman (tanpa navigasi).
      const res = await tutupSesiHariH(sesiAktif.id);
      setShowTutupModal(false);
      showToast(
        `Sesi Posyandu resmi ditutup! ${res.closedCount} kunjungan diarsipkan ke Laporan Bulanan L-01.`,
        "success"
      );
      navigate(`${rolePrefix}/laporan`);
    } catch (err: any) {
      setCloseError(err?.message || "Gagal menutup sesi.");
    } finally {
      isClosingRef.current = false;
      setIsClosing(false);
    }
  }

  if (!viewSessionId) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={6} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Belum Ada Sesi Posyandu Aktif</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Buka sesi hari H di halaman Jadwal Posyandu untuk melihat rekapitulasi.
          </p>
          <Link to={jadwalUrl} className="mt-4 inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
            Buka Jadwal Posyandu
          </Link>
        </div>
      </div>
    );
  }

  if (multipleActive) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={6} />
        <div className="bg-white p-12 rounded-2xl border border-rose-200 shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Terdeteksi Lebih dari Satu Sesi Aktif</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Rekapitulasi diblokir agar KPI tidak mencampur dua sesi. Tutup/akhiri sesi ganda di halaman Jadwal Posyandu.
          </p>
          <Link to={jadwalUrl} className="mt-4 inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
            Kelola Jadwal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* TAMPILAN SCREEN (DISEMBUNYIKAN SAAT PRINT) */}
      <div className="no-print space-y-6">
        <MejaStepper activeMeja={6} />

        {isArchive && (
          <div className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl px-4 py-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Arsip sesi (read-only) — sesi ini sudah ditutup. Data di bawah adalah arsip final.
          </div>
        )}

        {/* Header Sesi & Twin KPI Box */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Sesi Hari H Aktif — Rekapitulasi Alur 5 Meja
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rekapitulasi Lengkap Sesi Hari H</h1>
            <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{namaHariIndo(tanggalSesi)}, {formatTanggalIndo(tanggalSesi)}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{sesiView?.tempat || "Balai RW 06 Desa Mojorejo"}</span>
            </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center min-w-[110px]">
              <span className="text-[10px] text-emerald-700 font-bold uppercase">Hadir (D) Total</span>
              <p className="text-lg font-bold text-emerald-800 leading-none mt-0.5">{hadirCount} Jiwa</p>
            </div>
            <div className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-center min-w-[110px]">
              <span className="text-[10px] text-sky-700 font-bold uppercase">Capaian D/S</span>
              <p className="text-lg font-bold text-sky-800 leading-none mt-0.5">{persenDS}%</p>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <Link
                to={`${rolePrefix}/laporan`}
                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" /> Format L-01
              </Link>
              <button
                type="button"
                onClick={() => printDocument("rekap-berita")}
                title="Cetak Berita Acara Rekapitulasi Sesi Hari H"
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Rekap / Berita Acara (PDF)
              </button>
              {!isArchive && (
                <button
                  onClick={() => {
                    setCloseError(null);
                    setShowTutupModal(true);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Tutup Sesi
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Sasaran (S)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-gray-900">{totalSasaran}</h3>
            <span className="text-xs text-gray-500 font-medium">Jiwa RW 06 (D/S Kemenkes)</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gray-400 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Sasaran Hadir (D)</p>
          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <h3 className="text-2xl font-bold text-emerald-600">{sasaranHadirCount}</h3>
            <span className="text-xs text-emerald-600 font-medium">Sasaran Posyandu</span>
            {umumHadirCount > 0 && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                +{umumHadirCount} Umum (di luar D/S)
              </span>
            )}
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, persenDS)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Kehadiran Sesi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-amber-600">{persenDS}%</h3>
            <span className="text-xs text-amber-600 font-medium">{tidakHadirCount} sasaran belum hadir</span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, persenDS)}%` }} />
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
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                {sasaranHadirCount}/{totalSasaran} Sasaran
              </span>
              {umumHadirCount > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                  +{umumHadirCount} Umum
                </span>
              )}
            </div>
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

        {/* Meja 2: Status Antropometri Balita (scope balita saja) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">M2</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 2: Pengukuran & Antropometri Balita</h3>
                <p className="text-xs text-gray-500">Distribusi status gizi & stunting balita yang diukur (Z-Score WHO)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {antropometriSummary.diukur} Balita Diukur
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Belum Dihitung</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{antropometriSummary.belumDihitung}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Terukur, Z-Score belum tersedia</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            {antropometriSummary.belumDiukur} balita hadir belum terukur di Meja 2.
          </p>
        </div>
      </div>

      {/* Meja 3 ringkasan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">M3</span>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Meja 3: Pencatatan Keluhan & Temuan</h3>
            <p className="text-xs text-gray-500">Jumlah peserta dengan catatan terisi per jenis</p>
          </div>
          <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            {meja3Summary.adaCatatan} Tercatat
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Keluhan</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{meja3Summary.keluhan}</p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Temuan Kader</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{meja3Summary.temuan}</p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Catatan Kader</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{meja3Summary.catatanKader}</p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Catatan Bidan</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{meja3Summary.catatanBidan}</p>
          </div>
        </div>
      </div>

      {/* Meja 3 & 4 Logistik + Meja 5 Penyuluhan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meja 4: Pelayanan & Rujukan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">M4</span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Meja 4: Pelayanan Kesehatan, Imunisasi & PMT</h3>
                <p className="text-xs text-gray-500">Logistik intervensi gizi & rujukan medis Puskesmas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
              <Pill className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Vitamin A</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.vitA} Kapsul</h4>
            </div>
            <div className="p-3 bg-green-50/60 border border-green-100 rounded-xl text-center">
              <Apple className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">PMT</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.pmt} Penerima</h4>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
              <Baby className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Imunisasi</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.dosisCount} Dosis</h4>
              <p className="text-[10px] text-blue-600">{pelayananSummary.anakCount} Anak</p>
            </div>
            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
              <HeartHandshake className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Tablet Fe</p>
              <h4 className="text-lg font-bold text-gray-900 mt-0.5">{pelayananSummary.fe} Penerima</h4>
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
                      <p className="text-xs text-gray-600 mt-0.5">
                        {r.alasan || <span className="italic text-amber-700">Alasan tidak dicatat</span>}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-700 whitespace-nowrap">
                      {r.tujuan || <span className="italic font-semibold">Tujuan tidak dicatat</span>}
                    </span>
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
            {!isArchive && (
              <Link to={`${rolePrefix}/meja5`} className="text-xs font-bold text-teal-600 hover:text-teal-700">
                Buka Meja 5 &rarr;
              </Link>
            )}
          </div>

          {penyuluhanSesi.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">Belum Ada Sesi Edukasi Didokumentasikan</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Catat topik edukasi Kemenkes ILP di Meja 5 sebelum menutup sesi.</p>
              {!isArchive && (
                <Link to={`${rolePrefix}/meja5`} className="mt-3 inline-block px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">
                  Catat Materi di Meja 5
                </Link>
              )}
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
              Status tersimpan di database dan terlihat lintas sesi.
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
              const rencana = rencanaByAnggota.get(f.id);
              const statusRencana = rencana?.status || "none";
              const isTerjadwal = statusRencana === "terjadwal";
              const isSelesai = statusRencana === "selesai";
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
                    {isTerjadwal && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Terjadwal kunjungan rumah{rencana?.created_at ? ` • ${new Date(rencana.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                      </p>
                    )}
                    {isSelesai && (
                      <p className="text-[11px] text-gray-500 font-semibold mt-1">Kunjungan rumah selesai ✓</p>
                    )}
                  </div>

                  {!isArchive && (
                    <div className="mt-4 flex items-center gap-2">
                      {statusRencana === "none" || rencana?.status === "dibatalkan" ? (
                        <button
                          onClick={() => handleScheduleVisit(f.id, f.nama)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            f.isPriority
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                              : "bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                          }`}
                        >
                          Jadwalkan Kunjungan Rumah
                        </button>
                      ) : isTerjadwal ? (
                        <>
                          <button
                            onClick={() => handleStatusRencana(rencana.id, "selesai", f.nama)}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </button>
                          <button
                            onClick={() => handleStatusRencana(rencana.id, "dibatalkan", f.nama)}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            Batalkan
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleScheduleVisit(f.id, f.nama)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold transition bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                        >
                          Jadwalkan Ulang
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Tutup Sesi */}
      {showTutupModal && !isArchive && (
        <TutupSesiModal
          tanggalLabel={`${namaHariIndo(tanggalSesi)}, ${formatTanggalIndo(tanggalSesi)}`}
          hadirCount={hadirCount}
          followUpCount={followUp.length}
          rujukanCount={pelayananSummary.rujukanList.length}
          checklist={checklist}
          isClosing={isClosing}
          closeError={closeError}
          onCancel={() => {
            if (!isClosing) setShowTutupModal(false);
          }}
          onConfirm={handleTutupSesi}
        />
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <TrendingUp className="w-4 h-4" />
        <span>Rekapitulasi sesi ini — D/S standar Kemenkes dari seluruh sasaran aktif RW 06.</span>
      </div>
    </div>

      {/* Dokumen cetak terisolasi: Berita Acara Rekapitulasi Sesi (portal body). */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="print-doc" id={printTargetElementId("rekap-berita")}>
            <RekapBeritaPrint
              tanggalLabel={tanggalLabelCetak}
              tempat={sesiView?.tempat || "Balai RW 06 Desa Mojorejo"}
              temaSesi={sesiView?.tema || "Posyandu ILP Siklus Hidup"}
              statusSesi={isArchive ? "Selesai (Arsip)" : "Sesi Hari H"}
              sesiId={viewSessionId || ""}
              statusLaporan={isArchive ? "Arsip final" : "Sementara — sesi berjalan"}
              hadirCount={hadirCount}
              sasaranHadirCount={sasaranHadirCount}
              umumHadirCount={umumHadirCount}
              totalSasaran={totalSasaran}
              persenDS={persenDS}
              tidakHadirCount={tidakHadirCount}
              sasaranBreakdown={sasaranBreakdown}
              antropometri={antropometriSummary}
              meja3={meja3Summary}
              pelayanan={pelayananSummary}
              penyuluhanSesi={penyuluhanSesi.map((p: any) => ({
                id: p.id,
                tema: p.tema,
                jumlah: Number(p.jumlah_peserta ?? p.jumlah ?? 0) || 0,
                narasumber: p.narasumber,
                metode: p.metode,
                ringkasan: p.ringkasan,
              }))}
              followUp={followUp.map((f: any) => ({
                id: f.id,
                nama: f.nama,
                kategori: f.kategori,
                rt: f.rt,
                kepalaKeluarga: f.kepalaKeluarga,
                tag: f.tag,
                isPriority: f.isPriority,
                rencanaStatus: rencanaStatusMap[f.id] ?? null,
              }))}
              daftarHadir={daftarHadirCetak}
              bidanNama={bidan.nama}
              bidanNip={bidan.nip_sip || "—"}
              ketuaNama={ketua.nama}
              printedAt={printedAt}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
