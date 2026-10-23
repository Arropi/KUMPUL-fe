"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";

/**
 * 1. REALTIME HOOK: MARKETPLACE
 * Mendengarkan perubahan stok, harga, dan ketersediaan komoditas supplier & limbah.
 */
export function useMarketplaceRealtime(onUpdate: () => void) {
  const onUpdateRef = React.useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-marketplace-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "supplier_commodities",
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waste_listings",
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

/**
 * 2. REALTIME HOOK: MOQ (AUTONOMOUS POOLING)
 * Mendengarkan live update akumulasi kuota (accumulated_qty),
 * status pool (OPEN -> LOCKED), dan peserta baru yang bergabung.
 */
export function useMoqRealtime(poolId: string | undefined, onUpdate: () => void) {
  const onUpdateRef = React.useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  React.useEffect(() => {
    const supabase = createClient();
    const channelName = poolId
      ? `realtime-moq-${poolId}`
      : `realtime-moq-all-${Date.now()}`;

    const poolFilter = poolId ? `id=eq.${poolId}` : undefined;
    const participantFilter = poolId ? `pool_id=eq.${poolId}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "procurement_pools",
          ...(poolFilter ? { filter: poolFilter } : {}),
        },
        () => {
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "procurement_pool_participants",
          ...(participantFilter ? { filter: participantFilter } : {}),
        },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId]);
}

/**
 * 3. REALTIME HOOK: ALERT (KITCHEN RUNOUT & STATUS DARURAT)
 * Memberikan notifikasi pop-up seketika saat ada perubahan stok bahan resep
 * atau pool yang mendekati cutoff / terkunci.
 */
export function useAlertRealtime(roleId?: string, onAlertTriggered?: () => void) {
  const onAlertRef = React.useRef(onAlertTriggered);
  onAlertRef.current = onAlertTriggered;

  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-alerts-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "umkm_inventory_stocks",
        },
        (payload) => {
          const newRecord = payload.new as { ingredient_name?: string; current_stock?: string };
          if (newRecord?.ingredient_name) {
            toast.info(
              `Pembaruan Stok Bahan: ${newRecord.ingredient_name} sekarang tersisa ${newRecord.current_stock ?? 0} kg.`
            );
          }
          if (onAlertRef.current) onAlertRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "procurement_pools",
        },
        (payload) => {
          const newRecord = payload.new as { pool_status?: string; id?: string };
          if (newRecord?.pool_status === "LOCKED") {
            toast.success(
              "Target MOQ Terpenuhi! Sebuah pool pengadaan telah terkunci dan menerbitkan CPO ke Pemasok."
            );
          }
          if (onAlertRef.current) onAlertRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roleId]);
}

/**
 * 4. REALTIME HOOK: DASHBOARD METRICS
 * Melakukan sinkronisasi metrik transaksi, pesanan, dan pendapatan limbah
 * secara otomatis tanpa mengharuskan pengguna menekan tombol refresh.
 */
export function useDashboardRealtime(onSync: () => void) {
  const onSyncRef = React.useRef(onSync);
  onSyncRef.current = onSync;

  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-dashboard-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "umkm_procurement_orders",
        },
        () => {
          onSyncRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "procurement_pools",
        },
        () => {
          onSyncRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waste_transactions",
        },
        () => {
          onSyncRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consolidated_purchase_orders",
        },
        () => {
          onSyncRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
