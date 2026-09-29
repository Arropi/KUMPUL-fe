---
name: Kumpul Design System
version: "1.1.0"
description: "Visual identity and design token specification for Kumpul: B2B Cross-Sector Collaborative Supply Chain, Autonomous MOQ Pooling, Food Safety Passport & Circular Economy Platform"
colors:
  primary: "#0D3B2E"
  primary-hover: "#145A46"
  primary-light: "#EBF3EE"
  secondary: "#1E293B"
  secondary-muted: "#5C6B62"
  accent: "#B45309"
  accent-hover: "#92400E"
  accent-light: "#FEF3C7"
  circular-waste: "#2D6A4F"
  circular-waste-light: "#E9F4EC"
  background: "#FAF7F2"
  surface: "#FFFDF9"
  surface-subtle: "#F3EFE8"
  border: "#E8E1D5"
  border-strong: "#D5CBBF"
  success: "#15803D"
  warning: "#D97706"
  error: "#DC2626"
  text-primary: "#18201B"
  text-secondary: "#4A564F"
  text-muted: "#75827A"
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
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  2xl: "24px"
  full: "9999px"
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
    rounded: "{rounded.lg}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-accent-pool:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
    padding: "12px"
    typography: "{typography.body-sm}"
  button-accent-pool-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.label-caps}"
  badge-accent:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.label-caps}"
  badge-waste:
    backgroundColor: "{colors.circular-waste-light}"
    textColor: "{colors.circular-waste}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.label-caps}"
---

## Overview

**Kumpul** (`kumpul.id`) adalah platform ekonomi kolaboratif B2B lintas 7 sektor (pertanian, peternakan, perikanan, perkebunan, pengolahan F&B, ritel, dan logistik) untuk kompetisi ICOMFEST 2026. Platform ini menggabungkan pengadaan agregat otonom (*Autonomous MOQ Pooling*), sertifikasi higienitas rantai pasok (*Quality Assurance Passport*), dan bursa limbah produktif (*Circular Waste-to-Value Marketplace*).

### Karakter & Jiwa Desain
- **Industrial Agribusiness Gravitas with Modern Soft Curves:** Menggabungkan stabilitas rantai pasok agrikultur hulu dengan sentuhan visual modern yang ramah, elegan, dan luwes. Tidak kaku kotak seperti spreadsheet jadul, namun juga tidak berlebihan menjadi gelembung mainan.
- **Data-Dense High Legibility:** Mengutamakan keterbacaan angka volume (kg, karung), kalkulasi HPP, margin keuntungan, dan status kuota pooling secara presisi.
- **Anti-Slop Craftsmanship:** Tidak ada tombol hiasan mati, tidak ada gradien ungu ke biru klise, tidak ada bento grid sembarangan, dan kontras warna terbukti lulus WCAG AA.
- **Dials Baseline:** `ENERGY: 2` (Produktif / Utilitas Tinggi), `RHYTHM: 2` (Variasi struktural berbasis konten riil), `MOTION: 2` (Fungsional, mikro animasi halus, zero bounce).

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
- **Background Canvas (`#FAF7F2`):** Putih gamping hangat / warm cream (*warm linen / limestone*) yang ramah di mata pengguna dan memberikan nuansa organik.
- **Surface (`#FFFDF9`):** Kartu, modal dialog, dan dropdown list dengan rona warm off-white dan border hangat (`#E8E1D5`).
- **Surface Subtle (`#F3EFE8`):** Area kontainer sekunder, inner table header, dan tab tidak aktif dengan rona oatmeal hangat.

---

## Typography

Kumpul menggunakan kombinasi tipografi profesional untuk memisahkan hierarki struktural dengan data numerik:

1. **Display & Headings:** `Plus Jakarta Sans`: Geometris bersih dengan legibilitas modern khas aplikasi B2B Asia Tenggara.
2. **Body Prose & Interface:** `Inter`: Netral, rendering tajam di semua resolusi layar, dan dukungan kerning mikro yang rapi.
3. **Numbers & Currency:** Menggunakan fitur OpenType `tabular-nums` (`font-variant-numeric: tabular-nums`) untuk semua nilai uang (`Rp`), persentase margin HPP, berat kilogram, dan tanggal batch agar angka tidak bergeser (*zero layout shift*).

### Text Wrapping Rules (make-interfaces-feel-better)
- Judul (`h1`, `h2`, `h3`): Wajib menggunakan kelas Tailwind `text-balance` (`text-wrap: balance`).
- Paragraf deskripsi: Wajib menggunakan kelas Tailwind `text-pretty` (`text-wrap: pretty`) untuk mencegah kata yatim (*orphans*).

