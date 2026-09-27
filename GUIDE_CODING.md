# 📐 Panduan & Guide Prompt Standar Penulisan Komponen — CitySim

Dokumen ini adalah **pedoman resmi (guideline)** sekaligus **template system prompt** untuk pengembangan komponen pada arsitektur Next.js (App Router) di proyek **CitySim**. Gunakan panduan ini sebagai instruksi bagi pengembang maupun prompt panduan untuk AI Agent saat membuat fitur atau komponen baru.

---

## 📌 Ringkasan Prinsip Utama

1. **Atomic UI Primitives (`components/ui/`)**: Setiap komponen terkecil, independen, dan reusable ditempatkan di `components/ui/`.
2. **Modular Feature Components (`modules/<feature>/`)**: Komponen spesifik halaman/domain dikelompokkan ke dalam modul fitur masing-masing.
3. **Pemisahan CSR & SSR Maksimal**: Server Components (SSR) sebagai default; Client Components (`"use client"`) diisolasi sekecil mungkin pada *leaf components* yang membutuhkan interaktivitas.
4. **Desain Sistem Terstandarisasi (`app/globals.css`)**: Wajib menggunakan token tipografi, warna, dan utility yang sudah ditentukan.
5. **Konvensi Penamaan Variabel & Konstanta**: Variabel dan fungsi menggunakan `camelCase`, konstanta konfigurasi/global menggunakan `UPPER_SNAKE_CASE` yang disimpan di `constants/`.

---

## 📂 1. Arsitektur Struktur Direktori & Komponen

Arsitektur CitySim membagi komponen ke dalam 3 hierarki yang terisolasi dengan rapi:

```
city-sim/
├── app/                        # Route Pages & Server Orchestrators (SSR)
│   ├── globals.css             # Desain sistem & token Tailwind v4 inline
│   ├── informasi/
│   │   └── page.tsx            # Thin SSR Page (Hanya mengorkestrasi komponen)
│   └── pendataan/
│       └── page.tsx            # Thin SSR Page
├── modules/                    # Feature-Driven Components (Domain-specific)
│   ├── informasi/              # Komponen khusus halaman informasi
│   │   ├── luas-lantai-ruang.tsx          # Pure SSR component
│   │   ├── persyaratan-perencanaan.tsx    # Pure SSR component
│   │   └── prasarana-utilitas-utama.tsx   # Pure SSR component
│   └── pendataan/              # Komponen khusus halaman pendataan
│       ├── form.tsx                       # CSR component (form state, geolocation)
│       └── back-button.tsx                # Isolated CSR leaf component
├── components/                 # Global Shared Components
│   └── ui/                     # Komponen Terkecil / Atomic Primitives
│       ├── button.tsx          # Base UI + CVA + Tailwind
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── card.tsx
│       └── dialog.tsx
└── constants/                  # Single Source of Truth untuk Konstanta
    └── helper.ts               # UPPER_SNAKE_CASE data, metadata, coordinate presets
```

### Aturan Peletakan:
- **`components/ui/`**: HANYA untuk komponen antarmuka primitif dan atomik yang **tidak terikat dengan domain bisnis tertentu**. Komponen ini menggunakan `@base-ui/react` atau Radix Primitives yang dikombinasikan dengan `class-variance-authority` (CVA).
- **`modules/<nama-fitur>/`**: Untuk seluruh komponen yang spesifik pada fitur atau alur tertentu (misal: kartu indikator, form input data spasial, panel kontrol simulasi).
- **`app/**/page.tsx`**: Bertindak sebagai **orkestrator tipis** (*thin page router*). Jangan menuliskan logic JSX yang panjang atau state kompleks langsung di file `page.tsx`. Panggil komponen dari `modules/`.

---

## ⚡ 2. Pemisahan Maksimal CSR (Client) & SSR (Server)

Prinsip dasar Next.js App Router: **Server Component by Default, Client Component on Leaves**.

