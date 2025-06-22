"use client";

import React, { Suspense } from "react";
import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";

function NavbarClient() {
  const { AddToCartOption, cart_enable } = useAppStore();
  const { lang } = useParams();

  return (
    <>
      <Suspense fallback={<></>}>
        <InitFunction init={lang} />
      </Suspense>
      <AuthSections />
    </>
  );
}

export default NavbarClient;
