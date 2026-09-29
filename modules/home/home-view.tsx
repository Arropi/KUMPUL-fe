"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { UserRole, UserSession } from "@/constants/auth";

interface HomeViewProps {
  initialSession?: UserSession | null;
}

export function HomeView({ initialSession }: HomeViewProps) {
  const searchParams = useSearchParams();

  // Membaca data pengguna dari sesi server atau parameter URL
  const querySuccess = searchParams.get("login_success") === "true";
  const queryRole = searchParams.get("role") as UserRole | null;
  const queryName = searchParams.get("name");
  const queryEmail = searchParams.get("email");

  const effectiveRole: UserRole =
    initialSession?.role || queryRole || "umkm";

  const effectiveName =
    initialSession?.name || queryName || (effectiveRole === "supplier" ? "Mitra Supplier" : "Pelaku UMKM");

  const effectiveEmail =
    initialSession?.email || queryEmail || (effectiveRole === "supplier" ? "supplier@kumpul.id" : "umkm@kumpul.id");

  const effectiveProvider =
    initialSession?.provider || (queryEmail?.includes("@gmail.com") ? "google" : "credentials");

  const [toast, setToast] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "info" | "error";
  }>({
    isOpen: false,
    title: "Login Berhasil",
    message: "",
    type: "success",
  });

  React.useEffect(() => {
    if (querySuccess) {
      const roleLabel = effectiveRole === "supplier" ? "Mitra Supplier" : "Pelaku UMKM";
      const timer = setTimeout(() => {
        setToast({
          isOpen: true,
          title: "Login Berhasil",
          message: `Selamat datang di portal KUMPUL, ${effectiveName} (${roleLabel}).`,
          type: "success",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [querySuccess, effectiveRole, effectiveName]);

  const isSupplier = effectiveRole === "supplier";

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex flex-col font-sans selection:bg-[#EBF5F0] selection:text-[#0D3B2E]">
      <Toast
        isOpen={toast.isOpen}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Navigasi Atas Bersih */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_2px_12px_rgb(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] rounded-lg p-1"
            >
              <span className="w-8 h-8 rounded-xl bg-[#0D3B2E] flex items-center justify-center text-white font-bold text-base shadow-xs">
                K
              </span>
              <span className="font-bold text-lg text-[#0D3B2E] tracking-tight">KUMPUL</span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[#EBF5F0] text-[#0D3B2E]">
              {isSupplier ? "Portal Mitra Supplier" : "Portal Pelaku UMKM"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-neutral-800 leading-tight">
                {effectiveName}
              </span>
              <span className="text-[11px] text-neutral-500 leading-tight">
                {effectiveEmail}
              </span>
            </div>

            <a
              href={`/api/auth/logout?role=${effectiveRole}`}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.96] text-neutral-700 text-xs font-medium transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
            >
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
        {/* Kartu Profil & Sambutan */}
        <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                {effectiveName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                    {effectiveName}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0D3B2E]">
                    {isSupplier ? "Mitra Supplier" : "Pelaku UMKM"}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">
                  {effectiveEmail} &bull; Masuk via {effectiveProvider === "google" ? "Google OAuth" : "Kredensial Akun"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/login?role=${isSupplier ? "umkm" : "supplier"}`}
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-[0.96] transition-all shadow-xs"
              >
                Ganti Peran ({isSupplier ? "UMKM" : "Supplier"})
              </Link>
            </div>
          </div>
        </section>

        {/* Bagian Fitur Terfokus Sesuai Peran */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {isSupplier ? "Aktivitas Pasokan & Permintaan" : "Katalog & Pengadaan Bahan Baku"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isSupplier
                  ? "Kelola inventaris bahan pangan dan pantau pesanan pooling yang masuk."
                  : "Pantau pesanan bersama, kuota MOQ, dan sertifikasi paspor mutu bahan pangan."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isSupplier ? (
              <>
                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Pesanan Pooling Siap Proses</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Tinjau pesanan kolektif dari kelompok UMKM yang telah memenuhi kuota minimum pemesanan (MOQ).
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul pemrosesan pesanan pooling sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Buka Pesanan Masuk &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Katalog Komoditas Pangan</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Perbarui harga grosir, stok ketersediaan, serta kapasitas pengiriman armada distribusi Anda.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul katalog komoditas sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Perbarui Pasokan &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Paspor Mutu & Kepatuhan</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Unggah bukti uji kelayakan, sertifikasi halal, dan transparansi rantai pasok komoditas.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul sertifikasi paspor mutu sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Verifikasi Standar &rarr;
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Autonomous MOQ Pooling</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Gabungkan pesanan bahan baku usaha Anda dengan UMKM sekitar untuk mendapatkan harga grosir langsung dari supplier.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul pooling MOQ aktif sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Ikuti Pooling Aktif &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Paspor Mutu Pangan</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Lacak keaslian asal bahan pangan, standar higienis, dan sertifikat mutu setiap lot pengiriman secara terbuka.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul pelacakan paspor mutu sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Periksa Paspor Mutu &rarr;
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5F0] text-[#0D3B2E] flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <h3 className="font-semibold text-sm text-[#0F172A]">Siklus Ekonomi Sirkular</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Kelola residu bahan baku organik dan kemasan usaha Anda untuk disalurkan ke ekosistem daur ulang mitra.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setToast({ isOpen: true, title: "Informasi", message: "Modul ekonomi sirkular sedang dipersiapkan.", type: "info" })}
                      className="text-xs font-semibold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Kelola Residu Usaha &rarr;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer Minimalis */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span>&copy; {new Date().getFullYear()} KUMPUL. Ekosistem Kolaborasi Rantai Pasok Pangan Terpadu.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-neutral-800 transition-colors">
              Halaman Masuk
            </Link>
            <a href={`/api/auth/logout?role=${effectiveRole}`} className="hover:text-[#DC2626] transition-colors">
              Keluar Akun
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