### 2.1. Kapan Komponen Harus Menjadi SSR (Server Component)?
- Komponen hanya merender tampilan informasi statis, HTML murni, atau data dari server.
- Mengambil data (*fetch*) langsung dari backend / database / server actions.
- Komponen di level `app/**/page.tsx` (harus selalu SSR kecuali terpaksa).
- **Contoh SSR**: Komponen [`modules/informasi/luas-lantai-ruang.tsx`](file:///C:/Users/User/Documents/Projekan/city-sim/modules/informasi/luas-lantai-ruang.tsx)
  ```tsx
  // TIDAK PERLU "use client" karena murni presentasi data statis
  import { House, UserRound } from "lucide-react";

  export default function LuasLantaiRuang() {
    return (
      <div className="p-1">
        <h1 className="font-bold text-body-4 mb-3">Luas Lantai Ruang</h1>
        {/* Render konten statis */}
      </div>
    );
  }
  ```

### 2.2. Kapan Komponen Membutuhkan `"use client"` (CSR)?
Komponen HANYA boleh menggunakan direktif `"use client"` jika memerlukan:
1. React hooks: `useState`, `useEffect`, `useMemo`, `useCallback`, `useReducer`, `useRef`.
2. Browser navigation / routing hooks: `useRouter`, `usePathname`, `useSearchParams`.
3. Event listeners interaktif: `onClick`, `onChange`, `onSubmit`, `onDragOver`, `onDrop`.
4. Browser Web APIs: `navigator.geolocation`, `window`, `document`, `localStorage`, `IndexedDB`.

### 2.3. Pola Isolasi Leaf Component (Best Practice)
**JANGAN** mengubah seluruh halaman atau parent component menjadi Client Component hanya karena satu tombol atau input interaktif!

Isolasikan bagian interaktif tersebut menjadi komponen terpisah di dalam module.
**Contoh Nyata Proyek**: [`modules/pendataan/back-button.tsx`](file:///C:/Users/User/Documents/Projekan/city-sim/modules/pendataan/back-button.tsx)
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      onClick={() => router.back()}
      variant={"orange"}
      size={"sm"}
    >
      <ArrowLeft /> Kembali
    </Button>
  );
}
```

Dengan mengisolasi `BackButton` sebagai leaf client component, parent page di [`app/informasi/page.tsx`](file:///C:/Users/User/Documents/Projekan/city-sim/app/informasi/page.tsx) **tetap 100% Server Component**:
```tsx
// app/informasi/page.tsx (Server Component)
import LuasLantaiRuang from "@/modules/informasi/luas-lantai-ruang"; // SSR
import PersyaratanPerencanaan from "@/modules/informasi/persyaratan-perencanaan"; // SSR
import PrasaranaUtilitasUtama from "@/modules/informasi/prasarana-utilitas-utama"; // SSR
import BackButton from "@/modules/pendataan/back-button"; // CSR (Leaf Isolated)

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-4">
        {/* BackButton berjalan di client tanpa membuat Page menjadi client component */}
        <BackButton />
        <h1 className="text-heading-6 font-bold">INFORMASI PERUMAHAN</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
        <div className="md:col-span-6">
          <LuasLantaiRuang />
          <PersyaratanPerencanaan />
        </div>
        <div className="md:col-span-4">
          <PrasaranaUtilitasUtama />
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 3. Desain Sistem Konsisten (`app/globals.css`)

