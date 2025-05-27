"use client";
import { ToastContainer } from "react-toastify";
import React, { Suspense, useEffect } from "react";
import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams, usePathname } from "next/navigation";
import { pageview } from "utils/gtag";

function NavbarClient() {
  const { AddToCartOption, cart_enable } = useAppStore();
  const { lang } = useParams();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname]);
  return (
    <>
      {!AddToCartOption.enable && !cart_enable && (
        <ToastContainer
          position="top-right"
          style={{ zIndex: "9999999999999999" }}
        />
      )}
      <Suspense fallback={<></>}>
        <InitFunction init={lang} />
      </Suspense>
      <AuthSections />
    </>
  );
}

export default NavbarClient;
