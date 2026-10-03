import type { Metadata } from "next";
import { AuthView } from "@/modules/auth/auth-view";

export const metadata: Metadata = {
  title: "Masuk ke Akun | KUMPUL",
  description:
    "Portal Masuk Platform Rantai Pasok B2B Lintas 7 Sektor, Autonomous MOQ Pooling, dan Paspor Mutu Bahan Pangan KUMPUL.",
};

export default function Home() {
  return <AuthView defaultMode="login" />;
}
