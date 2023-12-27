"use client";
import { Provider } from "react-redux";
import { store } from "./store";
import TranslationsMenu from '../components/global/TranslationsMenu'
import Navbar from '../components/Home/Navbar'
import ChatModal from '../components/Chat/ChatModal'
import { useEffect } from "react";
import { SSRDetect, getUserChat } from "../utils/functions";
import { SmartLookInit } from "../utils/constants";
import Smartlook from 'smartlook-client'
import { RegisterDevice, StopTracking } from "./homepage/actions";
import { CheckLogin } from "./auth/actions";
export default function Providers({ children }) {
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
    <TranslationsMenu/>
           <Navbar/>
           <ChatModal/>
      {children}
    </div>
    </div>
    </Provider>;
}