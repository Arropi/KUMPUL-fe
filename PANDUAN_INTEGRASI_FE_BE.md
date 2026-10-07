# Panduan Integrasi Frontend (FE) dengan Backend (BE)  
**Untuk Tiga Fitur Utama: Pembelian, Sistem Pooling, dan Pemesanan**  

> Dokumen ini memberikan langkah‑langkah praktis untuk mengganti data *mock* yang masih digunakan di komponen FE dengan panggilan API BE yang sebenarnya, sehingga alur transaksi (pembelian, bergabung ke pool, dan manajemen pesanan supplier) berjalan sesuai spesifikasi BE. Semua contoh diasumsikan menggunakan wrapper `beFetch` dari `@/lib/api/be-client`, yang sudah menyertakan header otorisasi dan menangani parsing respons.

---

## Prinsip Dasar Integrasi

| Aspek | Keterangan |
|-------|------------|
| **Wrapper API** | Selalu gunakan `beFetch(url, {method?, body?})` dari `fe/lib/api/be-client`. Ia otomatis menambahkan `Authorization: Bearer <token>` dan mengembalikan `{ success: boolean, data?: any, message?: string }`. |
| **Format Payload** | Gunakan **snake_case** untuk semua key JSON yang dikirim ke BE (sesuai spesifikasi BE). |
| **Format Respons** | Respons BE juga dalam **snake_case**; Anda dapat langsung memakai data tersebut di state React bila struktur sudah cocok dengan yang diharapkan UI. Jika perlu, lakukan mapping sederhana. |
| **Penggantian Mock** | Gantilah panggilan ke *action* yang hanya mengembalikan data mock (mis. `getUmkmProductsAction`, `getAllMarketplaceCatalogsAction`) dengan pemanggilan langsung ke `beFetch`. Hapus logika fallback ke mock, atau biarkan action mengembalikan `success: false` dan tangani di komponen UI. |
| **State & Loading** | Tambahkan state `loading` dan `error` agar UI memberikan umpan balik yang baik saat permintaan API sedang berjalan atau gagal. |
| **Error Handling** | Selalu periksa `res.success`. Jika `false`, tampilkan pesan kesalahan (`res.message`) atau fallback yang sesuai. Jika terjadi pengecualian (`catch`), log untuk debugging dan tampilkan pesan pengguna generik. |

---

## 1. Fitur Pembelian (UMKM membeli bahan baku)

