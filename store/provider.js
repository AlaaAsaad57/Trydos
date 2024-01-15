"use client";
import { Provider } from "react-redux";
import { index } from "./index";
import TranslationsMenu from "components/global/TranslationsMenu";
import Navbar from "components/Home/Navbar";
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  ssr: false,
});
import { useEffect, useState } from "react";
import { SSRDetect, getUserChat } from "utils/functions";
import {
  RegisterDevice,
  StopTracking,
  changeAppLanguage,
} from "./homepage/actions";
import { CheckLogin } from "./auth/actions";
import Cookies from "js-cookie";
import GAComponent from "components/global/GAComponent";
import dynamic from "next/dynamic";
export default function Providers({ lang, children }) {
  const [country, language] = lang.split("-");
  const localeProps = { language, country };
  const [localization, setLocalization] = useState(localeProps);
  useEffect(() => {
    if (localization) {
      if (typeof window !== "undefined") {
        localStorage.setItem("localization", JSON.stringify(localization));
      }
      Cookies.set("language", localization.language);
      Cookies.set("country", localization.country);
    }
  }, [localization]);
  useEffect(() => {
    setTimeout(() => {
      window.gtag("set", "user_properties", {
        is_logged_in: Boolean(getUserChat()),
        prefered_language: Cookies.get("language"),
      });
    }, 2000);
    setTimeout(() => {
      RegisterDevice();
      CheckLogin();
    }, 2000);
  }, []);
  return (
    <>
      {SSRDetect() && <GAComponent />}
      <Provider store={index}>
        <div className="site-container">
          <div className="home-page-container">
            <TranslationsMenu init={lang} />
            <Navbar init={lang} />
            <ChatModal />
            {children}
          </div>
        </div>
      </Provider>
    </>
  );
}
