"use client";

import React, { Suspense } from "react";
import InitFunction from "./InitFunction";
import AuthSections from "./AuthSections";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import ConfirmMobilePhoneWidget from "components/Login/ConfirmMobilePhoneWidget";

function NavbarClient() {
  const { shouldAuthinticated } = useAppStore();
  const { lang } = useParams();

  return (
    <>
      <Suspense fallback={<></>}>
        <InitFunction init={lang} />
      </Suspense>
      <AuthSections />
      {shouldAuthinticated && <ConfirmMobilePhoneWidget />}
    </>
  );
}

export default NavbarClient;
