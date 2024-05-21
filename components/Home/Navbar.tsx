"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
import dynamic from "next/dynamic";
const CategoriesBar = dynamic(() => import("./CategoriesBar"), { ssr: true });
const MobileNavigation = dynamic(() => import("./MobileNavigation"), {
  ssr: true,
});
interface NavbarProps {
  init: string;
}
function Navbar({ init }: NavbarProps) {
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
      <div className="home-navbar">
        <Logo animated={false} style={false} key={1} />
        {<CategoriesBar key={2} forMobile={false} />}
        {
          <UserNavTopSection
            loginOpen={loginOpen}
            openLogin={(e) => setLoginOpen(e)}
          />
        }
      </div>
      {<MobileNavigation />}
    </>
  );
}

export default Navbar;
