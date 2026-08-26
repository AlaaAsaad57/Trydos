"use client";
import { useEffect } from "react";
import { useAppStore } from "store";
import { getCookie, setLocaizationCookies } from "utils/cookies/cookie-manager";

function InitFunction({ init }: { init: string | string[] }) {
  const initFunc = async () => {
    // Read once inside the mount effect — no reactive subscription needed,
    // so this always-mounted component doesn't re-render on store writes.
    const { language, country } = useAppStore.getState();
    let languageCookies = getCookie("language");
    let countryCookies = getCookie("country");
    let stored_language =
      (typeof init === "string" && init.split("-")[1]) ||
      languageCookies ||
      language ||
      process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
    let stored_country =
      (typeof init === "string" && init.split("-")[0]) ||
      countryCookies ||
      country ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY;
    setLocaizationCookies(stored_country, stored_language);
  };
  useEffect(() => {
    initFunc();
  }, []);
  return <></>;
}

export default InitFunction;
