import * as React from "react";
import type { Metadata } from "next";
import { UmkmMenuView } from "@/modules/umkm/menu-view";

export const metadata: Metadata = {
  title: "Produk & Kebutuhan Bahan Baku | KUMPUL UMKM",
  description: "Kelola produk usaha dan rincian kebutuhan bahan baku untuk agregasi autonomous pooling.",
};

export default function UmkmProdukPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <UmkmMenuView />
    </React.Suspense>
  );
}
