/**
 * SIPANDU - Komponen bersama Alur 5 Meja
 * MejaStepper + CategoryBadge identik dengan legacy.
 */
import React from "react";
import { Link } from "react-router-dom";
import { IdCard, Weight, NotebookPen, Syringe, Megaphone, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import type { SasaranKategori } from "@/types";

const MEJAS = [
  { num: 1, title: "Registrasi", href: "/meja1", Icon: IdCard },
  { num: 2, title: "Pengukuran", href: "/meja2", Icon: Weight },
  { num: 3, title: "Pencatatan", href: "/meja3", Icon: NotebookPen },
  { num: 4, title: "Pelayanan", href: "/meja4", Icon: Syringe },
  { num: 5, title: "Penyuluhan", href: "/meja5", Icon: Megaphone },
  { num: 6, title: "Rekap Sesi", href: "/rekap", Icon: ClipboardCheck },
];

export function MejaStepper({ activeMeja }: { activeMeja: number }) {
  const { currentRole } = useAuth();
  const prefix = getRolePrefix(currentRole);

  return (
    <div className="stepper-meja bg-white p-2 rounded-2xl border border-gray-100 shadow-sm gap-2">
      {MEJAS.map((m) => {
        const isActive = m.num === activeMeja;
        return (
          <Link
            key={m.num}
            to={`${prefix}${m.href}`}
            className={cn(
              "flex-1 min-w-[120px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition",
              isActive ? "bg-green-600 text-white shadow-md shadow-sky-600/20" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <m.Icon className="w-4 h-4" />
            <span>{m.num === 6 ? "Rekap" : `Meja ${m.num}`}</span>
          </Link>
        );
      })}
    </div>
  );
}

const BADGES: Record<string, { cls: string; label: string }> = {
  bayi: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Bayi" },
  balita: { cls: "bg-green-50 text-green-700 border-green-200", label: "Balita" },
  ibu_hamil: { cls: "bg-pink-50 text-pink-700 border-pink-200", label: "Ibu Hamil" },
  wus: { cls: "bg-purple-50 text-purple-700 border-purple-200", label: "WUS" },
  lansia: { cls: "bg-amber-50 text-amber-800 border-amber-200", label: "Lansia" },
  umum: { cls: "bg-gray-100 text-gray-600 border-transparent", label: "Umum" },
};

export function CategoryBadge({
  kategori,
  className,
}: {
  kategori: string;
  className?: string;
}) {
  const b = BADGES[kategori] || {
    cls: "bg-gray-100 text-gray-700 border-gray-200",
    label: kategori ? kategori.toUpperCase() : "Umum",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 border rounded-full text-[11px] font-semibold leading-tight shrink-0",
        b.cls,
        className
      )}
    >
      {b.label}
    </span>
  );
}

export type { SasaranKategori };
