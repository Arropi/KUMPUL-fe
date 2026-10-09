"use client";

import * as React from "react";
import Link from "next/link";
import {
  type UMKMPurchaseHistory,
  type WasteSaleOrder,
} from "@/constants/umkm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ShoppingBag,
  Recycle,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  Search,
  Plus,
  MapPin,
  TrendingDown,
  ArrowRight,
  Package,
  Store,
  Home,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Truck,
  CreditCard,
  FileText,
  HelpCircle,
  Users,
} from "lucide-react";
import {
  getUmkmAllOrdersAction,
  cancelProcurementOrderAction,
  confirmOrderPickupAction,
  getSellerWasteTransactionsAction,
  confirmWastePickupAction,
} from "@/actions/orders";
import {
  createPaymentSnapTokenAction,
  checkPaymentStatusAction,
  simulatePaymentAction,
} from "@/actions/payment";

type MainTab = "pembelian" | "limbah";

type PurchaseStatusFilter =
  | "SEMUA"
  | "PENDING"
  | "WAITING_PAYMENT"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

type SaleFilter = "SEMUA" | "MENUNGGU_DIAMBIL" | "SELESAI";

// ─── Style Variants ──────────────────────────────────────────────────────────

const deliveryVariant: Record<string, string> = {
  HEMAT_HUB: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  ON_YOUR_DOOR: "bg-blue-50 text-blue-800 border-blue-200/80",
  DIRECT_DOOR_TO_DOOR: "bg-blue-50 text-blue-800 border-blue-200/80",
  DIRECT_DELIVERY: "bg-amber-50 text-amber-800 border-amber-200/80",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pool Terbuka (Pending)",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Users,
      };
    case "WAITING_PAYMENT":
      return {
        label: "Menunggu Pembayaran",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        icon: CreditCard,
      };
    case "PROCESSING":
    case "DIPROSES_SUPPLIER":
    case "TERKUNCI":
      return {
        label: "Diproses Supplier",
        className: "bg-purple-50 text-purple-800 border-purple-200",
        icon: Clock,
      };
    case "READY_FOR_PICKUP":
    case "TIBA_DI_HUB":
      return {
        label: "Siap Diambil di Hub",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: CheckCircle2,
      };
    case "COMPLETED":
    case "SELESAI":
      return {
        label: "Selesai Diterima",
        className: "bg-surface-subtle text-text-secondary border-border",
        icon: CheckCircle2,
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        className: "bg-surface-subtle text-text-secondary border-border",
        icon: Clock,
      };
  }
}

// ─── Sub-filter DeptTab ──────────────────────────────────────────────────────

function DeptTab({
  label,
  isActive,
  count,
  onClick,
}: {
  label: string;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 outline-none cursor-pointer select-none",
        isActive
          ? "bg-primary text-white shadow-xs"
          : "bg-surface-subtle text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent hover:border-border"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
          isActive ? "bg-white/20 text-white" : "bg-border text-text-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Purchase Order Row ──────────────────────────────────────────────────────

function PurchaseOrderRow({
  order,
  onOpenDetail,
  onCancelOrder,
}: {
  order: UMKMPurchaseHistory;
  onOpenDetail: (order: UMKMPurchaseHistory) => void;
  onCancelOrder: (order: UMKMPurchaseHistory) => void;
}) {
  const isDirect = order.orderType === "DIRECT_OVER_MOQ" || order.deliveryMethod === "ON_YOUR_DOOR";
  const isCircular = order.orderType === "CIRCULAR_WASTE";
  const isCancelled = order.status === "CANCELLED";
  const isPending = order.status === "PENDING";
  const statusInfo = getStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <li className="border-b border-border/70 last:border-b-0">
      <div className="group relative flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5 transition-colors duration-150 -mx-4 sm:-mx-6 px-4 sm:px-6 hover:bg-surface-subtle/50">
        {/* Left Side: Order Information, Title & Financials */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Line 1: Order number, date, case badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-xs font-bold text-text-primary">
              {order.orderNumber}
            </span>
            <span className="text-text-muted text-[11px]">&bull; {order.orderDate}</span>

            {isDirect ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 px-2 py-0.5 text-[10px] font-bold">
                Direct Grosir &ge; MOQ
              </span>
            ) : isCircular ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-circular-waste-light text-circular-waste border border-circular-waste/20 px-2 py-0.5 text-[10px] font-bold">
                Residu Sirkular P2P
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                <Sparkles className="size-2.5" />
                Pooling &lt; MOQ
              </span>
            )}
          </div>

          {/* Line 2: Commodity title + volume */}
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors">
              {order.commodityName}
            </h3>
            <span className="text-xs text-text-muted tabular-nums">
              ({order.volumeKg} {order.unit || "kg"})
            </span>
          </div>

          {/* Line 3: Financial summary & Location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>
              Total:{" "}
              <strong className="text-primary font-bold tabular-nums">
                {formatCurrency(order.totalWholesalePaid || 0)}
              </strong>
            </span>
            {order.savingsAmount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full tabular-nums">
                <TrendingDown className="size-3 text-emerald-600" />
                Hemat {formatCurrency(order.savingsAmount)}
              </span>
            )}
            <span className="text-text-muted text-[11px] truncate max-w-xs">
              &bull; {order.deliveryLocation || "Titik Hub Belum Ditentukan"}
            </span>
          </div>
        </div>

        {/* Right Side: Badges & Action Trigger */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:shrink-0">
          {/* Pill 1: Delivery method */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              deliveryVariant[order.deliveryMethod] || "bg-surface-subtle text-text-secondary border-border"
            )}
          >
            {order.deliveryMethod === "HEMAT_HUB" ? (
              <>
                <Store className="size-3" />
                Hemat Hub
              </>
            ) : order.deliveryMethod === "ON_YOUR_DOOR" || order.deliveryMethod === "DIRECT_DOOR_TO_DOOR" ? (
              <>
                <Home className="size-3" />
                Direct to Door
              </>
            ) : (
              <>
                <MapPin className="size-3" />
                Pick-Up Mandiri
              </>
            )}
          </span>

          {/* Pill 2: Status */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              statusInfo.className
            )}
          >
            <StatusIcon className="size-3" />
            {statusInfo.label}
          </span>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 ml-auto sm:ml-2">
            {isCancelled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="text-xs h-8 px-3 opacity-60 cursor-not-allowed"
              >
                Dibatalkan
              </Button>
            ) : (
              <>
                {isPending && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelOrder(order)}
                    className="text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    Batal
                  </Button>
                )}

                <Button
                  type="button"
                  variant={order.status === "READY_FOR_PICKUP" || order.status === "WAITING_PAYMENT" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => onOpenDetail(order)}
                  className="font-bold text-xs h-8 px-3 gap-1 shrink-0 cursor-pointer"
                >
                  {order.status === "READY_FOR_PICKUP"
                    ? "Tiket & PIN"
                    : order.status === "WAITING_PAYMENT"
                    ? "Bayar Sekarang"
                    : order.status === "COMPLETED"
                    ? "Nota Resmi"
                    : "Detail"}
                  <ArrowRight className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Waste Sale Row ──────────────────────────────────────────────────────────

