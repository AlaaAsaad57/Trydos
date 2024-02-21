"use client";
import { Provider } from "react-redux";
import { store } from "./index";
import TranslationsMenu from "components/global/TranslationsMenu";
import Navbar from "components/Home/Navbar";
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  ssr: false,
});
import { useEffect } from "react";
import { getUserChat } from "utils/functions";
import { RegisterDevice } from "./homepage/actions";
import { CheckLogin } from "./auth/actions";
import Cookies from "js-cookie";
// import GAComponent from "components/global/GAComponent";
import dynamic from "next/dynamic";
export default function Providers({ lang, children }) {
  var bool = true;
  useEffect(() => {
    if (bool) {
      bool = false;
      setTimeout(() => {
        window?.gtag("set", "user_properties", {
          is_logged_in: Boolean(getUserChat()),
          prefered_language: Cookies.get("language"),
        });
      }, 2000);
      setTimeout(() => {
        RegisterDevice();
        CheckLogin();
      }, 2000);
    }
  }, []);
  return (
    <>
      {/* {SSRDetect() && <GAComponent />} */}
      <Provider store={store}>
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
