/**
 * SIPANDU - Meja 4: form per kategori + rujukan (ekstraksi dari Meja4.tsx, M4-028).
 * M4-016: bagian imunisasi/TT menerima disabled + note untuk Kader.
 */
import { Check, Pill, HeartPulse, Syringe, AlertTriangle, Baby, Stethoscope } from "lucide-react";
import type { PelayananNormalized } from "@/lib/meja4Logic";

export const IMUNISASI_OPTIONS = [
  { id: "HB-0", label: "HB-0 (0-7 hari)" },
  { id: "BCG", label: "BCG (1 bulan)" },
  { id: "Polio 1", label: "Polio 1" },
  { id: "DPT-HB-Hib 1", label: "DPT-HB-Hib 1" },
  { id: "Polio 2", label: "Polio 2" },
  { id: "DPT-HB-Hib 2", label: "DPT-HB-Hib 2" },
  { id: "Polio 3", label: "Polio 3" },
  { id: "DPT-HB-Hib 3", label: "DPT-HB-Hib 3" },
  { id: "Polio 4", label: "Polio 4" },
  { id: "IPV", label: "IPV" },
  { id: "MR 1", label: "MR 1 (Campak-Rubella)" },
  { id: "DPT-HB-Hib 4", label: "DPT-HB-Hib 4 (Booster)" },
  { id: "MR 2", label: "MR 2" },
];

export function CheckPill({
  icon,
  title,
  color,
  checked,
  onChange,
  readOnly,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  color: "amber" | "green" | "pink" | "red";
  checked: boolean;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const locked = readOnly || disabled;
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 border-amber-300 text-amber-800",
    green: "bg-green-50 border-green-300 text-green-800",
    pink: "bg-pink-50 border-pink-300 text-pink-800",
    red: "bg-rose-50 border-rose-300 text-rose-800",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !locked && onChange(!checked)}
      title={readOnly ? "Hanya Bidan/Admin" : undefined}
      className={`p-3 rounded-2xl border-2 text-left transition ${
        checked ? colorMap[color] : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      } ${locked ? "opacity-70 cursor-not-allowed" : ""} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
            checked ? "bg-emerald-600 border-emerald-600" : "border-gray-300"
          }`}
        >
          {checked && <Check className="w-3 h-3 text-white" />}
        </span>
        <span className="shrink-0">{icon}</span>
        <span className="font-bold text-xs">
          {title}
          {readOnly && <span className="ml-1.5 font-semibold text-amber-700">(Bidan)</span>}
        </span>
      </div>
    </button>
  );
}

export interface FormSectionProps {
  form: PelayananNormalized;
  updateForm: (patch: Partial<PelayananNormalized>) => void;
  disabled: boolean;
  /** M4-016: false untuk Kader pada bagian imunisasi/TT. */
  canGiveImunisasi: boolean;
  isVitABulan: boolean;
  vitAPesan: string;
  fieldErrors: Record<string, string>;
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-rose-600 font-semibold mt-1">{msg}</p>;
}

