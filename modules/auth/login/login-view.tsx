"use client";

import * as React from "react";
import { AuthView } from "@/modules/auth/auth-view";

export function LoginView() {
  return <AuthView defaultMode="login" />;
}
