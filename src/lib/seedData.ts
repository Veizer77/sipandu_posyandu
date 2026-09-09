/**
 * SIPANDU - Data Master Terintegrasi 100% dengan SINDUKSADATI RW 06
 * Berisi 10 Keluarga (KK) dan 27 Warga Terdaftar (Selaras Database Master SINDUKSADATI)
 * Bersih tanpa dummy/mock kunjungan (Clean State).
 */

export const SIPANDU_SEED = {
  posyandu: {
    id: "a0000000-0000-0000-0000-000000000001",
    nama: "Posyandu ILP Flamboyan RW 06",
    rw: "06",
    desa: "Mojorejo",
    kecamatan: "Junrejo",
    kota: "Kota Batu",
    provinsi: "Jawa Timur",
    telepon: "0812-3456-7890",
    email: "posyandu.flamboyan06@mojorejo.desa.id",
    jadwal_hari: "Sabtu Minggu ke-2",
    jadwal_mulai: "08:00",
    jadwal_selesai: "12:00",
    lokasi: "Balai RW 06 Mojorejo, Kec. Junrejo"
  },

  organisasi: [
    { id: "315eb6cb-02e4-4f30-9d3f-6adb13486d4f", jabatan: "kepala_desa", nama: "Bpk. Rujito", gelar: "", urutan: 1 },
    { id: "539443dc-d940-4389-8bac-d7adb39317a5", jabatan: "ketua_pkk", nama: "Ibu Sri Rahayu", gelar: "", urutan: 2 },
    { id: "61dd98fa-aa04-49d6-8cb6-e16227abc346", jabatan: "bidan", nama: "Bdn. Siti Rahmawati", gelar: "S.Tr.Keb", urutan: 3 },
    { id: "2e511bc7-4692-4e41-ae0e-5423bae749c0", jabatan: "kader", nama: "Ibu Suminarti", tugas: "Ketua Posyandu & Koordinator Meja 1", urutan: 4 },
    { id: "f7cdc3d5-75b2-4665-9d57-1c6bcc917e21", jabatan: "kader", nama: "Ibu Ratna", tugas: "Meja 2 (Antropometri)", urutan: 5 },
    { id: "5f6c211a-77ff-4b18-82f4-59608488aff0", jabatan: "kader", nama: "Ibu Eka", tugas: "Meja 3 (Pencatatan)", urutan: 6 }
  ],

  users: [
    {
      id: "b391423a-9623-4f63-bec1-b33175299065",
      nama_lengkap: "Izzat (Super Admin)",
      peran: "super_admin",
      email: "admin@sipandu-flamboyan.id",
      foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      status_aktif: true
    },
    {
      id: "c44c07c4-7cd5-4f9e-8de2-bdc1be2fe318",
      nama_lengkap: "Bu Sari Handayani",
      peran: "kader",
      email: "kader@flamboyan.id",
      foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      status_aktif: true
    },
    {
      id: "59f9d975-6e3d-48e6-9594-20f409e43358",
      nama_lengkap: "Bdn. Siti Aminah, S.Tr.Keb",
      peran: "bidan",
      email: "bidan@flamboyan.id",
      foto: "https://images.unsplash.com/photo-1594824813681-3701540e163b?w=200&auto=format&fit=crop&q=80",
      status_aktif: true
    },
    {
      id: "d16aac56-ba49-454b-8c53-c6eadfd5a508",
      nama_lengkap: "Ibu Hartini Sutrisno",
      peran: "ketua_pkk",
      email: "pkk@mojorejo.desa.id",
      foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      status_aktif: true
    },
    {
      id: "009018b9-8bcb-4d77-b7fc-7a00804efdaa",
      nama_lengkap: "Bpk. Bambang Sutrisno, S.Sos",
      peran: "kepala_desa",
      email: "kades@mojorejo.desa.id",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      status_aktif: true
    }
  ],

  jadwal: [
    {
      id: "3b8467a2-62de-4307-aa62-fc3e7e685e10",
      tanggal: "2026-08-15",
      jenis: "bulanan",
      tempat: "Balai RW 06 Flamboyan",
      catatan: "Pelayanan Posyandu ILP rutin bulan Agustus 2026 (Vitamin A & Imunisasi)",
      status: "aktif"
    }
  ],

  // 10 KK 100% Identik dengan Database SINDUKSADATI
  keluarga: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      nomor_kk: "3579011508080001",
      nama_kepala_keluarga: "Bambang Subagyo",
      alamat: "Jl. Mojorejo RT 14 Blok B No. 12",
      rt: "14",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_3"
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      nomor_kk: "3579012010210002",
      nama_kepala_keluarga: "Ahmad Fauzi",
      alamat: "Jl. Mojorejo RT 13 Blok A No. 04",
      rt: "13",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_2"
    },
    {
      id: "d0000000-0000-0000-0000-000000000003",
      nomor_kk: "3579010202150003",
      nama_kepala_keluarga: "Mbah Soetrisno",
      alamat: "Jl. Mojorejo RT 15 Blok C No. 08",
      rt: "15",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_1"
    },
    {
      id: "d0000000-0000-0000-0000-000000000004",
      nomor_kk: "3579011103190004",
      nama_kepala_keluarga: "Hendra Wijaya",
      alamat: "Jl. Mojorejo RT 15 Blok E No. 05",
      rt: "15",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_2"
    },
    {
      id: "d0000000-0000-0000-0000-000000000005",
      nomor_kk: "3579012509170005",
      nama_kepala_keluarga: "Agus Triyono",
      alamat: "Jl. Mojorejo RT 21 Blok F No. 10",
      rt: "21",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_3"
    },
    {
      id: "d0000000-0000-0000-0000-000000000006",
      nomor_kk: "3579010412150006",
      nama_kepala_keluarga: "Rudi Hartono",
      alamat: "Jl. Mojorejo RT 14 Blok B No. 03",
      rt: "14",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_2"
    },
    {
      id: "d0000000-0000-0000-0000-000000000007",
      nomor_kk: "3579011707200007",
      nama_kepala_keluarga: "Drs. H. Bambang Kusumo",
      alamat: "Jl. Mojorejo RT 15 Blok C No. 15",
      rt: "15",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_3_plus"
    },
    {
      id: "d0000000-0000-0000-0000-787963984791",
      nomor_kk: "3517141526226541",
      nama_kepala_keluarga: "Jagung Bakar",
      alamat: "Jl. Mojorejo RT 14 Blok Z No. 11",
      rt: "14",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_1"
    },
    {
      id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nomor_kk: "3517140112850002",
      nama_kepala_keluarga: "Sutrisno",
      alamat: "Jl. Mojorejo Raya No. R-02, RT 16 / RW 06",
      rt: "16",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "sejahtera_2"
    },
    {
      id: "d8c3987e-68ef-4a83-9b93-83bf411e7a38",
      nomor_kk: "3517140212700003",
      nama_kepala_keluarga: "Sulastri",
      alamat: "Jl. Mojorejo Kidul No. M-01, RT 23 / RW 06",
      rt: "23",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: "pra_sejahtera"
    }
  ],

  // 27 Anggota 100% Identik dengan Database SINDUKSADATI
  anggota: [
    // KK Bambang Subagyo (RT 14)
    {
      id: "e0000000-0000-0000-0000-000000000001",
      keluarga_id: "d0000000-0000-0000-0000-000000000001",
      nik: "3579011205800001",
      nama: "Bambang Subagyo",
      jenis_kelamin: "L",
      tanggal_lahir: "1980-05-12",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "wus",
      status_aktif: true,
      nomor_telepon: "0812-3456-7890",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
      id: "e0000000-0000-0000-0000-000000000002",
      keluarga_id: "d0000000-0000-0000-0000-000000000001",
      nik: "3579015508840002",
      nama: "Siti Rahmawati",
      jenis_kelamin: "P",
      tanggal_lahir: "1984-08-15",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true,
      nomor_telepon: "0813-8899-7711",
      foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
    },
    {
      id: "e0000000-0000-0000-0000-000000000003",
      keluarga_id: "d0000000-0000-0000-0000-000000000001",
      nik: "3579012403100003",
      nama: "Rizky Pratama Subagyo",
      jenis_kelamin: "L",
      tanggal_lahir: "2010-03-24",
      hubungan_keluarga: "Anak",
      kategori: "wus",
      status_aktif: true,
      nomor_telepon: "0812-7766-5544",
      foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
    },
    {
      id: "e0000000-0000-0000-0000-000000000004",
      keluarga_id: "d0000000-0000-0000-0000-000000000001",
      nik: "3579016104240004",
      nama: "Aisyah Putri Subagyo",
      jenis_kelamin: "P",
      tanggal_lahir: "2024-04-21",
      hubungan_keluarga: "Anak",
      kategori: "balita",
      status_aktif: true,
      berat_badan_lahir: 3.2,
      panjang_badan_lahir: 49.5,
      asi_eksklusif: true,
      foto: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=150"
    },
    // KK Ahmad Fauzi (RT 13)
    {
      id: "e0000000-0000-0000-0000-000000000005",
      keluarga_id: "d0000000-0000-0000-0000-000000000002",
      nik: "3579011809920005",
      nama: "Ahmad Fauzi",
      jenis_kelamin: "L",
      tanggal_lahir: "1992-09-18",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "wus",
      status_aktif: true,
      nomor_telepon: "0819-0987-6543",
      foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    },
    {
      id: "e0000000-0000-0000-0000-000000000006",
      keluarga_id: "d0000000-0000-0000-0000-000000000002",
      nik: "3579015002950006",
      nama: "Nadia Safitri",
      jenis_kelamin: "P",
      tanggal_lahir: "1995-02-10",
      hubungan_keluarga: "Istri",
      kategori: "ibu_hamil",
      status_aktif: true,
      status_hamil: true,
      nomor_telepon: "0819-5544-3322",
      foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    // KK Mbah Soetrisno (RT 15)
    {
      id: "e0000000-0000-0000-0000-000000000007",
      keluarga_id: "d0000000-0000-0000-0000-000000000003",
      nik: "3579010501550007",
      nama: "Mbah Soetrisno",
      jenis_kelamin: "L",
      tanggal_lahir: "1955-01-05",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "lansia",
      status_aktif: true,
      nomor_telepon: "0812-4433-2211",
      foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
    },
    // KK Hendra Wijaya (RT 15)
    {
      id: "e0000000-0000-0000-0000-000000000009",
      keluarga_id: "d0000000-0000-0000-0000-000000000004",
      nik: "3579011504780009",
      nama: "Hendra Wijaya",
      jenis_kelamin: "L",
      tanggal_lahir: "1978-04-15",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000010",
      keluarga_id: "d0000000-0000-0000-0000-000000000004",
      nik: "3579015206800010",
      nama: "Ratna Kartikasari",
      jenis_kelamin: "P",
      tanggal_lahir: "1980-06-12",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000011",
      keluarga_id: "d0000000-0000-0000-0000-000000000004",
      nik: "3579012001050011",
      nama: "Bayu Pratama Wijaya",
      jenis_kelamin: "L",
      tanggal_lahir: "2005-01-20",
      hubungan_keluarga: "Anak",
      kategori: "wus",
      status_aktif: true
    },
    // KK Agus Triyono (RT 21)
    {
      id: "e0000000-0000-0000-0000-000000000012",
      keluarga_id: "d0000000-0000-0000-0000-000000000005",
      nik: "3579010811850012",
      nama: "Agus Triyono",
      jenis_kelamin: "L",
      tanggal_lahir: "1985-11-08",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000013",
      keluarga_id: "d0000000-0000-0000-0000-000000000005",
      nik: "3579014502890013",
      nama: "Dewi Anggraini",
      jenis_kelamin: "P",
      tanggal_lahir: "1989-02-05",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true
    },
    // KK Rudi Hartono (RT 14)
    {
      id: "e0000000-0000-0000-0000-000000000014",
      keluarga_id: "d0000000-0000-0000-0000-000000000006",
      nik: "3579011409900014",
      nama: "Rudi Hartono",
      jenis_kelamin: "L",
      tanggal_lahir: "1990-09-14",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000015",
      keluarga_id: "d0000000-0000-0000-0000-000000000006",
      nik: "3579016307930015",
      nama: "Lestari Wulandari",
      jenis_kelamin: "P",
      tanggal_lahir: "1993-07-23",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true
    },
    // KK Drs. H. Bambang Kusumo (RT 15)
    {
      id: "e0000000-0000-0000-0000-000000000016",
      keluarga_id: "d0000000-0000-0000-0000-000000000007",
      nik: "3579012308650016",
      nama: "Drs. H. Bambang Kusumo",
      jenis_kelamin: "L",
      tanggal_lahir: "1965-08-23",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "lansia",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-000000000017",
      keluarga_id: "d0000000-0000-0000-0000-000000000007",
      nik: "3579015812680017",
      nama: "Hj. Endang Sri Wahyuni",
      jenis_kelamin: "P",
      tanggal_lahir: "1968-12-18",
      hubungan_keluarga: "Istri",
      kategori: "lansia",
      status_aktif: true
    },
    // KK Jagung Bakar (RT 14)
    {
      id: "e0000000-0000-0000-0000-787963984681",
      keluarga_id: "d0000000-0000-0000-0000-787963984791",
      nik: "3517141526200001",
      nama: "Jagung Bakar",
      jenis_kelamin: "L",
      tanggal_lahir: "1996-01-01",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "umum",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-787993394270",
      keluarga_id: "d0000000-0000-0000-0000-787963984791",
      nik: "3517141563900001",
      nama: "Bu Jagung",
      jenis_kelamin: "P",
      tanggal_lahir: "1979-03-03",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "e0000000-0000-0000-0000-787964785767",
      keluarga_id: "d0000000-0000-0000-0000-787963984791",
      nik: "3517141590200001",
      nama: "Anak Jagung",
      jenis_kelamin: "L",
      tanggal_lahir: "2000-02-02",
      hubungan_keluarga: "Anak",
      kategori: "umum",
      status_aktif: true
    },
    // KK Sutrisno (RT 16)
    {
      id: "38b5aa60-d504-4b83-9a7b-8da5af73c708",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3517140112850002",
      nama: "Sutrisno",
      jenis_kelamin: "L",
      tanggal_lahir: "1985-11-01",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "umum",
      status_aktif: true
    },
    {
      id: "128b886c-c7fb-4326-b8d7-64a5683a7da7",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3517145609880003",
      nama: "Siti Wati",
      jenis_kelamin: "P",
      tanggal_lahir: "1988-09-20",
      hubungan_keluarga: "Istri",
      kategori: "wus",
      status_aktif: true
    },
    {
      id: "1b21c752-ea6e-4309-aa1b-137e1700b724",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3517141209120004",
      nama: "Rizky Amalia",
      jenis_kelamin: "P",
      tanggal_lahir: "2012-09-01",
      hubungan_keluarga: "Anak",
      kategori: "anak",
      status_aktif: true
    },
    // KK Sulastri (RT 23)
    {
      id: "548fc8b8-cd65-4131-a76d-6789d8004c60",
      keluarga_id: "d8c3987e-68ef-4a83-9b93-83bf411e7a38",
      nik: "3517140212700003",
      nama: "Sulastri",
      jenis_kelamin: "P",
      tanggal_lahir: "1970-12-25",
      hubungan_keluarga: "Kepala Keluarga",
      kategori: "umum",
      status_aktif: true
    },
    {
      id: "128b8852-fdbf-4ff2-8a46-72e4f05efac8",
      keluarga_id: "d8c3987e-68ef-4a83-9b93-83bf411e7a38",
      nik: "3517144510980006",
      nama: "Dewi Lestari",
      jenis_kelamin: "P",
      tanggal_lahir: "1998-10-15",
      hubungan_keluarga: "Anak",
      kategori: "wus",
      status_aktif: true
    },
    // Warga Mandiri RT 16
    {
      id: "e0000000-0000-0000-0000-000000000008",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3579012811980008",
      nama: "Dimas Aditya Wardhana",
      jenis_kelamin: "L",
      tanggal_lahir: "1998-11-28",
      hubungan_keluarga: "Famili Lain",
      kategori: "umum",
      status_aktif: true,
      nomor_telepon: "0857-3322-1100"
    },
    {
      id: "e0000000-0000-0000-0000-000000000018",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3579012903010018",
      nama: "Fajar Nugroho",
      jenis_kelamin: "L",
      tanggal_lahir: "2001-03-29",
      hubungan_keluarga: "Famili Lain",
      kategori: "umum",
      status_aktif: true
    },
    {
      id: "7f689cf4-7273-4d60-ad23-2c243c828b17",
      keluarga_id: "abd0ebee-debe-498e-a7ff-fec18ae821c2",
      nik: "3517140207790005",
      nama: "Handoko",
      jenis_kelamin: "L",
      tanggal_lahir: "1979-07-02",
      hubungan_keluarga: "Warga Mandiri",
      kategori: "umum",
      status_aktif: true
    }
  ],

  kunjungan: [],
  kunjunganAktif: [],

  // Nama persona kanonik per peran (sumber tunggal kebenaran untuk sapaan di semua
  // dashboard). Diambil dari akun `users` di atas agar konsisten lintas halaman.
  persona: {
    super_admin: "Izzat (Super Admin)",
    kader: "Bu Sari Handayani",
    bidan: "Bdn. Siti Aminah, S.Tr.Keb",
    ketua_pkk: "Ibu Hartini Sutrisno",
    kepala_desa: "Bpk. Bambang Sutrisno, S.Sos",
  } as Record<string, string>,

  // 27 Master Penduduk SINDUKSADATI (PDK-000001 s/d PDK-000027)
  sinduksadatiMaster: [
    { resident_code: "PDK-000001", nik: "3579011205800001", nama_lengkap: "Bambang Subagyo", jenis_kelamin: "L", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-12", status_penduduk: "aktif" },
    { resident_code: "PDK-000002", nik: "3579015508840002", nama_lengkap: "Siti Rahmawati", jenis_kelamin: "P", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-12", status_penduduk: "aktif" },
    { resident_code: "PDK-000003", nik: "3579012403100003", nama_lengkap: "Rizky Pratama Subagyo", jenis_kelamin: "L", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-12", status_penduduk: "aktif" },
    { resident_code: "PDK-000004", nik: "3579016104240004", nama_lengkap: "Aisyah Putri Subagyo", jenis_kelamin: "P", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-12", status_penduduk: "aktif" },
    { resident_code: "PDK-000005", nik: "3579011809920005", nama_lengkap: "Ahmad Fauzi", jenis_kelamin: "L", nomor_rt: "13", nomor_rw: "06", nomor_rumah: "A-04", status_penduduk: "aktif" },
    { resident_code: "PDK-000006", nik: "3579015002950006", nama_lengkap: "Nadia Safitri", jenis_kelamin: "P", nomor_rt: "13", nomor_rw: "06", nomor_rumah: "A-04", status_penduduk: "aktif" },
    { resident_code: "PDK-000007", nik: "3579010501550007", nama_lengkap: "Mbah Soetrisno", jenis_kelamin: "L", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "C-08", status_penduduk: "aktif" },
    { resident_code: "PDK-000008", nik: "3579012811980008", nama_lengkap: "Dimas Aditya Wardhana", jenis_kelamin: "L", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "D-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000009", nik: "3579011504780009", nama_lengkap: "Hendra Wijaya", jenis_kelamin: "L", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "E-05", status_penduduk: "aktif" },
    { resident_code: "PDK-000010", nik: "3579015206800010", nama_lengkap: "Ratna Kartikasari", jenis_kelamin: "P", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "E-05", status_penduduk: "aktif" },
    { resident_code: "PDK-000011", nik: "3579012001050011", nama_lengkap: "Bayu Pratama Wijaya", jenis_kelamin: "L", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "E-05", status_penduduk: "aktif" },
    { resident_code: "PDK-000012", nik: "3579010811850012", nama_lengkap: "Agus Triyono", jenis_kelamin: "L", nomor_rt: "21", nomor_rw: "06", nomor_rumah: "F-10", status_penduduk: "aktif" },
    { resident_code: "PDK-000013", nik: "3579014502890013", nama_lengkap: "Dewi Anggraini", jenis_kelamin: "P", nomor_rt: "21", nomor_rw: "06", nomor_rumah: "F-10", status_penduduk: "aktif" },
    { resident_code: "PDK-000014", nik: "3579011409900014", nama_lengkap: "Rudi Hartono", jenis_kelamin: "L", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-03", status_penduduk: "aktif" },
    { resident_code: "PDK-000015", nik: "3579016307930015", nama_lengkap: "Lestari Wulandari", jenis_kelamin: "P", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "B-03", status_penduduk: "aktif" },
    { resident_code: "PDK-000016", nik: "3579012308650016", nama_lengkap: "Drs. H. Bambang Kusumo", jenis_kelamin: "L", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "C-15", status_penduduk: "aktif" },
    { resident_code: "PDK-000017", nik: "3579015812680017", nama_lengkap: "Hj. Endang Sri Wahyuni", jenis_kelamin: "P", nomor_rt: "15", nomor_rw: "06", nomor_rumah: "C-15", status_penduduk: "aktif" },
    { resident_code: "PDK-000018", nik: "3579012903010018", nama_lengkap: "Fajar Nugroho", jenis_kelamin: "L", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "D-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000019", nik: "3517141526200001", nama_lengkap: "Jagung Bakar", jenis_kelamin: "L", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "Z-11", status_penduduk: "aktif" },
    { resident_code: "PDK-000020", nik: "3517141590200001", nama_lengkap: "Anak Jagung", jenis_kelamin: "L", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "Z-11", status_penduduk: "aktif" },
    { resident_code: "PDK-000021", nik: "3517141563900001", nama_lengkap: "Bu Jagung", jenis_kelamin: "P", nomor_rt: "14", nomor_rw: "06", nomor_rumah: "Z-11", status_penduduk: "aktif" },
    { resident_code: "PDK-000022", nik: "3517140112850002", nama_lengkap: "Sutrisno", jenis_kelamin: "L", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "R-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000023", nik: "3517145609880003", nama_lengkap: "Siti Wati", jenis_kelamin: "P", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "R-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000024", nik: "3517141209120004", nama_lengkap: "Rizky Amalia", jenis_kelamin: "P", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "R-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000025", nik: "3517140207790005", nama_lengkap: "Handoko", jenis_kelamin: "L", nomor_rt: "16", nomor_rw: "06", nomor_rumah: "D-02", status_penduduk: "aktif" },
    { resident_code: "PDK-000026", nik: "3517140212700003", nama_lengkap: "Sulastri", jenis_kelamin: "P", nomor_rt: "23", nomor_rw: "06", nomor_rumah: "M-01", status_penduduk: "aktif" },
    { resident_code: "PDK-000027", nik: "3517144510980006", nama_lengkap: "Dewi Lestari", jenis_kelamin: "P", nomor_rt: "23", nomor_rw: "06", nomor_rumah: "M-01", status_penduduk: "aktif" }
  ],

  sinduksadatiEvents: [],
  notifikasi: [],
  auditLogs: [],
  penyuluhan: []
};

export default SIPANDU_SEED;
