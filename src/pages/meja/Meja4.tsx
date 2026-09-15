/**
 * SIPANDU - Meja 4: Pelayanan Kesehatan & Imunisasi
 *
 * PERBAIKAN AUDIT MEJA-4 (MEJA-4-AUDIT.md):
 * - M4-001/M4-015: selector kanonis getAllSessionVisits + resolveMeja4Visit.
 * - M4-002: 0 sesi = blocked; >1 = configuration error.
 * - M4-004/M4-005/M4-011/M4-012: validator domain (min satu layanan, rujukan, TT, panjang).
 * - M4-009: badge via hasAnyPelayanan (di antrean).
 * - M4-014: auto Vitamin A terhidrasi per visit tanpa menimpa dirty.
 * - M4-016: imunisasi/TT hanya Bidan/Admin (Kader read-only + gate server).
 * - M4-019/M4-020: draft berversi + konflik versi dengan tawaran reload.
 * - M4-021/M4-023: selesai hanya pasca-semua mutation (di service).
 * - M4-028: antrean + form per kategori diekstrak (Meja4Antrean, Meja4Forms).
 */
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CalendarX2, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { MejaStepper } from "@/components/meja/MejaShared";
import { Meja4Antrean } from "@/components/meja/Meja4Antrean";
import {
  BalitaForm,
  BumilForm,
  LansiaForm,
  WusForm,
  UmumForm,
  RujukanForm,
  type FormSectionProps,
} from "@/components/meja/Meja4Forms";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { getAllSessionVisits, isVisitPastMejaStage } from "@/lib/meja1Logic";
import { labelStatusAlur } from "@/lib/rekapLogic";
import { visitHasPengukuran } from "@/lib/meja2Logic";
import { pickDraftOrServer } from "@/lib/meja2Logic";
import {
  validatePelayanan,
  toPelayananFormFields,
  hasAnyPelayanan,
  resolveMeja4Visit,
  canGiveImunisasi,
  isBulanVitaminA,
  buildDraftKeyM4,
  packDraftM4,
  unpackDraftM4,
  type PelayananNormalized,
} from "@/lib/meja4Logic";
import { isVersionConflict } from "@/lib/meja3Logic";

const EMPTY_FORM: PelayananNormalized = {
  vitamin_a: false,
  pmt: false,
  pmt_jenis: null,
  imunisasi: [],
  tablet_fe: false,
  imunisasi_tt_ke: null,
  rujukan: false,
  tujuan_rujukan: "",
  alasan_rujukan: "",
  konseling: false,
  obat_rutin: "",
  skrining_anemia: false,
};

