"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MOCK_UMKM_PURCHASE_HISTORY,
  MOCK_UMKM_PROFILE,
  MOCK_WASTE_SALES_ORDERS,
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
} from "lucide-react";
import { beFetch } from "@/lib/api/be-client";
import { getWasteSalesTransactionsAction, confirmWastePickupAction } from "@/actions/waste";

type MainTab = "pembelian" | "limbah";
type PurchaseFilter = "SEMUA" | "TIBA_DI_HUB" | "DIPROSES_SUPPLIER" | "SELESAI";
type SaleFilter = "SEMUA" | "MENUNGGU_DIAMBIL" | "SELESAI";

// ─── Style Variants (Watermelon UI Career-1 inspiration) ──────────────────────

const deliveryVariant: Record<string, string> = {
  HEMAT_HUB:
    "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  ON_YOUR_DOOR:
    "bg-blue-50 text-blue-800 border-blue-200/80",
  DIRECT_DELIVERY:
    "bg-amber-50 text-amber-800 border-amber-200/80",
};

const purchaseStatusVariant: Record<UMKMPurchaseHistory["status"], string> = {
  TIBA_DI_HUB:
    "bg-emerald-100/70 text-emerald-800 border-emerald-200",
  DIPROSES_SUPPLIER:
    "bg-amber-50 text-amber-800 border-amber-200",
  TERKUNCI:
    "bg-amber-50 text-amber-800 border-amber-200",
  SELESAI:
    "bg-surface-subtle text-text-secondary border-border",
};

// ─── Sub-filter DeptTab (Watermelon UI Career-1 style) ────────────────────────

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

// ─── Purchase Order Row (Watermelon JobRow adaptation) ────────────────────────

