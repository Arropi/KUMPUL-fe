# 📐 Panduan Standar Penulisan Komponen & Arsitektur Sistem — Kumpul

Dokumen ini adalah **pedoman resmi (guideline)** arsitektur komponen Next.js 16 (App Router) + React 19 sekaligus **instruksi sistem untuk AI Agent / Pengembang** dalam membangun platform **Kumpul**.

---

## 🌐 0. Konteks Platform "Kumpul" & Peta Arsitektur (Graphify × PRD × ERD)

### 0.1. Identitas & Visi Platform
* **Nama Platform:** **Kumpul** (`kumpul.id`)
* **Kategori Karya:** Kompetisi Web Development — **ICOMFEST 2026 (Universitas Ahmad Dahlan)**
* **Tema Utama:** NEXUS (*Next Generation of Technology and Users Collaboration*) — Subtema: *Collaborative Economy*
* **Definisi:** Platform ekosistem B2B kolaboratif yang menghubungkan **Supplier/Produsen Hulu** dengan **UMKM lintas 7 sektor** (Pertanian, Peternakan, Perikanan, Perkebunan, FnB/Pengolahan, Ritel, Logistik) melalui 3 pilar:
  1. **Pengadaan Kolektif Mandiri (*Autonomous MOQ Pooling*):** Mengagregasi pesanan UMKM di satu radius agar bersama-sama menembus batas Minimum Order Quantity (MOQ) grosir supplier dengan opsi logistik *Hub Konsolidasi (Hemat)* atau *Direct Door-to-Door*.
  2. **Jaminan Mutu & Higienitas (*Quality Gate*):** Verifikasi batch legalitas supplier (BPOM/Halal/Suhu) dan form audit sanitasi mandiri UMKM (*Quality Passport*).
  3. **Ekonomi Sirkular Lintas Sektor (*Waste-to-Value Marketplace*):** Mengonversi sisa produksi (seperti ampas tahu, feses ternak, perca kain) menjadi bahan baku bernilai bagi sektor lain via bursa P2P dan rujukan otomatis ke Bank Sampah jika tidak terserap dalam 48 jam.

---

### 0.2. Panduan Wajib bagi AI Agent: Sumber Kebenaran Tunggal (*Single Source of Truth*)
> [!IMPORTANT]
> **Petunjuk bagi AI Agent:**  
> Sebelum membuat modul, merancang API, atau mengubah state data, Anda **WAJIB membaca dan menyelaraskan logika dengan dokumen acuan** berikut:
> 1. **Peta Dependensi & Relasi Sistem (Graphify):**
>    - 📊 [`../graphify-out/graph.json`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/graphify-out/graph.json): Basis data relasi antar-entitas dan alur sistem.
>    - 📑 [`../graphify-out/GRAPH_REPORT.md`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/graphify-out/GRAPH_REPORT.md): Laporan analisis modularitas, *God Nodes*, dan koneksi antarmodul.
>    - 🌐 [`../graphify-out/graph.html`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/graphify-out/graph.html): Visualisasi interaktif arsitektur graf.
> 2. **Spesifikasi Kebutuhan Produk (PRD):**
>    - 📋 [`../PRD.md`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/PRD.md): Aturan bisnis, state lifecycle pooling (`DRAFT` $\rightarrow$ `LOCKED`), formula estimasi limbah, dan metrik NFR.
>    - 🛠️ [`../PRD_Review_and_Refinement.md`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/PRD_Review_and_Refinement.md): Mitigasi pembayaran anti-ghosting (DP Escrow 20%), model *Host-Member Hub*, dan strategi fokus *The Golden Pair*.
> 3. **Cetak Biru Database (ERD):**
>    - 🗄️ [`../ERD.md`](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/ERD.md): Skema 15 tabel relasional lengkap dengan constraint `NOT NULL`, enum, dan skrip SQL DDL Supabase.

---

### 0.3. Pemetaan Komunitas Graphify ke Direktori Komponen Frontend

Hasil analisis klaster komunitas (*Community Detection*) dari `graphify` dipetakan langsung ke struktur folder frontend Kumpul:

