/**
 * SIPANDU - Layout Shell
 * Kerangka aplikasi: glass topbar + sidebar RBAC + bottom nav mobile.
 * Identik dengan struktur index.html legacy (plek ketiplek).
 */
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Home, Users, Menu, X,
  LogOut, FileText, Network, CalendarDays, UserPlus, Settings, ShieldCheck,
  LogIn, Clipboard, CheckSquare, Building2, Shield,
  Stethoscope, AlertTriangle, Syringe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, useAuth } from "@/lib/auth-context";
import { getRoleDashboardPath, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import type { UserRole } from "@/types";

interface MenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  accent?: string;
  group?: string;
}

const MENU: MenuItem[] = [
  // Utama
  { to: "/dashboard", label: "Dashboard", icon: Home, group: "Utama" },
  // Sesi Hari H (alur 5 meja hidup di halaman Jadwal, bukan di sidebar — ref legacy)
  { to: "/posyandu", label: "Pelayanan (Hari H)", icon: CalendarDays, group: "Utama", roles: ["kader", "super_admin", "bidan"] },
  // Data Master RW 06
  { to: "/keluarga", label: "Data Keluarga (KK)", icon: Users, group: "Data Master RW 06", roles: ["kader", "super_admin", "bidan", "ketua_pkk", "kepala_desa"] },
  { to: "/keluarga/tambah", label: "Tambah Keluarga", icon: UserPlus, group: "Data Master RW 06", roles: ["kader", "super_admin", "bidan"] },
  // Monitoring & Validasi
  { to: "/bidan/verifikasi", label: "Verifikasi Kunjungan", icon: Clipboard, group: "Monitoring & Validasi", roles: ["bidan", "super_admin"] },
  { to: "/monitoring/bidan/risiko", label: "Sasaran Berisiko", icon: AlertTriangle, group: "Monitoring & Validasi", roles: ["bidan", "super_admin"] },
  { to: "/monitoring/bidan/imunisasi", label: "Status Imunisasi", icon: Syringe, group: "Monitoring & Validasi", roles: ["bidan", "super_admin"] },
  { to: "/pkk/dashboard", label: "Monitoring TP PKK", icon: CheckSquare, group: "Monitoring & Validasi", roles: ["super_admin"], accent: "purple" },
  { to: "/kades/dashboard", label: "Monitoring Kades", icon: Building2, group: "Monitoring & Validasi", roles: ["super_admin"], accent: "amber" },
  { to: "/kader/dashboard", label: "Posyandu Kader", icon: LogIn, group: "Monitoring & Validasi", roles: ["super_admin"] },
  { to: "/bidan/dashboard", label: "Monitoring Bidan", icon: Stethoscope, group: "Monitoring & Validasi", roles: ["super_admin"] },
  // Pelaporan
  { to: "/laporan", label: "Laporan Bulanan PDF", icon: FileText, group: "Pelaporan", roles: ["kader", "bidan", "super_admin", "ketua_pkk", "kepala_desa"] },
  // Ekosistem
  { to: "/integrasi", label: "SINDUKSADATI", icon: Network, group: "Ekosistem RW 06", roles: ["super_admin", "kader", "bidan", "kepala_desa"] },
  // Administrasi
  { to: "/pengaturan", label: "Profil Posyandu", icon: Settings, group: "Administrasi Sistem", roles: ["super_admin"] },
  { to: "/pengguna", label: "Pengguna & Peran", icon: Shield, group: "Administrasi Sistem", roles: ["super_admin"] },
  { to: "/audit-log", label: "Audit Log", icon: ShieldCheck, group: "Administrasi Sistem", roles: ["super_admin"] },
];

function isRouteActive(currentPath: string, targetPath: string): boolean {
  if (targetPath.endsWith("/dashboard")) {
    return currentPath === targetPath;
  }
  if (targetPath.endsWith("/keluarga/tambah")) {
    return currentPath.endsWith("/keluarga/tambah");
  }
  if (targetPath.endsWith("/keluarga")) {
    return (
      (currentPath.includes("/keluarga") && !currentPath.includes("/keluarga/tambah")) ||
      currentPath.includes("/anggota")
    );
  }
  if (targetPath.includes("/meja")) {
    return currentPath.startsWith(targetPath);
  }
  return currentPath === targetPath || currentPath.startsWith(targetPath + "/");
}

