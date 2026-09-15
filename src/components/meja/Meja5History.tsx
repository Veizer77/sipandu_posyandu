/**
 * SIPANDU - Meja 5: riwayat penyuluhan sesi + edit/delete (ekstraksi, M5-028).
 * M5-011: edit & hapus per item (konfirmasi 2-klik + permission).
 * M5-026: timestamp tampil. M5-019: error baca dibedakan dari kosong.
 */
import { BookOpen, FileText, Pencil, Trash2, AlertTriangle, RefreshCw } from "lucide-react";

interface Meja5HistoryProps {
  items: any[];
  loadError: string | null;
  onRetry: () => void;
  canManage: boolean;
  editingId: string | null;
  onEdit: (item: any) => void;
  deleteArmedId: string | null;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Meja5History({
  items,
  loadError,
  onRetry,
  canManage,
  editingId,
  onEdit,
  deleteArmedId,
  onDelete,
  deleting,
}: Meja5HistoryProps) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-gray-900 text-sm">Dokumentasi Sesi Aktif</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
          {items.length} Tercatat
        </span>
      </div>

      {loadError ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Gagal memuat riwayat: {loadError}
          </p>
          <p className="text-rose-700">Daftar kosong di bawah belum tentu berarti belum ada data — jangan submit duplikat sebelum muat ulang.</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-700">Belum Ada Penyuluhan Disimpan</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Isi formulir dan klik "Simpan" untuk merekam kegiatan penyuluhan hari ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {items.map((p: any) => {
            const armed = deleteArmedId === p.id;
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${isEditing ? "bg-amber-50/60 border-amber-300" : "bg-teal-50/50 border-teal-100"}`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-gray-900 leading-tight">{p.tema}</h4>
                  <span className="shrink-0 px-2 py-0.5 bg-white border border-teal-200 text-teal-800 rounded font-bold text-[10px]">
                    {p.jumlah_peserta ?? p.jumlah} Peserta
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  <strong>Narasumber:</strong> {p.narasumber} · {p.metode || "—"}
                </p>
                <p className="text-[10px] text-gray-400">Dicatat: {formatWaktu(p.created_at)}</p>
                {p.ringkasan && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100/80 mt-1">
                    <p className="text-[11px] text-gray-600 leading-relaxed break-words">
                      {p.ringkasan}
                    </p>
                  </div>
                )}
                {canManage && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> {isEditing ? "Sedang diubah" : "Ubah"}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => onDelete(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-60 ${
                        armed
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <Trash2 className="w-3 h-3" /> {armed ? "Yakin? Klik lagi" : "Hapus"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
