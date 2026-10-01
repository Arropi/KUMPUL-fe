import type { Metadata } from "next";
import { RegisterView } from "@/modules/auth/register/register-view";

export const metadata: Metadata = {
  title: "Daftar Akun Baru | KUMPUL",
  description:
    "Daftarkan entitas usaha Anda di platform rantai pasok kolaboratif dan autonomous MOQ pooling KUMPUL.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
