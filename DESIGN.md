---
name: Kumpul Design System
version: "1.0.0"
description: "Visual identity and design token specification for Kumpul: B2B Cross-Sector Collaborative Supply Chain, Autonomous MOQ Pooling, Food Safety Passport & Circular Economy Platform"
colors:
  primary: "#0D3B2E"
  primary-hover: "#145A46"
  primary-light: "#EBF5F0"
  secondary: "#1E293B"
  secondary-muted: "#64748B"
  accent: "#B45309"
  accent-hover: "#92400E"
  accent-light: "#FEF3C7"
  circular-waste: "#2D6A4F"
  circular-waste-light: "#E8F5E9"
  background: "#F8FAF8"
  surface: "#FFFFFF"
  surface-subtle: "#F1F5F2"
  border: "#E2E8F0"
  border-strong: "#CBD5E1"
  success: "#15803D"
  warning: "#D97706"
  error: "#DC2626"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-muted: "#64748B"
  text-inverse: "#FFFFFF"
typography:
  h1:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.025em"
  h2:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: "600"
    lineHeight: "1.25"
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: "600"
    lineHeight: "1.3"
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    lineHeight: "1.6"
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.5"
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.4"
  label-caps:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: "600"
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-accent-pool:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-accent-pool-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "4px"
    typography: "{typography.label-caps}"
  badge-accent:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    padding: "4px"
    typography: "{typography.label-caps}"
  badge-waste:
    backgroundColor: "{colors.circular-waste-light}"
    textColor: "{colors.circular-waste}"
    rounded: "{rounded.sm}"
    padding: "4px"
    typography: "{typography.label-caps}"
---

## Overview

**Kumpul** (`kumpul.id`) adalah platform ekonomi kolaboratif B2B lintas 7 sektor (pertanian, peternakan, perikanan, perkebunan, pengolahan F&B, ritel, dan logistik) untuk kompetisi ICOMFEST 2026. Platform ini menggabungkan pengadaan agregat otonom (*Autonomous MOQ Pooling*), sertifikasi higienitas rantai pasok (*Quality Assurance Passport*), dan bursa limbah produktif (*Circular Waste-to-Value Marketplace*).

### Karakter & Jiwa Desain
- **Industrial Agribusiness Gravitas:** Terinspirasi dari operasional supply chain hulu yang stabil, kokoh, dan berakar pada ketahanan pangan. Bukan aplikasi main-main atau landing page SaaS AI generik.
- **Data-Dense High Legibility:** Mengutamakan keterbacaan angka volume (kg, karung), kalkulasi HPP, margin keuntungan, dan status kuota pooling secara presisi.
- **Anti-Slop Craftsmanship:** Tidak ada tombol hiasan mati, tidak ada gradien ungu-ke-biru klise, tidak ada bento-grid sembarangan, dan kontras warna terbukti lulus WCAG AA.
- **Dials Baseline:** `ENERGY: 2` (Produktif / Utilitas Tinggi), `RHYTHM: 2` (Variasi struktural berbasis konten riil), `MOTION: 2` (Fungsional, mikro-animasi halus, zero bounce).

---

## Colors

Palet warna Kumpul berakar pada nuansa botani alami agrikultur hulu yang dipadukan dengan aksen tembaga panen dan struktur slate netral.

### 1. Warna Utama & Identitas Sektor
- **Primary Deep Forest Pine (`#0D3B2E`):** Warna institusional Kumpul. Melambangkan sektor agrikultur, perkebunan, dan stabilitas pasokan hulu. Memiliki rasio kontras tinggi **12.48:1** di atas putih (lulus WCAG AAA).
- **Primary Light Surface (`#EBF5F0`):** Tint hijau muda lembut untuk latar belakang badge kuota, status `OPEN`, dan sorotan baris tabel.
- **Secondary Slate (`#1E293B`):** Tinta netral gelap untuk judul hierarki sekunder, border komponen, dan teks instruksi teknis.
- **Circular Waste Sprout (`#2D6A4F`):** Warna hijau organik untuk entitas limbah sampingan (`WASTE_LISTINGS`) dan penjemputan off-taker.

