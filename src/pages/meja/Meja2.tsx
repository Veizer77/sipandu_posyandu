/**
 * SIPANDU - Meja 2: Pengukuran & Antropometri
 * Form adaptif per kategori + live Z-Score WHO + status klinis multi-kategori + deteksi risiko otomatis.
 * Layout full-width responsif & konsisten dengan alur 5 meja posyandu (PRD v3.0.0 Bab 9 & 34.4).
 *
 * PERBAIKAN AUDIT MEJA-2 (MEJA-2-AUDIT.md):
 * - M2-001: antrean HANYA sesi aktif (getVisitsForActiveSession).
 * - M2-002/M2-024: detail visit via findVisitForActiveSession; tanpa visit aktif -> blocked.
 * - M2-003: tanpa fallback jadwal[0], tanpa auto-create visit; updatePengukuran menerima kunjunganId.
 * - M2-005/M2-023: draft dihapus HANYA setelah save sukses; error -> draft utuh + tetap di halaman.
 * - M2-006: isSaving cegah double submit; unique pengukuran(kunjungan_id) di DB.
 * - M2-010: status_pertumbuhan default "data_baru" (bukan "naik").
 * - M2-012/M2-013: kategori kanonis; invalid -> blocked (bukan form Umum).
 * - M2-014/M2-015: validator domain + cross-field TD (sistolik > diastolik).
 * - M2-016/M2-017: baseline BB terbaru terurut + riwayat eksplisit (exclude visit aktif).
 * - M2-018: dependency risiko mencakup kunjunganAktif + kunjungan.
 * - M2-019: normalisasi imunisasi boundary ke string[].
 * - M2-020: key risiko stabil (di Meja2Panels).
 * - M2-021/M2-022: draft key berversi (sessionId+visitId); server lebih baru menang.
 * - M2-026: field kanonis lingkar_lengan / td_sistolik / td_diastolik / gula_darah_sewaktu.
 * - M2-028/M2-029/M2-030: antrean+panel diekstrak; Map memoized; effect depend visitId.
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Scale,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  User,
  Info,
  CalendarX2,
} from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { Meja2Antrean } from "@/components/meja/Meja2Antrean";
import { Meja2AnalysisCard, Meja2HistoryCard, Meja2RiskCard } from "@/components/meja/Meja2Panels";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import WHO_ENGINE, { deteksiRisiko } from "@/utils/zscoreCalculator";
import { adaImunisasiTertunggak } from "@/utils/jadwalImunisasi";
import { maskNik } from "@/lib/utils";
import { filterVisitsForMeja, isVisitPastMejaStage } from "@/lib/meja1Logic";
import { labelStatusAlur } from "@/lib/rekapLogic";
import {
  getVisitsForActiveSession,
  findVisitForActiveSession,
  resolveKategoriMeja2,
  validatePengukuran,
  getLatestWeightBefore,
  getHistoryForAnggota,
  normalizeImunisasiList,
  canonicalizePengukuranForm,
  buildDraftKey,
  packDraft,
  unpackDraft,
  pickDraftOrServer,
  type KategoriKanonis,
} from "@/lib/meja2Logic";

// Class constants for unified, premium form controls
const inputContainerCls = "relative";
const inputCls =
  "w-full pl-4 pr-14 py-3 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-semibold text-gray-900 text-sm outline-none transition shadow-xs";
const inputClsErr =
  "w-full pl-4 pr-14 py-3 bg-rose-50/60 hover:bg-rose-50/80 border border-rose-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 font-semibold text-gray-900 text-sm outline-none transition shadow-xs";
const inputUnitCls =
  "absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none select-none";
const labelCls = "block text-xs font-bold text-gray-700 mb-1.5";
const fieldErrCls = "text-[11px] text-rose-600 font-semibold mt-1";

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className={fieldErrCls}>{msg}</p>;
}

/** Layar blocked generik: sesi/kategori/visit tidak memenuhi syarat. */
function BlockedState({
  icon,
  title,
  desc,
  backTo,
  backLabel,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={2} />
      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
        <div className="mx-auto mb-3 w-fit">{icon}</div>
        <p className="text-sm font-bold text-gray-700">{title}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{desc}</p>
        <Link
          to={backTo}
          className="mt-4 inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export default function Meja2() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { data, activeSessionId, updatePengukuran } = useSipandu();

  // M2-029: memoized Maps — hindari lookup O(n²) berulang.
  const anggotaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.anggota || []).forEach((a: any) => m.set(a.id, a));
    return m;
  }, [data.anggota]);
  const keluargaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.keluarga || []).forEach((k: any) => m.set(k.id, k));
    return m;
  }, [data.keluarga]);

  const anggota = anggotaId ? anggotaById.get(anggotaId) : undefined;
  const sesiAktif = (data.jadwal || []).find((j: any) => j.id === activeSessionId) || null;
  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;

  // M2-001: antrean sesi aktif saja. F-05: hanya tahap Meja 2 (meja_1/meja_2);
  // visit selesai ATAU sudah melewati Meja 2 (meja_3+) tidak masuk antrean kerja.
  const sessionVisits = useMemo(
    () =>
      filterVisitsForMeja(
        getVisitsForActiveSession(data.kunjunganAktif, activeSessionId).filter(
          (k: any) => k?.status_alur !== "selesai"
        ),
        2
      ),
    [data.kunjunganAktif, activeSessionId]
  );

  // M2-002: visit detail terikat sesi aktif (bukan sekadar anggota).
  const allVisits = useMemo(
    () => [...(data.kunjunganAktif || []), ...(data.kunjungan || [])],
    [data.kunjunganAktif, data.kunjungan]
  );
  const activeVisit = anggotaId
    ? findVisitForActiveSession(data.kunjunganAktif, anggotaId, activeSessionId)
    : undefined;
  const sessionHistoryVisit = anggotaId
    ? findVisitForActiveSession(data.kunjungan, anggotaId, activeSessionId)
    : undefined;
  const activeVisitId = activeVisit?.id;
  const serverUpdatedAt =
    activeVisit?.updated_at || activeVisit?.pengukuran?.updated_at || activeVisit?.waktu_hadir || null;

  // M2-012/M2-013: kategori kanonis; invalid -> blocked.
  const kategoriRes = useMemo(
    () => (anggota ? resolveKategoriMeja2(anggota.kategori, anggota.jenis_kelamin) : null),
    [anggota]
  );
  const kategori: KategoriKanonis | null = kategoriRes?.valid ? kategoriRes.canonical : null;

  const isAnak = kategori === "bayi" || kategori === "balita";
  const isBumil = kategori === "ibu_hamil";
  const isLansia = kategori === "lansia";
  const isWus = kategori === "wus";

  // ---- Draft berversi (M2-021/M2-022) ----
  const draftParts =
    anggotaId && activeSessionId && activeVisitId
      ? { anggotaId, sessionId: activeSessionId, visitId: activeVisitId }
      : null;
  const draftKey = draftParts ? buildDraftKey(draftParts) : null;
  const loadedTargetRef = useRef<string | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);

  const [form, setForm] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  function readStoredDraft(): { form: Record<string, any> | null; savedAt: string | null } {
    if (!draftKey || !draftParts) return { form: null, savedAt: null };
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return { form: null, savedAt: null };
      const parsed = JSON.parse(raw);
      const f = unpackDraft(raw, draftParts);
      if (!f) return { form: null, savedAt: null };
      return { form: f, savedAt: typeof parsed?.savedAt === "string" ? parsed.savedAt : null };
    } catch {
      return { form: null, savedAt: null };
    }
  }

  // M2-030: sync HANYA saat ganti target (sesi/visit/anggota) atau data server tiba saat form bersih.
  useEffect(() => {
    if (!anggotaId || !draftParts || !draftKey || !activeVisit) return;
    const targetKey = `${draftParts.sessionId}:${draftParts.visitId}:${draftParts.anggotaId}`;

    const serverForm = canonicalizePengukuranForm(activeVisit.pengukuran);
    const serverHasData = Object.values(serverForm).some((v) => v !== undefined && v !== null && v !== "");

    if (loadedTargetRef.current !== targetKey) {
      loadedTargetRef.current = targetKey;
      isDirtyRef.current = false;
      setFieldErrors({});
      setSubmitError(null);

      const { form: draftForm, savedAt } = readStoredDraft();
      if (draftForm) {
        const winner = pickDraftOrServer(savedAt, serverUpdatedAt, serverHasData);
        if (winner === "server") {
          try {
            sessionStorage.removeItem(draftKey);
          } catch {}
          setForm(serverForm);
        } else {
          isDirtyRef.current = true;
          setForm(draftForm);
        }
      } else {
        setForm(serverForm);
      }
      return;
    }

    if (isDirtyRef.current) return;
    if (serverHasData) {
      setForm((prev: any) => (Object.keys(prev || {}).length === 0 ? serverForm : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anggotaId, activeVisitId, serverUpdatedAt]);

  const usiaInfo = anggota ? WHO_ENGINE.hitungUsia(anggota.tanggal_lahir) : null;
  // M2-016: baseline BB terbaru terurut waktu, exclude visit aktif.
  const lastWeight = anggota ? getLatestWeightBefore(allVisits, anggota.id, activeVisitId) : null;

  const keluarga = useMemo(() => {
    if (!anggota) return null;
    return keluargaById.get(anggota.keluarga_id) || null;
  }, [anggota, keluargaById]);

  // M2-017: riwayat eksplisit — semua sesi sebelumnya, dedup, terbaru, exclude visit aktif.
  const riwayatKunjungan = useMemo(() => {
    if (!anggota) return [];
    return getHistoryForAnggota(allVisits, anggota.id, activeVisitId, 3);
  }, [anggota, allVisits, activeVisitId]);

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

  // M2-019: himpunan imunisasi ternormalisasi (array/string/null/boolean aman).
  const imunisasiDiberikan = useMemo(() => {
    const diberikan = new Set<string>();
    allVisits.forEach((k: any) => {
      if (k?.anggota_id !== anggota?.id) return;
      normalizeImunisasiList(k?.pelayanan).forEach((j) => diberikan.add(j));
    });
    normalizeImunisasiList(null, (anggota as any)?.imunisasi).forEach((j) => diberikan.add(j));
    return diberikan;
  }, [allVisits, anggota]);

  // Deteksi Risiko Otomatis (M2-018: deps mencakup kedua array kunjungan).
  const risikoList = useMemo(() => {
    if (!anggota || !kategori) return [];
    const pengukuranInput: any = {
      ...form,
      statusPertumbuhan: analysis?.statusPertumbuhan,
      usiaMinggu: anggota.status_hamil ? WHO_ENGINE.hitungHPL(anggota.hpht)?.usiaMinggu ?? 0 : 0,
      jenis_kelamin: anggota.jenis_kelamin,
      prev_berat_badan: lastWeight,
    };
    const riwayatInput = {
      imunisasiTertunggak:
        isAnak && usiaInfo ? adaImunisasiTertunggak(usiaInfo.totalBulan, Array.from(imunisasiDiberikan)) : false,
    };
    // M2-012: engine selalu menerima kategori kanonis.
    return deteksiRisiko(kategori, pengukuranInput, riwayatInput);
  }, [anggota, kategori, analysis, form, usiaInfo, lastWeight, isAnak, imunisasiDiberikan]);

  // ---- Antrean (tanpa anggotaId) ----
  if (!anggota) {
    return (
      <Meja2Antrean
        sessionVisits={sessionVisits}
        anggotaById={anggotaById}
        keluargaById={keluargaById}
        activeSessionId={activeSessionId}
        sesiAktif={sesiAktif}
        multipleActive={multipleActive}
        rolePrefix={rolePrefix}
        jadwalUrl={jadwalUrl}
        onMulaiUkur={(id) => navigate(`${rolePrefix}/meja2/${id}`)}
      />
    );
  }

  // ---- Blocked states (M2-003/M2-013/M2-024) ----
  if (!activeSessionId || !sesiAktif) {
    return (
      <BlockedState
        icon={<CalendarX2 className="w-12 h-12 text-gray-300 mx-auto" />}
        title={multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
        desc="Pengukuran hanya dapat dilakukan pada sesi aktif. Buka/rapikan sesi di halaman Jadwal Posyandu."
        backTo={jadwalUrl}
        backLabel="Buka Jadwal Posyandu"
      />
    );
  }

  if (kategoriRes && !kategoriRes.valid) {
    return (
      <BlockedState
        icon={<User className="w-12 h-12 text-gray-300 mx-auto" />}
        title="Kategori Peserta Tidak Valid"
        desc={`${kategoriRes.reason || "Kategori tidak dikenal."} Perbaiki data peserta di Master Data; pengukuran diblokir agar tidak tercatat pada form yang salah.`}
        backTo={`${rolePrefix}/meja2`}
        backLabel="Kembali ke Antrean Meja 2"
      />
    );
  }

  if (!activeVisit) {
    const sudahSelesai = Boolean(sessionHistoryVisit);
    return (
      <BlockedState
        icon={
          sudahSelesai ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-amber-300 mx-auto" />
          )
        }
        title={sudahSelesai ? "Kunjungan Sesi Ini Sudah Selesai" : "Peserta Belum Terdaftar di Meja 1"}
        desc={
          sudahSelesai
            ? `${anggota.nama} sudah menyelesaikan alur pada sesi ini. Lihat rekapitulasi sesi untuk detailnya.`
            : `${anggota.nama} belum check-in pada sesi ini. Lakukan pendaftaran kehadiran di Meja 1 terlebih dahulu — kunjungan tidak dibuat otomatis dari Meja 2.`
        }
        backTo={sudahSelesai ? `${rolePrefix}/rekap` : `${rolePrefix}/meja1`}
        backLabel={sudahSelesai ? "Lihat Rekapitulasi" : "Buka Meja 1 Registrasi"}
      />
    );
  }

  // F-05: visit yang sudah melewati Meja 2 tidak bisa dibuka/diubah dari sini.
  // Koreksi via alur reopen resmi (Bidan/Admin); lihat Rekapitulasi.
  if (activeVisit && isVisitPastMejaStage(activeVisit, 2)) {
    return (
      <BlockedState
        icon={<CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto" />}
        title="Sudah Melewati Meja 2"
        desc={`${anggota.nama} sudah berada di tahap ${labelStatusAlur(activeVisit.status_alur)} pada sesi ini. Pengukuran tidak dapat diubah dari Meja 2.`}
        backTo={`${rolePrefix}/rekap`}
        backLabel="Lihat Rekapitulasi"
      />
    );
  }

  if (!kategori) {
    return (
      <BlockedState
        icon={<User className="w-12 h-12 text-gray-300 mx-auto" />}
        title="Kategori Peserta Tidak Valid"
        desc="Kategori peserta tidak dapat dipetakan ke form pengukuran."
        backTo={`${rolePrefix}/meja2`}
        backLabel="Kembali ke Antrean Meja 2"
      />
    );
  }

  const isUnderTwo = (usiaInfo?.totalBulan || 0) < 24;

  function set(field: string, value: string) {
    isDirtyRef.current = true;
    setSubmitError(null);
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      if (field === "td_sistolik" || field === "td_diastolik") {
        delete next.td_sistolik;
        delete next.td_diastolik;
      }
      return next;
    });
    setForm((f: any) => {
      const next = { ...f, [field]: value };
      if (draftKey && draftParts) {
        try {
          sessionStorage.setItem(draftKey, JSON.stringify(packDraft(draftParts, next)));
        } catch {}
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // M2-006: cegah double submit (state + ref).
    if (isSavingRef.current) return;

    // M2-014/M2-015: validator domain sebelum request.
    const validation = validatePengukuran(kategori as KategoriKanonis, form);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const msg = validation.firstError || "Periksa kembali isian form.";
      setSubmitError(msg);
      showToast(msg, "warning");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);

    const visit = activeVisit;
    if (!visit) {
      setSubmitError("Kunjungan sesi aktif tidak ditemukan. Kembali ke antrean.");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const visitId = visit.id;
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
        anggota_id: anggota.id,
        usia_saat_ukur: usiaInfo?.totalBulan ?? null,
        berat_badan: form.berat_badan ? parseFloat(form.berat_badan) : undefined,
        tinggi_badan: form.tinggi_badan ? parseFloat(form.tinggi_badan) : undefined,
        z_score_bbu: analysis?.z_bbu ?? null,
        z_score_tbu: analysis?.z_tbu ?? null,
        z_score_bbtb: analysis?.z_bbtb ?? null,
        status_gizi: analysis?.status_bbu?.label ?? (form.status_gizi || "Normal"),
        // M2-010: tanpa baseline -> "data_baru", JANGAN "naik".
        status_pertumbuhan: analysis?.statusPertumbuhan ?? "data_baru",
        risiko: risikoStructured,
      };
      // M2-003: kunjunganId tervalidasi sesi aktif.
      await updatePengukuran(anggota.id, payload, { kunjunganId: visitId });

      // M2-005: draft dihapus HANYA setelah save sukses.
      if (draftKey) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {}
      }
      isDirtyRef.current = false;
      showToast(`Pengukuran ${anggota.nama} tersimpan. Lanjut ke Meja 3.`, "success");
      navigate(`${rolePrefix}/meja3/${anggota.id}`);
    } catch (err: any) {
      // M2-023: error -> draft tetap ada, tetap di halaman, tombol pulih.
      const msg = err?.message || "Gagal menyimpan pengukuran. Draft Anda tetap tersimpan — coba lagi.";
      setSubmitError(msg);
      showToast(msg, "danger");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  const isSudahDiukur = Boolean(form.berat_badan || form.tinggi_badan);
  const tdInvalid = Boolean(fieldErrors.td_sistolik || fieldErrors.td_diastolik);

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
                  <span>KK: {keluarga.kepala_keluarga || keluarga.nama_kepala_keluarga} (RT {keluarga.rt || "-"})</span>
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

      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError} Draft tetap tersimpan di perangkat ini.</span>
        </div>
      )}

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
                {kategori === "umum" && "Pemeriksaan fisik umum masyarakat."}
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
                      className={fieldErrors.berat_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                  <FieldErr msg={fieldErrors.berat_badan} />
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
                      className={fieldErrors.tinggi_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_badan} />
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
                      className={fieldErrors.lingkar_kepala ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.lingkar_kepala} />
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
                      className={fieldErrors.lingkar_lengan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.lingkar_lengan} />
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      className={fieldErrors.berat_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                  <FieldErr msg={fieldErrors.berat_badan} />
                </div>
                <div>
                  <label className={labelCls}>Tinggi Badan (cm)</label>
                  <div className={inputContainerCls}>
                    <input
                      type="number"
                      step="0.1"
                      min="100"
                      max="200"
                      value={form.tinggi_badan || ""}
                      onChange={(e) => set("tinggi_badan", e.target.value)}
                      placeholder="Contoh: 155.5"
                      className={fieldErrors.tinggi_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_badan} />
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
                      className={fieldErrors.lingkar_lengan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.lingkar_lengan} />
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
                      className={tdInvalid ? inputClsErr : inputCls}
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
                      className={tdInvalid ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>
              {tdInvalid && <FieldErr msg={fieldErrors.td_sistolik || fieldErrors.td_diastolik} />}

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
                      className={fieldErrors.tinggi_fundus ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_fundus} />
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
                      className={fieldErrors.djj ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>bpm</span>
                  </div>
                  <FieldErr msg={fieldErrors.djj} />
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
                      className={fieldErrors.berat_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                  <FieldErr msg={fieldErrors.berat_badan} />
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
                      className={fieldErrors.tinggi_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_badan} />
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
                      className={tdInvalid ? inputClsErr : inputCls}
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
                      className={tdInvalid ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>
              {tdInvalid && <FieldErr msg={fieldErrors.td_sistolik || fieldErrors.td_diastolik} />}

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
                      className={fieldErrors.gula_darah_sewaktu ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>mg/dL</span>
                  </div>
                  <FieldErr msg={fieldErrors.gula_darah_sewaktu} />
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
                      className={fieldErrors.lingkar_perut ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.lingkar_perut} />
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
                      className={fieldErrors.berat_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                  <FieldErr msg={fieldErrors.berat_badan} />
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
                      className={fieldErrors.tinggi_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_badan} />
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
                    className={fieldErrors.lingkar_lengan ? inputClsErr : inputCls}
                  />
                  <span className={inputUnitCls}>cm</span>
                </div>
                <FieldErr msg={fieldErrors.lingkar_lengan} />
                <p className="text-[11px] text-gray-500 mt-1">
                  Ambang batas risiko KEK WUS pra-nikah / prakonsepsi adalah &lt; 23.5 cm.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields: Umum / Lainnya */}
          {kategori === "umum" && (
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
                      className={fieldErrors.berat_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>kg</span>
                  </div>
                  <FieldErr msg={fieldErrors.berat_badan} />
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
                      className={fieldErrors.tinggi_badan ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.tinggi_badan} />
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
                      className={tdInvalid ? inputClsErr : inputCls}
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
                      className={tdInvalid ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>mmHg</span>
                  </div>
                </div>
              </div>
              {tdInvalid && <FieldErr msg={fieldErrors.td_sistolik || fieldErrors.td_diastolik} />}

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
                      className={fieldErrors.gula_darah_sewaktu ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>mg/dL</span>
                  </div>
                  <FieldErr msg={fieldErrors.gula_darah_sewaktu} />
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
                      className={fieldErrors.lingkar_perut ? inputClsErr : inputCls}
                    />
                    <span className={inputUnitCls}>cm</span>
                  </div>
                  <FieldErr msg={fieldErrors.lingkar_perut} />
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
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              <span>{isSaving ? "Menyimpan…" : "Simpan & Lanjut Meja 3"}</span>
              {!isSaving && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {/* Right Column: Live Analysis, Riwayat & Deteksi Risiko (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Meja2AnalysisCard
            isAnak={isAnak}
            isBumil={isBumil}
            analysis={analysis}
            bumilAnalysis={bumilAnalysis}
            imt={imt}
            tensiAnalysis={tensiAnalysis}
            gdsAnalysis={gdsAnalysis}
            form={form}
            lastWeight={lastWeight}
          />
          <Meja2HistoryCard riwayat={riwayatKunjungan} />
          <Meja2RiskCard risikoList={risikoList} visitId={activeVisit.id} />
        </div>
      </div>
    </div>
  );
}
