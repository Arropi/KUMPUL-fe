"use client";

import * as React from "react";
import { Plus, Trash2, CreditCard, Check, Star, AlertCircle, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import type { BEBankAccountItem, BEBankAccountInfo } from "@/lib/api/types";
import { updateBusinessEntityProfileAction } from "@/actions/business-profile";

interface ProfileBankAccountsCardProps {
  bankInfo?: BEBankAccountInfo;
  entityId: string;
  defaultHolderName: string;
  onUpdated: (newBankInfo: BEBankAccountInfo) => void;
}

const POPULAR_BANKS = [
  "Bank Central Asia (BCA)",
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Syariah Indonesia (BSI)",
  "Bank CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Bank Jago",
  "Bank BTPN / Jenius",
];

export function ProfileBankAccountsCard({
  bankInfo,
  entityId,
  defaultHolderName,
  onUpdated,
}: ProfileBankAccountsCardProps) {
  // Parsing accounts list
  const accounts: BEBankAccountItem[] = React.useMemo(() => {
    if (bankInfo?.accounts && bankInfo.accounts.length > 0) {
      return bankInfo.accounts;
    }
    // Jika ada single account legacy di bankInfo
    if (bankInfo?.account_number && bankInfo.account_number !== "0000000000") {
      return [
        {
          id: "acc-1",
          bank_name: bankInfo.bank_name || "Bank Central Asia (BCA)",
          account_number: bankInfo.account_number,
          account_holder: bankInfo.account_holder || defaultHolderName,
          is_primary: true,
        },
      ];
    }
    return [];
  }, [bankInfo, defaultHolderName]);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form State Tambah Rekening
  const [bankName, setBankName] = React.useState(POPULAR_BANKS[0]);
  const [accountNumber, setAccountNumber] = React.useState("");
  const [accountHolder, setAccountHolder] = React.useState(defaultHolderName);
  const [isPrimary, setIsPrimary] = React.useState(accounts.length === 0);

  const saveBankAccountsToBackend = async (newAccounts: BEBankAccountItem[]) => {
    setIsSaving(true);
    try {
      const primary = newAccounts.find((a) => a.is_primary) || newAccounts[0];
      const payloadBankInfo: BEBankAccountInfo = {
        bank_name: primary?.bank_name || "",
        account_number: primary?.account_number || "",
        account_holder: primary?.account_holder || "",
        accounts: newAccounts,
      };

      const res = await updateBusinessEntityProfileAction({
        entityId,
        bankAccountInfo: payloadBankInfo,
      });

      if (res.success) {
        onUpdated(payloadBankInfo);
        toast.success("Data rekening bank berhasil disimpan ke backend KUMPUL.");
        return true;
      } else {
        toast.error(res.message || "Gagal memperbarui rekening di backend.");
        return false;
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat menyimpan rekening.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = accountNumber.trim().replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 5) {
      toast.error("Nomor rekening harus terdiri dari minimal 5 digit angka.");
      return;
    }
    if (!accountHolder.trim()) {
      toast.error("Nama pemilik rekening sesuai buku tabungan wajib diisi.");
      return;
    }

    const newAcc: BEBankAccountItem = {
      id: `acc-${Date.now()}`,
      bank_name: bankName,
      account_number: cleanNumber,
      account_holder: accountHolder.trim(),
      is_primary: isPrimary || accounts.length === 0,
    };

    let updatedList: BEBankAccountItem[];
    if (newAcc.is_primary) {
      updatedList = [
        newAcc,
        ...accounts.map((a) => ({ ...a, is_primary: false })),
      ];
    } else {
      updatedList = [...accounts, newAcc];
    }

    const ok = await saveBankAccountsToBackend(updatedList);
    if (ok) {
      setIsAddModalOpen(false);
      setAccountNumber("");
      setAccountHolder(defaultHolderName);
      setIsPrimary(false);
    }
  };

  const handleRemoveAccount = async (accId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus rekening bank ini?")) {
      return;
    }

    const filtered = accounts.filter((a) => a.id !== accId);
    // Jika yang dihapus rekening utama, jadikan akun pertama tersisa sebagai utama
    if (filtered.length > 0 && !filtered.some((a) => a.is_primary)) {
      filtered[0].is_primary = true;
    }

    await saveBankAccountsToBackend(filtered);
    toast.success("Rekening bank berhasil dihapus.");
  };

  const handleSetPrimary = async (accId: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      is_primary: a.id === accId,
    }));
    await saveBankAccountsToBackend(updated);
    toast.success("Rekening utama berhasil diperbarui.");
  };

  return (
    <Card id="section-bank-account" className="rounded-2xl border-border bg-surface shadow-elevation-1">
      <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-text-primary">
            Rekening Bank Penampung &amp; Escrow
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary mt-0.5">
            Digunakan untuk transfer pencairan dana PO, penampungan hasil transaksi, dan escrow pooling KUMPUL.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 font-bold text-xs shrink-0 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Rekening</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-3">
        {accounts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border bg-surface-subtle/70 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-text-primary">
                Belum Ada Rekening Bank Terdaftar
              </p>
              <p className="text-xs text-text-secondary max-w-md mx-auto mt-0.5">
                Tambahkan nomor rekening perbankan usaha Anda agar pembayaran transaksi dan pencairan kuota dapat diproses.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Rekening Sekarang
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden bg-surface">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary text-sm truncate" title={acc.bank_name}>
                      {acc.bank_name}
                    </span>
                    {acc.is_primary && (
                      <Badge variant="success" className="text-[10px] font-bold py-0.5 shrink-0">
                        <Check className="w-3 h-3 mr-1" />
                        Rekening Utama
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-text-secondary tracking-wider truncate" title={`${acc.account_number} • a.n. ${acc.account_holder}`}>
                    {acc.account_number} &bull; a.n. {acc.account_holder}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!acc.is_primary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(acc.id)}
                      disabled={isSaving}
                      className="text-xs font-semibold text-text-secondary hover:text-primary gap-1 h-8"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Jadikan Utama</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccount(acc.id)}
                    disabled={isSaving}
                    className="text-text-muted hover:text-red-500 h-8 w-8 p-0"
                    title="Hapus rekening ini"
                    aria-label="Hapus rekening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog Penambahan Rekening Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Tambah Rekening Bank Usaha
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pastikan nama pemilik rekening sesuai dengan data legalitas atau buku tabungan bank yang didaftarkan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Pilih Bank *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between gap-2 h-11 w-full px-3.5 rounded-xl border border-border bg-surface text-xs sm:text-sm font-medium text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all text-left"
                  >
                    <span className="truncate">{bankName || "Pilih Bank"}</span>
                    <ChevronDown className="size-4 text-text-muted shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[calc(100vw-3rem)] sm:w-80 max-h-60 overflow-y-auto p-1 rounded-xl shadow-elevation-2 bg-surface border border-border custom-scrollbar z-50"
                >
                  <DropdownMenuRadioGroup value={bankName} onValueChange={setBankName}>
                    {POPULAR_BANKS.map((b) => (
                      <DropdownMenuRadioItem key={b} value={b}>
                        {b}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Nomor Rekening *
              </label>
              <Input
                type="text"
                placeholder="Contoh: 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="font-mono text-xs sm:text-sm h-10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Nama Pemilik Rekening *
              </label>
              <Input
                type="text"
                placeholder="Nama sesuai buku tabungan"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="text-xs sm:text-sm h-10"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-primary-checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <label htmlFor="is-primary-checkbox" className="text-xs font-medium text-text-primary cursor-pointer">
                Jadikan sebagai rekening utama untuk pencairan otomatis
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                className="font-bold px-5"
              >
                {isSaving ? "Menyimpan..." : "Simpan Rekening"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
