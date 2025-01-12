"use client";
import "styles/chatstyles.css";
import "styles/chatcomponent.css";
import "styles/globals.css";
import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import "styles/popup.css";
import Link from "next/link";
import { Sendevent } from "./functions";
import { useRouter } from "next/navigation";
import Spinner from "components/global/Spinner";
const PopupCountry = ({ options, countries }) => {
  const [localization, setLocalization] = useState({
    country: null,
    language: "en",
  });
  const [selectedCountry, setSelectedCountry] = useState("");
  const init = async (e) => {
    if (e) {
      const Cookies = (await import("js-cookie")).default;
      setLocalization({ ...localization, country: e });
      Cookies.set("language", localization.language, {
        expires: 365,
      });
      Cookies.set("lang", localization.language, {
        expires: 365,
      });
      Cookies.set("country", e, {
        expires: 365,
      });
    }
  };
  const { lang } = useParams();
  const pathname = usePathname();
  // @ts-ignore
  const Defaultcountry = lang.split("-")[0];
  const router = useRouter();
  return (
    <div
      style={{
        zIndex: "9999999999",
        backdropFilter: "blur(5px) brightness(0.9)",
      }}
      className={`${"flex"} fixed items-center justify-center  inset-0 bg-slate-700 bg-opacity-50`}
    >
      {countries.length > 0 ? (
        <div
          className={`
                 w-max
                fixed flex-col gap-y-5 rounded-[20px] top-[10%]
                 text-center items-center justify-center px-4 py-8 bg-gray-100`}
        >
          <span
            className="capitalize text-center font-bold text-dark text-base px-10"
            style={{ color: "#000000ff" }}
          >
            {"Your Country"}
            <div className="font-medium" style={{ color: "#f85555ff" }}>
              Is Not Supported In Our System
            </div>
          </span>
          <label htmlFor="country" className="no-label">
            country
          </label>
          <select
            id="country"
            value={selectedCountry}
            onChange={(e) => {
              Sendevent({
                event: "button_clicked",
                value: "choose_country_and_continue_button",
              });
              setSelectedCountry(e.target.value);
              let a = new URLSearchParams(window.location.search);
              a.delete("no-country");

              if (e.target.value === Defaultcountry) {
                window.location.search = a.toString();
              } else {
                init(e.target.value);
                setTimeout(() => {
                  router.push(
                    `/${e.target.value.toLowerCase()}-${localization.language}${
                      pathname.split(`/${lang}`)[1]
                    }`
                  );
                }, 200);
              }
            }}
            className={`w-full disabled:bg-gray-300 py-3.5 flex items-center justify-start bg-white text-sm text-gray-500
              border-[0.1px]  rounded-lg`}
          >
            <option
              style={{
                marginBottom: 100,
              }}
              className="!p-10 inline-block"
            >
              Please Select a Supported Country
            </option>
            {options?.map(
              (country: { value: string; label: string }, index: number) => {
                return (
                  <option
                    key={index}
                    style={{
                      marginBottom: 100,
                    }}
                    className="!p-10 inline-block"
                    value={country.value}
                  >
                    <div>{country.label}</div>
                  </option>
                );
              }
            )}
          </select>
        </div>
      ) : (
        <div
          className="transform-cpu duration-1000 delay-1000 w-max
                fixed flex-col gap-y-5 rounded-[20px] top-[10%]
                flex text-center items-center justify-center px-4 py-8  scale-[2]"
        >
          <Spinner />
        </div>
      )}
    </div>
  );
};
export default PopupCountry;