### 1.1. Endpoint BE yang relevan
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/marketplace` | Dapatkan katalog komoditas (filter, pagination) |
| `GET` | `/api/marketplace/recommendations` | Rekomendasi komoditas berdasarkan role (UMKM atau Supplier) |
| `POST` | `/api/pre-orders/join` | Bergabung ke pool / membuat pesanan baru |
| `POST` | `/api/payments/snap-token` | Dapatkan token Midtrans untuk pembayaran |
| `POST` | `/api/payments/escrow/release` | Konfirmasi terima barang & rilascio dana escrow |
| `GET` | `/api/orders/umkm/all` | Riwayat pesanan UMKM |

### 1.2. Komponen FE yang perlu dimodifikasi
| File | Tujuan |
|------|--------|
| `fe/app/(auth)/home/page.tsx` | Halaman beranda (menampilkan rekomendasi & katalog) |
| `fe/modules/home/home-recommendation-section.tsx` | Logika rekomendasi |
| `fe/modules/home/home-view.tsx` | Pemanggilan katalog (via `getAllMarketplaceCatalogsAction`) |
| `fe/modules/umkm/dashboard-view.tsx` | Pilihan pool & tombol “Gabung Kuota” |
| `fe/modules/umkm/pesanan-view.tsx` | Daftar pesanan UMKM |
| `fe/modules/umkm/profil-view.tsx` | (opsional) riwayat transaksi |

### 1.3. Langkah Implementasi

#### a. Mengganti mock katalog dengan panggilan BE  
**File:** `fe/modules/home/home-view.tsx`  

```tsx
// Gantilah kode useEffect yang memanggil getAllMarketplaceCatalogsAction
React.useEffect(() => {
  async function loadCatalog() {
    try {
      const res = await beFetch<SupplierCommodity[]>(
        `/api/marketplace?limit=20&offset=0&ready_stock=true`
      );
      if (res.success) {
        setCommodities(res.data ?? []);
      } else {
        // Biarkan array kosong atau tampilkan pesan error sesuai UI
        setCommodities([]);
      }
    } catch (err) {
      console.error(err);
      setCommodities([]);
    }
  }
  loadCatalog();
}, []); // Tambahkan dependency bila filter berubah (mis. sector, search)
```

#### b. Mengganti mock rekomendasi dengan panggilan BE  
**File:** `fe/modules/home/home-recommendation-section.tsx`  

Tambahkan state untuk menyimpan rekomendasi dan panggil endpoint `/api/marketplace/recommendations`:

```tsx
const [recommendations, setRecommendations] = React.useState<MatchedCommodity[]>([]);
React.useEffect(() => {
  if (!isUmkm) return;
  async function loadRecs() {
    try {
      const res = await beFetch<any[]>(`/api/marketplace/recommendations`);
      if (res.success) {
        // Transformasi respons BE ke bentuk yang diharapkan UI (MatchedCommodity)
        const mapped = res.data.map((item: any) => ({
          commodity: {
            id: item.commodity_id,
            name: item.commodity_name,
            // map kolom lain sesuai struktur SupplierCommodity yang Anda gunakan
          },
          recipeTag: item.recipeTag ?? '',
          benchmarkTag: item.benchmarkTag ?? '',
          criticalStockNotice: item.criticalStockNotice ?? undefined
        }));
        setRecommendations(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  }
  loadRecs();
}, [isUmkm]); // Jalankan kembali saat role berubah
```

Lakukan halaman yang serupa untuk supplier (gunakan field `price_benchmarks` dan `high_demand_ingredients` dari respons BE).

#### c. Menggabung ke pool (POST /api/pre-orders/join)  
**File:** `fe/modules/umkm/dashboard-view.tsx` – fungsi `handleJoinPoolSubmit`  

```tsx
// Gantilah seluruh blok setTimeout / mock update state
const handleJoinPoolSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!activeJoinPool) return;

  setIsSubmitting(true);
  try {
    const res = await beFetch<any>(
      `/api/pre-orders/join`,
      {
        method: 'POST',
        body: JSON.stringify({
          pool_id: activeJoinPool?.id, // atau buat pool baru
          umkm_role_id: session?.roleId, // diperoleh dari sesi auth
          order_qty: joinQuantity,
          required_delivery_date: /* format YYYY-MM-DD */,
          is_urgent_asap: deliveryMethod === 'HEMAT_HUB', // contoh mapping
          delivery_method: deliveryMethod, // 'HEMAT_HUB' atau 'DIRECT_DELIVERY'
          final_delivery_address: /* alamat UMKM */,
          final_delivery_lng: /* longitude */,
          final_delivery_lat: /* latitude */
        })
      }
    );

    if (!res.success) {
      throw new Error(res.message ?? 'Gagal bergabung ke pool');
    }

    // Opsional: refetch data pool untuk mendapatkan status terbaru
    toast.success('Berhasil bergabung ke pool', 'Success');
  } catch (err: any) {
    toast.error((err as Error)?.message ?? 'Terjadi kesalahan', 'Gagal');
  } finally {
    setIsSubmitting(false);
  }
};
```

Hapus semua logika `setTimeout` yang hanya memperbarui state lokal.

#### d. Pembayaran (POST /api/payments/snap-token)  
Di tempat yang memicu Midtrans (mis. di detail pesanan UMKM), ganti logika mock dengan:

```tsx
const initiatePayment = async () => {
  setIsProcessing(true);
  try {
    const res = await beFetch<any>(
      `/api/payments/snap-token`,
      {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          delivery_method: /* 'HEMAT_HUB' atau 'DIRECT_DELIVERY' */
        })
      }
    );

    if (!res.success || !res.data?.snap_token) {
      throw new Error(res.message ?? 'Gagal mendapatkan snap token');
    }

    // gunakan snap token untuk memicu Midtrans Snap UI
    window.snap.pay(res.data.snap_token);
  } catch (err: any) {
    toast.error((err as Error)?.message ?? 'Terjadi kesalahan pembayaran', 'Gagal');
  } finally {
    setIsProcessing(false);
  }
};
```

#### e. Konfirmasi terima barang (POST /api/payments/escrow/release)  
Di halaman riwayat pesanan UMKM (mis. `fe/modules/umkm/pesanan-view.tsx` atau detail pesanan), ganti tombol mock dengan:

```tsx
const confirmReceipt = async () => {
  setIsConfirming(true);
  try {
    const res = await beFetch<any>(
      `/api/payments/escrow/release`,
      {
        method: 'POST',
        body: JSON.stringify({
          order_reference_id: orderId
        })
      }
    );

    if (!res.success) {
      throw new Error(res.message ?? 'Gagal konfirmasi terima barang');
    }

    toast.success('Dana escrow berhasil dilepaskan', 'Berhasil');
    // Opsional: refetch data pesanan untuk menampilkan status terbaru
  } catch (err: any) {
    toast.error((err as Error)?.message ?? 'Terjadi kesalahan', 'Gagal');
  } finally {
    setIsConfirming(false);
  }
};
```

---

## 2. Fitur Sistem Pooling (UMKM bergabung ke pool)

### 2.1. Endpoint BE yang relevan
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/pre-orders/join` | Bergabung ke pool (lihat di atas) |
| `GET` | `/api/pre-orders/pools/evaluate-cutoffs` | Evaluasi cut‑off otomatis (dijalankan oleh BE/cron) |
| `GET` | `/api/pre-orders/pools/{id}` | Detail pool (sisa kuota, status, hemat hub, dll.) |
| `GET` | `/api/orders/umkm/all` | Lihat pesanan yang sudah bergabung (histori) |

