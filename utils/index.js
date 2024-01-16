"use client";
import Cookies from "js-cookie";
import { createContext, useEffect, useState } from "react";
import PopupCountry from "./PopupCountry";

export const LocalizationContext = createContext();

export function LocalizationProvider({ lang, children }) {
  const [originCountry, setOriginCountry] = useState(
    Cookies.get("origin-country") && JSON.parse(Cookies.get("origin-country"))
  );
  console.log(originCountry);
  const [showPopup, setShowPopup] = useState(false);
  const countriesString = process.env.NEXT_PUBLIC_COUNTRIES || "[]";
  const countries = JSON.parse(countriesString);
  const [country, language] = lang.split("-");
  const localeProps = { language, country };
  const [localization, setLocalization] = useState(localeProps);
  const ifSupportedIp = (countryByIp) => {
    return countries.some(
      (country) => countryByIp.toLowerCase() === country.toLowerCase()
    );
  };
  useEffect(() => {
    if (localization) {
      if (!originCountry?.isSupported) {
        const aa = setTimeout(() => {
          setShowPopup(true);
        }, 4000);
      }

      console.log(localization, "localization");
      if (typeof window !== "undefined") {
        localStorage.setItem("localization", JSON.stringify(localization));
      }
      Cookies.set("language", localization.language, {
        expires: new Date(2147483647 * 1000),
      });
      Cookies.set("country", localization.country, {
        expires: new Date(2147483647 * 1000),
      });
    }
  }, [localization, originCountry]);
  return (
    <LocalizationContext.Provider value={{ localization, setLocalization }}>
      {children}
      {showPopup && originCountry && (
        <PopupCountry
          localization={localization}
          setLocalization={(a) => setLocalization(a)}
          originCountry={originCountry}
        />
      )}
    </LocalizationContext.Provider>
  );
}
