"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAppStore } from "store";

function RouterRefresh() {
  const { shouldUpdateOrders, setShouldUpdateOrders } = useAppStore();
  const router = useRouter();
  useEffect(() => {
    if (shouldUpdateOrders > 0) {
      router.refresh();
      setShouldUpdateOrders(0);
    }
  }, [shouldUpdateOrders]);
  return null;
}

export default RouterRefresh;
