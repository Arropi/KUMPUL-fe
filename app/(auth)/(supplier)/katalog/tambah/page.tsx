import type { Metadata } from "next";
import { TambahKomoditasForm } from "@/modules/supplier/katalog/tambah-komoditas-form";
import { getBusinessProfileAction } from "@/actions/business-profile";

export const metadata: Metadata = {
  title: "Tambah Pasokan Komoditas | Portal Supplier KUMPUL",
  description:
    "Formulir pendaftaran komoditas partai besar, setup harga bertingkat, dan paspor sertifikasi mutu pangan.",
};

export default async function TambahKomoditasPage() {
  const profileRes = await getBusinessProfileAction();

  return (
    <TambahKomoditasForm
      initialEntity={profileRes.success && profileRes.entity ? profileRes.entity : null}
      initialRoles={profileRes.success && profileRes.roles ? profileRes.roles : []}
    />
  );
}