const GROUPS = ["Utama", "Data Master RW 06", "Monitoring & Validasi", "Pelaporan", "Ekosistem RW 06", "Administrasi Sistem"];

const NOTIF_ICON: Record<string, string> = { danger: "bg-rose-500", warning: "bg-amber-500", info: "bg-sky-500", success: "bg-emerald-500" };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole, logout, toast } = useAuth();
  const { refreshFromDb, data, tandaiSemuaNotifikasiDibaca } = useSipandu();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync foto profil terpusat yang dikelola oleh Admin
  const userRecord = (data?.users || []).find((u: any) =>
    (currentUser?.id && u.id === currentUser.id) ||
    (currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
    u.peran === currentRole
  );
  const userPhoto = userRecord?.foto || currentUser?.foto;

  const notifikasi = (useSipanduStoreSafe() || []).slice(0, 20);
  const unread = notifikasi.filter((n: any) => !n.dibaca).length;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // R2 (J2): polling ringan notifikasi/verifikasi tiap 45 detik saat app aktif terlihat
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshFromDb(true).catch(() => undefined);
      }
    }, 45_000);
    return () => clearInterval(interval);
  }, [refreshFromDb]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden antialiased text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {/* ===== TOPBAR ===== */}
      <header
        id="app-navbar"
        className="glass-header shrink-0 z-40 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between no-print"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            className="lg:hidden w-10 h-10 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <NavLink to={getRoleDashboardPath(currentRole)} className="flex items-center gap-3 group">
            <img src="/logo/logo_with_teks.png" alt="SIPANDU Posyandu ILP Flamboyan" className="h-10 w-auto object-contain hidden sm:block" />
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/logo/logo_only.png" alt="SIPANDU" className="h-9 w-auto object-contain" />
              <div>
                <span className="font-extrabold text-base tracking-tight text-sky-700 leading-none block">SIPANDU</span>
                <span className="text-[10px] text-slate-500 font-medium">RW 06 Mojorejo</span>
              </div>
            </div>
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Database Live Status Indicator */}
          <div className="flex items-center gap-2">
            <span
              title="Terkoneksi langsung ke database live InsForge Cloud PostgreSQL RW 06 Mojorejo"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              InsForge Cloud Live
            </span>
          <div ref={notifRef} className="relative">
            <button
              className="relative w-10 h-10 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                  {unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Notifikasi Sistem</h4>
                  <button
                    className="text-xs text-sky-600 hover:underline font-semibold"
                    onClick={tandaiSemuaNotifikasiDibaca}
                  >
                    Tandai Semua Dibaca
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifikasi.map((n) => (
                    <div key={n.id} className={cn("p-3.5 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition", !n.dibaca && "bg-sky-50/40")}>
                      <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", NOTIF_ICON[n.tipe] || "bg-slate-400")} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{n.judul}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.pesan}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.tanggal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Profile Pill - Foto dikelola terpusat lewat Admin */}
          <div
            title="Foto profil resmi petugas dikelola terpusat oleh Admin Posyandu."
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 cursor-default"
          >
            {userPhoto ? (
              <img src={userPhoto} alt={currentUser.nama_lengkap} className="w-9 h-9 rounded-full object-cover border border-sky-500 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.nama_lengkap.slice(0, 1)}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="font-bold text-xs text-slate-900 leading-tight">{currentUser.nama_lengkap}</div>
              <div className="text-[10px] text-sky-700 font-semibold leading-tight">{ROLE_LABEL[currentRole]}</div>
            </div>
            <button onClick={handleLogout} title="Keluar / Ganti Akun" className="text-slate-400 hover:text-rose-600 p-1.5 transition text-xs" aria-label="Keluar">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>      {/* ===== MAIN WRAPPER ===== */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <aside id="app-sidebar" className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white p-4 space-y-6 overflow-y-auto no-print">
          {GROUPS.map((g) => {
            const items = MENU.filter((m) => (m.group || "") === g && (!m.roles || m.roles.includes(currentRole)));
            if (items.length === 0) return null;
            return (
              <div key={g} className="space-y-1">
                <p className={cn("px-3 text-[10px] font-bold uppercase tracking-wider mb-2", g === "Ekosistem RW 06" ? "text-emerald-600" : "text-slate-400")}>
                  {g}
                </p>
                {items.map((m) => {
                  const targetPath = getRoleMenuPath(m.to, currentRole);
                  const isActive = isRouteActive(location.pathname, targetPath);
                  return (
                    <NavLink
                      key={m.to}
                      to={targetPath}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition",
                        isActive
                          ? "bg-sky-50 text-sky-700 font-bold shadow-sm"
                          : "text-slate-700 hover:bg-sky-50 hover:text-sky-700",
                        m.accent === "purple" && (isActive ? "bg-purple-100 text-purple-800" : "text-purple-700 hover:bg-purple-50"),
                        m.accent === "amber" && (isActive ? "bg-amber-100 text-amber-800" : "text-amber-700 hover:bg-amber-50")
                      )}
                    >
                      <m.icon className={cn("w-4 h-4", m.accent === "purple" ? "text-purple-600" : m.accent === "amber" ? "text-amber-600" : "text-sky-600")} />
                      <span>{m.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col p-4 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <img src="/logo/logo_with_teks.png" alt="SIPANDU" className="h-9 w-auto object-contain" />
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Tutup menu">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {GROUPS.map((g) => {
                const items = MENU.filter((m) => (m.group || "") === g && (!m.roles || m.roles.includes(currentRole)));
                if (items.length === 0) return null;
                return (
                  <div key={g} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{g}</p>
                    {items.map((m) => {
                      const targetPath = getRoleMenuPath(m.to, currentRole);
                      const isActive = isRouteActive(location.pathname, targetPath);
                      return (
                        <NavLink
                          key={m.to}
                          to={targetPath}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition",
                            isActive ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-700 hover:bg-sky-50"
                          )}
                        >
                          <m.icon className="w-4 h-4 text-sky-600" />
                          <span>{m.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                );
              })}
            </aside>
          </div>
        )}

        {/* Content */}
        <main id="main-content" className="flex-1 overflow-y-auto min-h-0 bg-slate-50 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Bottom Mobile Nav — filter per role dan role-prefixed path */}
      <nav id="bottom-nav" className="lg:hidden shrink-0 z-40 glass-header border-t border-slate-200 px-2 py-1.5 flex justify-around no-print">
        {[
          { to: "/dashboard", label: "Beranda", icon: Home, roles: undefined as UserRole[] | undefined },
          { to: "/posyandu", label: "Pelayanan", icon: CalendarDays, roles: ["kader", "bidan", "super_admin"] as UserRole[] },
          { to: "/keluarga", label: "KK", icon: Users, roles: undefined as UserRole[] | undefined },
          { to: "/laporan", label: "Laporan", icon: FileText, roles: ["kader", "bidan", "super_admin", "ketua_pkk", "kepala_desa"] as UserRole[] },
        ]
          .filter((m) => !m.roles || m.roles.includes(currentRole))
          .map((m) => {
            const targetPath = getRoleMenuPath(m.to, currentRole);
            const isActive = isRouteActive(location.pathname, targetPath);
            return (
              <NavLink
                key={m.to}
                to={targetPath}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition",
                  isActive ? "text-sky-700 bg-sky-50" : "text-slate-500"
                )}
              >
                <m.icon className="w-5 h-5" />
                <span>{m.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-[60] max-w-sm">
          <div
            className={cn(
              "p-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-[slideIn_.2s_ease-out]",
              toast.tipe === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
              toast.tipe === "danger" && "bg-rose-50 border-rose-200 text-rose-800",
              toast.tipe === "warning" && "bg-amber-50 border-amber-200 text-amber-800",
              toast.tipe === "info" && "bg-sky-50 border-sky-200 text-sky-800"
            )}
          >
            <span className="text-xs font-bold">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// J1: notifikasi dari data store (terisi saat tutup sesi / trigger risiko), fallback seed
function useSipanduStoreSafe(): any[] {
  try {
    const { data } = useSipandu();
    return (data?.notifikasi || []).map((n: any) => ({
      id: n.id,
      judul: n.judul || n.tipe || "Notifikasi",
      pesan: n.pesan || "",
      tipe: n.tipe || "info",
      tanggal: n.tanggal || n.waktu || "",
      dibaca: Boolean(n.dibaca),
    }));
  } catch {
    return [];
  }
}

// Ikon aksen per menu yang di legacy memakai warna berbeda (purple/amber)
const ACCENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {};