Semua komponen wajib mengikuti token CSS yang telah didefinisikan pada `@theme inline` di [`app/globals.css`](file:///C:/Users/User/Documents/Projekan/city-sim/app/globals.css). Dilarang keras menggunakan sembarang arbitrary values (misal `text-[15px]` atau `bg-[#284b1d]`) bila token resminya sudah tersedia.

### 3.1. Token Tipografi Fluid
Menggunakan fungsi `clamp()` responsif dengan line-height dan letter-spacing baku:
- **Heading**:
  - `text-heading-1`: Judul hero / display utama (`clamp(2.75rem, 5.5vw, 4.25rem)`)
  - `text-heading-2`: Sub-hero / judul seksi besar (`clamp(2.25rem, 4.5vw, 3.5rem)`)
  - `text-heading-3`: Judul bagian penting (`clamp(1.75rem, 3.5vw, 2.875rem)`)
  - `text-heading-4`: Judul panel besar (`clamp(1.5rem, 3vw, 2.375rem)`)
  - `text-heading-5`: Judul modal atau kartu utama (`clamp(1.25rem, 2.5vw, 2rem)`)
  - `text-heading-6`: Judul judul modul/halaman (`clamp(1.125rem, 2vw, 1.625rem)`)
  - `text-heading-7`: Sub-heading / label metrik besar (`clamp(1rem, 1.5vw, 1.375rem)`)
- **Body Text**:
  - `text-body-1`: Paragraf utama / teks lead (`clamp(1rem, 1.3vw, 1.125rem)`)
  - `text-body-2`: Standar isi kartu dan label umum (`clamp(0.875rem, 1.1vw, 1rem)`)
  - `text-body-3`: Teks deskripsi sekunder / form caption (`clamp(0.75rem, 1vw, 0.875rem)`)
  - `text-body-4`: Keterangan mikro / badge footnote (`clamp(0.6875rem, 0.9vw, 0.75rem)`)
  - `text-body-5`: Keterangan metrik terkecil (`clamp(0.5625rem, 0.8vw, 0.625rem)`)

### 3.2. Palet Warna Resmi
- **Primary (Hijau Alam Kota)**:
  - `bg-primary-100` (`#AEDBA0`) s.d. `bg-primary-500` (`#284B1D`)
  - `bg-primary-10` (`#4684321A` — tinted background)
- **Secondary (Hijau Terang / Sub-elemen)**:
  - `secondary-100` (`#CCEBB8`) s.d. `secondary-500` (`#417320`)
  - `secondary-10` (`#9AD8721A`)
- **Tertiary (Kuning / Highlight Status)**:
  - `tertiary-100` (`#FFF7C8`) s.d. `tertiary-500` (`#AF9600`)
  - `tertiary-10` (`#FFEF911A`), `tertiary-50` (`#FFEF9180`)
- **Accent (Oranye / Interaksi & Tombol Utama)**:
  - `accent-100` (`#FFDFB9`) s.d. `accent-500` (`#A35900`)
  - `accent-300` (`#FFA02E`), `accent-400` (`#E87F00`)
  - `accent-10` (`#FFA02E1A`), `accent-50` (`#FFA02E80`)
- **Neutral (Grayscale)**:
  - `neutral-100` (`#FFFFFF`) s.d. `neutral-1000` (`#333333`)
  - Background default kartu: `bg-neutral-100`, border default: `border-neutral-300` / `border-neutral-700`
- **Utility Bayangan (Box Shadow)**:
  - Selalu gunakan utility class `box-shadow-custom` untuk elevasi kartu atau panel agar konsisten dengan gaya CitySim.

> [!IMPORTANT]
> **Aturan UI Safety**: Jangan pernah merombak atau mengubah styling Tailwind pada komponen yang sudah dibuat oleh user kecuali diminta secara eksplisit (*Rule AGENTS.md*).

---

## 🏷️ 4. Konvensi Penamaan Variabel & Konstanta

| Kategori | Konvensi | Lokasi / Scope | Contoh |
| :--- | :--- | :--- | :--- |
| **Normal Variable / State** | `camelCase` | Didalam fungsi / komponen / hook | `ownerName`, `buildingCondition`, `isSubmitting`, `coords` |
| **State Updater Function** | `set` + `PascalCase` | Hook useState | `setOwnerName`, `setIsLocating`, `setPreviewUrl` |
| **Event Handler** | `handle` + `Action` | Didalam fungsi / komponen | `handleSubmit`, `handleGetLocation`, `handleFileChange` |
| **Boolean Flag** | `is` / `has` / `should` + `PascalCase` | Variabel / Props | `isLoading`, `hasCleanWater`, `isLocating`, `isSafe` |
| **Global Constants** | `UPPER_SNAKE_CASE` | `constants/helper.ts` | `CITY_COORDINATES`, `MADIUN_GEO`, `BUILDING_TYPE` |
| **Local File Constants** | `UPPER_SNAKE_CASE` | Di luar fungsi pada file terkait | `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `DUMMY_DATA` |
| **Types & Interfaces** | `PascalCase` | `types/index.ts` atau lokal | `MapItems`, `CityCoordConfig`, `ResidentialBuilding` |
| **React Components** | `PascalCase` | `components/` & `modules/` | `BackButton`, `MapContainer`, `PrasaranaUtilitasUtama` |
| **File Names** | `kebab-case.tsx` | Seluruh folder | `back-button.tsx`, `luas-lantai-ruang.tsx` |

### 4.1. Praktik Terbaik Penulisan Constants di `constants/helper.ts`
Gunakan tipe tegas atau `as const` pada konstanta data agar autocomplete TypeScript bekerja optimal:
```ts
// constants/helper.ts
export const MADIUN_GEO = {
  DEFAULT_ZOOM: 15,
  MIN_ZOOM: 14,
  MAX_ZOOM: 18,
  BOUNDS: [
    [-7.6750, 111.4880],
    [-7.5850, 111.5760],
  ] as [[number, number], [number, number]],
};

export const INFORMASI_PERUMAHAN_ITEMS: readonly string[] = [
  "Informasi mengenai kondisi fisik dan kelayakan perumahan.",
  "Data ketersediaan sarana dan prasarana lingkungan.",
  "Panduan navigasi dan pemantauan titik lokasi pada peta.",
];
```

---

## 📋 5. Prompt Guide Siap Pakai (System Prompt untuk AI / Developer)

Salin template prompt di bawah ini ke dalam instruksi AI / instruksi agen baru saat meminta pembuatan komponen di proyek ini:

```markdown
Anda adalah Full-Stack Next.js 16 + React 19 Architect untuk proyek CitySim.
Setiap kali Anda membuat atau memperbarui komponen, patuhi aturan berikut:

1. ARSITEKTUR KOMPONEN:
   - Komponen atomik / primitif (reusable) WAJIB ditempatkan di `components/ui/<nama-komponen>.tsx`.
   - Komponen spesifik fitur/halaman WAJIB ditempatkan di `modules/<nama-fitur>/<nama-komponen>.tsx`.
   - File `app/<route>/page.tsx` hanya bertindak sebagai orkestrator tipis (SSR) yang mengimpor komponen dari `modules/`.

2. SEPARASI SSR DAN CSR:
   - Default adalah Server Component (SSR). Jangan gunakan "use client" di level `app/**/page.tsx`.
   - Gunakan "use client" HANYA pada leaf component terkecil yang membutuhkan interaktivitas (seperti event handler onClick, form state, geolokasi, atau useRouter).
   - Teladani contoh `modules/pendataan/back-button.tsx` yang diisolasi sebagai client component agar halaman parent-nya tetap bisa menjadi Server Component.

3. DESAIN SISTEM (app/globals.css):
   - Gunakan token tipografi resmi: `text-heading-1` s.d. `text-heading-7` dan `text-body-1` s.d. `text-body-5`.
   - Gunakan palet warna resmi: `primary-*`, `secondary-*`, `tertiary-*`, `accent-*`, dan `neutral-*`.
   - Gunakan utility bayangan `box-shadow-custom` untuk kontainer kartu/panel.
   - PENTING: Dilarang mengubah styling Tailwind yang sudah ada kecuali diminta secara eksplisit.

4. KONVENSI PENAMAAN:
   - Variabel biasa, fungsi, props: `camelCase` (misal: `ownerName`, `handleSubmit`, `isSubmitting`).
   - Konstanta konfigurasi/data: `UPPER_SNAKE_CASE` (misal: `CITY_COORDINATES`, `BUILDING_TYPE`), simpan di `constants/helper.ts` atau di luar fungsi komponen.
   - Komponen & Interface: `PascalCase` (misal: `BackButton`, `MapItems`).
   - Nama file: `kebab-case.tsx` (misal: `back-button.tsx`).
```

---

## 🛠️ 6. Checklist Pembuatan Komponen Baru

Sebelum menyelesaikan pembuatan komponen, pastikan hal-hal berikut telah terpenuhi:
- [ ] Apakah komponen terkecil sudah ditempatkan di `components/ui/`?
- [ ] Apakah komponen spesifik halaman berada di `modules/<feature>/`?
- [ ] Apakah direktif `"use client"` hanya berada di komponen daun (*leaf component*) yang memang membutuhkan interaksi?
- [ ] Apakah tipografi menggunakan `text-heading-*` atau `text-body-*` dari `globals.css`?
- [ ] Apakah warna menggunakan palet `accent`, `primary`, `tertiary`, atau `neutral` dari desain sistem?
- [ ] Apakah variabel menggunakan `camelCase` dan konstanta menggunakan `UPPER_SNAKE_CASE`?
- [ ] Apakah nama file menggunakan format `kebab-case.tsx`?
- [ ] Apakah styling UI yang sudah dibuat user tetap terjaga dan tidak dirusak?