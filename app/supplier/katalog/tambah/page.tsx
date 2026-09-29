import type { Metadata } from "next";
import { TambahKomoditasForm } from "@/modules/supplier/tambah-komoditas-form";

export const metadata: Metadata = {
  title: "Tambah Pasokan Komoditas | Portal Supplier KUMPUL",
  description:
    "Formulir pendaftaran komoditas partai besar, setup harga bertingkat, dan paspor sertifikasi mutu pangan.",
};

export default function TambahKomoditasPage() {
  return <TambahKomoditasForm />;
}
