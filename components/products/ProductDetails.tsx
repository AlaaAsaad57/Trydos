"use client";
import React, { useEffect } from "react";
import { useAppStore } from "store";

export default function ProductDetails() {
  useEffect(() => {
    const { setIsNavigating } = useAppStore.getState();
    setIsNavigating(null);
  }, []);
  return <></>;
}
