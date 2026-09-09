/**
 * SIPANDU - Auth & RBAC Context
 * Quick Role Switcher (demo) + InsForge Auth (produksi).
 * Peran: kader, bidan, ketua_pkk, kepala_desa, super_admin.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { insforge, insforgeConfigured } from "./insforge";
import type { User, UserRole } from "@/types";

export const ROLE_LABEL: Record<UserRole, string> = {
  kader: "Kader Posyandu",
  bidan: "Bidan Desa",
  ketua_pkk: "Ketua TP PKK",
  kepala_desa: "Kepala Desa",
  super_admin: "Super Admin",
};

const ROLE_KEY = "sipandu_current_role_v3";

export interface AuthContextValue {
  currentUser: User;
  currentRole: UserRole;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<{ user: User; role: UserRole }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  showToast: (msg: string, tipe?: "info" | "success" | "warning" | "danger") => void;
  toast: { id: number; msg: string; tipe: string } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapInsforgeUserToUser(au: any): User {
  // InsForge/Supabase menyimpan custom claim di user_metadata / app_metadata,
  // BUKAN di profile.metadata (yang tidak ada). Baca dari beberapa lokasi sebagai fallback.
  const profile = au.profile || {};
  const userMeta = au.user_metadata || au.app_metadata || profile.metadata || {};
  const meta = userMeta.metadata || userMeta;
  const validRole = (meta.peran || userMeta.peran || "kader") as UserRole;
  const peran: UserRole = ROLE_LABEL[validRole] ? validRole : "kader";

  return {
    id: au.id,
    nama_lengkap:
      meta.nama_lengkap ||
      userMeta.nama_lengkap ||
      profile.name ||
      au.email?.split("@")[0] ||
      "Pengguna SIPANDU",
    peran,
    email: au.email || "",
    foto: meta.foto || userMeta.foto || profile.avatar_url || undefined,
    posyandu_id: meta.posyandu_id || userMeta.posyandu_id || "posyandu-flamboyan-rw06",
    status_aktif: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Role untuk mode demo (tanpa login InsForge). Saat login, peran diambil murni dari
  // token auth (insforgeUser.peran) dan TIDAK BISA diubah dari sisi client — mencegah
  // escalation via localStorage / tombol switchRole (BUG #1).
  const [demoRole, setDemoRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_KEY) as UserRole | null;
    return saved && ROLE_LABEL[saved] ? saved : "kader";
  });

  const [insforgeUser, setInsforgeUser] = useState<User | null>(null);

  // Peran efektif: bila sudah login via InsForge, pakai peran dari server. Role tampering
  // pada localStorage ROLE_KEY tidak berlaku karena diabaikan saat insforgeUser ter-set.
  const currentRole: UserRole = insforgeUser ? insforgeUser.peran : demoRole;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [toast, setToast] = useState<{ id: number; msg: string; tipe: string } | null>(null);

  // Restore sesi InsForge bila ada sesi aktif di backend
  useEffect(() => {
    if (!insforgeConfigured) {
      setInitializing(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();
        if (!isMounted) return;

        const au = (data as any)?.user ?? (data as any);
        if (au?.id && !error) {
          const mapped = mapInsforgeUserToUser(au);
          setInsforgeUser(mapped);
          // Peran efektif diambil dari token (currentRole terderivasi). Simpan ke localStorage
          // hanya untuk mode demo; tidak berpengaruh saat sudah login.
          setDemoRole(mapped.peran);
          setIsAuthenticated(true);
          localStorage.setItem(ROLE_KEY, mapped.peran);
        } else {
          setInsforgeUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) {
          setInsforgeUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = useCallback((msg: string, tipe: "info" | "success" | "warning" | "danger" = "info") => {
    const id = Date.now();
    setToast({ id, msg, tipe });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3500);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ user: User; role: UserRole }> => {
      if (!insforgeConfigured) {
        throw new Error("Backend InsForge belum terkonfigurasi. Periksa file .env.local.");
      }

      const { data, error } = await insforge.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        throw new Error(error?.message || "Email atau kata sandi tidak valid.");
      }

      const mapped = mapInsforgeUserToUser(data.user);
      setInsforgeUser(mapped);
      // Peran efektif terderivasi dari insforgeUser; cukup simpan untuk mode demo.
      setDemoRole(mapped.peran);
      setIsAuthenticated(true);
      localStorage.setItem(ROLE_KEY, mapped.peran);
      return { user: mapped, role: mapped.peran };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (insforgeConfigured) {
        await insforge.auth.signOut();
      }
    } catch (err) {
      console.error("Gagal signOut InsForge:", err);
    } finally {
      setInsforgeUser(null);
      setIsAuthenticated(false);
      setDemoRole("kader");
      localStorage.removeItem(ROLE_KEY);
    }
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      // Saat login via InsForge, peran dikunci dari token server — tidak boleh di-switch
      // ke peran lain (mencegah privilege escalation, BUG #1). Hanya izinkan di mode demo.
      if (insforgeUser) {
        showToast(
          "Peran diambil dari akun login InsForge. Logout untuk mencoba mode demo.",
          "warning"
        );
        return;
      }
      setDemoRole(role);
      localStorage.setItem(ROLE_KEY, role);
      showToast(`Beralih peran (mode demo) sebagai: ${ROLE_LABEL[role]}`, "info");
    },
    [insforgeUser, showToast]
  );

  const currentUser = useMemo<User>(() => {
    if (insforgeUser) return insforgeUser;
    return {
      id: "",
      nama_lengkap: "Pengguna SIPANDU",
      peran: currentRole,
      email: "",
      posyandu_id: "posyandu-flamboyan-rw06",
      status_aktif: false,
    };
  }, [insforgeUser, currentRole]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        initializing,
        login,
        logout,
        switchRole,
        showToast,
        toast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
