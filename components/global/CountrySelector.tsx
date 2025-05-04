"use client";
import { useEffect, useState } from "react";
import {
  changeAppCountryServer,
  changeToken,
} from "store/homepage/cachedActions";
import { translateFunction } from "utils/functions";
import SyFlage from "public/svg/sy.svg";
import { FlagIcon } from "utils/tinyUtils";
interface Country {
  name: string;
  iso: string;
}

interface CountrySelectorProps {
  init: string;
}

function CountrySelector({ init }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [activeCountry, setActiveCountry] = useState<string>("");

  useEffect(() => {
    // Get active country from URL
    const countryIso = init?.split("-")[0];
    setActiveCountry(countryIso);

    // Fetch countries from API
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/countries"
        );
        const data = await response.json();
        // Filter for Syria, Turkey, and Lebanon
        const filteredCountries = data.data.countries;
        setCountries(filteredCountries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, [init]);

  return (
    <div
      className="flex-row justify-between items-center"
      style={{ padding: "10px 15px", cursor: "pointer", color: "#333" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: "8px" }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{translateFunction("Country")}</span>
      </div>
      <div className="flex-row ml-4">
        {countries.map((country) => (
          <div
            key={country.iso}
            className={`${
              activeCountry === country.iso.toLowerCase()
                ? "border-[#3da5b0] border-[1px]"
                : ""
            } flex p-1 cursor-pointer`}
            onClick={() => {
              changeAppCountryServer(country.iso.toLowerCase());
              changeToken({
                key: "country",
                value: country.iso.toLowerCase(),
              });
              const newUrl = window.location.href.replace(
                init,
                `${country.iso.toLowerCase()}-${init.split("-")[1]}`
              );
              window.location.href = newUrl;
            }}
          >
            <span className="w-[30px] h-[20px]">
              {" "}
              <FlagIcon iso={country.iso} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CountrySelector;
