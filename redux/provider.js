"use client";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store";
import TranslationsMenu from '../components/global/TranslationsMenu'
import Navbar from '../components/Home/Navbar'
import ChatModal from '../components/Chat/ChatModal'
import { useEffect, useState } from "react";
import { SSRDetect, getUserChat } from "../utils/functions";
import { SmartLookInit } from "../utils/constants";
import Smartlook from 'smartlook-client'
import { RegisterDevice, StopTracking, changeAppLanguage } from "./homepage/actions";
import { CheckLogin } from "./auth/actions";
import Cookies from "js-cookie"
export default function Providers({lang, children }) {
  const [country, language] = lang.split("-")
  const localeProps = {language, country}
  const [localization, setLocalization] = useState(localeProps);
  useEffect(() => {
      if (localization) {
          if (typeof window !== "undefined") {
              localStorage.setItem(
                  "localization",
                  JSON.stringify(localization)
              );
          }
          Cookies.set("language",localization.language);
          Cookies.set("country",localization.country);
         
      }
  }, [localization]);
  useEffect(()=>{
    if(SSRDetect()) 
    window.onbeforeunload=function(){
      StopTracking()
    }
    SmartLookInit()

    if(SSRDetect()&&getUserChat())
    Smartlook.identify(getUserChat().id,getUserChat())
  else
  SSRDetect()&&Smartlook.identify(parseInt(1000*Math.random()),{agent:window.navigator.userAgent})
    setTimeout(()=>{
      RegisterDevice()
      CheckLogin()
    },2000)
  },[])
  return <Provider store={store}>
    <div className='site-container'>
    <div className='home-page-container'>
    <TranslationsMenu init={lang} />
           <Navbar init={lang} />
           <ChatModal/>
      {children}
    </div>
    </div>
    </Provider>;
}