"use client";
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
import { useSearchParams } from "node_modules/next/navigation";
import PopupCountry from "utils/PopupCountry";
import { getCountriesApi } from "./homepage/cachedActions";
export default function Providers({ children }) {
  const [dataCountries, setCountriesData] = useState([]);
  useEffect(() => {
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
    if (searchParams.get("no-country")) {
      getCountries();
    }
  }, []);
  const getCountries = async () => {
    let data = await getCountriesApi();
    setCountriesData(data);
  };
  return (
    <>
      {searchParams.get("no-country") && (
        <PopupCountry
          countries={dataCountries.map((s) => s.iso)}
          options={dataCountries.map((s) => {
            return { label: s.nicename, value: s.iso };
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
