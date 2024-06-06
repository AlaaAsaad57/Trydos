"use client";
import { dispatchRouteChangeEvent } from "Hooks/events";
import React, { useEffect } from "react";

export default function ProductDetails() {
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
  }, []);
  return <></>;
}
