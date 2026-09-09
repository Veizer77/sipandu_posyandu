/**
 * SIPANDU - Meja 5: Edukasi & Penyuluhan Kelompok
 * Sesuai PRD v3.0.0 Bab 9 (F-06 Meja 5) & Alur 5 Meja ILP Kemenkes
 */
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Megaphone,
  Users,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileText,
  HeartPulse,
  Baby,
  ShieldAlert,
  GraduationCap
} from "lucide-react";
import { MejaStepper } from "@/components/meja/MejaShared";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";

const TEMPLATES_KEMENKES = [
  {
    kategori: "Balita & Baduta",
    icon: Baby,
    color: "amber",
    tema: "Pencegahan Stunting: MPASI Kaya Protein Hewani & Kapsul Vitamin A",
    ringkasan: "Edukasi pentingnya pemberian protein hewani (telur, ikan air tawar, daging ayam) pada setiap porsi MPASI balita usia 6-23 bulan, serta kepatuhan vitamin A dosis tinggi di bulan Februari dan Agustus.",
    metode: "Ceramah & Demonstrasi",
    media: "Lembar Balik & Sampel Pangan Lokal",
  },
  {
    kategori: "Ibu Hamil",
    icon: HeartPulse,
    color: "rose",
    tema: "Pencegahan Anemia & KEK: Kepatuhan Konsumsi Tablet Tambah Darah (TTD)",
    ringkasan: "Penyuluhan kepatuhan minum TTD minimal 90 tablet selama kehamilan dengan air putih/jeruk, pemenuhan gizi seimbang, dan pengukuran LILA rutin untuk mencegah bayi lahir BBLR.",
    metode: "Konseling Kelompok & Diskusi",
    media: "Buku KIA & Leaflet Nutrisi Bumil",
  },
  {
    kategori: "Imunisasi",
    icon: ShieldAlert,
    color: "blue",
    tema: "Pentingnya Imunisasi Dasar Lengkap & Pemantauan KMS Digital",
    ringkasan: "Sosialisasi jadwal imunisasi dasar lengkap (HB-0 s.d. MR Booster), manfaat kurva KMS untuk deteksi dini balita tidak naik berat badan (2T) sebelum terjadi risiko stunting.",
    metode: "Ceramah & Tanya Jawab",
    media: "Poster Jadwal Imunisasi Kemenkes",
  },
  {
    kategori: "Lansia & Dewasa",
    icon: GraduationCap,
    color: "purple",
    tema: "Pengendalian Hipertensi & Diabetes Melalui Gerakan CERDIK",
    ringkasan: "Edukasi pembatasan asupan gula, garam, dan lemak (GGL), pentingnya aktivitas fisik 30 menit per hari, serta kepatuhan skrining tekanan darah dan gula darah sewaktu.",
    metode: "Ceramah & Diskusi",
    media: "Brosur CERDIK & Panduan Diet Rendah Garam",
  },
];

