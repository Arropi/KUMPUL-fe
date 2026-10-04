import * as React from "react";
import type { Metadata } from "next";
import { ProdukEditView } from "@/modules/umkm/produk/produk-edit-view";

export const metadata: Metadata = {
  title: "Edit Spesifikasi Produk & Resep | KUMPUL UMKM",
  description:
    "Perbarui target harga jual, estimasi iterasi produksi per batch, dan komposisi bill of materials bahan baku resep.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProdukPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProdukEditView productId={id} />
    </React.Suspense>
  );
}