---

## Layout

### Struktur Grid & Modul
- Mengadopsi arsitektur modular fitur (`modules/<feature>/`): `supplier`, `pooling`, `recipe-costing`, `waste-marketplace`, `quality-passport`.
- Setiap dashboard menggunakan layout 2 zona:
  - **Sidebar Navigasi (Desktop 260px / Mobile Drawer):** Berlatar belakang solid `#0D3B2E` atau `#FFFFFF` dengan batas border tegas.
  - **Main Canvas:** Menggunakan kontainer terpusat `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` dengan spasi vertikal konsisten `gap-6` / `space-y-6`.
- **Zero Horizontal Overflow:** Sesuai aturan `antislop-layoutmobile`, semua tabel data berukuran lebar wajib dibungkus kontainer `overflow-x-auto` dengan penanda visual scrollbar transparan.
- **Tap Targets:** Semua link, checkbox, dan tombol pada mode mobile berukuran minimal **44px × 44px**.

---

## Elevation & Depth

Menolak estetika *floating slop* (di mana semua kartu diberi bayangan melayang tebal). Kumpul menerapkan prinsip kedalaman berbasis border tegas:

1. **Elevation 0 (Flat Ground):** Latar belakang halaman `#FAF7F2` (warm cream).
2. **Elevation 1 (Cards & Data Tables):** Background warm off-white `#FFFDF9`, border solid 1px `#E8E1D5`, dan bayangan halus berkarakter:
   ```css
   box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
   ```
3. **Elevation 2 (Floating Popover & Modal Dialogs):** Border 1px `#D5CBBF`, bayangan bertingkat transparan alami:
   ```css
   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
   ```
4. **Glassmorphism Cap:** Efek blur kaca (`backdrop-blur-md`) dibatasi **maksimal 1 elemen per viewport** (hanya untuk sticky header navbar atau modal backdrop). Dilarang memasang glassmorphism pada kartu isi atau sidebar.

---

## Shapes & Geometry (Revisi: Modern Rounded Curves)

Untuk menghindari tampilan yang terlalu kaku dan kotak (*sharp boxy legacy ERP look*), geometri elemen Kumpul mengadopsi kurva modern yang lebih luwes dan ergonomis (*friendly & modern curves*):

- **Hierarki Radius Sudut (Bukan Terlalu Kotak):**
  - **Kartu Kontainer, Panel Utama, & Modal Dialog:** Wajib menggunakan `rounded-xl` (14px s.d. 18px) hingga `rounded-2xl` (20px s.d. 24px). Ini memberikan kesan modern, bersih, dan mengalir natural di layar.
  - **Tombol Aksi (Buttons) & Form Controls (Input, Select, Textarea):** Menggunakan `rounded-xl` (12px). Khusus tombol aksi (Buttons), mengadopsi estetika **Tactile 3D Button**: dilengkapi highlight kilau di bibir atas (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35)`), bevel tebal di bibir bawah (`inset 0 -2px 0 rgba(0, 0, 0, 0.18)`), bayangan jatuh fisik (*drop shadow glow*), serta interaksi mikro responsif (hover terangkat `hover:-translate-y-0.5` dengan glow menguat, dan active recessed click `active:scale-[0.98] active:translate-y-[0.5px] active:shadow-[inset_0_2px_4px_...]`) agar terasa empuk, berdimensi nyata, dan berbobot saat berinteraksi.
  - **Sub-Kotak & Card Anak (Nested Stat Boxes, Info Callouts):** Menggunakan `rounded-xl` (12px).
  - **Badge, Tag Chip, & Status Indicators:** Menggunakan `rounded-md` (6px s.d. 8px) atau `rounded-full` (capsule pill khusus status indikator ringkas).
- **Concentric Border Radius:** Jika ada elemen bersarang (misal tombol di dalam kartu berpadding), berlaku kaidah:
  $$\text{Outer Radius} = \text{Inner Radius} + \text{Padding}$$

---

## Direct Adoption of Watermelon UI Library

> **ATURAN WAJIB PENGEMBANGAN**: Dilarang keras membuat komponen UI primitif secara manual dari awal (*no bespoke manual primitives*). Seluruh komponen UI harus diambil langsung dari pustaka **Watermelon UI** (`https://ui.watermelon.sh/` atau MCP `watermelon-ui`).