### 2.2. Komponen FE yang perlu dimodifikasi
| File | Tujuan |
|------|--------|
| `fe/modules/umkm/dashboard-view.tsx` | Daftar pool bergabung, modal join |
| `fe/modules/umkm/kelola-pool-view.tsx` (jika ada) | Manajemen pool yang dibuat UMKM |
| `fe/modules/umkm/profil-view.tsx` | Statistik pooling (penghematan, volume) |

### 2.3. Langkah Implementasi

#### a. Mengganti mock daftar pool dengan panggilan BE  
**File:** `fe/modules/umkm/dashboard-view.tsx`  

```tsx
const [pools, setPools] = React.useState<ActivePoolItem[]>([]);
const [loadingPools, setLoadingPools] = React.useState(true);

React.useEffect(() => {
  async function loadPools() {
    try {
      const res = await beFetch<ActivePoolItem[]>(
        `/api/pre-orders/pools?limit=20&offset=0`
      );
      if (res.success) {
        setPools(res.data ?? []);
      } else {
        setPools([]);
      }
    } catch (err) {
      console.error(err);
      setPools([]);
    } finally {
      setLoadingPools(false);
    }
  }
  loadPools();
}, []); // Tambahkan dependency bila perlu (mis. filter status)
```

#### b. Memperbarui status pool setelah bergabung  
Dalam fungsi `handleJoinPoolSubmit` (lihat bagian 1.3.c), setelah menerima respons sukses dari `/api/pre-orders/join`, Anda dapat:
- Memanggil lagi `loadPools()` untuk mendapatkan data terbaru, atau
- Menggunakan respons yang sudah ada (jika BE mengembalikan data pool terupdate) untuk memperbarui state secara langsung.

