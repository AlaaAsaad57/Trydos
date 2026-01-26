"use client";

import "styles/globals.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";

import { translateFunction } from "./functions";
import Cookies from "js-cookie";
import Spinner from "components/global/Spinner";
import PersonalInfoCountries from "components/settings/PersonalInfoCountries";

import { FlagIcon } from "./tinyUtils";
import { setLocaizationCookies } from "./cookies/cookie-manager";

const PopupCountry = ({ options, countries, forChanged, noCountry }) => {
  const [loading, setLoading] = useState(true);
  const [loadingWidget, setLoadingWidget] = useState(false);

  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  // Navigation lock to prevent multiple simultaneous navigations
  const navigationInProgress = useRef(false);

  const { lang } = useParams();
  const pathname = usePathname();

  // Set cookies with all methods for maximum compatibility
  const setCookiesAllMethods = useCallback(async (countryCode, langCode) => {
    const cookieMaxAge = 360 * 7 * 24 * 60 * 60; // 1 year

    // Method 1: document.cookie (immediate)
    document.cookie = `country=${countryCode.toLowerCase()}; path=/; max-age=${cookieMaxAge}; SameSite=Strict`;
    document.cookie = `lang=${langCode.toLowerCase()}; path=/; max-age=${cookieMaxAge}; SameSite=Strict`;
    document.cookie = `language=${langCode.toLowerCase()}; path=/; max-age=${cookieMaxAge}; SameSite=Strict`;

    // Method 2: js-cookie library
    const cookieOptions = { expires: 365, path: "/", sameSite: "strict" };
    Cookies.set("country", countryCode.toLowerCase(), cookieOptions);
    Cookies.set("lang", langCode.toLowerCase(), cookieOptions);
    Cookies.set("language", langCode.toLowerCase(), cookieOptions);

    setLocaizationCookies(countryCode, langCode);
  }, []);

  const UpdateUrl = useCallback(
    async (localizationVar) => {
      // Prevent multiple simultaneous navigations
      if (navigationInProgress.current || navigating) {
        return;
      }

      try {
        navigationInProgress.current = true;
        setNavigating(true);
        setLoadingWidget(true);

        const [countryCode, langCode] = localizationVar.split("-");

        // Set cookies immediately
        await setCookiesAllMethods(countryCode, langCode);

        // Small delay to ensure cookies are set
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Build the new URL
        const currentLang = Array.isArray(lang) ? lang[0] : lang;
        const newPath = pathname.replace(
          `/${currentLang}`,
          `/${localizationVar}`,
        );

        // Create final URL with bypass flag
        const finalUrl = new URL(window.location.origin + newPath);
        finalUrl.searchParams.set("_bypass", "popup-selection");

        // Clean up old params
        finalUrl.searchParams.delete("changed-country");
        finalUrl.searchParams.delete("no-country");

        // Use replace to prevent back button issues
        window.location.replace(finalUrl.toString());
      } catch (error) {
        setLoadingWidget(false);
        setNavigating(false);
        navigationInProgress.current = false;
      }
    },
    [lang, pathname, navigating, setCookiesAllMethods],
  );

  // Initialize countries loading
  useEffect(() => {
    if (countries?.length > 0 && loading) {
      setLoading(false);
    }
  }, [countries, loading]);

  // Progress animation for initial loading
  useEffect(() => {
    if (!initialLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setInitialLoading(false), 500);
          return 100;
        }
        return Math.min(prev + Math.random() * 10 + 2, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [initialLoading]);

  // Get country info helper
  const getCountryInfo = useCallback(
    (countryValue) => {
      if (!countryValue || !options) return null;
      return options.find(
        (country) =>
          country.value?.toLowerCase() === countryValue?.toLowerCase(),
      );
    },
    [options],
  );

  // Get current language
  const currentLanguage = Array.isArray(lang)
    ? lang[0]?.split("-")[1]
    : lang?.split("-")[1] || "en";

  return (
    <div
      style={{
        zIndex: "999999999999999999999",
        backdropFilter: "blur(8px)",
      }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
    >
      {initialLoading ? (
        // Initial loading screen with progress bar
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
          {/* Progress Header */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Progress Text */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {translateFunction("Preparing Your Experience", currentLanguage)}
          </h3>

          {/* Progress Bar */}
          <div className="w-full mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{translateFunction("Loading", currentLanguage)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {progress < 25 &&
                translateFunction("Initializing...", currentLanguage)}
              {progress >= 25 &&
                progress < 50 &&
                translateFunction("Loading countries...", currentLanguage)}
              {progress >= 50 &&
                progress < 75 &&
                translateFunction("Preparing options...", currentLanguage)}
              {progress >= 75 &&
                progress < 100 &&
                translateFunction("Almost ready...", currentLanguage)}
              {progress >= 100 && translateFunction("Ready!", currentLanguage)}
            </div>
          </div>

          {/* Loading Message */}
          <p className="text-gray-600 text-sm text-center">
            {translateFunction(
              "Please wait while we set up your country selection",
              currentLanguage,
            )}
          </p>
        </div>
      ) : !loading && !loadingWidget ? (
        countries.length > 0 && (
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            data-cy="Change-Url-Container"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {translateFunction("Select Your Region", currentLanguage)}
                </h2>
              </div>
            </div>

            <div className={noCountry ? "p-6" : "pb-6"}>
              {/* Country Change Scenario */}
              {forChanged && !forChanged?.includes("undefined") && (
                <div className="space-y-4">
                  <CountryInfoRow
                    message={`${translateFunction(
                      "You previously visited from",
                      currentLanguage,
                    )} ${
                      getCountryInfo(decodeURI(forChanged).split(",")[1])
                        ?.label ||
                      decodeURI(forChanged).split(",")[1]?.toUpperCase()
                    } ${translateFunction("but now accessing from")} ${
                      getCountryInfo(decodeURI(forChanged).split(",")[0])
                        ?.label ||
                      decodeURI(forChanged).split(",")[0]?.toUpperCase()
                    }`}
                  />
                  <div className="space-y-3 px-[8px]">
                    {/* Continue with new country */}
                    <button
                      className={`w-full flex-row cursor-pointer mt-[12px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center`}
                      style={{
                        cursor:
                          loadingWidget || navigating
                            ? "not-allowed"
                            : "pointer",
                        transition: "none",
                        WebkitTransition: "none",
                        MozTransition: "none",
                        OTransition: "none",
                        msTransition: "none",
                      }}
                      data-cy="countain-with"
                      disabled={loadingWidget || navigating}
                      onClick={() => {
                        UpdateUrl(
                          `${
                            decodeURI(forChanged).split(",")[0]
                          }-${currentLanguage}`,
                        );
                      }}
                    >
                      <span className="w-[30px] h-[20px]">
                        <FlagIcon iso={decodeURI(forChanged).split(",")[0]} />
                      </span>
                      <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
                        {getCountryInfo(decodeURI(forChanged).split(",")[0])
                          ?.label ||
                          decodeURI(forChanged).split(",")[0]?.toUpperCase()}
                      </span>
                    </button>

                    {/* OR divider */}
                    <div className="flex items-center">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="px-3 text-gray-500 text-sm">
                        {translateFunction("OR", currentLanguage)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Continue with previous country */}
                    <button
                      className={`w-full flex-row cursor-pointer mt-[12px] h-[53px] rounded-[15px] bg-[#f8f8f8] px-[12px] items-center`}
                      style={{
                        cursor:
                          loadingWidget || navigating
                            ? "not-allowed"
                            : "pointer",
                        transition: "none",
                        WebkitTransition: "none",
                        MozTransition: "none",
                        OTransition: "none",
                        msTransition: "none",
                      }}
                      disabled={loadingWidget || navigating}
                      onClick={() => {
                        const targetCountry =
                          decodeURI(forChanged).split(",")[1];
                        UpdateUrl(`${targetCountry}-${currentLanguage}`);
                      }}
                    >
                      <span className="w-[30px] h-[20px]">
                        <FlagIcon iso={decodeURI(forChanged).split(",")[1]} />
                      </span>
                      <span className="text-[14px] regular text-[#1d1d1d] ml-[12px] ">
                        {getCountryInfo(decodeURI(forChanged).split(",")[1])
                          ?.label ||
                          decodeURI(forChanged).split(",")[1]?.toUpperCase()}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* No Country Scenario */}
              {noCountry && (
                <PersonalInfoCountries
                  hideTopBar
                  infoMessage={translateFunction(
                    "Choose your country to get the best experience",
                    currentLanguage,
                  )}
                />
              )}

              {/* Country Selection Dropdown */}
              {!forChanged && (
                // <div className="space-y-3">
                //   <label htmlFor="country" className="sr-only">
                //     {translateFunction("Select Country", currentLanguage)}
                //   </label>

                //   {/* Country Grid for better UX (alternative to dropdown) */}
                //   {options?.length <= 8 && (
                //     <div className="mt-4">
                //       <p className="text-sm text-gray-500 mb-3 text-center regualr">
                //         {translateFunction(
                //           "choose from below",
                //           currentLanguage
                //         )}
                //       </p>
                //       <div className="grid grid-cols-2 gap-2">
                //         {options?.map(
                //           (
                //             country: { value: string; label: string },
                //             index: number
                //           ) => (
                //             <button
                //               key={index}
                //               onClick={() =>
                //                 UpdateUrl(
                //                   `${country.value?.toLocaleLowerCase()}-${currentLanguage}`
                //                 )
                //               }
                //               className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left"
                //               style={{
                //                 cursor: "pointer",
                //                 transition: "none",
                //                 WebkitTransition: "none",
                //                 MozTransition: "none",
                //                 OTransition: "none",
                //                 msTransition: "none",
                //               }}
                //             >
                //               <div className="w-5 h-5 flex-shrink-0 flex items-center">
                //                 <FlagIcon iso={country.value} />
                //               </div>
                //               <span className="text-sm font-medium text-gray-700 truncate light">
                //                 {country.label}
                //               </span>
                //             </button>
                //           )
                //         )}
                //       </div>
                //     </div>
                //   )}
                // </div>
                <></>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
          {/* Progress Header */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Progress Text */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {navigating
              ? translateFunction("Switching Country...", currentLanguage)
              : translateFunction("Loading...", currentLanguage)}
          </h3>

          {/* Simple Loading */}
          <div className="scale-125 mb-4">
            <Spinner />
          </div>

          {/* Loading Message */}
          <p className="text-gray-600 text-sm text-center">
            {navigating
              ? translateFunction("Do not close this window", currentLanguage)
              : translateFunction(
                  "Preparing your experience...",
                  currentLanguage,
                )}
          </p>
        </div>
      )}
    </div>
  );
};
export default PopupCountry;

const CountryInfoRow = ({ message }) => {
  return (
    <div className="flex-row justify-center mt-[12px] w-full">
      <div
        className="bg-[#F8F8F8] min-h-[50px] w-full flex-row items-center pl-[24px] pr-[20px] "
        style={{
          border: "1px solid rgb(211 211 211 / 51%)",
        }}
        data-cy="address-info-header" // Added data-cy
      >
        <svg
          id="Group_3387"
          data-name="Group 3387"
          xmlns="http://www.w3.org/2000/svg"
          width="24.997"
          height="24.997"
          viewBox="0 0 24.997 24.997"
        >
          <path
            id="Path_15434"
            data-name="Path 15434"
            d="M178.661,126.993h-.067a2.3,2.3,0,0,0,0,4.605h.067a2.3,2.3,0,0,0,0-4.605Z"
            transform="translate(-167.728 -120.932)"
            fill="#402cdd"
          />
          <path
            id="Path_15435"
            data-name="Path 15435"
            d="M180.465,237.18H176.79a.5.5,0,0,0-.5.5v9.113a.5.5,0,0,0,.5.5h3.675a.5.5,0,0,0,.5-.5v-9.113A.5.5,0,0,0,180.465,237.18Z"
            transform="translate(-167.728 -225.62)"
            fill="#402cdd"
          />
          <path
            id="Path_15436"
            data-name="Path 15436"
            d="M10.832,60.315a10.616,10.616,0,0,0-7.66,3.261A11.346,11.346,0,0,0,3.5,79.641l-.174,2.044a.5.5,0,0,0,.185.436.477.477,0,0,0,.457.08l2.124-.742a10.477,10.477,0,0,0,4.74,1.12,10.617,10.617,0,0,0,7.66-3.261,11.35,11.35,0,0,0,0-15.741A10.617,10.617,0,0,0,10.832,60.315Zm0,21.265A9.539,9.539,0,0,1,6.35,80.475a.476.476,0,0,0-.379-.028l-1.61.563.13-1.529a.506.506,0,0,0-.163-.418A10.264,10.264,0,0,1,.973,71.446a10.01,10.01,0,0,1,9.859-10.133,10.137,10.137,0,0,1,0,20.267Z"
            transform="translate(0 -57.581)"
            fill="#402cdd"
          />
          <path
            id="Path_15437"
            data-name="Path 15437"
            d="M380.02,5.522a.5.5,0,1,0,0,1,5.126,5.126,0,0,1,5.114,5.126.5.5,0,1,0,1,0A6.125,6.125,0,0,0,380.02,5.522Z"
            transform="translate(-361.135 -5.522)"
            fill="#402cdd"
          />
          <path
            id="Path_15438"
            data-name="Path 15438"
            d="M390.541,56.12a.5.5,0,0,0,0,1,2.075,2.075,0,0,1,2.07,2.075.5.5,0,1,0,1,0A3.073,3.073,0,0,0,390.541,56.12Z"
            transform="translate(-371.134 -53.595)"
            fill="#402cdd"
          />
        </svg>

        {message && (
          <div className="regular text-[10px] ml-[12px] text-[#8D8D8D]">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
