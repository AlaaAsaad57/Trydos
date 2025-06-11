"use client";
import { ToastContainer } from "react-toastify";
import React, { Suspense, useEffect } from "react";
import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";

function NavbarClient() {
  const { AddToCartOption, cart_enable } = useAppStore();
  const { lang } = useParams();

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
