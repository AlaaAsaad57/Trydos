"use client";;
import { Provider } from "react-redux";
import { store } from "./index";
import GAComponent from "components/global/GAComponent";
import { SSRDetect } from "utils/functions";
import Init from "components/Home/Init";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/scss/main.scss";
import { useEffect, useState } from "react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import CartProvider from "components/Cart/CartProvider";
import Smartlook from "smartlook-client";
import { useSearchParams } from "next/navigation";
import PopupCountry from "utils/PopupCountry";
import { requestFirebaseNotificationPermission } from "utils/firebaseInitv1";
// import { getCountriesApi } from "./homepage/cachedActions";
import axios from "axios";
import home from "services/home";
import { AxiosGet } from "utils/AxiosApi";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";
export default function Providers({ children }) {
  const [dataCountries, setCountriesData] = useState([]);
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
    Smartlook.init(process.env.NEXT_PUBLIC_SMARTLOOK_KEY);
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

  useEffect(() => {
    if (!shouldShowBluredInfo()) {
      const handlePageRefresh = async () => {
        try {
          const response2 = await AxiosGet({
            url: process.env.NEXT_PUBLIC_BACKEND_URL + FIREBASE_SETTINGS_URL,
            title: "get firebase settings request"
          });
          store.dispatch({ type: "GET_FIREBASE_SETTINGS", payload: response2?.firebase_settings });
          requestFirebaseNotificationPermission().then((fbtoken) => {
            home.handleTopicsOnPageRefresh(fbtoken)
          });
        } catch (error) {
          console.error("Error handling topics on page refresh:", error);
        }
      };

      handlePageRefresh(); // Run the function on initial load
    }
  }, []); // Runs once when the app initializes

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
  const searchParams = useSearchParams();
  useEffect(() => {
    if (shouldShowBluredInfo()) {
      getCountries();
    }
  }, []);
  const getCountries = async () => {
    let data = await axios.get(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/countries"
    );
    setCountriesData(data.data.data.countries);
  };
  const shouldShowBluredInfo = () => {
    if (searchParams.get("changed-country") || searchParams.get("no-country")) {
      return true;
    } else {
      return false;
    }
  };
  // useEffect(() => {
  //   const handleResize = () => {
  //     console.log(window.innerWidth);
  //     const container = document.querySelector(".site-container");
  //     const windowWidth = window.innerWidth / 430;

  //     // Set the container width based on the window size (e.g., scale to 70% of the window width)
  //     container.style.transform = `scale(${windowWidth})`;
  //   };

  //   // Initialize resize function
  //   handleResize();

  //   // Add resize event listener
  //   window.addEventListener("resize", handleResize);

  //   // Cleanup the event listener on component unmount
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);
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
      <ProgressBar
        color="#f53d3d"
        height="4px"
        options={{ showSpinner: false }}
      />
      <Init />
      <Provider store={store}>
        <CartProvider />
        {children}
      </Provider>
      {SSRDetect() && <GAComponent />}
    </>
  );
}
