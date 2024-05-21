"use client";
import { Provider } from "react-redux";
import { store } from "./index";
import Navbar from "components/Home/Navbar";
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  ssr: false,
});
const TranslationsMenu = dynamic(
  () => import("components/global/TranslationsMenu"),
  {
    ssr: false,
  }
);
import { useEffect } from "react";
import HomeService from "services/home";
import GAComponent from "components/global/GAComponent";
import dynamic from "next/dynamic";
import { SSRDetect } from "utils/functions";
import LandingPage from "components/Home/LandingPage";
import NewLoginWidget from "components/Login/NewLoginWidget";
export default function Providers({ lang, children }) {
  var bool = true;

  useEffect(() => {
    if (bool) {
      bool = false;
      setTimeout(() => {
        HomeService.RegisterDevice();
        HomeService.CheckLogin();
      }, 2000);
    }
  }, []);
  return (
    <>
      {SSRDetect() && <GAComponent />}
      <Provider store={store}>
        <div className="site-container bg-neutral-50 flex justify-around min-w-[100vw] min-h-full h-full">
          <div className="home-page-container">
            {<NewLoginWidget />}

            <TranslationsMenu init={lang} />
            <Navbar init={lang} />
            {<ChatModal />}
            {children}
          </div>
        </div>
      </Provider>
    </>
  );
}
