/**
 * SIPANDU - Integrasi SINDUKSADATI RW 06 (PRD Bagian 42)
 * Terhubung melalui proxy backend SIPANDU dengan credential provider server-side.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link2, CircleCheckBig, ArrowDownUp, Database, ListTree, RefreshCw, Search, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, RefreshCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { SinduksadatiService } from "@/services/sinduksadatiService";
import { maskNik } from "@/lib/utils";

export default function IntegrasiSinduksadati() {
  const { showToast } = useAuth();
  const { data, linkPendudukSinduksadati } = useSipandu();

  const [liveStatus, setLiveStatus] = useState<{ online: boolean; latencyMs: number; message: string; hint?: string; kode?: string }>({
    online: false,
    latencyMs: 0,
    message: "Belum diperiksa",
  });
  const [checkingLive, setCheckingLive] = useState(false);

  // Manual linking modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [inputNik, setInputNik] = useState("3579012403100003");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Citizen 360 preview participant
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(() => data.anggota[0]?.id || "");

  // Auto-check live gateway status on load
  async function checkLive() {
    setCheckingLive(true);
    try {
      const res = await SinduksadatiService.pingLiveStatus();
      setLiveStatus(res);
      if (res.online && res.kode === "ONLINE") {
        showToast("SINDUKSADATI Live Gateway connected!", "success");
      } else if (res.online && res.kode === "AUTH_REQUIRED") {
        showToast("Gateway terhubung — butuh otentikasi akun.", "warning");
      } else {
        showToast(`Gateway tidak aktif: ${res.message}`, "danger");
      }
    } catch {
      setLiveStatus({ online: false, latencyMs: 0, message: "Koneksi gateway gagal" });
      showToast("Gagal menghubungi SINDUKSADATI Live Gateway.", "danger");
    } finally {
      setCheckingLive(false);
    }
  }

  useEffect(() => {
    checkLive();
  }, []);

  async function handleSearchNik() {
    if (!inputNik || inputNik.length < 16) {
      setSearchError("Masukkan 16 digit NIK yang valid.");
      return;
    }
    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    const res = await SinduksadatiService.lookupWargaByNik(inputNik);
    setSearching(false);
    if (res.success && res.data) {
      setSearchResult(res.data);
    } else {
      setSearchError(res.message || "Data warga tidak ditemukan di master RW 06.");
    }
  }

  function handleLink() {
    if (!selectedAnggotaId || !searchResult) return;
    const targetAnggota = data.anggota.find((a: any) => a.id === selectedAnggotaId);
    linkPendudukSinduksadati(selectedAnggotaId, searchResult.hunian_id || `sdti-pdk-${inputNik.slice(0, 8)}`, searchResult.nama_lengkap);
    setModalOpen(false);
    showToast(`Berhasil menghubungkan ${targetAnggota?.nama} dengan master ${searchResult.nama_lengkap}.`, "success");
  }

  // Generate Citizen 360 preview
  const chosenMember = data.anggota.find((a: any) => a.id === selectedPreviewId) || data.anggota[0];
  const chosenVisit = data.kunjunganAktif.find((k: any) => k.anggota_id === chosenMember?.id) || data.kunjungan.find((k: any) => k.anggota_id === chosenMember?.id);
  const citizen360Json = useMemo(() => {
    if (!chosenMember) return "{}";
    const payload = SinduksadatiService.formatCitizen360Payload(chosenMember, chosenVisit);
    return JSON.stringify(payload, null, 2);
  }, [chosenMember, chosenVisit]);

  const master = data.sinduksadatiMaster || [];
  const events = data.sinduksadatiEvents || [];
  const linkedCount = data.anggota.filter((a: any) => a.sinduksadati_penduduk_id).length;
  const totalAnggota = data.anggota.length;
  const coverage = totalAnggota > 0 ? Math.round((linkedCount / totalAnggota) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/15 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
          <Link2 className="w-3 h-3" /> SINDUKSADATI LIVE Integration (PRD Bagian 42)
        </div>
        <h1 className="text-3xl font-extrabold">Sistem Informasi Penduduk Satu Data RW 06</h1>
        <p className="text-sky-100 text-sm mt-2 max-w-2xl">
          SINDUKSADATI adalah Single Source of Truth data kependudukan RW 06 Desa Mojorejo. SIPANDU mengonsumsi data identitas warga dan menyumbangkan ringkasan kesehatan untuk endpoint Citizen 360.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="font-bold text-slate-900 text-sm">No Duplicate Master</div>
          <p className="text-slate-600">SIPANDU tidak membuat master kependudukan baru. Anggota Posyandu dihubungkan ke <code className="bg-white px-1 py-0.5 rounded text-sky-700">penduduk_id</code> SINDUKSADATI.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="font-bold text-slate-900 text-sm">Data Privacy</div>
          <p className="text-slate-600">Data klinis detail (pengukuran fisik, catatan medis) tetap tersimpan aman di SIPANDU, hanya indikator agregat yang dibagikan.</p>
        </div>
         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
           <div className="font-bold text-slate-900 text-sm">Live Gateway API</div>
           <p className="text-slate-600">SIPANDU terhubung melalui API internal yang menjaga kredensial integrasi tetap di sisi server.</p>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Status Live Gateway</p>
              <p className={`text-2xl font-bold mt-1 ${liveStatus.online ? (liveStatus.kode === "AUTH_REQUIRED" ? "text-amber-600" : "text-emerald-600") : "text-rose-600"}`}>
                {liveStatus.online ? (liveStatus.kode === "AUTH_REQUIRED" ? "Proxy OK — Login Dibutuhkan" : "Connected") : "Disconnected"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                <span>{liveStatus.message}</span>{liveStatus.latencyMs > 0 && <span> · {liveStatus.latencyMs}ms</span>}
              </p>
              {liveStatus.hint && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-1.5">
                  💡 {liveStatus.hint}
                </p>
              )}
            </div>
            <button
              onClick={checkLive}
              disabled={checkingLive}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Periksa Ulang Koneksi"
            >
              <RefreshCw className={`w-5 h-5 ${checkingLive ? "animate-spin text-sky-600" : ""}`} />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Linking Coverage Warga</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{coverage}%</p>
          <div className="mt-2 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-sky-600 h-full transition-all duration-500" style={{ width: `${coverage}%` }} />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{linkedCount} dari {totalAnggota} anggota Posyandu terhubung</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Webhook Events (24 jam)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{events.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Lifecycle events kependudukan aktif</p>
        </div>
      </div>

      {/* Table Master Penduduk SINDUKSADATI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ListTree className="w-4 h-4 text-sky-600" /> Daftar Penduduk Master SINDUKSADATI RW 06
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Data kependudukan primer dari sistem SINDUKSADATI</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" /> Tool Linking Manual & Live Lookup
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Resident Code</th>
                <th className="px-4 py-3">NIK</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">RT/RW</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Link SIPANDU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {master.map((m: any) => (
                <tr key={m.penduduk_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{m.resident_code}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{m.nik_masked}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{m.nama_lengkap}</td>
                  <td className="px-4 py-3 text-gray-600">{m.rt}/{m.rw}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{m.status_penduduk}</span>
                  </td>
                  <td className="px-4 py-3">
                    {m.linked_sipandu_anggota_id ? (
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[10px] font-bold">
                        → Terhubung
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">Belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Event Log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><ArrowDownUp className="w-4 h-4 text-emerald-600" /> Webhook Event Log</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {events.map((e: any) => (
            <div key={e.id} className="p-4 flex items-start justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded font-bold">{e.event_type}</span>
                  <span className="font-mono text-gray-400">{e.id}</span>
                </div>
                <p className="text-gray-800 mt-1 font-semibold">{e.deskripsi}</p>
                <p className="text-[11px] text-gray-500">Penduduk ID: {e.sinduksadati_penduduk_id}</p>
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(e.tanggal).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Simulator Output Citizen 360 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" /> Simulator Output Citizen 360 ke SINDUKSADATI (PRD §42.8)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Payload ringkasan kesehatan yang disinkronisasikan ke profil 360 warga</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Pilih Sasaran:</span>
            <select
              value={selectedPreviewId}
              onChange={(e) => setSelectedPreviewId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            >
              {data.anggota.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kategori})
                </option>
              ))}
            </select>
          </div>
        </div>

        <pre className="bg-slate-900 text-emerald-300 p-5 rounded-2xl text-[11px] leading-relaxed overflow-x-auto font-mono shadow-inner">
          {citizen360Json}
        </pre>
      </div>

      {/* Modal Tool Linking Manual & Live Lookup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Tool Linking Manual & Live NIK Lookup</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Target Anggota Posyandu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">1. Pilih Anggota SIPANDU yang akan di-link</label>
              <select
                value={selectedAnggotaId}
                onChange={(e) => setSelectedAnggotaId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="">-- Pilih Anggota Posyandu --</option>
                {data.anggota.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} (NIK: {maskNik(a.nik)}) {a.sinduksadati_penduduk_id ? "✓ Sudah Terhubung" : "⚠ Belum Link"}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Live Search on SINDUKSADATI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">2. Cari Master Kependudukan di SINDUKSADATI (Live)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputNik}
                  onChange={(e) => setInputNik(e.target.value)}
                  placeholder="Ketik 16 digit NIK..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleSearchNik}
                  disabled={searching}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Cari LIVE</span>
                </button>
              </div>
            </div>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {searchResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">{searchResult.nama_lengkap}</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-bold text-[10px]">
                    {searchResult.status_penduduk}
                  </span>
                </div>
                <p className="text-slate-700"><strong>Alamat:</strong> {searchResult.alamat || "Jl. Mojorejo RW 06"}</p>
                <p className="text-slate-700"><strong>Wilayah:</strong> RT {searchResult.nomor_rt} / RW {searchResult.nomor_rw}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedAnggotaId}
                    onClick={handleLink}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    Hubungkan Logical Link Sekarang →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
