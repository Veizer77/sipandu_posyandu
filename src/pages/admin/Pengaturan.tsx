/**
 * SIPANDU - Pengaturan, Pengguna, Audit Log
 * Terintegrasi langsung dengan Database InsForge PostgreSQL & Master SINDUKSADATI
 */
import React, { useMemo, useState } from "react";
import { ROLE_LABEL, useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { dbService } from "@/services/dbService";
import { 
  RotateCcw, AlertTriangle, CheckCircle2, Trash2, Shield, RefreshCw, Search, Users, ShieldAlert, Save, Plus, UserCog,
  Camera, Upload, Image as ImageIcon, Link as LinkIcon, Sparkles, X, Check, RefreshCcw,
  UserRound, Stethoscope, Landmark, ShieldCheck, LayoutGrid, List, Mail, Key, Copy, CheckCheck
} from "lucide-react";
import type { UserRole } from "@/types";

export function Pengaturan() {
  const { currentRole, showToast } = useAuth();
  const { data, resetToDefaultSeed, purgeAllTransactions, refreshFromDb, isLoadingDb } = useSipandu();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const p = data.posyandu;
  const org = data.organisasi;

  const handleReset = async () => {
    await resetToDefaultSeed();
    setShowConfirmReset(false);
    setActionSuccess("Database berhasil disinkronkan ulang dengan data master InsForge Cloud!");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handlePurge = async () => {
    await purgeAllTransactions();
    setShowConfirmPurge(false);
    showToast("Seluruh data kunjungan dan transaksi berhasil dibersihkan dari server!", "success");
    setActionSuccess("Seluruh data transaksi dan kunjungan telah dibersihkan bersih (Clean State)!");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // D7: persist profil & organisasi ke InsForge + state lokal
  async function persistPosyandu(patch: any) {
    if (dbService.isConfigured() && p?.id) {
      try {
        await dbService.updatePosyandu(p.id, patch);
      } catch (e) {
        console.warn("Failed to update posyandu:", e);
      }
    }
  }

  async function persistOrganisasi(id: string, patch: any) {
    if (dbService.isConfigured() && id) {
      try {
        await dbService.updateOrganisasi(id, patch);
      } catch (e) {
        console.warn("Failed to update organisasi:", e);
      }
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil & Konfigurasi Posyandu</h1>
          <p className="text-sm text-gray-500">Konfigurasi identitas Posyandu ILP Flamboyan RW 06 Desa Mojorejo</p>
        </div>
        <button
          onClick={() => refreshFromDb()}
          disabled={isLoadingDb}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoadingDb ? "animate-spin" : ""}`} />
          Sinkronkan ke Cloud
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Profil Posyandu */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo/logo_with_teks.png" alt="Logo" className="h-16 w-auto object-contain" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{p.nama}</h2>
              <p className="text-xs text-gray-500">{p.desa}, {p.kecamatan}, {p.kota}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
          <EditableField
            label="Nama Posyandu"
            value={p.nama}
            onSave={async (v) => {
              await persistPosyandu({ nama: v });
              showToast("Nama Posyandu diperbarui.", "success");
            }}
          />
          <EditableField
            label="Jadwal Rutin"
            value={`${p.jadwal_hari} · ${p.jadwal_mulai} – ${p.jadwal_selesai}`}
            onSave={async (v) => {
              const [hari, jam] = v.split("·").map((s: string) => s.trim());
              const [mulai, selesai] = (jam || "").split("–").map((s: string) => s.trim());
              await persistPosyandu({ jadwal_hari: hari, jadwal_mulai: mulai, jadwal_selesai: selesai });
              showToast("Jadwal Posyandu diperbarui.", "success");
            }}
          />
          <EditableField
            label="Lokasi"
            value={p.lokasi}
            onSave={async (v) => {
              await persistPosyandu({ lokasi: v });
              showToast("Lokasi diperbarui.", "success");
            }}
          />
          <EditableField
            label="Telepon"
            value={p.telepon || "0812-3456-7890"}
            onSave={async (v) => {
              await persistPosyandu({ telepon: v });
              showToast("Telepon diperbarui.", "success");
            }}
          />
          <EditableField
            label="Email"
            value={p.email || "posyandu.flamboyan06@mojorejo.desa.id"}
            onSave={async (v) => {
              await persistPosyandu({ email: v });
              showToast("Email diperbarui.", "success");
            }}
          />
          <Field label="Wilayah" value={`RT 13, 14, 15, 16, 21, 23 · RW ${p.rw}`} />
        </div>
      </div>

      {/* Struktur Organisasi */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Struktur Pengurus & Kader Posyandu</h3>
        <div className="space-y-2">
          {org.map((o: any, idx: number) => (
            <div key={o.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex-1">
                <EditableField
                  label={ROLE_LABEL[o.jabatan as keyof typeof ROLE_LABEL] || o.jabatan}
                  value={`${o.nama}${o.gelar ? `, ${o.gelar}` : ""}`}
                  onSave={async (v) => {
                    const parts = v.split(",").map((s: string) => s.trim());
                    await persistOrganisasi(o.id, { nama: parts[0], gelar: parts[1] || null });
                    showToast("Struktur organisasi diperbarui.", "success");
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono ml-3">#{o.urutan || idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Manajemen Pembersihan Transaksi */}
      {currentRole === "super_admin" && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-900">Bersihkan Seluruh Transaksi & Kunjungan</h3>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Fitur pembersihan data transaksi (Alur 5 Meja, Pengukuran, Pelayanan, dan Audit Log). Menghapus seluruh sesi hari ini dari database cloud InsForge tanpa menghapus master data keluarga dan warga.
                </p>
                
                {!showConfirmPurge ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPurge(true)}
                    className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Bersihkan Data Transaksi
                  </button>
                ) : (
                  <div className="mt-3 p-3.5 bg-white border border-rose-300 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Yakin ingin membersihkan seluruh data kunjungan dan pengukuran di server InsForge?
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePurge}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Ya, Bersihkan Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPurge(false)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Reset Sinkronisasi Master Seed</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Menghapus cache lokal browser dan menyelaraskan ulang seluruh KK dan Warga ke data standar RW 06 SINDUKSADATI.
                </p>
                
                {!showConfirmReset ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Cache Lokal
                  </button>
                ) : (
                  <div className="mt-3 p-3.5 bg-white border border-slate-300 rounded-2xl space-y-2">
                    <p className="text-slate-800 text-xs font-bold">Kembalikan cache browser ke data awal RW 06?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
                      >
                        Ya, Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(false)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AVATAR_PRESETS: { role: string; label: string; url: string }[] = [
  // Super Admin
  { role: "super_admin", label: "Admin Izzat (Formal)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80" },
  { role: "super_admin", label: "Admin Eksekutif", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80" },

  // Kader
  { role: "kader", label: "Kader Bu Sari (Hijab)", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=80" },
  { role: "kader", label: "Kader Ramah (Batik)", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80" },

  // Bidan
  { role: "bidan", label: "Bidan Siti Aminah", url: "https://images.unsplash.com/photo-1594824813681-3701540e163b?w=256&auto=format&fit=crop&q=80" },
  { role: "bidan", label: "Bidan Medis Klinis", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=256&auto=format&fit=crop&q=80" },

  // Ketua PKK
  { role: "ketua_pkk", label: "Ibu Hartini Sutrisno", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80" },
  { role: "ketua_pkk", label: "Tokoh Penggerak PKK", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=80" },

  // Kepala Desa
  { role: "kepala_desa", label: "Bpk. Bambang Sutrisno", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80" },
  { role: "kepala_desa", label: "Pamong Pemerintahan", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&auto=format&fit=crop&q=80" },
];

interface OfficialRoleMeta {
  role: UserRole;
  title: string;
  email: string;
  scope: string;
  endpoint: string;
  icon: any;
  accent: string;
  border: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
}

const OFFICIAL_PETUGAS: OfficialRoleMeta[] = [
  {
    role: "super_admin",
    title: "Super Admin",
    email: "admin@sipandu-flamboyan.id",
    scope: "Manajemen Pengguna, Profil Posyandu & Audit Log",
    endpoint: "/admin/dashboard",
    icon: ShieldCheck,
    accent: "text-rose-600",
    border: "border-rose-200",
    bgLight: "bg-rose-50/70",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    ring: "ring-rose-400",
  },
  {
    role: "kader",
    title: "Kader Posyandu",
    email: "kader@flamboyan.id",
    scope: "Alur 5 Meja, Presensi & Input Antropometri",
    endpoint: "/kader/dashboard",
    icon: UserRound,
    accent: "text-sky-600",
    border: "border-sky-200",
    bgLight: "bg-sky-50/70",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    ring: "ring-sky-400",
  },
  {
    role: "bidan",
    title: "Bidan Desa",
    email: "bidan@flamboyan.id",
    scope: "Verifikasi Kunjungan, Risiko Gizi & Rujukan Medis",
    endpoint: "/bidan/dashboard",
    icon: Stethoscope,
    accent: "text-emerald-600",
    border: "border-emerald-200",
    bgLight: "bg-emerald-50/70",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    ring: "ring-emerald-400",
  },
  {
    role: "ketua_pkk",
    title: "Ketua TP PKK",
    email: "pkk@mojorejo.desa.id",
    scope: "Monitoring Cakupan D/S, Stunting RT 01–04",
    endpoint: "/pkk/dashboard",
    icon: Users,
    accent: "text-purple-600",
    border: "border-purple-200",
    bgLight: "bg-purple-50/70",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    ring: "ring-purple-400",
  },
  {
    role: "kepala_desa",
    title: "Kepala Desa",
    email: "kades@mojorejo.desa.id",
    scope: "Eksekutif Rekapitulasi & Alokasi Dana Desa",
    endpoint: "/kades/dashboard",
    icon: Landmark,
    accent: "text-amber-600",
    border: "border-amber-200",
    bgLight: "bg-amber-50/70",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    ring: "ring-amber-400",
  },
];

export function Pengguna() {
  const { showToast } = useAuth();
  const { data, refreshFromDb, updateUserPhoto, isLoadingDb } = useSipandu();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // State Kelola Foto Profil Terpusat (Hanya Admin)
  const [photoUser, setPhotoUser] = useState<any | null>(null);
  const [photoTab, setPhotoTab] = useState<"preset" | "upload" | "url">("preset");
  const [previewPhoto, setPreviewPhoto] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Filter ketat: HANYA tampilkan 5 akun resmi yang selaras dengan halaman login
  const officialAccounts = useMemo(() => {
    const rawUsers = data.users || [];
    return OFFICIAL_PETUGAS.map((meta) => {
      const match = rawUsers.find(
        (u: any) =>
          u.email?.toLowerCase() === meta.email.toLowerCase() ||
          u.peran === meta.role
      );
      return {
        id: match?.id || meta.role,
        nama_lengkap: match?.nama_lengkap || meta.title,
        email: meta.email,
        peran: meta.role,
        foto: match?.foto || null,
        status_aktif: match?.status_aktif !== false,
        meta,
      };
    });
  }, [data.users]);

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return officialAccounts.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.peran === roleFilter;
      const matchQuery =
        !q ||
        u.nama_lengkap.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.meta.title.toLowerCase().includes(q) ||
        u.meta.scope.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [officialAccounts, search, roleFilter]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    showToast(`Email ${text} disalin ke clipboard.`, "info");
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  function openPhotoModal(u: any) {
    setPhotoUser(u);
    setPreviewPhoto(u.foto || "");
    setUrlInput(u.foto?.startsWith("http") ? u.foto : "");
    setPhotoTab("preset");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa berkas gambar (PNG, JPG, JPEG, WebP).", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Square center crop
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPreviewPhoto(dataUrl);
        showToast("Gambar berhasil dimuat & disesuaikan.", "info");
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSavePhoto() {
    if (!photoUser) return;
    setIsSavingPhoto(true);
    try {
      await updateUserPhoto(photoUser.id, previewPhoto);
      await refreshFromDb();
      showToast(`Foto profil ${photoUser.nama_lengkap} berhasil diperbarui oleh Admin.`, "success");
      setPhotoUser(null);
    } catch (err) {
      console.error("Gagal simpan foto profil:", err);
      showToast("Gagal menyimpan foto profil ke database.", "danger");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleResetPhoto() {
    if (!photoUser) return;
    const defaultSeed = AVATAR_PRESETS.find((p) => p.role === photoUser.peran)?.url || "";
    setIsSavingPhoto(true);
    try {
      await updateUserPhoto(photoUser.id, defaultSeed);
      await refreshFromDb();
      showToast(`Foto profil ${photoUser.nama_lengkap} direset ke default.`, "info");
      setPhotoUser(null);
    } catch (err) {
      console.error("Gagal reset foto profil:", err);
      showToast("Gagal reset foto profil.", "danger");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleToggleAktif(u: any) {
    const next = !u.status_aktif;
    if (dbService.isConfigured()) {
      try {
        await dbService.updateUserStatus(u.id, next);
        await refreshFromDb();
      } catch (err) {
        console.warn("Gagal update status pengguna:", err);
      }
    }
    showToast(`Akun ${u.nama_lengkap} ${next ? "diaktifkan" : "dinonaktifkan"}.`, next ? "success" : "warning");
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ===== EXECUTIVE HERO BANNER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[11px] font-bold tracking-wide uppercase">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              Direktori Resmi Petugas RBAC v3.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Daftar Petugas Resmi Posyandu ILP
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sistem dibatasi secara ketat hanya untuk <strong className="text-sky-300 font-semibold">5 akun petugas resmi</strong> yang selaras 100% dengan portal login. Foto profil seluruh petugas dikelola terpusat oleh Super Admin.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 backdrop-blur-sm text-right">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">5 Akun Terdaftar</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Seluruh Petugas Aktif</p>
            </div>
            <button
              onClick={() => refreshFromDb()}
              disabled={isLoadingDb}
              title="Sinkronkan data ke PostgreSQL Cloud"
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDb ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== 4 SYSTEM METRICS BAR ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Petugas Resmi</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">5 Akun</h3>
            <p className="text-[10px] text-sky-600 font-semibold">Sesuai Halaman Login</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Isolasi RBAC</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">5 Endpoint</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">Proteksi RoleGuard 403</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Otoritas Foto</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">Admin Saja</h3>
            <p className="text-[10px] text-purple-600 font-semibold">Terkontrol Terpusat</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Cloud</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">PostgreSQL</h3>
            <p className="text-[10px] text-amber-600 font-semibold">InsForge Cloud RW 06</p>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS & FILTER BAR ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              roleFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua Petugas (5)
          </button>
          {OFFICIAL_PETUGAS.map((m) => (
            <button
              key={m.role}
              onClick={() => setRoleFilter(m.role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === m.role
                  ? `${m.bgLight} ${m.accent} ring-1 ring-inset ${m.border} font-black shadow-xs`
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.title}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-500 transition"
            />
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Kartu Bento"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Tabel Lengkap"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== VIEW 1: BENTO GRID CARDS (PRIMARY) ===== */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((u) => {
            const isCopied = copiedEmail === u.email;
            return (
              <div
                key={u.peran}
                className={`bg-white rounded-3xl border ${u.meta.border} p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group`}
              >
                {/* Top Accent Strip */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${u.meta.bgLight.replace("bg-", "bg-gradient-to-r from-").replace("/70", "")}`} />

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${u.meta.badgeBg} ${u.meta.badgeText}`}>
                      <u.meta.icon className="w-3.5 h-3.5" />
                      {u.meta.title}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {u.status_aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {/* Profile Center Avatar */}
                  <div className="flex flex-col items-center text-center my-3">
                    <div
                      onClick={() => openPhotoModal(u)}
                      className="relative group/avatar cursor-pointer shrink-0"
                      title="Klik untuk ubah foto profil petugas ini (Hanya Admin)"
                    >
                      <img
                        src={u.foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                        alt={u.nama_lengkap}
                        className={`w-20 h-20 rounded-2xl object-cover border-2 ${u.meta.border} shadow-md group-hover/avatar:ring-4 ${u.meta.ring} transition-all duration-300`}
                      />
                      <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-200 text-white">
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-bold">Ubah Foto</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-sky-600 border-2 border-white flex items-center justify-center text-white shadow-xs">
                        <Camera className="w-3 h-3" />
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 mt-3 group-hover:text-sky-700 transition">
                      {u.nama_lengkap}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {ROLE_LABEL[u.peran]} Posyandu
                    </p>
                  </div>

                  {/* Account Details Box */}
                  <div className="bg-slate-50/80 rounded-2xl p-3.5 space-y-2.5 my-3 border border-slate-100 text-xs">
                    {/* Official Email with copy */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Login
                      </span>
                      <button
                        onClick={() => copyToClipboard(u.email)}
                        className="font-mono text-[11px] text-sky-700 font-bold hover:underline flex items-center gap-1"
                        title="Klik untuk menyalin"
                      >
                        {u.email}
                        {isCopied ? (
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 hover:text-sky-600" />
                        )}
                      </button>
                    </div>

                    {/* Scope / Tupoksi */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Lingkup Tugas Resmi:
                      </span>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                        {u.meta.scope}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openPhotoModal(u)}
                    className="flex-1 py-2.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Camera className="w-4 h-4 text-sky-600" />
                    Ubah Foto Profil
                  </button>
                  <button
                    onClick={() => handleToggleAktif(u)}
                    title={u.status_aktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                    className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                  >
                    {u.status_aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== VIEW 2: EXECUTIVE TABLE ===== */}
      {viewMode === "table" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Petugas & Foto Profil</th>
                  <th className="px-6 py-4">Email Login</th>
                  <th className="px-6 py-4">Peran & Tupoksi</th>
                  <th className="px-6 py-4 text-center">Status Akun</th>
                  <th className="px-6 py-4 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((u) => (
                  <tr key={u.peran} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          onClick={() => openPhotoModal(u)}
                          className="relative group cursor-pointer shrink-0"
                          title="Klik untuk ubah foto profil"
                        >
                          <img
                            src={u.foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={u.nama_lengkap}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 group-hover:border-sky-500 shadow-xs transition"
                          />
                          <div className="absolute inset-0 bg-slate-900/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.nama_lengkap}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Role: {u.peran}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-xs font-mono font-medium">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${u.meta.badgeBg} ${u.meta.badgeText}`}>
                          <u.meta.icon className="w-3 h-3" />
                          {u.meta.title}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-tight">
                          {u.meta.scope}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${u.status_aktif ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status_aktif ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {u.status_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openPhotoModal(u)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        Ubah Foto
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL UBAH FOTO PROFIL PETUGAS (KHUSUS ADMIN) ===== */}
      {photoUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kelola Foto Profil Petugas</h3>
                  <p className="text-[11px] text-slate-500">Otoritas Terpusat Administrator Posyandu</p>
                </div>
              </div>
              <button
                onClick={() => setPhotoUser(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Petugas Info & Live Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
                <div className="relative shrink-0">
                  <img
                    src={previewPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                    alt={photoUser.nama_lengkap}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500 shadow-md ring-4 ring-sky-100"
                  />
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Foto Terpilih">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{photoUser.nama_lengkap}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{photoUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {ROLE_LABEL[photoUser.peran as keyof typeof ROLE_LABEL] || photoUser.peran}
                    </span>
                    <span className="text-[10px] text-sky-800 font-medium">Foto resmi Posyandu</span>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPhotoTab("preset")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    photoTab === "preset" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Koleksi Standar
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoTab("upload")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    photoTab === "upload" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Unggah Berkas
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoTab("url")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    photoTab === "url" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Input URL
                </button>
              </div>

              {/* Tab 1: Koleksi Avatar Resmi */}
              {photoTab === "preset" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">Pilih dari Foto Standar Petugas</p>
                    <span className="text-[10px] text-slate-400">Rekomendasi peran ini</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-52 overflow-y-auto p-1">
                    {AVATAR_PRESETS.map((preset, idx) => {
                      const isSelected = previewPhoto === preset.url;
                      const isRoleMatch = preset.role === photoUser.peran;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewPhoto(preset.url)}
                          className={`relative group rounded-2xl p-1 text-center transition flex flex-col items-center ${
                            isSelected
                              ? "ring-2 ring-sky-600 bg-sky-50/60"
                              : "hover:bg-slate-50 border border-slate-100"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-12 rounded-xl object-cover shadow-xs"
                          />
                          <span className="text-[9px] text-slate-600 mt-1 line-clamp-1 leading-tight">{preset.label.split(" ")[0]}</span>
                          {isRoleMatch && (
                            <span className="text-[8px] text-sky-600 font-bold">★ Sesuai</span>
                          )}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-sky-600 rounded-full flex items-center justify-center text-white">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload File Lokal */}
              {photoTab === "upload" && (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-sky-50/30 hover:bg-sky-50/60 transition text-center">
                    <Upload className="w-8 h-8 text-sky-600 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Klik untuk memilih foto dari perangkat</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Format JPG, PNG, atau WebP. Otomatis disesuaikan ke ukuran profil persegi.</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 italic">
                    💡 Foto otomatis di-crop persegi dan dikompresi berukuran optimal agar cepat dimuat.
                  </p>
                </div>
              )}

              {/* Tab 3: Input URL Gambar */}
              {photoTab === "url" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tautan Gambar (Direct URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!urlInput.trim()) return;
                          setPreviewPhoto(urlInput.trim());
                          showToast("Preview URL diterapkan.", "info");
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Pastikan tautan dapat diakses secara publik (contoh: Unsplash, CDN instansi resmi Posyandu).
                  </p>
                </div>
              )}

              {/* Security policy footer */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Kebijakan Terpusat:</strong> Petugas non-admin (Kader, Bidan, PKK, Kades) tidak dapat mengubah foto profil sendiri secara mandiri demi standardisasi identitas kerja.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetPhoto}
                disabled={isSavingPhoto}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 transition"
              >
                <RefreshCcw className="w-3 h-3" /> Reset Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoUser(null)}
                  disabled={isSavingPhoto}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isSavingPhoto || !previewPhoto}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md inline-flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSavingPhoto ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Foto Profil
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLog() {
  const { currentRole } = useAuth();
  const { data, refreshFromDb, isLoadingDb } = useSipandu();
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  if (currentRole !== "super_admin") {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-rose-600 font-semibold text-sm">Akses Dibatasi. Riwayat audit log hanya dapat diakses oleh Super Admin.</p>
      </div>
    );
  }

  const logs = (data.auditLogs || []).filter((a: any) => {
    const matchAksi = filterAction === "ALL" || a.aksi === filterAction;
    const matchSearch =
      !searchTerm ||
      a.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tabel?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAksi && matchSearch;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log Sistem</h1>
          <p className="text-sm text-gray-500">Rekam jejak seluruh aktivitas mutasi data SIPANDU Posyandu ILP Flamboyan</p>
        </div>
        <button
          onClick={() => refreshFromDb()}
          disabled={isLoadingDb}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoadingDb ? "animate-spin" : ""}`} />
          Perbarui Log
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari aktivitas, pengguna, atau tabel..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["ALL", "CREATE", "UPDATE", "LINK", "CLOSE", "PURGE"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterAction === act
                  ? "bg-sky-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Belum ada catatan aktivitas sistem yang tercatat.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((a: any) => (
              <div key={a.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 text-xs hover:bg-gray-50/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        a.aksi === "CREATE"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.aksi === "UPDATE"
                          ? "bg-amber-100 text-amber-700"
                          : a.aksi === "LINK"
                          ? "bg-sky-100 text-sky-700"
                          : a.aksi === "PURGE"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {a.aksi}
                    </span>
                    <span className="font-mono text-gray-500 font-semibold uppercase">{a.tabel}</span>
                  </div>
                  <p className="text-gray-900 font-medium text-xs">{a.deskripsi}</p>
                  <p className="text-[11px] text-gray-400">oleh: <strong className="text-gray-700">{a.user}</strong></p>
                </div>
                <span className="text-[10px] text-gray-400 font-mono shrink-0 whitespace-nowrap">{a.waktu}</span>
              </div>
            ))}
          </div>
        )}
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

/** D7: field editable inline dengan simpan ke DB */
function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: React.ReactNode;
  onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);

  async function commit() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="group">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="font-semibold text-gray-900">{value}</p>
          <button
            type="button"
            onClick={() => {
              setDraft(String(value ?? ""));
              setEditing(true);
            }}
            className="text-[10px] font-bold text-sky-600 hover:underline opacity-0 group-hover:opacity-100 transition"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-gray-50 border border-sky-300 rounded-lg text-sm font-semibold outline-none focus:bg-white"
        />
        <button
          type="button"
          disabled={saving}
          onClick={commit}
          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold"
        >
          {saving ? "..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
