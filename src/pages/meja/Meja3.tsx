/**
 * SIPANDU - Meja 3: Pencatatan Digital
 * Dilengkapi Antrean Meja 3 Mandiri & Form Pencatatan Adaptif
 */
import React, { useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NotebookPen, CheckCircle2, ArrowRight } from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { maskNik } from "@/lib/utils";

function AntreanMeja3({ data, navigate }: { data: any; navigate: any }) {
  const { currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const list = data.kunjunganAktif;
  const sudahCatat = list.filter((k: any) => k.catatan && (k.catatan.keluhan || k.catatan.catatan_kader)).length;
  const siapCatat = list.filter((k: any) => k.pengukuran && (k.pengukuran.berat_badan || k.pengukuran.tinggi_badan)).length;

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
              const p = k.pengukuran;
              const c = k.catatan;
              const hasMeasure = Boolean(p && (p.berat_badan || p.tinggi_badan));
              const hasNotes = Boolean(c && (c.keluhan || c.catatan_kader));

              return (
                <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                  <div className="flex items-center gap-3.5">
                    <img src={a.foto || "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=150"} alt={a.nama} className="w-11 h-11 rounded-2xl object-cover border border-gray-200 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {hasNotes ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Dicatat
                          </span>
                        ) : hasMeasure ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full animate-pulse">
                            Siap Dicatat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full">
                            Menunggu Meja 2
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        NIK: {maskNik(a.nik)}
                        {hasMeasure ? ` · Hasil Meja 2: BB ${p.berat_badan || "—"} kg, TB ${p.tinggi_badan || "—"} cm (${p.status_gizi || "Normal"})` : " · Belum melakukan pengukuran antropometri di Meja 2"}
                      </p>
                      {hasNotes && c.keluhan && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">Keluhan: "{c.keluhan}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!hasMeasure && (
                      <button
                        onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                        className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold"
                      >
                        Ke Meja 2
                      </button>
                    )}
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
  const { data, updatePencatatan } = useSipandu();

  const anggota = data.anggota.find((a: any) => a.id === anggotaId);
  const activeVisit = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
  const c = activeVisit?.catatan || {};

  const isDirtyRef = useRef(false);
  const loadedAnggotaIdRef = useRef<string | undefined>(anggotaId);

  const [keluhan, setKeluhan] = useState<string>(c.keluhan || "");
  const [catatanKader, setCatatanKader] = useState<string>(c.catatan_kader || "");
  const [catatanBidan, setCatatanBidan] = useState<string>(c.catatan_bidan || "");
  const [temuan, setTemuan] = useState<string>(c.temuan || "");

  React.useEffect(() => {
    if (!anggotaId) return;

    if (loadedAnggotaIdRef.current !== anggotaId) {
      loadedAnggotaIdRef.current = anggotaId;
      isDirtyRef.current = false;
      const v = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
      const note = v?.catatan || {};
      setKeluhan(note.keluhan || "");
      setCatatanKader(note.catatan_kader || "");
      setCatatanBidan(note.catatan_bidan || "");
      setTemuan(note.temuan || "");
      return;
    }

    if (isDirtyRef.current) return;

    const v = data.kunjunganAktif.find((k: any) => k.anggota_id === anggotaId);
    const note = v?.catatan || {};
    if (note.keluhan || note.catatan_kader || note.catatan_bidan || note.temuan) {
      setKeluhan(note.keluhan || "");
      setCatatanKader(note.catatan_kader || "");
      setCatatanBidan(note.catatan_bidan || "");
      setTemuan(note.temuan || "");
    }
  }, [anggotaId, data.kunjunganAktif]);

  if (!anggota) {
    return <AntreanMeja3 data={data} navigate={navigate} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    isDirtyRef.current = false;
    await updatePencatatan(anggota.id, {
      keluhan,
      temuan,
      catatan_kader: catatanKader,
      catatan_bidan: catatanBidan,
    });
    showToast("Pencatatan Meja 3 tersimpan. Lanjut ke Meja 4.", "success");
    navigate(`${rolePrefix}/meja4/${anggota.id}`);
  }

  const p = activeVisit?.pengukuran || {};

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
          <div>
            <span className="text-gray-400">Status Gizi:</span>
            <p className="font-bold text-green-700">{p.status_gizi || "—"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Keluhan Utama Peserta / Orang Tua</label>
            <textarea
              rows={2}
              value={keluhan}
              onChange={(e) => {
                isDirtyRef.current = true;
                setKeluhan(e.target.value);
              }}
              placeholder="Misal: anak batuk pilek 3 hari, panas turun naik. Kosongkan bila tidak ada keluhan."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Temuan Pemeriksaan Kader</label>
            <textarea
              rows={2}
              value={temuan}
              onChange={(e) => {
                isDirtyRef.current = true;
                setTemuan(e.target.value);
              }}
              placeholder="Misal: tampak lesu, tidak ada ruam."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Catatan Kader</label>
            <textarea
              rows={2}
              value={catatanKader}
              onChange={(e) => {
                isDirtyRef.current = true;
                setCatatanKader(e.target.value);
              }}
              placeholder="Catatan tambahan kader (opsional)."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Catatan Tindak Lanjut Bidan (opsional)</label>
            <textarea
              rows={2}
              value={catatanBidan}
              onChange={(e) => {
                isDirtyRef.current = true;
                setCatatanBidan(e.target.value);
              }}
              placeholder="Tindak lanjut klinis atau pesan rujukan (diisi oleh Bidan)."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 text-sm outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <Link to={`${rolePrefix}/meja3`} className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs">
              ← Kembali ke Antrean Meja 3
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/20 transition">
              Simpan & Lanjut Meja 4 →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
