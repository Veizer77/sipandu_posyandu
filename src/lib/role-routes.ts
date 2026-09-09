import type { UserRole } from "@/types";

export function getRolePrefix(role: UserRole): string {
  switch (role) {
    case "bidan":
      return "/bidan";
    case "ketua_pkk":
      return "/pkk";
    case "kepala_desa":
      return "/kades";
    case "super_admin":
      return "/admin";
    case "kader":
    default:
      return "/kader";
  }
}

export function getRoleDashboardPath(role: UserRole): string {
  return `${getRolePrefix(role)}/dashboard`;
}

/**
 * Mengonversi path rute umum menjadi endpoint resmi khusus peran aktif.
 * Contoh:
 * - "/posyandu" untuk super_admin -> "/admin/posyandu"
 * - "/posyandu" untuk kader -> "/kader/posyandu"
 * - "/posyandu" untuk bidan -> "/bidan/posyandu"
 * - "/keluarga" untuk kades -> "/kades/keluarga"
 */
export function getRoleMenuPath(path: string, role: UserRole): string {
  const prefix = getRolePrefix(role);

  // Jika path adalah /dashboard, arahkan ke dashboard peran
  if (path === "/dashboard" || path === "") {
    return `${prefix}/dashboard`;
  }

  // Jika untuk super_admin, semua path di-prefix /admin
  if (role === "super_admin") {
    // Menu monitoring lintas-peran yang dilihat admin
    if (path === "/bidan/verifikasi") return "/admin/bidan/verifikasi";
    if (path === "/monitoring/bidan/risiko" || path === "/bidan/risiko") return "/admin/bidan/risiko";
    if (path === "/monitoring/bidan/imunisasi" || path === "/bidan/imunisasi") return "/admin/bidan/imunisasi";
    if (path === "/pkk/dashboard") return "/admin/pkk/dashboard";
    if (path === "/kades/dashboard") return "/admin/kades/dashboard";
    if (path === "/kader/dashboard") return "/admin/kader/dashboard";
    if (path === "/bidan/dashboard") return "/admin/bidan/dashboard";

    // Menu administrasi & master data admin
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/admin${cleanPath}`;
  }

  // Khusus peran Bidan
  if (role === "bidan") {
    if (path === "/bidan/verifikasi") return "/bidan/verifikasi";
    if (path === "/monitoring/bidan/risiko" || path === "/bidan/risiko") return "/bidan/risiko";
    if (path === "/monitoring/bidan/imunisasi" || path === "/bidan/imunisasi") return "/bidan/imunisasi";
  }

  // Khusus menu umum: /posyandu, /keluarga, /keluarga/tambah, /laporan, /integrasi
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${cleanPath}`;
}