| Komunitas Graphify | Fokus Sistem & Domain Logika | Direktori Modul Frontend | Komponen Kunci di Frontend |
| :--- | :--- | :--- | :--- |
| **Community 0:** *Autonomous MOQ Pooling & State Engine* | Siklus hidup patungan, timer 24 jam, kuota grosir, atomic concurrency. | `modules/pooling/` | `pool-progress-card.tsx`<br>`countdown-timer.tsx`<br>`pool-join-modal.tsx` |
| **Community 1:** *Kompetisi ICOMFEST & Stack Teknis* | Template navigasi, responsivitas, integrasi Supabase + Next.js SSR. | `app/`, `components/layout/` | `navbar.tsx`, `footer.tsx`<br>`shell-container.tsx` |
| **Community 2:** *Multi-Role Identity & Quality Gate* | Single legal entity (`BUSINESS_ENTITIES`), role switch, checklist sanitasi. | `modules/roles/`<br>`modules/quality/` | `role-switcher.tsx`<br>`hygiene-audit-form.tsx`<br>`quality-passport-badge.tsx` |
| **Community 3:** *Logistik Cerdas & Cost Allocation* | Pemilihan Hub konsolidasi vs Direct, pembagian ongkir proporsional. | `modules/logistics/` | `hub-locator-map.tsx`<br>`delivery-method-selector.tsx`<br>`split-fee-calculator.tsx` |
| **Community 4:** *Circular Economy & Bursa Limbah* | Estimasi limbah dari resep/produk, listing bursa P2P, rujukan Bank Sampah. | `modules/waste/`<br>`modules/products/` | `waste-estimator-card.tsx`<br>`p2p-waste-card.tsx`<br>`offtaker-referral-dialog.tsx` |
| **Community 5:** *Tema NEXUS & Collaborative Economy* | Nilai filosofis kolaborasi, metrik dampak sosial, landing page interaktif. | `modules/home/` | `hero-nexus.tsx`<br>`live-counter-stats.tsx`<br>`impact-simulator.tsx` |

#### Simpul Sentral (*The God Nodes*) yang Wajib Dijaga:
* **`Autonomous MOQ Pooling Engine` (`modules/pooling/`)**: Inti sistem. Komponen lain (pembayaran, logistik, order) bergantung pada state pool ini.
* **`Single Legal Entity & One-Click Role Switch` (`modules/roles/`)**: Menjaga pergantian peran antara Supplier dan UMKM berjalan instan di client tanpa merusak sesi login.
* **`Escrow Transaction Gateway` (`modules/escrow/`)**: Menangani penahanan dana DP 20% dan pelunasan Midtrans Sandbox.

---

## 📌 Ringkasan Prinsip Utama Frontend

1. **Atomic UI Primitives (`components/ui/`)**: Komponen antarmuka terkecil, independen, dan reusable ditempatkan di `components/ui/`.
2. **Modular Feature Components (`modules/<feature>/`)**: Komponen spesifik domain Kumpul (pooling, waste, catalog, logistics) dikelompokkan ke modul masing-masing.
3. **Pemisahan CSR & SSR Maksimal**: Server Components (SSR) sebagai default; Client Components (`"use client"`) diisolasi sekecil mungkin pada *leaf components* yang membutuhkan interaktivitas.
4. **Desain Sistem Terstandarisasi (`app/globals.css`)**: Wajib menggunakan token tipografi fluid, warna, dan utility bayangan yang sudah ditentukan.
5. **Konvensi Penamaan Variabel & Konstanta**: Variabel dan fungsi menggunakan `camelCase`, konstanta konfigurasi/global menggunakan `UPPER_SNAKE_CASE` yang disimpan di `constants/`.

---

## 📂 1. Arsitektur Struktur Direktori & Komponen

Arsitektur platform **Kumpul** membagi komponen ke dalam hierarki yang terisolasi dengan rapi:

