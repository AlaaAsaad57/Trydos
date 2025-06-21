"use client";

import "styles/globals.css";
import { useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import "styles/popup.css";

import { translateFunction } from "./functions";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Spinner from "components/global/Spinner";
import { changeAppCountryServer } from "store/homepage/cachedActions";

import { FlagIcon } from "./tinyUtils";

const PopupCountry = ({ options, countries, forChanged, noCountry }) => {
  const [loading, setLoading] = useState(true);
  const [loadingWidget, setLoadingWidget] = useState(false);
  const [localization, setLocalization] = useState({
    country: null,
    language: "en",
  });
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedCountry, setSelectedCountry] = useState("");
  const init = async (e) => {
    try {
      if (e) {
        await changeAppCountryServer(e);
        setLocalization({ ...localization, country: e });
        Cookies.set("language", localization.language, {
          expires: 365,
        });
        await Cookies.set("lang", localization.language, {
          expires: 365,
        });
        await Cookies.set("country", e?.toLowerCase(), {
          expires: 365,
        });
      }
    } catch (error) {
      console.error(error, "error");
    }
  };
  const { lang } = useParams();
  const pathname = usePathname();

  const UpdateUrl = async (localizationVar) => {
    try {
      // Prevent multiple rapid navigations
      if (navigating) {
        return;
      }

      setNavigating(true);
      setLoadingWidget(true);
      console.log("UpdateUrl called with:", localizationVar);

      const countryCode = localizationVar.split("-")[0];
      const langCode = localizationVar.split("-")[1];

      // Set cookies immediately using document.cookie
      document.cookie = `country=${countryCode.toLowerCase()}; path=/; max-age=${
        360 * 7 * 24 * 60 * 60
      }; SameSite=Strict`;
      document.cookie = `lang=${langCode.toLowerCase()}; path=/; max-age=${
        360 * 7 * 24 * 60 * 60
      }; SameSite=Strict`;
      document.cookie = `language=${langCode.toLowerCase()}; path=/; max-age=${
        360 * 7 * 24 * 60 * 60
      }; SameSite=Strict`;

      // Also call the server action for consistency
      await init(countryCode);

      // Create the new path
      const newPath = pathname.replace(
        // @ts-ignore
        lang,
        localizationVar
      );

      // NUCLEAR OPTION: Use a completely different approach to avoid middleware
      // First, make a direct API call to set cookies server-side
      try {
        await fetch("/api/set-country-cookies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: countryCode.toLowerCase(),
            lang: langCode.toLowerCase(),
          }),
        });
        console.log("✅ Server cookies set successfully");
      } catch (err) {
        console.log("⚠️ Server cookie API failed, using client-side only");
      }

      // Also call the async method for compatibility
      await init(countryCode);

      // Small delay to ensure everything is ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Then navigate directly with bypass parameter to avoid middleware loops
      const finalPath = `${newPath}?_bypass=popup-selection`;
      console.log("🚀 Direct navigation to:", finalPath);
      window.location.href = finalPath;
    } catch (error) {
      console.error("UpdateUrl error:", error);
      setLoadingWidget(false);
      setNavigating(false);
    }
  };
  useEffect(() => {
    if (countries?.length > 0 && loading) {
      setLoading(false);
    }
  }, [countries]);

  // Initial loading progress effect
  useEffect(() => {
    if (!initialLoading) return;

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Delay a bit more to show 100% completion
          setTimeout(() => {
            setInitialLoading(false);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 8 + 2; // Slower, more realistic progress
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, [initialLoading]);
  const getUrl = (localizationVar) => {
    // Remove the selected parameter to avoid middleware conflicts
    return pathname.replace(
      // @ts-ignore
      lang,
      localizationVar
    );
  };

  // Helper function to get country info by value
  const getCountryInfo = (countryValue) => {
    if (!countryValue || !options) return null;

    const result = options.find(
      (country) => country.value?.toLowerCase() === countryValue?.toLowerCase()
    );

    if (!result && process.env.NODE_ENV === "development") {
      console.log(
        "Country not found:",
        countryValue,
        "Available options:",
        options?.map((o) => ({ label: o.label, value: o.value }))
      );
    }
    return result;
  };

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
            {translateFunction(
              "Preparing Your Experience",
              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
            )}
          </h3>

          {/* Progress Bar */}
          <div className="w-full mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>
                {translateFunction(
                  "Loading",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
              </span>
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
                translateFunction(
                  "Initializing...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
              {progress >= 25 &&
                progress < 50 &&
                translateFunction(
                  "Loading countries...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
              {progress >= 50 &&
                progress < 75 &&
                translateFunction(
                  "Preparing options...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
              {progress >= 75 &&
                progress < 100 &&
                translateFunction(
                  "Almost ready...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
              {progress >= 100 &&
                translateFunction(
                  "Ready!",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
            </div>
          </div>

          {/* Loading Message */}
          <p className="text-gray-600 text-sm text-center">
            {translateFunction(
              "Please wait while we set up your country selection",
              Array.isArray(lang) ? lang[0] : lang.split("-")[1]
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
                  {translateFunction(
                    "Select Your Region",
                    Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                  )}
                </h2>
              </div>
            </div>

            <div className="p-6">
              {/* Country Change Scenario */}
              {forChanged && !forChanged?.includes("undefined") && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {translateFunction(
                        "You previously visited from",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}{" "}
                      <span className="font-semibold text-gray-800">
                        {getCountryInfo(decodeURI(forChanged).split(",")[1])
                          ?.label ||
                          decodeURI(forChanged).split(",")[1]?.toUpperCase()}
                      </span>{" "}
                      {translateFunction(
                        "but now accessing from",
                        Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                      )}{" "}
                      <span className="font-semibold text-gray-800">
                        {getCountryInfo(decodeURI(forChanged).split(",")[0])
                          ?.label ||
                          decodeURI(forChanged).split(",")[0]?.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Continue with new country */}
                    <button
                      className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl disabled:opacity-50"
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
                        const langFromUrl = (
                          Array.isArray(lang) ? lang[0] : lang
                        ).split("-")[1];
                        UpdateUrl(
                          `${
                            decodeURI(forChanged).split(",")[0]
                          }-${langFromUrl}`
                        );
                      }}
                    >
                      <div className="w-6 h-6 flex-shrink-0">
                        <FlagIcon iso={decodeURI(forChanged).split(",")[0]} />
                      </div>
                      <span className="text-blue-600 font-medium">
                        {translateFunction(
                          "Continue with",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}{" "}
                        {getCountryInfo(decodeURI(forChanged).split(",")[0])
                          ?.label ||
                          decodeURI(forChanged).split(",")[0]?.toUpperCase()}
                      </span>
                    </button>

                    {/* OR divider */}
                    <div className="flex items-center">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="px-3 text-gray-500 text-sm">
                        {translateFunction(
                          "OR",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}
                      </span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Continue with previous country */}
                    <button
                      className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl disabled:opacity-50"
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
                        const langFromUrl = (
                          Array.isArray(lang) ? lang[0] : lang
                        ).split("-")[1];
                        const targetCountry =
                          decodeURI(forChanged).split(",")[1];

                        UpdateUrl(`${targetCountry}-${langFromUrl}`);
                      }}
                    >
                      <div className="w-6 h-6 flex-shrink-0">
                        <FlagIcon iso={decodeURI(forChanged).split(",")[1]} />
                      </div>
                      <span className="text-gray-600 font-medium">
                        {translateFunction(
                          "Continue with",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}{" "}
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
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {translateFunction(
                      "Select Your Country",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {translateFunction(
                      "Choose your country to get the best experience",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </p>
                </div>
              )}

              {/* Country Selection Dropdown */}
              {!forChanged && (
                <div className="space-y-3">
                  <label htmlFor="country" className="sr-only">
                    {translateFunction(
                      "Select Country",
                      Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                    )}
                  </label>

                  {/* Country Grid for better UX (alternative to dropdown) */}
                  {options?.length <= 8 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-3 text-center">
                        {translateFunction(
                          "Or choose from below",
                          Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                        )}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {options?.map(
                          (
                            country: { value: string; label: string },
                            index: number
                          ) => (
                            <button
                              key={index}
                              onClick={async () => {
                                if (navigating) return; // Prevent multiple selections

                                setNavigating(true);
                                setLoadingWidget(true);
                                setSelectedCountry(country.value);

                                try {
                                  const countryCode = country.value;
                                  const langCode = (
                                    Array.isArray(lang) ? lang[0] : lang
                                  ).split("-")[1];

                                  // Set cookies immediately
                                  document.cookie = `country=${countryCode.toLowerCase()}; path=/; max-age=${
                                    360 * 7 * 24 * 60 * 60
                                  }; SameSite=Strict`;
                                  document.cookie = `lang=${langCode.toLowerCase()}; path=/; max-age=${
                                    360 * 7 * 24 * 60 * 60
                                  }; SameSite=Strict`;
                                  document.cookie = `language=${langCode.toLowerCase()}; path=/; max-age=${
                                    360 * 7 * 24 * 60 * 60
                                  }; SameSite=Strict`;

                                  // Also call server action
                                  await init(countryCode);

                                  const newPath = `/${countryCode.toLowerCase()}-${langCode}${
                                    pathname.split(`/${lang}`)[1]
                                  }`;

                                  // Use API to set server cookies
                                  try {
                                    await fetch("/api/set-country-cookies", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        country: countryCode.toLowerCase(),
                                        lang: langCode.toLowerCase(),
                                      }),
                                    });
                                    console.log(
                                      "✅ Server cookies set successfully"
                                    );
                                  } catch (err) {
                                    console.log(
                                      "⚠️ Server cookie API failed, using client-side only"
                                    );
                                  }

                                  // Also call server action
                                  await init(countryCode);

                                  // Small delay to ensure everything is ready
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 300)
                                  );

                                  // Navigate directly with bypass parameter
                                  const finalPath = `${newPath}?_bypass=popup-selection`;
                                  window.location.href = finalPath;
                                } catch (error) {
                                  console.error(
                                    "Error changing country:",
                                    error
                                  );
                                  setLoadingWidget(false);
                                  setNavigating(false);
                                }
                              }}
                              className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left"
                              style={{
                                cursor: "pointer",
                                transition: "none",
                                WebkitTransition: "none",
                                MozTransition: "none",
                                OTransition: "none",
                                msTransition: "none",
                              }}
                            >
                              <div className="w-5 h-5 flex-shrink-0">
                                <FlagIcon iso={country.value} />
                              </div>
                              <span className="text-sm font-medium text-gray-700 truncate">
                                {country.label}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
              ? translateFunction(
                  "Switching Country...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )
              : translateFunction(
                  "Loading...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
          </h3>

          {/* Simple Loading */}
          <div className="scale-125 mb-4">
            <Spinner />
          </div>

          {/* Loading Message */}
          <p className="text-gray-600 text-sm text-center">
            {navigating
              ? translateFunction(
                  "Do not close this window",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )
              : translateFunction(
                  "Preparing your experience...",
                  Array.isArray(lang) ? lang[0] : lang.split("-")[1]
                )}
          </p>
        </div>
      )}
    </div>
  );
};
export default PopupCountry;
