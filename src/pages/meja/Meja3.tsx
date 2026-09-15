/**
 * SIPANDU - Meja 3: Pencatatan Digital
 * Dilengkapi Antrean Meja 3 Mandiri & Form Pencatatan Adaptif
 *
 * PERBAIKAN AUDIT MEJA-3 (MEJA-3-AUDIT.md):
 * - M3-001/M3-014: selector kanonis getAllSessionVisits (active+history, dedup) di antrean & detail.
 * - M3-002: 0 sesi = blocked; >1 sesi = configuration error (bukan pilih diam-diam).
 * - M3-008/M3-009: "sudah dicatat" mencakup 4 field; counter single-source dari list.
 * - M3-010: catatan_bidan read-only untuk Kader (+ note); service menolak bila dilanggar.
 * - M3-011: validator domain bersama (trim, maks 500, payload kosong ditolak).
 * - M3-012: draft session-aware berversi; hapus hanya setelah sukses.
 * - M3-013/M3-015: polling tak menimpa dirty; konflik versi tawarkan reload.
 * - M3-016: audit memakai kunjunganId (di store).
 * - M3-017: memoized Map anggota.
 */
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  NotebookPen,
  CheckCircle2,
  CalendarX2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { getAllSessionVisits, filterVisitsForMeja, isVisitPastMejaStage } from "@/lib/meja1Logic";
import { labelStatusAlur } from "@/lib/rekapLogic";
import { pickDraftOrServer, visitHasPengukuran } from "@/lib/meja2Logic";
import {
  CATATAN_MAX_LEN,
  validatePencatatan,
  catatanHasContent,
  toCatatanFormFields,
  resolveMeja3Visit,
  buildDraftKeyM3,
  packDraftM3,
  unpackDraftM3,
  isVersionConflict,
} from "@/lib/meja3Logic";
import { maskNik } from "@/lib/utils";

function SessionBlocked({
  meja,
  multipleActive,
  jadwalUrl,
}: {
  meja: number;
  multipleActive: boolean;
  jadwalUrl: string;
}) {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={meja} />
      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
        <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-700">
          {multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          {multipleActive
            ? "Tutup/akhiri sesi ganda di halaman Jadwal Posyandu agar data tidak tercampur."
            : "Buka sesi hari H di halaman Jadwal Posyandu terlebih dahulu."}
        </p>
        <Link
          to={jadwalUrl}
          className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
        >
          Buka Jadwal Posyandu
        </Link>
      </div>
    </div>
  );
}

