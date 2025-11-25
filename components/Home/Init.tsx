"use client";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import HomeService from "services/home";
import PopupCountry from "utils/PopupCountry";
import home from "services/home";
import { fetchCountries } from "utils/tinyUtils";

import Smartlook from "smartlook-client";

import { getUserChat, translateFunction } from "utils/functions";
import { showErrorNotification } from "@/store/notifications/reducer";
import {
  COOKIE_NAMES,
  getCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import NotificationWidget from "components/global/NotificationWidget";
import { useAppStore } from "store";

function Init() {
  const { lang } = useParams();
  const { isNotificationModal, setNotificationModal } = useAppStore();
  // @ts-ignore
  const [country, language] = lang?.split("-");
  const searchParams = useSearchParams();
  const [dataCountries, setCountriesData] = useState([]);

  // Initialize login check once
  useEffect(() => {
    HomeService.CheckLogin();
  }, []);

  const getCountries = async () => {
    if (sessionStorage.getItem(`countries-${country}-${language}`)) {
      const data = sessionStorage.getItem(`countries-${country}-${language}`);
      setCountriesData(JSON.parse(data));
    } else {
      try {
        const data = await fetchCountries(country, language);
        sessionStorage.setItem(
          `countries-${country}-${language}`,
          JSON.stringify(data.countries)
        );
        setCountriesData(data.countries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
  };

  const shouldShowBluredInfo = () => {
    // Check if we need to show country popup
    const needsCountrySelection =
      lang?.includes("gb-") ||
      searchParams.get("changed-country") ||
      searchParams.get("no-country");

    if (needsCountrySelection) {
      // Clean up cart parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cart");

      if (
        typeof window !== "undefined" &&
        params.toString() !== searchParams.toString()
      ) {
        window.history.replaceState(
          {},
          "",
          params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname
        );
      }
      return true;
    }

    // Clean up navigation parameters if they exist
    const hasNavigationParams =
      searchParams.get("_bypass") || searchParams.get("_t");
    if (hasNavigationParams && typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("_bypass");
      params.delete("_t");

      window.history.replaceState(
        {},
        "",
        params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname
      );
    }

    return false;
  };

  useEffect(() => {
    if (shouldShowBluredInfo()) {
      getCountries();
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.cookieEnabled) {
      showErrorNotification(translateFunction("Cookies Is Not Enabled"));
    }

    try {
      if (process.env.NODE_ENV === "production") {
        Smartlook.init(process.env.NEXT_PUBLIC_SMARTLOOK_KEY);
      }
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);

      if (user) {
        if (process.env.NODE_ENV === "production") {
          Smartlook.identify(user.id, {
            name: user?.name || "Guest",
            phone: user?.mobilePhone || "null",
            // other custom properties
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
    // let images = document.querySelectorAll("img");
  }, []);
  const initPageLoad = async () => {
    const permission = Notification.permission;

    if (permission !== "granted") {
      return null;
    }

    if (!shouldShowBluredInfo() && Notification.permission === "granted") {
      const handlePageRefresh = async () => {
        try {
          await home.AllowNotifications();
        } catch (error) {
          console.error("Error handling topics on page refresh:", error);
        }
      };

      handlePageRefresh(); // Run the function on initial load
    }
  };
  useEffect(() => {
    if (typeof Notification !== "undefined") initPageLoad();
  }, []); // Runs once when the app initializes
  const onAllow = async () => {
    try {
      await home.AllowNotifications();
    } catch (error) {
      console.error("Error allowing notifications:", error);
    }
  };
  const onDismiss = () => {
    setNotificationModal(false);
  };
  return (
    <>
      {shouldShowBluredInfo() && (
        <PopupCountry
          forChanged={searchParams.get("changed-country")}
          noCountry={searchParams.get("no-country") || lang?.includes("gb-")}
          countries={dataCountries.map((s) => s.iso)}
          options={dataCountries.map((s) => {
            return { label: s.name, value: s.iso };
          })}
        />
      )}
      {isNotificationModal && (
        <NotificationWidget
          onAllow={onAllow}
          onDismiss={() => {
            onDismiss();
          }}
        />
      )}
      {/* <AppProgressBar
        color="#f53d3d"
        height="4px"
        options={{ showSpinner: false }}
      /> */}
    </>
  );
}

export default Init;
