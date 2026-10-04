import * as React from "react";
import type { Metadata } from "next";
import { ProdukDetailView } from "@/modules/umkm/produk/produk-detail-view";

export const metadata: Metadata = {
  title: "Detail Produk & Prediksi Limbah Sirkular | KUMPUL UMKM",
  description:
    "Rincian bill of materials komposisi resep, analisis estimasi limbah AI, dan proyeksi finansial batch produksi.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailProdukPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProdukDetailView productId={id} />
    </React.Suspense>
  );
}