function AntreanMeja3({ data, navigate }: { data: any; navigate: any }) {
  const { currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { activeSessionId } = useSipandu();

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;

  // M3-001: selector kanonis sesi (active + history, dedup). Hanya yang sudah diukur.
  // F-05: hanya tahap Meja 3 (meja_2/meja_3); visit selesai ATAU sudah melewati
  // Meja 3 (meja_4+) tidak masuk antrean kerja (tetap tampil di Rekap via selector penuh).
  const sessionVisits = useMemo(
    () =>
      filterVisitsForMeja(
        getAllSessionVisits(data.kunjunganAktif, data.kunjungan, activeSessionId).filter(
          (k: any) => k?.status_alur !== "selesai"
        ),
        3
      ),
    [data.kunjunganAktif, data.kunjungan, activeSessionId]
  );
  // M3-017: memoized Map — hindari find O(n) per baris.
  const anggotaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.anggota || []).forEach((a: any) => m.set(a.id, a));
    return m;
  }, [data.anggota]);

  const list = useMemo(
    () => sessionVisits.filter((k: any) => visitHasPengukuran(k)),
    [sessionVisits]
  );
  // M3-008/M3-009: single source of truth dari list.
  const sudahCatat = useMemo(() => list.filter((k: any) => catatanHasContent(k.catatan)).length, [list]);
  const siapCatat = list.length - sudahCatat;

  if (!activeSessionId) {
    return <SessionBlocked meja={3} multipleActive={multipleActive} jadwalUrl={jadwalUrl} />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={3} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /> Antrean Meja 3
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 3: Pencatatan Digital (KMS & Riwayat)</h1>
          <p className="text-xs text-gray-500">Pilih peserta yang telah diukur di Meja 2 untuk mencatat keluhan, temuan kader, dan status kesehatan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <span className="text-[10px] text-purple-700 font-bold uppercase">Sudah Dicatat</span>
            <p className="text-lg font-bold text-purple-800 leading-none mt-0.5">{sudahCatat}</p>
          </div>
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] text-blue-700 font-bold uppercase">Siap Dicatat</span>
            <p className="text-lg font-bold text-blue-800 leading-none mt-0.5">{siapCatat}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <NotebookPen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Peserta Siap di Meja 3</p>
            <p className="text-xs text-gray-400 mt-1">Selesaikan pengukuran peserta di Meja 2 terlebih dahulu agar muncul di sini.</p>
            <Link to={`${rolePrefix}/meja2`} className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold">
              Buka Meja 2 Pengukuran
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((k: any) => {
              const a = anggotaById.get(k.anggota_id);
              if (!a) return null;
              const p = k.pengukuran;
              const c = k.catatan;
              const isFinished = k.status_alur === "selesai";
              const hasNotes = catatanHasContent(c);

              return (
                <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                  <div className="flex items-center gap-3.5">
                    <Avatar nama={a.nama} className="w-11 h-11 rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {isFinished ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        ) : hasNotes ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Dicatat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full animate-pulse">
                            Siap Dicatat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        NIK: {maskNik(a.nik)}
                        {p && (p.berat_badan || p.tinggi_badan) ? (
                          <>
                            {" · Hasil Meja 2: "}
                            {`BB ${p.berat_badan || "—"} kg · TB ${p.tinggi_badan || "—"} cm `}
                            {(p.lingkar_lengan ?? p.lingkar_lengan_atas) && `· LILA ${p.lingkar_lengan ?? p.lingkar_lengan_atas} cm `}
                            {(p.td_sistolik ?? p.tekanan_darah_sistol) && `· Tensi ${p.td_sistolik ?? p.tekanan_darah_sistol}/${p.td_diastolik ?? p.tekanan_darah_diastol} `}
                            <span className="font-semibold text-emerald-600">({p.status_gizi || p.status_kehamilan || p.status_risiko || "Selesai"})</span>
                          </>
                        ) : " · Belum melakukan pengukuran antropometri di Meja 2"}
                      </p>
                      {hasNotes && c.keluhan && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">Keluhan: "{c.keluhan}"</p>
                      )}
                    </div>
                  </div>

                  {!isFinished && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`${rolePrefix}/meja3/${a.id}`)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 ${
                          hasNotes
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        <NotebookPen className="w-4 h-4" />
                        <span>{hasNotes ? "Edit Catatan" : "Mulai Catat"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Meja3() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { data, activeSessionId, updatePencatatan } = useSipandu();

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;

  const anggota = useMemo(
    () => (data.anggota || []).find((a: any) => a.id === anggotaId),
    [data.anggota, anggotaId]
  );

  // M3-001/M3-014: resolusi dari daftar sesi kanonis (merged active + history).
  const sessionVisits = useMemo(
    () => getAllSessionVisits(data.kunjunganAktif, data.kunjungan, activeSessionId),
    [data.kunjunganAktif, data.kunjungan, activeSessionId]
  );
  const visitState = useMemo(
    () => (anggotaId ? resolveMeja3Visit(sessionVisits, anggotaId) : { kind: "none" as const, visit: undefined }),
    [sessionVisits, anggotaId]
  );
  const activeVisit = visitState.kind === "active" ? visitState.visit : undefined;
  const activeVisitId = activeVisit?.id;
  const hasUkur = visitHasPengukuran(activeVisit);

  // Server truth untuk form + versi concurrency (M3-015).
  const serverFields = useMemo(() => toCatatanFormFields(activeVisit?.catatan), [activeVisit]);
  const serverUpdatedAt = serverFields.updated_at || null;
  const serverHasContent = catatanHasContent(serverFields);

  // M3-010: peran yang boleh mengunci/membuka & mengisi catatan_bidan.
  const canWriteBidan = currentRole === "bidan" || currentRole === "super_admin";
  const isKader = currentRole === "kader";
  const isLocked = activeVisit?.status_verifikasi === "valid" && !canWriteBidan;

  const isDirtyRef = useRef(false);
  const loadedTargetRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  const [keluhan, setKeluhan] = useState("");
  const [catatanKader, setCatatanKader] = useState("");
  const [catatanBidan, setCatatanBidan] = useState("");
  const [temuan, setTemuan] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  // M3-015: versi yang dibaca saat form dimuat + flag konflik.
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ serverUpdatedAt: string | null } | null>(null);

  const draftParts =
    anggotaId && activeSessionId && activeVisitId
      ? { anggotaId, sessionId: activeSessionId, visitId: activeVisitId }
      : null;
  const draftKey = draftParts ? buildDraftKeyM3(draftParts) : null;

  function readStoredDraft(): { form: { keluhan: string; temuan: string; catatan_kader: string; catatan_bidan: string } | null; savedAt: string | null } {
    if (!draftKey || !draftParts) return { form: null, savedAt: null };
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return { form: null, savedAt: null };
      const parsed = JSON.parse(raw);
      const f = unpackDraftM3(raw, draftParts);
      if (!f) return { form: null, savedAt: null };
      return { form: f, savedAt: typeof parsed?.savedAt === "string" ? parsed.savedAt : null };
    } catch {
      return { form: null, savedAt: null };
    }
  }

  function applyServerToForm() {
    setKeluhan(serverFields.keluhan);
    setCatatanKader(serverFields.catatan_kader);
    setCatatanBidan(serverFields.catatan_bidan);
    setTemuan(serverFields.temuan);
    setExpectedUpdatedAt(serverUpdatedAt);
  }

  function persistDraft(next: { keluhan: string; temuan: string; catatan_kader: string; catatan_bidan: string }) {
    if (!draftKey || !draftParts) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(packDraftM3(draftParts, next)));
    } catch {}
  }

  // M3-012/M3-013: sync target baru & polling aman (dirty tak tertimpa; konflik ditawarkan reload).
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
        const winner = pickDraftOrServer(savedAt, serverUpdatedAt, serverHasContent);
        if (winner === "server") {
          try {
            if (draftKey) sessionStorage.removeItem(draftKey);
          } catch {}
          applyServerToForm();
        } else {
          // Draft lebih baru dari server → pakai draft; versi ekspektasi = versi server kini.
          // Konflik (server berubah setelah draft) terdeteksi oleh polling di bawah.
          isDirtyRef.current = true;
          setIsDirty(true);
          setKeluhan(draftForm.keluhan);
          setCatatanKader(draftForm.catatan_kader);
          setCatatanBidan(draftForm.catatan_bidan);
          setTemuan(draftForm.temuan);
          setExpectedUpdatedAt(serverUpdatedAt);
        }
      } else {
        applyServerToForm();
      }
      return;
    }

    if (isDirtyRef.current) {
      // Polling saat dirty: jangan timpa; deteksi konflik untuk ditawarkan reload.
      if (isVersionConflict(expectedUpdatedAt, serverUpdatedAt, serverHasContent)) {
        setConflict({ serverUpdatedAt });
      }
      return;
    }
    // Bersih + server berubah (mis. baru tersimpan di tab lain) → ikuti server.
    if (serverHasContent || serverUpdatedAt !== expectedUpdatedAt) {
      applyServerToForm();
      setConflict(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anggotaId, activeVisitId, serverUpdatedAt]);

  // Fase 4.4: peringatan unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function onField(
    field: "keluhan" | "temuan" | "catatan_kader" | "catatan_bidan",
    value: string,
    setter: (v: string) => void
  ) {
    isDirtyRef.current = true;
    setIsDirty(true);
    setConflict(null);
    setSubmitError(null);
    setFieldErrors((prev) => {
      if (!prev[field] && !prev._form) return prev;
      const next = { ...prev };
      delete next[field];
      delete next._form;
      return next;
    });
    setter(value);
    persistDraft({
      keluhan: field === "keluhan" ? value : keluhan,
      temuan: field === "temuan" ? value : temuan,
      catatan_kader: field === "catatan_kader" ? value : catatanKader,
      catatan_bidan: field === "catatan_bidan" ? value : catatanBidan,
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
    return <AntreanMeja3 data={data} navigate={navigate} />;
  }

  if (!activeSessionId) {
    return <SessionBlocked meja={3} multipleActive={multipleActive} jadwalUrl={jadwalUrl} />;
  }

  if (visitState.kind !== "active" || !activeVisit) {
    const sudahSelesai = visitState.kind === "finished";
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={3} />
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
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
          >
            {sudahSelesai ? "Lihat Rekapitulasi" : "Buka Meja 1 Registrasi"}
          </Link>
        </div>
      </div>
    );
  }

  // F-05: visit yang sudah melewati Meja 3 tidak bisa dibuka/diubah dari sini.
  // Koreksi via alur reopen resmi (Bidan/Admin); lihat Rekapitulasi.
  if (activeVisit && isVisitPastMejaStage(activeVisit, 3)) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={3} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Sudah Melewati Meja 3</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {anggota.nama} sudah berada di tahap {labelStatusAlur(activeVisit.status_alur)} pada sesi ini. Pencatatan tidak dapat diubah dari Meja 3.
          </p>
          <Link
            to={`${rolePrefix}/rekap`}
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
          >
            Lihat Rekapitulasi
          </Link>
        </div>
      </div>
    );
  }

  // Guard alur: Meja 3 wajib didahului pengukuran Meja 2 pada kunjungan yang sama.
  if (!hasUkur) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={3} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Belum Ada Pengukuran Meja 2</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {anggota.nama} belum tercatat pengukurannya pada sesi ini. Selesaikan pengukuran di Meja 2 terlebih dahulu — pencatatan tidak dapat mendahului pengukuran.
          </p>
          <Link
            to={`${rolePrefix}/meja2/${anggota.id}`}
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
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

    // M3-011: validator domain sebelum request.
    const validation = validatePencatatan({
      keluhan,
      temuan,
      catatan_kader: catatanKader,
      catatan_bidan: catatanBidan,
    });
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
      // M3-015: expected version ikut terkirim; konflik → banner reload, tetap di halaman.
      await updatePencatatan(anggota.id, validation.value, {
        kunjunganId: activeVisit.id,
        expectedUpdatedAt,
      });
      // M3-012: draft dihapus HANYA setelah save sukses.
      if (draftKey) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {}
      }
      isDirtyRef.current = false;
      setIsDirty(false);
      setConflict(null);
      showToast("Pencatatan Meja 3 tersimpan. Lanjut ke Meja 4.", "success");
      navigate(`${rolePrefix}/meja4/${anggota.id}`);
    } catch (err: any) {
      if (err?.conflict) {
        setConflict({ serverUpdatedAt: err.serverUpdatedAt ?? null });
        const msg = `${err?.message || "Data berubah oleh petugas lain."} Draft Anda tetap tersimpan.`;
        setSubmitError(msg);
        showToast(msg, "warning");
      } else {
        const msg = err?.message || "Gagal menyimpan catatan. Draft tetap tersimpan — coba lagi.";
        setSubmitError(msg);
        showToast(msg, "danger");
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  const p = activeVisit?.pengukuran || {};
  const disabled = isLocked || isSaving;
  const fieldErr = (f: string) =>
    fieldErrors[f] ? <p className="text-[11px] text-rose-600 font-semibold mt-1">{fieldErrors[f]}</p> : null;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={3} />

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-semibold text-purple-700 uppercase">Meja 3: Pencatatan Digital</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">{anggota.nama}</h2>
          <p className="text-xs text-gray-500">Data identitas & pengukuran otomatis ditarik dari Meja 1 dan Meja 2.</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-400">Kategori:</span>
            <p className="font-bold text-gray-800 mt-0.5"><CategoryBadge kategori={anggota.kategori} /></p>
          </div>
          <div>
            <span className="text-gray-400">Berat Badan:</span>
            <p className="font-bold text-gray-800">{p.berat_badan || "—"} kg</p>
          </div>
          <div>
            <span className="text-gray-400">Tinggi Badan:</span>
            <p className="font-bold text-gray-800">{p.tinggi_badan || p.panjang_badan || "—"} cm</p>
          </div>
          {(p.lingkar_lengan ?? p.lingkar_lengan_atas) && (
            <div>
              <span className="text-gray-400">LILA:</span>
              <p className="font-bold text-gray-800">{p.lingkar_lengan ?? p.lingkar_lengan_atas} cm</p>
            </div>
          )}
          {(p.td_sistolik ?? p.tekanan_darah_sistol) && (
            <div>
              <span className="text-gray-400">Tensi:</span>
              <p className="font-bold text-gray-800">{p.td_sistolik ?? p.tekanan_darah_sistol}/{p.td_diastolik ?? p.tekanan_darah_diastol}</p>
            </div>
          )}
          <div>
            <span className="text-gray-400">Status Gizi:</span>
            <p className="font-bold text-green-700">{p.status_gizi || p.status_kehamilan || "—"}</p>
          </div>
        </div>

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl px-4 py-3 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Kunjungan ini sudah tervalidasi Bidan dan terkunci. Minta Bidan/Admin untuk membuka kunci bila perlu koreksi.</span>
          </div>
        )}

        {conflict && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <span className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Catatan di server berubah oleh petugas lain. Draft Anda tetap tersimpan — muat ulang untuk melihat versi terbaru (draft akan diganti).</span>
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
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl px-4 py-3">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Keluhan Utama Peserta / Orang Tua</label>
            <textarea
              rows={2}
              value={keluhan}
              maxLength={CATATAN_MAX_LEN + 50}
              disabled={disabled}
              onChange={(e) => onField("keluhan", e.target.value, setKeluhan)}
              placeholder="Misal: anak batuk pilek 3 hari, panas turun naik. Kosongkan bila tidak ada keluhan."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none disabled:opacity-60"
            />
            {fieldErr("keluhan")}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Temuan Pemeriksaan Kader</label>
            <textarea
              rows={2}
              value={temuan}
              maxLength={CATATAN_MAX_LEN + 50}
              disabled={disabled}
              onChange={(e) => onField("temuan", e.target.value, setTemuan)}
              placeholder="Misal: tampak lesu, tidak ada ruam."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none disabled:opacity-60"
            />
            {fieldErr("temuan")}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Catatan Kader</label>
            <textarea
              rows={2}
              value={catatanKader}
              maxLength={CATATAN_MAX_LEN + 50}
              disabled={disabled}
              onChange={(e) => onField("catatan_kader", e.target.value, setCatatanKader)}
              placeholder="Catatan tambahan kader (opsional)."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none disabled:opacity-60"
            />
            {fieldErr("catatan_kader")}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Catatan Tindak Lanjut Bidan (opsional)
              {isKader && (
                <span className="ml-2 normal-case font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  Hanya Bidan/Admin
                </span>
              )}
            </label>
            <textarea
              rows={2}
              value={catatanBidan}
              maxLength={CATATAN_MAX_LEN + 50}
              disabled={disabled || isKader}
              onChange={(e) => onField("catatan_bidan", e.target.value, setCatatanBidan)}
              placeholder={isKader ? "Hanya dapat diisi oleh Bidan/Admin." : "Tindak lanjut klinis atau pesan rujukan (diisi oleh Bidan)."}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none disabled:opacity-60"
            />
            {fieldErr("catatan_bidan")}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <Link to={`${rolePrefix}/meja3`} className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
              ← Kembali ke Antrean Meja 3
            </Link>
            <button type="submit" disabled={disabled} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/20 transition">
              {isSaving ? "Menyimpan…" : "Simpan & Lanjut Meja 4 →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