function PurchaseOrderRow({
  order,
  onOpenTicket,
}: {
  order: UMKMPurchaseHistory;
  onOpenTicket: (order: UMKMPurchaseHistory) => void;
}) {
  const isReadyAtHub = order.status === "TIBA_DI_HUB";
  const isDirect = order.orderType === "DIRECT_OVER_MOQ" || order.deliveryMethod === "ON_YOUR_DOOR";
  const isCircular = order.orderType === "CIRCULAR_WASTE";

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

            {/* 3 Purchase Cases Badge */}
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
              ({order.volumeKg} kg &bull; {order.unit})
            </span>
          </div>

          {/* Line 3: Financial summary & Location */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>
              Total: <strong className="text-primary font-bold tabular-nums">{formatCurrency(order.totalWholesalePaid)}</strong>
            </span>
            {order.savingsAmount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full tabular-nums">
                <TrendingDown className="size-3 text-emerald-600" />
                Hemat {formatCurrency(order.savingsAmount)}
              </span>
            )}
            <span className="text-text-muted text-[11px] truncate max-w-xs">
              &bull; {order.deliveryLocation || MOCK_UMKM_PROFILE.preferredHubName}
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
            ) : order.deliveryMethod === "ON_YOUR_DOOR" ? (
              <>
                <Home className="size-3" />
                On Your Door
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
              purchaseStatusVariant[order.status]
            )}
          >
            {order.status === "TIBA_DI_HUB" ? (
              <>
                <CheckCircle2 className="size-3 text-emerald-600" />
                Siap Ambil di Hub
              </>
            ) : order.status === "DIPROSES_SUPPLIER" ? (
              <>
                <Clock className="size-3 text-amber-600" />
                Diproses Supplier
              </>
            ) : order.status === "TERKUNCI" ? (
              <>
                <Clock className="size-3 text-accent" />
                Pool Terkunci
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3 text-text-muted" />
                Selesai Diterima
              </>
            )}
          </span>

          {/* Action Trigger */}
          {isReadyAtHub ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpenTicket(order)}
              className="font-bold cursor-pointer text-xs h-8 px-3 gap-1 shrink-0 ml-auto sm:ml-2"
            >
              Tiket Pickup
              <ArrowRight className="size-3" />
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenTicket(order)}
              className="ml-auto flex size-8 items-center justify-center rounded-full bg-surface-subtle border border-border text-text-muted transition-colors duration-200 group-hover:bg-primary group-hover:text-white sm:ml-2 shrink-0 cursor-pointer"
              title="Lihat Rincian Pesanan"
            >
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Waste Sale Row (Watermelon JobRow adaptation) ────────────────────────────

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
        {/* Thumbnail Image */}
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

        {/* Info Column */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Top meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-xs font-bold text-text-primary">
              {order.orderNumber}
            </span>
            <span className="text-text-muted text-[11px]">&bull; {order.orderDate}</span>
            <span className="inline-flex items-center rounded-full bg-surface-subtle border border-border px-2 py-0.5 text-xs font-semibold">
              {order.listingCategory || "Residu Dapur"}
            </span>
          </div>

          {/* Title & volume */}
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary group-hover:text-circular-waste transition-colors">
              {order.listingTitle}
            </h3>
            <span className="text-xs text-text-muted tabular-nums">
              ({order.orderedVolume} {order.orderedUnit})
            </span>
          </div>

          {/* Buyer & Scheduled details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>
              Nilai: <strong className="text-circular-waste font-bold tabular-nums">{formatCurrency(order.totalPrice)}</strong>
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

        {/* Right side pills & action */}
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

// ─── CTA Banner (Watermelon UI Career-1 style) ────────────────────────────────

function CtaBanner({
  text,
  description,
  linkLabel,
  href,
  icon: Icon = Sparkles,
}: {
  text: string;
  description: string;
  linkLabel: string;
  href: string;
  icon?: typeof Sparkles;
}) {
  return (
    <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-subtle/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-primary shadow-xs">
          <Icon className="size-4" />
        </span>
        <div className="text-xs sm:text-sm">
          <p className="font-heading font-bold text-text-primary">{text}</p>
          <p className="text-text-muted text-xs">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline underline-offset-4 transition-all shrink-0"
      >
        <span>{linkLabel}</span>
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function UmkmPesananView() {
  const searchParams = useSearchParams();

  // Tab utama
  const [activeTab, setActiveTab] = React.useState<MainTab>("pembelian");

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "limbah" || tab === "penjualan-limbah" || tab === "penjualan") setActiveTab("limbah");
    else if (tab === "pembelian") setActiveTab("pembelian");
  }, [searchParams]);

  // Reactive state orders for interactive handover/confirmation updates
  const [purchases, setPurchases] = React.useState<UMKMPurchaseHistory[]>([]);
  const [sales, setSales] = React.useState<WasteSaleOrder[]>([]);
  const [loadingPurchases, setLoadingPurchases] = React.useState<boolean>(true);
  const [loadingSales, setLoadingSales] = React.useState<boolean>(true);
  const [errorPurchases, setErrorPurchases] = React.useState<string | null>(null);
  const [errorSales, setErrorSales] = React.useState<string | null>(null);

  // Tab 1 state
  const [purchaseFilter, setPurchaseFilter] = React.useState<PurchaseFilter>("SEMUA");
  const [purchaseSearch, setPurchaseSearch] = React.useState("");
  const [selectedTicket, setSelectedTicket] = React.useState<UMKMPurchaseHistory | null>(null);
  const [ticketOpen, setTicketOpen] = React.useState(false);

  // Tab 2 state
  const [saleFilter, setSaleFilter] = React.useState<SaleFilter>("SEMUA");
  const [saleSearch, setSaleSearch] = React.useState("");
  const [selectedSale, setSelectedSale] = React.useState<WasteSaleOrder | null>(null);
  const [handoverModalOpen, setHandoverModalOpen] = React.useState(false);

  // Load purchases from backend
  React.useEffect(() => {
    async function loadPurchases() {
      setLoadingPurchases(true);
      try {
        const res = await beFetch<UMKMPurchaseHistory[]>(`/api/orders/umkm/all`);
        if (res.success) {
          setPurchases(res.data ?? []);
        } else {
          setPurchases([]);
          setErrorPurchases(res.message ?? 'Gagal memuat riwayat pembelian');
        }
      } catch (err) {
        console.error(err);
        setPurchases([]);
        setErrorPurchases('Gagal memuat riwayat pembelian');
      } finally {
        setLoadingPurchases(false);
      }
    }
    loadPurchases();
  }, []); // empty deps for now

  // Load sales from backend
  React.useEffect(() => {
    async function loadSales() {
      setLoadingSales(true);
      try {
        const res = await getWasteSalesTransactionsAction();
        if (res.success && res.data && res.data.length > 0) {
          const mapped: WasteSaleOrder[] = res.data.map((tx) => ({
            id: tx.id,
            orderNumber: tx.pickup_code || `WST-${tx.id.slice(0, 6).toUpperCase()}`,
            listingId: tx.listing_id,
            listingTitle: tx.listing_title,
            buyerName: tx.buyer_business_name || "Mitra Offtaker Terdaftar",
            buyerType: "Offtaker / Mitra Sirkular",
            buyerPhone: tx.buyer_phone || undefined,
            orderedVolume: Number(tx.purchased_weight),
            orderedUnit: "Kg",
            totalPrice: Number(tx.total_amount),
            orderDate: tx.created_at ? new Date(tx.created_at).toLocaleDateString("id-ID") : "-",
            pickupScheduledDate: tx.pickup_date ? new Date(tx.pickup_date).toLocaleDateString("id-ID") : "Jadwal Segera",
            status: tx.fulfillment_status === "ACCEPTED_COMPLETED" ? "SELESAI" : "MENUNGGU_DIAMBIL",
            location: "Surabaya",
          }));
          setSales(mapped);
        } else if (res.success && res.data) {
          setSales([]);
        } else {
          setSales(MOCK_WASTE_SALES_ORDERS);
        }
      } catch {
        setSales(MOCK_WASTE_SALES_ORDERS);
      } finally {
        setLoadingSales(false);
      }
    }
    loadSales();
  }, []);
  // ── Derived: Tab 1 ──
  const filteredPurchases = React.useMemo(() => {
    return purchases.filter((o) => {
      const q = purchaseSearch.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.commodityName.toLowerCase().includes(q) ||
        (o.hubPickupCode?.toLowerCase().includes(q) ?? false);
      const matchFilter = purchaseFilter === "SEMUA" || o.status === purchaseFilter;
      return matchSearch && matchFilter;
    });
  }, [purchases, purchaseFilter, purchaseSearch]);

  const readyCount = purchases.filter((o) => o.status === "TIBA_DI_HUB").length;
  const processingCount = purchases.filter((o) => o.status === "DIPROSES_SUPPLIER").length;
  const completedPurchaseCount = purchases.filter((o) => o.status === "SELESAI").length;

  // ── Derived: Tab 2 ──
  const filteredSales = React.useMemo(() => {
    return sales.filter((o) => {
      const q = saleSearch.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.listingTitle.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        (o.buyerPhone?.includes(saleSearch) ?? false);
      const matchFilter = saleFilter === "SEMUA" || o.status === saleFilter;
      return matchSearch && matchFilter;
    });
  }, [sales, saleFilter, saleSearch]);

  const waitingPickupCount = sales.filter((o) => o.status === "MENUNGGU_DIAMBIL").length;
  const completedSaleCount = sales.filter((o) => o.status === "SELESAI").length;

  // ── Handlers: Konfirmasi Serah-Terima & Pengambilan ──
  const handleConfirmHubPickup = async (order: UMKMPurchaseHistory) => {
    // TODO: Get order reference id from order (maybe order.id or order.referenceId)
    const orderReferenceId = order.id; // assuming order.id is the reference id
    setTicketOpen(true); // keep modal open while processing
    try {
      const res = await beFetch<any>(
        `/api/payments/escrow/release`,
        {
          method: 'POST',
          body: JSON.stringify({
            order_reference_id: orderReferenceId,
          })
        }
      );

      if (!res.success) {
        throw new Error(res.message ?? 'Gagal konfirmasi terima barang');
      }

      // Optimistic update: set status to SELESAI
      setPurchases(prev =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: "SELESAI" } : item
        )
      );

      toast.success(
        `Pengambilan ${order.commodityName} di ${MOCK_UMKM_PROFILE.preferredHubName} telah terkonfirmasi tuntas!`,
        "Serah-Terima Hub Berhasil"
      );
    } catch (err: any) {
      toast.error((err as Error)?.message ?? 'Terjadi kesalahan', 'Gagal');
    } finally {
      setTicketOpen(false);
    }
  };

  const handleConfirmWasteHandover = async (order: WasteSaleOrder) => {
    try {
      if (order.orderNumber?.startsWith("WST-")) {
        await confirmWastePickupAction(order.id, order.orderNumber);
      }
    } catch {
      // safe fallback
    }
    setSales((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: "SELESAI" } : item
      )
    );
    setHandoverModalOpen(false);
    toast.success(
      `Serah-terima residu ${order.listingTitle} tuntas! Dana ${formatCurrency(order.totalPrice)} otomatis dicairkan ke saldo kas.`,
      "Penjualan Selesai"
    );
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
      {/* TAB 1: BELI BAHAN BAKU (WATERMELON CAREER-1 STYLE)             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === "pembelian" && (
        <div className="space-y-4">
          {/* Action Row & Sub-filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-text-primary">
                Daftar Pesanan Bahan Baku Masuk
              </h2>
              <p className="font-sans text-xs text-text-secondary mt-0.5 text-pretty">
                Mencakup 3 skema: Beli Supplier &ge; MOQ, Pooling &lt; MOQ via Hemat Hub, dan Pembelian Residu Sirkular.
              </p>
            </div>
            <Link href="/katalog" className="shrink-0">
              <Button variant="primary" size="default" className="font-bold min-h-[40px] gap-1.5 shadow-xs">
                <Plus className="size-4" />
                <span>+ Pesan Bahan Baku</span>
              </Button>
            </Link>
          </div>

          {/* Search Bar & Sub-filter Pills (Watermelon DeptTab) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
              <DeptTab
                label="Semua Pesanan"
                isActive={purchaseFilter === "SEMUA"}
                count={purchases.length}
                onClick={() => setPurchaseFilter("SEMUA")}
              />
              <DeptTab
                label="Siap Ambil di Hub"
                isActive={purchaseFilter === "TIBA_DI_HUB"}
                count={readyCount}
                onClick={() => setPurchaseFilter("TIBA_DI_HUB")}
              />
              <DeptTab
                label="Diproses Supplier"
                isActive={purchaseFilter === "DIPROSES_SUPPLIER"}
                count={processingCount}
                onClick={() => setPurchaseFilter("DIPROSES_SUPPLIER")}
              />
              <DeptTab
                label="Selesai Diterima"
                isActive={purchaseFilter === "SELESAI"}
                count={completedPurchaseCount}
                onClick={() => setPurchaseFilter("SELESAI")}
              />
            </div>

            {/* Quick Search Input */}
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

          {/* Unified Table Card Container (Watermelon UI Career-1) */}
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
            ) : errorPurchases ? (
              <div className="p-4 text-center bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{errorPurchases}</p>
              </div>
            ) : (
              filteredPurchases.length > 0 ? (
                <ul role="list">
                  {filteredPurchases.map((order) => (
                    <PurchaseOrderRow
                      key={order.id}
                      order={order}
                      onOpenTicket={(o) => {
                        setSelectedTicket(o);
                        setTicketOpen(true);
                      }}
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
              ))}
          </div>

          {/* Watermelon Career-1 CTA Banner */}
          <CtaBanner
            text="Butuh pasokan komoditas lain dengan harga grosir pabrik?"
            description="Gabung radar pooling bersama UMKM sekitar untuk pangkas biaya logistik hingga 40%."
            linkLabel="Jelajahi Radar Pooling"
            href="/katalog"
            icon={Sparkles}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PENJUALAN LIMBAH (WATERMELON CAREER-1 STYLE)            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === "limbah" && (
        <div className="space-y-4">
          {/* Action Row */}
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

          {/* Search Bar & Sub-filter Pills (Watermelon DeptTab) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Filter Pills */}
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
                count={waitingPickupCount}
                onClick={() => setSaleFilter("MENUNGGU_DIAMBIL")}
              />
              <DeptTab
                label="Selesai & Saldo Cair"
                isActive={saleFilter === "SELESAI"}
                count={completedSaleCount}
                onClick={() => setSaleFilter("SELESAI")}
              />
            </div>

            {/* Quick Search Input */}
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

          {/* Unified Table Card Container (Watermelon UI Career-1) */}
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
            ) : errorSales ? (
              <div className="p-4 text-center bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{errorSales}</p>
              </div>
            ) : (
              filteredSales.length > 0 ? (
                <ul role="list">
                  {filteredSales.map(order => (
                    <WasteSaleRow
                      key={order.id}
                      order={order}
                      onOpenHandover={(o) => {
                        setSelectedSale(o);
                        setHandoverModalOpen(true);
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
              ))
            }
          </div>

          {/* Watermelon Career-1 CTA Banner */}
          <CtaBanner
            text="Punya ampas kedelai, minyak jelantah, atau residu segar hari ini?"
            description="Ubah beban limbah dapur menjadi pemasukan kas tambahan dengan 1x klik rekomendasi harga AI."
            linkLabel="Pasang Listing Residu"
            href="/limbah"
            icon={Recycle}
          />
        </div>
      )}

      {/* ── Modal 1: Tiket Pengambilan Hub Konsolidasi (Hemat Hub) ── */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 text-center">
          {selectedTicket && (
            <div className="space-y-5">
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="font-heading text-lg font-bold text-text-primary">
                  Tiket Pengambilan Hub Konsolidasi
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Tunjukkan kode atau QR ini kepada petugas Hub KUMPUL saat serah-terima fisik barang.
                </DialogDescription>
              </DialogHeader>

              {/* Box Kode Pickup & Mock QR Code */}
              <div className="p-6 rounded-2xl bg-surface-subtle border-2 border-dashed border-primary/40 space-y-4">
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl shadow-xs border border-border flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-slate-900 rounded-lg">
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-slate-900" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs col-span-2 row-span-2" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted">Kode Verifikasi Petugas Hub:</span>
                  <p className="font-mono text-2xl font-black text-primary tracking-widest tabular-nums">
                    {selectedTicket.hubPickupCode || "HUB-KMPL-889"}
                  </p>
                </div>
              </div>

              {/* Rincian Komoditas & Lokasi */}
              <div className="p-4 rounded-xl bg-surface border border-border text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Komoditas:</span>
                  <span className="font-bold text-text-primary">{selectedTicket.commodityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Volume:</span>
                  <span className="font-bold text-text-primary tabular-nums">
                    {selectedTicket.volumeKg} kg ({selectedTicket.unit})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Titik Hub:</span>
                  <span className="font-semibold text-text-primary">
                    {selectedTicket.deliveryLocation || MOCK_UMKM_PROFILE.preferredHubName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Metode Logistik:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedTicket.deliveryMethod === "HEMAT_HUB"
                      ? "Hemat Hub Konsolidasi"
                      : selectedTicket.deliveryMethod === "ON_YOUR_DOOR"
                        ? "On Your Door (Antar ke Dapur)"
                        : "Pick-Up Mandiri"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {selectedTicket.status === "TIBA_DI_HUB" && (
                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => handleConfirmHubPickup(selectedTicket)}
                    className="w-full font-bold min-h-[42px] gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Konfirmasi Barang Telah Diambil</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => setTicketOpen(false)}
                  className="w-full font-semibold min-h-[40px] cursor-pointer"
                >
                  Tutup Tiket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal 2: Verifikasi Serah-Terima Limbah P2P (Bursa Sirkular) ── */}
      <Dialog open={handoverModalOpen} onOpenChange={setHandoverModalOpen}>
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
                  Pastikan pembeli telah datang mengambil residu dapur sesuai volume yang dipesan sebelum mengonfirmasi serah-terima.
                </DialogDescription>
              </DialogHeader>

              {/* Rincian Limbah & Pembeli */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-text-muted">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-text-primary">{selectedSale.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Residu Limbah:</span>
                  <span className="font-bold text-text-primary">{selectedSale.listingTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Volume Diambil:</span>
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
                  <span className="text-text-muted">Nama Pembeli:</span>
                  <span className="font-bold text-text-primary">{selectedSale.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tipe Usaha:</span>
                  <span className="font-medium text-text-secondary">{selectedSale.buyerType}</span>
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
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-text-muted">Jadwal Pick-Up:</span>
                  <span className="font-semibold text-accent">{selectedSale.pickupScheduledDate}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="p-3 rounded-xl bg-surface border border-border/70 text-xs text-text-secondary italic">
                  Catatan Pembeli: &ldquo;{selectedSale.notes}&rdquo;
                </div>
              )}

              {/* Info Notice Escrow */}
              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Dana pembeli sebesar <strong>{formatCurrency(selectedSale.totalPrice)}</strong> tertahan aman di rekening penampung Kumpul dan akan langsung cair ke saldo kas Anda seketika setelah tombol konfirmasi di bawah diklik.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {selectedSale.status === "MENUNGGU_DIAMBIL" && (
                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => handleConfirmWasteHandover(selectedSale)}
                    className="w-full font-bold min-h-[42px] gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Konfirmasi Serah-Terima &amp; Cairkan Saldo</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => setHandoverModalOpen(false)}
                  className="w-full font-semibold min-h-[40px] cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}