-- 1) Normalisasi data lama `bumil` menjadi `ibu_hamil`
ALTER TYPE sasaran_kategori_enum ADD VALUE IF NOT EXISTS 'ibu_hamil';
