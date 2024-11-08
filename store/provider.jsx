"use client";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./index";
import GAComponent from "components/global/GAComponent";
import { SSRDetect } from "utils/functions";
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
export default function Providers({ children }) {
  useEffect(() => {
    if (!navigator.cookieEnabled) {
      toast.info("Cookies Is Not Enabled");
    }
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
  const enableCart = (s) => {
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
  };
  useEffect(() => {
    window.addEventListener("popstate", (event) => {
      if (event.state?.isPopup) {
        dispatch({ type: "ENABLE-CART", payload: false });
        dispatch({ type: "LOGIN-OPEN", payload: false });
        dispatch({ type: "CHAT-OPEN", payload: false });
      }
    });
  }, []);

  const cartEnable = useSelector((state) => state.cart.enable);
  return (
    <>
      {cartEnable ? <CartContainer close={() => enableCart(false)} /> : <></>}
    </>
  );
};
