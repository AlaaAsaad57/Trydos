"use client";
import { useEffect, useState } from "react";
import { registerRouteChangeListener } from "./events";

import OfferListSkeleton from "components/skeleton/OfferList";
import ListingSkeleton from "components/skeleton/listing";
import DetailsSekeleton from "components/skeleton/details";

export default function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [pathname, setPathName] = useState("");
  const [fromPath, setPathFrom] = useState("");
  const setPath = (str) => {
    if (str.includes("boutique")) {
      setPathName("listing");
    }
    if (str.includes("products")) {
      setPathName("products");
    }
    if (str.includes("HomePage") || str.includes("categoriesPage")) {
      setPathName("home");
    }
  };
  useEffect(() => {
    registerRouteChangeListener("start", ({ from, to }) => {
      setPath(to);
      setPathFrom(from || "");
      setIsLoading(true);
    });

    registerRouteChangeListener("completed", () => {
      setIsLoading(false);
      setPath("");
    });
  }, []);

  return (
    <>
      {isLoading && (
        <div
          className={`landing-page ${true && "loading-screnn"}`}
          id="landing"
          style={{
            marginTop:
              pathname === "home"
                ? fromPath === "details"
                  ? "5px"
                  : "50px"
                : pathname === "listing"
                ? "5px"
                : "50px",
            flexDirection: pathname === "listing" ? "column" : "row",
            justifyContent: "flex-start",
          }}
        >
          {pathname === "home" ? (
            <OfferListSkeleton />
          ) : pathname === "listing" ? (
            <ListingSkeleton />
          ) : (
            pathname === "products" && <DetailsSekeleton />
          )}
        </div>
      )}
    </>
  );
}
