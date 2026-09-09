/**
 * SIPANDU - Gate Sesi Posyandu (Alur 5 Meja)
 * Menjaga alur 5 Meja agar hanya beroperasi jika ada sesi posyandu yang berstatus "aktif".
 * Menghilangkan auto-aktivasi diam-diam dan magic number slice.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX2, Calendar, PlayCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";

export function useSesiAktif(): any | null {
  const { data } = useSipandu();
  // Hanya kembalikan jadwal yang eksplisit berstatus "aktif"
  return data.jadwal.find((j: any) => j.status === "aktif") || null;
}

export default function ButuhSesi({ children }: { children: React.ReactNode }) {
  const { data, updateJadwalStatus, tambahJadwal, isLoadingDb } = useSipandu();
  const { currentUser, showToast } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  // Cari sesi yang berstatus "aktif"
  const sesiAktif = data.jadwal.find((j: any) => j.status === "aktif");

  // Tunggu sinkronisasi awal DB jika jadwal masih kosong dan DB sedang loading
  if (isLoadingDb && !sesiAktif && data.jadwal.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Memeriksa status sesi posyandu...</p>
      </div>
    );
  }

  // Jika tidak ada sesi aktif, tampilkan gate info ramah pengguna tanpa auto-aktivasi diam-diam
  if (!sesiAktif) {
    const rolePrefix =
      currentUser?.peran === "super_admin"
        ? "/admin"
        : currentUser?.peran === "bidan"
        ? "/bidan"
        : "/kader";
    const jadwalUrl = `${rolePrefix}/jadwal`;

    const handleMulaiSesiHariIni = async () => {
      setIsStarting(true);
      try {
        const todayISO = new Date().toISOString().split("T")[0];
        const bulan = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        const existingToday = data.jadwal.find((j: any) => j.tanggal === todayISO);
        if (existingToday) {
          await updateJadwalStatus(existingToday.id, "aktif");
          showToast(`Sesi "${existingToday.tema || existingToday.tanggal}" telah diaktifkan.`, "success");
        } else {
          await tambahJadwal({
            tanggal: todayISO,
            jenis: "bulanan",
            tema: `Posyandu Balita & ILP — ${bulan}`,
            tempat: "Balai RW 06 Flamboyan",
            status: "aktif",
          });
          showToast("Sesi posyandu hari ini berhasil dibuat dan diaktifkan.", "success");
        }
      } catch (err) {
        console.error("Gagal memulai sesi:", err);
        showToast("Gagal mengaktifkan sesi posyandu", "danger");
      } finally {
        setIsStarting(false);
      }
    };

    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <CalendarX2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Belum Ada Sesi Posyandu Aktif</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Pelayanan alur 5 Meja memerlukan sesi posyandu yang berstatus <span className="font-bold text-emerald-600">Aktif</span>. Silakan pilih jadwal untuk diaktifkan atau mulai sesi posyandu hari ini secara eksplisit.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleMulaiSesiHariIni}
              disabled={isStarting}
              className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2"
            >
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {isStarting ? "Mengaktifkan..." : "Mulai Sesi Hari Ini"}
            </button>
            <Link
              to={jadwalUrl}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Kelola Jadwal
            </Link>
            <Link
              to={`${rolePrefix}/dashboard`}
              className="w-full sm:w-auto px-5 py-2.5 text-gray-500 hover:text-gray-700 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