### 2. Aksen Aksi & Kuota Pooling
- **Harvest Amber (`#B45309`):** Aksen tunggal terarah (*one deliberate accent*). Digunakan eksklusif untuk aksi mendesak: batas minimum MOQ tercapai, countdown lock pool, dan tombol komitmen DP Escrow 20%. Memiliki rasio kontras **5.02:1** di atas putih (lulus WCAG AA).
- **Amber Light (`#FEF3C7`):** Latar belakang notifikasi ambang batas pooling dan peringatan cut-off batch basah/kering.

### 3. Surface & Neutrals
- **Background Canvas (`#F8FAF8`):** Putih gamping (*warm limestone*) yang tidak menyilaukan mata pengguna saat memantau dashboard berjam-jam.
- **Surface (`#FFFFFF`):** Kartu, modal dialog, dan dropdown list dengan border tegas 1px (`#E2E8F0`).

---

## Typography

Kumpul menggunakan kombinasi tipografi profesional untuk memisahkan hierarki struktural dengan data numerik:

1. **Display & Headings:** `Plus Jakarta Sans` — Geometris bersih dengan legibilitas modern khas aplikasi B2B Asia Tenggara.
2. **Body Prose & Interface:** `Inter` — Netral, rendering tajam di semua resolusi layar, dan dukungan kerning mikro yang sempurna.
3. **Numbers & Currency:** Menggunakan fitur OpenType `tabular-nums` (`font-variant-numeric: tabular-nums`) untuk semua nilai uang (`Rp`), persentase margin HPP, berat kilogram, dan tanggal batch agar angka tidak bergeser (*zero layout shift*).

### Text Wrapping Rules (make-interfaces-feel-better)
- Judul (`h1`, `h2`, `h3`): Wajib menggunakan kelas Tailwind `text-balance` (`text-wrap: balance`).
- Paragraf deskripsi: Wajib menggunakan kelas Tailwind `text-pretty` (`text-wrap: pretty`) untuk mencegah kata yatim (*orphans*).

---

## Layout

### Struktur Grid & Modul
- Mengadopsi arsitektur modular fitur (`modules/<feature>/`): `pooling`, `recipe-costing`, `waste-marketplace`, `quality-passport`.
- Setiap dashboard menggunakan layout 2-zona:
  - **Sidebar Navigasi (Desktop 260px / Mobile Drawer):** Berlatar belakang solid `#0D3B2E` atau `#FFFFFF` dengan batas border tegas.
  - **Main Canvas:** Menggunakan kontainer terpusat `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` dengan spasi vertikal konsisten `gap-6` / `space-y-6`.
- **Zero Horizontal Overflow:** Sesuai aturan `antislop-layoutmobile`, semua tabel data berukuran lebar wajib dibungkus kontainer `overflow-x-auto` dengan penanda visual scrollbar transparan.
- **Tap Targets:** Semua link, checkbox, dan tombol pada mode mobile berukuran minimal **44px × 44px**.

---

## Elevation & Depth

Menolak estetika *floating slop* (di mana semua kartu diberi bayangan melayang tebal). Kumpul menerapkan prinsip kedalaman berbasis border tegas:

1. **Elevation 0 (Flat Ground):** Latar belakang halaman `#F8FAF8`.
2. **Elevation 1 (Cards & Data Tables):** Background putih `#FFFFFF`, border solid 1px `#E2E8F0`, dan bayangan sangat halus:
   ```css
   box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   ```
3. **Elevation 2 (Floating Popover & Hub Route Selector):** Border 1px `#CBD5E1`, bayangan bertingkat transparan alami:
   ```css
   box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
   ```
4. **Glassmorphism Cap:** Efek blur kaca (`backdrop-blur-md`) dibatasi **maksimal 1 elemen per viewport** (hanya untuk sticky header navbar atau modal backdrop). Dilarang memasang glassmorphism pada kartu isi atau sidebar.

---

## Shapes

Sesuai aturan `antislop-ui` (R-11) dan `make-interfaces-feel-better`:

