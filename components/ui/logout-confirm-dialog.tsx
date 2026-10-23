"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(val) => {
        if (isLoading) return;
        onOpenChange(val);
      }}
    >
      <AlertDialogContent className="max-w-md sm:max-w-[420px] rounded-2xl border-border bg-surface p-6 sm:p-7 shadow-elevation-2">
        <AlertDialogHeader className="space-y-3 text-left">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-2xs">
            <LogOut className="size-5" />
          </div>

          <div className="space-y-1">
            <AlertDialogTitle className="font-heading text-lg font-bold text-text-primary text-balance">
              Konfirmasi Keluar Akun
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-text-secondary leading-relaxed text-pretty">
              Apakah Anda yakin ingin keluar dari akun ini? Anda perlu masuk kembali untuk mengakses portal KUMPUL.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-2 gap-2 sm:gap-2 flex-col-reverse sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl border border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary font-semibold text-xs sm:text-sm min-h-[44px] px-5 py-2.5"
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="destructive"
            isLoading={isLoading}
            disabled={isLoading}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            className="w-full sm:w-auto rounded-xl font-bold text-xs sm:text-sm min-h-[44px] px-5 py-2.5 flex items-center justify-center gap-2"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Ya, Keluar Akun</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutConfirmDialog;
