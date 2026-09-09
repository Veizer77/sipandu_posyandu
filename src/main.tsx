import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SipanduDataProvider } from "@/lib/data-store";
import { getRoleMenuPath, getRoleDashboardPath } from "@/lib/role-routes";
import AppShell from "@/components/layout/AppShell";
import RoleGuard from "@/components/layout/RoleGuard";
import ButuhSesi from "@/components/layout/ButuhSesi";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import KaderDashboardPage from "@/pages/dashboards/KaderDashboardPage";
import BidanDashboardPage from "@/pages/dashboards/BidanDashboardPage";
import PKKDashboardPage from "@/pages/dashboards/PKKDashboardPage";
import KadesDashboardPage from "@/pages/dashboards/KadesDashboardPage";
import AdminDashboardPage from "@/pages/dashboards/AdminDashboardPage";
import Meja1 from "@/pages/meja/Meja1";
import Meja2 from "@/pages/meja/Meja2";
import Meja3 from "@/pages/meja/Meja3";
import Meja4 from "@/pages/meja/Meja4";
import Meja5 from "@/pages/meja/Meja5";
import Rekap from "@/pages/meja/Rekap";
import KeluargaList from "@/pages/keluarga/KeluargaList";
import { KeluargaTambah, AnggotaTambah } from "@/pages/keluarga/KeluargaTambah";
import { KeluargaEdit, AnggotaEdit } from "@/pages/keluarga/KeluargaEdit";
import { KeluargaDetail, AnggotaDetail } from "@/pages/keluarga/KeluargaDetail";
import PosyanduJadwal from "@/pages/PosyanduJadwal";
import BidanVerifikasi from "@/pages/monitoring/BidanVerifikasi";
import BidanRisiko from "@/pages/monitoring/BidanRisiko";
import BidanImunisasi from "@/pages/monitoring/BidanImunisasi";
import Laporan from "@/pages/Laporan";
import IntegrasiSinduksadati from "@/pages/IntegrasiSinduksadati";
import { Pengaturan, Pengguna, AuditLog } from "@/pages/admin/Pengaturan";
import "./index.css";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Memeriksa sesi pengguna...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

