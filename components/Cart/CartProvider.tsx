"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { expandView, normalizeView, Sendevent } from "utils/functions";
import CartContainer from ".";
import home from "services/home";
import ShowMessageAuth from "components/global/ShowMessageAuth";

const CartProvider = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const filterEnabled = useSelector(
    (state: StateInterface) => state.listing.filterEnabled
  );
  const enableCart = (s) => {
    dispatch({ type: "AddToCartOptionDisable", payload: false });
    window.history.pushState({ isPopup: true }, "open Cart");
    dispatch({ type: "ENABLE-CART", payload: s });
    if (s) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("cart", "true");
      // Use router.push with pathname and updated query
      router.push(`${pathname}?${newParams.toString()}`);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("cart");

      // Use router.push with pathname and updated query
      router.push(`${pathname}?${newParams.toString()}`);
    }
  };
  useEffect(() => {
    setTimeout(() => {
      home.getClientData();
    }, 10);
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

  useEffect(() => {
    if (searchParams.get("cart")) {
      enableCart(true);
    }
  }, []);
  const cartEnable = useSelector((state: StateInterface) => state.cart.enable);
  const showMessage = useSelector(
    (state: StateInterface) => state.homepage.showMessage
  );
  return (
    <>
      {showMessage && <ShowMessageAuth />}
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
export default CartProvider;
