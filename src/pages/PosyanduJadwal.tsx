/**
 * SIPANDU - Jadwal Posyandu Bulanan
 * Identik dengan renderPosyanduJadwalView legacy.
 */
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Play, Users, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";

const JENIS_LABEL: Record<string, string> = {
  bulanan: "Bulanan",
  tambahan: "Tambahan",
  khusus: "Khusus",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Terjadwal", cls: "bg-gray-200 text-gray-600" },
  aktif: { label: "Sedang Berjalan", cls: "bg-emerald-100 text-emerald-700" },
  selesai: { label: "Selesai", cls: "bg-sky-100 text-sky-700" },
  dibatalkan: { label: "Dibatalkan", cls: "bg-rose-100 text-rose-700" },
};

// Pilihan target sasaran di form pra-mulai (kosong = ILP semua kategori).
const SASARAN_OPTIONS = ["bayi", "balita", "ibu_hamil", "lansia", "wus", "umum"];

export default function PosyanduJadwal() {
  const { showToast, currentUser } = useAuth();
  const navigate = useNavigate();
  const { data, tambahJadwal, updateJadwalStatus, tutupSesiHariH, sinkronkanDataKeCloud, isLoadingDb } = useSipandu();

  // Form pra-mulai: judul sesi + target sasaran, diisi dulu sebelum masuk Meja 1.
  const [showMulai, setShowMulai] = useState(false);
  const [mulaiJudul, setMulaiJudul] = useState("");
  const [mulaiMulai, setMulaiMulai] = useState(false);
  const [mulaiSasaran, setMulaiSasaran] = useState<string[]>([]);

  const roleMejaPath =
    currentUser?.peran === "super_admin"
      ? "/admin/meja1"
      : currentUser?.peran === "bidan"
        ? "/bidan/meja1"
        : "/kader/meja1";

  // Satu-satunya cara membuka sesi: tombol "Mulai Alur 5 Meja" membuka form
  // pra-mulai (judul + target sasaran), lalu sesi AKTIF hari ini dibuat dan
  // kader masuk Meja 1. Form "Buat Jadwal Baru" terpisah sudah dihapus.

  const sesiAktif = data.jadwal.find((j: any) => j.status === "aktif");
  const todayISO = new Date().toISOString().split("T")[0];

  const hadirPerJadwal = useMemo(() => {
    const sasaranMap = new Map<string, Set<string>>();
    const umumMap = new Map<string, Set<string>>();
    const anggotaMap = new Map<string, any>();
    data.anggota.forEach((a: any) => anggotaMap.set(a.id, a));

    [...data.kunjungan, ...data.kunjunganAktif].forEach((k: any) => {
      const jid = k.jadwal_posyandu_id || k.jadwal_id;
      if (!jid || !k.anggota_id) return;
      const ang = anggotaMap.get(k.anggota_id);
      if (ang?.kategori === "umum") {
        if (!umumMap.has(jid)) umumMap.set(jid, new Set());
        umumMap.get(jid)!.add(k.anggota_id);
      } else {
        if (!sasaranMap.has(jid)) sasaranMap.set(jid, new Set());
        sasaranMap.get(jid)!.add(k.anggota_id);
      }
    });

    const result = new Map<string, { hadirSasaran: number; hadirUmum: number; totalHadir: number }>();
    data.jadwal.forEach((j: any) => {
      const hadirSasaran = sasaranMap.get(j.id)?.size || 0;
      const hadirUmum = umumMap.get(j.id)?.size || 0;
      result.set(j.id, {
        hadirSasaran,
        hadirUmum,
        totalHadir: hadirSasaran + hadirUmum,
      });
    });
    return result;
  }, [data.kunjungan, data.kunjunganAktif, data.jadwal, data.anggota]);
  const totalSasaran = data.anggota.filter((a: any) => a.status_aktif && a.kategori !== "umum").length;

  function defaultJudul(): string {
    const bulan = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    return `Posyandu Bulanan — ${bulan}`;
  }

  // Form pra-mulai disubmit: pakai sesi aktif hari ini bila ada, bila tidak
  // buat baru (status aktif langsung). Sesi aktif lain ditutup via jalur resmi.
  async function handleMulaiAlur(e: React.FormEvent) {
    e.preventDefault();
    if (mulaiMulai) return;
    setMulaiMulai(true);
    try {
      const judul = mulaiJudul.trim() || defaultJudul();

      const adaAktifHariIni = data.jadwal.some((j: any) => j.status === "aktif" && j.tanggal === todayISO);
      if (!adaAktifHariIni) {
        // Selesaikan sesi aktif hari lain via jalur resmi (risiko absen, arsip,
        // sesiArsipId, audit CLOSE) — bukan sekadar flip status.
        const aktifLama = data.jadwal.find((j: any) => j.status === "aktif");
        if (aktifLama) {
          await tutupSesiHariH(aktifLama.id);
        }
        await tambahJadwal({ tanggal: todayISO, jenis: "bulanan", tema: judul, tempat: "Balai RW 06 Flamboyan", catatan: "", status: "aktif", sasaran: mulaiSasaran });
      }

      setShowMulai(false);
      navigate(roleMejaPath);
    } catch (e) {
      console.warn("Gagal memulai sesi:", e);
      showToast("Gagal memulai sesi. Coba lagi.", "danger");
    } finally {
      setMulaiMulai(false);
    }
  }

  // I2 (PRD F-05.2): daftar sasaran per kategori + prioritas
  // perKategori mencakup "umum" (pasien umum ikut terlihat); prioritas
  // tetap khusus sasaran program (bayi/balita/ibu_hamil/lansia/wus).
  const daftarSasaran = useMemo(() => {
    const aktifSemua = data.anggota.filter((a: any) => a.status_aktif);
    const sasaran = aktifSemua.filter((a: any) => a.kategori !== "umum");
    const perKategori: Record<string, any[]> = {};
    aktifSemua.forEach((a: any) => {
      (perKategori[a.kategori] = perKategori[a.kategori] || []).push(a);
    });

    // riwayat kehadiran per anggota (urut waktu)
    const hadirByAnggota = new Map<string, string[]>();
    [...data.kunjungan, ...data.kunjunganAktif].forEach((k: any) => {
      const list = hadirByAnggota.get(k.anggota_id) || [];
      list.push(k.waktu_hadir);
      hadirByAnggota.set(k.anggota_id, list);
    });

    const prioritas = sasaran
      .map((a: any) => {
        const riwayat = (hadirByAnggota.get(a.id) || []).sort();
        const pernahHadir = riwayat.length > 0;
        const kunTerakhir = [...data.kunjungan].reverse().find((k: any) => k.anggota_id === a.id);
        // C-07: risiko berbentuk objek {kode_risiko/kode/deskripsi/...}, bukan string.
        const is2T = Array.isArray(kunTerakhir?.risiko) && kunTerakhir.risiko.some((r: any) =>
          [r?.kode_risiko, r?.kode, r?.deskripsi, r?.judul].some((f: any) => String(f || "").includes("2T"))
        );
        if (is2T) {
          return { nama: a.nama, kategori: a.kategori, alasan: "Status 2T pada kunjungan terakhir" };
        }
        // Anggota baru (belum pernah hadir) butuh pendekatan, bukan "absen 2 sesi"
        if (!pernahHadir) {
          return { nama: a.nama, kategori: a.kategori, alasan: "Anggota baru — belum pernah hadir" };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 8);

    return { perKategori, prioritas };
  }, [data.anggota, data.kunjungan, data.kunjunganAktif]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Form pra-mulai: judul sesi + target sasaran, wajib diisi sebelum masuk Meja 1 */}
      {showMulai && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !mulaiMulai && setShowMulai(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Mulai Alur 5 Meja</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Isi judul sesi hari ini dan pilih target sasaran, lalu sesi langsung aktif dan kamu masuk ke Meja 1 (Registrasi).
                </p>
              </div>
            </div>
            <form onSubmit={handleMulaiAlur} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Sesi Hari Ini *</label>
                <input
                  type="text"
                  autoFocus
                  value={mulaiJudul}
                  onChange={(e) => setMulaiJudul(e.target.value)}
                  placeholder={defaultJudul()}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 text-sm outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Kosongkan untuk pakai judul default. Tanggal: {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Sasaran Warga</label>
                <div className="flex flex-wrap gap-2">
                  {SASARAN_OPTIONS.map((kat) => (
                    <label key={kat} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mulaiSasaran.includes(kat)}
                        onChange={(e) => {
                          if (e.target.checked) setMulaiSasaran((prev) => [...prev, kat]);
                          else setMulaiSasaran((prev) => prev.filter((k) => k !== kat));
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700 capitalize">{kat.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Biarkan kosong jika ini Posyandu umum (ILP semua kategori).</p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMulai(false)}
                  disabled={mulaiMulai}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mulaiMulai}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  {mulaiMulai ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {mulaiMulai ? "Memulai..." : "Buka Sesi & Mulai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Posyandu</h1>
          <p className="text-sm text-gray-500">Pelayanan Posyandu ILP Flamboyan RW 06 bulanan & khusus</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => sinkronkanDataKeCloud()}
            disabled={isLoadingDb}
            title="Klik untuk menyinkronkan data pemeriksaan sesi hari ini ke database cloud InsForge"
            className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold rounded-xl text-sm shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDb ? "animate-spin text-sky-600" : "text-sky-500"}`} />
            <span>{isLoadingDb ? "Menyinkronkan..." : "Sinkronkan ke Cloud"}</span>
          </button>
          {sesiAktif ? (
            <Link
              to={roleMejaPath}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Masuk Sesi Aktif
            </Link>
          ) : (
            <button
              onClick={() => {
                setMulaiJudul("");
                setMulaiSasaran([]);
                setShowMulai(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Mulai Alur 5 Meja
            </button>
          )}
        </div>
      </div>

      {/* I2: Ringkasan sasaran & prioritas pra-posyandu (PRD F-05.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-sky-600" /> Total Sasaran per Kategori</h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(daftarSasaran.perKategori).map(([kat, list]) => (
              <div key={kat} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-lg font-bold text-gray-900">{list.length}</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">{kat}</p>
              </div>
            ))}
            {Object.keys(daftarSasaran.perKategori).length === 0 && (
              <p className="text-gray-400 italic col-span-3">Belum ada sasaran terdaftar.</p>
            )}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm">Sasaran Prioritas (pra-posyandu)</h3>
          <div className="mt-3 space-y-1.5 text-xs">
            {daftarSasaran.prioritas.length === 0 ? (
              <p className="text-gray-400 italic">Tidak ada sasaran prioritas saat ini.</p>
            ) : (
              daftarSasaran.prioritas.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                  <span className="font-semibold text-gray-800">{p.nama} <span className="text-gray-400 font-normal">({p.kategori})</span></span>
                  <span className="text-[10px] font-bold text-amber-700">{p.alasan}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.jadwal.map((j: any) => {
          const tgl = new Date(j.tanggal);
          const st = STATUS_LABEL[j.status] || STATUS_LABEL.selesai;
          const stats = hadirPerJadwal.get(j.id) || { hadirSasaran: 0, hadirUmum: 0, totalHadir: 0 };
          const persen = totalSasaran > 0 ? Math.min(100, Math.round((stats.hadirSasaran / totalSasaran) * 100)) : 0;
          return (
            <div
              key={j.id}
              className={`bg-white p-5 rounded-2xl border ${j.status === "aktif" ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-100"} shadow-sm flex flex-col gap-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold ${j.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    <span className="text-2xl leading-none">{tgl.getDate()}</span>
                    <span className="text-[10px] uppercase">{tgl.toLocaleDateString("id-ID", { month: "short" })}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-sm">{j.tema || `Posyandu ${JENIS_LABEL[j.jenis] || ""} ${j.tanggal?.split("-")[0]}`}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${st.cls}`}>{st.label}</span>
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-full uppercase">{JENIS_LABEL[j.jenis] || j.jenis}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {new Date(`${j.tanggal}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      <span className="text-gray-300">·</span>
                      <MapPin className="w-3 h-3" /> {j.tempat}
                    </p>
                    {j.catatan && <p className="text-[11px] text-gray-500 mt-0.5">{j.catatan}</p>}
                  </div>
                </div>
                <div className="flex gap-2 self-stretch sm:self-auto shrink-0">
                  {j.status === "aktif" && (
                    <Link
                      to={roleMejaPath}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Masuk Alur 5 Meja
                    </Link>
                  )}
                  {j.status === "aktif" && (
                    <button
                      onClick={async () => {
                        await tutupSesiHariH(j.id);
                        showToast("Sesi posyandu ditutup & direkapitulasi.", "info");
                      }}
                      className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-xs"
                    >
                      Tutup
                    </button>
                  )}
                  {j.status === "selesai" && (
                    <button
                      onClick={async () => {
                        const activeSession = data.jadwal.find((s: any) => s.status === "aktif");
                        if (activeSession && activeSession.id !== j.id) {
                          showToast(
                            `Sesi "${activeSession.tema || activeSession.tanggal}" sedang aktif. Tutup sesi aktif terlebih dahulu sebelum membuka sesi ini.`,
                            "warning"
                          );
                          return;
                        }
                        await updateJadwalStatus(j.id, "aktif");
                        showToast(`Sesi "${j.tema || j.tanggal}" dibuka kembali (Status: Aktif). Membuka Meja 1.`, "success");
                        navigate(roleMejaPath);
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600" /> Buka Kembali
                    </button>
                  )}
                </div>
              </div>

              {/* Progress kehadiran per sesi (ref legacy posyandu) */}
              <div className="pt-1">
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tingkat Kehadiran</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-700">
                      {stats.hadirSasaran} <span className="text-gray-400 font-medium">/ {totalSasaran} sasaran</span>
                    </span>
                    {stats.hadirUmum > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded-full">
                        +{stats.hadirUmum} umum
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${j.status === "aktif" ? "bg-emerald-500" : "bg-gray-300"}`}
                    style={{ width: `${persen}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
