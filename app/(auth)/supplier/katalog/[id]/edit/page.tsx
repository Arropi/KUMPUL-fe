import type { Metadata } from "next";
import { TambahKomoditasForm } from "@/modules/supplier/katalog/tambah-komoditas-form";

export const metadata: Metadata = {
  title: "Perbarui Pasokan Komoditas | Portal Supplier KUMPUL",
  description: "Perbarui kuota grosir, tier harga, atau paspor mutu komoditas.",
};

export default function EditKomoditasPage() {
  return <TambahKomoditasForm />;
}
