"use client";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./index";
import GAComponent from "components/global/GAComponent";
import {
  expandView,
  normalizeView,
  Sendevent,
  SSRDetect,
} from "utils/functions";
import { ReactQueryClientProvider } from "components/Providers/ReactQueryClientProvider";
import Init from "components/Home/Init";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/scss/main.scss";
import { useEffect } from "react";
import CartContainer from "components/Cart";
import {
  AppProgressBar as ProgressBar,
  stopProgress,
} from "next-nprogress-bar";
import { useSearchParams } from "node_modules/next/navigation";
export default function Providers({ children }) {
  useEffect(() => {
    if (!navigator.cookieEnabled) {
      toast.info("Cookies Is Not Enabled");
    }

    let images = document.querySelectorAll("img");
    images.forEach((img) => {
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

  return (
    <ReactQueryClientProvider>
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
    </ReactQueryClientProvider>
  );
}
const CartProvider = () => {
  const dispatch = useDispatch();
  const filterEnabled = useSelector((state) => state.listing.filterEnabled);
  const enableCart = (s) => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
  };
  useEffect(() => {
    window.addEventListener("popstate", (event) => {
      if (event.state?.isPopup) {
        dispatch({ type: "STORY-SELECTED", payload: null });
        dispatch({ type: "ENABLE-CART", payload: false });
        dispatch({ type: "LOGIN-OPEN", payload: false });
        dispatch({ type: "CHAT-OPEN", payload: false });
        dispatch({ type: "ENABLE-SEARCH", payload: false });
      }
    });
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 66) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
  }, []);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("cart")) {
      enableCart(true);
    }
  }, []);
  const cartEnable = useSelector((state) => state.cart.enable);
  return (
    <>
      {cartEnable ? (
        <CartContainer
          close={() => {
            Sendevent({
              event: "button_clicked",
              value: "appbar_backicon_button",
            });
            enableCart(false);
          }}
        />
      ) : (
        <></>
      )}
    </>
  );
};
