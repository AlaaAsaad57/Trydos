"use client";
import { Suspense } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import NextLink from "components/global/NextLink";
import { dispatchRouteChangeEvent } from "utils/events";
import { ToastContainer } from "react-toastify";
import AuthSections from "./AuthSections";
import InitFunction from "./InitFunction";
import { usePrefetchLinks } from "hooks/usePrefetchHook";
import { useAppStore } from "store";

interface NavbarProps {
  init: string;
}
function CustomNavbar({ init }: NavbarProps) {
  const {
    setEnableSearch,
    setLoginOpen,
    AddToCartOption,
    loginOpen,
    cart_enable,
  } = useAppStore();

  const setLoginOpenAction = (e: boolean) => {
    window.history.pushState({ isPopup: true }, "open Login");
    setLoginOpen(e);
  };

  usePrefetchLinks();

  return (
    <>
      {!AddToCartOption.enable && !cart_enable && (
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
            setEnableSearch(false);
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
            openLogin={(e) => setLoginOpenAction(e)}
          />
        }
      </div>
    </>
  );
}

export default CustomNavbar;