#### c. Menampilkan informasi cut‑off & status  
Pastikan UI menampilkan field seperti `pool_status` (OPEN, LOCKED, FAILED, dll.) dan `cut_off_date` yang diterima dari BE. Jika belum ada di respons, Anda dapat menambahkan kolom tersebut di BE kemudian menampilkannya di FE.

---

## 3. Fitur Pemesanan (Supplier side order management)

### 3.1. Endpoint BE yang relevan
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/orders/supplier/pos` | Daftar PO konsolidasi supplier |
| `GET` | `/api/orders/supplier/pos/{id}` | Detail PO (termasuk participant, hub, dll.) |
| `PATCH` | `/api/orders/supplier/pos/{id}/status` | Update status pengiriman (SHIPPED / DELIVERED) |
| `GET` | `/api/orders/supplier/grouped` | Pesanan terkelompok (pooling vs direct) – sudah ada di FE_INTEGRATION_GUIDE.md |

### 3.2. Komponen FE yang perlu dimodifikasi
| File | Tujuan |
|------|--------|
| `fe/app/(auth)/pesanan/page.tsx` | Router ke supplier/umkm view |
| `fe/modules/supplier/pesanan-view.tsx` | Daftar PO terkelompok |
| `fe/modules/supplier/pesanan-detail-view.tsx` | Detail PO & tombol konfirmasi status |
| `fe/modules/supplier/dashboard-view.tsx` | (opsional) ringkasan PO aktif |

### 3.3. Langkah Implementasi

#### a. Mengganti mock daftar PO dengan panggilan BE  
**File:** `fe/modules/supplier/pesanan-view.tsx`  

```tsx
const [orders, setOrders] = React.useState<ConsolidatedPO[]>([]);
const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
  async function loadOrders() {
    try {
      const res = await beFetch<any[]>(
        `/api/orders/supplier/pos?limit=20&offset=0`
      );
      if (res.success) {
        // Map respons BE ke struktur ConsolidatedPO yang diharapkan UI
        const mapped = res.data.map((o: any) => ({
          id: o.id,
          poNumber: o.po_number,
          commodityName: o.commodity_name,
          totalQuantity: o.total_quantity,
          wholesaleUnit: o.wholesale_unit,
          totalWeightKg: o.total_weight_kg,
          participants: o.participants.map((p: any) => ({
            id: p.participant_id,
            umkmName: p.umkm_name,
            orderQtyUnit: p.order_qty_unit,
            orderWeightKg: p.order_weight_kg,
            deliveryMethod: p.delivery_method,
            destinationAddress: p.destination_address,
            allocatedShippingFee: p.allocated_shipping_fee,
            subtotalAmount: p.subtotal_amount
          })),
          hubName: o.hub_name,
          hubAddress: o.hub_address,
          primaryDeliveryMethod: o.primary_delivery_method,
          grandTotalAmount: o.grand_total_amount,
          lockedTierPrice: o.locked_tier_price,
          status: o.status, // PAID_TO_ESCROW, PROCESSING, SHIPPED, DELIVERED
          estimatedDeliveryDate: o.estimated_delivery_date,
          driverName: o.driver_name,
          trackingNumber: o.tracking_number,
          createdAt: o.created_at
        }));
        setOrders(mapped);
      }
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }
  loadOrders();
}, []);
```

#### b. Mengganti mock detail PO dengan panggilan BE  
**File:** `fe/modules/supplier/pesanan-detail-view.tsx`  

Gantilah penggunaan `MOCK_CONSOLIDATED_POS[0]` (atau data mock lain) dengan panggilan `GET /api/orders/supplier/pos/{id}` saat komponen mount atau ketika `poId` berubah:

```tsx
const [po, setPo] = React.useState<ConsolidatedPO | null>(null);
const [loadingPo, setLoadingPo] = React.useState(true);
const [errorPo, setErrorPo] = React.useState<string | null>(null);

