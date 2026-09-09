/**
 * SIPANDU - Edit Keluarga & Edit Anggota (PRD Bab 6: Edit data keluarga/anggota — Kader & Admin)
 */
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { hitungUsia, klasifikasiSasaran } from "@/utils/zscoreCalculator";

export function KeluargaEdit() {
  const { kkId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { data, updateKeluarga } = useSipandu();

  const k = data.keluarga.find((x: any) => x.id === kkId);

  const [form, setForm] = useState(() => ({
    nomor_kk: k?.nomor_kk || "",
    nama_kepala_keluarga: k?.nama_kepala_keluarga || "",
    alamat: k?.alamat || "",
    rt: k?.rt || "13",
    rw: k?.rw || "06",
    kelurahan: k?.kelurahan || "Mojorejo",
    kecamatan: k?.kecamatan || "Junrejo",
  }));

  if (!k) {
    return <div className="p-8 text-center text-gray-500 text-sm">Keluarga tidak ditemukan.</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateKeluarga(k.id, {
      nomor_kk: form.nomor_kk,
      nama_kepala_keluarga: form.nama_kepala_keluarga,
      alamat: form.alamat,
      rt: form.rt,
      rw: form.rw,
      kelurahan: form.kelurahan,
      kecamatan: form.kecamatan,
    });
    showToast("Data keluarga berhasil diperbarui.", "success");
    navigate(`/keluarga/${k.id}`);
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/keluarga/${kkId}`} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Data Keluarga</h1>
          <p className="text-sm text-gray-500">KK {k.nomor_kk}</p>
        </div>
      </div>

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
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili</label>
          <input
            type="text"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">RT</label>
            <input
              type="text"
              required
              value={form.rt}
              onChange={(e) => setForm({ ...form, rt: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">RW</label>
            <input
              type="text"
              required
              value={form.rw}
              onChange={(e) => setForm({ ...form, rw: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kelurahan</label>
            <input value={form.kelurahan} onChange={(e) => setForm({ ...form, kelurahan: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kecamatan</label>
            <input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}

export function AnggotaEdit() {
  const { anggotaId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { data, updateAnggota } = useSipandu();

  const a = data.anggota.find((x: any) => x.id === anggotaId);

  const [form, setForm] = useState(() => ({
    nik: a?.nik || "",
    nama: a?.nama || "",
    jenis_kelamin: (a?.jenis_kelamin || "L") as "L" | "P",
    tanggal_lahir: a?.tanggal_lahir || "",
    hubungan_keluarga: a?.hubungan_keluarga || "Anak",
    status_hamil: Boolean(a?.status_hamil),
    hpht: a?.hpht || "",
  }));

  if (!a) {
    return <div className="p-8 text-center text-gray-500 text-sm">Anggota tidak ditemukan.</div>;
  }

  const usia = hitungUsia(form.tanggal_lahir);
  const klas = klasifikasiSasaran(usia, form.jenis_kelamin, form.status_hamil);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.tanggal_lahir) {
      const tgl = new Date(`${form.tanggal_lahir}T00:00:00`);
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

    await updateAnggota(a.id, {
      nik: form.nik,
      nama: form.nama,
      jenis_kelamin: form.jenis_kelamin,
      tanggal_lahir: form.tanggal_lahir,
      hubungan_keluarga: form.hubungan_keluarga,
      status_hamil: form.status_hamil,
      hpht: form.status_hamil ? form.hpht : null,
      kategori: klas.kode,
    });
    showToast("Data anggota berhasil diperbarui.", "success");
    navigate(`/anggota/${a.id}`);
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/anggota/${anggotaId}`} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Data Anggota</h1>
          <p className="text-sm text-gray-500">{a.nama} · Kategori baru: {klas.label}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">NIK (16 digit) *</label>
          <input
            type="text"
            required
            pattern="^\d{16}$"
            value={form.nik}
            onChange={(e) => setForm({ ...form, nik: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm font-mono outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
          <input
            type="text"
            required
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin *</label>
            <select
              value={form.jenis_kelamin}
              onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value as "L" | "P" })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            >
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
              value={form.tanggal_lahir}
              onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Hubungan Keluarga *</label>
          <select
            value={form.hubungan_keluarga}
            onChange={(e) => setForm({ ...form, hubungan_keluarga: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
          >
            {["Kepala Keluarga", "Istri", "Anak", "Menantu", "Cucu", "Orang Tua", "Mertua", "Saudara", "Pembantu", "Lainnya"].map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {form.jenis_kelamin === "P" && (
          <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-pink-900">
              <input
                type="checkbox"
                checked={form.status_hamil}
                onChange={(e) => setForm({ ...form, status_hamil: e.target.checked })}
                className="w-4 h-4 accent-pink-600"
              />
              Sedang Hamil (kategori menjadi Ibu Hamil)
            </label>
            {form.status_hamil && (
              <div>
                <label className="block text-xs font-bold text-pink-900 mb-1">HPHT (Hari Pertama Haid Terakhir) *</label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  value={form.hpht}
                  onChange={(e) => setForm({ ...form, hpht: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-pink-200 rounded-xl text-sm outline-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
