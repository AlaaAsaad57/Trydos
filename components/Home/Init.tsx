"use client";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import HomeService from "services/home";
import PopupCountry from "utils/PopupCountry";
import home from "services/home";

import { fetchCountries } from "Server Requests";
import Smartlook from "smartlook-client";

import { translateFunction } from "utils/functions";
import { showErrorNotification } from "@/store/notifications/reducer";

function Init() {
  useEffect(() => {
    const fallbackImage = "/error.png"; // Replace with your fallback image path

    // Function to handle broken images
    const handleImageError = (event) => {
      const img = event.target;
      if (!img.dataset.errorHandled) {
        // Avoid infinite loop
        img.dataset.errorHandled = "true";
        img.src = fallbackImage;
      }
    };

    // Add error listeners to all current and future images
    const addErrorListeners = () => {
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        img.addEventListener("error", handleImageError);
      });
    };

    // Initial setup
    addErrorListeners();

    // Observe DOM changes for dynamically added images
    const observer = new MutationObserver(() => addErrorListeners());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      // Cleanup
      observer.disconnect();
    };
  }, []);

  const { lang } = useParams();
  const searchParams = useSearchParams();
  const [dataCountries, setCountriesData] = useState([]);

  // Initialize login check once
  useEffect(() => {
    HomeService.CheckLogin();
  }, []);

  const getCountries = async () => {
    if (sessionStorage.getItem("countries")) {
      const data = sessionStorage.getItem("countries");
      setCountriesData(JSON.parse(data));
    } else {
      try {
        const data = await fetchCountries();
        sessionStorage.setItem("countries", JSON.stringify(data.countries));
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
    window.addEventListener("resize", function () {
      var windowHeight = window.innerHeight;
      var outerHeight = window.outerHeight;

      if (windowHeight < outerHeight) {
        document.body.style.paddingBottom = "60px"; // Adjust accordingly
      } else {
        document.body.style.paddingBottom = "0px";
      }
    });
    if (!navigator.cookieEnabled) {
      showErrorNotification(translateFunction("Cookies Is Not Enabled"));
    }

    try {
      if (process.env.NODE_ENV === "production") {
        Smartlook.init(process.env.NEXT_PUBLIC_SMARTLOOK_KEY);
      }
      if (localStorage.getItem("USER") || localStorage.getItem("guest-user")) {
        let user =
          localStorage.getItem("USER") || localStorage.getItem("guest-user");
        if (process.env.NODE_ENV === "production") {
          Smartlook.identify(JSON.parse(user).id, {
            name: JSON.parse(user)?.name || "Guest",
            phone: JSON.parse(user)?.mobilePhone || "null",
            // other custom properties
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
    let images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        img.src = "/error.png";
      }
      img.onerror = function () {
        this.src = "/error.png";
        this.onerror = null;
      };
    });
  }, []);
  const initPageLoad = async () => {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied or dismissed.");
      return null;
    }
    const { requestFirebaseNotificationPermission } = await import(
      "utils/firebaseInitv1"
    );
    if (!shouldShowBluredInfo()) {
      const handlePageRefresh = async () => {
        try {
          requestFirebaseNotificationPermission().then((fbtoken) => {
            if (fbtoken) home.handleTopicsOnPageRefresh(fbtoken);
          });
        } catch (error) {
          console.error("Error handling topics on page refresh:", error);
        }
      };

      handlePageRefresh(); // Run the function on initial load
    }
  };
  useEffect(() => {
    initPageLoad();
  }, []); // Runs once when the app initializes

  return (
    <>
      {shouldShowBluredInfo() && (
        <PopupCountry
          forChanged={searchParams.get("changed-country")}
          noCountry={searchParams.get("no-country")}
          countries={dataCountries.map((s) => s.iso)}
          options={dataCountries.map((s) => {
            return { label: s.name, value: s.iso };
          })}
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
