"use client";
import { useEffect } from "react";
import Logo from "./Logo";
import UserNavTopSection from "./UserNavTopSection";
import { useDispatch, useSelector } from "react-redux";
import { changeAppLanguage } from "store/homepage/actions";
import dynamic from "next/dynamic";
import NextLink from "Hooks/NextLink";
import { usePathname } from "next/navigation";
import { dispatchRouteChangeEvent } from "Hooks/events";
const AuthSections = dynamic(() => import("./AuthSections"), { ssr: false });
interface NavbarProps {
  init: string;
}
function CustomNavbar({ init }: NavbarProps) {
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
        <NextLink
          href={"/"}
          aria-label="TryDos Home"
          onClick={(e) => {
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
