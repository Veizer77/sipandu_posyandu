/**
 * SIPANDU - Meja 4: Pelayanan Kesehatan & Imunisasi
 * Dilengkapi Antrean Meja 4 Mandiri & Form Checklist Pelayanan
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Pill, HeartPulse, Syringe, AlertTriangle, CheckCircle2, Stethoscope, Baby } from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { maskNik } from "@/lib/utils";
import { dbService } from "@/services/dbService";

const IMUNISASI_OPTIONS = [
  { id: "HB-0", label: "HB-0 (0-7 hari)" },
  { id: "BCG", label: "BCG (1 bulan)" },
  { id: "Polio 1", label: "Polio 1" },
  { id: "DPT-HB-Hib 1", label: "DPT-HB-Hib 1" },
  { id: "Polio 2", label: "Polio 2" },
  { id: "DPT-HB-Hib 2", label: "DPT-HB-Hib 2" },
  { id: "Polio 3", label: "Polio 3" },
  { id: "DPT-HB-Hib 3", label: "DPT-HB-Hib 3" },
  { id: "Polio 4", label: "Polio 4" },
  { id: "IPV", label: "IPV" },
  { id: "MR 1", label: "MR 1 (Campak-Rubella)" },
  { id: "DPT-HB-Hib 4", label: "DPT-HB-Hib 4 (Booster)" },
  { id: "MR 2", label: "MR 2" },
];

function AntreanMeja4({ data, navigate }: { data: any; navigate: any }) {
  const { currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const list = data.kunjunganAktif;
  const sudahDilayani = list.filter((k: any) => {
    const p = k.pelayanan;
    return p && (p.vitamin_a || p.pmt || (p.imunisasi && p.imunisasi.length > 0) || p.tablet_fe || p.rujukan);
  }).length;
  const rujukanCount = list.filter((k: any) => k.pelayanan?.rujukan).length;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={4} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" /> Antrean Meja 4
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 4: Pelayanan Kesehatan, Imunisasi & PMT</h1>
          <p className="text-xs text-gray-500">Pilih peserta untuk mendokumentasikan pemberian Vitamin A, PMT, imunisasi balita, suplemen Fe, atau rujukan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-center">
            <span className="text-[10px] text-green-700 font-bold uppercase">Sudah Dilayani</span>
            <p className="text-lg font-bold text-green-800 leading-none mt-0.5">{sudahDilayani}</p>
          </div>
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="text-[10px] text-rose-700 font-bold uppercase">Rujukan</span>
            <p className="text-lg font-bold text-rose-800 leading-none mt-0.5">{rujukanCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Peserta Hadir Hari Ini</p>
            <p className="text-xs text-gray-400 mt-1">Lakukan pendaftaran kehadiran peserta di Meja 1 terlebih dahulu.</p>
            <Link to={`${rolePrefix}/meja1`} className="mt-4 inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold">
              Buka Meja 1 Registrasi
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((k: any) => {
              const a = data.anggota.find((x: any) => x.id === k.anggota_id);
              if (!a) return null;
              const pel = k.pelayanan || {};
              const hasService = Boolean(pel.vitamin_a || pel.pmt || (pel.imunisasi && pel.imunisasi.length > 0) || pel.tablet_fe || pel.rujukan);

              return (
                <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                  <div className="flex items-center gap-3.5">
                    <Avatar nama={a.nama} className="w-11 h-11 rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {hasService ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pelayanan Terisi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                            Menunggu Pelayanan
                          </span>
                        )}
                        {pel.rujukan && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Dirujuk: {pel.tujuan_rujukan || "Puskesmas"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mt-1">
                        <span>NIK: {maskNik(a.nik)}</span>
                        {pel.vitamin_a && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px] font-semibold">Vit A</span>}
                        {pel.pmt && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 text-[10px] font-semibold">PMT</span>}
                        {pel.tablet_fe && <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded border border-pink-200 text-[10px] font-semibold">Tablet Fe</span>}
                        {pel.imunisasi && pel.imunisasi.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-semibold">
                            Imunisasi: {pel.imunisasi.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`${rolePrefix}/meja4/${a.id}`)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 ${
                      hasService
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    <Syringe className="w-4 h-4" />
                    <span>{hasService ? "Edit Pelayanan" : "Beri Layanan"}</span>
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

export default function Meja4() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const { data, updatePelayanan } = useSipandu();

  const anggota = data.anggota.find((a: any) => a.id === anggotaId);
  const activeVisit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
  const pel = activeVisit?.pelayanan || {};

  const isDirtyRef = useRef(false);
  const loadedAnggotaIdRef = useRef<string | undefined>(anggotaId);

  const [vitaminA, setVitaminA] = useState(Boolean(pel.vitamin_a));
  // PRD F-07: Kapsul Vitamin A diberikan nasional hanya pada bulan Februari & Agustus
  const isVitABulan = [1, 7].includes(new Date().getMonth());
  const vitAPesan = isVitABulan
    ? "Bulan ini wajib (Februari & Agustus)"
    : "Di luar jadwal nasional (Feb & Agu)";
  useEffect(() => {
    if (isVitABulan && !pel.vitamin_a) setVitaminA(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pmt, setPmt] = useState(Boolean(pel.pmt));
  const [pmtJenis, setPmtJenis] = useState(pel.pmt_jenis || "Biskuit Balita");
  const [imunisasi, setImunisasi] = useState<string[]>(pel.imunisasi || []);
  const [tabletFe, setTabletFe] = useState(Boolean(pel.tablet_fe));
  const [rujukan, setRujukan] = useState(Boolean(pel.rujukan));
  const [tujuanRujukan, setTujuanRujukan] = useState(pel.tujuan_rujukan || "Puskesmas Junrejo");
  const [alasanRujukan, setAlasanRujukan] = useState(pel.alasan_rujukan || "");
  // PRD F-06 item tambahan (Bumil TT, Lansia obat rutin, WUS)
  const [ttKe, setTtKe] = useState<number | null>(pel.imunisasi_tt_ke || null);
  const [konseling, setKonseling] = useState(Boolean(pel.konseling));
  const [obatRutin, setObatRutin] = useState(pel.obat_rutin || "");
  const [skriningAnemia, setSkriningAnemia] = useState(Boolean(pel.skrining_anemia));

  React.useEffect(() => {
    if (!anggotaId) return;

    if (loadedAnggotaIdRef.current !== anggotaId) {
      loadedAnggotaIdRef.current = anggotaId;
      isDirtyRef.current = false;
      const v = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
      const p = v?.pelayanan || {};
      setVitaminA(Boolean(p.vitamin_a));
      setPmt(Boolean(p.pmt));
      setPmtJenis(p.pmt_jenis || "Biskuit Balita");
      setImunisasi(p.imunisasi || []);
      setTabletFe(Boolean(p.tablet_fe));
      setRujukan(Boolean(p.rujukan));
      setTujuanRujukan(p.tujuan_rujukan || "Puskesmas Junrejo");
      setAlasanRujukan(p.alasan_rujukan || "");
      setTtKe(p.imunisasi_tt_ke || null);
      setKonseling(Boolean(p.konseling));
      setObatRutin(p.obat_rutin || "");
      setSkriningAnemia(Boolean(p.skrining_anemia));
      return;
    }

    if (isDirtyRef.current) return;

    const v = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
    const p = v?.pelayanan || {};
    if (Object.keys(p).length > 0) {
      setVitaminA(Boolean(p.vitamin_a));
      setPmt(Boolean(p.pmt));
      setPmtJenis(p.pmt_jenis || "Biskuit Balita");
      setImunisasi(p.imunisasi || []);
      setTabletFe(Boolean(p.tablet_fe));
      setRujukan(Boolean(p.rujukan));
      setTujuanRujukan(p.tujuan_rujukan || "Puskesmas Junrejo");
      setAlasanRujukan(p.alasan_rujukan || "");
      setTtKe(p.imunisasi_tt_ke || null);
      setKonseling(Boolean(p.konseling));
      setObatRutin(p.obat_rutin || "");
      setSkriningAnemia(Boolean(p.skrining_anemia));
    }
  }, [anggotaId, data.kunjunganAktif]);

  if (!anggota) {
    return <AntreanMeja4 data={data} navigate={navigate} />;
  }

  function toggleImunisasi(id: string) {
    isDirtyRef.current = true;
    setImunisasi((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    isDirtyRef.current = false;
    await updatePelayanan(anggota.id, {
      vitamin_a: vitaminA,
      pmt,
      pmt_jenis: pmt ? pmtJenis : null,
      imunisasi,
      tablet_fe: tabletFe,
      rujukan,
      tujuan_rujukan: rujukan ? tujuanRujukan : null,
      alasan_rujukan: rujukan ? alasanRujukan : null,
      imunisasi_tt_ke: ttKe,
      konseling,
      obat_rutin: obatRutin || null,
      skrining_anemia: skriningAnemia,
    });

    // B1/B2: catat imunisasi per jenis ke tabel imunisasi (anti-duplikat via getImunisasi)
    if (imunisasi.length > 0 && dbService.isConfigured()) {
      try {
        const existing = await dbService.getImunisasi();
        const alreadySet = new Set(
          existing
            .filter((r: any) => r.anggota_id === anggota.id)
            .map((r: any) => r.jenis)
        );
        const baru = imunisasi
          .filter((jenis) => !alreadySet.has(jenis))
          .map((jenis) => ({
            anggota_id: anggota.id,
            jenis,
            tanggal: new Date().toISOString().split("T")[0],
            kunjungan_id: activeVisit?.id || null,
          }));
        if (baru.length > 0) {
          await dbService.catatImunisasi(baru);
        }
      } catch (e) {
        console.warn("Gagal mencatat imunisasi ke tabel imunisasi:", e);
      }
    }

    showToast("Pelayanan Meja 4 tersimpan. Sesi pelayanan selesai untuk peserta.", "success");
    navigate(`${rolePrefix}/rekap`);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={4} />

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <span className="text-xs font-semibold text-amber-700 uppercase">Meja 4: Pelayanan Kesehatan & Imunisasi</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">{anggota.nama}</h2>
          <p className="text-xs text-gray-500">Vitamin A, PMT, Imunisasi dasar, Tablet Fe, dan Rujukan Puskesmas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {(anggota.kategori === "bayi" || anggota.kategori === "balita") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <CheckPill
                    icon={<Pill className="w-5 h-5" />}
                    title="Vitamin A"
                    color="amber"
                    checked={vitaminA}
                    onChange={setVitaminA}
                  />
                  <p className={`text-[11px] font-semibold ${isVitABulan ? "text-emerald-600" : "text-gray-400"}`}>
                    {isVitABulan ? "✓ " : "• "}{vitAPesan}
                  </p>
                </div>
                <CheckPill
                  icon={<HeartPulse className="w-5 h-5" />}
                  title="PMT Pemulihan / Kudapan"
                  color="green"
                  checked={pmt}
                  onChange={setPmt}
                />
              </div>

              {pmt && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <label className="block text-xs font-bold text-green-900 mb-1">Jenis PMT yang Diberikan</label>
                  <select
                    value={pmtJenis}
                    onChange={(e) => setPmtJenis(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-green-300 rounded-xl text-xs font-semibold text-gray-800"
                  >
                    <option>Biskuit Balita Kemenkes</option>
                    <option>Kudapan Pangan Lokal (Telur & Bubur Jagung)</option>
                    <option>Susu Formula Khusus Gizi Kurang</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Imunisasi Dasar yang Diberikan Hari Ini
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {IMUNISASI_OPTIONS.map((im) => {
                    const checked = imunisasi.includes(im.id);
                    return (
                      <button
                        type="button"
                        key={im.id}
                        onClick={() => toggleImunisasi(im.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                          checked
                            ? "bg-sky-50 border-sky-400 text-sky-900 shadow-sm"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="truncate">{im.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {(anggota.kategori === "ibu_hamil" || anggota.kategori === "bumil") && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CheckPill
                  icon={<Pill className="w-5 h-5" />}
                  title="Tablet Tambah Darah (Fe 30 butir)"
                  color="pink"
                  checked={tabletFe}
                  onChange={setTabletFe}
                />
                <CheckPill
                  icon={<HeartPulse className="w-5 h-5" />}
                  title="PMT Ibu Hamil KEK"
                  color="green"
                  checked={pmt}
                  onChange={setPmt}
                />
              </div>
              {/* PRD F-06.B: Imunisasi TT */}
              <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200">
                <label className="block text-xs font-bold text-pink-900 mb-2">Imunisasi TT (Tetanus Toksoid)</label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((ke) => (
                    <button
                      type="button"
                      key={ke}
                      onClick={() => setTtKe(ttKe === ke ? null : ke)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                        ttKe === ke
                          ? "bg-pink-600 border-pink-600 text-white shadow-sm"
                          : "bg-white border-pink-200 text-pink-700 hover:bg-pink-100"
                      }`}
                    >
                      TT{ke}
                    </button>
                  ))}
                </div>
              </div>
              <CheckPill
                icon={<Baby className="w-5 h-5" />}
                title="Kapsul Vitamin A (ibu nifas)"
                color="amber"
                checked={vitaminA}
                onChange={setVitaminA}
              />
            </div>
          )}

          {anggota.kategori === "lansia" && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold">Pemeriksaan Lanjut Lansia</p>
                <p className="mt-1">Edukasi kepatuhan obat hipertensi/diabetes dan senam lansia rutin di Balai RW 06.</p>
              </div>
              <CheckPill
                icon={<HeartPulse className="w-5 h-5" />}
                title="Konseling Kesehatan Lansia"
                color="green"
                checked={konseling}
                onChange={setKonseling}
              />
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Obat Rutin yang Diberikan</label>
                <input
                  type="text"
                  value={obatRutin}
                  onChange={(e) => setObatRutin(e.target.value)}
                  placeholder="Misal: Amlodipine 5mg, Metformin 500mg"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {anggota.kategori === "wus" && (
            <div className="space-y-3">
              {/* PRD F-06.D: Skrining Anemia, Tablet Fe, Konseling Reproduksi */}
              <CheckPill
                icon={<Stethoscope className="w-5 h-5" />}
                title="Skrining Anemia"
                color="green"
                checked={skriningAnemia}
                onChange={setSkriningAnemia}
              />
              <CheckPill
                icon={<Pill className="w-5 h-5" />}
                title="Tablet Tambah Darah (Tablet Fe)"
                color="pink"
                checked={tabletFe}
                onChange={setTabletFe}
              />
              <CheckPill
                icon={<HeartPulse className="w-5 h-5" />}
                title="Konseling Kesehatan Reproduksi"
                color="green"
                checked={konseling}
                onChange={setKonseling}
              />
            </div>
          )}

          {/* Rujukan */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <CheckPill
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Perlu Rujukan ke Puskesmas Junrejo"
              color="red"
              checked={rujukan}
              onChange={setRujukan}
            />

            {rujukan && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">Tujuan Fasilitas Rujukan</label>
                  <input
                    value={tujuanRujukan}
                    onChange={(e) => setTujuanRujukan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">Alasan / Indikasi Klinis Rujukan *</label>
                  <textarea
                    rows={2}
                    value={alasanRujukan}
                    onChange={(e) => setAlasanRujukan(e.target.value)}
                    placeholder="Misal: berat badan turun 2 kali berturut-turut (2T), Z-Score BB/U < -3 SD, tanda dehidrasi."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-100">
            <Link to={`${rolePrefix}/meja4`} className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
              ← Kembali ke Antrean Meja 4
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition"
            >
              Selesaikan Pelayanan & Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckPill({
  icon,
  title,
  color,
  checked,
  onChange,
  readOnly,
}: {
  icon: React.ReactNode;
  title: string;
  color: "amber" | "green" | "pink" | "red";
  checked: boolean;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 border-amber-300 text-amber-800",
    green: "bg-green-50 border-green-300 text-green-800",
    pink: "bg-pink-50 border-pink-300 text-pink-800",
    red: "bg-rose-50 border-rose-300 text-rose-800",
  };
  return (
    <button
      type="button"
      onClick={() => !readOnly && onChange(!checked)}
      className={`p-3 rounded-2xl border-2 text-left transition ${
        checked ? colorMap[color] : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
            checked ? "bg-emerald-600 border-emerald-600" : "border-gray-300"
          }`}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </span>
        <span className="shrink-0">{icon}</span>
        <span className="font-bold text-xs">{title}</span>
      </div>
    </button>
  );
}
