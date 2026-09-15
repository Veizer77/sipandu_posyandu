/**
 * SIPANDU - Meja 5: form dokumentasi + template (ekstraksi dari Meja5.tsx, M5-028).
 * M5-009: form kosong default; template hanya mengisi saat dipilih eksplisit.
 * M5-021: template diurutkan berdasar relevansi demografi hadir.
 * M5-025: batas panjang + counter media/ringkasan.
 */
import { Megaphone, Sparkles, Users, Baby, HeartPulse, ShieldAlert, GraduationCap } from "lucide-react";
import {
  TEMA_MIN_LEN,
  TEMA_MAX_LEN,
  NARASUMBER_MAX_LEN,
  MEDIA_MAX_LEN,
  RINGKASAN_MAX_LEN,
  METODE_OPTIONS,
  type PenyuluhanTemplate,
} from "@/lib/meja5Logic";

const TEMPLATE_ICONS: Record<string, typeof Baby> = {
  "Balita & Baduta": Baby,
  "Ibu Hamil": HeartPulse,
  Imunisasi: ShieldAlert,
  "Lansia & Dewasa": GraduationCap,
};

export interface Meja5FormValues {
  tema: string;
  narasumber: string;
  jumlah: number | "";
  metode: string;
  media: string;
  ringkasan: string;
}

interface Meja5FormProps {
  values: Meja5FormValues;
  onChange: (patch: Partial<Meja5FormValues>) => void;
  fieldErrors: Record<string, string>;
  hadirCount: number;
  rankedTemplates: Array<PenyuluhanTemplate & { relevan: boolean }>;
  activeTemplateIdx: number | null;
  onApplyTemplate: (tmpl: PenyuluhanTemplate & { relevan: boolean }, rankIdx: number) => void;
  disabled: boolean;
  isEditing: boolean;
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-rose-600 font-semibold mt-1">{msg}</p>;
}

export function Meja5Form({
  values,
  onChange,
  fieldErrors,
  hadirCount,
  rankedTemplates,
  activeTemplateIdx,
  onApplyTemplate,
  disabled,
  isEditing,
}: Meja5FormProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {isEditing ? "Ubah Dokumentasi Penyuluhan" : "Formulir Penyuluhan Hari Ini"}
            </h2>
            <p className="text-xs text-gray-500">Isi data kegiatan atau pilih template materi standar Kemenkes di bawah</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Template Cepat Materi ILP Kemenkes
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rankedTemplates.map((t, rankIdx) => {
            const Icon = TEMPLATE_ICONS[t.kategori] || Megaphone;
            const isSelected = activeTemplateIdx === rankIdx;
            return (
              <button
                key={t.tema}
                type="button"
                disabled={disabled}
                onClick={() => onApplyTemplate(t, rankIdx)}
                className={`p-3 rounded-2xl text-left border transition flex items-start gap-2.5 disabled:opacity-60 ${
                  isSelected
                    ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/10 shadow-xs"
                    : "bg-gray-50/70 border-gray-200/80 hover:bg-gray-50"
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white text-teal-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                      {t.kategori}
                    </span>
                    {t.relevan && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Relevan hari ini
                      </span>
                    )}
                    {isSelected && <span className="text-[10px] font-bold text-emerald-600">✓ Aktif</span>}
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-1 line-clamp-2 leading-tight">
                    {t.tema}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Tema / Topik Penyuluhan <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[10px] font-semibold ${values.tema.length < TEMA_MIN_LEN || values.tema.length > TEMA_MAX_LEN ? "text-amber-600 font-bold" : "text-gray-400"}`}>
              {values.tema.length}/{TEMA_MAX_LEN} karakter (min {TEMA_MIN_LEN})
            </span>
          </div>
          <textarea
            rows={2}
            value={values.tema}
            minLength={TEMA_MIN_LEN}
            maxLength={TEMA_MAX_LEN}
            disabled={disabled}
            onChange={(e) => onChange({ tema: e.target.value })}
            placeholder="Tuliskan topik penyuluhan yang dibawakan (min. 5 karakter)..."
            required
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm font-semibold text-gray-900 outline-none transition disabled:opacity-60"
          />
          <FieldErr msg={fieldErrors.tema} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Narasumber / Fasilitator <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-gray-400">{values.narasumber.length}/{NARASUMBER_MAX_LEN}</span>
            </div>
            <input
              type="text"
              value={values.narasumber}
              maxLength={NARASUMBER_MAX_LEN}
              disabled={disabled}
              onChange={(e) => onChange({ narasumber: e.target.value })}
              placeholder="Nama bidan / kader pembicara..."
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition disabled:opacity-60"
            />
            <FieldErr msg={fieldErrors.narasumber} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Jumlah Peserta Hadir <span className="text-rose-500">*</span></span>
              {hadirCount > 0 && (
                <span className="text-[10px] font-semibold text-teal-600">Hadir Meja 1: {hadirCount}</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                type="number"
                min={1}
                value={values.jumlah}
                disabled={disabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange({ jumlah: raw === "" ? "" : parseInt(raw || "0", 10) });
                }}
                placeholder={hadirCount > 0 ? `Contoh: ${hadirCount}` : "Contoh: 20"}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-bold text-gray-900 outline-none transition disabled:opacity-60"
              />
            </div>
            <FieldErr msg={fieldErrors.jumlah_peserta} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Metode Penyuluhan (PRD)
            </label>
            <select
              value={values.metode}
              disabled={disabled}
              onChange={(e) => onChange({ metode: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition disabled:opacity-60"
            >
              {METODE_OPTIONS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <FieldErr msg={fieldErrors.metode} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Media / Alat Bantu KIE
              </label>
              <span className="text-[10px] font-semibold text-gray-400">{values.media.length}/{MEDIA_MAX_LEN}</span>
            </div>
            <input
              type="text"
              value={values.media}
              maxLength={MEDIA_MAX_LEN}
              disabled={disabled}
              onChange={(e) => onChange({ media: e.target.value })}
              placeholder="Contoh: Lembar Balik, Leaflet, Poster, Buku KIA..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm font-medium outline-none transition disabled:opacity-60"
            />
            <FieldErr msg={fieldErrors.media} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Ringkasan Materi & Pesan Kunci
            </label>
            <span className="text-[10px] font-semibold text-gray-400">{values.ringkasan.length}/{RINGKASAN_MAX_LEN}</span>
          </div>
          <textarea
            rows={3}
            value={values.ringkasan}
            maxLength={RINGKASAN_MAX_LEN}
            disabled={disabled}
            onChange={(e) => onChange({ ringkasan: e.target.value })}
            placeholder="Poin-poin edukasi yang disampaikan kepada peserta posyandu..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-teal-500 text-xs sm:text-sm leading-relaxed outline-none transition disabled:opacity-60"
          />
          <FieldErr msg={fieldErrors.ringkasan} />
        </div>
      </div>
    </div>
  );
}
