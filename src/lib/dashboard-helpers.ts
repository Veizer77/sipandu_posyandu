import { useMemo } from "react";

export function formatJadwal(jadwal: any) {
  if (!jadwal?.tanggal) return "Sabtu, 15 Agustus 2026 (Posyandu Rutin)";
  const dateStr = new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${dateStr} A� ${jadwal.tema || "Posyandu Rutin"}`;
}

/**
 * Deskripsi wilayah posyandu dari data DB (toleran dua bentuk: row DB
 * `nama/desa/kecamatan/kota` maupun default state `nama_posyandu/desa_kelurahan`).
 * Menggantikan hardcode "Dusun Krajan" agar konsisten dengan profil posyandu.
 */
export function formatWilayahPosyandu(posyandu: any): {
  nama: string;
  desa: string;
  kecamatan: string;
  kota: string;
  ringkas: string;
} {
  const nama = posyandu?.nama || posyandu?.nama_posyandu || "Posyandu ILP Flamboyan RW 06";
  const desa = posyandu?.desa || posyandu?.desa_kelurahan || "Mojorejo";
  const kecamatan = posyandu?.kecamatan || "Junrejo";
  const kota = posyandu?.kota || posyandu?.kabupaten_kota || "Kota Batu";
  return {
    nama,
    desa,
    kecamatan,
    kota,
    ringkas: `Desa ${desa}, Kec. ${kecamatan}, ${kota}`,
  };
}

export function useRTDistribution(keluargaList: any[], anggotaList: any[], kunjunganList: any[]) {
  return useMemo(() => {
    const map: Record<string, { kk: number; jiwa: number; hadir: number }> = {};

    keluargaList.forEach((k: any) => {
      const rtKey = k.rt ? String(k.rt).padStart(2, "0") : "14";
      if (!map[rtKey]) {
        map[rtKey] = { kk: 0, jiwa: 0, hadir: 0 };
      }
      map[rtKey].kk += 1;
      const members = anggotaList.filter((a: any) => a.keluarga_id === k.id);
      map[rtKey].jiwa += members.length;
      const memberIds = new Set(members.map((m: any) => m.id));
      const hadirCount = kunjunganList.filter((v: any) => memberIds.has(v.anggota_id)).length;
      map[rtKey].hadir += hadirCount;
    });

    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([rt, stat]) => {
      const pct = stat.jiwa > 0 ? Math.round((stat.hadir / stat.jiwa) * 100) : 0;
      // CATATAN AUDIT: sebelumnya ada fallback pct fiktif (72 + rt%12*1.8) saat
      // hadir=0, sehingga dashboard PKK/Kades menampilkan cakupan karangan.
      // Kini pct = nilai riil (0 bila belum ada kehadiran) + flag belumAdaData
      // agar UI dapat menampilkan "—" alih-alih angka menyesatkan.
      return {
        rt,
        label: `RT ${rt} (RW 06)`,
        kk: stat.kk,
        jiwa: stat.jiwa,
        hadir: stat.hadir,
        pct,
        belumAdaData: stat.hadir === 0,
      };
    });
  }, [keluargaList, anggotaList, kunjunganList]);
}
