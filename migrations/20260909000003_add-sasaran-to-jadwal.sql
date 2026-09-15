-- Menambahkan kolom sasaran (array of string) ke tabel jadwal_posyandu
ALTER TABLE jadwal_posyandu ADD COLUMN IF NOT EXISTS sasaran text[] DEFAULT '{}';
