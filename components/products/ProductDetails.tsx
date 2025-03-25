"use client";
import { dispatchRouteChangeEvent } from "utils/events";
import React, { useEffect } from "react";

export default function ProductDetails() {
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
  }, []);
  return <></>;
}
