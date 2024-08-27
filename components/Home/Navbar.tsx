"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage, LogData } from "store/homepage/actions";
import { Category } from "models/Category";
import CategoriesBar from "./CategoriesBar";
import MobileNavigation from "./MobileNavigation";
import NextLink from "Hooks/NextLink";
import { usePathname } from "next/navigation";

import AuthSections from "./AuthSections";
import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";

interface NavbarProps {
  init: string;
  categories: Category[];
  response?: any;
}
function Navbar({ init, categories, response }: NavbarProps) {
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  const setLoginOpen = (e: boolean) => {
    dispatch({ type: "LOGIN-OPEN", payload: e });
  };
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  const params = usePathname();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    Cookies.set("country", init.split("-")[0], {
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
  };
  useEffect(() => {
    LogData(response);
    initFunc();
  }, []);
  const showNavbar = () => {
    if (
      params.split("/").includes("boutiques") ||
      params.split("/").includes("products")
    ) {
      return false;
    }
    if (
      (params.split("/").includes("categories") &&
        !params.split("/").includes("boutiques")) ||
      (!params.split("/").includes("categories") &&
        !params.split("/").includes("boutiques"))
    ) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        style={{ zIndex: "9999999999999999" }}
      />
      <AuthSections />
      <div className="home-navbar">
        <NextLink
          href={"/"}
          aria-label="TryDos Home"
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
        {showNavbar() && (
          <CategoriesBar categories={categories} key={2} forMobile={false} />
        )}
        {
          <UserNavTopSection
            loginOpen={loginOpen}
            openLogin={(e) => setLoginOpen(e)}
          />
        }
      </div>
      {showNavbar() && <MobileNavigation categories={categories} />}
    </>
  );
}

export default Navbar;
