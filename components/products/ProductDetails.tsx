"use client";
import { dispatchRouteChangeEvent } from "Hooks/events";
import { ProductInterface } from "models/product";
import React, { useEffect } from "react";

export default function ProductDetails({
  Product,
}: {
  Product: ProductInterface;
}) {
  useEffect(() => {
    dispatchRouteChangeEvent("completed");
  }, []);
  return <></>;
}
