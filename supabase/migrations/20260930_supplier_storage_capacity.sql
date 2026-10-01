-- ============================================================================
-- Migrasi Supabase PostgreSQL: Kapasitas Penyimpanan Supplier Terstruktur (Opsi A)
-- Tanggal: 2026-09-30
-- Deskripsi:
--   Menambahkan kolom terstruktur untuk nilai daya tampung, satuan, tipe fasilitas gudang,
--   dan kolom ter-standarisasi otomatis ke kilogram (Kg) untuk algoritma pooling KUMPUL.
-- ============================================================================

-- 1. Tambahkan kolom terstruktur pada tabel supplier_profiles
ALTER TABLE IF EXISTS supplier_profiles
  ADD COLUMN IF NOT EXISTS storage_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_unit VARCHAR(20) NOT NULL DEFAULT 'TON',
  ADD COLUMN IF NOT EXISTS storage_type VARCHAR(30) NOT NULL DEFAULT 'DRY';

-- 2. Tambahkan batasan check constraint agar data selalu bersih
ALTER TABLE IF EXISTS supplier_profiles
  DROP CONSTRAINT IF EXISTS chk_supplier_storage_unit,
  ADD CONSTRAINT chk_supplier_storage_unit 
    CHECK (storage_unit IN ('TON', 'KG', 'KUINTAL', 'M3', 'LITER', 'PALET'));

ALTER TABLE IF EXISTS supplier_profiles
  DROP CONSTRAINT IF EXISTS chk_supplier_storage_type,
  ADD CONSTRAINT chk_supplier_storage_type 
    CHECK (storage_type IN ('DRY', 'CHILLED', 'FROZEN', 'SILO'));

-- 3. Tambahkan Generated Column yang otomatis mengonversi ke satuan Kilogram (Kg)
-- Kolom ini dihitung otomatis oleh PostgreSQL setiap kali storage_value atau storage_unit berubah.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supplier_profiles' AND column_name = 'storage_capacity_kg'
  ) THEN
    ALTER TABLE supplier_profiles 
      ADD COLUMN storage_capacity_kg NUMERIC(15, 2) GENERATED ALWAYS AS (
        CASE 
          WHEN storage_unit = 'TON' THEN storage_value * 1000
          WHEN storage_unit = 'KUINTAL' THEN storage_value * 100
          WHEN storage_unit = 'KG' THEN storage_value
          ELSE NULL -- Untuk satuan non-bobot (M3, LITER, PALET)
        END
      ) STORED;
  END IF;
END $$;

-- 4. Indeks performa tinggi untuk pencarian kuota pooling dan radius logistik
CREATE INDEX IF NOT EXISTS idx_supplier_storage_capacity_kg 
  ON supplier_profiles (storage_capacity_kg DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_sector_storage 
  ON supplier_profiles (sector, storage_capacity_kg DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_storage_type 
  ON supplier_profiles (storage_type);

-- ============================================================================
-- CONTOH PENGGUNAAN QUERY OLEH ALGORITMA POOLING KUMPUL:
-- ============================================================================
-- Mencari mitra supplier sektor Pertanian yang memiliki kapasitas gudang dingin (Chilled/Frozen)
-- minimal mampu menampung pesanan terpadu 15.000 Kg (15 Ton):
--
-- SELECT id, legal_name, sector, storage_value, storage_unit, storage_capacity_kg, storage_type
-- FROM supplier_profiles
-- WHERE sector = 'PERTANIAN'
--   AND storage_capacity_kg >= 15000
--   AND storage_type IN ('CHILLED', 'FROZEN')
-- ORDER BY storage_capacity_kg DESC;
-- ============================================================================
