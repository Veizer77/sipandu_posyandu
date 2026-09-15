/**
 * SIPANDU - Meja 5: Edukasi & Penyuluhan Kelompok
 * Sesuai PRD v3.0.0 Bab 9 (F-06 Meja 5) & Alur 5 Meja ILP Kemenkes
 *
 * PERBAIKAN AUDIT MEJA-5 (MEJA-5-AUDIT.md):
 * - M5-001/M5-002: tanpa fallback jadwal[0]/UUID; tepat satu sesi aktif.
 * - M5-003/M5-024: guard sesi + config error multi-sesi.
 * - M5-004/M5-006/M5-014: persist ditunggu; navigasi hanya pasca-sukses; error bertahan.
 * - M5-005: hadirCount session-scoped unik.
 * - M5-007: isSaving + unique (sesi, tema) + info bila sudah tercatat.
 * - M5-008/M5-020: filter sesi tanpa fallthrough (helper + Rekap).
 * - M5-009: form kosong default; template eksplisit.
 * - M5-010: jumlah default = hadirCount (tanpa minimum 15).
 * - M5-011: edit/delete per item + audit (di store).
 * - M5-012/M5-027: KPI hanya dari data tersimpan.
 * - M5-013: isSaving + disable.
 * - M5-015: permission Kader+Bidan (PKK/Kades read-only).
 * - M5-016/M5-017: audit pasca-sukses; ID dari server.
 * - M5-019: error baca dibedakan + retry.
 * - M5-021: template diurutkan relevansi demografi.
 * - M5-022/M5-023: konfirmasi submit + unsaved warning.
 * - M5-025/M5-026: batas panjang + timestamp riwayat.
 * - M5-028/M5-029: split file + field canonical.
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  CalendarX2,
  AlertTriangle,
} from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Meja5Form, type Meja5FormValues } from "@/components/meja/Meja5Form";
import { Meja5History } from "@/components/meja/Meja5History";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { getAllSessionVisits } from "@/lib/meja1Logic";
import {
  TEMPLATES_KEMENKES,
  rankTemplatesByHadir,
  countHadirUnik,
  getPenyuluhanSesi,
  validatePenyuluhan,
  canManagePenyuluhan,
  type PenyuluhanTemplate,
} from "@/lib/meja5Logic";

const EMPTY_VALUES: Meja5FormValues = {
  tema: "",
  narasumber: "",
  jumlah: "",
  metode: "Ceramah & Demonstrasi",
  media: "",
  ringkasan: "",
};

export default function Meja5() {
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { data, activeSessionId, tambahPenyuluhan, ubahPenyuluhan, hapusPenyuluhan, refreshFromDb } = useSipandu();

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;
  const canManage = canManagePenyuluhan(currentRole);
  const sesiAktif = (data.jadwal || []).find((j: any) => j.id === activeSessionId) || null;

  // M5-005/M5-008: session-scoped visits & penyuluhan (tanpa fallthrough).
  const sessionVisits = useMemo(
    () => getAllSessionVisits(data.kunjunganAktif, data.kunjungan, activeSessionId),
    [data.kunjunganAktif, data.kunjungan, activeSessionId]
  );
  const hadirCount = useMemo(() => countHadirUnik(sessionVisits), [sessionVisits]);
  const hadirKategoris = useMemo(() => {
    const byId = new Map<string, string>();
    (data.anggota || []).forEach((a: any) => byId.set(a.id, a.kategori));
    const set = new Set<string>();
    sessionVisits.forEach((k: any) => {
      const kat = byId.get(k.anggota_id);
      if (kat) set.add(kat);
    });
    return Array.from(set);
  }, [sessionVisits, data.anggota]);

  const savedPenyuluhan = useMemo(
    () => getPenyuluhanSesi(data.penyuluhan, activeSessionId),
    [data.penyuluhan, activeSessionId]
  );
  // M5-012/M5-027: KPI HANYA dari data tersimpan.
  const totalPesertaTerpapar = useMemo(
    () => savedPenyuluhan.reduce((acc: number, p: any) => acc + (Number(p.jumlah_peserta ?? p.jumlah) || 0), 0),
    [savedPenyuluhan]
  );

  const rankedTemplates = useMemo(
    () => rankTemplatesByHadir(TEMPLATES_KEMENKES, hadirKategoris),
    [hadirKategoris]
  );

  // F-05: peserta tahap meja_5 (klinis selesai, menunggu finalisasi tutup sesi).
  // Tidak tampil di antrean Meja 2-4; terlihat di sini + Rekap.
  const menungguFinalisasi = useMemo(
    () => sessionVisits.filter((k: any) => k?.status_alur === "meja_5_penyuluhan"),
    [sessionVisits]
  );
  const anggotaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.anggota || []).forEach((a: any) => m.set(a.id, a));
    return m;
  }, [data.anggota]);

  const [values, setValues] = useState<Meja5FormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [leaveArmed, setLeaveArmed] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isSavingRef = useRef(false);

  // M5-010: jumlah default = hadirCount saat form masih pristine.
  useEffect(() => {
    if (!isDirty && editingId === null && hadirCount > 0) {
      setValues((v) => (v.jumlah === "" ? { ...v, jumlah: hadirCount } : v));
    }
  }, [hadirCount, isDirty, editingId]);

  // M5-023: warning tutup/refresh tab saat dirty.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function onChange(patch: Partial<Meja5FormValues>) {
    setIsDirty(true);
    setConfirmArmed(false);
    setSubmitError(null);
    setLeaveArmed(false);
    setFieldErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
    setValues((v) => ({ ...v, ...patch }));
  }

  function handleApplyTemplate(tmpl: PenyuluhanTemplate & { relevan: boolean }, rankIdx: number) {
    setActiveTemplateIdx(rankIdx);
    setIsDirty(true);
    setConfirmArmed(false);
    setSubmitError(null);
    setValues((v) => ({
      ...v,
      tema: tmpl.tema,
      ringkasan: tmpl.ringkasan,
      metode: tmpl.metode,
      media: tmpl.media,
    }));
    showToast(`Template "${tmpl.tema.slice(0, 32)}..." diterapkan`, "info");
  }

  function resetForm() {
    setValues(EMPTY_VALUES);
    setFieldErrors({});
    setSubmitError(null);
    setConfirmArmed(false);
    setLeaveArmed(false);
    setIsDirty(false);
    setActiveTemplateIdx(null);
    setEditingId(null);
  }

  // M5-022: dua tahap — validasi + preview konfirmasi, lalu eksekusi.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingRef.current) return;

    const validation = validatePenyuluhan({
      tema: values.tema,
      narasumber: values.narasumber,
      jumlah_peserta: values.jumlah,
      metode: values.metode,
      media: values.media,
      ringkasan: values.ringkasan,
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

    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      if (editingId) {
        const row = await ubahPenyuluhan(editingId, validation.value);
        resetForm();
        showToast(`Penyuluhan "${String(row.tema).slice(0, 40)}..." diperbarui.`, "success");
      } else {
        const { action } = await tambahPenyuluhan(validation.value);
        resetForm();
        if (action === "existed") {
          showToast("Tema ini sudah tercatat pada sesi ini — menampilkan data yang ada.", "info");
        } else {
          showToast("Dokumentasi penyuluhan berhasil disimpan ke rekapitulasi sesi!", "success");
        }
        // M5-014: navigasi hanya setelah persist sukses.
        navigate(`${rolePrefix}/rekap`);
      }
    } catch (err: any) {
      const msg = err?.message || "Gagal menyimpan penyuluhan. Form tetap — coba lagi.";
      setSubmitError(msg);
      showToast(msg, "danger");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      setConfirmArmed(false);
    }
  }

  function handleEdit(item: any) {
    setEditingId(item.id);
    setIsDirty(true);
    setConfirmArmed(false);
    setSubmitError(null);
    setActiveTemplateIdx(null);
    setValues({
      tema: item.tema || "",
      narasumber: item.narasumber || "",
      jumlah: Number(item.jumlah_peserta ?? item.jumlah) || "",
      metode: item.metode || "Ceramah & Demonstrasi",
      media: item.media || "",
      ringkasan: item.ringkasan || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (deleteArmedId !== id) {
      setDeleteArmedId(id);
      return;
    }
    setDeleting(true);
    try {
      await hapusPenyuluhan(id);
      setDeleteArmedId(null);
      if (editingId === id) resetForm();
      showToast("Dokumentasi penyuluhan dihapus.", "success");
    } catch {
      // Toast error sudah dari store; armed tetap agar bisa coba lagi.
    } finally {
      setDeleting(false);
    }
  }

  if (!activeSessionId) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={5} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {multipleActive
              ? "Tutup/akhiri sesi ganda di halaman Jadwal Posyandu agar dokumentasi tidak salah sesi."
              : "Buka sesi hari H di halaman Jadwal Posyandu terlebih dahulu."}
          </p>
          <Link to={jadwalUrl} className="mt-4 inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold">
            Buka Jadwal Posyandu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={5} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" /> Sesi Hari H Aktif{sesiAktif?.tema ? ` — ${sesiAktif.tema}` : " — Posyandu Rutin"}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 5: Edukasi & Penyuluhan Kelompok</h1>
          <p className="text-xs text-gray-500">
            Dokumentasikan materi komunikasi informasi edukasi (KIE) kesehatan masyarakat dan capaian peserta sesi hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-teal-700 font-bold uppercase">Penyuluhan Selesai</span>
            <p className="text-lg font-bold text-teal-800 leading-none mt-0.5">{savedPenyuluhan.length} Sesi</p>
          </div>
          <div className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-sky-700 font-bold uppercase">Peserta Terpapar</span>
            <p className="text-lg font-bold text-sky-800 leading-none mt-0.5">{totalPesertaTerpapar} Jiwa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {!canManage ? (
            <div className="p-6 text-center bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-xs font-bold text-gray-700">Mode baca saja</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Dokumentasi penyuluhan hanya dapat dikelola Kader/Bidan/Admin. Riwayat sesi tampil di samping.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Meja5Form
                values={values}
                onChange={onChange}
                fieldErrors={fieldErrors}
                hadirCount={hadirCount}
                rankedTemplates={rankedTemplates}
                activeTemplateIdx={activeTemplateIdx}
                onApplyTemplate={handleApplyTemplate}
                disabled={isSaving}
                isEditing={editingId !== null}
              />

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl px-4 py-3">
                  {submitError}
                </div>
              )}

              {confirmArmed && (
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs space-y-2">
                  <p className="font-bold text-teal-900">Konfirmasi penyuluhan sesi ini:</p>
                  <ul className="text-teal-900 space-y-0.5">
                    <li><strong>Tema:</strong> {values.tema}</li>
                    <li><strong>Narasumber:</strong> {values.narasumber} · <strong>Peserta:</strong> {values.jumlah} orang</li>
                    <li><strong>Metode:</strong> {values.metode}{values.media ? ` · ${values.media}` : ""}</li>
                  </ul>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                    >
                      Batal ubah
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isDirty && !leaveArmed) {
                        setLeaveArmed(true);
                        return;
                      }
                      navigate(`${rolePrefix}/rekap`);
                    }}
                    className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                  >
                    {isDirty && !leaveArmed ? "Belum disimpan — klik lagi untuk tinggalkan" : "Lewati & Buka Rekap →"}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? "Menyimpan…" : confirmArmed ? "Ya, simpan penyuluhan" : editingId ? "Simpan perubahan" : "Simpan & Lanjut ke Rekap Sesi"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Meja5History
            items={savedPenyuluhan}
            loadError={data.penyuluhanError}
            onRetry={() => refreshFromDb()}
            canManage={canManage}
            editingId={editingId}
            onEdit={handleEdit}
            deleteArmedId={deleteArmedId}
            onDelete={handleDelete}
            deleting={deleting}
          />

          {menungguFinalisasi.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Menunggu Finalisasi Sesi</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-800 rounded-full border border-sky-200">
                  {menungguFinalisasi.length} Siap Diarsipkan
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Peserta ini sudah menyelesaikan Meja 1–4 dan akan ditandai selesai saat sesi ditutup.
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {menungguFinalisasi.map((k: any) => {
                  const a = anggotaById.get(k.anggota_id);
                  if (!a) return null;
                  return (
                    <div
                      key={k.id}
                      className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs truncate">{a.nama}</h4>
                        <div className="mt-1">
                          <CategoryBadge kategori={a.kategori} />
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Meja 5 ✓
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-md space-y-3.5">
            <div className="flex items-center gap-2 text-teal-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Standar Kemenkes RI — ILP Flamboyan</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Penyuluhan di Meja 5 bertujuan mengubah perilaku masyarakat dengan pendekatan siklus hidup:
            </p>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span><strong>Bayi & Balita:</strong> Timbang rutin, ASI Eksklusif 6 bulan, MPASI protein hewani, imunisasi lengkap.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span><strong>Ibu Hamil & Menyusui:</strong> Minum TTD rutin 90 hari, makanan padat gizi, periksa ANC minimal 6x.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span><strong>Lansia & WUS:</strong> Pembatasan gula-garam-lemak, aktivitas fisik 30 menit, skrining tensi & gula darah.</span>
              </li>
            </ul>
            <div className="pt-1">
              <Link
                to={`${rolePrefix}/rekap`}
                className="w-full py-2 px-3.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
              >
                Lihat Rekapitulasi Sesi Keseluruhan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
