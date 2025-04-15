"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import {
  changeAppCountry,
  changeAppLanguage,
  LogData,
} from "store/homepage/actions";
import { Category } from "models/Category";
import MobileNavigation from "./MobileNavigation";
import CategoriesBar from "./CategoriesBar";
import NextLink from "components/global/NextLink";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import AuthSections from "./AuthSections";
import { ToastContainer } from "react-toastify";

interface NavbarProps {
  init: string;
  categories: Category[];
  response?: any;
}
function Navbar({ init, categories, response }: NavbarProps) {
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
  const dispatch = useDispatch();
  const params = usePathname();
  const searchParams = useSearchParams();
  const country = useSelector(
    (state: StateInterface) => state.homepage.country
  );
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    let countryCookies = Cookies.get("country");

    if (!searchParams.get("no-country"))
      Cookies.set("country", init.split("-")[0]?.toLowerCase(), {
        expires: 365,
      });
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
    LogData(response);
    initFunc();
  }, []);
  const cartEnable = useSelector((state: StateInterface) => state.cart.enable);

  return (
    <>
      {!cartEnable && (
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
            openLogin={(e) => setLoginOpen(e)}
          />
        }
      </div>
      {<MobileNavigation categories={categories} />}
    </>
  );
}

export default Navbar;
