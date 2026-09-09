/**
 * SIPANDU - Tambah Keluarga & Tambah Anggota (PRD Bagian 42)
 * Terintegrasi LIVE dengan SINDUKSADATI (master kependudukan RW 06).
 */
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Database, Plus, Search, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { SinduksadatiService } from "@/services/sinduksadatiService";
import { hitungUsia, klasifikasiSasaran } from "@/utils/zscoreCalculator";

export function KeluargaTambah() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { data, tambahKeluarga } = useSipandu();

  const [form, setForm] = useState({
    nomor_kk: "3579010101901234",
    nama_kepala_keluarga: "",
    alamat: "",
    rt: "13",
    rw: "06",
    kelurahan: "Mojorejo",
    kecamatan: "Junrejo",
    status_ekonomi: "sejahtera_2",
    sinduksadati_keluarga_id: "",
  });

  // Modal State for Live SINDUKSADATI search
  const [modalOpen, setModalOpen] = useState(false);
  const [searchNik, setSearchNik] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // PRD F-02.1 / 16.2: modal konfirmasi KK duplikat
  const [kkDuplikat, setKkDuplikat] = useState<any>(null);

  async function handleLiveSearch() {
    if (!searchNik || searchNik.length < 16) {
      setSearchError("Masukkan 16 digit NIK yang valid.");
      return;
    }
    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    const res = await SinduksadatiService.lookupWargaByNik(searchNik);
    setSearching(false);
    if (res.success && res.data) {
      setSearchResult(res.data);
    } else {
      setSearchError(res.message || "Data warga tidak ditemukan di master RW 06.");
    }
  }

  function applySearchResult() {
    if (!searchResult) return;
    setForm((prev) => ({
      ...prev,
      nama_kepala_keluarga: searchResult.nama_lengkap || prev.nama_kepala_keluarga,
      alamat: searchResult.alamat || prev.alamat,
      rt: searchResult.nomor_rt ? searchResult.nomor_rt.padStart(2, "0") : prev.rt,
      rw: searchResult.nomor_rw || "06",
      sinduksadati_keluarga_id: searchResult.hunian_id || `sdti-kk-${searchNik.slice(0, 6)}`,
    }));
    setModalOpen(false);
    showToast(`Data ${searchResult.nama_lengkap} berhasil ditarik LIVE dari SINDUKSADATI.`, "success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // PRD F-02.1: cek KK duplikat sebelum membuat entri baru
    const existing = data.keluarga.find(
      (k: any) => String(k.nomor_kk) === String(form.nomor_kk).trim()
    );
    if (existing && existing.id !== kkDuplikat?.id) {
      setKkDuplikat(existing);
      return;
    }

    await tambahKeluarga(form);
    showToast("Kartu keluarga baru berhasil didaftarkan dan tersimpan.", "success");
    navigate("/keluarga");
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      {/* Modal Konfirmasi KK Duplikat (PRD F-02.1) */}
      {kkDuplikat && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setKkDuplikat(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Keluarga dengan KK ini sudah terdaftar</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Kepala Keluarga: <strong>{kkDuplikat.nama_kepala_keluarga}</strong> · RT {kkDuplikat.rt}/RW {kkDuplikat.rw}
                </p>
                <p className="text-xs text-gray-500 mt-1">Apakah Anda ingin melihat data keluarga tersebut?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setKkDuplikat(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Tetap Buat Baru
              </button>
              <button
                type="button"
                onClick={() => navigate(`/keluarga/${kkDuplikat.id}`)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Lihat Data Keluarga
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link to="/keluarga" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Kartu Keluarga</h1>
          <p className="text-sm text-gray-500">Pendaftaran KK baru Posyandu ILP Flamboyan RW 06</p>
        </div>
      </div>

      {/* Live Integration Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> SINDUKSADATI LIVE Integration
          </p>
          <p className="text-xs text-emerald-900 mt-1">Cari data kependudukan melalui integrasi aman SIPANDU untuk mengisi form otomatis.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalOpen(true);
            setSearchNik("3579012403100003");
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" /> Cari di SINDUKSADATI
        </button>
      </div>

      {/* Form Tambah KK */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nomor KK (16 digit) *</label>
          <input
            type="text"
            required
            pattern="^\d{16}$"
            value={form.nomor_kk}
            onChange={(e) => setForm({ ...form, nomor_kk: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm font-mono outline-none"
            placeholder="357901XXXXXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kepala Keluarga *</label>
          <input
            type="text"
            required
            value={form.nama_kepala_keluarga}
            onChange={(e) => setForm({ ...form, nama_kepala_keluarga: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            placeholder="Nama lengkap kepala keluarga"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili</label>
          <input
            type="text"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            placeholder="Jl. Mojorejo No. ..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">RT *</label>
            <select value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
              <option value="13">RT 13</option>
              <option value="14">RT 14</option>
              <option value="15">RT 15</option>
              <option value="16">RT 16</option>
              <option value="21">RT 21</option>
              <option value="23">RT 23</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">RW</label>
            <input type="text" readOnly value={form.rw} className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kelurahan</label>
            <input value={form.kelurahan} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kecamatan</label>
            <input value={form.kecamatan} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Status Ekonomi (Keluarga Sejahtera)</label>
          <select value={form.status_ekonomi} onChange={(e) => setForm({ ...form, status_ekonomi: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
            <option value="pra_sejahtera">Pra-Sejahtera</option>
            <option value="sejahtera_1">Sejahtera 1</option>
            <option value="sejahtera_2">Sejahtera 2</option>
            <option value="sejahtera_3">Sejahtera 3</option>
            <option value="sejahtera_3_plus">Sejahtera 3+</option>
          </select>
        </div>

        {form.sinduksadati_keluarga_id && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Terhubung ke Master SINDUKSADATI
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
          <Link to="/keluarga" className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">Batal</Link>
          <button type="submit" className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Simpan Kartu Keluarga
          </button>
        </div>
      </form>

      {/* Modal Live Search SINDUKSADATI */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Cari Penduduk di SINDUKSADATI LIVE</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Masukkan NIK 16 Digit</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchNik}
                  onChange={(e) => setSearchNik(e.target.value)}
                  placeholder="357901XXXXXXXXXX"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleLiveSearch}
                  disabled={searching}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{searching ? "Mencari..." : "Cari LIVE"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Contoh NIK uji coba: <code className="bg-slate-100 px-1 py-0.5 rounded cursor-pointer" onClick={() => setSearchNik("3579012403100003")}>3579012403100003</code></p>
            </div>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {searchResult && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-sm">{searchResult.nama_lengkap}</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-bold text-[10px]">
                    {searchResult.status_penduduk}
                  </span>
                </div>
                <p className="text-slate-700"><strong>Jenis Kelamin:</strong> {searchResult.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</p>
                <p className="text-slate-700"><strong>Alamat:</strong> {searchResult.alamat || "—"}</p>
                <p className="text-slate-700"><strong>Wilayah:</strong> RT {searchResult.nomor_rt} / RW {searchResult.nomor_rw}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={applySearchResult}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    Gunakan Data Ini →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnggotaTambah() {
  const { kkId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { data, tambahAnggota } = useSipandu();

  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [jk, setJk] = useState<"L" | "P">("L");
  const [tanggalLahir, setTanggalLahir] = useState("2024-01-15");
  const [hubungan, setHubungan] = useState("Anak");
  const [statusHamil, setStatusHamil] = useState(false);
  const [hpht, setHpht] = useState("");
  const [sdtiPendudukId, setSdtiPendudukId] = useState<string | null>(null);

  const [searching, setSearching] = useState(false);

  const usia = hitungUsia(tanggalLahir);
  const klas = klasifikasiSasaran(usia, jk, statusHamil);

  // PRD 16.2 / NIK_DUPLICATE: cek real-time NIK duplikat internal
  const nikDuplikat = useMemo(() => {
    if (!nik || nik.length !== 16) return null;
    return data.anggota.find((a: any) => String(a.nik) === String(nik).trim()) || null;
  }, [nik, data.anggota]);

  async function lookupLive() {
    if (!nik || nik.length < 16) {
      showToast("Ketik 16 digit NIK terlebih dahulu", "warning");
      return;
    }
    setSearching(true);
    const res = await SinduksadatiService.lookupWargaByNik(nik);
    setSearching(false);

    if (res.success && res.data) {
      setNama(res.data.nama_lengkap);
      setJk(res.data.jenis_kelamin);
      setSdtiPendudukId(res.data.hunian_id || `sdti-pdk-${nik.slice(0, 8)}`);
      showToast(`Data ${res.data.nama_lengkap} berhasil diisi dari SINDUKSADATI LIVE.`, "success");
    } else {
      showToast(res.message || "Data warga tidak ditemukan.", "danger");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // PRD 15.1/16.2: validasi tanggal lahir
    if (tanggalLahir) {
      const tgl = new Date(`${tanggalLahir}T00:00:00`);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const minDob = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      if (tgl > todayStart) {
        showToast("Tanggal lahir tidak boleh di masa depan.", "danger");
        return;
      }
      if (tgl < minDob) {
        showToast("Tanggal lahir maksimal 120 tahun yang lalu.", "danger");
        return;
      }
    }

    // PRD 16.2 / NIK_DUPLICATE: blok submit bila NIK sudah terdaftar
    if (nikDuplikat) {
      showToast(`NIK ini sudah terdaftar atas nama ${nikDuplikat.nama}.`, "danger");
      return;
    }

    await tambahAnggota({
      keluarga_id: kkId,
      nik,
      nama,
      jenis_kelamin: jk,
      tanggal_lahir: tanggalLahir,
      hubungan_keluarga: hubungan,
      kategori: klas.kode,
      status_hamil: statusHamil,
      hpht: statusHamil ? hpht : null,
      sinduksadati_penduduk_id: sdtiPendudukId,
    });
    showToast(`Anggota ${nama} berhasil didaftarkan dan tersimpan.`, "success");
    navigate(kkId ? `/keluarga/${kkId}` : "/keluarga");
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={kkId ? `/keluarga/${kkId}` : "/keluarga"} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Anggota Keluarga</h1>
          <p className="text-sm text-gray-500">Pendaftaran sasaran Posyandu ILP Flamboyan RW 06</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> SINDUKSADATI RW 06 Integration
          </p>
          <p className="text-xs text-emerald-900 mt-1">Cari data kependudukan dari master RW 06 untuk mengisi form otomatis.</p>
        </div>
        <button
          type="button"
          onClick={lookupLive}
          disabled={searching}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Cari di SINDUKSADATI
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">NIK (16 digit) *</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              pattern="^\d{16}$"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="357901XXXXXXXXXXXX"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm font-mono outline-none"
            />
            <button
              type="button"
              onClick={lookupLive}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Lookup
            </button>
          </div>
          {nikDuplikat && (
            <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> NIK ini sudah terdaftar atas nama {nikDuplikat.nama}. Pendaftaran diblokir.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            placeholder="Nama lengkap sasaran"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin *</label>
            <select value={jk} onChange={(e) => setJk(e.target.value as "L" | "P")} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir *</label>
            <input
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Hubungan Keluarga *</label>
          <select value={hubungan} onChange={(e) => setHubungan(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
            <option>Kepala Keluarga</option>
            <option>Istri</option>
            <option>Anak</option>
            <option>Menantu</option>
            <option>Cucu</option>
            <option>Famili Lain</option>
            <option>Warga Mandiri</option>
          </select>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 text-xs flex items-center gap-3">
          <span className="font-semibold text-slate-700">Auto-klasifikasi:</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">{klas.label}</span>
          {usia && <span className="text-slate-500">({usia.usiaTeks})</span>}
        </div>

        {jk === "P" && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-pink-700">
              <input type="checkbox" checked={statusHamil} onChange={(e) => setStatusHamil(e.target.checked)} className="w-4 h-4 rounded text-pink-600" />
              Tandai sebagai Ibu Hamil (Bumil)
            </label>
            {statusHamil && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">HPHT (Hari Pertama Haid Terakhir)</label>
                <input type="date" value={hpht} onChange={(e) => setHpht(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
              </div>
            )}
          </div>
        )}

        {sdtiPendudukId && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Terhubung ke master SINDUKSADATI
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
          <Link to={kkId ? `/keluarga/${kkId}` : "/keluarga"} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">Batal</Link>
          <button type="submit" className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Daftarkan Anggota
          </button>
        </div>
      </form>
    </div>
  );
}