export default function Meja4() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { data, activeSessionId, updatePelayanan } = useSipandu();

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;

  const anggota = useMemo(
    () => (data.anggota || []).find((a: any) => a.id === anggotaId),
    [data.anggota, anggotaId]
  );

  // M4-001/M4-015: resolusi dari daftar sesi kanonis (merged active + history).
  const sessionVisits = useMemo(
    () => getAllSessionVisits(data.kunjunganAktif, data.kunjungan, activeSessionId),
    [data.kunjunganAktif, data.kunjungan, activeSessionId]
  );
  const visitState = useMemo(
    () => (anggotaId ? resolveMeja4Visit(sessionVisits, anggotaId) : { kind: "none" as const, visit: undefined }),
    [sessionVisits, anggotaId]
  );
  const activeVisit = visitState.kind === "active" ? visitState.visit : undefined;
  const activeVisitId = activeVisit?.id;
  const hasUkur = visitHasPengukuran(activeVisit);

  const serverForm = useMemo(() => toPelayananFormFields(activeVisit?.pelayanan), [activeVisit]);
  const serverUpdatedAt = serverForm.updated_at || null;
  const serverHasService = hasAnyPelayanan(serverForm);
  const serverVitaminA = serverForm.vitamin_a;

  const canGiveImun = canGiveImunisasi(currentRole);
  // Selaras store isLockedFromKader: valid terkunci kecuali Bidan/Super Admin.
  const isLocked = activeVisit?.status_verifikasi === "valid" && currentRole !== "bidan" && currentRole !== "super_admin";

  // PRD F-07: Vitamin A nasional Februari (1) & Agustus (7).
  const monthIdx = new Date().getMonth();
  const isVitABulan = isBulanVitaminA(monthIdx);
  const vitAPesan = isVitABulan
    ? "Bulan ini wajib (Februari & Agustus)"
    : "Di luar jadwal nasional (Feb & Agu)";

  const isDirtyRef = useRef(false);
  const loadedTargetRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  const [form, setForm] = useState<PelayananNormalized>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ serverUpdatedAt: string | null } | null>(null);

  const draftParts =
    anggotaId && activeSessionId && activeVisitId
      ? { anggotaId, sessionId: activeSessionId, visitId: activeVisitId }
      : null;
  const draftKey = draftParts ? buildDraftKeyM4(draftParts) : null;

  function readStoredDraft(): { form: PelayananNormalized | null; savedAt: string | null } {
    if (!draftKey || !draftParts) return { form: null, savedAt: null };
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return { form: null, savedAt: null };
      const parsed = JSON.parse(raw);
      const f = unpackDraftM4(raw, draftParts);
      if (!f) return { form: null, savedAt: null };
      return { form: f, savedAt: typeof parsed?.savedAt === "string" ? parsed.savedAt : null };
    } catch {
      return { form: null, savedAt: null };
    }
  }

  function applyServerToForm() {
    setForm({
      vitamin_a: serverForm.vitamin_a,
      pmt: serverForm.pmt,
      pmt_jenis: serverForm.pmt_jenis,
      imunisasi: [...serverForm.imunisasi],
      tablet_fe: serverForm.tablet_fe,
      imunisasi_tt_ke: serverForm.imunisasi_tt_ke,
      rujukan: serverForm.rujukan,
      tujuan_rujukan: serverForm.tujuan_rujukan,
      alasan_rujukan: serverForm.alasan_rujukan,
      konseling: serverForm.konseling,
      obat_rutin: serverForm.obat_rutin,
      skrining_anemia: serverForm.skrining_anemia,
    });
    setExpectedUpdatedAt(serverUpdatedAt);
  }

  function persistDraft(next: PelayananNormalized) {
    if (!draftKey || !draftParts) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(packDraftM4(draftParts, next)));
    } catch {}
  }

  // Sync target + polling aman (M4-019/M4-020).
  useEffect(() => {
    if (!anggotaId || !activeVisit) return;
    const targetKey = `${activeSessionId}:${activeVisit.id}:${anggotaId}`;

    if (loadedTargetRef.current !== targetKey) {
      loadedTargetRef.current = targetKey;
      isDirtyRef.current = false;
      setIsDirty(false);
      setFieldErrors({});
      setSubmitError(null);
      setConflict(null);

      const { form: draftForm, savedAt } = readStoredDraft();
      if (draftForm) {
        const winner = pickDraftOrServer(savedAt, serverUpdatedAt, serverHasService);
        if (winner === "server") {
          try {
            if (draftKey) sessionStorage.removeItem(draftKey);
          } catch {}
          applyServerToForm();
        } else {
          isDirtyRef.current = true;
          setIsDirty(true);
          setForm(draftForm);
          setExpectedUpdatedAt(serverUpdatedAt);
        }
      } else {
        applyServerToForm();
      }
      return;
    }

    if (isDirtyRef.current) {
      if (isVersionConflict(expectedUpdatedAt, serverUpdatedAt, serverHasService)) {
        setConflict({ serverUpdatedAt });
      }
      return;
    }
    if (serverHasService || serverUpdatedAt !== expectedUpdatedAt) {
      applyServerToForm();
      setConflict(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anggotaId, activeVisitId, serverUpdatedAt]);

  // M4-014: auto Vitamin A per visit; tidak pernah menimpa form dirty.
  useEffect(() => {
    if (!activeVisit || !isVitABulan || isDirtyRef.current || serverVitaminA) return;
    setForm((f) => (f.vitamin_a ? f : { ...f, vitamin_a: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVisitId, isVitABulan, serverVitaminA]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function updateForm(patch: Partial<PelayananNormalized>) {
    isDirtyRef.current = true;
    setIsDirty(true);
    setConflict(null);
    setSubmitError(null);
    setFieldErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      delete next._form;
      return next;
    });
    setForm((f) => {
      const next = { ...f, ...patch };
      persistDraft(next);
      return next;
    });
  }

  function reloadFromServer() {
    if (draftKey) {
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
    }
    isDirtyRef.current = false;
    setIsDirty(false);
    setConflict(null);
    setSubmitError(null);
    applyServerToForm();
    showToast("Form dimuat ulang dari data server terbaru.", "info");
  }

  if (!anggota) {
    return <Meja4Antrean data={data} navigate={navigate} />;
  }

  if (!activeSessionId) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={4} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {multipleActive
              ? "Tutup/akhiri sesi ganda di halaman Jadwal Posyandu agar data tidak tercampur."
              : "Pelayanan hanya pada sesi aktif."}
          </p>
          <Link to={jadwalUrl} className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">
            Buka Jadwal Posyandu
          </Link>
        </div>
      </div>
    );
  }

  if (visitState.kind !== "active" || !activeVisit) {
    const sudahSelesai = visitState.kind === "finished";
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={4} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {sudahSelesai ? "Kunjungan Sesi Ini Sudah Selesai" : "Peserta Belum Terdaftar di Meja 1"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {sudahSelesai
              ? `${anggota.nama} sudah menyelesaikan alur pada sesi ini.`
              : `${anggota.nama} belum check-in pada sesi ini. Lakukan pendaftaran di Meja 1 dulu.`}
          </p>
          <Link
            to={sudahSelesai ? `${rolePrefix}/rekap` : `${rolePrefix}/meja1`}
            className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
          >
            {sudahSelesai ? "Lihat Rekapitulasi" : "Buka Meja 1 Registrasi"}
          </Link>
        </div>
      </div>
    );
  }

  // F-05: visit yang sudah melewati Meja 4 tidak bisa dibuka/diubah dari sini.
  // Koreksi via alur reopen resmi (Bidan/Admin); lihat Rekapitulasi.
  if (activeVisit && isVisitPastMejaStage(activeVisit, 4)) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={4} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Sudah Melewati Meja 4</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {anggota.nama} sudah berada di tahap {labelStatusAlur(activeVisit.status_alur)} pada sesi ini. Pelayanan tidak dapat diubah dari Meja 4.
          </p>
          <Link
            to={`${rolePrefix}/rekap`}
            className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
          >
            Lihat Rekapitulasi
          </Link>
        </div>
      </div>
    );
  }

  // Guard alur: Meja 4 wajib didahului pengukuran Meja 2 pada kunjungan yang sama.
  if (!hasUkur) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={4} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Belum Ada Pengukuran Meja 2</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {anggota.nama} belum tercatat pengukurannya pada sesi ini. Selesaikan pengukuran di Meja 2 terlebih dahulu — pelayanan tidak dapat mendahului pengukuran.
          </p>
          <Link
            to={`${rolePrefix}/meja2/${anggota.id}`}
            className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
          >
            Ke Meja 2 Pengukuran
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingRef.current || isLocked) return;

    // M4-004/M4-005/M4-011/M4-012: validator domain sebelum request.
    const validation = validatePelayanan(form);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const msg = validation.firstError || "Periksa kembali isian form.";
      setSubmitError(msg);
      showToast(msg, "warning");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const visitId = activeVisit.id;
      const res = await updatePelayanan(anggota.id, validation.value, {
        kunjunganId: visitId,
        expectedUpdatedAt,
      });
      // Draft dihapus HANYA setelah semua persistence sukses (M4-020).
      if (draftKey) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {}
      }
      isDirtyRef.current = false;
      setIsDirty(false);
      setConflict(null);
      const imunNote = res.imunisasiDisimpan ? ` (${res.imunisasiDisimpan} imunisasi dicatat)` : "";
      showToast(`Pelayanan Meja 4 tersimpan${imunNote}. Sesi pelayanan selesai untuk peserta.`, "success");
      navigate(`${rolePrefix}/rekap`);
    } catch (err: any) {
      if (err?.conflict) {
        setConflict({ serverUpdatedAt: err.serverUpdatedAt ?? null });
        const msg = `${err?.message || "Data berubah oleh petugas lain."} Draft Anda tetap tersimpan.`;
        setSubmitError(msg);
        showToast(msg, "warning");
      } else {
        const msg = err?.message || "Gagal menyimpan pelayanan. Draft tetap tersimpan — coba lagi.";
        setSubmitError(msg);
        showToast(msg, "danger");
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  const kat = anggota.kategori;
  const isAnak = kat === "bayi" || kat === "balita";
  const isBumil = kat === "ibu_hamil" || kat === "bumil";
  const isLansia = kat === "lansia";
  const isWus = kat === "wus";
  const knownKat = isAnak || isBumil || isLansia || isWus || kat === "umum";

  const disabled = isLocked || isSaving;
  const sectionProps: FormSectionProps = {
    form,
    updateForm,
    disabled,
    canGiveImunisasi: canGiveImun,
    isVitABulan,
    vitAPesan,
    fieldErrors,
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={4} />

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <span className="text-xs font-semibold text-amber-700 uppercase">Meja 4: Pelayanan Kesehatan & Imunisasi</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">{anggota.nama}</h2>
          <p className="text-xs text-gray-500">Vitamin A, PMT, Imunisasi dasar, Tablet Fe, dan Rujukan Puskesmas.</p>
        </div>

        {isLocked && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl px-4 py-3 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Kunjungan ini sudah tervalidasi Bidan dan terkunci. Minta Bidan/Admin untuk membuka kunci bila perlu koreksi.</span>
          </div>
        )}

        {!canGiveImun && (
          <div className="mb-4 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-xl px-4 py-3">
            Mode Kader: Anda boleh mencatat rujukan dan layanan lain, tetapi pemberian imunisasi (termasuk TT) hanya oleh Bidan/Admin.
          </div>
        )}

        {conflict && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <span className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Pelayanan di server berubah oleh petugas lain. Draft Anda tetap tersimpan — muat ulang untuk versi terbaru.</span>
            </span>
            <button
              type="button"
              onClick={reloadFromServer}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Muat ulang dari server
            </button>
          </div>
        )}

        {submitError && !conflict && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl px-4 py-3">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isAnak && <BalitaForm {...sectionProps} />}
          {isBumil && <BumilForm {...sectionProps} />}
          {isLansia && <LansiaForm {...sectionProps} />}
          {isWus && <WusForm {...sectionProps} />}
          {!knownKat && <UmumForm {...sectionProps} />}
          {kat === "umum" && <UmumForm {...sectionProps} />}

          <RujukanForm {...sectionProps} />

          {fieldErrors._form && (
            <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors._form}</p>
          )}

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-100">
            <Link to={`${rolePrefix}/meja4`} className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
              ← Kembali ke Antrean Meja 4
            </Link>
            <button
              type="submit"
              disabled={disabled}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition"
            >
              {isSaving ? "Menyimpan…" : "Selesaikan Pelayanan & Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
