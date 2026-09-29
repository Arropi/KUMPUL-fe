import type { Metadata } from "next";
import { LoginView } from "@/modules/auth/login-view";

export const metadata: Metadata = {
  title: "Masuk ke Akun | KUMPUL",
  description:
    "Portal Masuk Platform Rantai Pasok B2B Lintas 7 Sektor, Autonomous MOQ Pooling, dan Paspor Mutu Bahan Pangan KUMPUL.",
};

export default function Home() {
  return <LoginView />;
}