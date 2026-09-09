/**
 * SIPANDU - RBAC Route Guard
 * Membatasi akses URL berdasarkan peran aktif (PRD Bagian 6 & 14)
 */
import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { ROLE_LABEL, useAuth } from "@/lib/auth-context";
import { getRoleDashboardPath } from "@/lib/role-routes";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentRole, switchRole } = useAuth();

  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }

  const allowedLabels = allowedRoles.map((r) => ROLE_LABEL[r] || r).join(" / ");

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Akses Dibatasi (403)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Halaman Memerlukan Izin Khusus</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Peran Anda saat ini adalah <strong className="text-slate-800">{ROLE_LABEL[currentRole]}</strong>.
            Halaman ini hanya dapat diakses oleh: <strong className="text-sky-700">{allowedLabels}</strong>.
          </p>
        </div>

        {/* Quick Switcher */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
          <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <ChevronsUpDown className="w-3.5 h-3.5 text-sky-600" /> Beralih ke Peran yang Diizinkan:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allowedRoles.map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-sky-800 text-xs font-semibold rounded-xl transition shadow-sm"
              >
                Masuk sebagai {ROLE_LABEL[role]}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Link
            to={getRoleDashboardPath(currentRole)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
