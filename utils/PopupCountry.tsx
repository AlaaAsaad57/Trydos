"use client";
import "styles/chatstyles.css";
import "styles/chatcomponent.css";
import "styles/globals.css";
import { useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import "styles/popup.css";

import { Sendevent } from "./functions";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Spinner from "components/global/Spinner";
import { changeAppCountryServer } from "store/homepage/cachedActions";
const PopupCountry = ({ options, countries, forChanged, noCountry }) => {
  const [loading, setLoading] = useState(false);
  const [localization, setLocalization] = useState({
    country: null,
    language: "en",
  });
  const [selectedCountry, setSelectedCountry] = useState("");
  const init = async (e) => {
    if (e) {
      await changeAppCountryServer(e);
      setLocalization({ ...localization, country: e });
      Cookies.set("language", localization.language, {
        expires: 365,
      });
      await Cookies.set("lang", localization.language, {
        expires: 365,
      });
      await Cookies.set("country", e, {
        expires: 365,
      });
    }
  };
  const { lang } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // @ts-ignore
  const Defaultcountry = lang.split("-")[0];
  const router = useRouter();
  const UpdateUrl = async (localizationVar) => {
    await init(localizationVar.split("-")[0]);
    setTimeout(() => {
      let params = new URLSearchParams(searchParams);
      params.delete("changed-country");
      // @ts-ignore
      let newPath = `${pathname.replace(lang, localizationVar)}${
        params.values.length > 0 ? `?${params.toString()}` : ""
      }`;
      window.location.search = "?selected=true";
      window.location.pathname = `/${newPath}`;
    }, 2000);
  };

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
          {forChanged && (
            <span
              className="max-w-[350px] capitalize text-center light text-dark text-base px-10"
              style={{ color: "#000000ff" }}
            >
              {`You Visited this site previously from `}
              <span className="medium px-1">
                {`${
                  options.filter(
                    (s) =>
                      s.value.toLowerCase() ===
                      decodeURI(forChanged).split(",")[1]?.toLowerCase()
                  )[0]?.label
                }`}
              </span>
              {`  and now you access the site through url shared for another country: `}
              <span className="medium px-1">{`${
                options.filter(
                  (s) =>
                    s.value.toLowerCase() ===
                    decodeURI(forChanged).split(",")[0].toLowerCase()
                )[0]?.label
              }`}</span>
              <div
                className="medium items-center flex-row mt-5"
                style={{ color: "#f85555ff" }}
              >
                <span
                  className="text-blue-600 cursor-pointer"
                  onClick={() => {
                    // @ts-ignore
                    let langFromUrl = lang.split("-")[1];
                    UpdateUrl(
                      `${decodeURI(forChanged).split(",")[0]}-${langFromUrl}`
                    );
                  }}
                >
                  Continue with{" "}
                  <span className="bold">
                    {` ${
                      options.filter(
                        (s) =>
                          s.value.toLowerCase() ===
                          decodeURI(forChanged).split(",")[0].toLowerCase()
                      )[0]?.label
                    }`}{" "}
                  </span>
                </span>
                <span className="px-2"> OR </span>
                <span
                  className="text-blue-600 cursor-pointer"
                  onClick={() => {
                    // @ts-ignore
                    let langFromUrl = lang.split("-")[1];
                    UpdateUrl(
                      `${decodeURI(forChanged).split(",")[1]}-${langFromUrl}`
                    );
                  }}
                >
                  Continue with
                  <span className="bold">
                    {` ${
                      options.filter(
                        (s) =>
                          s.value.toLowerCase() ===
                          decodeURI(forChanged).split(",")[1].toLowerCase()
                      )[0]?.label
                    }`}
                  </span>
                </span>
              </div>
            </span>
          )}
          {noCountry && (
            <span
              className="capitalize text-center font-bold text-dark text-base px-10"
              style={{ color: "#000000ff" }}
            >
              {"Your Country"}
              <div className="font-medium" style={{ color: "#f85555ff" }}>
                Is Not Supported In Our System
              </div>
            </span>
          )}
          {!forChanged && (
            <>
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
                        `/${e.target.value.toLowerCase()}-${
                          localization.language
                        }${pathname.split(`/${lang}`)[1]}`
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
                  (
                    country: { value: string; label: string },
                    index: number
                  ) => {
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
            </>
          )}
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