React.useEffect(() => {
  if (!poId) return;
  async function loadPoDetail() {
    try {
      const res = await beFetch<any>(`/api/orders/supplier/pos/${poId}`);
      if (res.success && res.data) {
        const o = res.data;
        setPo({
          id: o.id,
          poNumber: o.po_number,
          commodityName: o.commodity_name,
          totalQuantity: o.total_quantity,
          wholesaleUnit: o.wholesale_unit,
          totalWeightKg: o.total_weight_kg,
          participants: o.participants.map((p: any) => ({
            id: p.participant_id,
            umkmName: p.umkm_name,
            orderQtyUnit: p.order_qty_unit,
            orderWeightKg: p.order_weight_kg,
            deliveryMethod: p.delivery_method,
            destinationAddress: p.destination_address,
            allocatedShippingFee: p.allocated_shipping_fee,
            subtotalAmount: p.subtotal_amount
          })),
          hubName: o.hub_name,
          hubAddress: o.hub_address,
          primaryDeliveryMethod: o.primary_delivery_method,
          grandTotalAmount: o.grand_total_amount,
          lockedTierPrice: o.locked_tier_price,
          status: o.status,
          estimatedDeliveryDate: o.estimated_delivery_date,
          driverName: o.driver_name,
          trackingNumber: o.tracking_number,
          createdAt: o.created_at
        });
      } else {
        setPo(null);
        setErrorPo(res.message ?? 'PO tidak ditemukan');
      }
    } catch (err) {
      console.error(err);
      setPo(null);
      setErrorPo('Gagal memuat detail PO');
    } finally {
      setLoadingPo(false);
    }
  }
  loadPoDetail();
}, [poId]);
```

#### c. Mengganti mock update status PO dengan PATCH BE  
**File:** `fe/modules/supplier/pesanan-detail-view.tsx` – fungsi `handleAdvanceStatus`  

```tsx
const handleAdvanceStatus = async (
  nextStatus: 'SHIPPED' | 'DELIVERED',
  successMsg: string
) => {
  if (!po?.id) return;
  setIsUpdating(true);
  try {
    const res = await beFetch<any>(
      `/api/orders/supplier/pos/${po.id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      }
    );

    if (!res.success) {
      throw new Error(res.message ?? 'Gagal memperbarui status PO');
    }

    // Optimistic update UI (atau refetch data PO)
    setPo(prev => ({
      ...prev!,
      status: nextStatus,
      // Jika BE mengembalikan data terupdate, gunakan itu:
      // ...(res.data ?? {})
    }));
    toast.success(successMsg, "Status PO Diperbarui");
  } catch (err: any) {
    toast.error((err as Error)?.message ?? 'Terjadi kesalahan', 'Gagal');
  } finally {
    setIsUpdating(false);
  }
};
```

Hapus seluruh blok `setTimeout` yang hanya memperbarui state secara lokal.

---

## Penutup

Dengan mengikuti langkah‑langkah di atas, Anda akan:

1. **Mengganti semua data mock** di FE dengan panggilan API BE yang sebenarnya, sehingga transaksi pembelian, bergabung ke pool, dan pemesanan akan berjalan sesuai alur bisnis yang telah ditentukan.  
2. **Memastikan konsistensi data** karena semua perubahan disimpan dan diambil dari BE, bukan hanya di state lokal FE.  
3. **Menyediakan pengalaman pengguna yang lebih responsif** melalui state `loading` dan `error` yang jelas.  

Setelah integrasi tiga fitur utama selesai, Anda dapat melanjutkan ke implementasi **Sistem Hemat Hub** (seleksi otomatis UMKM sebagai hub berdasarkan jarak, kapasitas penyimpanan, dan fasilitas bahan) dengan menambahkan kolom baru di BE, sebuah service untuk seleksi, dan menampilkannya di FE seperti yang telah dijelaskan dalam pertanyaan sebelumnya.  

Jika Anda memerlukan contoh kode lebih lengkap untuk suatu file tertentu, silakan beri tahu nama file dan fungsi yang ingin Anda kerjakan, dan saya akan memberikan potongan kode yang siap disalin. Selamat mengimplementasikan!