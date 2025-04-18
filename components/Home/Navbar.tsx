"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import {
  changeAppCountry,
  changeAppLanguage,
  LogData,
} from "store/homepage/actions";
import { Category } from "models/Category";
import MobileNavigation from "./MobileNavigation";

import NextLink from "components/global/NextLink";
import { useSearchParams } from "next/navigation";

import AuthSections from "./AuthSections";
import { ToastContainer } from "react-toastify";
import { useAppStore } from "store";

interface NavbarProps {
  init: string;
  categories: Category[];
  response?: any;
}
function Navbar({ init, categories, response }: NavbarProps) {
  const {
    setEnableSearch,
    setLoginOpen,
    loginOpen,
    language,
    country,
    cart_enable,
  } = useAppStore();

  const setLoginOpenAction = (e: boolean) => {
    window.history.pushState({ isPopup: true }, "open Login");
    setLoginOpen(e);
  };
  const searchParams = useSearchParams();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    let countryCookies = Cookies.get("country");

    if (!searchParams.get("no-country"))
      Cookies.set("country", init.split("-")[0]?.toLowerCase(), {
        expires: 365,
      });

    changeAppLanguage(
      init.split("-")[1] ||
        languageCookies ||
        language ||
        process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE
    );

    let action = await changeAppCountry(
      init.split("-")[0] ||
        countryCookies ||
        country ||
        process.env.NEXT_PUBLIC_DEFAULT_COUNTRY
    );
  };
  useEffect(() => {
    LogData(response);
    initFunc();
  }, []);

  return (
    <>
      {!cart_enable && (
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
            setEnableSearch(false);
            // if(!showNavbar())
            // dispatchRouteChangeEvent("start", { to: "HomePage" });
            // document.documentElement.style.overflow = "hidden";
            // document.documentElement.scrollTop = 0;
          }}
        >
          <Logo animated={false} style={false} key={1} />
        </NextLink>
        {/* {showNavbar() && (
          <CategoriesBar categories={categories} key={2} forMobile={false} />
        )} */}
        {
          <UserNavTopSection
            loginOpen={loginOpen}
            openLogin={(e) => setLoginOpenAction(e)}
          />
        }
      </div>
      {<MobileNavigation categories={categories} />}
    </>
  );
}

export default Navbar;