function WasteSaleRow({
  order,
  onOpenHandover,
}: {
  order: WasteSaleOrder;
  onOpenHandover: (order: WasteSaleOrder) => void;
}) {
  const isWaiting = order.status === "MENUNGGU_DIAMBIL";

  return (
    <li className="border-b border-border/70 last:border-b-0">
      <div className="group relative flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5 transition-colors duration-150 -mx-4 sm:-mx-6 px-4 sm:px-6 hover:bg-surface-subtle/50">
        {order.listingImageUrl ? (
          <img
            src={order.listingImageUrl}
            alt={order.listingTitle}
            className="size-12 sm:size-14 rounded-xl object-cover shrink-0 border border-border shadow-2xs"
          />
        ) : (
          <div className="size-12 sm:size-14 rounded-xl bg-circular-waste-light border border-circular-waste/20 flex items-center justify-center shrink-0 text-circular-waste">
            <Recycle className="size-5" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-xs font-bold text-text-primary">
              {order.orderNumber}
            </span>
            <span className="text-text-muted text-[11px]">&bull; {order.orderDate}</span>
            <span className="inline-flex items-center rounded-full bg-surface-subtle border border-border px-2 py-0.5 text-xs font-semibold">
              {order.listingCategory || "Residu Dapur"}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary group-hover:text-circular-waste transition-colors">
              {order.listingTitle}
            </h3>
            <span className="text-xs text-text-muted tabular-nums">
              ({order.orderedVolume} {order.orderedUnit})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>
              Nilai:{" "}
              <strong className="text-circular-waste font-bold tabular-nums">
                {formatCurrency(order.totalPrice)}
              </strong>
            </span>
            <span className="text-text-muted text-[11px]">
              &bull; Pembeli: <strong className="text-text-primary">{order.buyerName}</strong> ({order.buyerType})
            </span>
            <span className="text-text-muted text-[11px] flex items-center gap-1">
              <Calendar className="size-3 text-accent" />
              {order.pickupScheduledDate}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
            <MapPin className="size-3" />
            Pick-Up Dapur
          </span>

          {isWaiting ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/70 text-amber-900 px-2.5 py-0.5 text-xs font-bold">
              <Clock className="size-3 text-amber-700" />
              Menunggu Diambil
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
              <CheckCircle2 className="size-3 text-emerald-600" />
              Selesai &bull; Saldo Cair
            </span>
          )}

          {isWaiting ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => onOpenHandover(order)}
              className="font-bold cursor-pointer text-xs h-8 px-3 gap-1 shrink-0 ml-auto sm:ml-2"
            >
              Verifikasi Ambil
              <ArrowRight className="size-3" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenHandover(order)}
              className="ml-auto flex size-8 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted transition-colors duration-200 group-hover:bg-circular-waste group-hover:text-white sm:ml-2 shrink-0 cursor-pointer"
              title="Lihat Rincian Penjualan"
            >
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Main View Component ─────────────────────────────────────────────────────

export function UmkmPesananView() {
  const [activeTab, setActiveTab] = React.useState<MainTab>("pembelian");

  // State: Tab 1 (Pembelian Bahan Baku)
  const [purchases, setPurchases] = React.useState<UMKMPurchaseHistory[]>([]);
  const [loadingPurchases, setLoadingPurchases] = React.useState(true);
  const [purchaseFilter, setPurchaseFilter] = React.useState<PurchaseStatusFilter>("SEMUA");
  const [purchaseSearch, setPurchaseSearch] = React.useState("");

  // State: Tab 2 (Penjualan Limbah)
  const [sales, setSales] = React.useState<WasteSaleOrder[]>([]);
  const [loadingSales, setLoadingSales] = React.useState(true);
  const [saleFilter, setSaleFilter] = React.useState<SaleFilter>("SEMUA");
  const [saleSearch, setSaleSearch] = React.useState("");

  // Modals & Active Selections
  const [selectedOrder, setSelectedOrder] = React.useState<UMKMPurchaseHistory | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [pickupPinInput, setPickupPinInput] = React.useState("");
  const [isConfirmingPickup, setIsConfirmingPickup] = React.useState(false);

  // Refund / Help modal
  const [refundModalOpen, setRefundModalOpen] = React.useState(false);
  const [refundReason, setRefundReason] = React.useState("");

  // Waste handover modal
  const [selectedSale, setSelectedSale] = React.useState<WasteSaleOrder | null>(null);
  const [wasteHandoverModalOpen, setWasteHandoverModalOpen] = React.useState(false);
  const [wastePinInput, setWastePinInput] = React.useState("");
  const [isConfirmingWaste, setIsConfirmingWaste] = React.useState(false);

  // Load Data
  const loadPurchases = React.useCallback(async () => {
    setLoadingPurchases(true);
    try {
      const res = await getUmkmAllOrdersAction();
      if (res.success && res.data) {
        setPurchases(res.data);
      } else {
        setPurchases([]);
      }
    } catch {
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  }, []);

  const loadSales = React.useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = await getSellerWasteTransactionsAction();
      if (res.success && res.data) {
        setSales(res.data);
      } else {
        setSales([]);
      }
    } catch {
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  React.useEffect(() => {
    loadPurchases();
    loadSales();
  }, [loadPurchases, loadSales]);

  // Derived filters
  const filteredPurchases = React.useMemo(() => {
    return purchases.filter((o) => {
      const q = purchaseSearch.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.commodityName.toLowerCase().includes(q) ||
        (o.deliveryLocation?.toLowerCase().includes(q) ?? false);

      if (!matchSearch) return false;
      if (purchaseFilter === "SEMUA") return true;
      return o.status === purchaseFilter;
    });
  }, [purchases, purchaseFilter, purchaseSearch]);

  const pendingCount = purchases.filter((o) => o.status === "PENDING").length;
  const waitingPayCount = purchases.filter((o) => o.status === "WAITING_PAYMENT").length;
  const processingCount = purchases.filter((o) => o.status === "PROCESSING" || o.status === "DIPROSES_SUPPLIER").length;
  const readyPickupCount = purchases.filter((o) => o.status === "READY_FOR_PICKUP" || o.status === "TIBA_DI_HUB").length;
  const completedCount = purchases.filter((o) => o.status === "COMPLETED" || o.status === "SELESAI").length;
  const cancelledCount = purchases.filter((o) => o.status === "CANCELLED").length;

  const filteredSales = React.useMemo(() => {
    return sales.filter((o) => {
      const q = saleSearch.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.listingTitle.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (saleFilter === "SEMUA") return true;
      return o.status === saleFilter;
    });
  }, [sales, saleFilter, saleSearch]);

  const waitingPickupSalesCount = sales.filter((o) => o.status === "MENUNGGU_DIAMBIL").length;
  const completedSalesCount = sales.filter((o) => o.status === "SELESAI").length;

  // Handlers
  const handleOpenDetail = (order: UMKMPurchaseHistory) => {
    setSelectedOrder(order);
    setPickupPinInput("");
    setDetailModalOpen(true);
  };

  const handleCancelOrder = async (order: UMKMPurchaseHistory) => {
    if (!confirm(`Batalkan keikutsertaan Anda pada pesanan ${order.orderNumber}?`)) {
      return;
    }

    const res = await cancelProcurementOrderAction(order.id);
    if (res.success) {
      toast.success("Pesanan berhasil dibatalkan", "Pembatalan Berhasil");
      loadPurchases();
      setDetailModalOpen(false);
    } else {
      toast.error(res.message || "Gagal membatalkan pesanan", "Pembatalan Gagal");
    }
  };

  const handleConfirmPickup = async () => {
    if (!selectedOrder) return;
    if (!pickupPinInput.trim()) {
      toast.error("Silakan masukkan kode serah-terima fisik", "Validasi");
      return;
    }

    setIsConfirmingPickup(true);
    try {
      const res = await confirmOrderPickupAction(selectedOrder.id, pickupPinInput.trim());
      if (res.success) {
        toast.success(
          `Pengambilan ${selectedOrder.commodityName} terkonfirmasi selesai!`,
          "Serah-Terima Berhasil"
        );
        setDetailModalOpen(false);
        loadPurchases();
      } else {
        toast.error(res.message || "Kode PIN serah-terima tidak cocok", "Verifikasi Gagal");
      }
    } finally {
      setIsConfirmingPickup(false);
    }
  };

  const handleWasteHandover = async () => {
    if (!selectedSale) return;
    if (!wastePinInput.trim()) {
      toast.error("Silakan masukkan kode pickup dari pembeli", "Validasi");
      return;
    }

    setIsConfirmingWaste(true);
    try {
      const res = await confirmWastePickupAction(selectedSale.id, wastePinInput.trim());
      if (res.success) {
        toast.success(
          `Serah-terima residu tuntas! Dana ${formatCurrency(selectedSale.totalPrice)} otomatis dicairkan ke saldo kas.`,
          "Penjualan Selesai"
        );
        setWasteHandoverModalOpen(false);
        loadSales();
      } else {
        toast.error(res.message || "Kode pickup pembeli tidak cocok", "Verifikasi Gagal");
      }
    } finally {
      setIsConfirmingWaste(false);
    }
  };

  const handlePayNow = async (order: UMKMPurchaseHistory) => {
    let token = order.snapToken;
    let redirectUrl = order.snapRedirectUrl;

    if (!token && !redirectUrl) {
      toast.info("Menyiapkan sesi pembayaran Midtrans...", "Mohon Tunggu");
      const payRes = await createPaymentSnapTokenAction(
        order.id,
        order.deliveryMethod as any
      );
      if (payRes.success && payRes.snapToken) {
        token = payRes.snapToken;
        redirectUrl = payRes.snapRedirectUrl;
      } else {
        toast.error(
          payRes.message || "Gagal memuat gateway pembayaran Midtrans",
          "Kendala"
        );
        return;
      }
    }

    if (typeof window !== "undefined" && (window as any).snap && token) {
      (window as any).snap.pay(token, {
        onSuccess: async () => {
          toast.success("Pembayaran berhasil diverifikasi!", "Sukses");
          await checkPaymentStatusAction(order.id);
          await loadPurchases();
          setDetailModalOpen(false);
        },
        onPending: () => {
          toast.info("Pembayaran sedang diproses Midtrans", "Menunggu");
          loadPurchases();
        },
        onError: () => {
          toast.error("Pembayaran dibatalkan atau gagal", "Gagal");
          loadPurchases();
        },
        onClose: () => {
          toast.info(
            "Anda dapat melanjutkan pembayaran kapan saja sebelum batas waktu berakhir",
            "Tagihan Tersimpan"
          );
          loadPurchases();
        },
      });
      return;
    }

    if (redirectUrl) {
      window.open(redirectUrl, "_blank");
      return;
    }

    toast.info("Mengarahkan ke gateway pembayaran Midtrans...", "Pembayaran");
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="pb-3 border-b border-border/80">
        <span className="font-heading text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          Pusat Transaksi UMKM
        </span>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mt-1 text-balance">
          Pesanan &amp; Transaksi Saya
        </h1>
        <p className="font-sans text-xs sm:text-sm text-text-secondary mt-1 text-pretty max-w-xl">
          Pantau pengadaan bahan baku grosir (Pooling, Direct MOQ, &amp; Sirkular) serta serah-terima penjualan residu dapur Anda.
        </p>
      </div>

      {/* ── Main Tab Switcher ── */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-2xl border border-border/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("pembelian")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none",
            activeTab === "pembelian"
              ? "bg-surface text-primary shadow-xs border border-border/70"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
          )}
        >
          <ShoppingBag className="size-4" />
          <span>Beli Bahan Baku</span>
          <span className="text-[10px] py-0.5 px-2 rounded-full bg-primary/10 text-primary font-bold tabular-nums">
            {purchases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("limbah")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none",
            activeTab === "limbah"
              ? "bg-surface text-circular-waste shadow-xs border border-border/70"
              : "text-text-secondary hover:text-text-primary hover:bg-surface/60"
          )}
        >
          <Recycle className="size-4" />
          <span>Penjualan Limbah</span>
          <span className="text-[10px] py-0.5 px-2 rounded-full bg-circular-waste/15 text-circular-waste font-bold tabular-nums">
            {sales.length}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: BELI BAHAN BAKU                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === "pembelian" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary">
                Daftar Pesanan Bahan Baku Masuk
              </h2>
              <p className="font-sans text-xs text-text-secondary mt-0.5 text-pretty">
                Transisi otomatis 6 status: Pending &rarr; Menunggu Bayar &rarr; Diproses &rarr; Siap Diambil &rarr; Selesai.
              </p>
            </div>
            <Link href="/katalog" className="shrink-0">
              <Button variant="primary" size="default" className="font-bold min-h-[40px] gap-1.5 shadow-xs">
                <Plus className="size-4" />
                <span>+ Pesan Bahan Baku</span>
              </Button>
            </Link>
          </div>

          {/* Sub-filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <DeptTab
                label="Semua"
                isActive={purchaseFilter === "SEMUA"}
                count={purchases.length}
                onClick={() => setPurchaseFilter("SEMUA")}
              />
              <DeptTab
                label="Pending (Pool)"
                isActive={purchaseFilter === "PENDING"}
                count={pendingCount}
                onClick={() => setPurchaseFilter("PENDING")}
              />
              <DeptTab
                label="Menunggu Bayar"
                isActive={purchaseFilter === "WAITING_PAYMENT"}
                count={waitingPayCount}
                onClick={() => setPurchaseFilter("WAITING_PAYMENT")}
              />
              <DeptTab
                label="Diproses Supplier"
                isActive={purchaseFilter === "PROCESSING"}
                count={processingCount}
                onClick={() => setPurchaseFilter("PROCESSING")}
              />
              <DeptTab
                label="Siap Diambil di Hub"
                isActive={purchaseFilter === "READY_FOR_PICKUP"}
                count={readyPickupCount}
                onClick={() => setPurchaseFilter("READY_FOR_PICKUP")}
              />
              <DeptTab
                label="Selesai"
                isActive={purchaseFilter === "COMPLETED"}
                count={completedCount}
                onClick={() => setPurchaseFilter("COMPLETED")}
              />
              <DeptTab
                label="Batal"
                isActive={purchaseFilter === "CANCELLED"}
                count={cancelledCount}
                onClick={() => setPurchaseFilter("CANCELLED")}
              />
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                placeholder="Cari pesanan atau komoditas..."
                className="w-full h-9 pl-9 text-xs rounded-xl bg-surface"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-border bg-surface shadow-elevation-1 px-4 sm:px-6">
            {loadingPurchases ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted">
                  <ShoppingBag className="size-5" />
                </span>
                <p className="font-heading text-sm font-bold text-text-primary">
                  Memuat daftar pesanan...
                </p>
              </div>
            ) : filteredPurchases.length > 0 ? (
              <ul role="list">
                {filteredPurchases.map((order) => (
                  <PurchaseOrderRow
                    key={order.id}
                    order={order}
                    onOpenDetail={handleOpenDetail}
                    onCancelOrder={handleCancelOrder}
                  />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted">
                  <ShoppingBag className="size-5" />
                </span>
                <p className="font-heading text-sm font-bold text-text-primary">
                  Tidak ada pesanan pada filter ini
                </p>
                <p className="max-w-xs text-xs text-text-muted">
                  Jelajahi katalog pasokan grosir hulu atau radar pooling aktif untuk memesan bahan baku.
                </p>
                <Button asChild variant="primary" size="sm" className="font-bold mt-1">
                  <Link href="/katalog">Jelajahi Radar Pooling</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PENJUALAN LIMBAH                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === "limbah" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary flex items-center gap-2">
                <Recycle className="size-5 text-circular-waste" />
                <span>Pesanan Penjualan Residu Dapur</span>
              </h2>
              <p className="font-sans text-xs text-text-secondary mt-0.5 text-pretty">
                Pembeli datang mengambil mandiri ke dapur Anda. Saldo kas cair seketika begitu serah-terima terverifikasi.
              </p>
            </div>
            <Link href="/limbah" className="shrink-0">
              <Button variant="primary" size="default" className="font-bold min-h-[40px] gap-1.5 shadow-xs">
                <Plus className="size-4" />
                <span>+ Pasang Listing Baru</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <DeptTab
                label="Semua Penjualan"
                isActive={saleFilter === "SEMUA"}
                count={sales.length}
                onClick={() => setSaleFilter("SEMUA")}
              />
              <DeptTab
                label="Menunggu Diambil"
                isActive={saleFilter === "MENUNGGU_DIAMBIL"}
                count={waitingPickupSalesCount}
                onClick={() => setSaleFilter("MENUNGGU_DIAMBIL")}
              />
              <DeptTab
                label="Selesai & Saldo Cair"
                isActive={saleFilter === "SELESAI"}
                count={completedSalesCount}
                onClick={() => setSaleFilter("SELESAI")}
              />
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="size-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                placeholder="Cari pembeli atau limbah..."
                className="w-full h-9 pl-9 text-xs rounded-xl bg-surface"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface shadow-elevation-1 px-4 sm:px-6">
            {loadingSales ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted">
                  <Recycle className="size-5" />
                </span>
                <p className="font-heading text-sm font-bold text-text-primary">
                  Memuat daftar penjualan limbah...
                </p>
              </div>
            ) : filteredSales.length > 0 ? (
              <ul role="list">
                {filteredSales.map((order) => (
                  <WasteSaleRow
                    key={order.id}
                    order={order}
                    onOpenHandover={(o) => {
                      setSelectedSale(o);
                      setWastePinInput("");
                      setWasteHandoverModalOpen(true);
                    }}
                  />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted">
                  <Recycle className="size-5" />
                </span>
                <p className="font-heading text-sm font-bold text-text-primary">
                  Tidak ada transaksi penjualan pada filter ini
                </p>
                <p className="max-w-xs text-xs text-text-muted">
                  Tayangkan residu sisa olahan dapur Anda ke bursa sirkular untuk dibeli offtaker terverifikasi.
                </p>
                <Button asChild variant="primary" size="sm" className="font-bold mt-1">
                  <Link href="/limbah">Kelola Listing Limbah</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL DETAIL DINAMIS BERDASARKAN 6 STATUS (PRD HALAMAN 7)       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 text-left">
          {selectedOrder && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      getStatusBadge(selectedOrder.status).className
                    )}
                  >
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <DialogTitle className="font-heading text-lg font-bold text-text-primary mt-1">
                  {selectedOrder.commodityName}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted">
                  {selectedOrder.volumeKg} {selectedOrder.unit} &bull; Total:{" "}
                  <strong className="text-primary font-bold">
                    {formatCurrency(selectedOrder.totalWholesalePaid || 0)}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 1: STATUS PENDING (POOL)            */}
              {/* ────────────────────────────────────────── */}
              {selectedOrder.status === "PENDING" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                      <span>Progres Kuota Menuju MOQ Pabrik:</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round(
                            ((selectedOrder.accumulatedQty || selectedOrder.volumeKg) /
                              Math.max(1, selectedOrder.targetMoq || selectedOrder.volumeKg)) *
                              100
                          )
                        )}
                        %
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200/70 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((selectedOrder.accumulatedQty || selectedOrder.volumeKg) /
                                Math.max(1, selectedOrder.targetMoq || selectedOrder.volumeKg)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-blue-800">
                      <span>Terkumpul: {selectedOrder.accumulatedQty || selectedOrder.volumeKg} {selectedOrder.unit}</span>
                      <span>Target MOQ: {selectedOrder.targetMoq || 0} {selectedOrder.unit}</span>
                    </div>
                  </div>

                  {/* Cutoff Date Info */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-subtle border border-border text-xs text-text-secondary">
                    <Clock className="size-4 text-accent shrink-0" />
                    <span>
                      Batas waktu cut-off pemenuhan pool:{" "}
                      <strong className="text-text-primary">
                        {selectedOrder.cutoffDate || "Segera Terkunci"}
                      </strong>
                    </span>
                  </div>

                  {/* Daftar Peserta Pool */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      Peserta Pooling Sekitar:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border/80 rounded-xl p-2 bg-surface">
                      {selectedOrder.poolParticipants && selectedOrder.poolParticipants.length > 0 ? (
                        selectedOrder.poolParticipants.map((part, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-surface-subtle"
                          >
                            <span className="font-medium text-text-primary truncate">
                              {part.name} ({part.city})
                            </span>
                            <span className="text-text-muted font-bold tabular-nums">
                              {part.qty} {selectedOrder.unit}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted text-center py-2">
                          Anda adalah pemesan pertama di kamar pooling ini.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tombol Batalkan Pesanan Aktif */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleCancelOrder(selectedOrder)}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                    >
                      Batalkan Pesanan Ini
                    </Button>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 2: STATUS WAITING_PAYMENT          */}
              {/* ────────────────────────────────────────── */}
              {selectedOrder.status === "WAITING_PAYMENT" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <Clock className="size-4 text-amber-700" />
                      <span>Batas Waktu Pembayaran: 12 Jam</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Pool kuota telah terkunci! Silakan selesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak kedaluwarsa.
                    </p>
                  </div>

                  {/* Rincian Total Tagihan */}
                  <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Subtotal Bahan Baku:</span>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(selectedOrder.rawMaterialSubtotal || selectedOrder.totalWholesalePaid || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Ongkos Kirim ({selectedOrder.deliveryMethod}):</span>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(selectedOrder.shippingFee || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/80 pt-2 text-sm font-bold">
                      <span className="text-text-primary">Total Tagihan:</span>
                      <span className="text-primary tabular-nums">
                        {formatCurrency(selectedOrder.totalWholesalePaid || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      variant="primary"
                      size="default"
                      onClick={() => handlePayNow(selectedOrder)}
                      className="w-full font-bold min-h-[44px] gap-2 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="size-4" />
                      <span>Bayar Sekarang (Midtrans Snap)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={async () => {
                        toast.info("Memproses simulasi pembayaran Sandbox...", "Simulasi");
                        const simRes = await simulatePaymentAction(selectedOrder.id);
                        if (simRes.success) {
                          toast.success("Simulasi pembayaran berhasil! Pesanan masuk antrean proses.", "Berhasil");
                          await loadPurchases();
                          setDetailModalOpen(false);
                        } else {
                          toast.error(simRes.message || "Gagal memproses simulasi", "Kendala");
                        }
                      }}
                      className="w-full font-semibold min-h-[42px] gap-2 border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 cursor-pointer text-xs"
                    >
                      <span>⚡ Simulasi Pembayaran Berhasil (Sandbox Testing)</span>
                    </Button>

                    <p className="text-[11px] text-text-muted text-center pt-1 leading-relaxed">
                      Mode Sandbox: Untuk bayar simulasi di Snap tanpa saldo riil, pilih <strong>Bank Transfer &gt; BCA Virtual Account</strong> lalu salin nomor VA ke{" "}
                      <a
                        href="https://simulator.sandbox.midtrans.com/bca/va/index"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline font-medium"
                      >
                        Simulator Midtrans
                      </a>
                      , atau klik tombol simulasi di atas.
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 3: STATUS DIPROSES SUPPLIER         */}
              {/* ────────────────────────────────────────── */}
              {(selectedOrder.status === "PROCESSING" ||
                selectedOrder.status === "DIPROSES_SUPPLIER" ||
                selectedOrder.status === "TERKUNCI") && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 text-center">
                    <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-700">
                      <Truck className="size-6 animate-pulse" />
                    </div>
                    <h4 className="font-heading font-bold text-sm text-purple-950">
                      Pesanan Sedang Disiapkan Supplier
                    </h4>
                    <p className="text-xs text-purple-800 leading-relaxed">
                      {selectedOrder.orderType === "DIRECT_OVER_MOQ"
                        ? `Pesanan dikirim langsung ke alamat dapur Anda. Estimasi jadwal kirim: ${selectedOrder.targetDeliveryDate || "1-2 hari kerja"}.`
                        : `Supplier sedang menyiapkan stok komoditas. Estimasi tiba di hub konsolidasi dalam ${selectedOrder.leadTimeDays || 1} hari kerja.`}
                    </p>
                  </div>

                  {selectedOrder.supplierContact && (
                    <div className="p-3 rounded-xl bg-surface border border-border text-xs space-y-1">
                      <span className="text-text-muted">Kontak Supplier Hulu:</span>
                      <p className="font-bold text-text-primary">{selectedOrder.supplierContact.name}</p>
                      {selectedOrder.supplierContact.phone && (
                        <p className="text-text-secondary flex items-center gap-1">
                          <Phone className="size-3" /> {selectedOrder.supplierContact.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 4: STATUS READY_FOR_PICKUP (HUB)    */}
              {/* ────────────────────────────────────────── */}
              {(selectedOrder.status === "READY_FOR_PICKUP" ||
                selectedOrder.status === "TIBA_DI_HUB") && (
                <div className="space-y-4">
                  {/* Kode Verifikasi / PIN Box */}
                  <div className="p-5 rounded-2xl bg-surface-subtle border-2 border-dashed border-primary/50 text-center space-y-2">
                    <span className="text-xs font-semibold text-text-muted">
                      Kode Verifikasi Serah-Terima Fisik Barang:
                    </span>
                    <p className="font-mono text-3xl font-black text-primary tracking-widest tabular-nums">
                      {selectedOrder.pickupCode || selectedOrder.hubPickupCode || "KMPL-889"}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Tunjukkan kode ini kepada Host Hub saat mengambil muatan.
                    </p>
                  </div>

                  {/* Kontak Host Hub */}
                  <div className="p-3.5 rounded-xl bg-surface border border-border text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-text-primary">
                      <Store className="size-4 text-emerald-700" />
                      <span>Titik Pengambilan Host Hub:</span>
                    </div>
                    <p className="font-semibold text-text-primary">
                      {selectedOrder.hostContact?.name || selectedOrder.deliveryLocation || "Hub Konsolidasi Sentra"}
                    </p>
                    {selectedOrder.hostContact?.address && (
                      <p className="text-text-muted text-[11px]">{selectedOrder.hostContact.address}</p>
                    )}
                    {selectedOrder.hostContact?.phone && (
                      <p className="text-text-secondary flex items-center gap-1 pt-0.5">
                        <Phone className="size-3 text-primary" /> {selectedOrder.hostContact.phone}
                      </p>
                    )}
                  </div>

                  {/* Form Konfirmasi Serah-Terima */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                    <label className="text-xs font-bold text-emerald-950 block">
                      Konfirmasi Terima Barang (Input Kode PIN):
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={pickupPinInput}
                        onChange={(e) => setPickupPinInput(e.target.value)}
                        placeholder="Masukkan kode PIN..."
                        className="h-9 text-xs uppercase font-mono tracking-wider bg-white"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleConfirmPickup}
                        disabled={isConfirmingPickup}
                        className="font-bold text-xs shrink-0 cursor-pointer"
                      >
                        {isConfirmingPickup ? "Memverifikasi..." : "Konfirmasi Selesai"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 5: STATUS COMPLETED (NOTA RESMI)    */}
              {/* ────────────────────────────────────────── */}
              {(selectedOrder.status === "COMPLETED" || selectedOrder.status === "SELESAI") && (
                <div className="space-y-4">
                  {/* Format Nota Pesanan Resmi */}
                  <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border/80 pb-2">
                      <div>
                        <span className="font-heading font-black text-sm text-text-primary">NOTA KUMPUL</span>
                        <p className="text-[10px] text-text-muted">Bukti Transaksi Resmi Platform</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-text-secondary">
                        {selectedOrder.poNumber || selectedOrder.orderNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-text-muted">Tanggal Selesai:</span>
                        <p className="font-medium text-text-primary">{selectedOrder.orderDate}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Metode Logistik:</span>
                        <p className="font-medium text-text-primary">{selectedOrder.deliveryMethod}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Komoditas:</span>
                        <p className="font-medium text-text-primary">{selectedOrder.commodityName}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Volume Diterima:</span>
                        <p className="font-medium text-text-primary">{selectedOrder.volumeKg} {selectedOrder.unit}</p>
                      </div>
                    </div>

                    <div className="border-t border-border/80 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Bahan Baku:</span>
                        <span>{formatCurrency(selectedOrder.rawMaterialSubtotal || selectedOrder.totalWholesalePaid || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Ongkos Kirim:</span>
                        <span>{formatCurrency(selectedOrder.shippingFee || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-text-primary pt-1 border-t border-border/60">
                        <span>Total Telah Dibayar:</span>
                        <span className="text-primary">{formatCurrency(selectedOrder.totalWholesalePaid || 0)}</span>
                      </div>
                    </div>

                    <div className="pt-1 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="size-3 text-emerald-600" /> LUNAS &amp; DITERIMA TUNTAS
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundModalOpen(true)}
                    className="w-full text-xs font-bold gap-1.5 text-text-secondary hover:text-text-primary"
                  >
                    <HelpCircle className="size-3.5" />
                    <span>Ajukan Refund atau Bantuan Layanan</span>
                  </Button>
                </div>
              )}

              {/* ────────────────────────────────────────── */}
              {/* KONDISI 6: STATUS CANCELLED                */}
              {/* ────────────────────────────────────────── */}
              {selectedOrder.status === "CANCELLED" && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="size-4 text-red-600" />
                    <span>Pesanan Dibatalkan</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Pesanan ini telah dibatalkan sebelum proses penyiapan supplier dimulai. Dana Anda telah dialihkan kembali sesuai kebijakan refund KUMPUL.
                  </p>
                </div>
              )}

              <Button
                variant="secondary"
                size="default"
                onClick={() => setDetailModalOpen(false)}
                className="w-full font-semibold min-h-[40px] cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Bantuan / Ajukan Refund ── */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Pengajuan Refund &amp; Bantuan
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Jika pesanan tidak sesuai spesifikasi atau terdapat kendala mutu, sampaikan alasan Anda kepada tim penjamin mutu KUMPUL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <textarea
              rows={4}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Jelaskan alasan pengajuan refund atau keluhan Anda..."
              className="w-full p-3 rounded-xl border border-border text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRefundModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success(
                    "Pengajuan refund telah dicatat dan akan ditinjau dalam 1x24 jam oleh tim KUMPUL.",
                    "Pengajuan Dikirim"
                  );
                  setRefundModalOpen(false);
                  setRefundReason("");
                }}
              >
                Kirim Pengajuan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Verifikasi Serah-Terima Limbah ── */}
      <Dialog open={wasteHandoverModalOpen} onOpenChange={setWasteHandoverModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          {selectedSale && (
            <div className="space-y-4">
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2">
                  <Recycle className="size-5 text-circular-waste" />
                  <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                    Verifikasi Serah-Terima Residu
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Masukkan kode pickup yang dibawa oleh pembeli untuk menyelesaikan serah-terima fisik dan mencairkan dana.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-text-primary">{selectedSale.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Residu:</span>
                  <span className="font-bold text-text-primary">{selectedSale.listingTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Volume:</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    {selectedSale.orderedVolume} {selectedSale.orderedUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Nilai Kas:</span>
                  <strong className="text-circular-waste font-bold text-sm tabular-nums">
                    {formatCurrency(selectedSale.totalPrice)}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-text-muted">Pembeli:</span>
                  <span className="font-bold text-text-primary">{selectedSale.buyerName}</span>
                </div>
                {selectedSale.buyerPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Kontak Pembeli:</span>
                    <a
                      href={`tel:${selectedSale.buyerPhone}`}
                      className="text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="size-3" />
                      {selectedSale.buyerPhone}
                    </a>
                  </div>
                )}
              </div>

              {selectedSale.status === "MENUNGGU_DIAMBIL" && (
                <div className="p-3.5 rounded-xl bg-circular-waste-light border border-circular-waste/30 space-y-2">
                  <label className="text-xs font-bold text-circular-waste block">
                    Kode Pickup Pembeli:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={wastePinInput}
                      onChange={(e) => setWastePinInput(e.target.value)}
                      placeholder="Contoh: WST-A1B2"
                      className="h-9 text-xs uppercase font-mono tracking-wider bg-white"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleWasteHandover}
                      disabled={isConfirmingWaste}
                      className="font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {isConfirmingWaste ? "Memproses..." : "Cairkan Saldo"}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                size="default"
                onClick={() => setWasteHandoverModalOpen(false)}
                className="w-full font-semibold min-h-[40px] cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}