function RoleRedirect({ path }: { path: string }) {
  const { currentRole, currentUser } = useAuth();
  const params = useParams();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Khusus 5 Meja: hanya kader, bidan, super_admin yang memiliki akses ke alur posyandu
  if (path.startsWith("/meja") || path.startsWith("/rekap")) {
    if (currentRole !== "kader" && currentRole !== "bidan" && currentRole !== "super_admin") {
      return <Navigate to={getRoleDashboardPath(currentRole)} replace />;
    }
  }

  // Khusus Pengaturan/Pengguna/Audit Log: hanya super_admin
  if (path.startsWith("/pengaturan") || path.startsWith("/pengguna") || path.startsWith("/audit-log")) {
    if (currentRole !== "super_admin") {
      return <Navigate to={getRoleDashboardPath(currentRole)} replace />;
    }
  }

  let target = getRoleMenuPath(path, currentRole);
  if (params.anggotaId) target = target.replace(":anggotaId", params.anggotaId);
  if (params.kkId) target = target.replace(":kkId", params.kkId);
  return <Navigate to={target} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <SipanduDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Smart Dashboard Redirector */}
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />

            {/* ======================================================== */}
            {/* 1. SUPER ADMIN ROLE-SPECIFIC ENDPOINTS (/admin/*)         */}
            {/* ======================================================== */}
            <Route path="/admin/dashboard" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><AdminDashboardPage /></RoleGuard></Protected>} />
            <Route path="/admin/posyandu" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><PosyanduJadwal /></RoleGuard></Protected>} />
            <Route path="/admin/meja1" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja1 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja2" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja2/:anggotaId" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja3" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja3/:anggotaId" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja4" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja4/:anggotaId" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/meja5" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Meja5 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/rekap" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><ButuhSesi><Rekap /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/admin/keluarga" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KeluargaList /></RoleGuard></Protected>} />
            <Route path="/admin/keluarga/tambah" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KeluargaTambah /></RoleGuard></Protected>} />
            <Route path="/admin/keluarga/:kkId" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KeluargaDetail /></RoleGuard></Protected>} />
            <Route path="/admin/keluarga/:kkId/edit" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KeluargaEdit /></RoleGuard></Protected>} />
            <Route path="/admin/keluarga/:kkId/tambah-anggota" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><AnggotaTambah /></RoleGuard></Protected>} />
            <Route path="/admin/anggota/:anggotaId" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><AnggotaDetail /></RoleGuard></Protected>} />
            <Route path="/admin/anggota/:anggotaId/edit" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><AnggotaEdit /></RoleGuard></Protected>} />
            <Route path="/admin/bidan/verifikasi" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanVerifikasi /></RoleGuard></Protected>} />
            <Route path="/admin/bidan/risiko" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanRisiko /></RoleGuard></Protected>} />
            <Route path="/admin/monitoring/bidan/risiko" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanRisiko /></RoleGuard></Protected>} />
            <Route path="/admin/bidan/imunisasi" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanImunisasi /></RoleGuard></Protected>} />
            <Route path="/admin/monitoring/bidan/imunisasi" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanImunisasi /></RoleGuard></Protected>} />
            <Route path="/admin/pkk/dashboard" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><PKKDashboardPage /></RoleGuard></Protected>} />
            <Route path="/admin/kades/dashboard" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KadesDashboardPage /></RoleGuard></Protected>} />
            <Route path="/admin/kader/dashboard" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><KaderDashboardPage /></RoleGuard></Protected>} />
            <Route path="/admin/bidan/dashboard" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><BidanDashboardPage /></RoleGuard></Protected>} />
            <Route path="/admin/laporan" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><Laporan /></RoleGuard></Protected>} />
            <Route path="/admin/integrasi" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><IntegrasiSinduksadati /></RoleGuard></Protected>} />
            <Route path="/admin/pengaturan" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><Pengaturan /></RoleGuard></Protected>} />
            <Route path="/admin/pengguna" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><Pengguna /></RoleGuard></Protected>} />
            <Route path="/admin/audit-log" element={<Protected><RoleGuard allowedRoles={["super_admin"]}><AuditLog /></RoleGuard></Protected>} />

            {/* ======================================================== */}
            {/* 2. KADER ROLE-SPECIFIC ENDPOINTS (/kader/*)              */}
            {/* ======================================================== */}
            <Route path="/kader/dashboard" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><KaderDashboardPage /></RoleGuard></Protected>} />
            <Route path="/kader/posyandu" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><PosyanduJadwal /></RoleGuard></Protected>} />
            <Route path="/kader/meja1" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja1 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja2" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja2/:anggotaId" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja3" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja3/:anggotaId" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja4" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja4/:anggotaId" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/meja5" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Meja5 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/rekap" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><ButuhSesi><Rekap /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/kader/keluarga" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><KeluargaList /></RoleGuard></Protected>} />
            <Route path="/kader/keluarga/tambah" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><KeluargaTambah /></RoleGuard></Protected>} />
            <Route path="/kader/keluarga/:kkId" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><KeluargaDetail /></RoleGuard></Protected>} />
            <Route path="/kader/keluarga/:kkId/edit" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><KeluargaEdit /></RoleGuard></Protected>} />
            <Route path="/kader/keluarga/:kkId/tambah-anggota" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><AnggotaTambah /></RoleGuard></Protected>} />
            <Route path="/kader/anggota/:anggotaId" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><AnggotaDetail /></RoleGuard></Protected>} />
            <Route path="/kader/anggota/:anggotaId/edit" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><AnggotaEdit /></RoleGuard></Protected>} />
            <Route path="/kader/laporan" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><Laporan /></RoleGuard></Protected>} />
            <Route path="/kader/integrasi" element={<Protected><RoleGuard allowedRoles={["kader", "super_admin"]}><IntegrasiSinduksadati /></RoleGuard></Protected>} />

            {/* ======================================================== */}
            {/* 3. BIDAN ROLE-SPECIFIC ENDPOINTS (/bidan/*)              */}
            {/* ======================================================== */}
            <Route path="/bidan/dashboard" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanDashboardPage /></RoleGuard></Protected>} />
            <Route path="/bidan/posyandu" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><PosyanduJadwal /></RoleGuard></Protected>} />
            <Route path="/bidan/meja1" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja1 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja2" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja2/:anggotaId" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja2 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja3" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja3/:anggotaId" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja3 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja4" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja4/:anggotaId" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja4 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/meja5" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Meja5 /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/rekap" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><ButuhSesi><Rekap /></ButuhSesi></RoleGuard></Protected>} />
            <Route path="/bidan/keluarga" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><KeluargaList /></RoleGuard></Protected>} />
            <Route path="/bidan/keluarga/tambah" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><KeluargaTambah /></RoleGuard></Protected>} />
            <Route path="/bidan/keluarga/:kkId" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><KeluargaDetail /></RoleGuard></Protected>} />
            <Route path="/bidan/keluarga/:kkId/tambah-anggota" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><AnggotaTambah /></RoleGuard></Protected>} />
            <Route path="/bidan/anggota/:anggotaId" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><AnggotaDetail /></RoleGuard></Protected>} />
            <Route path="/bidan/verifikasi" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanVerifikasi /></RoleGuard></Protected>} />
            <Route path="/bidan/risiko" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanRisiko /></RoleGuard></Protected>} />
            <Route path="/bidan/monitoring/risiko" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanRisiko /></RoleGuard></Protected>} />
            <Route path="/monitoring/bidan/risiko" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanRisiko /></RoleGuard></Protected>} />
            <Route path="/bidan/imunisasi" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanImunisasi /></RoleGuard></Protected>} />
            <Route path="/bidan/monitoring/imunisasi" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanImunisasi /></RoleGuard></Protected>} />
            <Route path="/monitoring/bidan/imunisasi" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><BidanImunisasi /></RoleGuard></Protected>} />
            <Route path="/bidan/laporan" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><Laporan /></RoleGuard></Protected>} />
            <Route path="/bidan/integrasi" element={<Protected><RoleGuard allowedRoles={["bidan", "super_admin"]}><IntegrasiSinduksadati /></RoleGuard></Protected>} />

            {/* ======================================================== */}
            {/* 4. KETUA TP PKK ROLE-SPECIFIC ENDPOINTS (/pkk/*)         */}
            {/* ======================================================== */}
            <Route path="/pkk/dashboard" element={<Protected><RoleGuard allowedRoles={["ketua_pkk", "super_admin"]}><PKKDashboardPage /></RoleGuard></Protected>} />
            <Route path="/pkk/keluarga" element={<Protected><RoleGuard allowedRoles={["ketua_pkk", "super_admin"]}><KeluargaList /></RoleGuard></Protected>} />
            <Route path="/pkk/keluarga/:kkId" element={<Protected><RoleGuard allowedRoles={["ketua_pkk", "super_admin"]}><KeluargaDetail /></RoleGuard></Protected>} />
            <Route path="/pkk/anggota/:anggotaId" element={<Protected><RoleGuard allowedRoles={["ketua_pkk", "super_admin"]}><AnggotaDetail /></RoleGuard></Protected>} />
            <Route path="/pkk/laporan" element={<Protected><RoleGuard allowedRoles={["ketua_pkk", "super_admin"]}><Laporan /></RoleGuard></Protected>} />

            {/* ======================================================== */}
            {/* 5. KEPALA DESA ROLE-SPECIFIC ENDPOINTS (/kades/*)        */}
            {/* ======================================================== */}
            <Route path="/kades/dashboard" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><KadesDashboardPage /></RoleGuard></Protected>} />
            <Route path="/kades/keluarga" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><KeluargaList /></RoleGuard></Protected>} />
            <Route path="/kades/keluarga/:kkId" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><KeluargaDetail /></RoleGuard></Protected>} />
            <Route path="/kades/anggota/:anggotaId" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><AnggotaDetail /></RoleGuard></Protected>} />
            <Route path="/kades/laporan" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><Laporan /></RoleGuard></Protected>} />
            <Route path="/kades/integrasi" element={<Protected><RoleGuard allowedRoles={["kepala_desa", "super_admin"]}><IntegrasiSinduksadati /></RoleGuard></Protected>} />

            {/* ======================================================== */}
            {/* 6. LEGACY & SHARED BASE ROUTE FALLBACKS                  */}
            {/* ======================================================== */}
            <Route path="/monitoring/pkk" element={<Navigate to="/pkk/dashboard" replace />} />
            <Route path="/monitoring/kades" element={<Navigate to="/kades/dashboard" replace />} />

            {/* Alur 5 Meja Base -> Dynamic Role Redirect */}
            <Route path="/meja1" element={<RoleRedirect path="/meja1" />} />
            <Route path="/meja2" element={<RoleRedirect path="/meja2" />} />
            <Route path="/meja2/:anggotaId" element={<RoleRedirect path="/meja2/:anggotaId" />} />
            <Route path="/meja3" element={<RoleRedirect path="/meja3" />} />
            <Route path="/meja3/:anggotaId" element={<RoleRedirect path="/meja3/:anggotaId" />} />
            <Route path="/meja4" element={<RoleRedirect path="/meja4" />} />
            <Route path="/meja4/:anggotaId" element={<RoleRedirect path="/meja4/:anggotaId" />} />
            <Route path="/meja5" element={<RoleRedirect path="/meja5" />} />
            <Route path="/rekap" element={<RoleRedirect path="/rekap" />} />

            {/* Master Data Base -> Dynamic Role Redirect */}
            <Route path="/keluarga" element={<RoleRedirect path="/keluarga" />} />
            <Route path="/keluarga/tambah" element={<RoleRedirect path="/keluarga/tambah" />} />
            <Route path="/keluarga/:kkId" element={<RoleRedirect path="/keluarga/:kkId" />} />
            <Route path="/keluarga/:kkId/edit" element={<RoleRedirect path="/keluarga/:kkId/edit" />} />
            <Route path="/keluarga/:kkId/tambah-anggota" element={<RoleRedirect path="/keluarga/:kkId/tambah-anggota" />} />
            <Route path="/anggota/:anggotaId" element={<RoleRedirect path="/anggota/:anggotaId" />} />
            <Route path="/anggota/:anggotaId/edit" element={<RoleRedirect path="/anggota/:anggotaId/edit" />} />
            <Route path="/posyandu" element={<RoleRedirect path="/posyandu" />} />

            {/* Pelaporan & Administrasi Base -> Dynamic Role Redirect */}
            <Route path="/laporan" element={<RoleRedirect path="/laporan" />} />
            <Route path="/integrasi" element={<RoleRedirect path="/integrasi" />} />
            <Route path="/pengaturan" element={<RoleRedirect path="/pengaturan" />} />
            <Route path="/pengguna" element={<RoleRedirect path="/pengguna" />} />
            <Route path="/audit-log" element={<RoleRedirect path="/audit-log" />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SipanduDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