function ImunisasiGrid({
  form,
  updateForm,
  disabled,
  canGiveImunisasi,
}: Pick<FormSectionProps, "form" | "updateForm" | "disabled" | "canGiveImunisasi">) {
  function toggle(id: string) {
    const cur = form.imunisasi;
    updateForm({ imunisasi: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  }
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
        Imunisasi Dasar yang Diberikan Hari Ini
        {!canGiveImunisasi && (
          <span className="ml-2 normal-case font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            Hanya Bidan/Admin yang boleh memberikan
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {IMUNISASI_OPTIONS.map((im) => {
          const checked = form.imunisasi.includes(im.id);
          const locked = disabled || !canGiveImunisasi;
          return (
            <button
              type="button"
              key={im.id}
              disabled={disabled}
              onClick={() => !locked && toggle(im.id)}
              title={!canGiveImunisasi ? "Hanya Bidan/Admin" : undefined}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                checked
                  ? "bg-sky-50 border-sky-400 text-sky-900 shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              } ${locked ? "opacity-70 cursor-not-allowed" : ""} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span className="truncate">{im.label}</span>
              {checked && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BalitaForm(props: FormSectionProps) {
  const { form, updateForm, disabled, isVitABulan, vitAPesan } = props;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <CheckPill
            icon={<Pill className="w-5 h-5" />}
            title="Vitamin A"
            color="amber"
            checked={form.vitamin_a}
            onChange={(v) => updateForm({ vitamin_a: v })}
            disabled={disabled}
          />
          <p className={`text-[11px] font-semibold ${isVitABulan ? "text-emerald-600" : "text-gray-400"}`}>
            {isVitABulan ? "✓ " : "• "}{vitAPesan}
          </p>
        </div>
        <CheckPill
          icon={<HeartPulse className="w-5 h-5" />}
          title="PMT Pemulihan / Kudapan"
          color="green"
          checked={form.pmt}
          onChange={(v) => updateForm({ pmt: v })}
          disabled={disabled}
        />
      </div>

      {form.pmt && (
        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
          <label className="block text-xs font-bold text-green-900 mb-1">Jenis PMT yang Diberikan</label>
          <select
            value={form.pmt_jenis || "Biskuit Balita"}
            disabled={disabled}
            onChange={(e) => updateForm({ pmt_jenis: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-green-300 rounded-xl text-xs font-semibold text-gray-800 disabled:opacity-60"
          >
            <option>Biskuit Balita Kemenkes</option>
            <option>Kudapan Pangan Lokal (Telur & Bubur Jagung)</option>
            <option>Susu Formula Khusus Gizi Kurang</option>
          </select>
          <FieldErr msg={props.fieldErrors.pmt_jenis} />
        </div>
      )}

      <ImunisasiGrid {...props} />
    </>
  );
}

export function BumilForm(props: FormSectionProps) {
  const { form, updateForm, disabled, canGiveImunisasi } = props;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CheckPill
          icon={<Pill className="w-5 h-5" />}
          title="Tablet Tambah Darah (Fe 30 butir)"
          color="pink"
          checked={form.tablet_fe}
          onChange={(v) => updateForm({ tablet_fe: v })}
          disabled={disabled}
        />
        <CheckPill
          icon={<HeartPulse className="w-5 h-5" />}
          title="PMT Ibu Hamil KEK"
          color="green"
          checked={form.pmt}
          onChange={(v) => updateForm({ pmt: v })}
          disabled={disabled}
        />
      </div>
      <div className="p-4 bg-pink-50 rounded-2xl border border-pink-200">
        <label className="block text-xs font-bold text-pink-900 mb-2">
          Imunisasi TT (Tetanus Toksoid)
          {!canGiveImunisasi && (
            <span className="ml-2 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              Hanya Bidan/Admin
            </span>
          )}
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((ke) => (
            <button
              type="button"
              key={ke}
              disabled={disabled}
              onClick={() => !disabled && canGiveImunisasi && updateForm({ imunisasi_tt_ke: form.imunisasi_tt_ke === ke ? null : ke })}
              title={!canGiveImunisasi ? "Hanya Bidan/Admin" : undefined}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                form.imunisasi_tt_ke === ke
                  ? "bg-pink-600 border-pink-600 text-white shadow-sm"
                  : "bg-white border-pink-200 text-pink-700 hover:bg-pink-100"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              TT{ke}
            </button>
          ))}
        </div>
        <FieldErr msg={props.fieldErrors.imunisasi_tt_ke} />
      </div>
      <CheckPill
        icon={<Baby className="w-5 h-5" />}
        title="Kapsul Vitamin A (ibu nifas)"
        color="amber"
        checked={form.vitamin_a}
        onChange={(v) => updateForm({ vitamin_a: v })}
        disabled={disabled}
      />
      <CheckPill
        icon={<HeartPulse className="w-5 h-5" />}
        title="Konseling Kehamilan"
        color="green"
        checked={form.konseling}
        onChange={(v) => updateForm({ konseling: v })}
        disabled={disabled}
      />
    </div>
  );
}

export function LansiaForm(props: FormSectionProps) {
  const { form, updateForm, disabled, fieldErrors } = props;
  return (
    <div className="space-y-3">
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
        <p className="font-bold">Pemeriksaan Lanjut Lansia</p>
        <p className="mt-1">Edukasi kepatuhan obat hipertensi/diabetes dan senam lansia rutin di Balai RW 06.</p>
      </div>
      <CheckPill
        icon={<HeartPulse className="w-5 h-5" />}
        title="Konseling Kesehatan Lansia"
        color="green"
        checked={form.konseling}
        onChange={(v) => updateForm({ konseling: v })}
        disabled={disabled}
      />
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Obat Rutin yang Diberikan</label>
        <input
          type="text"
          value={form.obat_rutin}
          disabled={disabled}
          onChange={(e) => updateForm({ obat_rutin: e.target.value })}
          placeholder="Misal: Amlodipine 5mg, Metformin 500mg"
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky-500 disabled:opacity-60"
        />
        <FieldErr msg={fieldErrors.obat_rutin} />
      </div>
    </div>
  );
}

export function WusForm(props: FormSectionProps) {
  const { form, updateForm, disabled } = props;
  return (
    <div className="space-y-3">
      <CheckPill
        icon={<Stethoscope className="w-5 h-5" />}
        title="Skrining Anemia"
        color="green"
        checked={form.skrining_anemia}
        onChange={(v) => updateForm({ skrining_anemia: v })}
        disabled={disabled}
      />
      <CheckPill
        icon={<Pill className="w-5 h-5" />}
        title="Tablet Tambah Darah (Tablet Fe)"
        color="pink"
        checked={form.tablet_fe}
        onChange={(v) => updateForm({ tablet_fe: v })}
        disabled={disabled}
      />
      <CheckPill
        icon={<HeartPulse className="w-5 h-5" />}
        title="Konseling Kesehatan Reproduksi"
        color="green"
        checked={form.konseling}
        onChange={(v) => updateForm({ konseling: v })}
        disabled={disabled}
      />
    </div>
  );
}

export function UmumForm(props: FormSectionProps) {
  const { form, updateForm, disabled } = props;
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
        Kategori <span className="font-bold text-gray-800">Umum</span>: catat konseling/edukasi yang diberikan.
      </p>
      <CheckPill
        icon={<HeartPulse className="w-5 h-5" />}
        title="Konseling / Edukasi Kesehatan"
        color="green"
        checked={form.konseling}
        onChange={(v) => updateForm({ konseling: v })}
        disabled={disabled}
      />
    </div>
  );
}

export function RujukanForm(props: FormSectionProps) {
  const { form, updateForm, disabled, fieldErrors } = props;
  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      <CheckPill
        icon={<AlertTriangle className="w-5 h-5" />}
        title="Perlu Rujukan ke Puskesmas Junrejo"
        color="red"
        checked={form.rujukan}
        onChange={(v) => updateForm({ rujukan: v })}
        disabled={disabled}
      />

      {form.rujukan && (
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold text-rose-900 mb-1">Tujuan Fasilitas Rujukan *</label>
            <input
              value={form.tujuan_rujukan}
              disabled={disabled}
              onChange={(e) => updateForm({ tujuan_rujukan: e.target.value })}
              placeholder="Puskesmas Junrejo"
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold disabled:opacity-60"
            />
            <FieldErr msg={fieldErrors.tujuan_rujukan} />
          </div>
          <div>
            <label className="block text-xs font-bold text-rose-900 mb-1">Alasan / Indikasi Klinis Rujukan *</label>
            <textarea
              rows={2}
              value={form.alasan_rujukan}
              disabled={disabled}
              onChange={(e) => updateForm({ alasan_rujukan: e.target.value })}
              placeholder="Misal: berat badan turun 2 kali berturut-turut (2T), Z-Score BB/U < -3 SD, tanda dehidrasi."
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs outline-none disabled:opacity-60"
            />
            <FieldErr msg={fieldErrors.alasan_rujukan} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ImunisasiPillIcon() {
  return <Syringe className="w-4 h-4" />;
}
