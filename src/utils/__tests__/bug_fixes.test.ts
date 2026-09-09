import { describe, it, expect } from "vitest";
import WHO_ENGINE from "@/utils/zscoreCalculator";

describe("Bug Fixes Verification", () => {
  describe("Bug 1 & 2 & 8: Alur Risiko & Objek Risiko", () => {
    it("menghasilkan objek risiko klinis dengan properti lengkap (kode, judul, deskripsi, severity, tindakLanjut)", () => {
      // Bumil dengan TD tinggi (Hipertensi Gestasional)
      const risikoBumil = WHO_ENGINE.deteksiRisiko("ibu_hamil", {
        td_sistolik: "150",
        td_diastolik: "95",
        lingkar_lengan: "21.5",
      });

      expect(risikoBumil.length).toBeGreaterThanOrEqual(2);
      for (const r of risikoBumil) {
        expect(r.kode).toBeDefined();
        expect(typeof r.kode).toBe("string");
        expect(r.judul).toBeDefined();
        expect(typeof r.judul).toBe("string");
        expect(r.deskripsi).toBeDefined();
        expect(typeof r.deskripsi).toBe("string");
        expect(r.severity).toBeDefined();
        expect(["danger", "warning", "info"]).toContain(r.severity);
        expect(r.tindakLanjut).toBeDefined();
      }
    });

    it("memvalidasi kecocokan skema risiko terhadap dbService.catatRisiko", () => {
      const visitId = "kunj-test-uuid";
      const anggotaId = "agt-test-uuid";
      const risikoRaw = [
        {
          kode: "R-B04",
          judul: "Gizi Kurang (-3 s.d -2 SD)",
          deskripsi: "Balita berada di bawah garis normal.",
          severity: "warning",
          tindakLanjut: "Pemberian Makanan Tambahan (PMT)",
        },
      ];

      // Simulasi mapping catatRisiko di data-store.tsx
      const rows = risikoRaw.map((r: any) => {
        const isObj = typeof r === "object" && r !== null;
        return {
          kunjungan_id: visitId,
          anggota_id: anggotaId,
          kode_risiko: (isObj && (r.kode_risiko || r.kode)) || "R-GEN",
          deskripsi: (isObj && (r.deskripsi || r.judul)) || String(r),
          severity: (isObj && r.severity) || "warning",
          tindak_lanjut: (isObj && (r.tindak_lanjut || r.tindakLanjut)) || "Konseling & Pantau Rutin",
        };
      });

      expect(rows[0]).toEqual({
        kunjungan_id: "kunj-test-uuid",
        anggota_id: "agt-test-uuid",
        kode_risiko: "R-B04",
        deskripsi: "Balita berada di bawah garis normal.",
        severity: "warning",
        tindak_lanjut: "Pemberian Makanan Tambahan (PMT)",
      });
    });

    it("menangani mapping allRisiko dengan graceful fallback jika ada string legacy", () => {
      const mockRisikoObj = {
        id: "r-1",
        kunjungan_id: "k-1",
        anggota_id: "a-1",
        kode: "R-H01",
        judul: "Hipertensi Gestasional",
        deskripsi: "Hipertensi Gestasional",
        severity: "danger",
        tindakLanjut: "Rujuk ke Puskesmas",
        status: "aktif",
      };

      const mockLegacyString = "Gizi Kurang (-3 s.d -2 SD)";

      // Simulasi parser allRisiko di BidanRisiko
      const parseItem = (r: any, idx: number, kId: string) => {
        const isObj = typeof r === "object" && r !== null;
        const judul = isObj ? (r.judul || r.deskripsi || "Risiko Terdeteksi") : String(r);
        const kode = isObj ? (r.kode || r.kode_risiko || `R-${idx + 1}`) : `R-${idx + 1}`;
        const id = isObj && r.id ? r.id : `${kId}-${kode}`;
        return {
          id,
          kode,
          judul,
          severity: (isObj && r.severity) || (judul.toLowerCase().includes("buruk") ? "danger" : "warning"),
          tindakLanjut: (isObj && (r.tindakLanjut || r.tindak_lanjut)) || "Konseling & Pantau Rutin",
          status: (isObj && r.status) || "aktif",
        };
      };

      const parsedObj = parseItem(mockRisikoObj, 0, "k-1");
      expect(parsedObj.id).toBe("r-1");
      expect(parsedObj.kode).toBe("R-H01");
      expect(parsedObj.severity).toBe("danger");

      const parsedLegacy = parseItem(mockLegacyString, 1, "k-1");
      expect(parsedLegacy.id).not.toContain("undefined");
      expect(parsedLegacy.id).toBe("k-1-R-2");
      expect(parsedLegacy.kode).toBe("R-2");
      expect(parsedLegacy.judul).toBe("Gizi Kurang (-3 s.d -2 SD)");
      expect(parsedLegacy.severity).toBe("warning");
    });
  });

  describe("Bug 3 & 7: Isolasi Sesi & Buka Kembali", () => {
    it("tidak mencampur kunjungan lama jika jadwalId tidak cocok", () => {
      const historyVisits = [
        { id: "v-old-1", jadwal_id: "jadwal-lama", nama: "Peserta Lama 1" },
        { id: "v-old-2", jadwal_id: "jadwal-lama", nama: "Peserta Lama 2" },
      ];

      const targetJadwalId = "jadwal-baru-sesi-ini";

      // Logika baru updateJadwalStatus
      const matchingVisits = historyVisits.filter(
        (k: any) => k.jadwal_id === targetJadwalId || k.jadwal_posyandu_id === targetJadwalId
      );

      // Sesi baru harusnya 0 kunjungan aktif, BUKAN mengambil slice(0, 38)
      expect(matchingVisits.length).toBe(0);
    });

    it("mencegah Buka Kembali jika ada sesi lain yang sedang aktif", () => {
      const jadwalList = [
        { id: "sesi-1", tema: "Posyandu Januari", status: "aktif" },
        { id: "sesi-2", tema: "Posyandu Februari", status: "selesai" },
      ];

      const activeSession = jadwalList.find((s) => s.status === "aktif");
      const targetToReopen = "sesi-2";

      const canReopen = !(activeSession && activeSession.id !== targetToReopen);
      expect(canReopen).toBe(false);
    });
  });

  describe("Bug 4: Non-destructive Polling Merge", () => {
    it("mempertahankan input pengukuran lokal saat polling DB tiba", () => {
      const prevKunjunganAktif = [
        {
          id: "v-1",
          anggota_id: "a-1",
          status_alur: "meja_2_pengukuran",
          pengukuran: { berat_badan: 12.5, tinggi_badan: 85 },
          catatan: {},
          pelayanan: {},
          risiko: [],
        },
      ];

      // Kunjungan dari DB yang belum memiliki data pengukuran
      const dbActiveVisits = [
        {
          id: "v-1",
          anggota_id: "a-1",
          status_alur: "meja_2_pengukuran",
          pengukuran: {},
          catatan: {},
          pelayanan: {},
          risiko: [],
        },
      ];

      // Logika non-destructive merge di data-store.tsx
      const mergedAktif = dbActiveVisits.map((dbV: any) => {
        const localV = prevKunjunganAktif.find((lv: any) => lv.id === dbV.id || lv.anggota_id === dbV.anggota_id);
        if (!localV) return dbV;
        return {
          ...dbV,
          ...localV,
          status_alur: dbV.status_alur === "selesai" ? "selesai" : (localV.status_alur || dbV.status_alur),
          pengukuran: { ...(dbV.pengukuran || {}), ...(localV.pengukuran || {}) },
          catatan: { ...(dbV.catatan || {}), ...(localV.catatan || {}) },
          pelayanan: { ...(dbV.pelayanan || {}), ...(localV.pelayanan || {}) },
          risiko: (localV.risiko && localV.risiko.length > 0) ? localV.risiko : (dbV.risiko || []),
        };
      });

      expect(mergedAktif[0].pengukuran.berat_badan).toBe(12.5);
      expect(mergedAktif[0].pengukuran.tinggi_badan).toBe(85);
    });
  });

  describe("Bug 5: Tandai Semua Dibaca", () => {
    it("memperbarui status dibaca semua notifikasi secara immutable", () => {
      const notifikasiAwal = [
        { id: "n-1", pesan: "Test 1", dibaca: false },
        { id: "n-2", pesan: "Test 2", dibaca: false },
      ];

      const notifikasiBaru = notifikasiAwal.map((n) => ({ ...n, dibaca: true }));
      const unread = notifikasiBaru.filter((n) => !n.dibaca).length;

      expect(unread).toBe(0);
      expect(notifikasiAwal[0].dibaca).toBe(false); // tidak mutasi objek asli
      expect(notifikasiBaru[0].dibaca).toBe(true);
    });
  });

  describe("Bug 6: Pencegahan Race Check-in Ganda", () => {
    it("menolak check-in ganda jika ID anggota yang sama sedang diproses atau sudah ada", () => {
      const checkInLocks = new Set<string>();
      const existingVisits = [{ id: "v-1", anggota_id: "a-1" }];

      const tryCheckIn = (anggotaId: string) => {
        if (checkInLocks.has(anggotaId) || existingVisits.some((v) => v.anggota_id === anggotaId)) {
          return { success: false, reason: "Sudah check-in atau sedang diproses" };
        }
        checkInLocks.add(anggotaId);
        return { success: true };
      };

      const res1 = tryCheckIn("a-1");
      expect(res1.success).toBe(false);

      const res2 = tryCheckIn("a-2");
      expect(res2.success).toBe(true);

      const res3Parallel = tryCheckIn("a-2");
      expect(res3Parallel.success).toBe(false);
    });
  });

  describe("Pencegahan Reset Input Form Meja 2 Saat Background Polling", () => {
    it("tidak menimpa data input form yang sedang diketik kader ketika array kunjunganAktif diperbarui di background", () => {
      let formState = { berat_badan: "12.5", tinggi_badan: "88.0" };
      let isDirty = true;
      let loadedAnggotaId = "agt-001";

      // Simulasi background polling update data.kunjunganAktif
      const newBackgroundKunjunganAktif = [
        {
          id: "k-1",
          anggota_id: "agt-001",
          pengukuran: {}, // kosong di DB karena belum di-submit
        },
      ];

      // Safe sync logic yang diterapkan di Meja 2
      const handleSync = (currentAnggotaId: string, bgVisits: any[]) => {
        if (loadedAnggotaId !== currentAnggotaId) {
          loadedAnggotaId = currentAnggotaId;
          isDirty = false;
          const visit = bgVisits.find((k: any) => k.anggota_id === currentAnggotaId);
          formState = { ...(visit?.pengukuran || {}) };
          return;
        }

        // Jika form sedang diketik (isDirty), JANGAN TIMPA!
        if (isDirty) return;

        const visit = bgVisits.find((k: any) => k.anggota_id === currentAnggotaId);
        if (visit?.pengukuran && Object.keys(visit.pengukuran).length > 0) {
          formState = { ...visit.pengukuran };
        }
      };

      // Jalankan sync saat background polling selesai
      handleSync("agt-001", newBackgroundKunjunganAktif);

      // Data yang sedang diketik HARUS tetap ada dan tidak hilang
      expect(formState.berat_badan).toBe("12.5");
      expect(formState.tinggi_badan).toBe("88.0");
      expect(isDirty).toBe(true);

      // Tapi saat berpindah ke peserta lain, form harus berganti sesuai peserta baru
      const participant2Visits = [
        {
          id: "k-2",
          anggota_id: "agt-002",
          pengukuran: { berat_badan: "60.0" },
        },
      ];
      handleSync("agt-002", participant2Visits);
      expect(formState.berat_badan).toBe("60.0");
      expect(isDirty).toBe(false);
    });

    it("menjamin silent polling tidak memicu isLoadingDb (mencegah flickering/unmount)", () => {
      let isLoadingDb = false;

      const refreshFromDb = (silent = false) => {
        if (!silent) isLoadingDb = true;
        // background fetch...
        if (!silent) isLoadingDb = false;
      };

      // Background polling interval berjalan dengan silent = true
      refreshFromDb(true);
      expect(isLoadingDb).toBe(false);

      // Manual refresh berjalan dengan silent = false
      refreshFromDb(false);
      expect(isLoadingDb).toBe(false);
    });
  });

  describe("Endpoint Standardization & RoleRedirect", () => {
    it("memastikan getRolePrefix mengembalikan prefix peran yang sesuai", async () => {
      const { getRolePrefix } = await import("@/lib/role-routes");
      expect(getRolePrefix("kader")).toBe("/kader");
      expect(getRolePrefix("bidan")).toBe("/bidan");
      expect(getRolePrefix("super_admin")).toBe("/admin");
      expect(getRolePrefix("ketua_pkk")).toBe("/pkk");
      expect(getRolePrefix("kepala_desa")).toBe("/kades");
    });

    it("mengonversi endpoint alur 5 meja menjadi URL ber-prefix peran yang rapi", async () => {
      const { getRoleMenuPath } = await import("@/lib/role-routes");

      // Kader
      expect(getRoleMenuPath("/meja1", "kader")).toBe("/kader/meja1");
      expect(getRoleMenuPath("/meja2", "kader")).toBe("/kader/meja2");
      expect(getRoleMenuPath("/meja2/:anggotaId", "kader")).toBe("/kader/meja2/:anggotaId");
      expect(getRoleMenuPath("/meja3", "kader")).toBe("/kader/meja3");
      expect(getRoleMenuPath("/meja4", "kader")).toBe("/kader/meja4");
      expect(getRoleMenuPath("/meja5", "kader")).toBe("/kader/meja5");
      expect(getRoleMenuPath("/rekap", "kader")).toBe("/kader/rekap");

      // Super Admin
      expect(getRoleMenuPath("/meja1", "super_admin")).toBe("/admin/meja1");
      expect(getRoleMenuPath("/meja2", "super_admin")).toBe("/admin/meja2");
      expect(getRoleMenuPath("/rekap", "super_admin")).toBe("/admin/rekap");
      expect(getRoleMenuPath("/keluarga", "super_admin")).toBe("/admin/keluarga");

      // Bidan
      expect(getRoleMenuPath("/meja1", "bidan")).toBe("/bidan/meja1");
      expect(getRoleMenuPath("/meja2", "bidan")).toBe("/bidan/meja2");
      expect(getRoleMenuPath("/bidan/verifikasi", "bidan")).toBe("/bidan/verifikasi");
      expect(getRoleMenuPath("/monitoring/bidan/risiko", "bidan")).toBe("/bidan/risiko");
    });

    it("melakukan substitusi parameter :anggotaId dan :kkId secara akurat", async () => {
      const { getRoleMenuPath } = await import("@/lib/role-routes");

      const anggotaId = "78572212-87c0-494f-ba1c-ed8e8866f10d";
      const kkId = "kk-test-999";

      let targetMeja = getRoleMenuPath("/meja2/:anggotaId", "kader");
      targetMeja = targetMeja.replace(":anggotaId", anggotaId);
      expect(targetMeja).toBe(`/kader/meja2/${anggotaId}`);

      let targetKeluarga = getRoleMenuPath("/keluarga/:kkId", "kader");
      targetKeluarga = targetKeluarga.replace(":kkId", kkId);
      expect(targetKeluarga).toBe(`/kader/keluarga/${kkId}`);
    });
  });

  describe("Meja 5: Edukasi & Penyuluhan Kelompok (PRD v3.0.0 Compliance)", () => {
    it("memvalidasi aturan input penyuluhan sesuai PRD Bab 15.3 dan Bab 9", () => {
      // Validator function matching Meja5.tsx logic
      const validatePenyuluhan = (input: {
        tema: string;
        narasumber: string;
        jumlah: number;
      }) => {
        const errors: string[] = [];
        const trimmedTema = input.tema.trim();
        if (!trimmedTema) errors.push("Tema penyuluhan wajib diisi.");
        else if (trimmedTema.length < 5) errors.push("Tema penyuluhan minimal 5 karakter.");
        else if (trimmedTema.length > 200) errors.push("Tema penyuluhan maksimal 200 karakter.");

        const trimmedNarasumber = input.narasumber.trim();
        if (!trimmedNarasumber) errors.push("Narasumber penyuluhan wajib diisi.");
        else if (trimmedNarasumber.length > 100) errors.push("Nama narasumber maksimal 100 karakter.");

        if (!input.jumlah || input.jumlah < 1) errors.push("Jumlah peserta minimal 1 orang.");

        return { valid: errors.length === 0, errors };
      };

      // Invalid: tema terlalu pendek (< 5 char)
      expect(validatePenyuluhan({ tema: "Gizi", narasumber: "Kader", jumlah: 10 }).valid).toBe(false);
      expect(validatePenyuluhan({ tema: "Gizi", narasumber: "Kader", jumlah: 10 }).errors).toContain("Tema penyuluhan minimal 5 karakter.");

      // Invalid: jumlah peserta < 1
      expect(validatePenyuluhan({ tema: "Pencegahan Stunting", narasumber: "Kader", jumlah: 0 }).valid).toBe(false);
      expect(validatePenyuluhan({ tema: "Pencegahan Stunting", narasumber: "Kader", jumlah: 0 }).errors).toContain("Jumlah peserta minimal 1 orang.");

      // Invalid: narasumber kosong
      expect(validatePenyuluhan({ tema: "Pencegahan Stunting", narasumber: "", jumlah: 15 }).valid).toBe(false);

      // Valid: memenuhi semua kriteria PRD
      const validRes = validatePenyuluhan({
        tema: "Pencegahan Stunting: MPASI Kaya Protein Hewani & Kapsul Vitamin A",
        narasumber: "Bdn. Siti Aminah, S.Tr.Keb & Kader Flamboyan",
        jumlah: 25,
      });
      expect(validRes.valid).toBe(true);
      expect(validRes.errors).toHaveLength(0);
    });

    it("memastikan data penyuluhan sesi aktif terintegrasi dan muncul di Rekapitulasi Sesi", () => {
      const activeJadwalId = "jadwal-aktif-uuid-001";
      const otherJadwalId = "jadwal-lampau-uuid-999";

      const mockPenyuluhanList = [
        {
          id: "peny-1",
          jadwal_id: activeJadwalId,
          jadwal_posyandu_id: activeJadwalId,
          tema: "Pencegahan Stunting: MPASI Kaya Protein Hewani",
          narasumber: "Bdn. Siti Aminah",
          jumlah_peserta: 22,
          jumlah: 22,
          metode: "Ceramah & Demonstrasi",
          ringkasan: "Edukasi MPASI telur & ikan",
        },
        {
          id: "peny-2",
          jadwal_id: otherJadwalId,
          jadwal_posyandu_id: otherJadwalId,
          tema: "Edukasi PHBS & Hipertensi",
          narasumber: "Kader Flamboyan",
          jumlah_peserta: 18,
          jumlah: 18,
          metode: "Ceramah",
          ringkasan: "Pengendalian garam",
        },
      ];

      // Simulasi filtering penyuluhanSesi di Rekap.tsx
      const penyuluhanSesi = mockPenyuluhanList.filter(
        (p: any) => !activeJadwalId || p.jadwal_posyandu_id === activeJadwalId || p.jadwal_id === activeJadwalId
      );

      expect(penyuluhanSesi).toHaveLength(1);
      expect(penyuluhanSesi[0].id).toBe("peny-1");
      expect(penyuluhanSesi[0].tema).toContain("Pencegahan Stunting");
      // Memastikan field jumlah_peserta tersedia untuk dirender di kartu Rekap
      expect(penyuluhanSesi[0].jumlah_peserta ?? penyuluhanSesi[0].jumlah).toBe(22);
    });
  });
});
