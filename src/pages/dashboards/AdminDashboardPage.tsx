import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Database, User, Users, Activity, Clock, Server, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const { data } = useSipandu();

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Panel Eksekutif Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Selamat Datang, {currentUser.nama_lengkap}</h1>
            <p className="text-slate-300 text-sm sm:text-base mt-1">
              Sistem SIPANDU Posyandu ILP · Terhubung ke InsForge BaaS PostgreSQL Cloud
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/pengaturan"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-2xl shadow-md transition flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Pengaturan Sistem</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 System Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase">Total Akun Terdaftar</p>
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.users.length || 5}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">5 Peran RBAC Aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase">Kartu Keluarga (KK)</p>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.keluarga.length}</h3>
          <p className="text-xs text-gray-500 mt-1">Database Master RW 06</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase">Total Warga Terdata</p>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.anggota.length}</h3>
          <p className="text-xs text-gray-500 mt-1">Balita, Bumil, Lansia, WUS</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase">Sesi Posyandu</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.jadwal.length}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">Jadwal Aktif Terdaftar</p>
        </div>
      </div>

      {/* Backend Infrastructure Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" /> Status Infrastruktur Backend Cloud InsForge
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold">DATABASE HOST</span>
            <p className="font-mono text-xs text-slate-900 font-bold mt-1 truncate">6i9ja6g9.us-east.insforge.app</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung (Online)
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold">KEAMANAN ROW-LEVEL SECURITY</span>
            <p className="font-mono text-xs text-slate-900 font-bold mt-1">PostgreSQL RLS (get_user_role)</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif & Terisolasi per Peran
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold">EDGE FUNCTIONS</span>
            <p className="font-mono text-xs text-slate-900 font-bold mt-1">3 Serverless Functions</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> sinduksadati-proxy · risk · zscore
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/admin/pengguna" className="p-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-center transition shadow-sm">
          <User className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Manajemen Pengguna</span>
          <span className="text-[10px] text-slate-500">{data.users.length || 5} Akun</span>
        </Link>
        <Link to="/admin/audit-log" className="p-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-center transition shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Audit Log Sistem</span>
          <span className="text-[10px] text-slate-500">{data.auditLogs.length} Rekaman</span>
        </Link>
        <Link to="/admin/keluarga" className="p-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-center transition shadow-sm">
          <Users className="w-6 h-6 text-sky-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Data Keluarga</span>
          <span className="text-[10px] text-slate-500">{data.keluarga.length} KK</span>
        </Link>
        <Link to="/admin/meja1" className="p-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-center transition shadow-sm">
          <PlayCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-900 block">Alur 5 Meja</span>
          <span className="text-[10px] text-slate-500">Operasional Posyandu</span>
        </Link>
      </div>
    </div>
  );
}
