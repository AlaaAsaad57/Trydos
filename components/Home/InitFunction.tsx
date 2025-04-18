"use client";
import { useSearchParams } from "next/navigation";

import React, { useEffect } from "react";
import { useAppStore } from "store";
import { changeAppCountry, changeAppLanguage } from "store/homepage/actions";

function InitFunction({ init }: { init: string }) {
  const { language, country } = useAppStore();
  const searchParams = useSearchParams();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    let countryCookies = Cookies.get("country");
    if (!searchParams.get("no-country"))
      // Cookies.set("country", init.split("-")[0]?.toLowerCase(), {
      //   expires: 365,
      // });

      changeAppLanguage(
        init.split("-")[1] ||
          languageCookies ||
          language ||
          process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
      );

    let action = await changeAppCountry(
      init.split("-")[0] ||
        countryCookies ||
        country ||
        process.env.NEXT_PUBLIC_DEFAULT_COUNTRY
    );
  };
  useEffect(() => {
    initFunc();
  }, []);
  return <></>;
}

export default InitFunction;