export default function Meja5() {
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const { data, tambahPenyuluhan } = useSipandu();

  const sesiAktif = data.jadwal.find((j: any) => j.status === "aktif") || data.jadwal[0];
  const hadirCount = data.kunjunganAktif.length;

  const savedPenyuluhan = useMemo(() => {
    return (data.penyuluhan || []).filter(
      (p: any) => !sesiAktif?.id || p.jadwal_id === sesiAktif.id || p.jadwal_posyandu_id === sesiAktif.id
    );
  }, [data.penyuluhan, sesiAktif]);

  const [tema, setTema] = useState("Pencegahan Stunting: MPASI Kaya Protein Hewani & Kapsul Vitamin A");
  const [narasumber, setNarasumber] = useState("Bdn. Siti Aminah, S.Tr.Keb & Kader Flamboyan");
  const [jumlah, setJumlah] = useState<number>(() => Math.max(hadirCount, 15));
  const [metode, setMetode] = useState("Ceramah & Demonstrasi");
  const [media, setMedia] = useState("Lembar Balik & Buku KIA");
  const [ringkasan, setRingkasan] = useState(
    "Sesi edukasi menekankan pentingnya ASI eksklusif 6 bulan, MPASI kaya protein hewani (telur, ikan, daging ayam), serta kepatuhan kapsul Vitamin A dosis tinggi. Kader membagikan buku panduan gizi dan mempraktikkan pengolahan makanan lumat berprotein."
  );
  const [activeTemplateIdx, setActiveTemplateIdx] = useState<number | null>(0);

  const totalPesertaTerpapar = useMemo(() => {
    const fromSaved = savedPenyuluhan.reduce((acc: number, p: any) => acc + (Number(p.jumlah_peserta ?? p.jumlah) || 0), 0);
    return Math.max(fromSaved, jumlah);
  }, [savedPenyuluhan, jumlah]);

  function handleApplyTemplate(tmpl: typeof TEMPLATES_KEMENKES[0], idx: number) {
    setActiveTemplateIdx(idx);
    setTema(tmpl.tema);
    setRingkasan(tmpl.ringkasan);
    setMetode(tmpl.metode);
    setMedia(tmpl.media);
    showToast(`Template "${tmpl.tema.slice(0, 32)}..." diterapkan`, "info");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTema = tema.trim();
    if (!trimmedTema) {
      showToast("Tema penyuluhan wajib diisi.", "warning");
      return;
    }
    if (trimmedTema.length < 5) {
      showToast("Tema penyuluhan minimal 5 karakter (sesuai standar PRD Bab 15.3).", "warning");
      return;
    }
    if (trimmedTema.length > 200) {
      showToast("Tema penyuluhan maksimal 200 karakter (sesuai PRD Bab 9 & 13).", "warning");
      return;
    }

    const trimmedNarasumber = narasumber.trim();
    if (!trimmedNarasumber) {
      showToast("Narasumber penyuluhan wajib diisi.", "warning");
      return;
    }
    if (trimmedNarasumber.length > 100) {
      showToast("Nama narasumber maksimal 100 karakter (PRD Bab 13.1).", "warning");
      return;
    }

    const numJumlah = Number(jumlah);
    if (!numJumlah || numJumlah < 1) {
      showToast("Jumlah peserta minimal 1 orang (PRD Bab 15.3).", "warning");
      return;
    }

    tambahPenyuluhan({
      jadwal_id: sesiAktif?.id,
      jadwal_posyandu_id: sesiAktif?.id,
      sesi_id: sesiAktif?.id,
      tema: trimmedTema,
      narasumber: trimmedNarasumber,
      jumlah_peserta: numJumlah,
      jumlah: numJumlah,
      metode,
      media: media.trim(),
      ringkasan: ringkasan.trim(),
      waktu: new Date().toISOString(),
      tanggal: new Date().toISOString(),
    });
    showToast("Dokumentasi penyuluhan berhasil disimpan ke rekapitulasi sesi!", "success");
    navigate(`${rolePrefix}/rekap`);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Stepper Navigation */}
      <MejaStepper activeMeja={5} />

      {/* Status Header Sesi & Twin KPI Box (Serasi dengan Meja 1-4) */}
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

      {/* Split Layout: 7 Cols Form + 5 Cols Panduan & Riwayat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Dokumentasi Edukasi */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Formulir Penyuluhan Hari Ini</h2>
                <p className="text-xs text-gray-500">Isi data kegiatan atau pilih template materi standar Kemenkes di bawah</p>
              </div>
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Template Cepat Materi ILP Kemenkes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES_KEMENKES.map((t, idx) => {
                const Icon = t.icon;
                const isSelected = activeTemplateIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(t, idx)}
                    className={`p-3 rounded-2xl text-left border transition flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/10 shadow-xs"
                        : "bg-gray-50/70 border-gray-200/80 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-white text-teal-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                          {t.kategori}
                        </span>
                        {isSelected && <span className="text-[10px] font-bold text-emerald-600">✓ Aktif</span>}
                      </div>
                      <p className="text-xs font-bold text-gray-900 mt-1 line-clamp-2 leading-tight">
                        {t.tema}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actual Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tema / Topik Penyuluhan <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-semibold ${tema.length < 5 || tema.length > 200 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  {tema.length}/200 karakter (min 5)
                </span>
              </div>
              <textarea
                rows={2}
                value={tema}
                minLength={5}
                maxLength={200}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Tuliskan topik penyuluhan yang dibawakan (min. 5 karakter)..."
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm font-semibold text-gray-900 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Narasumber / Fasilitator <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={narasumber}
                  maxLength={100}
                  onChange={(e) => setNarasumber(e.target.value)}
                  placeholder="Nama bidan / kader pembicara..."
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Jumlah Peserta Hadir <span className="text-rose-500">*</span></span>
                  {hadirCount > 0 && (
                    <span className="text-[10px] font-semibold text-teal-600">Hadir Meja 1: {hadirCount}</span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={jumlah}
                    onChange={(e) => setJumlah(parseInt(e.target.value || "0"))}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-bold text-gray-900 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Metode Penyuluhan (PRD)
                </label>
                <select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition"
                >
                  <option>Ceramah & Demonstrasi</option>
                  <option>Ceramah</option>
                  <option>Demonstrasi</option>
                  <option>Diskusi</option>
                  <option>Konseling Kelompok & Diskusi</option>
                  <option>Konseling Perorangan Antarpribadi</option>
                  <option>Simulasi & Praktik Langsung</option>
                  <option>Pemutaran Video & Diskusi</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Media / Alat Bantu KIE
                </label>
                <input
                  type="text"
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  placeholder="Contoh: Lembar Balik, Leaflet, Poster, Buku KIA..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Ringkasan Materi & Pesan Kunci
              </label>
              <textarea
                rows={3}
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Poin-poin edukasi yang disampaikan kepada peserta posyandu..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm leading-relaxed outline-none transition"
              />
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-100">
              <Link
                to={`${rolePrefix}/rekap`}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                Lewati & Buka Rekap →
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan & Lanjut ke Rekap Sesi
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Riwayat Penyuluhan Sesi & Panduan Kemenkes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Riwayat Penyuluhan Tersimpan */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-gray-900 text-sm">Dokumentasi Sesi Aktif</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
                {savedPenyuluhan.length} Tercatat
              </span>
            </div>

            {savedPenyuluhan.length === 0 ? (
              <div className="p-6 text-center bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700">Belum Ada Penyuluhan Disimpan</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Isi formulir di sebelah kiri dan klik "Simpan" untuk merekam kegiatan penyuluhan hari ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {savedPenyuluhan.map((p: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 leading-tight">{p.tema}</h4>
                      <span className="shrink-0 px-2 py-0.5 bg-white border border-teal-200 text-teal-800 rounded font-bold text-[10px]">
                        {p.jumlah_peserta ?? p.jumlah} Peserta
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      <strong>Narasumber:</strong> {p.narasumber} · {p.metode}
                    </p>
                    {p.ringkasan && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100/80 mt-1">
                        <p className="text-[11px] text-gray-600 leading-relaxed break-words">
                          {p.ringkasan}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Panduan Pesan Kunci 5 Siklus Hidup ILP */}
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
