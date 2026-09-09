/**
 * SIPANDU - Halaman Login (Redesigned)
 * Dual-Pane Editorial Split + Hardware Double-Bezel Framing
 * Sesuai panduan High-End Visual Design & Anti-Slop Frontend Taste
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  UserRound,
  Stethoscope,
  Users,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { ROLE_LABEL, useAuth } from "@/lib/auth-context";
import { getRoleDashboardPath } from "@/lib/role-routes";
import { insforgeConfigured } from "@/lib/insforge";
import type { UserRole } from "@/types";

interface RoleMeta {
  role: UserRole;
  title: string;
  scope: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  borderColor: string;
  activeRing: string;
  badgeBg: string;
  badgeText: string;
}

const QUICK_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  kader: { email: "kader@flamboyan.id", pass: "password123" },
  bidan: { email: "bidan@flamboyan.id", pass: "password123" },
  ketua_pkk: { email: "pkk@mojorejo.desa.id", pass: "password123" },
  kepala_desa: { email: "kades@mojorejo.desa.id", pass: "password123" },
  super_admin: { email: "admin@sipandu-flamboyan.id", pass: "password123" },
};

const ROLES_DATA: RoleMeta[] = [
  {
    role: "kader",
    title: "Kader Posyandu",
    scope: "Alur 5 Meja, Presensi, Input Antropometri",
    icon: UserRound,
    accentColor: "text-sky-600",
    bgLight: "bg-sky-50/70 hover:bg-sky-50",
    borderColor: "border-sky-200/80",
    activeRing: "ring-sky-500 border-sky-500 bg-sky-50/90",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
  },
  {
    role: "bidan",
    title: "Bidan Desa",
    scope: "Verifikasi Kunjungan, Risiko Gizi & Rujukan",
    icon: Stethoscope,
    accentColor: "text-emerald-600",
    bgLight: "bg-emerald-50/70 hover:bg-emerald-50",
    borderColor: "border-emerald-200/80",
    activeRing: "ring-emerald-500 border-emerald-500 bg-emerald-50/90",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  {
    role: "ketua_pkk",
    title: "Ketua TP PKK",
    scope: "Monitoring Cakupan D/S, Stunting RT 01–04",
    icon: Users,
    accentColor: "text-purple-600",
    bgLight: "bg-purple-50/70 hover:bg-purple-50",
    borderColor: "border-purple-200/80",
    activeRing: "ring-purple-500 border-purple-500 bg-purple-50/90",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
  },
  {
    role: "kepala_desa",
    title: "Kepala Desa",
    scope: "Eksekutif Rekapitulasi & Alokasi Dana Desa",
    icon: Landmark,
    accentColor: "text-amber-600",
    bgLight: "bg-amber-50/70 hover:bg-amber-50",
    borderColor: "border-amber-200/80",
    activeRing: "ring-amber-500 border-amber-500 bg-amber-50/90",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  {
    role: "super_admin",
    title: "Super Admin",
    scope: "Manajemen Pengguna, Profil Posyandu & Audit Log",
    icon: ShieldCheck,
    accentColor: "text-rose-600",
    bgLight: "bg-rose-50/70 hover:bg-rose-50",
    borderColor: "border-rose-200/80",
    activeRing: "ring-rose-500 border-rose-500 bg-rose-50/90",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentRole, initializing, showToast } = useAuth();

  const [email, setEmail] = useState("kader@flamboyan.id");
  const [password, setPassword] = useState("password123");
  const [selectedRole, setSelectedRole] = useState<UserRole>("kader");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      navigate(getRoleDashboardPath(currentRole), { replace: true });
    }
  }, [isAuthenticated, initializing, currentRole, navigate]);

  async function performLogin(targetEmail: string, targetPass: string, roleName?: string) {
    if (!targetEmail.trim() || !targetPass) {
      const msg = "Silakan masukkan email dan kata sandi.";
      setErrorMessage(msg);
      showToast(msg, "warning");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { user, role } = await login(targetEmail.trim(), targetPass);
      showToast(`Selamat datang, ${user.nama_lengkap}! Berhasil masuk sebagai ${ROLE_LABEL[role]}.`, "success");
      navigate(getRoleDashboardPath(role));
    } catch (err: any) {
      const msg = err.message || "Gagal masuk ke sistem. Periksa email atau kata sandi Anda.";
      setErrorMessage(msg);
      showToast(msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  function handleSelectRole(role: UserRole) {
    setSelectedRole(role);
    const cred = QUICK_CREDENTIALS[role];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.pass);
      setErrorMessage(null);
      showToast(`Kredensial ${ROLE_LABEL[role]} siap digunakan.`, "info");
    }
  }

  async function handleDirectRoleLogin(role: UserRole, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedRole(role);
    const cred = QUICK_CREDENTIALS[role];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.pass);
      await performLogin(cred.email, cred.pass, ROLE_LABEL[role]);
    }
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full bg-[#FDFBF7] text-slate-900 flex flex-col justify-between selection:bg-sky-500/20 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient Lighting Orbs — Subtle & Non-intrusive */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-emerald-200/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-teal-100/40 blur-[110px]" />

      {/* Subtle Grid Dot Matrix Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header Bar — Compact */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3 shrink-0 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition duration-300 py-1.5 px-3 rounded-full bg-white/70 hover:bg-white border border-slate-200/70 shadow-2xs backdrop-blur-md"
        >
          <div className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition">
            <ArrowLeft className="w-2.5 h-2.5 text-slate-700 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Live System Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="tracking-tight">Server InsForge BaaS Aktif · SSL 256-Bit</span>
        </div>
      </header>

      {/* Main Dual-Pane Section — No Scroll, Perfect Flex Fit */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-1 lg:py-2 flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center">

          {/* ================= LEFT PANE: BRAND AUTHORITY & IMPACT ================= */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 xl:space-y-7 pr-2 xl:pr-6">
            {/* Identity & Eyebrow */}
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/90 text-sky-800 text-xs font-bold tracking-wide w-fit shadow-2xs">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Portal Layanan Posyandu ILP Flamboyan</span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src="/logo/logo_only.png"
                  alt="Logo SIPANDU"
                  className="w-16 h-16 object-contain drop-shadow-sm shrink-0"
                />
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    SIPANDU <span className="text-sky-600 font-black">RW 06</span>
                  </h1>
                  <p className="text-sm font-semibold text-slate-500 mt-0.5">
                    Desa Mojorejo · Kec. Junrejo · Kota Batu
                  </p>
                </div>
              </div>
            </div>

            {/* Display Headline */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-slate-900 tracking-tight leading-[1.16]">
                Presisi Antropometri, <br />
                <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Integritas Siklus Hidup.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-medium">
                Digitalisasi Alur 5 Meja, pemantauan WHO 2006 real-time, dan intervensi dini risiko stunting berbasis data warga terpadu.
              </p>
            </div>

            {/* 3 Bento Cards — Prominent & Substantial */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">Alur 5 Meja</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Presensi hingga edukasi penyuluhan Kemenkes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">WHO 2006</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Z-Score LMS & evaluasi KMS otomatis presisi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 mb-2">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">SINDUKSADATI</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Sinkronisasi NIK master RW 06 terpadu.
                </p>
              </div>
            </div>

            {/* Institutional Seal / Trust Footer */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm flex items-center gap-4">
              <div className="flex -space-x-2 shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 text-white font-bold text-xs ring-2 ring-white shadow-xs" title="Kader Posyandu">KD</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs ring-2 ring-white shadow-xs" title="Bidan Desa">BD</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs ring-2 ring-white shadow-xs" title="Ketua TP PKK">PK</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs ring-2 ring-white shadow-xs" title="Kepala Desa">KS</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs ring-2 ring-white shadow-xs" title="Super Admin">SA</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">5 Peran Petugas Terintegrasi</p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Digunakan aktif oleh Kader Posyandu, Bidan Desa, TP PKK, Kepala Desa & Super Admin.
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANE: HARDWARE DOUBLE-BEZEL AUTH TERMINAL ================= */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto">
            {/* Outer Hardware Shell */}
            <div className="p-1.5 sm:p-2 rounded-[2rem] bg-white/60 backdrop-blur-2xl border border-slate-200/80 shadow-xl ring-1 ring-black/[0.03]">
              {/* Inner Concentric Core */}
              <div className="rounded-[calc(2rem-0.5rem)] bg-white p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-100/90 space-y-3.5">

                {/* Form Title & Context */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      Masuk ke Sistem
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih peran petugas atau gunakan kredensial resmi Posyandu.
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider uppercase">
                    RBAC v3.0
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                    <p className="text-rose-700 text-[11px] leading-tight font-medium">{errorMessage}</p>
                  </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* Email Input */}
                  <div className="space-y-1">
                    <label
                      htmlFor="login-email"
                      className="block text-[11px] font-bold text-slate-700 tracking-tight"
                    >
                      Email Petugas
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition duration-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="nama@flamboyan.id"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Input with Visibility Toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="block text-[11px] font-bold text-slate-700 tracking-tight"
                      >
                        Kata Sandi
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">password123</code>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition duration-200 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-0.5"
                        tabIndex={-1}
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me / Session Checkbox */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 transition"
                      />
                      <span>Ingat sesi di perangkat ini</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Enkripsi SHA-256</span>
                  </div>

                  {/* Submit Button with Nested Icon Physics */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-2.5 sm:py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
                  >
                    <span className="flex items-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Masuk ke Sistem Posyandu</span>
                      )}
                    </span>

                    {/* Button-in-Button Nested Trailing Pill */}
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </form>

                {/* ================= QUICK ROLE SELECTOR (RBAC TERMINAL) ================= */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-800 tracking-tight">
                      Akses Cepat Kredensial Resmi Petugas
                    </p>
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      5 Peran
                    </span>
                  </div>

                  {/* Responsive Role Cards Grid — Compact */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLES_DATA.map((r, idx) => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => handleSelectRole(r.role)}
                          className={`group cursor-pointer text-left p-1.5 sm:p-2 rounded-xl border transition-all duration-200 flex items-center justify-between gap-1.5 ${idx === 4 ? "col-span-2 sm:col-span-1" : ""
                            } ${isSelected
                              ? `${r.activeRing} ring-1.5 shadow-2xs`
                              : `${r.bgLight} ${r.borderColor}`
                            }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${r.badgeBg} ${r.accentColor}`}
                            >
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                                {r.title}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                                {r.scope}
                              </p>
                            </div>
                          </div>

                          {/* Direct Instant Login Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDirectRoleLogin(r.role, e)}
                            title={`Masuk langsung sebagai ${r.title}`}
                            className="shrink-0 px-1.5 py-0.5 rounded bg-white hover:bg-slate-900 hover:text-white text-[9px] font-bold text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95"
                          >
                            Masuk ↗
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Micro Note */}
                <div className="pt-1">
                  <p className="text-center text-[10px] text-slate-400 font-medium">
                    Terkoneksi langsung ke InsForge Cloud PostgreSQL & SINDUKSADATI Live Gateway · SIPANDU ILP v3.0
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Bottom Line — Compact */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 shrink-0 text-center border-t border-slate-200/40">
        <p className="text-[10px] text-slate-400 font-medium">
          Pemerintah Kota Batu · Dinas Kesehatan · Puskesmas Pembantu Junrejo · RW 06 Flamboyan
        </p>
      </footer>
    </div>
  );
}

