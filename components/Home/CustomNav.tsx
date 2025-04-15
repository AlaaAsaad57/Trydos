"use client";
import { Suspense } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";

import NextLink from "components/global/NextLink";

import { dispatchRouteChangeEvent } from "utils/events";
import { ToastContainer } from "react-toastify";
import AuthSections from "./AuthSections";

import InitFunction from "./InitFunction";
import { usePrefetchLinks } from "hooks/usePrefetchHook";

interface NavbarProps {
  init: string;
}
function CustomNavbar({ init }: NavbarProps) {
  const AddToCartOption = useSelector(
    (state: StateInterface) => state.cart.AddToCartOption
  );
  const loginOpen = useSelector(
    (state: StateInterface) => state.homepage.loginOpen
  );
  const setLoginOpen = (e: boolean) => {
    window.history.pushState({ isPopup: true }, "open Login");
    dispatch({ type: "LOGIN-OPEN", payload: e });
  };

  const dispatch = useDispatch();

  usePrefetchLinks();
  const cartEnable = useSelector((state: StateInterface) => state.cart.enable);
  return (
    <>
      {!AddToCartOption.enable && !cartEnable && (
        <ToastContainer
          position="top-right"
          style={{ zIndex: "9999999999999999" }}
        />
      )}
      <Suspense fallback={<></>}>
        <InitFunction init={init} />
      </Suspense>
      <AuthSections />
      <div className="home-navbar max-h-[1365px]">
        <NextLink
          href={`/${init}`}
          aria-label="TryDos Home"
          data-cy="NavLogo"
          onClick={(e) => {
            dispatch({ type: "ENABLE-SEARCH", payload: false });
            dispatchRouteChangeEvent("start", { from: "", to: "HomePage" });
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
          }}
        >
          <Logo animated={false} style={false} key={1} />
        </NextLink>

        {
          <UserNavTopSection
            loginOpen={loginOpen}
            openLogin={(e) => setLoginOpen(e)}
          />
        }
      </div>
    </>
  );
}

export default CustomNavbar;
