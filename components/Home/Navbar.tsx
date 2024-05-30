"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
import { Category } from "models/Category";
import CategoriesBar from "./CategoriesBar";
import MobileNavigation from "./MobileNavigation";
import dynamic from "next/dynamic";
import NextLink from "Hooks/NextLink";
const AuthSections = dynamic(() => import("./AuthSections"), { ssr: false });
interface NavbarProps {
  init: string;
  categories: Category[];
}
function Navbar({ init, categories }: NavbarProps) {
  const loginOpen = useSelector((state: any) => state.homepage.loginOpen);
  const setLoginOpen = (e: boolean) => {
    dispatch({ type: "LOGIN-OPEN", payload: e });
  };
  const language = useSelector((state: any) => state.homepage.language);
  const dispatch = useDispatch();
  const initFunc = async () => {
    const Cookies = (await import("js-cookie")).default;
    let languageCookies = Cookies.get("language");
    Cookies.set("country", init.split("-")[0]);
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
    initFunc();
  }, []);
  return (
    <>
      <AuthSections />
      <div className="home-navbar">
        <NextLink href={"/"} aria-label="TryDos Home">
          <Logo animated={false} style={false} key={1} />
        </NextLink>
        {<CategoriesBar categories={categories} key={2} forMobile={false} />}
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
