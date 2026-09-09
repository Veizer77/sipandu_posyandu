/**
 * SIPANDU - Meja 2: Pengukuran & Antropometri
 * Form adaptif per kategori + live Z-Score WHO + status klinis multi-kategori + deteksi risiko otomatis.
 * Layout full-width responsif & konsisten dengan alur 5 meja posyandu (PRD v3.0.0 Bab 9 & 34.4).
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Scale,
  ArrowLeft,
  ArrowRight,
  Activity,
  History,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  User,
  Baby,
  Sparkles,
  Info,
} from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import WHO_ENGINE, { deteksiRisiko } from "@/utils/zscoreCalculator";
import { adaImunisasiTertunggak } from "@/utils/jadwalImunisasi";
import { maskNik } from "@/lib/utils";

// Class constants for unified, premium form controls
const inputContainerCls = "relative";
const inputCls =
  "w-full pl-4 pr-14 py-3 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-semibold text-gray-900 text-sm outline-none transition shadow-xs";
const inputUnitCls =
  "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none";
const labelCls = "block text-xs font-bold text-gray-700 mb-1.5";

function AntreanMeja2({ data, navigate }: { data: any; navigate: any }) {
  const { currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const list = data.kunjunganAktif;
  const sudahDiukur = list.filter(
    (k: any) => k.pengukuran && (k.pengukuran.berat_badan || k.pengukuran.tinggi_badan)
  ).length;
  const belumDiukur = list.length - sudahDiukur;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={2} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Antrean Meja 2
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 2: Pengukuran & Antropometri</h1>
          <p className="text-xs text-gray-500">
            Pilih peserta yang telah registrasi di Meja 1 untuk melakukan pengukuran antropometri.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[100px]">
            <span className="text-[10px] text-blue-700 font-bold uppercase">Sudah Diukur</span>
            <p className="text-lg font-bold text-blue-800 leading-none mt-0.5">{sudahDiukur}</p>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[100px]">
            <span className="text-[10px] text-amber-700 font-bold uppercase">Menunggu</span>
            <p className="text-lg font-bold text-amber-800 leading-none mt-0.5">{belumDiukur}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Peserta Terdaftar di Meja 1</p>
            <p className="text-xs text-gray-400 mt-1">
              Lakukan pendaftaran kehadiran peserta di Meja 1 terlebih dahulu.
            </p>
            <Link
              to={`${rolePrefix}/meja1`}
              className="mt-4 inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
            >
              Buka Meja 1 Registrasi
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((k: any) => {
              const a = data.anggota.find((x: any) => x.id === k.anggota_id);
              if (!a) return null;
              const p = k.pengukuran;
              const isDone = Boolean(p && (p.berat_badan || p.tinggi_badan));
              const keluarga = data.keluarga.find((x: any) => x.id === a.keluarga_id);

              return (
                <div
                  key={k.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar nama={a.nama} className="w-12 h-12 rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {isDone ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Diukur
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                            Menunggu Pengukuran
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        NIK: {maskNik(a.nik)} · Usia:{" "}
                        {WHO_ENGINE.hitungUsia(a.tanggal_lahir)?.usiaTeks || "—"}
                        {isDone &&
                          ` · BB: ${p.berat_badan || "—"} kg · TB: ${p.tinggi_badan || "—"} cm · Status: ${p.status_gizi || "Normal"}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 ${
                      isDone
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>{isDone ? "Edit Pengukuran" : "Mulai Ukur"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Meja2() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const { data, updatePengukuran } = useSipandu();

  const anggota = data.anggota.find((a: any) => a.id === anggotaId);

  // Track loaded participant & dirty state so background polling or data refresh NEVER wipes active input
  const loadedAnggotaIdRef = useRef<string | undefined>(anggotaId);
  const isDirtyRef = useRef<boolean>(false);

  const [form, setForm] = useState<any>(() => {
    if (!anggotaId) return {};
    try {
      const draft = sessionStorage.getItem(`sipandu_draft_meja2_${anggotaId}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          isDirtyRef.current = true;
          return parsed;
        }
      }
    } catch {}
    const visit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
    return { ...(visit?.pengukuran || {}) };
  });

  // Re-sync form ONLY if switching participant, or initial data loads when form is untouched
  useEffect(() => {
    if (!anggotaId) return;

    // Case 1: Switching to a DIFFERENT participant
    if (loadedAnggotaIdRef.current !== anggotaId) {
      loadedAnggotaIdRef.current = anggotaId;
      isDirtyRef.current = false;

      let initialData: any = null;
      try {
        const draft = sessionStorage.getItem(`sipandu_draft_meja2_${anggotaId}`);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
            initialData = parsed;
            isDirtyRef.current = true;
          }
        }
      } catch {}

      if (!initialData) {
        const visit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
        initialData = { ...(visit?.pengukuran || {}) };
      }
      setForm(initialData);
      return;
    }

    // Case 2: Same participant - if user is editing or has dirty fields, DO NOT OVERWRITE!
    if (isDirtyRef.current) return;

    // Case 3: Same participant, but initial visit data just arrived from background load
    const visit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
    if (visit?.pengukuran && Object.keys(visit.pengukuran).length > 0) {
      setForm((prev: any) => {
        if (isDirtyRef.current || Object.keys(prev).length > 0) return prev;
        return { ...visit.pengukuran };
      });
    }
  }, [anggotaId, data.kunjunganAktif]);

  const usiaInfo = anggota ? WHO_ENGINE.hitungUsia(anggota.tanggal_lahir) : null;
  const lastVisit = anggota ? data.kunjungan.find((k: any) => k.anggota_id === anggota.id) : null;
  const lastWeight = lastVisit?.pengukuran?.berat_badan || null;

  const keluarga = useMemo(() => {
    if (!anggota) return null;
    return data.keluarga.find((k: any) => k.id === anggota.keluarga_id);
  }, [anggota, data.keluarga]);

  // Riwayat kunjungan 3 bulan terakhir (PRD 34.4)
  const riwayatKunjungan = useMemo(() => {
    if (!anggota) return [];
    return (data.kunjungan || [])
      .filter(
        (k: any) =>
          k.anggota_id === anggota.id &&
          k.pengukuran &&
          (k.pengukuran.berat_badan || k.pengukuran.tinggi_badan || k.pengukuran.td_sistolik)
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.waktu_hadir || 0).getTime() - new Date(a.waktu_hadir || 0).getTime()
      )
      .slice(0, 3);
  }, [anggota, data.kunjungan]);

  const isAnak = anggota?.kategori === "bayi" || anggota?.kategori === "balita";
  const isBumil = anggota?.kategori === "ibu_hamil" || anggota?.kategori === "bumil";
  const isLansia = anggota?.kategori === "lansia";
  const isWus = anggota?.kategori === "wus";
  const isUmum = !isAnak && !isBumil && !isLansia && !isWus;

  // Analisis Z-Score balita
  const analysis = useMemo(() => {
    if (!anggota || !usiaInfo || !isAnak || !form.berat_badan) return null;
    return WHO_ENGINE.analisisBalita(
      usiaInfo.totalBulan,
      anggota.jenis_kelamin,
      parseFloat(form.berat_badan),
      form.tinggi_badan ? parseFloat(form.tinggi_badan) : null,
      lastWeight
    );
  }, [anggota, form.berat_badan, form.tinggi_badan, usiaInfo, lastWeight, isAnak]);

  // Analisis Klinis Bumil (LILA, Hipertensi gestasional, DJJ, HPL)
  const bumilAnalysis = useMemo(() => {
    if (!isBumil || !anggota) return null;
    const lila = form.lingkar_lengan ? parseFloat(form.lingkar_lengan) : null;
    const s = form.td_sistolik ? parseInt(form.td_sistolik, 10) : null;
    const d = form.td_diastolik ? parseInt(form.td_diastolik, 10) : null;
    const djj = form.djj ? parseInt(form.djj, 10) : null;

    const lilaStatus =
      lila !== null
        ? lila < 23.5
          ? { label: "Risiko KEK (< 23.5 cm)", badge: "bg-rose-100 text-rose-800 border-rose-200" }
          : { label: "Normal (≥ 23.5 cm)", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" }
        : null;

    let tdStatus = null;
    if (s !== null && d !== null) {
      if (s >= 140 || d >= 90) {
        tdStatus = {
          label: "Hipertensi Kehamilan (≥ 140/90)",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
        };
      } else if (s >= 120 || d >= 80) {
        tdStatus = {
          label: "Pre-Hipertensi (120-139 / 80-89)",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
        };
      } else {
        tdStatus = {
          label: "Normal (< 120/80)",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      }
    }

    let djjStatus = null;
    if (djj !== null) {
      if (djj < 120) {
        djjStatus = {
          label: "Bradikardia Janin (< 120 bpm)",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
        };
      } else if (djj > 160) {
        djjStatus = {
          label: "Takikardia Janin (> 160 bpm)",
          badge: "bg-rose-100 text-rose-800 border-rose-200",
        };
      } else {
        djjStatus = {
          label: "Normal (120–160 bpm)",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      }
    }

    const hphtInfo = anggota.hpht ? WHO_ENGINE.hitungHPL(anggota.hpht) : null;
    return { lilaStatus, tdStatus, djjStatus, hphtInfo };
  }, [isBumil, anggota, form.lingkar_lengan, form.td_sistolik, form.td_diastolik, form.djj]);

  // Analisis IMT untuk non-anak & non-bumil
  const imt = useMemo(() => {
    if (!anggota || isAnak || isBumil) return null;
    const bb = parseFloat(form.berat_badan);
    const tb = parseFloat(form.tinggi_badan);
    if (!bb || !tb || tb <= 0) return null;
    const value = bb / Math.pow(tb / 100, 2);
    const label =
      value < 18.5
        ? "Berat Kurang (Underweight)"
        : value < 25
          ? "Gizi Normal"
          : value < 30
            ? "Kelebihan Berat Badan (Overweight)"
            : "Obesitas";
    const badge =
      value < 18.5
        ? "bg-sky-100 text-sky-800 border-sky-200"
        : value < 25
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : value < 30
            ? "bg-amber-100 text-amber-800 border-amber-200"
            : "bg-rose-100 text-rose-800 border-rose-200";
    return { value, label, badge };
  }, [anggota, form.berat_badan, form.tinggi_badan, isAnak, isBumil]);

  // Analisis Tekanan Darah Dewasa/Lansia
  const tensiAnalysis = useMemo(() => {
    const s = form.td_sistolik ? parseInt(form.td_sistolik, 10) : null;
    const d = form.td_diastolik ? parseInt(form.td_diastolik, 10) : null;
    if (s === null || d === null) return null;
    if (s >= 160 || d >= 100)
      return { label: "Hipertensi Derajat 2", badge: "bg-rose-100 text-rose-800 border-rose-200" };
    if (s >= 140 || d >= 90)
      return { label: "Hipertensi Derajat 1", badge: "bg-rose-100 text-rose-800 border-rose-200" };
    if (s >= 120 || d >= 80)
      return { label: "Pre-Hipertensi", badge: "bg-amber-100 text-amber-800 border-amber-200" };
    return { label: "Normal (< 120/80)", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }, [form.td_sistolik, form.td_diastolik]);

  // Analisis GDS Dewasa/Lansia
  const gdsAnalysis = useMemo(() => {
    const gds = form.gula_darah_sewaktu ? parseInt(form.gula_darah_sewaktu, 10) : null;
    if (gds === null) return null;
    if (gds >= 200)
      return { label: "Diabetes (≥ 200 mg/dL)", badge: "bg-rose-100 text-rose-800 border-rose-200" };
    if (gds >= 140)
      return { label: "Prediabetes (140-199 mg/dL)", badge: "bg-amber-100 text-amber-800 border-amber-200" };
    return { label: "Normal (< 140 mg/dL)", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }, [form.gula_darah_sewaktu]);

  // Deteksi Risiko Otomatis
  const risikoList = useMemo(() => {
    if (!anggota) return [];
    const diberikan = new Set<string>();
    [...data.kunjungan, ...data.kunjunganAktif].forEach((k: any) => {
      if (k?.anggota_id !== anggota.id) return;
      (k?.pelayanan?.imunisasi || []).forEach((j: string) => diberikan.add(j));
    });
    (anggota as any)?.imunisasi?.forEach((r: any) => diberikan.add(r.jenis));

    const pengukuranInput: any = {
      ...form,
      statusPertumbuhan: analysis?.statusPertumbuhan,
      usiaMinggu: anggota.status_hamil ? WHO_ENGINE.hitungHPL(anggota.hpht)?.usiaMinggu ?? 0 : 0,
      jenis_kelamin: anggota.jenis_kelamin,
      prev_berat_badan: lastWeight,
    };
    const riwayatInput = {
      imunisasiTertunggak:
        isAnak && usiaInfo ? adaImunisasiTertunggak(usiaInfo.totalBulan, Array.from(diberikan)) : false,
    };
    return deteksiRisiko(anggota.kategori, pengukuranInput, riwayatInput);
  }, [anggota, analysis, form, data.kunjungan]);

  if (!anggota) {
    return <AntreanMeja2 data={data} navigate={navigate} />;
  }

  const isUnderTwo = (usiaInfo?.totalBulan || 0) < 24;

  function set(field: string, value: string) {
    isDirtyRef.current = true;
    setForm((f: any) => {
      const next = { ...f, [field]: value };
      if (anggota?.id) {
        try {
          sessionStorage.setItem(`sipandu_draft_meja2_${anggota.id}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (anggota?.id) {
      try {
        sessionStorage.removeItem(`sipandu_draft_meja2_${anggota.id}`);
      } catch {}
    }
    isDirtyRef.current = false;

    const visit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggota.id);
    const visitId = visit?.id || `visit-${anggota.id}`;
    const risikoStructured = risikoList.map((r: any, idx: number) => ({
      id: r.id || `risiko::${visitId}::${r.kode || idx + 1}`,
      kunjungan_id: visitId,
      anggota_id: anggota.id,
      kode: r.kode || `R-${idx + 1}`,
      kode_risiko: r.kode || `R-${idx + 1}`,
      judul: r.judul || "Risiko Terdeteksi",
      deskripsi: r.deskripsi || r.judul || "Risiko Terdeteksi",
      severity: r.severity || "warning",
      tindakLanjut: r.tindakLanjut || "Konseling & Pantau Rutin",
      tindak_lanjut: r.tindakLanjut || "Konseling & Pantau Rutin",
      status: "aktif",
    }));

    const payload = {
      ...form,
      berat_badan: form.berat_badan ? parseFloat(form.berat_badan) : undefined,
      tinggi_badan: form.tinggi_badan ? parseFloat(form.tinggi_badan) : undefined,
      z_score_bbu: analysis?.z_bbu ?? null,
      z_score_tbu: analysis?.z_tbu ?? null,
      z_score_bbtb: analysis?.z_bbtb ?? null,
      status_gizi: analysis?.status_bbu?.label ?? (form.status_gizi || "Normal"),
      status_pertumbuhan: analysis?.statusPertumbuhan ?? "naik",
      risiko: risikoStructured,
    };
    await updatePengukuran(anggota.id, payload);
    showToast(`Pengukuran ${anggota.nama} tersimpan. Lanjut ke Meja 3.`, "success");
    navigate(`${rolePrefix}/meja3/${anggota.id}`);
  }

  const isSudahDiukur = Boolean(form.berat_badan || form.tinggi_badan);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* 1. Full-Width Stepper navigation */}
      <MejaStepper activeMeja={2} />

      {/* 2. Comprehensive Participant Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar nama={anggota.nama} className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl text-lg" />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CategoryBadge kategori={anggota.kategori} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {usiaInfo?.usiaTeks || ""}
              </span>
              {isSudahDiukur ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diukur
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                  Menunggu Pengukuran
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{anggota.nama}</h2>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
              <span>NIK: <strong className="text-gray-700">{maskNik(anggota.nik)}</strong></span>
              <span>·</span>
              <span>Lahir: {anggota.tanggal_lahir}</span>
              <span>·</span>
              <span>JK: {anggota.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</span>
              {keluarga && (
                <>
                  <span>·</span>
                  <span>KK: {keluarga.kepala_keluarga} (RT {keluarga.rt || "-"})</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Link
            to={`${rolePrefix}/meja2`}
            className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Kembali ke Antrean Meja 2</span>
          </Link>
        </div>
      </div>

      {/* 3. Balanced Responsive 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Pengukuran Antropometri (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-sm space-y-6"
        >
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  Form Pengukuran Antropometri
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isAnak && "Pengukuran standar WHO untuk balita & baduta posyandu."}
                {isBumil && "Pemeriksaan fisik ibu hamil untuk skrining risiko kehamilan."}
                {isLansia && "Pemeriksaan fisik & skrining Penyakit Tidak Menular (PTM) lansia."}
                {isWus && "Pemeriksaan antropometri wanita usia subur & deteksi KEK."}
                {isUmum && "Pemeriksaan fisik umum masyarakat."}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
              Field bertanda * wajib
            </span>
          </div>

          {/* Form Fields: Balita */}
          {isAnak && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Berat Badan (kg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="50"
                      required
                      value={form.berat_badan || ""}
                      onChange={(e) => set("berat_badan", e.target.value)}
                      placeholder="Contoh: 12.5"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>
                    {isUnderTwo ? "Panjang Badan (PB cm) *" : "Tinggi Badan (TB cm) *"}
                  </label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="150"
                      required
                      value={form.tinggi_badan || ""}
                      onChange={(e) => set("tinggi_badan", e.target.value)}
                      placeholder={isUnderTwo ? "Contoh: 75.0" : "Contoh: 88.5"}
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Lingkar Kepala (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="25"
                      max="60"
                      value={form.lingkar_kepala || ""}
                      onChange={(e) => set("lingkar_kepala", e.target.value)}
                      placeholder="Contoh: 45.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Lingkar Lengan Atas (LILA cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="8"
                      max="25"
                      value={form.lingkar_lengan || ""}
                      onChange={(e) => set("lingkar_lengan", e.target.value)}
                      placeholder="Contoh: 14.5"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Pedoman Pengukuran Balita Kemenkes ILP:</p>
                  <p className="text-blue-700 leading-relaxed text-[11px]">
                    Usia &lt; 24 bulan diukur telentang dengan <strong>Infantometer</strong> (Panjang Badan). Usia ≥ 24 bulan diukur berdiri dengan <strong>Stadiometer</strong> (Tinggi Badan).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Ibu Hamil */}
          {isBumil && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Berat Badan Ibu (kg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min="30"
                      max="150"
                      value={form.berat_badan || ""}
                      onChange={(e) => set("berat_badan", e.target.value)}
                      placeholder="Contoh: 60.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>LILA (cm) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min="15"
                      max="40"
                      value={form.lingkar_lengan || ""}
                      onChange={(e) => set("lingkar_lengan", e.target.value)}
                      placeholder="Contoh: 24.5"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>TD Sistolik (mmHg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      required
                      min="60"
                      max="250"
                      value={form.td_sistolik || ""}
                      onChange={(e) => set("td_sistolik", e.target.value)}
                      placeholder="120"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>TD Diastolik (mmHg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      required
                      min="40"
                      max="150"
                      value={form.td_diastolik || ""}
                      onChange={(e) => set("td_diastolik", e.target.value)}
                      placeholder="80"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tinggi Fundus Uteri (TFU cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="50"
                      value={form.tinggi_fundus || ""}
                      onChange={(e) => set("tinggi_fundus", e.target.value)}
                      placeholder="Contoh: 28.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Detak Jantung Janin (DJJ bpm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      min="50"
                      max="220"
                      value={form.djj || ""}
                      onChange={(e) => set("djj", e.target.value)}
                      placeholder="Contoh: 140"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>bpm</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Skrining Khusus Ibu Hamil (Bumil):</p>
                  <p className="text-rose-700 leading-relaxed text-[11px]">
                    LILA &lt; 23.5 cm berisiko <strong>Kurang Energi Kronis (KEK)</strong>. TD Sistolik ≥ 140 atau Diastolik ≥ 90 mmHg mengindikasikan risiko <strong>Hipertensi Kehamilan / Preeklamsia</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Lansia */}
          {isLansia && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Berat Badan (kg)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="200"
                      value={form.berat_badan || ""}
                      onChange={(e) => set("berat_badan", e.target.value)}
                      placeholder="65.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tinggi Badan (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="100"
                      max="220"
                      value={form.tinggi_badan || ""}
                      onChange={(e) => set("tinggi_badan", e.target.value)}
                      placeholder="160.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>TD Sistolik (mmHg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      required
                      min="60"
                      max="300"
                      value={form.td_sistolik || ""}
                      onChange={(e) => set("td_sistolik", e.target.value)}
                      placeholder="130"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>TD Diastolik (mmHg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      required
                      min="40"
                      max="200"
                      value={form.td_diastolik || ""}
                      onChange={(e) => set("td_diastolik", e.target.value)}
                      placeholder="85"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Gula Darah Sewaktu (GDS mg/dL)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      min="20"
                      max="600"
                      value={form.gula_darah_sewaktu || ""}
                      onChange={(e) => set("gula_darah_sewaktu", e.target.value)}
                      placeholder="110"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Lingkar Perut (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="40"
                      max="200"
                      value={form.lingkar_perut || ""}
                      onChange={(e) => set("lingkar_perut", e.target.value)}
                      placeholder="85.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: WUS (Wanita Usia Subur) */}
          {isWus && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Berat Badan (kg)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="200"
                      value={form.berat_badan || ""}
                      onChange={(e) => set("berat_badan", e.target.value)}
                      placeholder="55.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tinggi Badan (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="100"
                      max="220"
                      value={form.tinggi_badan || ""}
                      onChange={(e) => set("tinggi_badan", e.target.value)}
                      placeholder="158.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Lingkar Lengan Atas / LILA (cm)</label>
                <div className={inputContainerCls}>
                  <input
                    type="number"
                    step="0.1"
                    min="15"
                    max="40"
                    value={form.lingkar_lengan || ""}
                    onChange={(e) => set("lingkar_lengan", e.target.value)}
                    placeholder="24.5"
                    className={inputCls}
                  />
                  <span className={inputUnitCls}>cm</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Ambang batas risiko KEK WUS pra-nikah / prakonsepsi adalah &lt; 23.5 cm.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields: Umum / Lainnya */}
          {isUmum && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                Kategori <span className="font-bold text-gray-800">Umum</span>: Pemeriksaan antropometri dasar dan skrining tekanan darah serta metabolisme.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Berat Badan (kg) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="250"
                      required
                      value={form.berat_badan || ""}
                      onChange={(e) => set("berat_badan", e.target.value)}
                      placeholder="60.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tinggi Badan (cm) *</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="100"
                      max="230"
                      required
                      value={form.tinggi_badan || ""}
                      onChange={(e) => set("tinggi_badan", e.target.value)}
                      placeholder="160.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>TD Sistolik (mmHg)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      min="60"
                      max="300"
                      value={form.td_sistolik || ""}
                      onChange={(e) => set("td_sistolik", e.target.value)}
                      placeholder="120"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>TD Diastolik (mmHg)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      min="40"
                      max="200"
                      value={form.td_diastolik || ""}
                      onChange={(e) => set("td_diastolik", e.target.value)}
                      placeholder="80"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Gula Darah Sewaktu (mg/dL)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      min="20"
                      max="600"
                      value={form.gula_darah_sewaktu || ""}
                      onChange={(e) => set("gula_darah_sewaktu", e.target.value)}
                      placeholder="110"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>mg/dL</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Lingkar Perut (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="40"
                      max="200"
                      value={form.lingkar_perut || ""}
                      onChange={(e) => set("lingkar_perut", e.target.value)}
                      placeholder="85.0"
                      className={inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Catatan Pemeriksaan</label>
                <textarea
                  value={form.catatan || ""}
                  onChange={(e) => set("catatan", e.target.value)}
                  placeholder="Keluhan atau temuan lain saat pengukuran (opsional)"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
            <Link
              to={`${rolePrefix}/meja2`}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition text-center"
            >
              Batal / Antrean Meja 2
            </Link>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              <span>Simpan & Lanjut Meja 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Column: Live Analysis, Riwayat & Deteksi Risiko (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Hasil Analisis & Status Klinis Live */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {isAnak ? "Hasil Analisis Z-Score WHO" : "Status & Parameter Klinis"}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Balita Z-Score Content */}
            {isAnak && (
              <>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          BB/U
                        </p>
                        <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                          {analysis.z_bbu?.toFixed(2) ?? "—"}
                        </p>
                        <span
                          className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_bbu.badge}`}
                        >
                          {analysis.status_bbu.label}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          TB/U
                        </p>
                        <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                          {analysis.z_tbu?.toFixed(2) ?? "—"}
                        </p>
                        <span
                          className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_tbu.badge}`}
                        >
                          {analysis.status_tbu.label}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          BB/TB
                        </p>
                        <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                          {analysis.z_bbtb?.toFixed(2) ?? "—"}
                        </p>
                        <span
                          className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_bbtb.badge}`}
                        >
                          {analysis.status_bbtb.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[11px] block">
                          Pertumbuhan vs Bulan Lalu:
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {analysis.selisihBB >= 0 ? "+" : ""}
                          {analysis.selisihBB.toFixed(2)} kg
                        </span>
                        {lastWeight && (
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            (dari {lastWeight} kg)
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          analysis.statusPertumbuhan === "naik"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {analysis.statusPertumbuhan === "naik" ? "Naik (N) ✅" : "Tidak Naik (T) ⚠️"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                    <Baby className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-700">Kalkulasi Z-Score WHO Otomatis</p>
                    <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                      Masukkan Berat Badan dan Panjang/Tinggi Badan untuk melihat Z-score status gizi balita secara live.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Bumil Clinical Content */}
            {isBumil && (
              <div className="space-y-3">
                {bumilAnalysis && (bumilAnalysis.lilaStatus || bumilAnalysis.tdStatus || bumilAnalysis.djjStatus) ? (
                  <div className="space-y-2.5">
                    {bumilAnalysis.lilaStatus && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Status LILA:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.lilaStatus.badge}`}>
                          {bumilAnalysis.lilaStatus.label}
                        </span>
                      </div>
                    )}

                    {bumilAnalysis.tdStatus && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Tekanan Darah:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.tdStatus.badge}`}>
                          {form.td_sistolik}/{form.td_diastolik} · {bumilAnalysis.tdStatus.label}
                        </span>
                      </div>
                    )}

                    {bumilAnalysis.djjStatus && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Detak Jantung Janin:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.djjStatus.badge}`}>
                          {form.djj} bpm · {bumilAnalysis.djjStatus.label}
                        </span>
                      </div>
                    )}

                    {bumilAnalysis.hphtInfo && (
                      <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-100 text-xs text-pink-900 flex items-center justify-between">
                        <span>Perkiraan Lahir (HPL):</span>
                        <span className="font-bold">{bumilAnalysis.hphtInfo.hplFormatted} ({bumilAnalysis.hphtInfo.usiaMinggu} Minggu)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                    <HeartPulse className="w-8 h-8 text-rose-300 mx-auto" />
                    <p className="font-semibold text-gray-700">Pemantauan Khusus Ibu Hamil</p>
                    <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                      Isi LILA dan Tekanan Darah untuk mendeteksi risiko KEK dan hipertensi kehamilan secara otomatis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Lansia / WUS / Umum Content */}
            {!isAnak && !isBumil && (
              <div className="space-y-3">
                {imt || tensiAnalysis || gdsAnalysis ? (
                  <div className="space-y-2.5">
                    {imt && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Indeks Massa Tubuh (IMT)
                        </p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                          {imt.value.toFixed(1)}
                        </p>
                        <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${imt.badge}`}>
                          {imt.label}
                        </span>
                      </div>
                    )}

                    {tensiAnalysis && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Tekanan Darah:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${tensiAnalysis.badge}`}>
                          {form.td_sistolik}/{form.td_diastolik} · {tensiAnalysis.label}
                        </span>
                      </div>
                    )}

                    {gdsAnalysis && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Gula Darah (GDS):</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${gdsAnalysis.badge}`}>
                          {form.gula_darah_sewaktu} mg/dL · {gdsAnalysis.label}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-700">Analisis Kesehatan Posyandu</p>
                    <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                      Masukkan data antropometri dan tanda vital untuk memantau status gizi dan skrining PTM.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Riwayat Pengukuran Sebelumnya (PRD 34.4) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Riwayat Pengukuran Terakhir
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                KMS & Kunjungan Lalu
              </span>
            </div>

            {riwayatKunjungan.length > 0 ? (
              <div className="space-y-2">
                {riwayatKunjungan.map((rk: any, i: number) => {
                  const p = rk.pengukuran || {};
                  return (
                    <div
                      key={rk.id || i}
                      className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {new Date(rk.waktu_hadir).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          BB: {p.berat_badan ? `${p.berat_badan} kg` : "—"} · TB:{" "}
                          {p.tinggi_badan ? `${p.tinggi_badan} cm` : "—"}
                          {p.lingkar_lengan ? ` · LILA: ${p.lingkar_lengan} cm` : ""}
                          {p.td_sistolik ? ` · TD: ${p.td_sistolik}/${p.td_diastolik}` : ""}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-gray-200 text-gray-700">
                        {p.status_gizi || "Tercatat"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-500">
                <p className="text-gray-400 text-[11px]">
                  Kunjungan pertama pada periode ini. Belum ada catatan pengukuran terdahulu.
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Deteksi Risiko Klinis Otomatis (Live) */}
          <div
            className={`p-6 rounded-2xl border shadow-sm space-y-3 transition ${
              risikoList.length > 0
                ? "bg-rose-50/40 border-rose-200"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100/80 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    risikoList.length > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3
                  className={`font-bold text-sm ${
                    risikoList.length > 0 ? "text-rose-900" : "text-gray-900"
                  }`}
                >
                  Deteksi Risiko Klinis
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  risikoList.length > 0
                    ? "bg-rose-200 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {risikoList.length > 0 ? `${risikoList.length} Terdeteksi` : "Aman / Normal"}
              </span>
            </div>

            {risikoList.length > 0 ? (
              <div className="space-y-2.5">
                {risikoList.map((r) => (
                  <div
                    key={r.kode}
                    className={`p-3 rounded-xl border text-xs ${
                      r.severity === "danger"
                        ? "bg-rose-100/70 border-rose-300 text-rose-950"
                        : r.severity === "warning"
                          ? "bg-amber-100/70 border-amber-300 text-amber-950"
                          : "bg-sky-100/70 border-sky-300 text-sky-950"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-white/70 text-[10px]">
                        {r.kode}
                      </span>
                      <span>{r.judul}</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-[11px] opacity-90">{r.deskripsi}</p>
                    <p className="mt-1.5 font-semibold text-[11px] pt-1 border-t border-black/5">
                      Tindak Lanjut: {r.tindakLanjut}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-gray-600 text-[11px]">
                  Tidak ada anomali atau risiko klinis terdeteksi pada parameter yang dimasukkan.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