```
frontend/
├── app/                        # Route Pages & Server Orchestrators (SSR)
│   ├── globals.css             # Desain sistem & token Tailwind v4 inline
│   ├── layout.tsx              # Root shell layout
│   ├── page.tsx                # Landing Page Utama (Thin SSR Page)
│   ├── pooling/
│   │   ├── page.tsx            # Daftar pool aktif (Thin SSR Page)
│   │   └── [id]/page.tsx       # Detail sesi pooling (Thin SSR Page)
│   ├── bursa-limbah/
│   │   └── page.tsx            # Katalog sirkular limbah P2P (Thin SSR Page)
│   └── dashboard/
│       ├── page.tsx            # Hub dashboard berbasis active_role (SSR)
│       ├── produk/page.tsx     # Resep & input produk UMKM
│       └── dompet/page.tsx     # Saldo internal & riwayat transaksi escrow
├── modules/                    # Feature-Driven Components (Domain Kumpul)
│   ├── pooling/                # Fitur Patungan Bahan Baku
│   │   ├── pool-card.tsx                  # Pure SSR card
│   │   ├── pool-progress-bar.tsx          # Realtime UI component
│   │   ├── countdown-timer.tsx            # Isolated CSR leaf component
│   │   └── join-pool-modal.tsx            # CSR leaf modal (form DP)
│   ├── logistics/              # Fitur Titik Kumpul & Pengiriman
│   │   ├── hub-map-picker.tsx             # CSR map leaf component
│   │   └── shipping-split-summary.tsx     # SSR summary table
│   ├── waste/                  # Fitur Ekonomi Sirkular
│   │   ├── waste-listing-grid.tsx         # Pure SSR grid
│   │   ├── waste-estimate-calculator.tsx  # CSR interactive calculator
│   │   └── offtaker-referral-button.tsx   # CSR leaf trigger
│   ├── quality/                # Fitur Quality Gate
│   │   ├── hygiene-checklist-form.tsx     # CSR interactive audit
│   │   └── passport-qr-preview.tsx        # SSR QR presentation
│   └── roles/                  # Fitur Multi-Role Switcher
│       └── role-switch-dropdown.tsx       # Isolated CSR leaf component
├── components/                 # Global Shared Components
│   └── ui/                     # Komponen Atomik / Primitif Reusable
│       ├── button.tsx          # Base UI + CVA + Tailwind
│       ├── input.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── card.tsx
│       └── progress.tsx
└── constants/                  # Single Source of Truth untuk Konstanta
    └── helper.ts               # UPPER_SNAKE_CASE data, metadata, default presets
```

### Aturan Peletakan:
- **`components/ui/`**: HANYA untuk komponen antarmuka primitif dan atomik yang **tidak terikat dengan domain bisnis Kumpul**.
- **`modules/<nama-fitur>/`**: Untuk seluruh komponen yang spesifik pada fitur Kumpul (misal: kartu pooling, modal escrow, form checklist higienitas, bursa limbah).
- **`app/**/page.tsx`**: Bertindak sebagai **orkestrator tipis** (*thin page router*). Jangan menuliskan logic JSX yang panjang atau state kompleks langsung di file `page.tsx`. Panggil komponen dari `modules/`.

---

## ⚡ 2. Pemisahan Maksimal CSR (Client) & SSR (Server)

Prinsip dasar Next.js App Router: **Server Component by Default, Client Component on Leaves**.

### 2.1. Kapan Komponen Harus Menjadi SSR (Server Component)?
- Komponen hanya merender tampilan informasi katalog bahan baku, status pool statis, rincian produk, atau daftar bursa limbah.
- Mengambil data (*fetch*) langsung dari database Supabase / Server Actions.
- Komponen di level `app/**/page.tsx` (harus selalu SSR).
- **Contoh SSR di Kumpul**: [`modules/pooling/pool-card.tsx`]
  ```tsx
  // TIDAK PERLU "use client" karena murni presentasi data dari server
  import { Badge } from "@/components/ui/badge";
  import { Package, MapPin } from "lucide-react";

  interface PoolCardProps {
    commodityName: string;
    targetMoq: number;
    accumulatedQty: number;
    hubAddress: string;
  }

  export default function PoolCard({ commodityName, targetMoq, accumulatedQty, hubAddress }: PoolCardProps) {
    return (
      <div className="p-4 bg-neutral-100 border border-neutral-300 rounded-xl box-shadow-custom">
        <h3 className="font-bold text-heading-6 text-primary-500 mb-2">{commodityName}</h3>
        <div className="flex items-center gap-2 text-body-3 text-neutral-700">
          <MapPin size={16} /> <span>{hubAddress}</span>
        </div>
        {/* Render data statis */}
      </div>
    );
  }
  ```

