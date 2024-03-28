"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "styles/popup.css";
const countriesString = process.env.NEXT_PUBLIC_COUNTRIES || "[]";
const countries = JSON.parse(countriesString);

const _getCountryName = (code: string) => {
  switch (code) {
    case "tr":
      return "Turkey";
    case "us":
      return "United States Of America";
    case "sy":
      return "Syria";
    case "ae":
      return "United Arab Emirates";
  }
};
const options = countries.map((country: string) => {
  return {
    label: _getCountryName(country),
    value: country,
  };
});

const PopupCountry = () => {
  const [localization, setLocalization] = useState({
    country: null,
    language: "en",
  });
  const params = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    init();
  }, [selectedCountry]);
  const init = async () => {
    if (selectedCountry) {
      const Cookies = (await import("js-cookie")).default;
      setLocalization({ ...localization, country: selectedCountry });
      Cookies.set("language", localization.language, {
        expires: new Date(2147483647 * 1000),
      });
      Cookies.set("country", selectedCountry, {
        expires: new Date(2147483647 * 1000),
      });
      if (params.get("path")) {
        window.location.href = "/" + params.get("path");
      } else window.location.href = "/";
    }
  };
  return (
    <div
      className={`${"flex"} fixed items-center justify-center z-[99999] inset-0 bg-slate-700 bg-opacity-50`}
    >
      <div
        className={`${"translate-y-full"}
                transform-cpu duration-1000 delay-1000 w-max
                fixed flex-col gap-y-5 rounded-[20px] top-[10%]
                flex text-center items-center justify-center px-4 py-8 bg-gray-100`}
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
            setSelectedCountry(e.target.value);
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
                  {country.label}
                </option>
              );
            }
          )}
        </select>
      </div>
    </div>
  );
};
export default PopupCountry;
