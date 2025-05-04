"use client";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";

import React, { useEffect, useState } from "react";
import HomeService from "services/home";
import PopupCountry from "utils/PopupCountry";
import home from "services/home";
import { toast } from "react-toastify";
import Smartlook from "smartlook-client";
import "react-toastify/dist/ReactToastify.min.css";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/scss/main.scss";
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

  var bool = true;
  useEffect(() => {
    if (bool) {
      bool = false;

      HomeService.CheckLogin();
    }
    // @ts-ignore
  }, []);
  const getCountries = async () => {
    let data = await axios.get(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/countries"
    );
    setCountriesData(data.data.data.countries);
  };
  const shouldShowBluredInfo = () => {
    if (
      lang?.includes("gb-") ||
      searchParams.get("changed-country") ||
      searchParams.get("no-country")
    ) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cart");
      if (typeof window !== "undefined") {
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}?${params.toString()}`
        );
      }
      // it commit
      return true;
    } else {
      return false;
    }
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
      toast.info("Cookies Is Not Enabled");
    }

    try {
      Smartlook.init(process.env.NEXT_PUBLIC_SMARTLOOK_KEY);
      if (localStorage.getItem("USER") || localStorage.getItem("guest-user")) {
        let user =
          localStorage.getItem("USER") || localStorage.getItem("guest-user");
        Smartlook.identify(JSON.parse(user).id, {
          name: JSON.parse(user)?.name || "Guest",
          phone: JSON.parse(user)?.mobilePhone || "null",
          // other custom properties
        });
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
