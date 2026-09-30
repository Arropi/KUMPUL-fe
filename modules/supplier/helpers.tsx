import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { POStatus, StorageTemperature } from "@/constants/supplier";

export function getOrderStatusBadge(status: POStatus) {
  switch (status) {
    case "ISSUED":
      return <Badge variant="neutral">Menunggu Pembayaran</Badge>;
    case "PAID_TO_ESCROW":
      return <Badge variant="warning">Dana Siap di Escrow</Badge>;
    case "PROCESSING":
      return <Badge variant="info">Sedang Dikemas</Badge>;
    case "SHIPPED":
      return <Badge variant="info">Dalam Pengiriman</Badge>;
    case "DELIVERED":
      return <Badge variant="success">Tiba di Tujuan</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getStorageBadge(temp: StorageTemperature) {
  switch (temp) {
    case "AMBIENT":
      return <Badge variant="neutral">Suhu Ruang (Ambient)</Badge>;
    case "CHILLED":
      return <Badge variant="info">Dingin (Chilled 0 s.d. 4°C)</Badge>;
    case "FROZEN":
      return <Badge variant="warning">Beku (Frozen &lt; -18°C)</Badge>;
    default:
      return null;
  }
}

export function getStatusStepIndex(status: POStatus): number {
  switch (status) {
    case "ISSUED":
      return 0;
    case "PAID_TO_ESCROW":
      return 1;
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
}
