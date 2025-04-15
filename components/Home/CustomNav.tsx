"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppCountry, changeAppLanguage } from "store/homepage/actions";
import NextLink from "components/global/NextLink";

import { dispatchRouteChangeEvent } from "utils/events";
import { ToastContainer } from "react-toastify";
import AuthSections from "./AuthSections";
import { useRouter, useSearchParams } from "next/navigation";

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
  const language = useSelector(
    (state: StateInterface) => state.homepage.language
  );
  const country = useSelector(
    (state: StateInterface) => state.homepage.country
  );
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    let countryCookies = Cookies.get("country");
    if (!searchParams.get("no-country"))
      // Cookies.set("country", init.split("-")[0]?.toLowerCase(), {
      //   expires: 365,
      // });
      dispatch(
        changeAppLanguage(
          init.split("-")[1] ||
            languageCookies ||
            language ||
            process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
        )
      );
    let action = await changeAppCountry(
      init.split("-")[0] ||
        countryCookies ||
        country ||
        process.env.NEXT_PUBLIC_DEFAULT_COUNTRY
    );
    dispatch(action);
  };
  useEffect(() => {
    initFunc();
  }, []);
  const cartEnable = useSelector((state: StateInterface) => state.cart.enable);
  return (
    <>
      {!AddToCartOption.enable && !cartEnable && (
        <ToastContainer
          position="top-right"
          style={{ zIndex: "9999999999999999" }}
        />
      )}
      <AuthSections />
      <div className="home-navbar">
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