### 1. SOP Pengambilan & Instalasi Komponen
1. **Pencarian Katalog:** Jalankan tool MCP `search` atau `get_inspiration` pada namespace `watermelon-ui` sesuai kebutuhan tampilan.
2. **Pengambilan Sumber Kode:** Panggil `get_component` atau ambil berkas JSON langsung dari registry:
   `https://registry.watermelon.sh/r/<slug>.json`
   atau via perintah CLI:
   `npx shadcn@latest add https://registry.watermelon.sh/r/<slug>.json`
3. **Penyelarasan Token:** Sesuaikan nama token warna, font, dan kelas rounded ke standar token Kumpul tanpa merusak struktur dan logika internal komponen Watermelon UI.

### 2. Pemetaan Komponen Resmi Watermelon UI
| Tipe Komponen | Sumber Resmi Watermelon UI | Lokasi di Proyek | Keterangan Penggunaan |
| :--- | :--- | :--- | :--- |
| **Table & Data Grid** | `table-10` / `data-table` | `@/components/ui/table` | Manifest pooling, antrean PO, ledger kuota grosir |
| **KPI Stat Blocks** | `blocks/Stats` (`stats-1`) | `@/components/ui/stat-card` | Kartu metrik kuota terkunci, efisiensi HPP, omzet |
| **Container & Cards** | `card-10` / `components/card` | `@/components/ui/card` | Kontainer utama dengan radius `rounded-xl` / `rounded-2xl` |
| **Action Buttons** | `button-1` / `components/button` | `@/components/ui/button` | Tombol interaktif `rounded-lg` / `rounded-xl` |
| **Form Inputs** | `form` / `input` | `@/components/ui/input` | Input teks, angka kuota, SKU dengan `rounded-lg` |
| **Status Badges** | `components/badge` | `@/components/ui/badge` | Tag higienitas, sektor, dan status PO |
| **Modal Dialog** | `components/dialog` | `@/components/ui/dialog` | Pop-up surat jalan armada & konfirmasi aksi |
| **Toast & Sonner** | `components/sonner` | `@/components/ui/toast` | Notifikasi transaksi, aktivasi bursa, peringatan |
| **Tab Navigasi** | `components/tabs` | `@/components/ui/tabs` | Filter status pesanan PO & switcher tab modul |

---

## Do's and Don'ts

### DO's (Wajib Dilakukan)
1. **Lulus Uji Kontras WCAG AA:** Selalu pastikan rasio kontras teks terhadap background $\ge 4.5:1$ (uji dengan script `python3 .agents/skills/antislop-human/contrast-check.py`).
2. **Keterhubungan Data Riil:** Setiap angka HPP pada `UMKM_PRODUCTS` harus berasal dari penjumlahan `RECIPE_DETAILS` dan `PRODUCTION_COST_ITEMS`.
3. **Fungsionalitas Interaksi Penuh:** Semua tombol memiliki feedback visual saat hover, focus, dan loading (`disabled:opacity-50`, transisi CSS `duration-150`).
4. **Tabular Numerics:** Semua angka harga (`Rp`), volume kilogram, dan countdown wajib menggunakan `tabular-nums`.
5. **Ambil Komponen Watermelon UI Langsung:** Wajib memanfaatkan registry Watermelon UI secara langsung untuk menjaga konsistensi arsitektur kode.

### DON'Ts (Pantangan Keras AI Slop)
1. **DILARANG Sudut Kaku Kotak Ekstrem:** Hindari sudut kotak kaku 0px sampai 4px pada kartu dan tombol utama. Gunakan kurva modern yang luwes (`rounded-xl` untuk kartu, `rounded-lg`/`rounded-xl` untuk tombol & input).
2. **DILARANG Membuat Komponen Primitif Manual:** Jangan mengarang atau menulis komponen UI dari awal jika sudah tersedia di katalog Watermelon UI.
3. **DILARANG Gradien Ungu-Biru:** Jangan pernah menggunakan gradien default AI (*purple-to-blue*, *blue-to-cyan*, atau radial glowing orb).
4. **DILARANG Tombol & Elemen Mati:** Tidak boleh ada tombol navigasi, filter tab, atau aksi pool yang hanya dummy/statik tanpa event handler.
5. **DILARANG Floating Shadows Berlebihan:** Jangan gunakan bayangan blur tebal yang membuat kartu terasa melayang di awan tanpa batas yang jelas.
6. **DILARANG Bento Grid Acak:** Jangan membuat tata letak kotak mosaik jika ukuran dan signifikansi datanya sama.
7. **DILARANG Komentar Kode Bertele-tele:** Sesuai `antislop-code`, dilarang menulis komentar AI sampah seperti `// render button` atau `// return jsx`.