### 2.2. Kapan Komponen Membutuhkan `"use client"` (CSR)?
Komponen HANYA boleh menggunakan direktif `"use client"` jika memerlukan:
1. React hooks: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`.
2. Browser navigation / routing hooks: `useRouter`, `usePathname`, `useSearchParams`.
3. Event listeners interaktif: `onClick`, `onChange`, `onSubmit`.
4. Integrasi Midtrans Snap window (`window.snap.pay`).
5. Browser Web APIs: `navigator.geolocation`, `localStorage`.

### 2.3. Pola Isolasi Leaf Component (Best Practice)
**JANGAN** mengubah seluruh halaman detail pool menjadi Client Component hanya karena ada satu tombol *"Gabung Pool (Bayar DP)"* atau komponen countdown timer!

Isolasikan bagian interaktif tersebut menjadi komponen terpisah:
```tsx
// modules/pooling/countdown-timer.tsx
"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // interval timer logic
  }, [expiresAt]);

  return <span className="font-mono text-accent-400 font-bold">{timeLeft}</span>;
}
```

Dengan mengisolasi `CountdownTimer` dan `JoinPoolModal` sebagai leaf client components, halaman utama di `app/pooling/[id]/page.tsx` **tetap 100% Server Component**.

---

## 🎨 3. Desain Sistem Konsisten (`app/globals.css`)

Semua komponen wajib mengikuti token CSS yang telah didefinisikan pada `@theme inline` di `app/globals.css`. Dilarang keras menggunakan sembarang arbitrary values (misal `text-[15px]` atau `bg-[#284b1d]`) bila token resminya sudah tersedia.

### 3.1. Token Tipografi Fluid
Menggunakan fungsi `clamp()` responsif:
- **Heading**:
  - `text-heading-1`: Judul hero display utama (`clamp(2.75rem, 5.5vw, 4.25rem)`)
  - `text-heading-2`: Sub-hero / judul seksi besar (`clamp(2.25rem, 4.5vw, 3.5rem)`)
  - `text-heading-3`: Judul bagian penting / modul (`clamp(1.75rem, 3.5vw, 2.875rem)`)
  - `text-heading-4`: Judul panel besar / dialog (`clamp(1.5rem, 3vw, 2.375rem)`)
  - `text-heading-5`: Judul kartu produk & pool (`clamp(1.25rem, 2.5vw, 2rem)`)
  - `text-heading-6`: Judul sub-seksi / card title (`clamp(1.125rem, 2vw, 1.625rem)`)
  - `text-heading-7`: Sub-heading / label metrik kuota (`clamp(1rem, 1.5vw, 1.375rem)`)
- **Body Text**:
  - `text-body-1`: Paragraf utama / teks lead (`clamp(1rem, 1.3vw, 1.125rem)`)
  - `text-body-2`: Standar isi kartu, spesifikasi produk, label form (`clamp(0.875rem, 1.1vw, 1rem)`)
  - `text-body-3`: Teks deskripsi sekunder / footer card (`clamp(0.75rem, 1vw, 0.875rem)`)
  - `text-body-4`: Keterangan mikro / badge lot number (`clamp(0.6875rem, 0.9vw, 0.75rem)`)
  - `text-body-5`: Keterangan metrik terkecil (`clamp(0.5625rem, 0.8vw, 0.625rem)`)

### 3.2. Palet Warna Resmi
- **Primary (Hijau Pangan & Keberlanjutan)**:
  - `bg-primary-100` (`#AEDBA0`) s.d. `bg-primary-500` (`#284B1D`)
  - `bg-primary-10` (`#4684321A` — tinted background status aktif)
- **Secondary (Hijau Terang / Sub-elemen)**:
  - `secondary-100` (`#CCEBB8`) s.d. `secondary-500` (`#417320`)
  - `secondary-10` (`#9AD8721A`)
- **Tertiary (Kuning / Highlight Status & Menunggu Kuota)**:
  - `tertiary-100` (`#FFF7C8`) s.d. `tertiary-500` (`#AF9600`)
  - `tertiary-10` (`#FFEF911A`), `tertiary-50` (`#FFEF9180`)
- **Accent (Oranye / Tombol CTA, Pooling Progress & Aksi Utama)**:
  - `accent-100` (`#FFDFB9`) s.d. `accent-500` (`#A35900`)
  - `accent-300` (`#FFA02E`), `accent-400` (`#E87F00`)
  - `accent-10` (`#FFA02E1A`), `accent-50` (`#FFA02E80`)
- **Neutral (Grayscale)**:
  - `neutral-100` (`#FFFFFF`) s.d. `neutral-1000` (`#333333`)
  - Background default kartu: `bg-neutral-100`, border default: `border-neutral-300`
- **Utility Bayangan (Box Shadow)**:
  - Selalu gunakan utility class `box-shadow-custom` untuk elevasi kartu atau panel agar konsisten dengan gaya Kumpul.

> [!IMPORTANT]
> **Aturan UI Safety**: Jangan pernah merombak atau mengubah styling Tailwind pada komponen yang sudah dibuat oleh user kecuali diminta secara eksplisit (*Rule AGENTS.md*).

---

## 🏷️ 4. Konvensi Penamaan Variabel & Konstanta

| Kategori | Konvensi | Lokasi / Scope | Contoh di Platform Kumpul |
| :--- | :--- | :--- | :--- |
| **Normal Variable / State** | `camelCase` | Didalam fungsi / komponen / hook | `accumulatedQty`, `selectedHub`, `isSubmitting`, `wasteVolume` |
| **State Updater Function** | `set` + `PascalCase` | Hook useState | `setAccumulatedQty`, `setSelectedHub`, `setIsPooling` |
| **Event Handler** | `handle` + `Action` | Didalam fungsi / komponen | `handleJoinPool`, `handlePayDeposit`, `handleCreateWasteListing` |
| **Boolean Flag** | `is` / `has` / `should` + `PascalCase` | Variabel / Props | `isLoading`, `hasReachedMoq`, `isHubSelected`, `isVerified` |
| **Global Constants** | `UPPER_SNAKE_CASE` | `constants/helper.ts` | `SECTOR_TYPES`, `POOL_STATUSES`, `DEFAULT_RADIUS_KM` |
| **Local File Constants** | `UPPER_SNAKE_CASE` | Di luar fungsi pada file terkait | `DEFAULT_DEPOSIT_PERCENTAGE`, `MAX_SHELF_LIFE_HOURS` |
| **Types & Interfaces** | `PascalCase` | `types/index.ts` atau lokal | `PoolParticipant`, `SupplierCommodity`, `WasteListingItem` |
| **React Components** | `PascalCase` | `components/` & `modules/` | `PoolCard`, `HubMapPicker`, `WasteListingGrid` |
| **File Names** | `kebab-case.tsx` | Seluruh folder | `pool-card.tsx`, `role-switcher.tsx`, `waste-estimate.tsx` |

### 4.1. Praktik Terbaik Penulisan Constants di `constants/helper.ts`
```ts
// constants/helper.ts
export const SECTOR_TYPES = [
  "PERTANIAN",
  "PETERNAKAN",
  "PERIKANAN",
  "PERKEBUNAN",
  "FNB_PENGOLAHAN",
  "RITEL",
  "LOGISTIK",
] as const;

export const POOL_STATUS_LABELS = {
  OPEN: "Pendaftaran Dibuka",
  AGGREGATING: "Mengumpulkan Kuota",
  LOCKED: "Kuota Terpenuhi (Terkunci)",
  COMPLETED: "Pesanan Selesai",
  FAILED: "Waktu Habis (Auto-Refund)",
} as const;

export const DEFAULT_DEPOSIT_RATE = 0.2; // DP Komitmen 20%
```

---

## 📋 5. Prompt Guide Siap Pakai (System Prompt untuk AI / Developer)

Salin template prompt di bawah ini ke dalam instruksi AI / subagent saat meminta pembuatan fitur di platform Kumpul:

```markdown
Anda adalah Full-Stack Next.js 16 + React 19 Architect untuk platform "Kumpul" (B2B Cross-Sector Supply Chain & Circular Economy Platform - ICOMFEST 2026).
Sebelum membuat atau mengubah kode, rujuklah arsitektur pada:
1. `graphify-out/graph.json` dan `graphify-out/GRAPH_REPORT.md` (Peta keterhubungan modul & God Nodes).
2. `PRD.md` dan `PRD_Review_and_Refinement.md` (Aturan bisnis, state pooling, formula limbah, DP escrow).
3. `ERD.md` (Skema database Supabase & constraint NOT NULL/Nullable).

Patuhi aturan arsitektur komponen berikut:
1. ARSITEKTUR KOMPONEN:
   - Komponen atomik / primitif (reusable) WAJIB ditempatkan di `components/ui/<nama-komponen>.tsx`.
   - Komponen spesifik fitur Kumpul WAJIB ditempatkan di `modules/<nama-fitur>/<nama-komponen>.tsx` (contoh: `modules/pooling/`, `modules/waste/`, `modules/quality/`).
   - File `app/<route>/page.tsx` hanya bertindak sebagai orkestrator tipis (SSR) yang mengimpor komponen dari `modules/`.

2. SEPARASI SSR DAN CSR:
   - Default adalah Server Component (SSR). Jangan gunakan "use client" di level `app/**/page.tsx`.
   - Gunakan "use client" HANYA pada leaf component terkecil yang membutuhkan interaktivitas (seperti event handler onClick, countdown timer, form modal, atau Midtrans popup).

3. DESAIN SISTEM (app/globals.css):
   - Gunakan token tipografi resmi: `text-heading-1` s.d. `text-heading-7` dan `text-body-1` s.d. `text-body-5`.
   - Gunakan palet warna resmi: `primary-*`, `secondary-*`, `tertiary-*`, `accent-*`, dan `neutral-*`.
   - Gunakan utility bayangan `box-shadow-custom` untuk kontainer kartu/panel.
   - PENTING: Dilarang mengubah styling Tailwind yang sudah ada kecuali diminta secara eksplisit.

4. KONVENSI PENAMAAN:
   - Variabel biasa, fungsi, props: `camelCase` (misal: `accumulatedQty`, `handleJoinPool`).
   - Konstanta konfigurasi/data: `UPPER_SNAKE_CASE` (misal: `SECTOR_TYPES`), simpan di `constants/helper.ts` atau di luar fungsi.
   - Komponen & Interface: `PascalCase` (misal: `PoolCard`, `WasteListingItem`).
   - Nama file: `kebab-case.tsx` (misal: `pool-progress-bar.tsx`).
```

---

## 🛠️ 6. Checklist Pembuatan Komponen Baru

Sebelum menyelesaikan pembuatan komponen di platform Kumpul, pastikan hal-hal berikut telah terpenuhi:
- [ ] Apakah komponen terkecil sudah ditempatkan di `components/ui/`?
- [ ] Apakah komponen spesifik domain Kumpul berada di `modules/<feature>/` (pooling, waste, logistics, quality, roles)?
- [ ] Apakah direktif `"use client"` hanya berada di komponen daun (*leaf component*) yang memang membutuhkan interaksi?
- [ ] Apakah tipografi menggunakan `text-heading-*` atau `text-body-*` dari `globals.css`?
- [ ] Apakah warna menggunakan palet `accent`, `primary`, `tertiary`, atau `neutral` dari desain sistem?
- [ ] Apakah variabel menggunakan `camelCase` dan konstanta menggunakan `UPPER_SNAKE_CASE`?
- [ ] Apakah nama file menggunakan format `kebab-case.tsx`?
- [ ] Apakah alur data dan relasi foreign key selaras dengan yang dipetakan di [ERD.md](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/ERD.md) dan [graphify-out/GRAPH_REPORT.md](file:///Users/matthewpriantara/Documents/Code/competition_project/icomfest/graphify-out/GRAPH_REPORT.md)?
- [ ] Apakah styling UI yang sudah dibuat user tetap terjaga dan tidak dirusak?