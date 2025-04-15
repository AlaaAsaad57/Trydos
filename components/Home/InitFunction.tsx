"use client";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect } from "react";
import { changeAppCountry, changeAppLanguage } from "store/homepage/actions";

function InitFunction({ init }: { init: string }) {
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const country = useSelector(
    (state: StateInterface) => state.homepage.country
  );
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    let countryCookies = Cookies.get("country");
    if (!searchParams.get("no-country"))
      // Cookies.set("country", init.split("-")[0]?.toLowerCase(), {
      //   expires: 365,
      // });
      dispatch(
        changeAppLanguage(
          init.split("-")[1] ||
            languageCookies ||
            language ||
            process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
        )
      );
    let action = await changeAppCountry(
      init.split("-")[0] ||
        countryCookies ||
        country ||
        process.env.NEXT_PUBLIC_DEFAULT_COUNTRY
    );
    dispatch(action);
  };
  useEffect(() => {
    initFunc();
  }, []);
  return <></>;
}

export default InitFunction;