- **Batas Radius Sudut:**
  - Tombol aksi utama & form input: `rounded-md` (6px) — tegas, profesional, dan berbobot.
  - Kartu container & modal dialog: `rounded-lg` (8px).
  - Badge kategori sektor & status chip: `rounded-sm` (4px) atau `rounded-md` (6px).
  - **Pantangan Mutlak:** Dilarang menggunakan sudut kapsul bulat (`rounded-full`) untuk kartu, box dialog, atau input teks.
- **Concentric Border Radius:** Jika ada elemen bersarang (misal tombol di dalam kartu berpadding), berlaku rumus:
  $$\text{Outer Radius} = \text{Inner Radius} + \text{Padding}$$

---

## Components & Watermelon UI Integration

Komponen visual Kumpul diadaptasi langsung dari katalog **Watermelon UI** dan disesuaikan dengan token warna Kumpul:

### 1. Data Tables & Pooling Ledger (Watermelon UI `dashboards/agndex-dashboard`)
- Header tabel menggunakan warna latar `#F1F5F2` dengan tipografi `label-caps` (`#475569`).
- Nilai kuota akumulasi (`accumulated_qty / target_moq`) ditampilkan dengan progress bar mini dual-tone: track `#E2E8F0`, fill `#0D3B2E`, dan marker target `#B45309`.

### 2. Cards & Batch Mutu (Watermelon UI `blocks/feature-cards`)
- Setiap kartu komoditas supplier memuat: nama SKU, wholesale unit (karung/sak), sertifikasi sanitasi batch tag, dan accordion tiering harga grosir.
- Variasi kartu mengikuti hierarki muatan, bukan duplikasi kartu seragam (*no copy-paste cards*).

### 3. P2P Waste-to-Value Listing Chips
- Label limbah organik basah/kering diberi penanda badge hijau daun `#2D6A4F` berlatar `#E8F5E9`.
- Countdown otomatis 48 jam sebelum rujukan bank sampah menggunakan badge kuning amber `#B45309` dengan angka tabular.

---

## Do's and Don'ts

### DO's (Wajib Dilakukan)
1. **Lulus Uji Kontras WCAG AA:** Selalu pastikan rasio kontras teks terhadap background $\ge 4.5:1$ (uji dengan script `python3 .agents/skills/antislop-human/contrast-check.py`).
2. **Keterhubungan Data Riil:** Setiap angka HPP pada `UMKM_PRODUCTS` harus berasal dari penjumlahan `RECIPE_DETAILS` dan `PRODUCTION_COST_ITEMS`.
3. **Fungsionalitas Interaksi Penuh:** Semua tombol memiliki feedback visual saat hover, focus, dan loading (`disabled:opacity-50`, transisi CSS `duration-150`).
4. **Tabular Numerics:** Semua angka harga (`Rp`), volume kilogram, dan countdown wajib menggunakan `tabular-nums`.
5. **Transisi Ramah Performa:** Gunakan transisi CSS terinterupsi (*interruptible*) pada properti `transform` dan `opacity`, hindari menganimasikan `height` atau `width` secara mentah.

### DON'Ts (Pantangan Keras AI Slop)
1. **DILARANG Gradien Ungu-Biru:** Jangan pernah menggunakan gradien default AI (*purple-to-blue*, *blue-to-cyan*, atau radial glowing orb).
2. **DILARANG Tombol & Elemen Mati:** Tidak boleh ada tombol navigasi, filter tab, atau aksi pool yang hanya dummy/statik tanpa event handler.
3. **DILARANG Floating Shadows Berlebihan:** Jangan gunakan bayangan blur tebal yang membuat kartu terasa melayang di awan tanpa batas yang jelas.
4. **DILARANG Bento Grid Acak:** Jangan membuat tata letak kotak mosaik jika ukuran dan signifikansi datanya sama.
5. **DILARANG Testimonial & Logo Palsu:** Jangan menampilkan slider logo mitra atau review pelanggan palsu. Tampilkan mitra hulu riil (petani cabai lokal, koperasi susu, UMKM kuliner mitra).
6. **DILARANG Komentar Kode Bertele-tele:** Sesuai `antislop-code`, dilarang menulis komentar AI sampah seperti `// render button` atau `// return jsx`.
