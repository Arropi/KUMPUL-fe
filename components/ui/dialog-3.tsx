"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface Dialog3Props {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  checkboxLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function Dialog3({
  trigger,
  open,
  onOpenChange,
  title = "Hapus data ini?",
  description = "Tindakan ini permanen dan tidak dapat dibatalkan. Seluruh data terkait akan dihapus.",
  checkboxLabel = "Saya paham bahwa tindakan ini tidak dapat dibatalkan",
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  isLoading = false,
  onConfirm,
}: Dialog3Props) {
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsConfirmed(false);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="border-border/60 rounded-2xl border bg-surface p-6 sm:p-7 shadow-elevation-2 max-w-md">
        <AlertDialogHeader className="place-items-start text-left">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <TriangleAlert className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-base sm:text-lg font-heading font-semibold text-text-primary">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-text-secondary leading-relaxed">
            {description}
            <span className="mt-5 flex items-center justify-start gap-3">
              <Checkbox
                id="dialog3-confirm-checkbox"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(Boolean(checked))}
                className="border-neutral-400 bg-white data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
              />
              <Label
                htmlFor="dialog3-confirm-checkbox"
                className="text-sm text-text-secondary cursor-pointer select-none"
              >
                {checkboxLabel}
              </Label>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 justify-end bg-transparent px-0 pt-4 pb-1 gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="rounded-xl border border-border bg-surface-subtle px-4 py-2 text-text-secondary hover:bg-border/60 transition cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!isConfirmed || isLoading}
            isLoading={isLoading}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            className="rounded-xl px-5 py-2 font-semibold text-white shadow transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default Dialog3;
