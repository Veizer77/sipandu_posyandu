import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users, UserCheck, ChartPie, ArrowUp, PlayCircle, TriangleAlert,
  ArrowRight, IdCard, Weight, NotebookPen, Syringe, Megaphone,
  List, Plus, ClipboardCheck, FileText
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";

function formatJadwal(jadwal: any) {
  if (!jadwal?.tanggal) return "Sabtu, 15 Agustus 2026 (Posyandu Rutin)";
  const dateStr = new Date(jadwal.tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${dateStr} · ${jadwal.tema || "Posyandu Rutin"}`;
}

export default function KaderDashboardPage() {
  const { currentUser } = useAuth();
  const { data } = useSipandu();
  const navigate = useNavigate();

  const totalSasaran = data.anggota.filter((a: any) => a.status_aktif && a.kategori !== "umum").length || data.anggota.length;
  const totalHadir = data.kunjunganAktif.length;
  const persenDS = totalSasaran > 0 ? Math.round((totalHadir / totalSasaran) * 100) : 0;

  const activeJadwal = data.jadwal.find((j: any) => j.status === "aktif") || data.jadwal[0];
  const allVisits = useMemo(() => [...data.kunjunganAktif, ...data.kunjungan], [data.kunjunganAktif, data.kunjungan]);

  const riskTargets = useMemo(() => {
    const list: Array<{
      id: string;
      nama: string;
      kategori: string;
      sub: string;
      tag: string;
      color: "red" | "amber" | "rose" | "blue";
      desc: string;
    }> = [];

    // 1. Balita
    const balitaList = data.anggota.filter((a: any) => a.kategori === "balita" || a.kategori === "bayi");
    balitaList.forEach((b: any) => {
      const v = allVisits.find((k: any) => k.anggota_id === b.id);
      const p = v?.pengukuran;
      let ageMonths = 0;
      if (b.tanggal_lahir) {
        ageMonths = Math.max(0, Math.floor((new Date().getTime() - new Date(b.tanggal_lahir).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
      }

      if (p?.z_score_bbu != null && p.z_score_bbu < -2) {
        list.push({
          id: b.id,
          nama: `${b.nama} (${ageMonths} bln)`,
          kategori: "balita",
          sub: `BB: ${p.berat_badan || "—"} kg · Z-Score BB/U: ${p.z_score_bbu.toFixed(1)} SD`,
          tag: p.z_score_bbu < -3 ? "GIZI BURUK / 2T" : "GIZI KURANG",
          color: "red",
          desc: "Berat badan di bawah garis standar. Perlu rujukan dan intervensi PMT Pemulihan.",
        });
      } else if (p?.z_score_tbu != null && p.z_score_tbu < -2) {
        list.push({
          id: b.id,
          nama: `${b.nama} (${ageMonths} bln)`,
          kategori: "balita",
          sub: `TB: ${p.tinggi_badan || "—"} cm · Z-Score TB/U: ${p.z_score_tbu.toFixed(1)} SD`,
          tag: "STUNTING",
          color: "amber",
          desc: "Tinggi/panjang badan di bawah -2 SD. Prioritas intervensi protein hewani & sanitasi.",
        });
      } else {
        list.push({
          id: b.id,
          nama: `${b.nama} (${ageMonths} bln)`,
          kategori: "balita",
          sub: "Balita Terdata RW 06 · Pantau KMS Digital",
          tag: "PEMANTAUAN BALITA",
          color: "amber",
          desc: "Balita dalam sasaran prioritas pemantauan tumbuh kembang dan imunisasi rutin.",
        });
      }
    });

    // 2. Bumil
    const bumilList = data.anggota.filter((a: any) => a.kategori === "ibu_hamil" || a.kategori === "bumil");
    bumilList.forEach((bm: any) => {
      const v = allVisits.find((k: any) => k.anggota_id === bm.id);
      const p = v?.pengukuran;
      list.push({
        id: bm.id,
        nama: bm.nama,
        kategori: "ibu_hamil",
        sub: p?.tekanan_darah_sistol ? `TD: ${p.tekanan_darah_sistol}/${p.tekanan_darah_diastol} mmHg` : "Ibu Hamil Terdata RW 06",
        tag: "BUMIL PRIORITAS",
        color: "rose",
        desc: "Sasaran prioritas antenatal care. Pantau tekanan darah, kenaikan BB, dan LILA (pencegahan KEK).",
      });
    });

    // 3. Lansia
    const lansiaList = data.anggota.filter((a: any) => a.kategori === "lansia");
    lansiaList.slice(0, 2).forEach((ls: any) => {
      list.push({
        id: ls.id,
        nama: ls.nama,
        kategori: "lansia",
        sub: "Skrining Penyakit Tidak Menular (PTM)",
        tag: "SKRINING LANSIA",
        color: "blue",
        desc: "Pemeriksaan rutin tekanan darah, kadar gula darah, dan kolesterol di Meja 4.",
      });
    });

    return list;
  }, [data.anggota, allVisits]);

  // First attendee waiting for Meja 3 & 4
  const firstWaitingId = data.kunjunganAktif[0]?.anggota_id;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Posyandu ILP Flamboyan RW 06</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Selamat Datang, {currentUser.nama_lengkap}</h1>
            <p className="text-sky-100 text-sm sm:text-base mt-1">
              Sesi Posyandu: <strong>{formatJadwal(activeJadwal)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/kader/meja1"
              className="px-5 py-3 bg-white text-sky-800 hover:bg-sky-50 active:bg-sky-100 font-semibold rounded-2xl shadow-md transition flex items-center gap-2"
            >
              <PlayCircle className="w-5 h-5 text-sky-600" />
              <span>Buka Alur 5 Meja</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Sasaran Terdaftar</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalSasaran}</h3>
            <p className="text-xs text-gray-500 mt-1">Balita, Bumil, Lansia & WUS (Database Riil)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sudah Hadir Hari Ini</p>
            <h3 className="text-3xl font-bold text-green-600 mt-1">{totalHadir}</h3>
            <p className="text-xs text-gray-500 mt-1">Check-in Meja 1 (Sesi Berjalan)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capaian D/S</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{persenDS}%</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" /> {totalHadir} dari {totalSasaran} Sasaran
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ChartPie className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Perhatian Khusus Sasaran Berisiko */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TriangleAlert className="w-5 h-5 text-rose-500" /> Perhatian Khusus Sasaran Prioritas & Berisiko
            </h2>
          </div>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            {riskTargets.length} Sasaran Terdeteksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {riskTargets.map((item) => {
            const colorClass =
              item.color === "red"
                ? "bg-red-50/70 border-red-200 hover:bg-red-50 text-red-700"
                : item.color === "amber"
                ? "bg-amber-50/70 border-amber-200 hover:bg-amber-50 text-amber-800"
                : item.color === "rose"
                ? "bg-rose-50/70 border-rose-200 hover:bg-rose-50 text-rose-700"
                : "bg-blue-50/70 border-blue-200 hover:bg-blue-50 text-blue-700";

            const badgeClass =
              item.color === "red"
                ? "bg-red-600 text-white"
                : item.color === "amber"
                ? "bg-amber-600 text-white"
                : item.color === "rose"
                ? "bg-rose-600 text-white"
                : "bg-blue-600 text-white";

            return (
              <div
                key={item.id}
                className={`p-4 border rounded-xl transition cursor-pointer ${colorClass}`}
                onClick={() => navigate(`/kader/anggota/${item.id}`)}
              >
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badgeClass}`}>{item.tag}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mt-2">{item.nama}</h4>
                <p className="text-xs font-semibold mt-0.5 opacity-90">{item.sub}</p>
                <p className="text-[11px] mt-1 line-clamp-2 opacity-80">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access 5 Meja */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Alur Layanan 5 Meja Posyandu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { to: "/kader/meja1", icon: IdCard, bg: "bg-green-100 text-green-700", meja: "Meja 1", label: "Registrasi" },
            { to: "/kader/meja2", icon: Weight, bg: "bg-blue-100 text-blue-700", meja: "Meja 2", label: "Pengukuran" },
            {
              to: firstWaitingId ? `/kader/meja3/${firstWaitingId}` : "/kader/meja1",
              icon: NotebookPen,
              bg: "bg-purple-100 text-purple-700",
              meja: "Meja 3",
              label: "Pencatatan",
            },
            {
              to: firstWaitingId ? `/kader/meja4/${firstWaitingId}` : "/kader/meja1",
              icon: Syringe,
              bg: "bg-amber-100 text-amber-700",
              meja: "Meja 4",
              label: "Pelayanan",
            },
            {
              to: "/kader/meja5",
              icon: Megaphone,
              bg: "bg-teal-100 text-teal-700",
              meja: "Meja 5",
              label: "Penyuluhan",
              span: "col-span-2 sm:col-span-1",
            },
          ].map((m) => (
            <Link
              key={m.meja}
              to={m.to}
              className={`p-4 bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-2xl text-center transition group shadow-sm ${m.span || ""}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition ${m.bg}`}>
                <m.icon className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{m.meja}</div>
              <div className="font-semibold text-gray-900 text-sm">{m.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Manajemen Data Penduduk</h3>
            <p className="text-xs text-gray-500 mt-1">
              {data.keluarga.length} Kartu Keluarga · {data.anggota.length} Jiwa Terdata (Database Riil)
            </p>
            <div className="mt-3 flex gap-2">
              <Link to="/keluarga" className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition flex items-center gap-1">
                <List className="w-3 h-3" /> Daftar Keluarga
              </Link>
              <Link to="/keluarga/tambah" className="px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-semibold transition flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah KK
              </Link>
            </div>
          </div>
          <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Rekapitulasi & Pelaporan</h3>
            <p className="text-xs text-gray-500 mt-1">Laporan Bulanan PDF, L-01 s/d L-08 Otomatis</p>
            <div className="mt-3 flex gap-2">
              <Link to="/rekap" className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition flex items-center gap-1">
                <ClipboardCheck className="w-3 h-3" /> Rekap Sesi
              </Link>
              <Link to="/laporan" className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1">
                <FileText className="w-3 h-3" /> Cetak Laporan PDF
              </Link>
            </div>
          </div>
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
}
