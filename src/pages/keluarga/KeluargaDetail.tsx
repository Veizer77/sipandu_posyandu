/**
 * SIPANDU - Detail KK + Detail Anggota
 * Identik dengan renderKeluargaDetailView & renderAnggotaDetailView legacy.
 */
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus, ChartLine, Link2, Calendar, FileText, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { hitungUsia, klasifikasiSasaran, hitungHPL } from "@/utils/zscoreCalculator";
import { statusImunisasi, type ImunisasiStatusItem } from "@/utils/jadwalImunisasi";
import { CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { maskNik, formatTanggalSingkat } from "@/lib/utils";

export function KeluargaDetail() {
  const { kkId } = useParams();
  const navigate = useNavigate();
  const { data } = useSipandu();
  const kk = data.keluarga.find((k: any) => k.id === kkId);
  if (!kk) {
    navigate("/keluarga");
    return null;
  }
  const anggota = data.anggota.filter((a: any) => a.keluarga_id === kk.id);
  const sdti = data.sinduksadatiMaster.find((s: any) => s.linked_sipandu_anggota_id === "kepala-kk-" + kk.id) || null;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/keluarga" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Detail Kartu Keluarga</h1>
          <p className="text-sm text-gray-500">KK {kk.nomor_kk} · Kepala: {kk.nama_kepala_keluarga}</p>
        </div>
        <Link to={`/keluarga/${kk.id}/edit`} className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
          Edit
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="Nomor KK" value={<span className="font-mono">{kk.nomor_kk}</span>} />
          <Field label="Kepala Keluarga" value={kk.nama_kepala_keluarga} />
          <Field label="Alamat" value={kk.alamat} />
          <Field label="RT/RW" value={`RT ${kk.rt} / RW ${kk.rw}`} />
          <Field label="Kelurahan" value={kk.kelurahan} />
          <Field label="Kecamatan" value={kk.kecamatan} />
        </div>
        {kk.sinduksadati_keluarga_id && (
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-green-700 font-semibold">
            <Link2 className="w-3.5 h-3.5" /> Terhubung dengan master SINDUKSADATI (ID: {kk.sinduksadati_keluarga_id})
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Daftar Anggota ({anggota.length} Jiwa)</h2>
          <Link to={`/keluarga/${kk.id}/tambah-anggota`} className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Tambah Anggota
          </Link>
        </div>
        <div className="space-y-2">
          {anggota.map((a: any) => {
            const u = hitungUsia(a.tanggal_lahir);
            return (
              <Link
                key={a.id}
                to={`/anggota/${a.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                <Avatar nama={a.nama} className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{a.nama}</p>
                  <p className="text-[11px] text-gray-500">
                    NIK {maskNik(a.nik)} · {a.hubungan_keluarga} · {u ? u.usiaTeks : ""}
                  </p>
                </div>
                <CategoryBadge kategori={a.kategori} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

export function AnggotaDetail() {
  const { anggotaId } = useParams();
  const { showToast } = useAuth();
  const { data, selesaikanKehamilan } = useSipandu();
  const { currentRole } = useAuth();
  const a = data.anggota.find((x: any) => x.id === anggotaId);
  if (!a) {
    return <div className="p-8 text-center text-gray-500">Anggota tidak ditemukan.</div>;
  }
  // PRD 39.2: data kesehatan per individu hanya untuk kader/bidan/admin — PKK/Kades lihat agregat saja
  const canSeeClinical = ["kader", "bidan", "super_admin"].includes(currentRole);
  const usia = hitungUsia(a.tanggal_lahir);
  const klas = klasifikasiSasaran(usia, a.jenis_kelamin, a.status_hamil);
  const kunjungan = data.kunjungan.filter((k: any) => k.anggota_id === a.id);
  const activeVisit = data.kunjunganAktif.find((k: any) => k.anggota_id === a.id);
  const keluarga = data.keluarga.find((k: any) => k.id === a.keluarga_id);
  const hplInfo = a.status_hamil ? hitungHPL(a.hpht) : null;

  async function handleSelesaikanKehamilan() {
    await selesaikanKehamilan(a.id);
    showToast("Kehamilan diselesaikan. Kategori anggota dikembalikan sesuai usia.", "success");
  }
  const bbHistory = kunjungan.filter((k: any) => k.pengukuran?.berat_badan).map((k: any) => ({
    tanggal: k.waktu_hadir,
    bb: k.pengukuran.berat_badan,
    status: k.pengukuran.status_gizi,
  }));

  // B4: status imunisasi real dari data pelayanan + jadwal PRD Bab 10
  const isAnakAnggota = a.kategori === "bayi" || a.kategori === "balita";
  const diberikanSet = new Set<string>();
  [...kunjungan, ...(activeVisit ? [activeVisit] : [])].forEach((k: any) => {
    (k?.pelayanan?.imunisasi || []).forEach((j: string) => diberikanSet.add(j));
  });
  const imunisasiStatus: ImunisasiStatusItem[] = isAnakAnggota
    ? statusImunisasi(usia?.totalBulan || 0, Array.from(diberikanSet))
    : [];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to={`/keluarga/${a.keluarga_id}`} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Lengkap Anggota</h1>
          <p className="text-sm text-gray-500">Profil komprehensif + riwayat pertumbuhan (KMS) + imunisasi</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5">
        <Avatar nama={a.nama} className="w-24 h-24 rounded-3xl text-2xl" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge kategori={a.kategori} />
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{usia ? usia.usiaTeks : ""}</span>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">{usia?.hariLahir}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-1.5">{a.nama}</h2>
          <p className="text-xs text-gray-500">NIK {maskNik(a.nik)} · {a.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {klas.label}</p>
          <p className="text-xs text-gray-500">Keluarga: {keluarga?.nama_kepala_keluarga} (RT {keluarga?.rt}/RW {keluarga?.rw})</p>
          <Link to={`/anggota/${a.id}/edit`} className="mt-3 inline-block px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
            Edit Data Anggota
          </Link>
        </div>
      </div>

      {/* F2: kartu kehamilan aktif */}
      {a.status_hamil && (
        <div className="bg-pink-50 p-6 rounded-3xl border border-pink-200 shadow-sm">
          <h3 className="font-bold text-pink-900 mb-2 flex items-center gap-2"><Heart className="w-4 h-4" /> Kehamilan Aktif</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-pink-400 font-semibold uppercase">HPHT</p>
              <p className="font-bold text-pink-900 mt-0.5">{a.hpht ? formatTanggalSingkat(a.hpht) : "—"}</p>
            </div>
            <div>
              <p className="text-pink-400 font-semibold uppercase">Usia Kehamilan</p>
              <p className="font-bold text-pink-900 mt-0.5">{hplInfo ? `${hplInfo.usiaMinggu} minggu` : "—"}</p>
            </div>
            <div>
              <p className="text-pink-400 font-semibold uppercase">Taksiran Persalinan</p>
              <p className="font-bold text-pink-900 mt-0.5">{hplInfo ? hplInfo.hplFormatted : "—"}</p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSelesaikanKehamilan}
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-[11px] shadow-sm"
              >
                Selesaikan Kehamilan
              </button>
            </div>
          </div>
        </div>
      )}

      {canSeeClinical && (a.kategori === "bayi" || a.kategori === "balita") && bbHistory.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><ChartLine className="w-4 h-4" /> Kurva Pertumbuhan KMS</h3>
          <div className="h-48 flex items-end gap-2 px-2">
            {bbHistory.slice(-12).map((h: any, i: number) => {
              const max = Math.max(...bbHistory.map((x: any) => x.bb));
              const min = Math.min(...bbHistory.map((x: any) => x.bb));
              const range = max - min || 1;
              const hPct = ((h.bb - min) / range) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-700">{h.bb}kg</span>
                  <div className="w-full bg-emerald-500 rounded-t-md" style={{ height: `${Math.max(hPct, 5)}%` }} />
                  <span className="text-[10px] text-gray-400">{new Date(h.tanggal).toLocaleDateString("id-ID", { month: "short" })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canSeeClinical ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Riwayat Kunjungan</h3>
            <div className="space-y-2 text-xs">
              {kunjungan.length === 0 ? (
                <p className="text-gray-400 italic">Belum ada kunjungan</p>
              ) : (
                kunjungan.slice(0, 6).map((k: any) => (
                  <div key={k.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="font-semibold text-gray-800">{new Date(k.waktu_hadir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="text-gray-500">BB: {k.pengukuran?.berat_badan || "—"} kg · Status: {k.pengukuran?.status_gizi || "—"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Jadwal Imunisasi</h3>
            <div className="space-y-1.5 text-xs">
              {imunisasiStatus.length === 0 ? (
                <p className="text-gray-400 italic">Jadwal imunisasi tersedia untuk kategori Bayi/Balita.</p>
              ) : (
                imunisasiStatus.map((item) => {
                  const badgeCls =
                    item.status === "sudah"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "terlambat"
                      ? "bg-rose-100 text-rose-700"
                      : item.status === "jatuh_tempo"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500";
                  const label =
                    item.status === "sudah"
                      ? "Sudah"
                      : item.status === "terlambat"
                      ? "Terlambat"
                      : item.status === "jatuh_tempo"
                      ? "Jatuh Tempo"
                      : "Belum";
                  return (
                    <div key={item.jenis.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <span className="font-medium text-gray-700">
                        {item.jenis.label}
                        {item.jenis.keterangan && <span className="text-gray-400 font-normal"> · {item.jenis.keterangan}</span>}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeCls}`}>{label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold">
          Riwayat kunjungan, pertumbuhan, dan imunisasi tersembunyi untuk peran Anda (PRD 39.2: data kesehatan per individu hanya untuk Kader/Bidan/Admin).
        </div>
      )}
    </div>
  );
}
