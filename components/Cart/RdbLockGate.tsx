"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "store";
import SheetSkeleton from "components/skeleton/SheetSkeleton";

// Lazy: the sheet and the payment screen inside it are on no page until the
// core backend refuses a cart write because a payment is still open.
const RdbPaymentLockedSheet = dynamic(() => import("./RdbPaymentLockedSheet"), {
  ssr: false,
  loading: () => <SheetSkeleton />,
});

/**
 * Mounted globally, so a pending RDB payment locks every page the shopper is
 * on. It draws nothing, and loads nothing, while there is no lock.
 */
export default function RdbLockGate() {
  const locked = useAppStore((s) => Boolean(s.rdbLock));
  return locked ? <RdbPaymentLockedSheet /> : null;
}
