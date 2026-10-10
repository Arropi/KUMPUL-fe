"use client";

import * as React from "react";
import Link from "next/link";
import { ConsolidatedPO } from "@/constants/supplier";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderStatusBadge } from "./helpers";
import { getSupplierPosAction } from "@/actions/orders";

export function SupplierPesananView() {
  const [orders, setOrders] = React.useState<ConsolidatedPO[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState<boolean>(true);
  const [errorOrders, setErrorOrders] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      setErrorOrders(null);
      try {
        const res = await getSupplierPosAction();
        if (res.success) {
          setOrders(res.data ?? []);
        } else {
          setOrders([]);
          setErrorOrders(res.message ?? "Gagal memuat daftar pesanan");
        }
      } catch (err) {
        console.error(err);
        setOrders([]);
        setErrorOrders("Gagal memuat daftar pesanan");
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((po) => {
    const poNum = po.poNumber || "";
    const comName = po.commodityName || "";
    const hubName = po.hubName || "";
    const q = searchQuery.toLowerCase();

    const matchSearch =
      poNum.toLowerCase().includes(q) ||
      comName.toLowerCase().includes(q) ||
      hubName.toLowerCase().includes(q);

    const matchTab =
      activeTab === "ALL" ||
      (activeTab === "ACTION_NEEDED" &&
        (po.status === "PAID_TO_ESCROW" || po.status === "PROCESSING")) ||
      (activeTab === "IN_TRANSIT" && po.status === "SHIPPED") ||
      (activeTab === "DELIVERED" && po.status === "DELIVERED");

    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary text-balance">
            Pesanan Terpadu (Consolidated PO)
          </h1>
          <p className="font-body text-xs sm:text-sm text-text-secondary mt-1 text-pretty">
            Daftar pesanan grosir dari hasil agregasi pooling UMKM yang telah mengunci tier diskon kuota (PRD Modul A.1).
          </p>
        </div>
      </div>

      {/* Tab Filter Status & Pencarian */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "ALL"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Semua Pesanan {loadingOrders ? '(memuat...)' : `(${orders.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTION_NEEDED")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "ACTION_NEEDED"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Perlu Dikemas / Kirim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("IN_TRANSIT")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "IN_TRANSIT"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Dalam Pengiriman
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DELIVERED")}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "DELIVERED"
                  ? "bg-surface text-primary shadow-[inset_0_1px_0_#FFFFFF,inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.06)] font-bold border border-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-[0.5px]"
              }`}
            >
              Selesai / Tiba
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              id="search-po"
              placeholder="Cari No. PO, Komoditas, Hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search className="w-4 h-4" />}
              className="min-h-[44px]"
            />
          </div>
        </div>
      </Card>

      {/* Konten Daftar Pesanan: Table View untuk Desktop & Card View untuk Mobile */}
      {loadingOrders ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-2 shadow-elevation-1">
          <p className="font-heading text-sm font-bold text-text-primary">
            Memuat daftar pesanan...
          </p>
        </div>
      ) : errorOrders ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-2 shadow-elevation-1">
          <p className="font-heading text-sm font-bold text-text-primary">
            {errorOrders}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Watermelon UI Table-10) */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">No. PO &amp; Status</TableHead>
                  <TableHead>Komoditas &amp; Volume</TableHead>
                  <TableHead>Destinasi &amp; Logistik</TableHead>
                  <TableHead className="text-right">Harga Tier Grosir</TableHead>
                  <TableHead className="text-right">Nilai Escrow</TableHead>
                  <TableHead className="text-right w-[140px]">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium align-top">
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs font-bold text-text-primary bg-neutral-100 px-2.5 py-0.5 rounded-md tabular-nums border border-neutral-200 block w-fit">
                          {po.poNumber}
                        </span>
                        <div>{getOrderStatusBadge(po.status)}</div>
                        <span className="text-[10px] text-text-muted block tabular-nums">
                          {formatDate(po.createdAt, "medium")}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-1 min-w-0 max-w-[200px]">
                        <p className="font-heading font-bold text-sm text-text-primary line-clamp-1" title={po.commodityName}>
                          {po.commodityName}
                        </p>
                        <p className="text-xs text-text-secondary tabular-nums">
                          <strong className="text-text-primary">{po.totalQuantity} {po.wholesaleUnit}</strong> ({po.totalWeightKg} kg)
                        </p>
                        <p className="text-[11px] text-accent font-semibold">
                          {(po.participants?.length || 0)} UMKM Anggota Tergabung
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-1 min-w-0 max-w-xs">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-primary border border-primary/20 inline-block">
                          {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat (Hub)" : "Antar Langsung"}
                        </span>
                        <p className="text-xs font-semibold text-text-primary truncate" title={po.hubName || "Alamat Direct UMKM"}>
                          {po.hubName || "Alamat Direct UMKM"}
                        </p>
                        <p className="text-[11px] text-text-muted line-clamp-1 max-w-xs" title={po.hubAddress}>
                          {po.hubAddress}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <p className="text-xs font-bold text-text-primary tabular-nums">
                        {formatCurrency(po.lockedTierPrice)}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        per {po.wholesaleUnit}
                      </p>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <p className="text-sm font-extrabold text-primary tabular-nums">
                        {formatCurrency(po.grandTotalAmount)}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Tersimpan di Escrow
                      </p>
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <Link href={`/pesanan/${po.id}`}>
                        <Button variant="primary" size="sm" className="font-semibold text-xs min-h-[40px]">
                          Buka Rincian
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet Card View (Antislop Responsive Layout) */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((po) => (
              <Card key={po.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-text-primary bg-neutral-100 px-2.5 py-0.5 rounded-md tabular-nums border border-neutral-200">
                      {po.poNumber}
                    </span>
                    {getOrderStatusBadge(po.status)}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-primary border border-primary/20">
                    {po.primaryDeliveryMethod === "HEMAT_HUB" ? "Opsi Hemat" : "Direct"}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading font-bold text-base text-text-primary leading-snug line-clamp-1" title={po.commodityName}>
                    {po.commodityName}
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-background border border-border">
                      <span className="text-[10px] text-text-muted font-semibold block">Volume Dipesan</span>
                      <p className="font-bold text-text-primary mt-0.5 tabular-nums">
                        {po.totalQuantity} {po.wholesaleUnit} ({po.totalWeightKg} kg)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border min-w-0">
                      <span className="text-[10px] text-text-muted font-semibold block">Tujuan Drop Point</span>
                      <p className="font-bold text-text-primary mt-0.5 truncate" title={po.hubName || "Direct UMKM"}>
                        {po.hubName || "Direct UMKM"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-[10px] text-text-muted font-semibold block">Total Escrow</span>
                    <p className="text-base font-extrabold text-primary tabular-nums">
                      {formatCurrency(po.grandTotalAmount)}
                    </p>
                  </div>
                  <Link href={`/pesanan/${po.id}`}>
                    <Button variant="primary" size="sm" className="font-semibold text-xs min-h-[44px]">
                      Buka Rincian &amp; Manifest
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}